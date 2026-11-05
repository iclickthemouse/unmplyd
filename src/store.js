/** Browser-local workspace metadata and private file storage. No network calls. */
export const STATE_KEY = "unmplyd:workspace:v3";
export const SCHEMA_VERSION = 3;
export const STATUSES = [
  "Lead",
  "Drafted",
  "Applied",
  "In review",
  "Interview",
  "Offer",
  "Closed",
];
const DATABASE = "unmplyd-files";
const FILE_STORE = "files";
const clone = (value) => JSON.parse(JSON.stringify(value));
const now = () => new Date().toISOString();
const text = (value) => (typeof value === "string" ? value : "");
const record = (value) =>
  value && typeof value === "object" && !Array.isArray(value);
function optionalText(value, label) {
  if (value !== undefined && typeof value !== "string")
    throw new Error(`Invalid ${label}.`);
}
function optionalDate(value, label) {
  optionalText(value, label);
  if (!value) return;
  const day = value.slice(0, 10);
  if (
    !/^\d{4}-\d{2}-\d{2}(?:T.*)?$/.test(value) ||
    !Number.isFinite(Date.parse(value)) ||
    new Date(day).toISOString().slice(0, 10) !== day
  )
    throw new Error(`Invalid ${label}.`);
}

export function uid(prefix = "id") {
  return `${prefix}-${globalThis.crypto?.randomUUID?.() || `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`}`;
}

export function createEmptyState() {
  return {
    schemaVersion: SCHEMA_VERSION,
    profile: {
      name: "",
      email: "",
      location: "",
      headline: "",
      workspaceName: "My workspace",
      tracks: [{ id: "general", label: "General" }],
      writingPreferences: "",
    },
    resumes: [],
    applications: [],
    tasks: [],
    materials: [],
    onboardingComplete: false,
    createdAt: now(),
    updatedAt: now(),
  };
}

function validateEntityList(list, label) {
  if (!Array.isArray(list)) throw new Error(`${label} must be a list.`);
  const ids = new Set();
  for (const entry of list) {
    if (
      !record(entry) ||
      typeof entry.id !== "string" ||
      !entry.id ||
      ids.has(entry.id)
    ) {
      throw new Error(`${label} contains a missing or duplicate ID.`);
    }
    ids.add(entry.id);
  }
}

