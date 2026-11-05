# Working on unmplyd

Organize application materials, small résumé adjustments, and exact versions
prepared or sent for each role. Keep defaults useful for any occupation/industry.

## Repository changes

- The UI, document store, editor, history, AI review, packets and PDF export live
  in index.html. There is no build system.
- Defaults/examples/screenshots must stay anonymous and industry-neutral. Do not
  add personal names, real search details, model names, or provider SDKs.
- AI works through copy/paste by default. Optional integrations use
  window.HQ_ADAPTERS; preserve diff review, explicit apply, and prior snapshots.
- Regenerate examples with python3 scripts/build_example_seed.py.
- Run node --test tests/runtime.test.cjs for storage regressions. Browser-check
  editing, AI review/apply, history, packets, and PDF export after behavior changes.
- Retain original third-party font/license notices.

## Maintaining a workspace

Read before writing, merge changes, and preserve unknown fields. Never invent
employers, titles, dates, qualifications, claims, or metrics. Respect retiredClaims.
Dates use YYYY-MM-DD; last means real last activity, not today's date by default.
Statuses: Lead, Drafted, Applied, In review, Interview, Offer, Closed. Track IDs
come from config; Both means all tracks. Links use https:// or a host asset path.
Stable IDs must distinguish roles at the same company (a-company-role-date).

Before replacing résumé data, save its previous data in resumes/<id>/versions
with timestamp and reason. Retire old materials with status older instead of
overwriting them. A ready/sent packet belongs in applications/<id>/versions;
update packetId without changing earlier packets. Preserve exact submitted files.

See README.md for app data. SKILL.md is a self-contained file workflow without
the app; it has its own manifest and does not automatically sync to browser data.
If storage is unavailable, report a pending update rather than claiming a write.
