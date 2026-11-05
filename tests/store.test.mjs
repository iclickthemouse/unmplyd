import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
// Import without imposing a package.json or module mode on the rest of the repo.
const source = await readFile(
  new URL("../src/store.js", import.meta.url),
  "utf8",
);
const store = await import(
  "data:text/javascript;base64," + Buffer.from(source).toString("base64")
);
const storage = (initial) => {
  const map = new Map(Object.entries(initial || {}));
  return {
    get length() {
      return map.size;
    },
    key: (i) => [...map.keys()][i],
    getItem: (key) => map.get(key) ?? null,
    setItem: (key, value) => map.set(key, value),
  };
};

test("save/load preserves extra fields and rejects corrupt/future states without replacing them", () => {
  const saved = storage(),
    state = store.createEmptyState();
  state.custom = { keep: true };
  store.saveState(state, saved);
  assert.deepEqual(store.loadState(saved).custom, { keep: true });
  saved.setItem(store.STATE_KEY, "{bad");
  assert.throws(() => store.loadState(saved), /preserved/);
  assert.equal(saved.getItem(store.STATE_KEY), "{bad");
  saved.setItem(
    store.STATE_KEY,
    JSON.stringify({ ...state, schemaVersion: 99 }),
  );
  assert.throws(() => store.loadState(saved), /supported/);
});

test("saving reports quota errors and does not claim a successful update", () => {
  const state = store.createEmptyState(),
    before = state.updatedAt;
  assert.throws(
    () =>
      store.saveState(state, {
        setItem() {
          throw Error("full");
        },
      }),
    /could not be saved/,
  );
  assert.equal(state.updatedAt, before);
});

test("legacy migration keeps all raw collections, exact résumé versions, and application packets", () => {
  const original = {
    name: "APPLICANT",
    title: "PROFESSIONAL TITLE",
    contact: "applicant@private.invalid",
    summary: "Original summary",
    sections: [],
  };
  const saved = storage({
    "unmplyd:c:resumes": JSON.stringify({
      base: { title: "Base", data: original, savedAt: "2026-01-01" },
    }),
    "unmplyd:c:resumes/base/versions": JSON.stringify({
      v1: { data: { ...original, summary: "Earlier" }, at: "2025-01-01" },
    }),
    "unmplyd:c:applications": JSON.stringify({
      "a-example-role": {
        company: "Example organization",
        role: "Target role",
        status: "Applied",
        resumeId: "base",
        coverLetter: "Draft",
      },
    }),
    "unmplyd:c:applications/a-example-role/versions": JSON.stringify({
      p1: { resume: original, coverLetter: "Sent letter", at: "2026-01-01" },
    }),
    "unmplyd:c:unknown": JSON.stringify({ custom: { preserve: "yes" } }),
  });
  const state = store.loadState(saved);
  assert.equal(state.onboardingComplete, true);
  assert.match(state.resumes[0].versions[0].text, /Earlier/);
  assert.equal(state.applications[0].packets[0].coverLetter, "Sent letter");
  assert.deepEqual(state.legacy.collections.unknown, {
    custom: { preserve: "yes" },
  });
  assert.equal(
    saved.getItem("unmplyd:c:resumes"),
    JSON.stringify({
      base: { title: "Base", data: original, savedAt: "2026-01-01" },
    }),
  );
});

test("pure legacy demos remain archived without counting as active user work", () => {
  const saved = storage({
    "unmplyd:c:resumes": JSON.stringify({
      base: {
        title: "Base",
        data: { name: "YOUR NAME", contact: "you@example.com", sections: [] },
      },
    }),
    "unmplyd:c:applications": JSON.stringify({
      "a-example-role": {
        company: "Example organization",
        role: "Target role",
        status: "Lead",
      },
    }),
  });
  const state = store.loadState(saved);
  assert.equal(state.onboardingComplete, false);
  assert.equal(state.applications.length, 0);
  assert.equal(state.resumes.length, 0);
  assert.equal(
    state.legacy.collections.applications["a-example-role"].company,
    "Example organization",
  );
});

test("legacy config retains track labels, retired claims and source links", () => {
  const saved = storage({
    "unmplyd:c:applications": JSON.stringify({
      custom: { company: "Organization", role: "Role", status: "Applied" },
    }),
    "unmplyd:config": JSON.stringify({
      owner: "APPLICANT",
      tracks: [{ id: "one", label: "Primary" }],
      retiredClaims: ["unsupported claim"],
      quickLinks: [{ url: "https://example.com" }],
    }),
  });
  const state = store.loadState(saved);
  assert.equal(
    state.profile.tracks.find((t) => t.id === "one").label,
    "Primary",
  );
  assert.deepEqual(state.profile.retiredClaims, ["unsupported claim"]);
  assert.equal(state.profile.quickLinks[0].url, "https://example.com");
});