/** Validate before any import writes. Preserve unknown fields for forward compatibility. */
export function validateState(state) {
  if (
    !record(state) ||
    state.schemaVersion !== SCHEMA_VERSION ||
    !record(state.profile)
  ) {
    throw new Error("This is not a supported workspace backup.");
  }
  for (const key of [
    "name",
    "email",
    "location",
    "headline",
    "workspaceName",
    "writingPreferences",
  ]) {
    if (
      state.profile[key] !== undefined &&
      typeof state.profile[key] !== "string"
    )
      throw new Error(`Invalid profile ${key}.`);
  }
  validateEntityList(state.profile.tracks, "Tracks");
  if (state.profile.tracks.some((track) => typeof track.label !== "string"))
    throw new Error("Invalid track label.");
  for (const key of ["resumes", "applications", "tasks"])
    validateEntityList(state[key], key);
  for (const resume of state.resumes) {
    if (typeof resume.text !== "string" || typeof resume.title !== "string")
      throw new Error("Invalid résumé text or title.");
    validateEntityList(resume.versions || [], "Résumé versions");
    if (
      (resume.versions || []).some(
        (version) => typeof version.text !== "string",
      )
    )
      throw new Error("Invalid résumé version text.");
    for (const version of resume.versions || []) {
      optionalText(version.note, "résumé version note");
      optionalDate(version.at, "résumé version date");
    }
    if (
      resume.attachmentIds !== undefined &&
      (!Array.isArray(resume.attachmentIds) ||
        resume.attachmentIds.some((id) => typeof id !== "string"))
    )
      throw new Error("Invalid résumé file references.");
  }
  for (const app of state.applications) {
    if (
      typeof app.company !== "string" ||
      typeof app.role !== "string" ||
      !STATUSES.includes(app.status)
    )
      throw new Error("Invalid application details or status.");
    if (app.coverLetter !== undefined && typeof app.coverLetter !== "string")
      throw new Error("Invalid cover letter.");
    for (const key of [
      "posting",
      "url",
      "location",
      "salary",
      "deadline",
      "appliedOn",
      "lastContact",
      "nextStep",
      "followUpOn",
      "notes",
      "resumeId",
    ]) {
      if (app[key] !== undefined && typeof app[key] !== "string")
        throw new Error(`Invalid application ${key}.`);
    }
    for (const key of ["deadline", "appliedOn", "lastContact", "followUpOn"])
      optionalDate(app[key], `application ${key}`);
    validateEntityList(app.packets || [], "Application packets");
    validateEntityList(app.attachments || [], "Application attachments");
    validateEntityList(app.letterVersions || [], "Cover letter versions");
    for (const version of app.letterVersions || []) {
      if (
        typeof version.text !== "string" ||
        (version.note !== undefined && typeof version.note !== "string") ||
        !Number.isFinite(Date.parse(version.at))
      )
        throw new Error("Invalid cover letter version.");
    }
    for (const packet of app.packets || []) {
      if (
        packet.resume !== null &&
        packet.resume !== undefined &&
        (!record(packet.resume) || typeof packet.resume.text !== "string")
      )
        throw new Error("Invalid packet résumé.");
      if (
        packet.attachmentIds !== undefined &&
        (!Array.isArray(packet.attachmentIds) ||
          packet.attachmentIds.some((id) => typeof id !== "string"))
      )
        throw new Error("Invalid packet file references.");
      optionalDate(packet.at, "packet date");
      if (packet.status !== undefined && !STATUSES.includes(packet.status))
        throw new Error("Invalid packet status.");
      for (const key of [
        "company",
        "role",
        "posting",
        "url",
        "note",
        "coverLetter",
      ])
        optionalText(packet[key], `packet ${key}`);
      if (packet.resume)
        for (const key of ["id", "title", "versionId"])
          optionalText(packet.resume[key], `packet résumé ${key}`);
    }
  }
  for (const task of state.tasks) {
    if (typeof task.text !== "string") throw new Error("Invalid task text.");
    optionalDate(task.dueOn, "task due date");
    optionalText(task.applicationId, "task application");
    if (task.done !== undefined && typeof task.done !== "boolean")
      throw new Error("Invalid task completion.");
  }
  return state;
}

function normalizeState(raw) {
  const defaults = createEmptyState();
  const state = {
    ...defaults,
    ...clone(raw),
    profile: { ...defaults.profile, ...clone(raw.profile || {}) },
  };
  state.materials = Array.isArray(state.materials) ? state.materials : [];
  return validateState(state);
}

export function saveState(state, storage = globalThis.localStorage) {
  if (!storage)
    throw new Error(
      "Browser storage is unavailable. Export a backup before closing this page.",
    );
  validateState(state);
  const next = { ...state, updatedAt: now(), schemaVersion: SCHEMA_VERSION };
  try {
    storage.setItem(STATE_KEY, JSON.stringify(next));
  } catch (error) {
    throw new Error(
      "Your workspace could not be saved. Browser storage may be full or unavailable. Export a backup before closing.",
      { cause: error },
    );
  }
  state.updatedAt = next.updatedAt;
  return state;
}

export function loadState(storage = globalThis.localStorage) {
  if (!storage) throw new Error("Browser storage is unavailable.");
  const saved = storage.getItem(STATE_KEY);
  if (saved !== null) {
    let parsed;
    try {
      parsed = JSON.parse(saved);
    } catch {
      throw new Error(
        "Your saved workspace could not be read. Its data is preserved; restore a backup to a separate browser profile.",
      );
    }
    return normalizeState(parsed);
  }
  const state = migrateLegacy(storage);
  // Migration leaves all original keys intact and persists the new copy only after validation.
  if (state.legacy) saveState(state, storage);
  return state;
}

