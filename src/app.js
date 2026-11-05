import {
  loadState,
  saveState,
  createEmptyState,
  uid,
  snapshotResume,
  createPacket,
  STATUSES,
  addFile,
  getFile,
  exportBackup,
  importBackup,
} from "./store.js";
import {
  parseResumeFile,
  buildTailoringPrompt,
  buildCoverLetterPrompt,
  downloadText,
  downloadResumePdf,
  downloadCoverLetterPdf,
} from "./documents.js";

const root = document.querySelector("#app");
const dialog = document.querySelector("#dialog");
const escape = (value) =>
  String(value ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
const e = escape;
const clone = (o) => JSON.parse(JSON.stringify(o));
const date = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};
const at = () => new Date().toISOString();
const pretty = (d) =>
  !d
    ? "No date"
    : new Date(
        /^\d{4}-\d\d-\d\d$/.test(d) ? d + "T12:00:00" : d,
      ).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
const relative = (d) => {
  if (!d) return "Not yet";
  const n = Math.floor((Date.now() - new Date(d)) / 86400000);
  return n <= 0
    ? "Today"
    : n === 1
      ? "Yesterday"
      : n < 7
        ? `${n} days ago`
        : pretty(d);
};
const paths = {
  grid: "M3 3h7v7H3zm11 0h7v7h-7zM3 14h7v7H3zm11 0h7v7h-7z",
  briefcase: "M3 7h18v14H3zM8 7V3h8v4M3 12c6 3 12 3 18 0M12 12v4",
  file: "M14 2H5v20h14V7zM14 2v6h5M8 12h8M8 16h8",
  check: "M5 12l4 4L19 6",
  tasks: "M9 5h12M9 12h12M9 19h12M2 5l1 1 2-3M2 12l1 1 2-3M2 19l1 1 2-3",
  settings:
    "M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8M9 2h6l1 4 4 1 2 5-3 3v5l-6 2-3-3H5l-3-6 3-3V5z",
  search: "M21 21l-6-6M17 10a7 7 0 1 0-14 0 7 7 0 0 0 14 0",
  plus: "M12 5v14M5 12h14",
  arrow: "M5 12h14M14 7l5 5-5 5",
  back: "M19 12H5M10 7l-5 5 5 5",
  down: "M12 3v12M7 10l5 5 5-5M4 17v4h16v-4",
  upload: "M12 16V3M7 8l5-5 5 5M4 17v4h16v-4",
  clock: "M12 7v5l3 2M22 12a10 10 0 1 0-20 0 10 10 0 0 0 20 0",
  spark: "M12 2l3 7 7 3-7 3-3 7-3-7-7-3 7-3z",
  lock: "M6 10h12v12H6zM8 10V6a4 4 0 0 1 8 0v4",
  more: "M5 12h.01M12 12h.01M19 12h.01",
  list: "M3 5h18M3 12h18M3 19h18",
  board: "M3 3h5v18H3zM10 3h5v12h-5zM17 3h5v16h-5z",
  close: "M6 6l12 12M6 18L18 6",
  link: "M10 13a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-2 2M14 11a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l2-2",
  archive: "M3 3h18v5H3zM5 8v13h14V8M9 12h6",
  menu: "M4 6h16M4 12h16M4 18h16",
  copy: "M8 8h13v13H8zM16 8V3H3v13h5",
  flag: "M5 22V3M5 3c5-4 9 4 15 0v10c-6 4-10-4-15 0",
  mail: "M2 4h20v16H2zM2 5l10 8L22 5",
  refresh: "M20 7a9 9 0 1 0 1 9M20 2v6h-6",
  external: "M14 3h7v7M21 3L10 14M10 3H3v18h18v-7",
};
const icon = (name) =>
  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.55" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${paths[name] || paths.file}"/></svg>`;
const button = (label, action, extra = "", cls = "") =>
  `<button type="button" class="btn ${cls}" data-action="${action}" ${extra}>${label}</button>`;
const pill = (status) =>
  `<span class="tag dot ${["Interview", "Offer"].includes(status) ? "green" : ["Applied", "In review"].includes(status) ? "blue" : status === "Lead" ? "amber" : ""}">${e(status)}</span>`;
const field = (label, name, value = "", type = "text", attrs = "") =>
  `<label class="field"><span>${label}</span><input name="${name}" type="${type}" value="${e(value)}" ${attrs}></label>`;
const area = (label, name, value = "", attrs = "") =>
  `<label class="field"><span>${label}</span><textarea name="${name}" ${attrs}>${e(value)}</textarea></label>`;
const options = (rows, selected) =>
  rows
    .map(
      (r) =>
        `<option value="${e(typeof r === "string" ? r : r.id)}" ${(typeof r === "string" ? r : r.id) === selected ? "selected" : ""}>${e(typeof r === "string" ? r : r.label)}</option>`,
    )
    .join("");
const select = (label, name, rows, value = "", attrs = "") =>
  `<label class="field"><span>${label}</span><select name="${name}" ${attrs}>${options(rows, value)}</select></label>`;
const safeUrl = (u) => {
  try {
    const v = new URL(u);
    return v.protocol === "https:" ? v.href : "";
  } catch {
    return "";
  }
};
const external = (url, label) =>
  safeUrl(url)
    ? `<a class="btn small" href="${e(safeUrl(url))}" target="_blank" rel="noopener noreferrer">${label}${icon("external")}</a>`
    : "";
const activeApps = () => state.applications.filter((a) => !a.archived);
const trackName = (id) =>
  state.profile.tracks.find((t) => t.id === id)?.label || id || "General";
const appBy = (id) => state.applications.find((a) => a.id === id);
const resumeBy = (id) => state.resumes.find((r) => r.id === id);
let state,
  storageError = "",
  storageConflict = false,
  allowExit = false,
  saveTimer,
  toastTimer,
  lastFocused,
  modalContext = {},
  selectedTab = "overview",
  appView = innerWidth < 760 ? "list" : "board",
  appStatus = "all",
  appTrack = "all",
  showArchived = false,
  taskFilter = "open";
try {
  appView = localStorage.getItem("unmplyd:view") || appView;
} catch {}
const edited = new Set();
try {
  state = loadState();
} catch (error) {
  root.innerHTML = `<div class="empty" style="min-height:100vh"><h1>Your workspace needs attention</h1><p>${e(error.message)}</p><p>Your saved data has been left untouched. Keep this browser profile and restore a known backup in a separate profile.</p></div>`;
  throw error;
}

function toast(message, error = false) {
  const n = document.querySelector("#toast");
  n.className = "toast" + (error ? " error" : "");
  n.textContent = message;
  n.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => (n.hidden = true), 5500);
}
function persist() {
  clearTimeout(saveTimer);
  if (storageConflict) return false;
  try {
    saveState(state);
    storageError = "";
    document.querySelectorAll(".save-note").forEach((n) => {
      n.classList.remove("error");
      n.textContent = "All changes saved";
    });
    return true;
  } catch (error) {
    storageError = error.message;
    document.querySelectorAll(".save-note").forEach((n) => {
      n.classList.add("error");
      n.textContent = "Changes not saved";
    });
    toast(error.message, true);
    return false;
  }
}
function schedule() {
  clearTimeout(saveTimer);
  document
    .querySelectorAll(".save-note")
    .forEach((n) => (n.textContent = "Saving…"));
  saveTimer = setTimeout(persist, 350);
}
function route() {
  return (location.hash.slice(1) || "overview").split("/");
}
function go(hash) {
  persist();
  if (location.hash === "#" + hash) render();
  else location.hash = hash;
}
function closeDialog() {
  dialog.close();
  modalContext = {};
  if (lastFocused?.isConnected) lastFocused.focus();
}
function modal(title, description, body, wide = false) {
  lastFocused = document.activeElement;
  dialog.className = wide ? "wide" : "";
  dialog.innerHTML = `<div class="modal-head"><div><h2 id="dialog-title">${title}</h2>${description ? `<p>${description}</p>` : ""}</div><button class="icon-btn" data-action="close" aria-label="Close dialog">${icon("close")}</button></div><div class="modal-body">${body}</div>`;
  if (!dialog.open) dialog.showModal();
  requestAnimationFrame(() =>
    dialog.querySelector("input,textarea,select,button[type=submit]")?.focus(),
  );
}
function empty(title, description, action = "", name = "file") {
  return `<div class="empty"><div class="empty-icon">${icon(name)}</div><h3>${title}</h3><p>${description}</p>${action}</div>`;
}
function greeting() {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
}
function saveBadge() {
  return `<span class="save-note ${storageError ? "error" : ""}" role="status">${storageError ? "Changes not saved" : "All changes saved"}</span>`;
}
function initials(name) {
  return (name || "U")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((x) => x[0])
    .join("")
    .toUpperCase();
}

function render() {
  if (!state.onboardingComplete) {
    renderOnboarding();
    return;
  }
  const [page, id] = route();
  const names = {
    overview: "Overview",
    applications: "Applications",
    documents: "Documents",
    tasks: "Tasks",
    settings: "Settings",
  };
  root.innerHTML = `<div class="shell"><div class="mobile-overlay" data-action="menu-close"></div><aside class="sidebar" aria-label="Main navigation"><a href="#overview" class="brand"><span class="brand-mark">u</span>unmplyd<span style="color:var(--blue)">.</span></a><div class="workspace-label mono">WORKSPACE</div><nav class="nav">${[
    ["overview", "grid", "Overview"],
    ["applications", "briefcase", "Applications"],
    ["documents", "file", "Documents"],
    ["tasks", "tasks", "Tasks"],
  ]
    .map(
      ([key, i, label]) =>
        `<a href="#${key}" class="${page === key ? "active" : ""}" ${page === key ? 'aria-current="page"' : ""}>${icon(i)}${label}${key === "applications" ? `<span class="count">${activeApps().length}</span>` : key === "tasks" && state.tasks.some((t) => !t.done) ? `<span class="count">${state.tasks.filter((t) => !t.done).length}</span>` : ""}</a>`,
    )
    .join(
      "",
    )}</nav><div class="side-bottom"><nav class="nav"><a href="#settings" class="${page === "settings" ? "active" : ""}">${icon("settings")}Workspace settings</a></nav><div class="storage-card"><div class="row">${icon("lock")}Private by default</div><p>Your workspace stays in this browser. Keep a backup to take it with you.</p><button class="text-link" data-action="backup">Export workspace ${icon("arrow")}</button></div><div class="profile-mini"><div class="avatar">${e(initials(state.profile.name || state.profile.workspaceName))}</div><div><strong>${e(state.profile.name || state.profile.workspaceName)}</strong><small>Personal workspace</small></div></div></div></aside><div class="main-shell"><header class="topbar"><button class="icon-btn mobile-menu" data-action="menu" aria-label="Open navigation">${icon("menu")}</button><span class="breadcrumb">${e(state.profile.workspaceName)} <span style="margin:0 10px;color:#c6cebc">/</span> ${names[page] || "Overview"}</span><button class="top-search" data-action="search" aria-label="Search workspace" style="background:transparent">${icon("search")}<span style="font-size:11px;flex:1;text-align:left">Search your workspace</span><kbd>⌘ K</kbd></button><div class="top-actions">${saveBadge()}${button(icon("plus") + " Add application", "add-app", "", "primary")}</div></header><main class="content" id="main" tabindex="-1">${page === "applications" ? (id ? applicationDetail(id) : applications()) : page === "documents" ? (id ? documentEditor(id) : documents()) : page === "tasks" ? tasks() : page === "settings" ? settings() : overview()}</main></div></div>`;
}

function renderOnboarding() {
  const step = Number(state.onboardingStep || 0),
    p = state.profile;
  const story = `<div class="onboard-story"><div class="brand"><span class="brand-mark">u</span>unmplyd<span style="color:var(--blue)">.</span></div><div class="story-copy"><div class="eyebrow">LESS SEARCHING. MORE MOMENTUM.</div><h1>A place for<br>every <span>version.</span></h1><p>Your résumé, the right cover letter, and every application. Finally, in the same place.</p><div class="story-chips"><span class="tag">Any role</span><span class="tag">Any industry</span><span class="tag">Any AI assistant</span></div><div class="story-illustration" aria-hidden="true"><div class="mini-document">${icon("file")}<div class="line"></div><div class="line short"></div><div class="line"></div><div class="mini-label">BASE RÉSUMÉ</div></div><div class="mini-document">${icon("spark")}<div class="line"></div><div class="line short"></div><div class="line"></div><div class="mini-label">TAILORED COPY</div></div><div class="mini-document">${icon("check")}<div class="line"></div><div class="line short"></div><div class="line"></div><div class="mini-label">SAVED FOR A ROLE</div></div></div></div><small>YOUR NEXT CHAPTER, A LITTLE MORE ORGANIZED.</small></div>`;
  let form = "";
  if (step === 0)
    form = `<div class="eyebrow">01 / MAKE IT YOURS</div><h2>A fresh start.<br>One organized workspace.</h2><p>Let's set up your home base. Everything here can be changed later.</p><form data-form="onboard-next"><div class="stack">${field("Workspace name", "workspaceName", p.workspaceName, "text", 'data-profile="workspaceName" maxlength="80" required')}${field('What should we call you? <span class="muted">(optional)</span>', "name", p.name, "text", 'data-profile="name" autocomplete="given-name"')}${field('Professional headline <span class="muted">(optional)</span>', "headline", p.headline, "text", 'data-profile="headline" placeholder="How you describe your work"')}</div><div class="onboard-actions"><button class="text-link" type="button" data-action="restore">Restore a backup</button><button class="btn primary" type="submit">Continue ${icon("arrow")}</button></div></form><p class="help" style="margin-top:22px"><button type="button" class="text-link" data-action="demo">Explore a sample workspace</button></p><div class="onboard-footer">${icon("lock")}No account or payment details. Your information stays in this browser.</div>`;
  if (step === 1)
    form = `<div class="eyebrow">02 / YOUR STARTING POINT</div><h2>Start with what<br>you already have.</h2><p>Add your base résumé. You'll keep it intact and make a separate copy for each role.</p><div class="stack"><label class="upload-zone">${icon("upload")}<strong>Choose a résumé to import</strong><small>PDF, Word, text or Markdown · up to 20 MB</small><input type="file" id="onboard-file" accept=".pdf,.docx,.txt,.md,.json" aria-label="Import a base résumé"></label>${area("Or paste your résumé", "resumeText", state.onboardingResume || "", 'class="resume-import" data-onboard-resume placeholder="Paste your current résumé here…"')}<p class="help" id="import-note">${state.onboardingResume ? "Text imported. Review it before continuing." : "No résumé handy? You can add one later."}</p></div><div class="onboard-actions">${button("Back", "onboard-back", "", "ghost")}<div class="row">${button("Skip for now", "onboard-next", "", "ghost")}${button("Continue " + icon("arrow"), "onboard-next", "", "primary")}</div></div>`;
  if (step === 2)
    form = `<div class="eyebrow">03 / YOUR WAY OF WORKING</div><h2>Built around<br>your next move.</h2><p>Optional groups help you organize different kinds of roles. Keep one, add a few, or change them whenever you like.</p><div class="stack">${field("Role groups", "tracks", p.tracks.map((t) => t.label).join(", "), "text", 'id="onboard-tracks" placeholder="e.g. General, Leadership, Contract"')}${area('How should your writing sound? <span class="muted">(optional)</span>', "writingPreferences", p.writingPreferences, 'data-profile="writingPreferences" placeholder="e.g. Direct and concise. Keep cover letters under 300 words."')}</div><div class="setup-summary"><div class="row">${icon("check")}Your base résumé stays protected</div><div class="row">${icon("check")}Each role gets its own document versions</div><div class="row">${icon("check")}Works with the AI assistant you already use</div></div><div class="onboard-actions">${button("Back", "onboard-back", "", "ghost")}${button("Open my workspace " + icon("arrow"), "onboard-finish", "", "primary")}</div><div class="onboard-footer">${icon("lock")}Stored on this device. You can export a complete backup at any time.</div>`;
  root.innerHTML = `<div class="onboarding">${story}<main class="onboard-form"><div class="onboard-inner"><div class="step-row" aria-label="Step ${step + 1} of 3">${[0, 1, 2].map((n) => `<span class="step-dot ${n <= step ? "active" : ""}"></span>`).join("")}</div>${form}</div></main></div>`;
}

