# Working on unmplyd

An industry-neutral application workspace focused on the exact résumé, letter and
files prepared or sent for a role. Keep examples anonymous; never add personal
search details, fixed career assumptions, or named AI providers.

## Architecture

- index.html is the boot shell; src/app.js owns UI/routes/onboarding/settings.
- src/styles.css owns responsive styles. src/store.js owns versioned metadata,
  legacy migration, immutable snapshots, IndexedDB originals, backup/restore.
- src/documents.js owns imports, provider-neutral prompts and PDF/text exports.
- vendor/ and fonts/ are local dependencies with their original notices.
- npm start serves the static app; no installation or build step. npm test runs
  dependency-free tests. tests/*.test.mjs cover state and document invariants.
- Browser-check onboarding, role copies, AI review, history, packet/file retention,
  backup restore, document import/export and phone layout after behavior changes.

## Product invariants

- Onboarding and settings are the configuration interface. No mandatory email,
  provider, API key, fixed profession, or required number of role groups.
- Protect the verified base résumé: tailoring creates a separate role copy.
- AI output is ordinary draft text. Explicit comparison and review precede save.
  Preserve earlier text in version history and respect excluded claims.
- New applications are Lead; dates start blank. A status change is not contact.
  Save ready packet does not imply submission. Record submission requires user
  confirmation of date and exact documents. Never apply or send for the user.
- Packets and file IDs are immutable. Remove references from working attachments,
  not original bytes referenced by saved packets. Archive roles; retain history.
- Complete backups include originals and reject missing files. Imports merge and
  remap references instead of silently overwriting records. Preserve unknown fields
  and original legacy keys. No fictitious migration of unavailable remote data.
- Display save/storage failures honestly and stop stale tabs from overwriting
  newer work. No unimplemented sync/account claims or fabricated ATS scores.
- The local app uses no external network services. Keep import/export libraries
  bundled locally and preserve their license notices.

For maintaining a user's real workspace, read first and write only supported
changes. Never invent facts, credentials or metrics. SKILL.md is the independent
file-based workflow, not an automatic app integration.
