import * as path from 'path';
import { resolve, sep } from 'path';
import { execFileSync } from 'child_process';

// plugin/babel-plugin-starling-source.ts
var PATH_ATTR = "data-inspector-relative-path";
var LINE_ATTR = "data-inspector-line";
var COL_ATTR = "data-inspector-column";
function starlingSourcePlugin(babel, options = {}) {
  const t = babel.types;
  const root = options.root ?? process.cwd();
  const exclude = options.exclude ?? ["node_modules"];
  return {
    name: "starling-source",
    visitor: {
      JSXOpeningElement(nodePath, state) {
        const filename = state.file?.opts?.filename ?? "";
        if (!filename) return;
        if (exclude.some((frag) => filename.includes(frag))) return;
        const nameNode = nodePath.node.name;
        if (!t.isJSXIdentifier(nameNode)) return;
        if (!/^[a-z]/.test(nameNode.name)) return;
        const already = nodePath.node.attributes.some(
          (attr) => t.isJSXAttribute(attr) && t.isJSXIdentifier(attr.name) && attr.name.name === PATH_ATTR
        );
        if (already) return;
        const loc = nodePath.node.loc;
        if (!loc) return;
        const rel = path.relative(root, filename).split(path.sep).join("/");
        nodePath.node.attributes.push(
          jsxAttr(t, PATH_ATTR, rel),
          jsxAttr(t, LINE_ATTR, String(loc.start.line)),
          jsxAttr(t, COL_ATTR, String(loc.start.column))
        );
      }
    }
  };
}
function jsxAttr(t, name, value) {
  return t.jsxAttribute(t.jsxIdentifier(name), t.stringLiteral(value));
}

// plugin/supabase.ts
var SUPABASE_URL = process.env.STARLING_SUPABASE_URL ?? "https://jxliasrgjeidqwrecbye.supabase.co";
var SUPABASE_ANON_KEY = process.env.STARLING_SUPABASE_ANON_KEY ?? "sb_publishable_-r9ZwhBlSUpRf0iB69K08Q_tonn_jB5";
var SNAPSHOTS_TABLE = "starling_snapshots";
var SNAPSHOTS_URL = `${SUPABASE_URL}/rest/v1/${SNAPSHOTS_TABLE}`;
function supabaseHeaders(extra) {
  return {
    apikey: SUPABASE_ANON_KEY,
    authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    ...extra
  };
}

// plugin/snapshots.ts
var META_SELECT = "id,basename,author,version,annotation_count,saved_at";
async function insertSnapshot(input) {
  let session = {};
  try {
    session = JSON.parse(input.sessionJson);
  } catch {
  }
  const annotations = Array.isArray(session.annotations) ? session.annotations : [];
  const row = {
    app_id: input.appId,
    basename: input.basename,
    session_id: typeof session.sessionId === "string" ? session.sessionId : null,
    author: input.author,
    version: typeof session.version === "number" ? session.version : null,
    annotation_count: annotations.length,
    saved_at: input.savedAt,
    session_json: session,
    markdown: input.markdown
  };
  const res = await fetch(SNAPSHOTS_URL, {
    method: "POST",
    headers: supabaseHeaders({
      "content-type": "application/json",
      prefer: "return=representation"
    }),
    body: JSON.stringify(row)
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`starling insert failed: ${res.status} ${detail}`);
  }
  const created = await res.json();
  const first = created[0];
  if (!first) {
    throw new Error("starling insert returned no row");
  }
  return {
    id: first.id,
    savedAt: first.saved_at,
    author: first.author
  };
}
async function fetchSnapshots(q) {
  const params = new URLSearchParams();
  params.append("app_id", `eq.${q.appId}`);
  if (q.author) params.append("author", `ilike.*${q.author}*`);
  if (q.basename) params.append("basename", `ilike.*${q.basename}*`);
  if (q.since) params.append("saved_at", `gte.${q.since}`);
  if (q.until) params.append("saved_at", `lte.${q.until}`);
  params.append("select", META_SELECT);
  params.append("order", "saved_at.desc");
  const limit = q.latest ? 1 : q.limit;
  if (limit != null) params.append("limit", String(limit));
  let rows;
  try {
    const res = await fetch(`${SNAPSHOTS_URL}?${params.toString()}`, {
      headers: supabaseHeaders()
    });
    if (!res.ok) return [];
    rows = await res.json();
  } catch {
    return [];
  }
  return rows.map((r) => ({
    // `filename` carries the stable row id — the key passed back to load. The
    // sidebar shows `basename` for humans.
    filename: r.id,
    basename: r.basename,
    annotationCount: r.annotation_count ?? 0,
    savedAt: r.saved_at,
    version: r.version,
    author: r.author
  }));
}
async function fetchSnapshot(params) {
  const qp = new URLSearchParams();
  qp.append("app_id", `eq.${params.appId}`);
  qp.append("id", `eq.${params.id}`);
  qp.append("select", "session_json,markdown");
  qp.append("limit", "1");
  try {
    const res = await fetch(`${SNAPSHOTS_URL}?${qp.toString()}`, {
      headers: supabaseHeaders()
    });
    if (!res.ok) return null;
    const rows = await res.json();
    const row = rows[0];
    if (!row) return null;
    return {
      session: JSON.stringify(row.session_json),
      markdown: row.markdown ?? ""
    };
  } catch {
    return null;
  }
}