function overview() {
  const apps = activeApps(),
    active = apps.filter((a) =>
      ["Applied", "In review", "Interview", "Offer"].includes(a.status),
    ),
    due = apps.filter(
      (a) => a.followUpOn && a.followUpOn <= date() && a.status !== "Closed",
    );
  const open = state.tasks.filter((t) => !t.done),
    recent = apps
      .slice()
      .sort((a, b) =>
        (b.updatedAt || b.createdAt || "").localeCompare(
          a.updatedAt || a.createdAt || "",
        ),
      )
      .slice(0, 5);
  const events = apps
    .flatMap((a) =>
      (a.packets || []).map((p) => ({
        at: p.at,
        label: `${p.kind === "submitted" ? "Submission recorded" : "Packet saved"} · ${a.company}`,
        sub: a.role,
        id: a.id,
      })),
    )
    .concat(
      state.resumes.map((r) => ({
        at: r.updatedAt || r.createdAt,
        label: `${r.title}`,
        sub: "Résumé updated",
        resume: r.id,
      })),
    )
    .sort((a, b) => b.at.localeCompare(a.at))
    .slice(0, 5);
  return `<div class="date-line mono">${new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric", year: "numeric" }).toUpperCase()}</div><div class="page-heading"><div><h1>${greeting()}${state.profile.name ? ", " + e(state.profile.name.split(" ")[0]) : ""}.</h1><p>One clear view of your next chapter.</p></div>${button(icon("briefcase") + " View applications", "navigate", 'data-route="applications"')}</div>${!apps.length ? `<div class="welcome-banner"><div><div class="eyebrow" style="color:#7e97cc;margin-bottom:10px">LET'S GET THINGS MOVING</div><h3>Your next opportunity starts here.</h3><p>Add a role you're considering. Keep its posting, tailored résumé, and cover letter together from the very first draft.</p></div>${button("Add your first role " + icon("arrow"), "add-app", "", "primary")}</div>` : ""}<div class="metrics">${[
    [
      "Active applications",
      active.length,
      "In your current pipeline",
      "briefcase",
    ],
    [
      "Interviews",
      apps.filter((a) => a.status === "Interview").length,
      "Conversations in progress",
      "mail",
    ],
    [
      "Follow-ups due",
      due.length,
      due.length
        ? "A little nudge goes a long way"
        : "Nothing overdue. You’re all set.",
      "clock",
    ],
    [
      "Saved packets",
      apps.reduce((n, a) => n + (a.packets || []).length, 0),
      "A record of every chosen version",
      "file",
    ],
  ]
    .map(
      ([label, n, sub, i]) =>
        `<div class="card metric"><div class="label">${label}${icon(i)}</div><strong>${n}</strong><small>${sub}</small></div>`,
    )
    .join(
      "",
    )}</div><div class="dashboard-grid"><div class="stack"><section class="card pad"><div class="section-title"><h2>Your applications</h2><a class="text-link" style="font-size:10px" href="#applications">View all ${icon("arrow")}</a></div>${recent.length ? recent.map(appRow).join("") : empty("A clean slate. A clear next step.", "Add a role to start building its own application workspace.", button("Add application", "add-app", "", "primary"), "briefcase")}</section><section class="card pad"><div class="section-title"><h2>Your next steps</h2><a class="text-link" style="font-size:10px" href="#tasks">All tasks</a></div>${due
    .slice(0, 3)
    .map(
      (a) =>
        `<a href="#applications/${e(a.id)}" class="list-row"><div class="company-mark">${icon("clock")}</div><div class="list-main"><strong>${e(a.nextStep || "Follow up with " + a.company)}</strong><small>${e(a.company)} · ${e(a.role)}</small></div><span class="tag ${a.followUpOn < date() ? "red" : "amber"}">${a.followUpOn < date() ? "Overdue" : "Today"}</span></a>`,
    )
    .join(
      "",
    )}${open.slice(0, 4).map(taskRow).join("")}${!due.length && !open.length ? `<p class="help" style="padding:20px 0">Nothing waiting on you. Add a task or set a follow-up date on an application.</p>` : ""}<form class="inline-add" data-form="task" style="margin:16px 0 0"><label class="visually-hidden" for="quick-task">New task</label><input id="quick-task" name="text" required placeholder="Add a next step…"><button class="btn" type="submit" aria-label="Add task">${icon("plus")}</button></form></section></div><div class="stack"><section class="card pad"><div class="section-title"><h2>Recent activity</h2>${icon("clock")}</div>${events.length ? events.map((ev) => `<a href="#${ev.resume ? "documents/" + e(ev.resume) : "applications/" + e(ev.id)}" class="activity-row"><span class="activity-dot"></span><div><strong>${e(ev.label)}</strong><p>${e(ev.sub)} · ${relative(ev.at)}</p></div></a>`).join("") : `<p class="help" style="padding:15px 0">Your drafts, packets, and milestones will show up here as you go.</p>`}</section><section class="card pad"><div class="row between" style="margin-bottom:20px"><div class="callout-number">01 →</div>${icon("spark")}</div><h3 style="margin-bottom:10px">One base. A better fit<br>for every role.</h3><p class="help">Start with the facts. Tailor a copy with any AI assistant. Save the exact version you choose for each application.</p><div class="divider"></div><a href="#documents" class="text-link" style="font-size:11px">Open your documents ${icon("arrow")}</a></section></div></div><div class="footer-note">${icon("lock")}Private to this browser. Your files, your versions, your next move.</div>`;
}
function appRow(a) {
  return `<a href="#applications/${e(a.id)}" class="list-row"><div class="company-mark ${["Applied", "In review"].includes(a.status) ? "blue" : ""}">${e(initials(a.company))}</div><div class="list-main"><strong>${e(a.role)}</strong><small>${e(a.company)}${a.location ? " · " + e(a.location) : ""}</small></div>${pill(a.status)}<span class="muted">${relative(a.updatedAt || a.createdAt)}</span>${icon("arrow")}</a>`;
}
function appCard(a) {
  return `<article class="app-card" tabindex="0" role="link" data-action="open-app" data-id="${e(a.id)}" aria-label="Open ${e(a.role)} at ${e(a.company)}"><div class="row between"><div class="company-mark">${e(initials(a.company))}</div>${a.followUpOn && a.followUpOn < date() ? '<span class="tag red">Follow-up due</span>' : `<span class="tag">${e(trackName(a.track))}</span>`}</div><h3>${e(a.role)}</h3><p>${e(a.company)}</p><div class="tags">${pill(a.status)}${a.location ? `<span class="tag">${e(a.location)}</span>` : ""}</div><div class="app-card-bottom"><span>${relative(a.updatedAt || a.createdAt)}</span><span class="row" style="gap:5px">${icon("file")}${(a.packets || []).length} packets</span></div></article>`;
}
function applications() {
  let apps = state.applications
    .filter((a) => (showArchived ? !!a.archived : !a.archived))
    .filter(
      (a) =>
        (appStatus === "all" || a.status === appStatus) &&
        (appTrack === "all" || a.track === appTrack),
    );
  const groups = [
    ["Considering", ["Lead", "Drafted"], "amber"],
    ["In progress", ["Applied", "In review"], "blue"],
    ["Conversations", ["Interview", "Offer"], "green"],
    ["Closed", ["Closed"], ""],
  ];
  return `<div class="page-heading"><div><div class="eyebrow" style="color:#94a087;margin-bottom:12px">YOUR NEXT CHAPTER</div><h1>Applications</h1><p>Every role, with the right documents right beside it.</p></div>${button(icon("plus") + " Add role", "add-app", "", "primary")}</div><div class="toolbar"><div class="filters"><label><span class="visually-hidden">Filter by status</span><select id="status-filter">${options([{ id: "all", label: "All statuses" }, ...STATUSES.map((s) => ({ id: s, label: s }))], appStatus)}</select></label><label><span class="visually-hidden">Filter by role group</span><select id="track-filter">${options([{ id: "all", label: "All groups" }, ...state.profile.tracks], appTrack)}</select></label><label class="check-row" style="font-size:10px"><input type="checkbox" id="archive-filter" ${showArchived ? "checked" : ""}>Archived</label></div><div class="segmented" role="group" aria-label="Application view"><button data-action="view" data-view="board" class="${appView === "board" ? "active" : ""}" aria-pressed="${appView === "board"}">${icon("board")}Board</button><button data-action="view" data-view="list" class="${appView === "list" ? "active" : ""}" aria-pressed="${appView === "list"}">${icon("list")}List</button></div></div>${
    !apps.length
      ? `<div class="card">${empty(showArchived ? "No archived applications" : activeApps().length ? "No roles match these filters" : "Make room for what’s next.", activeApps().length ? "Try another status or group." : "Add a role and give its posting, documents, and next steps one place to live.", button("Add application", "add-app", "", "primary"), "briefcase")}</div>`
      : appView === "board"
        ? `<div class="board">${groups
            .map(([label, statuses, color]) => {
              const rows = apps.filter((a) => statuses.includes(a.status));
              return `<section class="board-column"><div class="column-head"><span><i class="stage-dot ${color}"></i>${label}</span><span>${rows.length}</span></div>${rows.map(appCard).join("")}${label === "Considering" ? `<button class="board-add" data-action="add-app">+ Add a role</button>` : ""}</section>`;
            })
            .join("")}</div>`
        : `<div class="card applications-table"><table><thead><tr><th>ROLE / COMPANY</th><th>STATUS</th><th>GROUP</th><th>FOLLOW-UP</th><th>PACKETS</th></tr></thead><tbody>${apps.map((a) => `<tr><td><a class="text-link" href="#applications/${e(a.id)}"><strong>${e(a.role)}</strong><small>${e(a.company)}</small></a></td><td>${pill(a.status)}</td><td>${e(trackName(a.track))}</td><td>${a.followUpOn ? pretty(a.followUpOn) : "—"}</td><td>${(a.packets || []).length}</td></tr>`).join("")}</tbody></table></div>`
  }<p class="help" style="margin-top:20px">${apps.length} ${apps.length === 1 ? "role" : "roles"} · Saving a packet never marks an application as submitted.</p>`;
}

