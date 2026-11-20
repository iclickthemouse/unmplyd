---
name: unmplyd
description: Builds bespoke résumés whose design is taken from the person's original résumé and standardized, so they can be edited right on the page, versioned, and exported as clean PDFs. Use when someone wants a designed résumé they can edit in a browser, a plain "Corpo slop" Times New Roman version, a tailored copy for one role, a record of their résumé versions, or a recreation of the unmplyd résumé editor.
---

# unmplyd: bespoke résumés, kept track of

unmplyd is a single HTML file. It shows a résumé as a designed page that you edit by clicking on the text. It keeps a library of résumés (current, drafts, older) with version history, and exports a text-based PDF that applicant-tracking systems can read.

Each résumé's look is **taken from the person's original résumé**, such as the fonts, the accent color, how the name is set, and any logo, **then standardized** into a fixed set of design options. Because of that standard set, the editor and the PDF can always render it. There are also two ready-made looks: **unmplyd** (the house style) and **Corpo slop** (plain Times New Roman).

Use this skill in one of three ways:

- **A. Use the app.** If you can get `index.html` from the unmplyd repository, give the person that file and an import file made from their résumé (steps 1 and 2). That's the fastest route.
- **B. Recreate the app.** If you can't get the repository, build the single file from the spec below. The result should look and behave the same.
- **C. Files only.** If the person just wants résumé files, make the designed résumé as HTML and PDF from the same spec, and track versions with the folder layout at the end.

## 1. Read the original résumé: content and design

Ask for their current résumé, ideally the original file (PDF, Word or a screenshot), not just pasted text. From it, produce two things.

**The content**, as Résumé JSON. **Copy the wording exactly.** Change the structure, never the content.

```json
{
  "name": "Alex Rivera",
  "title": "Operations Manager",
  "contact": "Chicago, IL · alex@example.com · (555) 010-0199 · alexrivera.example",
  "summary": "Two or three sentences.",
  "sections": [
    { "type": "experience", "heading": "Experience", "entries": [
      { "company": "Meridian Clinics", "note": "12 locations", "dates": "Mar 2022 – Present",
        "roles": [ { "title": "Operations Manager", "dates": "", "bullets": ["…"] } ],
        "bullets": [] } ] },
    { "type": "groups", "heading": "Capabilities", "groups": [ { "label": "Operations", "text": "Process improvement / Budgeting / KPIs" } ] },
    { "type": "lines",  "heading": "Education",    "lines":  [ { "bold": "State University", "text": "B.S., Business Administration" } ] }
  ]
}
```

- `experience`: one entry per employer, one role per job title, and bullets under the role they belong to. Use a role's `dates` only when an employer has several roles. The optional `note` is a short aside shown after the company name.
- `groups`: label and text pairs, such as skills by area. Separate items with ` / `.
- `lines`: short items such as education, certifications or awards.
- Keep the name, headline and headings as they're written. The design decides whether they appear in capitals. Join the contact details with ` · `.
- Optional extras on an entry: `italic` (one line under the company) and `clientsHeading` with `clients: [{name, desc, bullets}]`, for consultants and freelancers.

**The design**, standardized into these options and nothing else:

```json
{
  "font": "mono | sans | serif",
  "accent": "#RRGGBB",
  "nameCase": "upper | asis",
  "nameAlign": "center | left",
  "nameSpacing": "wide | normal",
  "nameBar": true,
  "headings": "numbered | rule | plain",
  "bullets": "square | round | dash",
  "summaryBar": false,
  "companyCaps": false,
  "skills": "stacked | inline",
  "fontsSeen": "Garamond, Calibri"
}
```

How to map an original onto those options:

