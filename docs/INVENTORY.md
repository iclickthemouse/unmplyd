# Repository inventory

Reviewed 2026-11-05. The original repo had 14 files: one HTML app, README, agent
instructions, MIT license, ignore rules, three screenshots, JSON seed, two Python
helpers, two fonts and their license. No build system, package manifest, tests,
CI, backend, or deployment was present.

| Path | Purpose |
|---|---|
| index.html | Styles/config, local document store, material/task/application CRUD, résumé editor/history, AI review, packet snapshots, PDF export and optional host adapters. |
| SKILL.md | Independent model-neutral file workflow, no app checkout required. |
| AGENTS.md | Repository/workspace maintenance rules. |
| examples/seed.json | Generated anonymous placeholders, no real career/search history. |
| scripts/build_example_seed.py | Reproducible seed generator. |
| scripts/seed_to_batch.py | Generic local manifests for an external importer. |
| fonts/ | Local regular/bold fonts and original license. |
| docs/*.png | Screenshots containing placeholders only. |
| tests/runtime.test.cjs | Dependency-free storage regression tests. |

This update replaces a provider-specific runtime with optional host adapters and
copy/paste AI review; uses General, Base résumé and Working copy defaults; and
adds immutable résumé/letter packets per application. Personal attribution is
removed from current content/license and screenshots regenerated. Git history
and GitHub account ownership remain unchanged; no history rewrite is performed.

Limits: browser quotas, no automatic backup/multi-device sync; uploads require a
host adapter; external links are not frozen; PDF export needs a CDN script.
Shape validation cannot verify résumé facts. Inspect facts and exported layouts.
