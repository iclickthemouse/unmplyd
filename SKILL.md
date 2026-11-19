---
name: unmplyd
description: Builds bespoke, designed résumés that can be edited right on the page and keeps track of every version, with clean PDF export. Use when someone wants a designed résumé they can edit in a browser, a tailored copy for one kind of role or one job, a record of their résumé versions, or a recreation of the unmplyd résumé editor.
---

# unmplyd: bespoke résumés, kept track of

unmplyd is a single HTML file. It shows a résumé as a designed page that you edit by clicking on the text. It keeps a library of résumés (current, drafts, older) with version history, and exports a text-based PDF that applicant-tracking systems can read.

Use this skill in one of three ways:

- **A. Use the app.** If you can get `index.html` from the unmplyd repository, give the person that file and an import file made from their résumé (step 2). That's the fastest route.
- **B. Recreate the app.** If you can't get the repository, build the single file from the spec below. The result should look and behave the same.
- **C. Files only.** If the person just wants résumé files, make the designed résumé as HTML and PDF from the same spec, and track versions with the folder layout at the end.

## 1. Get the résumé into the Résumé format

Ask for their current résumé, pasted or as a file. Convert it into this JSON, **copying the wording exactly**. Change structure, never content.

```json
{
  "name": "ALEX RIVERA",
  "title": "OPERATIONS MANAGER",
  "contact": "Chicago, IL · alex@example.com · (555) 010-0199 · alexrivera.example",
  "summary": "Two or three sentences.",
  "sections": [
    { "type": "experience", "heading": "EXPERIENCE", "entries": [
      { "company": "Meridian Clinics", "note": "12 locations", "dates": "Mar 2022 – Present",
        "roles": [ { "title": "Operations Manager", "dates": "", "bullets": ["…"] } ],
        "bullets": [] } ] },
    { "type": "groups", "heading": "CAPABILITIES", "groups": [ { "label": "Operations", "text": "Process improvement / Budgeting / KPIs" } ] },
    { "type": "lines",  "heading": "EDUCATION",    "lines":  [ { "bold": "State University", "text": "B.S., Business Administration" } ] }
  ]
}
```

- `experience`: one entry per employer, one role per job title, and bullets under the role they belong to. Use a role's `dates` only when an employer has several roles. The optional `note` is a short aside shown after the company name.
- `groups`: label and text pairs, such as skills by area. Separate items with ` / `.
- `lines`: short items such as education, certifications or awards.
- Write the name, headline and section headings in capitals. Join the contact details with ` · `.
- Optional extras on an entry: `italic` (one line under the company) and `clientsHeading` with `clients: [{name, desc, bullets}]`, for consultants and freelancers.

## 2. Make the import file (for route A)

The app keeps its data in the browser and imports a backup file with this shape. Save it as `unmplyd-backup.json`, and tell the person to click **Import backup** in the app:

```json
{
  "app": "unmplyd", "version": 2,
  "resumes": [
    { "id": "r-main", "title": "Operations", "target": "Operations manager roles", "status": "current",
      "notes": "", "accent": "#003FCC", "data": RESUME, "savedAt": "ISO-8601", "created": "ISO-8601" }
  ],
  "versions": []
}
```

`status` is `current` (the one to send), `draft` or `older`. `accent` is one of `#003FCC` (blue), `#141414` (ink), `#1D6B45` (forest), `#A3242A` (crimson), `#5B3CC4` (violet) or `#A85700` (amber).

## 3. The design (for routes B and C)

Everything uses **JetBrains Mono** (weights 400, 500 and 700). The résumé sits on a white "paper": at most 8.5in wide, padded 48px top, 52px sides and 56px bottom, with a 1px border in `#D8D8D4` and a soft drop shadow. Text is 12.5px with 1.55 line height.

Paper colors: ink `#141414`, body `#333331`, muted `#5E5E5B`, rules `#D8D8D4`, and the accent (default `#003FCC`).

From top to bottom:

1. **Name**: centered, 26px, bold, letter-spacing 0.2em, ink.
2. **Accent bar**: centered, 90 × 2px, 6px above and 8px below.
3. **Headline**: centered, 12px, weight 500, letter-spacing 0.22em, ink.
4. **Contact line**: centered, 11.5px, muted.
5. **Summary**: a 3px accent bar on the left, 12px padding, 20px above.
6. **Section heading**: a row with the section number (`01`, `02` and so on, bold, in the accent color), the heading (13px, bold, letter-spacing 0.16em, ink), and then a 1px rule filling the rest of the line. 22px above, 10px below.
7. **Experience entry**: one row with the company (bold, capitals, letter-spacing 0.08em, ink), the note (italic, 11.5px, muted), and the dates pushed right (11.5px, muted, tabular figures). Under it, each role title in the accent color, with its own dates on the right if it has any. Bullets use a 5 × 5px accent-colored square, 16px left padding and 3px spacing. Leave 14px between entries.
8. **Groups**: the label in bold ink on one line, the text under it, and 10px between groups.
9. **Lines**: the bold part in ink, then ` — ` and the detail.

The app around the paper follows the same system. The background is `#FAFAF8`, surfaces are white, and the accent `#003FCC` is used for buttons and links. The masthead has a faint 48px grid with a large letter-spaced title, a short accent bar under it, and a strip of four stats. Buttons are 12px bold with 2px corners. Status chips are small capitals on tinted backgrounds: current in green, draft in amber, older in grey. Support dark mode for the app, but keep the paper white in both themes, because it represents print.

## 4. Behavior (route B)

