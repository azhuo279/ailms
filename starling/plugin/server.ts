/**
 * Starling dev-server endpoint core — the SAVE/LIST/LOAD logic the browser tool
 * POSTs/GETs against. Framework-agnostic: it speaks plain request fields and
 * returns plain result objects, so the Vite plugin (`plugin/vite.ts`) and the Next
 * route factory (`plugin/next.ts`) both mount it without duplicating I/O.
 *
 * Persistence lives in a remote Supabase table (see `plugin/snapshots.ts`); this
 * module is the thin glue that resolves authorship and delegates the actual
 * queries. Authorship is still resolved HERE, server-side, via
 * `git config user.name` — the browser can't read git — and stamped into the
 * saved Session. All operations are scoped by `appId` so one database can back
 * many host apps.
 *
 * Node-only. Never imported by the browser bundle.
 */
import { execFileSync } from "node:child_process";
import { resolve, sep } from "node:path";
import type { SnapshotMeta } from "../src/types";
import { fetchSnapshot, fetchSnapshots, insertSnapshot } from "./snapshots";

export interface StarlingServerOptions {
  /** Project root used to resolve `git config` for authorship. Default: cwd. */
  root?: string;
  /**
   * Editor to open a component's source in on double-click. Default: "cursor"
   * (falls back to `STARLING_EDITOR`, then "cursor"). Currently understood:
   * "cursor" | "vscode". Future-configurable per host.
   */
  editor?: string;
}

export interface SaveBody {
  /** Host-app identifier; scopes the snapshot in the shared database. */
  appId: string;
  basename: string;
  markdown: string;
  sessionJson: string;
}

export interface SaveResponse {
  /** Row id of the inserted snapshot (the key Rewind later loads by). */
  id: string;
  /** ISO timestamp stamped at save time. */
  savedAt: string;
  /** git `user.name` (or `user.email` fallback), null when neither is set. */
  author: string | null;
}

/** Read one `git config <key>`, or null when unset/unavailable. */
function gitConfig(root: string, key: string): string | null {
  try {
    const out = execFileSync("git", ["config", key], {
      cwd: root,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    });
    const v = out.trim();
    return v.length > 0 ? v : null;
  } catch {
    return null;
  }
}

/**
 * Resolve the snapshot author from git: prefer `user.name`, fall back to
 * `user.email` (commonly set even when name isn't). Returns null only when
 * neither is configured — saving must never hinge on git.
 */
export function gitAuthor(root: string): string | null {
  return gitConfig(root, "user.name") ?? gitConfig(root, "user.email");
}

/** Reduce a name to a safe basename — no path components, no extension. */
function sanitizeBasename(name: string): string {
  const trimmed = (name || "").trim().replace(/\.(md|starling\.json)$/i, "");
  const cleaned = trimmed.replace(/[^a-zA-Z0-9._-]/g, "-");
  return cleaned || "starling-annotations";
}

/**
 * Persist the compiled artifact to the remote store. Stamps `author`
 * (`git config user.name`) and `savedAt` into the canonical Session JSON, then
 * inserts one row scoped by `appId`. Returns the new row id plus stamped author.
 */
export async function saveSnapshot(
  body: SaveBody,
  opts: StarlingServerOptions = {},
): Promise<SaveResponse> {
  const root = resolve(opts.root ?? process.cwd());
  const basename = sanitizeBasename(body.basename);
  const author = gitAuthor(root);
  const savedAt = new Date().toISOString();

  // Stamp authorship/time into the canonical Session. Tolerate a malformed body
  // by keeping the raw string so a save never hard-fails on parse.
  let sessionJson = body.sessionJson;
  try {
    const session = JSON.parse(body.sessionJson) as Record<string, unknown>;
    session.author = author;
    session.savedAt = savedAt;
    sessionJson = JSON.stringify(session);
  } catch {
    /* keep the raw body */
  }

  const { id } = await insertSnapshot({
    appId: body.appId,
    basename,
    sessionJson,
    markdown: body.markdown,
    author,
    savedAt,
  });

  return { id, savedAt, author };
}

