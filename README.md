# unmplyd

**Keep every application and its documents together.** AI-assisted résumé edits
and cover letters quickly become a pile of chats and nearly identical files.
Maintain a base résumé, make small adjustments for each role, and retain dated
packets of the exact résumé and letter you prepared or sent.

Works for any role, industry, or AI assistant. No model subscription or API key
is required. Defaults and examples contain placeholders only.

![Application workspace with placeholder data](docs/screenshot.png)

## Choose your workflow

### Skill only — no app installation

Download [SKILL.md](SKILL.md), attach it to an assistant or paste its contents,
and ask: **“Use these instructions to organize my applications in my chosen
private folder. Start with my base résumé and this role description.”**

With file access, the assistant maintains a manifest, versioned drafts, one folder
per role, and immutable submission packets. Without file access, it returns files
for you to save. For assistants with skill discovery, place this single file in
an unmplyd/SKILL.md skill folder following their own installation convention.
This workflow does not automatically sync with the app.

### Local web app

    git clone https://github.com/iclickthemouse/unmplyd.git
    cd unmplyd
    python3 -m http.server 8000 --bind 127.0.0.1
    # open http://localhost:8000

Use an available Python 3 command. No packages or build step. Serve on localhost;
direct file opening blocks seed/font fetching. The demo loads once into browser
storage; replace its placeholders before use.

| Area | What it does |
|---|---|
| Résumé editor | Base and working copy, autosave, named history, restore, selectable-text PDF export. |
| Edit with AI | Copy a prompt into any assistant, paste JSON, review the diff, explicitly apply. Previous data goes into History. |
| Applications | Posting, status, dates, next step, selected résumé, letter draft, exact file links. |
| Packets | Save packet captures résumé JSON, letter text, posting, links, status and timestamp. Packets previews/downloads every snapshot. |
| Materials | Résumés, editable letter text, profiles, sites, chats, and private storage links. |
| Tasks | Next steps and retained completed items. |

Save the application form before capturing a packet. Captured text stays unchanged
when the working résumé or letter changes. Saving a packet does not submit an
application or change status. To record what was sent, capture the actual chosen
documents and update status. External links can change; retain submitted PDF/Word
files in your private folder. Download packets before clearing browser storage.

<p>
  <img src="docs/editor.png" alt="Provider-neutral résumé editing" width="49%">
  <img src="docs/applications.png" alt="Applications and saved document packets" width="49%">
</p>

## Configuration

Edit HQ_CONFIG near the top of index.html, or define it in an earlier script.
Top-level options are shallow-merged with defaults:

    window.HQ_CONFIG = {
      appName: "Application Workspace", owner: "", email: "", quickLinks: [],
      tracks: [{id:"general", label:"General"}],
      resumes: {
        base: {label:"Base résumé", track:"general", file:"Resume_Base.pdf"},
        tailored: {label:"Working copy", track:"general", file:"Resume_Tailored.pdf"}
      },
      retiredClaims: [], seedUrl: null // no demo; editable starters are created
    };

Tracks are user-defined groupings, not fixed professions. Both is a legacy ID
meaning all tracks. Existing records are preserved: when upgrading, keep your
existing résumé and track IDs in configuration to keep editing those records.
For an isolated demo use another hostname/port. To reset only this app after
backing up packets, remove browser storage keys starting with unmplyd:.

PDF metadata uses the résumé's own name. Local fonts fall back to Courier if
unavailable. Page count depends on content; inspect the export before submission.
No universal ATS compatibility is claimed.

## Optional host integrations

Storage is local to this browser and origin. A host can supply HQ_ADAPTERS before
startup. No provider SDK is bundled. AI adapter interface:

    window.HQ_ADAPTERS = {
      ai: {edit: async ({prompt, signal}) => myConfiguredService(prompt, signal)}
    };

Return complete résumé JSON or JSON text. Remote credentials belong in a trusted
server-side integration, never in the HTML. Only Run connected AI invokes the
adapter; copy/paste works without one. Prompts contain résumé, request, posting
and retired claims. Replies are shape-checked and previewed; a changed working
résumé invalidates a prior reply. Review facts yourself before applying.

Advanced hosts may supply db, user, assets and downloads. These are interfaces,
not built-in cloud services. A connected db must be paired with authorization
through user.can("data.write"), also enforced by host storage. Assets enables
uploads; otherwise use private file links. Connected storage does not fall back
to local permissions/downloads. See the local document/snapshot adapter and UI
call sites in index.html for interface signatures. No migration is automatic.

The seed_to_batch.py helper exports local batch manifests for a host importer;
it does not execute database writes. Use only for an empty destination because
set entries replace documents.

## App data model

| Collection | Key fields |
|---|---|
| materials | kind, track, title, subtitle, status, date, primary {label,url}, links[], note, flags[], editorId, text, assetId |
| applications | company, role, track, status, applied, last, next, link, note, jobPosting, resumeId, resumeUrl, coverLetter, coverLetterUrl, packetId |
| todos | area, text, done, order, created |
| resumes | title, data, savedAt (ID matches config résumé key) |
| resumes/<id>/versions | data, at, note |
| applications/<id>/versions | at, applicationId, company, role, status, jobPosting, resumeId, resume, resumeUrl, coverLetter, coverLetterUrl |

Material kinds: resume, letter, site, linkedin, chat, vault, file. Statuses:
Lead, Drafted, Applied, In review, Interview, Offer, Closed. A packet's resume is
a deep snapshot, not a live reference. Résumé data contains name, title, contact,
summary and sections of type experience, groups, or lines; see the complete
[example seed](examples/seed.json). Regenerate it with
python3 scripts/build_example_seed.py. See [AGENTS.md](AGENTS.md) for maintenance.

## Privacy and limits

No built-in AI requests or real search history. Browser storage is not encrypted,
synced, or automatically backed up; clearing it removes data, and other people
using the same browser profile can access it. Optional host storage follows
the host's access and sharing rules. Packets freeze text, not remote file bytes.

jsPDF loads from cdnjs for PDF export. Fonts and seed are local by default;
configured remote URLs/adapters create their own requests. Copying a prompt
shares its data with your chosen assistant. No job discovery or auto-applying.

## Development and credits

[Repository inventory](docs/INVENTORY.md). Storage checks:
node --test tests/runtime.test.cjs. Browser-check editing, AI review/history,
application packets, and PDF download after behavior changes.

- PDF: [jsPDF](https://github.com/parallax/jsPDF) (MIT).
- Font: [JetBrains Mono](https://www.jetbrains.com/lp/mono/) (SIL OFL 1.1;
  original notices in fonts/OFL.txt).

MIT. See [LICENSE](LICENSE).