- **Library**: cards for `current` résumés, each showing its target, status chip, last-updated date, title, headline, notes, and the actions **Edit in the editor**, **Download PDF**, **Duplicate** and **Details** (name, what it's for, status, notes, delete). Drafts and older résumés are folded into an "Older versions & drafts" list underneath. **+ New résumé** starts from a copy of an existing one, a blank template, or pasted text.
- **Editor**: a tab for each résumé that isn't older. Every piece of text on the paper is `contenteditable` (use `plaintext-only` where supported) and writes back to its JSON path as you type. Enter in a bullet adds a new bullet below it. Backspace in an empty bullet removes it. Enter anywhere else leaves the field.
- **Edit layout** (a toggle): small buttons on the paper to add or remove a summary, sections (experience, skills or list), jobs, roles, bullets, groups and lines, and to move sections and jobs up or down. Removing a section or a job saves a version first.
- **History**: **Save version** with an optional note, plus a list of versions, each with Preview (read-only, with a bar to restore it or go back) and Restore (which saves the current state as a version first). Keep the last 40 versions for each résumé.
- **Accent**: a per-résumé color used on the paper and in the PDF.
- **Edit with AI**, which works with any assistant:
  1. The person writes a request, or picks a quick one: tighten bullets, stronger verbs, lead with results, shorter, or tailor to a pasted job posting.
  2. **Copy prompt** puts this on the clipboard: the request, the posting if there is one, the rules in section 6, and the résumé JSON.
  3. They paste the assistant's reply back into the app. The app pulls out the JSON (stripping code fences), checks that it has `sections`, and shows every changed field as old text crossed out next to the new text. It warns if any company name, date or job title changed.
  4. **Apply** saves a version first, then replaces the résumé. **Import from text** uses the same loop to turn pasted résumé text into JSON, with a preview of the rendered result before applying.
- **Storage**: save the whole state to `localStorage` (key `unmplyd:resumes:v1`), debounced by about half a second, and flush it when the page is hidden. Provide **Export backup** and **Import backup** using the JSON shape in step 2 plus `versions: [{id, resumeId, data, at, note}]`. Importing replaces everything, after a confirmation. On first run, load example data for a made-up person, with a "Start fresh" button.
- **Safety**: build every element with `textContent`, never `innerHTML`, for anything that came from the person or an AI reply.

## 5. PDF export

Use jsPDF 2.5.1 from `https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js`. Embed JetBrains Mono Regular and Bold from local TTF files. If they can't be fetched, fall back to Courier, which has the same 0.6em character width, so the layout still works.

- US Letter (612 × 792pt). Content runs from x=40 to x=572. Start at y=50, and start a new page when y would pass 758.
- Measure text as `characters × size × 0.6` and wrap by character count.
- **Name**: 22pt bold, centered, with 2pt character spacing. This is the only place to use character spacing, because spacing small text makes PDF text extract as "E X P E R I E N C E", which hurts parsing by applicant-tracking systems.
- **Accent bar**: 90 × 1.8pt, centered.
- **Headline**: 10pt bold, centered. **Contact line**: 9pt, muted, centered, wrapped if it's too long.
- **Summary**: 9.6pt with 13.2pt leading, indented 12pt, with a 2.6pt accent bar down the left.
- **Section heading**: the number in 10pt bold accent at x=40, the heading in 10.5pt bold ink at x=60, then a 0.6pt rule to the right margin.
- **Company**: 10.5pt bold, in capitals, with the note at 8.6pt muted and the dates right-aligned at 9pt muted. **Role**: 9.8pt in the accent color.
- **Bullets**: 9.2pt with 12.4pt leading, a 3 × 3pt accent square, and text at x=52.
- **Groups**: the label at 9.8pt bold, the text at 9.3pt. **Lines**: 9.4pt, with the bold part bold.
- Set the PDF's title and author metadata. Name the file `First_Last_Resume_<résumé name>.pdf`. Aim for one or two pages.

## 6. Rules for any AI edit

Put these in every prompt, and follow them yourself when you edit a résumé directly:

- Reply with only the complete résumé as JSON, in exactly the same structure and keys.
- Never invent employers, titles, dates, clients, tools, metrics or outcomes. Keep every existing number unless the request says to remove it.
- Keep company names, dates and role titles exactly as they are unless the request explicitly asks to change them.
- Bullets stay one or two lines and start with a strong verb, in the past tense for past roles and the present tense for current ones.
- When tailoring to a posting, reorder and reword for fit, and use the posting's terms only where they're true.
- Plain text only inside strings: no HTML and no Markdown.

## 7. Keeping track without the app (route C)

```
resumes/
  operations/
    resume.json         the current version (the Résumé format)
    resume.html         the designed page, built from section 3
    Alex_Rivera_Resume_Operations.pdf
    versions/
      2026-11-05_1430_before-tailoring.json
    notes.md            what it's for, status (current, draft or older), and where it was sent
  operations-supply-chain/   a tailored copy: start by copying the folder, then edit
```

- Never overwrite a version file. Before every change to `resume.json`, save the old one into `versions/` with a timestamp and a short note.
- When a résumé is replaced, set its status in `notes.md` to `older`. Don't delete it.
- To make a copy for one kind of role or one job, duplicate the folder, give it a descriptive name, and note in `notes.md` which résumé it came from.

## Done when

- The paper matches section 3, and editing, Enter, Backspace, Edit layout, History, Accent and the AI review loop all work.
- Changes survive a reload, and **Export backup** followed by **Import backup** gets everything back.
- The PDF downloads with embedded JetBrains Mono, its text extracts cleanly (no letter-spaced headings), and it's no more than two pages for a typical résumé.
- At 390px wide there's no horizontal scrolling.