function applicationDetail(id) {
  const a = appBy(id);
  if (!a)
    return empty(
      "Application not found",
      "The role may belong to another workspace.",
      button("Back to applications", "navigate", 'data-route="applications"'),
    );
  const r = resumeBy(a.resumeId),
    attrs = (field) =>
      `data-entity="app" data-id="${e(id)}" data-field="${field}"`;
  const appFields = `<div class="properties"><div class="property"><span>Status</span><select class="status-menu" aria-label="Application status" ${attrs("status")}>${options(STATUSES, a.status)}</select></div><div class="property"><span>Group</span><select class="status-menu" aria-label="Role group" ${attrs("track")}>${options(state.profile.tracks, a.track)}</select></div><div class="property"><span>Location</span><strong>${e(a.location || "Not specified")}</strong></div><div class="property"><span>Compensation</span><strong>${e(a.salary || "Not recorded")}</strong></div><div class="property"><span>Applied</span><strong>${a.appliedOn ? pretty(a.appliedOn) : ["Lead", "Drafted"].includes(a.status) ? "Not submitted yet" : "Date not recorded"}</strong></div><div class="property"><span>Last contact</span><strong>${a.lastContact ? pretty(a.lastContact) : "Not recorded"}</strong></div>${a.deadline ? `<div class="property"><span>Deadline</span><strong>${pretty(a.deadline)}</strong></div>` : ""}</div>`;
  let body = "";
  if (selectedTab === "overview")
    body = `<div class="detail-grid"><div class="stack"><section class="card pad"><div class="panel-title"><h3>Your next step</h3>${icon("flag")}</div><div class="stack">${field("What happens next?", "nextStep", a.nextStep, "text", attrs("nextStep") + ' placeholder="e.g. Follow up with the hiring team"')}${field("Follow-up date", "followUpOn", a.followUpOn, "date", attrs("followUpOn"))}</div></section><section class="card pad"><div class="panel-title"><h3>Role description</h3>${external(a.url, "Original posting")}</div>${area("Keep the posting here for tailoring", "posting", a.posting, attrs("posting") + ' class="small-textarea" style="min-height:260px" placeholder="Paste the full role description…"')}</section><section class="card pad"><div class="panel-title"><h3>Notes & conversations</h3>${icon("file")}</div>${area("Your notes", "notes", a.notes, attrs("notes") + ' class="small-textarea" placeholder="People, conversations, useful context…"')}</section></div><div class="stack"><section class="card pad"><div class="panel-title"><h3>Application details</h3>${button("Edit", "edit-app", `data-id="${e(id)}"`, "small ghost")}</div>${appFields}</section><section class="card pad"><div class="panel-title"><h3>Your application kit</h3>${icon("briefcase")}</div><div class="list-row"><div class="document-icon">${icon("file")}</div><div class="list-main"><strong>${r ? e(r.title) : "Choose a résumé"}</strong><small>${r ? "Working copy linked to this role" : "Start with a base, tailor a copy"}</small></div></div><div class="list-row"><div class="document-icon">${icon("mail")}</div><div class="list-main"><strong>${a.coverLetter?.trim() ? "Cover letter drafted" : "Add a cover letter"}</strong><small>${a.coverLetter?.trim() ? a.coverLetter.trim().split(/\s+/).length + " words" : "Keep it alongside your résumé"}</small></div></div><div style="margin-top:20px">${button("Work on documents " + icon("arrow"), "role-tab", 'data-tab="documents"', "", "")}</div></section><section class="card pad"><h3 style="margin-bottom:10px">Keep the version you choose.</h3><p class="help">A saved packet captures your résumé, letter, and attached files. Later edits won't change it.</p><div style="margin-top:18px">${button("Save ready packet", "packet", `data-id="${e(id)}"`, "small")}</div></section></div></div>`;
  if (selectedTab === "documents")
    body = `<div class="detail-grid"><div class="stack"><section class="card pad"><div class="panel-title"><h3>Résumé for this role</h3><span class="tag blue">${r ? "Working draft" : "Start here"}</span></div>${r ? `<div class="doc-header"><div><strong style="font-size:13px">${e(r.title)}</strong><p class="help">${r.applicationId === id ? "A separate copy for this application." : "Linked from your document library. Create a role copy to tailor it."}</p></div></div><div class="editor-tools">${r.applicationId === id ? button(icon("spark") + " Tailor with AI", "ai", `data-id="${e(id)}" data-kind="resume"`) : button(icon("copy") + " Create role copy", "tailor", `data-id="${e(id)}"`)}${button(icon("down") + " Download PDF", "resume-pdf", `data-id="${e(r.id)}"`)}<a class="btn small" href="#documents/${e(r.id)}">Version history</a>${button("Change résumé", "choose-resume", `data-id="${e(id)}"`)}</div>${r.applicationId === id ? `<label class="field"><span class="visually-hidden">Role résumé text</span><textarea class="editor-area" data-entity="resume" data-id="${e(r.id)}" data-field="text">${e(r.text)}</textarea></label>` : `<div class="compare-box" style="max-height:300px">${e(r.text)}</div>`}` : empty("Give this role its own copy.", "Choose a base résumé. We’ll create a separate draft so your original stays intact.", button("Choose a résumé", "tailor", `data-id="${e(id)}"`, "primary"), "file")}</section><section class="card pad"><div class="panel-title"><h3>Cover letter</h3><span class="tag">${a.coverLetter?.trim() ? a.coverLetter.trim().split(/\s+/).length + " words" : "Optional"}</span></div><div class="editor-tools">${button(icon("spark") + " Draft with AI", "ai", `data-id="${e(id)}" data-kind="letter"`)}${button(icon("clock") + " Version history", "letter-history", `data-id="${e(id)}"`)}${a.coverLetter?.trim() ? button(icon("down") + " Download PDF", "letter-pdf", `data-id="${e(id)}"`) : ""}${a.coverLetter?.trim() ? button(icon("copy") + " Copy letter", "copy-letter", `data-id="${e(id)}"`) : ""}</div><label class="field"><span class="visually-hidden">Cover letter text</span><textarea class="editor-area" style="min-height:300px" ${attrs("coverLetter")} placeholder="Write your letter here, or bring a draft from your preferred AI assistant.">${e(a.coverLetter || "")}</textarea></label><p class="help" style="margin-top:12px">Changes save as you type. Save a packet to preserve this exact letter with its résumé.</p></section></div><div class="stack"><section class="card pad"><div class="panel-title"><h3>Files for this role</h3>${icon("file")}</div><p class="help" style="margin-bottom:15px">Keep the actual files here, including the PDF or Word versions you send.</p><label class="upload-zone" style="padding:20px">${icon("upload")}<strong>Add files</strong><small>Up to 20 MB each · stored on this device</small><input type="file" multiple data-attach="${e(id)}" aria-label="Add application files"></label>${(a.attachments || []).map((f) => fileRow(f, id)).join("")}</section><section class="card pad"><h3 style="margin-bottom:12px">Ready for the next step?</h3><p class="help">Save a ready packet for your records. When you've actually applied, record the submission separately.</p><div class="stack" style="gap:10px;margin-top:20px">${button("Save ready packet", "packet", `data-id="${e(id)}"`)}${button("Record submission", "submit-role", `data-id="${e(id)}"`, "primary")}</div></section></div></div>`;
  if (selectedTab === "history")
    body = `<div class="detail-grid"><section><div class="section-title"><h2>Saved application packets</h2><small>${(a.packets || []).length} saved</small></div>${
      a.packets?.length
        ? a.packets
            .slice()
            .reverse()
            .map(
              (p) =>
                `<div class="card packet-card"><div class="row between"><strong>${p.kind === "submitted" ? "Submission record" : "Ready packet"}</strong><span class="tag ${p.kind === "submitted" ? "green" : "blue"}">${p.kind === "submitted" ? "Recorded as sent" : "Saved only"}</span></div><p>${pretty(p.submittedOn || p.at)} · ${p.resume ? "Résumé" : "No résumé text"}${p.coverLetter ? " + cover letter" : ""} · ${(p.attachmentIds || []).length} files</p>${p.note ? `<p style="margin-top:8px">${e(p.note)}</p>` : ""}<div class="row" style="margin-top:16px">${button("View packet", "view-packet", `data-id="${e(id)}" data-packet="${e(p.id)}"`, "small")}${button(icon("down") + " Export packet", "export-packet", `data-id="${e(id)}" data-packet="${e(p.id)}"`, "small ghost")}</div></div>`,
            )
            .join("")
        : `<div class="card">${empty("The exact version, kept safe.", "Save a packet when your documents are ready. Each snapshot remains unchanged when you edit a later draft.", button("Save ready packet", "packet", `data-id="${e(id)}"`, "primary"), "file")}</div>`
    }</section><div class="card pad" style="align-self:start"><h3 style="margin-bottom:12px">A record you can trust.</h3><p class="help">Ready packets mean the documents were saved. Submission records mean you reported sending them. The app never applies for you.</p><div class="divider"></div><p class="help">Attached file copies are retained even if you remove them from the current working kit.</p></div></div>`;
  return `<a class="back-link" href="#applications">${icon("back")}All applications</a><div class="page-heading role-heading"><div class="role-title"><div class="company-mark blue">${e(initials(a.company))}</div><div><h1>${e(a.role)}</h1><p>${e(a.company)}${a.location ? " · " + e(a.location) : ""}${a.archived ? " · Archived" : ""}</p></div></div><div class="row">${button(icon("archive") + (a.archived ? " Restore role" : " Archive"), "archive", `data-id="${e(id)}"`, "small")}${button("Record submission " + icon("arrow"), "submit-role", `data-id="${e(id)}"`, "primary small")}</div></div><div class="tabs" role="tablist" aria-label="Application sections">${[
    ["overview", "Overview"],
    ["documents", "Documents"],
    ["history", "Saved packets"],
  ]
    .map(
      ([k, l]) =>
        `<button role="tab" aria-selected="${selectedTab === k}" class="${selectedTab === k ? "active" : ""}" data-action="role-tab" data-tab="${k}">${l}</button>`,
    )
    .join("")}</div>${body}`;
}
function fileRow(f, appId = "", frozen = false) {
  return `<div class="file-item">${icon("file")}<div><strong>${e(f.name)}</strong><small>${Math.ceil(f.size / 1024)} KB · ${pretty(f.at)}</small></div><button class="icon-btn" data-action="file-download" data-file="${e(f.id)}" data-name="${e(f.name)}" aria-label="Download ${e(f.name)}">${icon("down")}</button>${appId && !frozen ? `<button class="icon-btn" data-action="file-remove" data-id="${e(appId)}" data-file="${e(f.id)}" aria-label="Remove ${e(f.name)} from working kit">${icon("close")}</button>` : ""}</div>`;
}

