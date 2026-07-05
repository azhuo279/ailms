/**
 * Starling's annotation data-access layer — the SINGLE place every DB query
 * lives. Both the Next dev route (plugin/next.ts → plugin/server.ts) and the
 * agent entrypoint (scripts/fetch.mjs) are thin callers of these functions; no
 * query logic is duplicated anywhere else.
 *
 * Talks to Supabase over PostgREST with plain `fetch` (no SDK dependency — Node
 * 18+ and every modern browser/runtime ship `fetch`). Reads and writes are
 * scoped by `appId`, so one database can back many host apps.
 */
import type { SnapshotMeta } from "../src/types";
import { SNAPSHOTS_URL, supabaseHeaders } from "./supabase";

/** Columns pulled for the lightweight Rewind/agent listing. */
const META_SELECT = "id,basename,author,version,annotation_count,saved_at";

export interface InsertSnapshotInput {
  appId: string;
  basename: string;
  /** Canonical Session JSON, already author/savedAt-stamped by the caller. */
  sessionJson: string;
  /** Compiled human-readable Markdown artifact. */
  markdown: string;
  author: string | null;
  savedAt: string;
}

export interface InsertSnapshotResult {
  id: string;
  savedAt: string;
  author: string | null;
}

/**
 * Resolve snapshots by metadata — the prompter never needs a snapshot id. Only
 * `appId` is required; every other field narrows the result set.
 */
export interface SnapshotQuery {
  appId: string;
  /** Case-insensitive substring match on author. */
  author?: string;
  /** ISO timestamp; saved_at >= since. */
  since?: string;
  /** ISO timestamp; saved_at <= until. */
  until?: string;
  /** Case-insensitive substring match on basename. */
  basename?: string;
  /** Cap the number of results. */
  limit?: number;
  /** Shorthand for "newest first, limit 1". */
  latest?: boolean;
}

/** Row shape as returned by META_SELECT. */
interface SnapshotRow {
  id: string;
  basename: string;
  author: string | null;
  version: number | null;
  annotation_count: number | null;
  saved_at: string;
}

/**
 * Append one snapshot to the store. Parses `sessionJson` once to (a) store the
 * Session as native `jsonb` and (b) derive `session_id` / `version` /
 * `annotation_count`. A malformed session is stored as `{}` rather than failing
 * the save (the metadata just degrades to zero/null).
 */
export async function insertSnapshot(
  input: InsertSnapshotInput,
): Promise<InsertSnapshotResult> {
  let session: Record<string, unknown> = {};
  try {
    session = JSON.parse(input.sessionJson) as Record<string, unknown>;
  } catch {
    /* malformed — store empty object, keep going */
  }
  const annotations = Array.isArray((session as { annotations?: unknown[] }).annotations)
    ? (session as { annotations: unknown[] }).annotations
    : [];

  const row = {
    app_id: input.appId,
    basename: input.basename,
    session_id:
      typeof session.sessionId === "string" ? session.sessionId : null,
    author: input.author,
    version: typeof session.version === "number" ? session.version : null,
    annotation_count: annotations.length,
    saved_at: input.savedAt,
    session_json: session,
    markdown: input.markdown,
  };

  const res = await fetch(SNAPSHOTS_URL, {
    method: "POST",
    headers: supabaseHeaders({
      "content-type": "application/json",
      prefer: "return=representation",
    }),
    body: JSON.stringify(row),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`starling insert failed: ${res.status} ${detail}`);
  }
  const created = (await res.json()) as Array<{
    id: string;
    saved_at: string;
    author: string | null;
  }>;
  const first = created[0];
  if (!first) {
    throw new Error("starling insert returned no row");
  }
  return {
    id: first.id,
    savedAt: first.saved_at,
    author: first.author,
  };
}

/**
 * Resolve snapshots by metadata, newest first. Builds the PostgREST query from
 * whichever filters are present. Network/HTTP failures degrade to `[]` so the
 * caller (Rewind sidebar) keeps working with only the live session.
 */
export async function fetchSnapshots(q: SnapshotQuery): Promise<SnapshotMeta[]> {
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

  let rows: SnapshotRow[];
  try {
    const res = await fetch(`${SNAPSHOTS_URL}?${params.toString()}`, {
      headers: supabaseHeaders(),
    });
    if (!res.ok) return [];
    rows = (await res.json()) as SnapshotRow[];
  } catch {
    return []; // unreachable DB: only the live session shows
  }

  return rows.map((r) => ({
    // `filename` carries the stable row id — the key passed back to load. The
    // sidebar shows `basename` for humans.
    filename: r.id,
    basename: r.basename,
    annotationCount: r.annotation_count ?? 0,
    savedAt: r.saved_at,
    version: r.version,
    author: r.author,
  }));
}

/**
 * Load one snapshot's Session JSON (+ its compiled Markdown) by row id, scoped to
 * `appId`. Returns the Session as a JSON string (Rewind always restores from JSON,
 * never Markdown). `null` when absent or unreachable.
 */
export async function fetchSnapshot(params: {
  appId: string;
  id: string;
}): Promise<{ session: string; markdown: string } | null> {
  const qp = new URLSearchParams();
  qp.append("app_id", `eq.${params.appId}`);
  qp.append("id", `eq.${params.id}`);
  qp.append("select", "session_json,markdown");
  qp.append("limit", "1");
  try {
    const res = await fetch(`${SNAPSHOTS_URL}?${qp.toString()}`, {
      headers: supabaseHeaders(),
    });
    if (!res.ok) return null;
    const rows = (await res.json()) as Array<{
      session_json: unknown;
      markdown: string | null;
    }>;
    const row = rows[0];
    if (!row) return null;
    return {
      session: JSON.stringify(row.session_json),
      markdown: row.markdown ?? "",
    };
  } catch {
    return null;
  }
}
