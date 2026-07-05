import { createRequire } from 'module';
import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { join, dirname, resolve, sep } from 'path';
import { execFileSync } from 'child_process';

// plugin/next.ts

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

// plugin/next.ts
function scaffoldRoute(root, appDir) {
  try {
    const dir = appDir ?? (existsSync(join(root, "src/app")) ? "src/app" : "app");
    if (!existsSync(join(root, dir))) return null;
    const file = join(root, dir, "api", "starling", "[action]", "route.ts");
    if (existsSync(file)) return null;
    mkdirSync(dirname(file), { recursive: true });
    writeFileSync(
      file,
      `// Auto-generated by withStarling() \u2014 serves Starling's save/list/load.
// Safe to delete; it'll be recreated on next dev start (or remove the
// <Starling/> mount + withStarling wrapper to uninstall entirely).
import { createStarlingRoute } from "@starling/dev/next/config";

export const { GET, POST } = createStarlingRoute();
`,
      "utf8"
    );
    return file;
  } catch {
    return null;
  }
}
function withStarling(nextConfig = {}, opts = {}) {
  const enabled = opts.enabled ?? process.env.NODE_ENV !== "production";
  if (!enabled) return nextConfig;
  const root = opts.root ?? process.cwd();
  if (opts.autoRoute !== false) {
    const written = scaffoldRoute(root, opts.appDir);
    if (written) {
      console.log(`[starling] created ${written}`);
    }
  }
  let loaderPath = null;
  try {
    loaderPath = createRequire(import.meta.url).resolve("./loader.cjs");
  } catch {
    loaderPath = null;
  }
  const userWebpack = nextConfig.webpack;
  const rule = loaderPath ? { loader: loaderPath, options: { root } } : null;
  return {
    ...nextConfig,
    // Next 16 errors on a `webpack` config with no `turbopack` config (Turbopack
    // is the default engine). An empty turbopack config silences that check while
    // we intentionally register only the webpack rule (see caveat above).
    turbopack: { ...nextConfig.turbopack },
    webpack(config, ctx) {
      if (ctx?.dev && rule) {
        config.module.rules.push({
          test: /\.[jt]sx$/,
          exclude: /node_modules/,
          use: [rule]
        });
      }
      return typeof userWebpack === "function" ? userWebpack(config, ctx) : config;
    }
  };
}
var next_default = withStarling;
function createStarlingRoute(options = {}) {
  const action = (req) => {
    const segs = new URL(req.url).pathname.split("/").filter(Boolean);
    return segs[segs.length - 1] ?? "";
  };
  const json = (body, status = 200) => new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" }
  });
  async function POST(req) {
    const which = action(req);
    if (which === "open") {
      try {
        const body = await req.json();
        return json(await openInEditor(body, options));
      } catch {
        return json({ ok: false, error: "open failed" }, 500);
      }
    }
    if (which !== "save") return json({ error: "not found" }, 404);
    try {
      const body = await req.json();
      return json(await saveSnapshot(body, options));
    } catch {
      return json({ error: "save failed" }, 500);
    }
  }
  async function GET(req) {
    const url = new URL(req.url);
    const which = action(req);
    const appId = url.searchParams.get("app") ?? "";
    if (which === "list") {
      return json({ snapshots: await listSnapshots(appId, options) });
    }
    if (which === "load") {
      const id = url.searchParams.get("file") ?? "";
      const session = await loadSnapshot(id, appId, options);
      return session == null ? json({ error: "not found" }, 404) : new Response(session, {
        status: 200,
        headers: { "content-type": "application/json" }
      });
    }
    return json({ error: "not found" }, 404);
  }
  return { GET, POST };
}

export { createStarlingRoute, next_default as default, withStarling };
//# sourceMappingURL=next.js.map
//# sourceMappingURL=next.js.map