function documents() {
  return `<div class="page-heading"><div><div class="eyebrow" style="color:#94a087;margin-bottom:12px">A HOME FOR EVERY VERSION</div><h1>Documents</h1><p>Your base résumés and the copies you've made for each role.</p></div>${button(icon("plus") + " Add résumé", "new-resume", "", "primary")}</div>${state.resumes.length ? `<div class="document-grid">${state.resumes.map((r) => `<article class="card document-card"><div class="row between"><div class="document-icon">${icon("file")}</div><span class="tag ${r.applicationId ? "blue" : ""}">${r.applicationId ? "Role copy" : "Base résumé"}</span></div><h3>${e(r.title)}</h3><p>${e(trackName(r.track))}</p><div class="snippet">${e(r.text || "Add résumé text to get started.")}</div><div class="doc-bottom"><small>${(r.versions || []).length} versions · ${relative(r.updatedAt || r.createdAt)}</small><a class="btn small" href="#documents/${e(r.id)}">Open ${icon("arrow")}</a></div></article>`).join("")}</div>` : `<div class="card">${empty("Start with your experience.", "Import a résumé or paste its text. Keep a verified base, then tailor a separate copy for each role.", button("Add your résumé", "new-resume", "", "primary"), "file")}</div>`}${state.materials?.length ? `<section class="card pad" style="margin-top:25px"><div class="section-title"><h2>Earlier workspace materials</h2><small>Preserved from your previous workspace</small></div>${state.materials.map((m) => `<div class="list-row"><div class="document-icon">${icon("file")}</div><div class="list-main"><strong>${e(m.title || m.kind || "Material")}</strong><small>${e(m.note || m.subtitle || "Saved material")}</small>${m.text ? `<details style="font-size:11px;margin-top:8px"><summary>View saved text</summary><pre style="white-space:pre-wrap;overflow-wrap:anywhere">${e(m.text)}</pre></details>` : ""}</div>${external(m.primary?.url, "Open")}</div>`).join("")}</section>` : ""}`;
}
function documentEditor(id) {
  const r = resumeBy(id);
  if (!r)
    return empty(
      "Document not found",
      "Choose another document from your library.",
      button("Open documents", "navigate", 'data-route="documents"'),
    );
  return `<a class="back-link" href="#documents">${icon("back")}All documents</a><div class="page-heading"><div><h1>${e(r.title)}</h1><p>${r.applicationId ? "A copy tailored for one role. Your base stays unchanged." : "Your verified starting point. Tailor a separate copy for applications."}</p></div><span class="tag ${r.applicationId ? "blue" : ""}">${r.applicationId ? "Role copy" : "Base résumé"}</span></div><div class="history-grid"><section class="card pad"><div class="doc-header"><h3>Résumé text</h3>${saveBadge()}</div><div class="editor-tools">${button(icon("down") + " Download PDF", "resume-pdf", `data-id="${e(id)}"`)}${button("Download text", "resume-text", `data-id="${e(id)}"`)}${button(icon("copy") + " Duplicate", "duplicate-resume", `data-id="${e(id)}"`)}${button("Rename", "rename-resume", `data-id="${e(id)}"`)}</div><label class="field"><span class="visually-hidden">Résumé text</span><textarea class="editor-area" style="min-height:600px" data-entity="resume" data-id="${e(id)}" data-field="text" placeholder="Paste your résumé text…">${e(r.text)}</textarea></label><p class="help" style="margin-top:14px">An earlier copy is saved before you start editing. Save a named version at a milestone.</p>${r.applicationId ? `<a class="text-link" style="font-size:12px;display:inline-block;margin-top:15px" href="#applications/${e(r.applicationId)}">Back to the application ${icon("arrow")}</a>` : ""}</section><section class="card pad" style="align-self:start"><h3 style="margin-bottom:15px">Version history</h3><form class="stack" style="gap:10px" data-form="version" data-id="${e(id)}">${field("Version note", "note", "", "text", 'placeholder="e.g. Shorter summary"')}<button class="btn" type="submit">Save named version</button></form><div class="divider"></div><div class="version-list">${
    (r.versions || [])
      .slice()
      .reverse()
      .map(
        (v) =>
          `<div class="version-item"><strong>${e(v.note || "Saved version")}</strong><small>${pretty(v.at)}</small>${button("Preview & restore", "version-preview", `data-id="${e(id)}" data-version="${e(v.id)}"`, "small ghost")}</div>`,
      )
      .join("") || '<p class="help">Your saved versions will appear here.</p>'
  }</div></section></div>`;
}
function taskRow(t) {
  return `<div class="task-row ${t.done ? "done" : ""}"><input type="checkbox" data-task="${e(t.id)}" ${t.done ? "checked" : ""} aria-label="Mark ${e(t.text)} ${t.done ? "incomplete" : "complete"}"><div><strong>${e(t.text)}</strong><small>${t.dueOn ? `Due ${pretty(t.dueOn)}` : "No due date"}${t.applicationId && appBy(t.applicationId) ? ` · <a href="#applications/${e(t.applicationId)}">${e(appBy(t.applicationId).company)}</a>` : ""}</small></div>${t.dueOn && t.dueOn < date() && !t.done ? '<span class="tag red">Overdue</span>' : ""}<button class="icon-btn" data-action="edit-task" data-id="${e(t.id)}" aria-label="Edit task">${icon("more")}</button></div>`;
}
function tasks() {
  const rows = state.tasks.filter(
    (t) => taskFilter === "all" || (taskFilter === "done" ? t.done : !t.done),
  );
  return `<div class="page-heading"><div><h1>A little progress, every day.</h1><p>Small next steps. One place to keep them.</p></div>${button(icon("plus") + " Add task", "add-task", "", "primary")}</div><div class="toolbar"><div class="segmented">${[
    ["open", "To do"],
    ["done", "Completed"],
    ["all", "All tasks"],
  ]
    .map(
      ([k, l]) =>
        `<button data-action="task-filter" data-filter="${k}" class="${taskFilter === k ? "active" : ""}">${l}</button>`,
    )
    .join(
      "",
    )}</div><small>${rows.length} tasks</small></div><section class="card pad">${
    rows.length
      ? rows
          .sort((a, b) => (a.dueOn || "9999").localeCompare(b.dueOn || "9999"))
          .map(taskRow)
          .join("")
      : empty(
          "A little breathing room.",
          "Add your next step: a follow-up, a document revision, or a conversation to prepare for.",
          button("Add a task", "add-task"),
          "tasks",
        )
  }</section>`;
}
function settings() {
  const p = state.profile;
  return `<div class="page-heading"><div><h1>Your workspace, your way.</h1><p>Everything from setup lives here. No configuration files required.</p></div></div><div class="settings-grid"><form class="card pad" data-form="settings"><h3>Profile & preferences</h3><p class="help">Used in your workspace and writing prompts. The résumé text remains the source of truth.</p><div class="form-grid">${field("Workspace name", "workspaceName", p.workspaceName, "text", 'required maxlength="80"')}${field("Your name", "name", p.name)}${field("Email", "email", p.email, "email")}${field("Location", "location", p.location)}<div class="wide">${field("Professional headline", "headline", p.headline)}</div><div class="wide">${field("Role groups · separate with commas", "tracks", p.tracks.map((t) => t.label).join(", "))}</div><div class="wide">${area("Writing preferences", "writingPreferences", p.writingPreferences)}</div><div class="wide">${area("Claims to exclude · one per line", "retiredClaims", (p.retiredClaims || []).join("\n"), 'placeholder="Any phrases or metrics that should not be reused"')}</div></div><div class="modal-actions"><button class="btn primary" type="submit">Save preferences</button></div></form><div class="stack"><section class="card pad"><div class="panel-title"><h3>Your data stays yours.</h3>${icon("lock")}</div><p class="help">Stored privately in this browser profile. It isn't synced across devices. A backup includes your documents, history, and attached files.</p><div class="stack" style="gap:10px;margin-top:22px">${button(icon("down") + " Export full backup", "backup", "", "primary")}${button(icon("upload") + " Restore / merge a backup", "restore")}</div><div class="divider"></div><p class="help">${state.lastBackupAt ? "Last backup: " + pretty(state.lastBackupAt) : "No backup exported yet. Make one before clearing site data or switching devices."}</p></section><section class="card pad"><h3 style="margin-bottom:12px">Use any AI assistant.</h3><p class="help">Copy a prompt, work in your chosen assistant, then bring the draft back for review. Nothing is sent to an AI service from this app.</p><div class="divider"></div><a class="text-link" style="font-size:11px" href="SKILL.md" download="SKILL.md">${icon("down")}Get the standalone skill</a><p class="help" style="margin-top:10px">Prefer files and folders? The skill runs the same organizing workflow without this app.</p></section>${state.legacy ? `<section class="card pad"><h3 style="margin-bottom:10px">Your earlier workspace</h3><p class="help">Imported records and original collections are preserved in the full backup. Your original browser keys remain untouched.</p></section>` : ""}</div></div>`;
}