export function resumeDataToText(data) {
  if (typeof data === "string") return data;
  if (!record(data)) return "";
  const lines = [
    text(data.name),
    text(data.title),
    text(data.contact),
    "",
    text(data.summary),
  ];
  for (const section of data.sections || []) {
    lines.push("", text(section.heading));
    for (const entry of section.entries || []) {
      lines.push(
        [entry.company, entry.note, entry.dates].filter(Boolean).join(" · "),
      );
      for (const role of entry.roles || []) {
        lines.push([role.title, role.dates].filter(Boolean).join(" · "));
        lines.push(...(role.bullets || []).map((line) => `• ${line}`));
      }
      lines.push(...(entry.bullets || []).map((line) => `• ${line}`));
      if (entry.clientsHeading) lines.push(entry.clientsHeading);
      for (const client of entry.clients || [])
        lines.push(
          [client.name, client.desc].filter(Boolean).join(" · "),
          ...(client.bullets || []).map((line) => `• ${line}`),
        );
    }
    for (const group of section.groups || [])
      lines.push([group.label, group.text].filter(Boolean).join(": "));
    for (const line of section.lines || [])
      lines.push([line.bold, line.text].filter(Boolean).join(" · "));
  }
  return lines
    .filter((line) => typeof line === "string")
    .join("\n")
    .trim();
}

