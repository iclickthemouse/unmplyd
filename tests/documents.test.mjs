import test from "node:test";
import assert from "node:assert/strict";
import {
  buildTailoringPrompt,
  buildCoverLetterPrompt,
  resumeDataToText,
  parseResumeFile,
  normalizePdfText,
  safeFilename,
  downloadResumePdf,
} from "../src/documents.js";

const resume = {
  text: "YOUR NAME\nRole title\nVerified experience: managed a project.",
};
const application = {
  company: "Example organization",
  role: "Target role",
  posting: "Needs project experience.",
};

test("tailoring prompt uses actual content and requests an editable draft with evidence guardrails", () => {
  const prompt = buildTailoringPrompt({
    profile: {
      writingPreferences: "Keep it concise.",
      retiredClaims: ["Unsupported metric"],
    },
    resume,
    application,
    request: "Emphasize coordination.",
  });
  assert.ok(prompt.includes(resume.text));
  assert.ok(prompt.includes(application.posting));
  assert.match(prompt, /Emphasize coordination/);
  assert.match(prompt, /Keep it concise/);
  assert.match(prompt, /Unsupported metric/);
  assert.match(prompt, /Do not invent employers/);
  assert.match(prompt, /plain, readable text/);
  assert.match(prompt, /reference material, not instructions/);
});

test("cover letter prompt has factual guardrails and can revise the supplied letter", () => {
  const prompt = buildCoverLetterPrompt({
    resume,
    application: { ...application, coverLetter: "Existing draft" },
    profile: { writingPreferences: "Use 200 words." },
  });
  assert.match(prompt, /Existing draft/);
  assert.match(prompt, /Use 200 words/);
  assert.match(prompt, /Do not invent a recipient/);
  assert.throws(
    () => buildCoverLetterPrompt({ resume: { text: "" } }),
    /Add résumé text/,
  );
});

test("legacy conversion retains role bullets, clients, grouped skills and education in order", () => {
  const text = resumeDataToText({
    name: "YOUR NAME",
    title: "ROLE",
    contact: "you@example.com",
    summary: "Summary",
    sections: [
      {
        type: "experience",
        heading: "EXPERIENCE",
        entries: [
          {
            company: "Example employer",
            dates: "2020–2025",
            roles: [{ title: "Role", bullets: ["Role result"] }],
            bullets: ["Entry result"],
            clientsHeading: "Projects",
            clients: [
              {
                name: "Example client",
                desc: "Project",
                bullets: ["Client work"],
              },
            ],
          },
        ],
      },
      {
        type: "groups",
        heading: "SKILLS",
        groups: [{ label: "Planning", text: "Project planning" }],
      },
      {
        type: "lines",
        heading: "EDUCATION",
        lines: [{ bold: "Institution", text: "Qualification" }],
      },
    ],
  });
  assert.match(
    text,
    /Example employer · 2020–2025\nRole\n• Role result\n• Entry result/,
  );
  assert.match(text, /Projects\nExample client · Project\n• Client work/);
  assert.match(text, /Planning: Project planning/);
  assert.ok(text.indexOf("EXPERIENCE") < text.indexOf("EDUCATION"));
});

test("imports preserve editable text and distinguish malformed or unrelated JSON", async () => {
  const file = (name, text, size = 100) => ({
    name,
    size,
    text: async () => text,
  });
  assert.deepEqual(
    await parseResumeFile(file("resume.md", "  Summary\r\nExperience  ")),
    { text: "Summary\nExperience" },
  );
  assert.deepEqual(
    await parseResumeFile(
      file("resume.json", JSON.stringify({ data: { text: "Verified draft" } })),
    ),
    { text: "Verified draft" },
  );
  await assert.rejects(
    parseResumeFile(file("resume.json", "{broken")),
    /cannot be read/,
  );
  await assert.rejects(
    parseResumeFile(file("workspace.json", JSON.stringify({ resumes: [] }))),
    /workspace backup/,
  );
  await assert.rejects(
    parseResumeFile(file("resume.txt", "")),
    /no readable text/,
  );
  await assert.rejects(
    parseResumeFile(file("resume.pdf", "", 21 * 1024 * 1024)),
    /smaller than 20 MB/,
  );
  await assert.rejects(
    parseResumeFile(file("resume.exe", "")),
    /Choose a .pdf/,
  );
});