function applicationModal(id) {
  const a = appBy(id) || {};
  modal(
    id ? "Edit application" : "A new possibility.",
    "Start with the role. The rest can come together as you go.",
    `<form data-form="application" data-id="${e(id || "")}"><div class="form-grid">${field('Organization <span class="required">*</span>', "company", a.company, "text", 'required autofocus maxlength="180"')}${field('Role title <span class="required">*</span>', "role", a.role, "text", 'required maxlength="180"')}${select("Role group", "track", state.profile.tracks, a.track || state.profile.tracks[0]?.id)}${field("Location / work style", "location", a.location, "text", 'placeholder="Remote, hybrid, or a location"')}<div class="wide">${field("Posting URL", "url", a.url, "url", 'placeholder="https://…"')}</div>${field("Compensation / range", "salary", a.salary)}${field("Application deadline", "deadline", a.deadline, "date")}${id ? field("Applied on · only if already sent", "appliedOn", a.appliedOn, "date") : ""}${id ? field("Last real contact", "lastContact", a.lastContact, "date") : ""}<div class="wide">${area("Role description", "posting", a.posting, 'placeholder="Paste the posting now or add it later"')}</div></div><div class="modal-actions">${button("Cancel", "close")}<button class="btn primary" type="submit">${id ? "Save changes" : "Create application " + icon("arrow")}</button></div></form>`,
  );
}
function resumeModal() {
  modal(
    "Start with your résumé.",
    "Import the document you already have, or paste its text.",
    `<form data-form="resume"><div class="stack">${field("Document title", "title", "Base résumé", "text", "required")}<label class="upload-zone">${icon("upload")}<strong>Import PDF, Word, text or Markdown</strong><small>Up to 20 MB · review imported text below</small><input type="file" id="resume-file" accept=".pdf,.docx,.txt,.md,.json" aria-label="Import résumé"></label>${area("Résumé text", "text", "", 'id="resume-modal-text" required placeholder="Paste your verified résumé here…"')}<p id="resume-import-note" class="help"></p>${select("Role group", "track", state.profile.tracks, state.profile.tracks[0]?.id)}</div><div class="modal-actions">${button("Cancel", "close")}<button class="btn primary" type="submit">Save base résumé</button></div></form>`,
  );
}
function chooseResume(appId, copy = true) {
  if (!state.resumes.length) {
    toast("Add a base résumé first, then return to this application.");
    go("documents");
    resumeModal();
    return;
  }
  modal(
    copy ? "Make a copy for this role." : "Choose a résumé.",
    "Your original stays intact. The role copy gets its own history.",
    `<form data-form="choose-resume" data-id="${e(appId)}" data-copy="${copy}">${select(
      "Start from",
      "resumeId",
      state.resumes.map((r) => ({
        id: r.id,
        label: r.title + (r.applicationId ? " · role copy" : " · base"),
      })),
      appBy(appId).resumeId || state.resumes[0].id,
    )}<div class="modal-actions">${button("Cancel", "close")}<button class="btn primary" type="submit">${copy ? "Create role copy" : "Link this résumé"}</button></div></form>`,
  );
}

function packetModal(appId, submitted = false) {
  const a = appBy(appId),
    r = resumeBy(a.resumeId);
  if (!r?.text?.trim() && !a.coverLetter?.trim() && !a.attachments?.length) {
    toast("Add a résumé, a letter, or the actual files first.");
    selectedTab = "documents";
    render();
    return;
  }
  modal(
    submitted ? "Record what you sent." : "Keep this exact version.",
    "This saves a snapshot. It does not submit anything to an employer.",
    `<form data-form="packet" data-id="${e(appId)}" data-submitted="${submitted}"><div class="notice blue" style="margin-bottom:20px"><strong>${e(a.company)} · ${e(a.role)}</strong><br>${r ? e(r.title) : "No résumé text"}${a.coverLetter?.trim() ? " + cover letter" : ""} · ${(a.attachments || []).length} attached files</div><div class="stack">${submitted ? field("When did you submit?", "submittedOn", date(), "date", 'required max="' + date() + '"') : ""}${field('Packet note <span class="muted">(optional)</span>', "note", "", "text", 'placeholder="e.g. Short résumé + tailored letter"')}<label class="check-row"><input type="checkbox" required>I reviewed the chosen résumé and any attached files.</label><label class="check-row"><input type="checkbox" required>${a.coverLetter?.trim() ? "I reviewed the letter and checked the organization and role." : "I am intentionally saving this without cover letter text."}</label>${submitted ? '<label class="check-row"><input type="checkbox" required>I confirm these are the documents I actually submitted.</label>' : ""}</div><div class="modal-actions">${button("Cancel", "close")}<button class="btn primary" type="submit">${submitted ? "Save submission record" : "Save ready packet"}</button></div></form>`,
  );
}