function migrateLegacy(storage) {
  const state = createEmptyState();
  const collections = {};
  for (let i = 0; i < storage.length; i++) {
    const key = storage.key(i);
    if (!key?.startsWith("unmplyd:c:")) continue;
    const raw = storage.getItem(key);
    try {
      collections[key.slice("unmplyd:c:".length)] = JSON.parse(raw);
    } catch {
      collections[key.slice("unmplyd:c:".length)] = { unreadableOriginal: raw };
    }
  }
  if (
    !Object.keys(collections).length &&
    !storage.getItem("unmplyd:config") &&
    !storage.getItem("unmplyd:configuration") &&
    !globalThis.HQ_CONFIG &&
    !globalThis.window?.HQ_CONFIG
  )
    return state;
  state.legacy = { collections: clone(collections), migratedAt: now() };
  let config = globalThis.HQ_CONFIG || globalThis.window?.HQ_CONFIG;
  for (const key of ["unmplyd:config", "unmplyd:configuration"]) {
    const raw = storage.getItem(key);
    if (raw) {
      try {
        config = { ...(record(config) ? config : {}), ...JSON.parse(raw) };
      } catch {
        (state.legacy.unreadableConfiguration ||= {})[key] = raw;
      }
    }
  }
  if (record(config)) {
    state.legacy.configuration = clone(config);
    state.profile.name = text(config.owner);
    state.profile.email = text(config.email);
    state.profile.workspaceName =
      text(config.appName) || state.profile.workspaceName;
    state.profile.retiredClaims = Array.isArray(config.retiredClaims)
      ? clone(config.retiredClaims)
      : [];
    state.profile.quickLinks = Array.isArray(config.quickLinks)
      ? clone(config.quickLinks)
      : [];
  }
  const docs = (name) =>
    record(collections[name]) && !collections[name].unreadableOriginal
      ? Object.entries(collections[name])
      : [];
  const allTracks = new Set(["general"]);
  state.materials = docs("materials").map(([id, data]) => ({
    ...clone(data),
    id,
  }));
  for (const [id, body] of docs("resumes")) {
    if (!record(body)) continue;
    const track =
      state.materials.find((item) => item.editorId === id)?.track ||
      config?.resumes?.[id]?.track ||
      "general";
    if (track !== "Both") allTracks.add(track);
    const at = body.savedAt || now();
    state.resumes.push({
      ...clone(body),
      id,
      title: body.title || "Imported résumé",
      text: resumeDataToText(body.data),
      track,
      sourceData: clone(body.data || {}),
      createdAt: at,
      updatedAt: at,
      versions: docs(`resumes/${id}/versions`).map(([versionId, version]) => ({
        ...clone(version),
        id: versionId,
        text: resumeDataToText(version.data),
        sourceData: clone(version.data || {}),
        at: version.at || at,
        note: version.note || "Imported version",
      })),
    });
  }
  for (const [id, original] of docs("applications")) {
    if (!record(original)) continue;
    const track = original.track || "general";
    if (track !== "Both") allTracks.add(track);
    const packets = docs(`applications/${id}/versions`).map(
      ([packetId, packet]) => ({
        ...clone(packet),
        id: packetId,
        resume: packet.resume
          ? {
              id: packet.resumeId || "",
              title:
                state.resumes.find((item) => item.id === packet.resumeId)
                  ?.title || "Imported résumé",
              text: resumeDataToText(packet.resume),
              versionId: "",
              sourceData: clone(packet.resume),
            }
          : null,
        attachmentIds: Array.isArray(packet.attachmentIds)
          ? clone(packet.attachmentIds)
          : [],
        legacyPacket: clone(packet),
      }),
    );
    state.applications.push({
      ...clone(original),
      id,
      company: text(original.company),
      role: text(original.role),
      track,
      status: STATUSES.includes(original.status) ? original.status : "Lead",
      posting: original.jobPosting || "",
      url: original.link || "",
      location: original.location || "",
      salary: original.salary || "",
      deadline: original.deadline || "",
      appliedOn: original.applied || "",
      lastContact: original.last || "",
      nextStep: original.next || "",
      followUpOn: original.followUpOn || "",
      notes: original.note || "",
      resumeId: original.resumeId || "",
      coverLetter: original.coverLetter || "",
      packets,
      attachments: [],
    });
  }
  state.tasks = docs("todos").map(([id, task]) => ({
    ...clone(task),
    id,
    text: task.text || "",
    done: !!task.done,
    dueOn: task.dueOn || "",
    applicationId: task.applicationId || "",
  }));
  for (const track of config?.tracks || [])
    if (typeof track.id === "string" && track.id !== "Both")
      allTracks.add(track.id);
  state.profile.tracks = [...allTracks].map((id) => ({
    id,
    label:
      config?.tracks?.find((track) => track.id === id)?.label ||
      (id === "general" ? "General" : id),
  }));
  const first = state.resumes.find(
    (resume) =>
      resume.sourceData?.name &&
      !/your name|example|sample/i.test(resume.sourceData.name) &&
      !/example\.com/i.test(resume.sourceData.contact || ""),
  );
  if (first) {
    state.profile.name = text(first.sourceData.name);
    state.profile.headline = text(first.sourceData.title);
    state.profile.email =
      text(first.sourceData.contact).match(
        /[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}/,
      )?.[0] || "";
  }
  const demoIds = new Set([
    "a-example-role",
    "a-acme",
    "a-globex",
    "a-initech",
    "a-umbrella",
  ]);
  state.onboardingComplete =
    !!first ||
    state.applications.some(
      (app) =>
        !demoIds.has(app.id) &&
        app.company &&
        !/sample|example/i.test(app.company + " " + app.notes),
    );
  // A pure demo is preserved in legacy, but should not masquerade as the user's applications.
  if (!state.onboardingComplete) {
    state.legacy.demoOnly = true;
    state.resumes = [];
    state.applications = [];
    state.tasks = [];
    state.materials = [];
  }
  return validateState(state);
}

export function snapshotResume(resume, note = "Saved version") {
  if (!resume || typeof resume.text !== "string")
    throw new Error("Choose a résumé before saving a version.");
  const version = {
    id: uid("version"),
    text: resume.text,
    note: text(note) || "Saved version",
    at: now(),
  };
  if (!Array.isArray(resume.versions)) resume.versions = [];
  resume.versions.push(clone(version));
  resume.updatedAt = version.at;
  return clone(version);
}