// plugin/server.ts
function gitConfig(root, key) {
  try {
    const out = execFileSync("git", ["config", key], {
      cwd: root,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"]
    });
    const v = out.trim();
    return v.length > 0 ? v : null;
  } catch {
    return null;
  }
}
function gitAuthor(root) {
  return gitConfig(root, "user.name") ?? gitConfig(root, "user.email");
}
function sanitizeBasename(name) {
  const trimmed = (name || "").trim().replace(/\.(md|starling\.json)$/i, "");
  const cleaned = trimmed.replace(/[^a-zA-Z0-9._-]/g, "-");
  return cleaned || "starling-annotations";
}
async function saveSnapshot(body, opts = {}) {
  const root = resolve(opts.root ?? process.cwd());
  const basename = sanitizeBasename(body.basename);
  const author = gitAuthor(root);
  const savedAt = (/* @__PURE__ */ new Date()).toISOString();
  let sessionJson = body.sessionJson;
  try {
    const session = JSON.parse(body.sessionJson);
    session.author = author;
    session.savedAt = savedAt;
    sessionJson = JSON.stringify(session);
  } catch {
  }
  const { id } = await insertSnapshot({
    appId: body.appId,
    basename,
    sessionJson,
    markdown: body.markdown,
    author,
    savedAt
  });
  return { id, savedAt, author };
}
var EDITOR_SCHEME = {
  cursor: "cursor",
  vscode: "vscode",
  code: "vscode"
};
async function openInEditor(body, opts = {}) {
  const root = resolve(opts.root ?? process.cwd());
  const rel = String(body?.relativePath ?? "");
  if (!rel) return { ok: false, error: "no source path" };
  const abs = resolve(root, rel);
  if (abs !== root && !abs.startsWith(root + sep)) {
    return { ok: false, error: "path outside project" };
  }
  const line = Number.isFinite(body.lineNumber) ? Math.max(1, body.lineNumber) : 1;
  const col = body.columnNumber != null && Number.isFinite(body.columnNumber) ? Math.max(1, body.columnNumber) : 1;
  const editor = (opts.editor ?? process.env.STARLING_EDITOR ?? "cursor").toLowerCase();
  const scheme = EDITOR_SCHEME[editor] ?? editor;
  const goto = `${abs}:${line}:${col}`;
  const attempts = process.platform === "darwin" ? [
    ["open", [`${scheme}://file${goto}`]],
    [editor, ["--goto", goto]],
    ["code", ["--goto", goto]]
  ] : [
    [editor, ["--goto", goto]],
    ["code", ["--goto", goto]]
  ];
  for (const [cmd, args] of attempts) {
    try {
      execFileSync(cmd, args, { cwd: root, stdio: "ignore" });
      return { ok: true };
    } catch {
    }
  }
  return { ok: false, error: "couldn't launch editor" };
}
async function listSnapshots(appId, _opts = {}) {
  return fetchSnapshots({ appId });
}
async function loadSnapshot(id, appId, _opts = {}) {
  if (!id || !appId) return null;
  const found = await fetchSnapshot({ appId, id });
  return found ? found.session : null;
}

// plugin/vite.ts
function starling(options = {}) {
  const base = (options.base ?? "/api/starling").replace(/\/$/, "");
  const serverOpts = {
    root: options.root,
    editor: options.editor
  };
  return {
    name: "starling-endpoints",
    apply: "serve",
    // dev server only
    configureServer(server) {
      server.middlewares.use(`${base}/save`, (req, res, next) => {
        if (req.method !== "POST") return next();
        readJsonBody(req).then(
          async (body) => sendJson(res, 200, await saveSnapshot(body, serverOpts))
        ).catch(() => sendJson(res, 500, { error: "save failed" }));
      });
      server.middlewares.use(`${base}/open`, (req, res, next) => {
        if (req.method !== "POST") return next();
        readJsonBody(req).then(
          async (body) => sendJson(res, 200, await openInEditor(body, serverOpts))
        ).catch(() => sendJson(res, 500, { ok: false, error: "open failed" }));
      });
      server.middlewares.use(`${base}/list`, (req, res, next) => {
        if (req.method !== "GET") return next();
        const url = new URL(req.url ?? "", "http://localhost");
        const appId = url.searchParams.get("app") ?? "";
        listSnapshots(appId, serverOpts).then((snapshots) => sendJson(res, 200, { snapshots })).catch(() => sendJson(res, 200, { snapshots: [] }));
      });
      server.middlewares.use(`${base}/load`, (req, res, next) => {
        if (req.method !== "GET") return next();
        const url = new URL(req.url ?? "", "http://localhost");
        const appId = url.searchParams.get("app") ?? "";
        loadSnapshot(url.searchParams.get("file") ?? "", appId, serverOpts).then((json) => {
          if (json == null) return sendJson(res, 404, { error: "not found" });
          res.statusCode = 200;
          res.setHeader("content-type", "application/json");
          res.end(json);
        }).catch(() => sendJson(res, 404, { error: "not found" }));
      });
    }
  };
}
function readJsonBody(req) {
  return new Promise((resolvePromise, reject) => {
    let raw = "";
    req.on("data", (chunk) => raw += chunk);
    req.on("end", () => {
      try {
        resolvePromise(JSON.parse(raw || "{}"));
      } catch (err) {
        reject(err);
      }
    });
    req.on("error", reject);
  });
}
function sendJson(res, status, body) {
  res.statusCode = status;
  res.setHeader("content-type", "application/json");
  res.end(JSON.stringify(body));
}
function starlingBabelPlugin(options = {}) {
  return [starlingSourcePlugin, options];
}

export { starling, starlingBabelPlugin, starlingSourcePlugin };
//# sourceMappingURL=vite.js.map
//# sourceMappingURL=vite.js.map