function aiModal(appId, kind) {
  const a = appBy(appId),
    r = resumeBy(a.resumeId);
  if (!r?.text?.trim()) {
    toast("Choose a résumé with verified text before using the AI workflow.");
    selectedTab = "documents";
    render();
    return;
  }
  if (kind === "resume" && r.applicationId !== appId) {
    chooseResume(appId);
    return;
  }
  modalContext = {
    kind,
    appId,
    resumeId: r.id,
    base: kind === "resume" ? r.text : a.coverLetter || "",
    step: 1,
  };
  modal(
    kind === "resume"
      ? "A better fit. Same facts."
      : "A letter with something to say.",
    "Use the AI assistant you already prefer. Review everything before saving.",
    `<div class="notice blue" style="margin-bottom:20px">1. Copy the prompt → 2. Work in your assistant → 3. Bring back the draft</div>${area("What would you like to adjust?", "request", "", 'id="ai-request" placeholder="e.g. Tighten the summary and emphasize the most relevant experience"')}<div class="row" style="margin:15px 0">${button(icon("copy") + " Copy prompt", "ai-copy", "", "primary")}${button("Show prompt", "ai-show", "", "ghost small")}</div><textarea id="ai-prompt" class="prompt-box" readonly hidden aria-label="AI prompt"></textarea><div class="divider"></div>${area("Paste the proposed " + (kind === "resume" ? "résumé" : "letter") + " only", "proposal", "", 'id="ai-proposal" placeholder="Paste the draft from your assistant here. Keep its separate notes or questions out of the document."')}<p class="help" style="margin-top:10px">No changes are applied yet. Your base facts and saved packets remain untouched.</p><div class="modal-actions">${button("Cancel", "close")}${button("Review changes " + icon("arrow"), "ai-review", "", "primary")}</div>`,
    true,
  );
}
function aiPrompt() {
  const c = modalContext,
    a = appBy(c.appId),
    r = resumeBy(c.resumeId),
    args = {
      profile: state.profile,
      resume: r,
      application: a,
      request: document.querySelector("#ai-request")?.value || "",
    };
  return c.kind === "resume"
    ? buildTailoringPrompt(args)
    : buildCoverLetterPrompt(args);
}
function reviewAI() {
  const c = modalContext,
    proposed = document.querySelector("#ai-proposal").value.trim();
  if (!proposed) {
    toast("Paste a proposed draft first.");
    return;
  }
  const current =
    c.kind === "resume"
      ? resumeBy(c.resumeId)?.text
      : appBy(c.appId)?.coverLetter || "";
  if (current !== c.base) {
    toast(
      "This document changed. Start a fresh review so you keep the latest edits.",
      true,
    );
    return;
  }
  const excluded = (state.profile.retiredClaims || []).filter(
    (s) => s && proposed.toLowerCase().includes(s.toLowerCase()),
  );
  c.proposed = proposed;
  c.step = 2;
  modal(
    "Review before you save.",
    "Check factual names, dates, claims, and the organization. Changes stay drafts until you record a submission.",
    `${excluded.length ? `<div class="notice red" style="margin-bottom:15px">This draft includes excluded claims: ${e(excluded.join("; "))}. Edit the draft before saving.</div>` : ""}<div class="compare-grid"><div><span class="compare-label">CURRENT VERSION · ${c.base.trim() ? c.base.trim().split(/\s+/).length : 0} WORDS</span><div class="compare-box">${e(c.base || "No letter drafted yet.")}</div></div><div><span class="compare-label">PROPOSED VERSION · ${proposed.split(/\s+/).length} WORDS</span><div class="compare-box proposed">${e(proposed)}</div></div></div><form data-form="ai-apply"><div style="margin-top:20px">${field("Note for this revision", "note", "", "text", 'placeholder="e.g. Emphasized relevant experience"')}</div><label class="check-row" style="margin-top:15px"><input type="checkbox" required>I checked this draft against my real experience.</label><div class="modal-actions">${button("Back to draft", "ai-back")}<button class="btn primary" type="submit" ${excluded.length ? "disabled" : ""}>Save reviewed draft</button></div></form>`,
    true,
  );
}

function saveLetterVersion(a, note) {
  const v = {
    id: uid("letter-version"),
    text: a.coverLetter || "",
    note,
    at: at(),
  };
  (a.letterVersions ||= []).push(v);
  return v;
}
function letterHistory(id) {
  const a = appBy(id);
  modal(
    "Cover letter history.",
    "Keep milestones and return to an earlier draft without losing your current copy.",
    `<form data-form="letter-version" data-id="${e(id)}"><div class="row" style="align-items:flex-end">${field("Note for this version", "note", "", "text", 'placeholder="e.g. Shorter opening"')}<button type="submit" class="btn primary">Save version</button></div></form><div class="divider"></div>${
      (a.letterVersions || [])
        .slice()
        .reverse()
        .map(
          (v) =>
            `<div class="version-item"><strong>${e(v.note || "Saved letter")}</strong><small>${pretty(v.at)}</small>${button("Preview & restore", "letter-preview", `data-id="${e(id)}" data-version="${e(v.id)}"`, "small ghost")}</div>`,
        )
        .join("") ||
      '<p class="help">Named versions and earlier drafts will appear here.</p>'
    }`,
    true,
  );
}
function taskModal(id) {
  const t = state.tasks.find((t) => t.id === id) || {};
  modal(
    id ? "Update next step." : "One small next step.",
    "Keep the things you want to follow through on in one place.",
    `<form data-form="task" data-id="${e(id || "")}"><div class="stack">${field("Task", "text", t.text, "text", "required")}${field('Due date <span class="muted">(optional)</span>', "dueOn", t.dueOn, "date")}${select("Related application", "applicationId", [{ id: "", label: "No application" }, ...activeApps().map((a) => ({ id: a.id, label: a.company + " · " + a.role }))], t.applicationId || "")}</div><div class="modal-actions">${button("Cancel", "close")}<button class="btn primary" type="submit">Save task</button></div></form>`,
  );
}
function tracksFrom(text) {
  const labels = [
    ...new Set(
      text
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
    ),
  ];
  if (!labels.length) labels.push("General");
  const p = state.profile;
  const used = new Set(
    [...state.resumes, ...state.applications].map((x) => x.track),
  );
  const next = labels.map((label, i) => {
    const match = p.tracks.find(
      (t) => t.label.toLowerCase() === label.toLowerCase(),
    );
    if (match) return { ...match, label };
    const prior = p.tracks[i];
    return prior &&
      !labels.some((l) => l.toLowerCase() === prior.label.toLowerCase())
      ? { ...prior, label }
      : { id: uid("group"), label };
  });
  for (const t of p.tracks)
    if (used.has(t.id) && !next.some((n) => n.id === t.id)) next.push(t);
  return next;
}
async function copy(text) {
  try {
    await navigator.clipboard.writeText(text);
    toast("Copied. Ready for your assistant.");
  } catch {
    const target = document.querySelector("#ai-prompt");
    if (target) {
      target.hidden = false;
      target.value = text;
      target.focus();
      target.select();
      toast("Select and copy the prompt below.");
    } else
      modal(
        "Copy text",
        "Select the text below to copy it.",
        `<textarea class="prompt-box" readonly>${e(text)}</textarea>`,
      );
  }
}
async function downloadBlob(blob, name) {
  const url = URL.createObjectURL(blob),
    a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 3000);
}
async function backup() {
  if (!persist()) return;
  const data = await exportBackup(state);
  data.state.lastBackupAt = at();
  await downloadBlob(
    new Blob([JSON.stringify(data)], { type: "application/json" }),
    "unmplyd-backup-" + date() + ".json",
  );
  state.lastBackupAt = data.state.lastBackupAt;
  persist();
  toast("Full backup downloaded, including files and history.");
  if (route()[0] === "settings") render();
}
function restoreModal() {
  modal(
    "Bring your workspace with you.",
    "Restore a full backup. Existing records stay intact; conflicting records become separate copies.",
    `<form data-form="restore"><label class="field"><span>Workspace backup</span><input type="file" name="backup" accept=".json" required></label><p class="help" style="margin-top:15px">Only restore backups you trust. Attached files and saved packets are included. Importing does not delete your current workspace.</p><div class="modal-actions">${button("Cancel", "close")}<button class="btn primary" type="submit">Restore backup</button></div></form>`,
  );
}

root.addEventListener("input", onInput);
dialog.addEventListener("input", onInput);
function onInput(event) {
  const t = event.target;
  if (t.dataset.profile) {
    state.profile[t.dataset.profile] = t.value;
    schedule();
  }
  if (t.hasAttribute("data-onboard-resume")) {
    state.onboardingResume = t.value;
    schedule();
  }
  if (t.dataset.entity) {
    const item =
      t.dataset.entity === "resume"
        ? resumeBy(t.dataset.id)
        : appBy(t.dataset.id);
    if (!item) return;
    if (
      t.dataset.entity === "resume" &&
      t.dataset.field === "text" &&
      !edited.has(item.id)
    ) {
      snapshotResume(item, "Before editing");
      edited.add(item.id);
    }
    if (
      t.dataset.entity === "app" &&
      t.dataset.field === "coverLetter" &&
      !edited.has("letter-" + item.id)
    ) {
      if (item.coverLetter?.trim()) saveLetterVersion(item, "Before editing");
      edited.add("letter-" + item.id);
    }
    item[t.dataset.field] = t.value;
    item.updatedAt = at();
    schedule();
  }
}
root.addEventListener("change", onChange);
dialog.addEventListener("change", onChange);
async function onChange(event) {
  const t = event.target;
  try {
    if (t.id === "status-filter") {
      appStatus = t.value;
      render();
    }
    if (t.id === "track-filter") {
      appTrack = t.value;
      render();
    }
    if (t.id === "archive-filter") {
      showArchived = t.checked;
      render();
    }
    if (t.dataset.task) {
      const task = state.tasks.find((x) => x.id === t.dataset.task);
      task.done = t.checked;
      persist();
      render();
    }
    if (t.id === "onboard-file" || t.id === "resume-file") {
      const file = t.files[0];
      if (!file) return;
      t.disabled = true;
      toast("Reading your document…");
      try {
        const imported = await parseResumeFile(file);
        if (t.id === "onboard-file") {
          state.onboardingResume = imported.text;
          persist();
          document.querySelector("[data-onboard-resume]").value = imported.text;
          document.querySelector("#import-note").textContent =
            imported.warning || "Text imported. Review it before continuing.";
        } else {
          document.querySelector("#resume-modal-text").value = imported.text;
          document.querySelector("#resume-import-note").textContent =
            imported.warning || "Text imported. Review it before saving.";
        }
        toast("Document imported. Review the extracted text.");
      } finally {
        t.disabled = false;
        t.value = "";
      }
    }
    if (t.dataset.attach) {
      const a = appBy(t.dataset.attach);
      for (const file of t.files) {
        if (file.size > 20 * 1024 * 1024) {
          toast(file.name + " is larger than 20 MB.", true);
          continue;
        }
        const meta = await addFile(file);
        (a.attachments ||= []).push(meta);
      }
      a.updatedAt = at();
      if (persist()) {
        toast("Files saved with this role.");
        render();
      }
    }
  } catch (error) {
    toast(error.message, true);
  }
}