test("versions and application packets are detached from future edits and keep file references", () => {
  const state = store.createEmptyState(),
    resume = { id: "r1", title: "Base", text: "Original résumé", versions: [] };
  state.resumes.push(resume);
  const version = store.snapshotResume(resume, "Original");
  const app = {
    id: "a1",
    company: "Example",
    role: "Role",
    status: "Drafted",
    resumeId: "r1",
    coverLetter: "Original letter",
    attachments: [{ id: "f1" }],
    packets: [],
  };
  state.applications.push(app);
  const packet = store.createPacket(state, "a1");
  resume.text = "Changed";
  app.coverLetter = "Changed";
  version.text = "External change";
  packet.coverLetter = "External change";
  assert.equal(app.packets[0].resume.text, "Original résumé");
  assert.equal(app.packets[0].coverLetter, "Original letter");
  assert.equal(resume.versions[0].text, "Original résumé");
  assert.deepEqual(app.packets[0].attachmentIds, ["f1"]);
});

test("backup import merges changed ID collisions and correctly remaps associations", async () => {
  const current = store.createEmptyState();
  current.resumes.push({
    id: "r1",
    title: "Current",
    text: "Keep me",
    versions: [],
  });
  current.applications.push({
    id: "a1",
    company: "Current",
    role: "Role",
    status: "Applied",
    resumeId: "r1",
    packets: [],
    attachments: [],
  });
  const incoming = store.createEmptyState();
  incoming.resumes.push({
    id: "r1",
    title: "Imported",
    text: "Import me",
    versions: [],
  });
  incoming.applications.push({
    id: "a1",
    company: "Imported",
    role: "Role",
    status: "Drafted",
    resumeId: "r1",
    packets: [
      {
        id: "p1",
        resume: { id: "r1", text: "Exact sent text" },
        attachmentIds: [],
      },
    ],
    attachments: [],
  });
  incoming.tasks.push({ id: "t1", text: "Follow up", applicationId: "a1" });
  const merged = await store.importBackup(
    { format: "unmplyd-backup", version: 3, state: incoming, files: [] },
    current,
  );
  assert.equal(merged.resumes[0].text, "Keep me");
  assert.equal(merged.resumes.length, 2);
  assert.equal(merged.applications.length, 2);
  assert.equal(merged.applications[1].resumeId, merged.resumes[1].id);
  assert.equal(merged.tasks[0].applicationId, merged.applications[1].id);
  assert.equal(
    merged.applications[1].packets[0].resume.text,
    "Exact sent text",
  );
  assert.equal(current.resumes.length, 1);
});

test("invalid backup metadata or file bytes are rejected before writes", async () => {
  const state = store.createEmptyState();
  await assert.rejects(
    store.importBackup({
      format: "unmplyd-backup",
      version: 3,
      state,
      files: [
        { id: "f", name: "a", type: "text/plain", size: 1, data: "invalid!" },
      ],
    }),
    /invalid data/,
  );
  await assert.rejects(
    store.importBackup({
      format: "unmplyd-backup",
      version: 3,
      state: {
        ...state,
        applications: [{ id: "a", company: "x", role: "y", status: "unknown" }],
      },
      files: [],
    }),
    /status/,
  );
  await assert.rejects(
    store.importBackup({ format: "other", version: 3, state, files: [] }),
    /complete/,
  );
});

test("complete backups refuse missing file bytes instead of silently losing packet attachments", async () => {
  const state = store.createEmptyState();
  state.applications.push({
    id: "a1",
    company: "Organization",
    role: "Role",
    status: "Applied",
    packets: [{ id: "p1", resume: null, attachmentIds: ["missing-file"] }],
    attachments: [],
  });
  await assert.rejects(store.exportBackup(state), /original file is missing/);
  await assert.rejects(
    store.importBackup({
      format: "unmplyd-backup",
      version: 3,
      state,
      files: [],
    }),
    /missing an attached file/,
  );
});

test("packets reject unknown file IDs, malformed snapshot dates, and invalid text types", () => {
  const state = store.createEmptyState();
  state.applications.push({
    id: "a1",
    company: "Organization",
    role: "Role",
    status: "Drafted",
    coverLetter: "Letter",
    packets: [],
    attachments: [],
  });
  assert.throws(
    () => store.createPacket(state, "a1", { attachmentIds: ["not-attached"] }),
    /not attached/,
  );
  assert.equal(state.applications[0].packets.length, 0);
  const packet = store.createPacket(state, "a1");
  assert.ok(packet.at);
  state.applications[0].packets[0].at = "2026-02-31T12:00:00Z";
  assert.throws(() => store.validateState(state), /packet date/);
  state.applications[0].packets[0].at = "2026-02-28T12:00:00Z";
  state.applications[0].packets[0].coverLetter = { text: "Bad shape" };
  assert.throws(() => store.validateState(state), /packet coverLetter/);
});

test("metadata-only backups round-trip without multiplying identical records", async () => {
  const state = store.createEmptyState();
  state.resumes.push({ id: "r1", title: "Base", text: "Facts", versions: [] });
  const backup = await store.exportBackup(state),
    merged = await store.importBackup(backup, state);
  assert.equal(merged.resumes.length, 1);
  assert.equal(backup.state.resumes[0].text, "Facts");
  state.resumes[0].text = "Later";
  assert.equal(backup.state.resumes[0].text, "Facts");
});