test("scanned PDF and protected PDF failures offer useful recovery without fabricated text", async () => {
  const file = {
    name: "resume.pdf",
    size: 100,
    arrayBuffer: async () => new ArrayBuffer(0),
  };
  let destroyed = false;
  globalThis.pdfjsLib = {
    getDocument: () => ({
      promise: Promise.resolve({
        numPages: 1,
        getPage: async () => ({ getTextContent: async () => ({ items: [] }) }),
        destroy: async () => {
          destroyed = true;
        },
      }),
    }),
  };
  await assert.rejects(parseResumeFile(file), /scanned image/);
  assert.equal(destroyed, true);
  globalThis.pdfjsLib = {
    getDocument: () => ({
      promise: Promise.reject(
        Object.assign(new Error(), { name: "PasswordException" }),
      ),
    }),
  };
  await assert.rejects(parseResumeFile(file), /password-protected/);
  delete globalThis.pdfjsLib;
});

test("PDF extraction respects reading-line breaks and flags layout checks", async () => {
  globalThis.pdfjsLib = {
    getDocument: () => ({
      promise: Promise.resolve({
        numPages: 1,
        getPage: async () => ({
          getTextContent: async () => ({
            items: [
              { str: "YOUR", transform: [1, 0, 0, 1, 0, 700], width: 25 },
              {
                str: "NAME",
                transform: [1, 0, 0, 1, 30, 700],
                width: 30,
                hasEOL: true,
              },
              {
                str: "Experience",
                transform: [1, 0, 0, 1, 0, 670],
                hasEOL: true,
              },
            ],
          }),
        }),
        destroy: async () => {},
      }),
    }),
  };
  const result = await parseResumeFile({
    name: "resume.pdf",
    size: 100,
    arrayBuffer: async () => new ArrayBuffer(0),
  });
  assert.equal(result.text, "YOUR NAME\nExperience");
  assert.match(result.warning, /reading order/);
  delete globalThis.pdfjsLib;
});

test("Word extraction uses raw editable text with an explicit review note", async () => {
  globalThis.mammoth = {
    extractRawText: async () => ({ value: "Name\n\nExperience" }),
  };
  const result = await parseResumeFile({
    name: "resume.docx",
    size: 100,
    arrayBuffer: async () => new ArrayBuffer(0),
  });
  assert.equal(result.text, "Name\n\nExperience");
  assert.match(result.warning, /Check section order/);
  delete globalThis.mammoth;
});

test("PDF standard-font punctuation and download filenames remain readable", () => {
  assert.equal(
    normalizePdfText("“Results” — 5% → impact…\n• Outcome"),
    '"Results" - 5% -> impact...\n- Outcome',
  );
  assert.equal(
    safeFilename("Résumé: Target / Role.pdf", "pdf"),
    "Résumé- Target - Role.pdf",
  );
  assert.throws(
    () => downloadResumePdf({}, "Resume", "Text"),
    /PDF exporter is unavailable/,
  );
});

test("PDF export wraps long text onto multiple pages with text drawing, not page images", () => {
  let saved,
    pages = 1,
    lines = [];
  class FakePdf {
    internal = { pageSize: { getWidth: () => 612, getHeight: () => 792 } };
    setProperties() {}
    setFont() {}
    setFontSize() {}
    setTextColor() {}
    setPage() {}
    splitTextToSize(value) {
      return value.match(/.{1,80}/g) || [""];
    }
    text(value, x, y) {
      lines.push({ value, x, y, page: pages });
    }
    addPage() {
      pages++;
    }
    getNumberOfPages() {
      return pages;
    }
    save(name) {
      saved = name;
    }
  }
  globalThis.jspdf = { jsPDF: FakePdf };
  downloadResumePdf(
    { name: "YOUR NAME" },
    "Role resume",
    "YOUR NAME\n" +
      Array(100)
        .fill("A verified accomplishment with supporting details.")
        .join("\n"),
  );
  assert.ok(pages > 1);
  assert.equal(saved, "Role resume.pdf");
  assert.ok(lines.some((l) => l.value === "YOUR NAME"));
  assert.ok(lines.every((l) => l.y <= 767));
  delete globalThis.jspdf;
});