| Option | How to read it from the original |
|---|---|
| `font` | `serif` for serif typefaces (Times, Garamond, Georgia, Cambria, Book Antiqua…). `sans` for sans-serif ones (Arial, Helvetica, Calibri, Inter, Lato, Open Sans, Roboto…). `mono` for monospaced ones. |
| `accent` | The main color of the name, headings, lines or links. Use `#000000` if everything is black. |
| `nameCase`, `nameAlign`, `nameSpacing` | Whether the name is in capitals, centered or left-aligned, and letter-spaced. |
| `nameBar` | A short line or bar under the name. |
| `headings` | `numbered` (01, 02…), `rule` (underlined, or followed by a line), or `plain`. |
| `bullets`, `companyCaps`, `skills` | The bullet shape, whether company names are in capitals, and whether skills read "Label: items" on one line (`inline`) or have the label above them (`stacked`). |
| `summaryBar` | A colored bar beside the summary. |
| `fontsSeen` | The real font names, for reference only. |

If the original has a **logo** (a monogram or mark), ask the person for the image file. The app stores it with the design and shows it above the name.

If you only have plain text and can't see the original's formatting, use the **unmplyd** preset and say so.

## 2. Make the import file (for route A)

The app keeps its data in the browser and imports a backup file with this shape. Save it as `unmplyd-backup.json`, and tell the person to click **Import backup** in the app:

```json
{
  "app": "unmplyd", "version": 2,
  "resumes": [
    { "id": "r-main", "title": "Operations", "target": "Operations manager roles", "status": "current",
      "notes": "", "design": DESIGN, "data": RESUME, "savedAt": "ISO-8601", "created": "ISO-8601" }
  ],
  "versions": []
}
```

`status` is `current` (the one to send), `draft` or `older`. `DESIGN` is the object from step 1, plus `"preset": "original"`. A logo goes in `design.logo` as a PNG or JPEG data URL, at most about 600 × 200px.

## 3. The design system (for routes B and C)

### Presets

| Preset | font | accent | nameCase | nameAlign | nameSpacing | nameBar | headings | bullets | summaryBar | companyCaps | skills |
|---|---|---|---|---|---|---|---|---|---|---|---|
| **unmplyd** (default) | mono | `#003FCC` | upper | center | wide | true | numbered | square | true | true | stacked |
| **Corpo slop** | serif | `#000000` | asis | center | normal | false | rule | round | false | false | inline |
**Match my original** uses whatever step 1 read from the original. Anything the person changes by hand becomes "Custom".

### Fonts

| `font` | On screen | In the PDF |
|---|---|---|
| `mono` | JetBrains Mono (400, 500, 700) | JetBrains Mono, embedded from the bundled TTF files |
| `sans` | "Helvetica Neue", Helvetica, Arial | Built-in Helvetica |
| `serif` | "Times New Roman", Times | Built-in Times-Roman |

### The paper

The résumé sits on a white "paper": at most 8.5in wide, padded 48px top, 52px sides and 56px bottom, with a 1px border in `#D8D8D4` and a soft drop shadow. The paper stays white in dark mode, because it represents print. Text colors: ink `#141414`, body `#333331`, muted `#5E5E5B`, rules `#D8D8D4`. The accent comes from the design.

From top to bottom:

1. **Logo** (optional): at most 52px tall, aligned like the name.
2. **Name**: bold, 26px in mono, 24px in serif. Capitals if `nameCase` is `upper`. Letter-spacing 0.2em if `wide`, about 0.02em if `normal`.
3. **Name bar**: if `nameBar`, 90 × 2px in the accent color.
4. **Headline**: 12px, letter-spaced (0.22em wide, 0.04em normal), with the same case as the name.
5. **Contact line**: 11.5px, muted.
6. **Summary**: a 3px accent bar on the left if `summaryBar`, otherwise plain.
7. **Section headings**, always in capitals:
   - `numbered`: the number (`01`, `02`…) in the accent color, then the heading, then a 1px rule filling the rest of the line.
   - `rule`: the heading in the accent color, with a full-width rule under it.
   - `plain`: a bold heading only.
