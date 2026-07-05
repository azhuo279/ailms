/**
 * Lightweight metadata for one saved snapshot, returned by the `list` endpoint
 * and rendered in the Rewind sidebar. The heavy `annotations` payload is only
 * fetched on select.
 */
interface SnapshotMeta {
    /**
     * Stable lookup key passed back to the `load` endpoint. Holds the snapshot's
     * remote row id (historically a `*.starling.json` filename).
     */
    filename: string;
    /** Human-readable label, e.g. "starling-7-annotations-2026-06-10-1432". */
    basename: string;
    annotationCount: number;
    /** ISO timestamp (session.savedAt, else file mtime). */
    savedAt: string;
    version: number | null;
    author: string | null;
}

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

interface InsertSnapshotInput {
    appId: string;
    basename: string;
    /** Canonical Session JSON, already author/savedAt-stamped by the caller. */
    sessionJson: string;
    /** Compiled human-readable Markdown artifact. */
    markdown: string;
    author: string | null;
    savedAt: string;
}
interface InsertSnapshotResult {
    id: string;
    savedAt: string;
    author: string | null;
}
/**
 * Resolve snapshots by metadata — the prompter never needs a snapshot id. Only
 * `appId` is required; every other field narrows the result set.
 */
interface SnapshotQuery {
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
/**
 * Append one snapshot to the store. Parses `sessionJson` once to (a) store the
 * Session as native `jsonb` and (b) derive `session_id` / `version` /
 * `annotation_count`. A malformed session is stored as `{}` rather than failing
 * the save (the metadata just degrades to zero/null).
 */
declare function insertSnapshot(input: InsertSnapshotInput): Promise<InsertSnapshotResult>;
/**
 * Resolve snapshots by metadata, newest first. Builds the PostgREST query from
 * whichever filters are present. Network/HTTP failures degrade to `[]` so the
 * caller (Rewind sidebar) keeps working with only the live session.
 */
declare function fetchSnapshots(q: SnapshotQuery): Promise<SnapshotMeta[]>;
/**
 * Load one snapshot's Session JSON (+ its compiled Markdown) by row id, scoped to
 * `appId`. Returns the Session as a JSON string (Rewind always restores from JSON,
 * never Markdown). `null` when absent or unreachable.
 */
declare function fetchSnapshot(params: {
    appId: string;
    id: string;
}): Promise<{
    session: string;
    markdown: string;
} | null>;

export { type InsertSnapshotInput, type InsertSnapshotResult, type SnapshotQuery, fetchSnapshot, fetchSnapshots, insertSnapshot };
