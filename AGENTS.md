# Working on unmplyd

Notes for anyone, person or AI agent, changing this codebase. To use or rebuild unmplyd with an agent instead, see [SKILL.md](SKILL.md).

## Shape of the project

- `index.html` is the entire app. Keep it that way: no framework, no bundler, no build step.
- Data lives in `localStorage` under `unmplyd:resumes:v1`. The data model is documented at the top of the script and in the README. `normalize()` fills in anything missing, so keep old backups importable when you change the model.
- The example data comes from `scripts/build_example.py`, which writes `examples/example-backup.json` and embeds the same JSON in `<script id="unmplyd-example">`. Edit the script, not the embedded JSON.
- Every résumé has a `design` made of a fixed set of options (font family, accent, name treatment, headings, bullets, skills layout, logo). The screen uses CSS classes from `applyDesign()`, and the PDF reads the same object in `makePdf()`. To add an option, add it to `DESIGN_OPTIONS` or `PRESETS`, `sanitizeDesign()`, the CSS, the PDF, the Design panel and the AI design prompt, all together.
- PDFs are drawn with jsPDF. Mono embeds the bundled JetBrains Mono (falling back to Courier), serif uses the built-in Times and sans the built-in Helvetica. Text outside Latin-1 switches to JetBrains Mono.

## Principles

- **Keep the design.** The paper layout, type and colors are the product. Change them on purpose, and keep the screen and the PDF matching.
- **Data stays in the browser.** No analytics, no trackers, no remote calls beyond the font and the PDF library.
- **Stay model-agnostic.** AI edits work by copy and paste with any assistant.
- **Never lose work.** Save a version before anything that replaces or removes content: AI apply, import, restore, or removing a section or job.
- **No invented facts.** Keep the prompt rules against inventing employers, titles, dates, numbers or results.

## Before you open a pull request

Serve the folder (`python3 -m http.server`) and check:

1. First load shows the example résumés, and **Start fresh** clears them.
2. **+ New résumé** from pasted text: copy the import prompt, paste back a JSON reply, preview it, apply it.
3. Edit a bullet, press Enter for a new one, add and remove a job with **Edit layout**, then reload. Everything is still there.
4. **Edit with AI**: paste back a reply wrapped in a code fence, review the changes, apply. A version appears in **History**, and Preview and Restore both work.
5. In Design, try unmplyd, Corpo slop and a few custom options, upload a logo, and run Match my original with a pasted design reply. Download a PDF for each: it matches the screen, the text extracts cleanly with `pdftotext`, and a typical résumé fits on one or two pages.
6. Change a status in Details, duplicate a résumé, and delete one.
7. Export a backup, start fresh, import the backup, and check everything is back.
8. At 390px wide there's no horizontal scrolling, and dark mode is readable.