8. **Experience entry**: the company (bold, in capitals if `companyCaps`), an italic muted note, and the dates pushed right. Each role title is in the accent color, and italic in serif. Bullets are a 5px accent square (`square`), a 4px dot (`round`) or an en dash (`dash`).
9. **Groups**: `stacked` puts the bold label on its own line with the items under it. `inline` reads "**Label:** items".
10. **Lines**: the bold part, then ` — ` and the detail.

**unmplyd** is the house look. **Corpo slop** is deliberately boring: Times New Roman, all black, a centered plain name, underlined capital headings, dot bullets, nothing letter-spaced. It's for companies where any design at all is a risk.

The app around the paper uses JetBrains Mono, a `#FAFAF8` background, white surfaces, the accent `#003FCC` for buttons and links, a masthead with a faint 48px grid, and small capitals status chips (current in green, draft in amber, older in grey). It supports dark mode.

## 4. Behavior (route B)

- **Library**: cards for `current` résumés. Each shows its target, status chip, last-updated date, title, design preset, headline and notes, with the actions **Edit in the editor**, **Download PDF**, **Duplicate** and **Details** (name, what it's for, status, notes, delete). Drafts and older résumés are folded into an "Older versions & drafts" list. **+ New résumé** starts from a copy of an existing one, a blank template, or pasted text.
- **Editor**: a tab for each résumé that isn't older. Every piece of text on the paper is `contenteditable` (use `plaintext-only` where supported) and writes back to its JSON path as you type. Enter in a bullet adds a new bullet below it. Backspace in an empty bullet removes it. Enter anywhere else leaves the field.
- **Edit layout** (a toggle): small buttons on the paper to add or remove a summary, sections (experience, skills or list), jobs, roles, bullets, groups and lines, and to move sections and jobs up or down. Removing a section or a job saves a version first.
- **Design** panel:
  - The three presets.
  - A control for every option in step 1: accent swatches plus a free color picker, and a logo upload (PNG or JPG, downscaled in the browser).
  - The panel shows which preset is active, and the original's fonts if known.
- **History**: **Save version** with an optional note, plus a list of versions, each with Preview (read-only, with a bar to restore it or go back) and Restore (which saves the current state first). Keep the last 40 versions for each résumé.
- **AI, with any assistant, by copy and paste.** Each mode has its own prompt.
  - **Edit**: a request, or a quick one (tighten bullets, stronger verbs, lead with results, shorter, tailor to a pasted job posting). The reply is the full résumé JSON.
  - **Import**: pasted résumé text. The prompt asks the assistant to reply `{"resume": RESUME, "design": DESIGN or null}`, and to fill in `design` only when the original file is attached in that chat. Tell the person to attach it.
  - **Match my original**: the prompt asks for the DESIGN JSON only, from the attached original file. It replies `{"error": "no file"}` if nothing is attached.
  - **Review before applying.** The app pulls the JSON out of the reply (stripping code fences) and checks it. It shows every text change, old next to new, or a rendered preview for an import or a design. It warns if any company name, date or job title changed. Apply saves a version first, and a matched design keeps the existing logo.
- **Storage**: save the whole state to `localStorage` (key `unmplyd:resumes:v1`), debounced by about half a second, and flush it when the page is hidden. Provide **Export backup** and **Import backup**. Importing replaces everything, after a confirmation, and older backups that have a plain `accent` instead of `design` still load. On first run, load example data for a made-up person, with a "Start fresh" button.
- **Safety**: build every element with `textContent`, never `innerHTML`, for anything that came from the person or an AI reply. Accept a logo only as a PNG or JPEG data URL.

## 5. PDF export

Use jsPDF 2.5.1 from `https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js`.

- **Fonts:**
  - `mono` embeds JetBrains Mono Regular and Bold from the local TTF files, falling back to Courier, which has the same widths.
  - `serif` uses the built-in `times` font and `sans` uses the built-in `helvetica`. Both cover Latin text only, so if the résumé has other characters, switch that PDF to JetBrains Mono and tell the person.
- **Page:** US Letter (612 × 792pt). Content runs from x=40 to x=572. Start at y=50, and start a new page when y would pass 758.
- **Wrapping:** measure text with `getTextWidth` and wrap by width.
- **Letter spacing:** only the name gets character spacing (2pt in mono, 1.6pt otherwise, and only when `wide`). Spacing small text makes PDF text extract as "E X P E R I E N C E", which hurts parsing by applicant-tracking systems.
- **Sizes (pt):**

  | | name | headline | contact | summary | headings | company | role | bullets | groups / lines |
  |---|---|---|---|---|---|---|---|---|---|
  | mono | 22 | 10 bold | 9 | 9.6 / 13.2 | 10.5 | 10.5 | 9.8 | 9.2 / 12.4 | 9.3 to 9.8 |
  | sans | 21 | 10.5 | 9 | 10 / 13.8 | 10.5 | 10.5 | 10 | 9.6 / 12.9 | 9.6 |
  | serif | 20 | 11 | 9.8 | 10.8 / 14 | 11.5 | 11 | 10.8 italic | 10.6 / 13.6 | 10.6 |

- **Elements:**
  - The logo is about 36pt tall, at most 170pt wide, above the name.
  - The name bar is 90 × 1.8pt.
  - The summary bar is 2.6pt wide.
  - `numbered` headings put the number at x=40 and the heading at x=60, with a 0.6pt rule to the margin. `rule` headings get a 0.7pt accent rule under them.
  - Bullets are a 3pt accent square, a 1.4pt dot, or an en dash.
- **File:** set the PDF's title and author metadata, and name the file `First_Last_Resume_<résumé name>.pdf`. Aim for one or two pages.

## 6. Rules for any AI edit

Put these in every prompt, and follow them yourself when you edit a résumé directly:

- Reply with only the complete résumé as JSON, in exactly the same structure and keys.
- Never invent employers, titles, dates, clients, tools, metrics or outcomes. Keep every existing number unless the request says to remove it.
- Keep company names, dates and role titles exactly as they are unless the request explicitly asks to change them.
- Bullets stay one or two lines and start with a strong verb, in the past tense for past roles and the present tense for current ones.
- When tailoring to a posting, reorder and reword for fit, and use the posting's terms only where they're true.
- Plain text only inside strings: no HTML and no Markdown.
- When describing a design, use only the standard options in step 1. Never invent new ones.

## 7. Keeping track without the app (route C)

```
resumes/
  operations/
    resume.json         the current version (Résumé JSON)
    design.json         the standardized design (step 1)
    logo.png            optional
    resume.html         the designed page, built from section 3
    Alex_Rivera_Resume_Operations.pdf
    versions/
      2026-11-05_1430_before-tailoring.json
    notes.md            what it's for, status (current, draft or older), and where it was sent
  operations-corpo/     a Corpo slop copy: the same résumé.json with the Corpo slop design.json
```

- Never overwrite a version file. Before every change to `resume.json`, save the old one into `versions/` with a timestamp and a short note.
- When a résumé is replaced, set its status in `notes.md` to `older`. Don't delete it.
- To make a copy for one kind of role or one job, duplicate the folder, give it a descriptive name, and note in `notes.md` which résumé it came from.

## Done when

- The paper matches section 3 for all three presets, and editing, Enter, Backspace, Edit layout, History, Design and the AI review loop all work.
- Importing with the original file attached brings in both the content and a matching design. Corpo slop gives a plain black Times New Roman page.
- Changes survive a reload, and **Export backup** followed by **Import backup** gets everything back.
- The PDF matches the chosen design, its text extracts cleanly (no letter-spaced headings), and it's no more than two pages for a typical résumé.
- At 390px wide there's no horizontal scrolling.
