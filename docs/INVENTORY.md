# Repository inventory — v3

Updated 2026-11-05. The initial 14-file single-HTML organizer is now a modular
static application with guided onboarding, editable preferences and a complete
role/document workflow. No framework build, backend, hosted account, or paid model
dependency. Historical Git commits and repository ownership are unchanged.

| Path | Purpose |
|---|---|
| index.html | Accessible boot shell and local library loading. |
| src/app.js | Three-step setup, settings, dashboard, board/list, role workspace, document/letter editing, review, history, tasks, search, backup UI. |
| src/styles.css | Responsive ivory/cobalt design, sidebar, onboarding, mobile and native dialogs. |
| src/store.js | Validated schema v3, localStorage metadata, immutable versions/packets, IndexedDB originals, legacy migration, full additive backups. |
| src/documents.js | PDF/Word/text/legacy JSON imports, assistant-neutral prompts, multipage PDF and text downloads. |
| scripts/serve.mjs | Local-only static server with path confinement and correct module MIME types. |
| start.cmd | Windows launcher using Node directly, without PowerShell script-policy changes. |
| package.json | Start/dev/test commands; no installed dependencies. |
| vendor/ | Local jsPDF 2.5.1, PDF.js 4.10.38 + worker, Mammoth 1.9.0 and notices. |
| fonts/ | JetBrains Mono regular/bold and original OFL license. |
| tests/*.test.mjs | 20 unit tests for state/document behavior. |
| docs/*.png | Anonymous onboarding, dashboard, applications, editor, and mobile screenshots. |
| examples/workspace-backup.json | Clearly labeled placeholder workspace for an optional restore demo. |
| scripts/build_example_seed.py | Rebuilds that example backup; never loads automatically. |
| SKILL.md | Self-contained folder/manifest workflow without installing the app. |

Validation: unit tests plus native browser onboarding, preferences, defaults,
base-protected role copies, AI review, packet immutability and original bytes,
full backup into a fresh profile, PDF export/re-import, dialogs, persistence,
desktop and 390px phone layouts. Remote account/service integrations are not
implemented or implied. Local files and backups require private handling.

Limits: browser storage can be cleared or reach quota; no cloud sync or encryption
at rest; imports preserve text rather than source layout; scanned PDFs need OCR
elsewhere; standard PDF font limits non-Latin output; original uploads retain their
bytes. Saved-only packets and reported submissions are intentionally distinct.