export function createPacket(state, applicationId, options = {}) {
  const app = state.applications.find((item) => item.id === applicationId);
  if (!app) throw new Error("The application is unavailable.");
  const resume = state.resumes.find((item) => item.id === app.resumeId);
  if (
    !resume?.text?.trim() &&
    !app.coverLetter?.trim() &&
    !app.attachments?.length
  )
    throw new Error("Add a résumé, letter, or file before saving a packet.");
  const latest = resume?.versions?.at(-1);
  const selectedFiles =
    options.attachmentIds ?? (app.attachments || []).map((file) => file.id);
  const availableFiles = new Set(
    (app.attachments || []).map((file) => file.id),
  );
  if (
    !Array.isArray(selectedFiles) ||
    selectedFiles.some(
      (id) => typeof id !== "string" || !availableFiles.has(id),
    )
  )
    throw new Error("A selected file is not attached to this application.");
  optionalText(options.note, "packet note");
  const packet = {
    id: uid("packet"),
    at: now(),
    status: options.status || app.status,
    company: app.company,
    role: app.role,
    posting: app.posting || "",
    url: app.url || "",
    note: options.note || "",
    resume: resume
      ? {
          id: resume.id,
          title: resume.title,
          text: resume.text,
          versionId: latest?.text === resume.text ? latest.id : "",
        }
      : null,
    coverLetter: app.coverLetter || "",
    attachmentIds: clone(selectedFiles),
  };
  if (!STATUSES.includes(packet.status))
    throw new Error("Choose a valid packet status.");
  if (!Array.isArray(app.packets)) app.packets = [];
  app.packets.push(clone(packet));
  app.packetId = packet.id;
  return clone(packet);
}

let databasePromise;
function openFiles() {
  if (!globalThis.indexedDB)
    return Promise.reject(
      new Error(
        "Private file storage is unavailable in this browser. Keep a copy of the original file.",
      ),
    );
  if (!databasePromise)
    databasePromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DATABASE, 1);
      request.onupgradeneeded = () => {
        if (!request.result.objectStoreNames.contains(FILE_STORE))
          request.result.createObjectStore(FILE_STORE, { keyPath: "id" });
      };
      request.onsuccess = () => {
        request.result.onversionchange = () => {
          request.result.close();
          databasePromise = undefined;
        };
        resolve(request.result);
      };
      request.onerror = () => {
        databasePromise = undefined;
        reject(
          new Error("Private file storage could not be opened.", {
            cause: request.error,
          }),
        );
      };
      request.onblocked = () => {
        databasePromise = undefined;
        reject(
          new Error("Close another open workspace tab to update file storage."),
        );
      };
    });
  return databasePromise;
}

async function fileTransaction(mode, action) {
  const db = await openFiles();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(FILE_STORE, mode),
      store = transaction.objectStore(FILE_STORE);
    let output;
    transaction.oncomplete = () => resolve(output);
    transaction.onerror = () =>
      reject(
        new Error(
          "The file operation failed. Your existing files were preserved.",
          { cause: transaction.error },
        ),
      );
    transaction.onabort = () =>
      reject(
        new Error(
          "The file operation was cancelled. Your existing files were preserved.",
          { cause: transaction.error },
        ),
      );
    try {
      action(store, (result) => {
        output = result;
      });
    } catch (error) {
      transaction.abort();
      reject(error);
    }
  });
}

export async function addFile(file, options = {}) {
  if (!(file instanceof Blob)) throw new Error("Choose a file to attach.");
  const meta = {
    id: options.id || uid("file"),
    name: text(file.name) || options.name || "Attachment",
    type: file.type || "application/octet-stream",
    size: file.size,
    at: now(),
  };
  await fileTransaction("readwrite", (store, done) => {
    store.add({ ...meta, blob: file });
    done(meta);
  });
  return meta;
}