document.addEventListener("click", async (event) => {
  const b = event.target.closest("[data-action]");
  if (!b) return;
  const action = b.dataset.action,
    id = b.dataset.id;
  try {
    if (action === "reload-latest") {
      allowExit = true;
      location.reload();
      return;
    }
    if (action === "backup-copy") {
      const data = await exportBackup(state);
      downloadText(
        "unmplyd-unsaved-copy-" + date() + ".json",
        JSON.stringify(data),
      );
      return;
    }
    if (action === "close") {
      closeDialog();
      return;
    }
    if (action === "navigate") {
      go(b.dataset.route);
      return;
    }
    if (action === "menu") {
      document.querySelector(".sidebar").classList.add("open");
      document.querySelector(".mobile-overlay").classList.add("show");
      return;
    }
    if (action === "menu-close") {
      document.querySelector(".sidebar").classList.remove("open");
      document.querySelector(".mobile-overlay").classList.remove("show");
      return;
    }
    if (action === "demo") {
      const response = await fetch("examples/workspace-backup.json");
      if (!response.ok) throw Error("The example workspace could not load.");
      state = await importBackup(await response.json(), state);
      if (persist()) {
        render();
        toast(
          "Sample workspace loaded. These are placeholders, not real applications.",
        );
      }
      return;
    }
    if (action === "onboard-next") {
      state.onboardingStep = Math.min(2, (state.onboardingStep || 0) + 1);
      persist();
      render();
    }
    if (action === "onboard-back") {
      state.onboardingStep = Math.max(0, (state.onboardingStep || 0) - 1);
      persist();
      render();
    }
    if (action === "onboard-finish") {
      state.profile.tracks = tracksFrom(
        document.querySelector("#onboard-tracks").value,
      );
      if (state.onboardingResume?.trim()) {
        const r = {
          id: uid("resume"),
          title: "Base résumé",
          text: state.onboardingResume.trim(),
          track: state.profile.tracks[0].id,
          createdAt: at(),
          updatedAt: at(),
          versions: [],
        };
        snapshotResume(r, "Imported base résumé");
        state.resumes.push(r);
      }
      state.onboardingComplete = true;
      delete state.onboardingResume;
      delete state.onboardingStep;
      if (persist()) {
        location.hash = "overview";
        render();
      }
    }
    if (action === "add-app") applicationModal();
    if (action === "edit-app") applicationModal(id);
    if (action === "open-app") {
      selectedTab = "overview";
      go("applications/" + id);
    }
    if (action === "role-tab") {
      selectedTab = b.dataset.tab;
      persist();
      render();
    }
    if (action === "view") {
      appView = b.dataset.view;
      localStorage.setItem("unmplyd:view", appView);
      render();
    }
    if (action === "archive") {
      const a = appBy(id);
      a.archived = !a.archived;
      a.updatedAt = at();
      persist();
      toast(
        a.archived
          ? "Application archived. Its packets and files stay intact."
          : "Application restored.",
      );
      go("applications");
    }
    if (action === "letter-history") letterHistory(id);
    if (action === "letter-preview") {
      const a = appBy(id),
        v = a.letterVersions.find((v) => v.id === b.dataset.version);
      modal(
        "An earlier cover letter.",
        e(v.note) + " · " + pretty(v.at),
        `<div class="compare-box">${e(v.text || "Empty draft")}</div><div class="modal-actions">${button("Back to history", "letter-history", `data-id="${e(id)}"`)}${button("Restore this version", "letter-restore", `data-id="${e(id)}" data-version="${e(v.id)}"`, "primary")}</div>`,
        true,
      );
    }
    if (action === "letter-restore") {
      const a = appBy(id),
        v = a.letterVersions.find((v) => v.id === b.dataset.version);
      saveLetterVersion(a, "Before restoring an earlier letter");
      a.coverLetter = v.text;
      a.updatedAt = at();
      if (persist()) {
        closeDialog();
        render();
        toast("Earlier letter restored. The replaced draft stays in history.");
      }
    }
    if (action === "new-resume") resumeModal();
    if (action === "tailor") chooseResume(id);
    if (action === "choose-resume") chooseResume(id, false);
    if (action === "resume-pdf") {
      persist();
      const r = resumeBy(id);
      downloadResumePdf(state.profile, r.title, r.text);
    }
    if (action === "letter-pdf") {
      persist();
      const a = appBy(id);
      downloadCoverLetterPdf(
        state.profile,
        a.company + " - " + a.role,
        a.coverLetter,
      );
    }
    if (action === "copy-letter") await copy(appBy(id).coverLetter);
    if (action === "resume-text") {
      const r = resumeBy(id);
      downloadText(r.title + ".md", r.text);
    }
    if (action === "duplicate-resume") {
      const r = resumeBy(id),
        n = {
          ...clone(r),
          id: uid("resume"),
          title: r.title + " · copy",
          applicationId: "",
          createdAt: at(),
          updatedAt: at(),
          versions: [],
        };
      snapshotResume(n, "Copied from " + r.title);
      state.resumes.push(n);
      persist();
      go("documents/" + n.id);
    }
    if (action === "rename-resume") {
      const r = resumeBy(id);
      modal(
        "Name this document.",
        "Choose a title that makes it easy to find.",
        `<form data-form="rename" data-id="${e(id)}">${field("Document title", "title", r.title, "text", "required")}<div class="modal-actions">${button("Cancel", "close")}<button class="btn primary" type="submit">Save title</button></div></form>`,
      );
    }
    if (action === "version-preview") {
      const r = resumeBy(id),
        v = r.versions.find((x) => x.id === b.dataset.version);
      modal(
        "An earlier version.",
        e(v.note) + " · " + pretty(v.at),
        `<div class="compare-box" style="max-height:450px">${e(v.text)}</div><div class="modal-actions">${button("Keep current", "close")}${button("Restore this version", "version-restore", `data-id="${e(id)}" data-version="${e(v.id)}"`, "primary")}</div>`,
        true,
      );
    }
    if (action === "version-restore") {
      const r = resumeBy(id),
        v = r.versions.find((x) => x.id === b.dataset.version);
      snapshotResume(r, "Before restoring an earlier version");
      r.text = v.text;
      r.updatedAt = at();
      if (persist()) {
        closeDialog();
        render();
        toast(
          "Earlier version restored. The replaced copy remains in history.",
        );
      }
    }
    if (action === "ai") aiModal(id, b.dataset.kind);
    if (action === "ai-show" || action === "ai-copy") {
      const text = aiPrompt(),
        n = document.querySelector("#ai-prompt");
      n.value = text;
      if (action === "ai-copy") await copy(text);
      else n.hidden = !n.hidden;
    }
    if (action === "ai-review") reviewAI();
    if (action === "ai-back") {
      const c = clone(modalContext);
      aiModal(c.appId, c.kind);
      document.querySelector("#ai-proposal").value = c.proposed;
    }
    if (action === "packet") packetModal(id);
    if (action === "submit-role") packetModal(id, true);
    if (action === "view-packet") {
      const a = appBy(id),
        p = a.packets.find((x) => x.id === b.dataset.packet);
      const files = await Promise.all(
        (p.attachmentIds || []).map(async (fid) => {
          const file = await getFile(fid);
          return file
            ? {
                id: fid,
                name:
                  file.name ||
                  p.attachmentMetadata?.find((f) => f.id === fid)?.name ||
                  a.attachments?.find((f) => f.id === fid)?.name ||
                  "Saved file",
                size: file.size,
                type: file.type,
                at: p.at,
              }
            : null;
        }),
      );
      modal(
        p.kind === "submitted" ? "Submission record" : "Ready packet",
        e(a.company) +
          " · " +
          e(a.role) +
          " · " +
          pretty(p.submittedOn || p.at),
        `${p.resume ? `<h3 style="margin-bottom:12px">${e(p.resume.title)}</h3><div class="compare-box">${e(p.resume.text)}</div><div style="margin:12px 0 22px">${button("Download résumé PDF", "packet-pdf", `data-id="${e(id)}" data-packet="${e(p.id)}"`, "small")}</div>` : ""}${p.coverLetter ? `<h3 style="margin-bottom:12px">Cover letter</h3><div class="compare-box">${e(p.coverLetter)}</div>` : ""}${files.length ? `<h3 style="margin:20px 0 8px">Captured files</h3>${files.map((f, i) => (f ? fileRow(f, "", true) : '<div class="notice red">A captured file is unavailable. Restore a complete backup.</div>')).join("")}` : ""}<div class="modal-actions">${button("Close", "close")}</div>`,
        true,
      );
    }
    if (action === "packet-pdf") {
      const p = appBy(id).packets.find((x) => x.id === b.dataset.packet);
      downloadResumePdf(state.profile, p.resume.title, p.resume.text);
    }
    if (action === "export-packet") {
      const a = appBy(id),
        p = a.packets.find((x) => x.id === b.dataset.packet),
        files = [];
      for (const fid of p.attachmentIds || []) {
        const blob = await getFile(fid);
        if (!blob)
          throw Error(
            "A saved packet file is missing. Restore a full backup first.",
          );
        const bytes = new Uint8Array(await blob.arrayBuffer());
        let text = "";
        for (const x of bytes) text += String.fromCharCode(x);
        files.push({
          id: fid,
          name:
            blob.name ||
            p.attachmentMetadata?.find((f) => f.id === fid)?.name ||
            a.attachments?.find((f) => f.id === fid)?.name ||
            "Saved file",
          type: blob.type,
          data: btoa(text),
        });
      }
      downloadText(
        a.company + "-" + p.id + ".json",
        JSON.stringify({ format: "unmplyd-packet", packet: p, files }, null, 2),
      );
      toast("Packet exported with its captured file copies.");
    }
    if (action === "file-download") {
      const file = await getFile(b.dataset.file);
      if (!file)
        throw Error("This file is unavailable. Restore a complete backup.");
      await downloadBlob(file, b.dataset.name || file.name || "Saved file");
    }
    if (action === "file-remove") {
      const a = appBy(id);
      a.attachments = a.attachments.filter((f) => f.id !== b.dataset.file);
      persist();
      render();
      toast("Removed from the working kit. Saved packet copies remain intact.");
    }
    if (action === "add-task") taskModal();
    if (action === "edit-task") taskModal(id);
    if (action === "task-filter") {
      taskFilter = b.dataset.filter;
      render();
    }
    if (action === "backup") {
      b.disabled = true;
      try {
        await backup();
      } finally {
        b.disabled = false;
      }
    }
    if (action === "restore") restoreModal();
    if (action === "search") searchModal();
  } catch (error) {
    toast(error.message, true);
  }
});