export interface OpenBody {
  /** Repo-relative path to the source file (e.g. "src/components/Foo.tsx"). */
  relativePath: string;
  /** 1-based line of the targeted JSX element. */
  lineNumber: number;
  /** 1-based column, when known. */
  columnNumber?: number | null;
}

export interface OpenResponse {
  /** Whether an editor launch was dispatched. */
  ok: boolean;
  /** Why a launch was refused/failed, for the client toast. */
  error?: string;
}

/** Editor name → the URL scheme its app registers (`<scheme>://file…`). */
const EDITOR_SCHEME: Record<string, string> = {
  cursor: "cursor",
  vscode: "vscode",
  code: "vscode",
};

/**
 * Open a component's source file in the local editor at the exact line/column.
 * Dev-only and best-effort: launching is fire-and-forget, and any failure is
 * reported as `{ ok:false }` rather than thrown so the browser only ever shows a
 * toast. The path is resolved against (and confined to) the project root — a
 * relative path that escapes the root is refused, so this can't be coerced into
 * opening arbitrary files.
 *
 * Launch strategy (Cursor by default, configurable via `editor` / `STARLING_EDITOR`):
 *   1. macOS — `open "<scheme>://file<abs>:<line>:<col>"`. The URL scheme opens
 *      at the precise line without needing the editor's CLI on PATH.
 *   2. Fallback — the editor's own CLI (`cursor`/`code`) in `--goto` form, then
 *      a plain `code -g`.
 */
export async function openInEditor(
  body: OpenBody,
  opts: StarlingServerOptions = {},
): Promise<OpenResponse> {
  const root = resolve(opts.root ?? process.cwd());
  const rel = String(body?.relativePath ?? "");
  if (!rel) return { ok: false, error: "no source path" };

  const abs = resolve(root, rel);
  // Confine to the project root: refuse paths that resolve outside it.
  if (abs !== root && !abs.startsWith(root + sep)) {
    return { ok: false, error: "path outside project" };
  }

  const line = Number.isFinite(body.lineNumber) ? Math.max(1, body.lineNumber) : 1;
  const col =
    body.columnNumber != null && Number.isFinite(body.columnNumber)
      ? Math.max(1, body.columnNumber)
      : 1;

  const editor = (opts.editor ?? process.env.STARLING_EDITOR ?? "cursor").toLowerCase();
  const scheme = EDITOR_SCHEME[editor] ?? editor;
  const goto = `${abs}:${line}:${col}`;

  const attempts: Array<[string, string[]]> =
    process.platform === "darwin"
      ? [
          ["open", [`${scheme}://file${goto}`]],
          [editor, ["--goto", goto]],
          ["code", ["--goto", goto]],
        ]
      : [
          [editor, ["--goto", goto]],
          ["code", ["--goto", goto]],
        ];

  for (const [cmd, args] of attempts) {
    try {
      execFileSync(cmd, args, { cwd: root, stdio: "ignore" });
      return { ok: true };
    } catch {
      /* try the next launcher */
    }
  }
  return { ok: false, error: "couldn't launch editor" };
}

/**
 * List saved snapshots for one app (newest first) — lightweight metadata only;
 * the heavy Session payload is fetched on select. Unreachable store → [].
 */
export async function listSnapshots(
  appId: string,
  _opts: StarlingServerOptions = {},
): Promise<SnapshotMeta[]> {
  return fetchSnapshots({ appId });
}

/**
 * Load one snapshot's raw Session JSON for Rewind, by row id, scoped to `appId`.
 * Returns null when absent/unreachable. Rewind always restores from JSON.
 */
export async function loadSnapshot(
  id: string,
  appId: string,
  _opts: StarlingServerOptions = {},
): Promise<string | null> {
  if (!id || !appId) return null;
  const found = await fetchSnapshot({ appId, id });
  return found ? found.session : null;
}