export async function getFile(id) {
  return fileTransaction("readonly", (store, done) => {
    const request = store.get(id);
    request.onsuccess = () => done(request.result?.blob || null);
  });
}

export async function removeFile(id) {
  return fileTransaction("readwrite", (store, done) => {
    store.delete(id);
    done(true);
  });
}

async function allFiles() {
  return fileTransaction("readonly", (store, done) => {
    const request = store.getAll();
    request.onsuccess = () => done(request.result);
  });
}

function bytesToBase64(bytes) {
  let binary = "";
  for (let start = 0; start < bytes.length; start += 0x8000)
    binary += String.fromCharCode(...bytes.subarray(start, start + 0x8000));
  return btoa(binary);
}

function base64ToBytes(value) {
  if (
    typeof value !== "string" ||
    value.length % 4 ||
    !/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(
      value,
    )
  )
    throw new Error("A backup file contains invalid data.");
  const binary = atob(value),
    bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

export async function exportBackup(state) {
  validateState(state);
  const files = globalThis.indexedDB ? await allFiles() : [];
  const available = new Set(files.map((file) => file.id));
  if ([...referencedFiles(state)].some((id) => !available.has(id)))
    throw new Error(
      "An attached original file is missing from browser storage. Reattach it or remove its broken reference before creating a complete backup.",
    );
  const output = [];
  for (const { blob, ...metadata } of files)
    output.push({
      ...metadata,
      data: bytesToBase64(new Uint8Array(await blob.arrayBuffer())),
    });
  return {
    format: "unmplyd-backup",
    version: SCHEMA_VERSION,
    exportedAt: now(),
    state: clone(state),
    files: output,
  };
}

function referencedFiles(state) {
  const ids = new Set();
  for (const resume of state.resumes || []) {
    for (const file of resume.attachments || []) ids.add(file.id);
    for (const id of resume.attachmentIds || []) ids.add(id);
  }
  for (const app of state.applications || []) {
    for (const file of app.attachments || []) ids.add(file.id);
    for (const packet of app.packets || [])
      for (const id of packet.attachmentIds || []) ids.add(id);
  }
  return ids;
}

/** Import is additive. Changed ID collisions are copied and all incoming references remapped. */
export async function importBackup(payload, currentState = createEmptyState()) {
  if (typeof payload === "string") {
    try {
      payload = JSON.parse(payload);
    } catch {
      throw new Error("The selected file is not valid backup JSON.");
    }
  }
  if (
    !record(payload) ||
    payload.format !== "unmplyd-backup" ||
    payload.version !== SCHEMA_VERSION ||
    !Array.isArray(payload.files)
  )
    throw new Error("Choose a complete unmplyd workspace backup.");
  const source = normalizeState(payload.state),
    merged = normalizeState(currentState);
  // Decode and validate every file before opening a write transaction.
  const incomingFiles = [],
    seenFileIds = new Set();
  for (const file of payload.files) {
    if (
      !record(file) ||
      typeof file.id !== "string" ||
      !file.id ||
      seenFileIds.has(file.id) ||
      typeof file.name !== "string" ||
      typeof file.type !== "string"
    )
      throw new Error("The backup contains invalid or duplicate files.");
    seenFileIds.add(file.id);
    const bytes = base64ToBytes(file.data);
    if (bytes.length !== file.size)
      throw new Error("A backup file is incomplete. No data was imported.");
    incomingFiles.push({
      id: file.id,
      name: file.name,
      type: file.type,
      size: bytes.length,
      at: file.at || now(),
      blob: new Blob([bytes], { type: file.type }),
    });
  }
  if (incomingFiles.length && !globalThis.indexedDB)
    throw new Error(
      "File storage is unavailable. Import this complete backup in a browser with file storage enabled.",
    );
  const storedFiles = globalThis.indexedDB ? await allFiles() : [];
  const fileIds = new Set(storedFiles.map((file) => file.id)),
    fileMap = new Map();
  if (
    [...referencedFiles(source)].some(
      (id) => !seenFileIds.has(id) && !fileIds.has(id),
    )
  )
    throw new Error(
      "The backup is missing an attached file. No data was imported.",
    );
  for (const file of incomingFiles) {
    const original = file.id;
    if (fileIds.has(file.id)) file.id = uid("file");
    fileMap.set(original, file.id);
    fileIds.add(file.id);
  }
  const maps = {
    resumes: new Map(),
    applications: new Map(),
    tasks: new Map(),
    materials: new Map(),
    tracks: new Map(),
  };
  const imports = { resumes: [], applications: [], tasks: [], materials: [] };
  for (const track of source.profile.tracks) {
    const existing = merged.profile.tracks.find((item) => item.id === track.id);
    const imported = clone(track);
    if (existing && existing.label !== track.label) imported.id = uid("track");
    maps.tracks.set(track.id, imported.id);
    if (!existing || imported.id !== track.id)
      merged.profile.tracks.push(imported);
  }
  for (const key of Object.keys(imports)) {
    const current = merged[key] || [],
      incoming = source[key] || [];
    for (const item of incoming) {
      const previous = current.find((existing) => existing.id === item.id);
      if (
        previous &&
        JSON.stringify(previous) === JSON.stringify(item) &&
        !incomingFiles.length
      ) {
        maps[key].set(item.id, item.id);
        continue;
      }
      const copy = clone(item);
      if (previous) copy.id = uid(key.slice(0, -1));
      maps[key].set(item.id, copy.id);
      imports[key].push(copy);
    }
  }
  const remap = (map, id) => map.get(id) || id;
  const remapFileMetadata = (file) => ({
    ...file,
    id: remap(fileMap, file.id),
  });
  for (const resume of imports.resumes) {
    resume.track = remap(maps.tracks, resume.track);
    if (resume.attachments)
      resume.attachments = resume.attachments.map(remapFileMetadata);
    if (resume.attachmentIds)
      resume.attachmentIds = resume.attachmentIds.map((id) =>
        remap(fileMap, id),
      );
  }
  for (const app of imports.applications) {
    app.resumeId = remap(maps.resumes, app.resumeId);
    app.track = remap(maps.tracks, app.track);
    app.attachments = (app.attachments || []).map(remapFileMetadata);
    for (const packet of app.packets || []) {
      if (packet.resume)
        packet.resume.id = remap(maps.resumes, packet.resume.id);
      packet.attachmentIds = (packet.attachmentIds || []).map((id) =>
        remap(fileMap, id),
      );
      if (Array.isArray(packet.attachmentMetadata))
        packet.attachmentMetadata =
          packet.attachmentMetadata.map(remapFileMetadata);
    }
  }
  for (const task of imports.tasks)
    task.applicationId = remap(maps.applications, task.applicationId);
  for (const material of imports.materials) {
    material.track = remap(maps.tracks, material.track);
    if (material.editorId)
      material.editorId = remap(maps.resumes, material.editorId);
    if (material.assetId) material.assetId = remap(fileMap, material.assetId);
  }
  for (const key of Object.keys(imports)) merged[key].push(...imports[key]);
  for (const [key, value] of Object.entries(source.profile))
    if (
      (!merged.profile[key] ||
        (key === "workspaceName" && merged.profile[key] === "My workspace")) &&
      key !== "tracks"
    )
      merged.profile[key] = clone(value);
  if (!currentState.onboardingComplete && source.onboardingComplete)
    merged.onboardingComplete = true;
  if (source.legacy) {
    if (!merged.legacy) merged.legacy = clone(source.legacy);
    else (merged.importedLegacy ||= []).push(clone(source.legacy));
  }
  merged.updatedAt = now();
  validateState(merged);
  if (incomingFiles.length)
    await fileTransaction("readwrite", (store, done) => {
      for (const file of incomingFiles) store.add(file);
      done(true);
    });
  return merged;
}