document.addEventListener("submit", async (event) => {
  const form = event.target.closest("[data-form]");
  if (!form) return;
  event.preventDefault();
  const values = Object.fromEntries(new FormData(form)),
    kind = form.dataset.form,
    id = form.dataset.id;
  try {
    if (kind === "onboard-next") {
      state.profile.workspaceName =
        values.workspaceName.trim() || "My workspace";
      state.onboardingStep = 1;
      if (persist()) render();
      return;
    }
    if (kind === "application") {
      if (values.url && !safeUrl(values.url)) {
        toast("Use a secure https:// posting URL.", true);
        return;
      }
      let a = appBy(id);
      if (a) Object.assign(a, values, { updatedAt: at() });
      else {
        a = {
          id: uid("application"),
          ...values,
          status: "Lead",
          appliedOn: "",
          lastContact: "",
          nextStep: "",
          followUpOn: "",
          notes: "",
          resumeId: "",
          coverLetter: "",
          packets: [],
          attachments: [],
          createdAt: at(),
          updatedAt: at(),
        };
        state.applications.push(a);
      }
      if (persist()) {
        closeDialog();
        selectedTab = "overview";
        go("applications/" + a.id);
        toast(
          "Application saved. Start with its posting, then tailor your documents.",
        );
      }
    }
    if (kind === "resume") {
      if (!values.text.trim()) return;
      const r = {
        id: uid("resume"),
        title: values.title.trim(),
        track: values.track,
        text: values.text.trim(),
        createdAt: at(),
        updatedAt: at(),
        versions: [],
      };
      snapshotResume(r, "Imported base résumé");
      state.resumes.push(r);
      if (persist()) {
        closeDialog();
        go("documents/" + r.id);
      }
    }
    if (kind === "choose-resume") {
      const a = appBy(id),
        base = resumeBy(values.resumeId);
      if (form.dataset.copy === "true") {
        const r = {
          ...clone(base),
          id: uid("resume"),
          title: a.company + " · " + a.role,
          applicationId: a.id,
          createdAt: at(),
          updatedAt: at(),
          versions: [],
        };
        snapshotResume(r, "Role copy from " + base.title);
        state.resumes.push(r);
        a.resumeId = r.id;
      } else a.resumeId = base.id;
      a.updatedAt = at();
      if (persist()) {
        closeDialog();
        selectedTab = "documents";
        render();
      }
    }
    if (kind === "letter-version") {
      const a = appBy(id);
      saveLetterVersion(a, values.note.trim() || "Named letter version");
      edited.delete("letter-" + id);
      if (persist()) letterHistory(id);
    }
    if (kind === "version") {
      snapshotResume(resumeBy(id), values.note.trim() || "Named version");
      edited.delete(id);
      if (persist()) {
        render();
        toast("Version saved.");
      }
    }
    if (kind === "rename") {
      resumeBy(id).title = values.title.trim();
      if (persist()) {
        closeDialog();
        render();
      }
    }
    if (kind === "settings") {
      const existing = state.profile.tracks;
      state.profile = {
        ...state.profile,
        ...values,
        tracks: tracksFrom(values.tracks),
        retiredClaims: values.retiredClaims
          .split("\n")
          .map((s) => s.trim())
          .filter(Boolean),
      };
      if (persist()) {
        render();
        toast("Preferences saved.");
      }
    }
    if (kind === "task") {
      let task = state.tasks.find((t) => t.id === id);
      if (task) Object.assign(task, values);
      else
        state.tasks.push({
          id: uid("task"),
          done: false,
          createdAt: at(),
          ...values,
        });
      if (persist()) {
        if (dialog.open) closeDialog();
        render();
      }
    }
    if (kind === "ai-apply") {
      const c = modalContext,
        a = appBy(c.appId),
        r = resumeBy(c.resumeId);
      if ((c.kind === "resume" ? r.text : a.coverLetter || "") !== c.base)
        throw Error("This document changed. Start a fresh review.");
      if (c.kind === "resume") {
        snapshotResume(r, "Before AI revision");
        r.text = c.proposed;
        snapshotResume(r, values.note.trim() || "Reviewed AI revision");
      } else {
        (a.letterVersions ||= []).push({
          id: uid("letter-version"),
          text: a.coverLetter || "",
          at: at(),
          note: "Before AI revision",
        });
        a.coverLetter = c.proposed;
        saveLetterVersion(a, values.note.trim() || "Reviewed AI letter");
      }
      a.updatedAt = at();
      if (persist()) {
        closeDialog();
        render();
        toast("Reviewed draft saved. Your earlier copy is preserved.");
      }
    }
    if (kind === "packet") {
      if (!persist()) return;
      const a = appBy(id),
        r = resumeBy(a.resumeId),
        submitted = form.dataset.submitted === "true";
      for (const f of a.attachments || []) {
        if (!(await getFile(f.id)))
          throw Error(
            "An attached file is missing. Restore it before saving this packet.",
          );
      }
      if (r)
        snapshotResume(
          r,
          submitted
            ? "Version chosen for submission"
            : "Version chosen for ready packet",
        );
      if (a.coverLetter?.trim())
        saveLetterVersion(
          a,
          submitted
            ? "Letter chosen for submission"
            : "Letter chosen for ready packet",
        );
      const p = createPacket(state, id, {
        note: values.note || "",
        status: submitted ? "Applied" : a.status,
      });
      const stored = a.packets.find((x) => x.id === p.id);
      stored.kind = submitted ? "submitted" : "ready";
      stored.attachmentMetadata = clone(a.attachments || []);
      if (submitted) {
        stored.submittedOn = values.submittedOn;
        a.appliedOn = values.submittedOn;
        if (["Lead", "Drafted"].includes(a.status)) a.status = "Applied";
      }
      a.updatedAt = at();
      if (persist()) {
        closeDialog();
        selectedTab = "history";
        render();
        toast(
          submitted
            ? "Submission recorded with the chosen documents."
            : "Ready packet saved. Application status has not changed.",
        );
      }
    }
    if (kind === "restore") {
      const submit = form.querySelector("button[type=submit]");
      submit.disabled = true;
      submit.textContent = "Restoring…";
      try {
        const file = form.elements.backup.files[0];
        if (file.size > 150 * 1024 * 1024)
          throw Error(
            "This backup is too large to restore in one pass. Use a smaller complete backup.",
          );
        const merged = await importBackup(await file.text(), state);
        state = merged;
        if (persist()) {
          closeDialog();
          render();
          toast("Backup restored. Existing records were preserved.");
        }
      } finally {
        submit.disabled = false;
        submit.textContent = "Restore backup";
      }
    }
  } catch (error) {
    toast(error.message, true);
  }
});

function searchModal() {
  modal(
    "Find it in your workspace.",
    "Search roles, organizations, notes, and résumé text.",
    `<label class="field"><span class="visually-hidden">Search workspace</span><input id="search-query" placeholder="Search your workspace…" autocomplete="off"></label><div class="search-results" id="search-results" style="margin-top:18px"><p class="help">Start typing to find a role or document.</p></div>`,
  );
}
dialog.addEventListener("input", (event) => {
  if (event.target.id !== "search-query") return;
  const q = event.target.value.trim().toLowerCase(),
    container = document.querySelector("#search-results");
  if (!q) {
    container.innerHTML =
      '<p class="help">Start typing to find a role or document.</p>';
    return;
  }
  const apps = state.applications
      .filter((a) =>
        [a.company, a.role, a.notes, a.posting].some((x) =>
          (x || "").toLowerCase().includes(q),
        ),
      )
      .slice(0, 7),
    docs = state.resumes
      .filter((r) => (r.title + " " + r.text).toLowerCase().includes(q))
      .slice(0, 5);
  container.innerHTML =
    apps
      .map(
        (a) =>
          `<a class="search-result" data-search-link href="#applications/${e(a.id)}">${icon("briefcase")}<div><strong>${e(a.role)}</strong><small>${e(a.company)}${a.archived ? " · archived" : ""}</small></div></a>`,
      )
      .concat(
        docs.map(
          (r) =>
            `<a class="search-result" data-search-link href="#documents/${e(r.id)}">${icon("file")}<div><strong>${e(r.title)}</strong><small>Résumé</small></div></a>`,
        ),
      )
      .join("") ||
    '<p class="help">No matches. Try an organization, role, or document title.</p>';
});
dialog.addEventListener("click", (event) => {
  if (event.target.closest("[data-search-link]")) {
    closeDialog();
    selectedTab = "overview";
  }
});
dialog.addEventListener("cancel", () => {
  modalContext = {};
});
document.querySelector(".skip-link")?.addEventListener("click", (event) => {
  event.preventDefault();
  document.querySelector("#main")?.focus();
});
document.addEventListener("keydown", (event) => {
  if (
    (event.metaKey || event.ctrlKey) &&
    event.key.toLowerCase() === "k" &&
    state.onboardingComplete
  ) {
    event.preventDefault();
    searchModal();
  }
  if (
    (event.key === "Enter" || event.key === " ") &&
    event.target.matches(".app-card")
  ) {
    event.preventDefault();
    selectedTab = "overview";
    go("applications/" + event.target.dataset.id);
  }
});
window.addEventListener("hashchange", () => {
  persist();
  edited.clear();
  render();
  window.scrollTo(0, 0);
});
window.addEventListener("beforeunload", (event) => {
  if (!allowExit && !persist()) {
    event.preventDefault();
    event.returnValue = "";
  }
});
window.addEventListener("storage", (event) => {
  if (event.key === "unmplyd:workspace:v3") {
    storageConflict = true;
    clearTimeout(saveTimer);
    root.inert = true;
    modal(
      "Your workspace changed in another tab.",
      "Reload the latest saved workspace before editing. This tab has stopped saving so it cannot replace the newer work.",
      `<p class="help">You can export this tab's copy first if it contains edits you want to keep.</p><div class="modal-actions">${button("Export this tab’s copy", "backup-copy")}${button("Reload latest workspace", "reload-latest", "", "primary")}</div>`,
    );
    dialog.querySelector('[data-action="close"]').hidden = true;
  }
});
dialog.addEventListener("cancel", (event) => {
  if (storageConflict) event.preventDefault();
});
render();

document.addEventListener("keydown", (event) => {
  if (
    event.target.matches('[role="tab"]') &&
    ["ArrowLeft", "ArrowRight"].includes(event.key)
  ) {
    event.preventDefault();
    const tabs = [...document.querySelectorAll('[role="tab"]')],
      index = tabs.indexOf(event.target),
      next =
        tabs[
          (index + (event.key === "ArrowRight" ? 1 : tabs.length - 1)) %
            tabs.length
        ];
    next.click();
    document
      .querySelectorAll('[role="tab"]')
      [
        (index + (event.key === "ArrowRight" ? 1 : tabs.length - 1)) %
          tabs.length
      ]?.focus();
  }
});
