/**
 * Supabase connection config for Starling's annotation store.
 *
 * The `anon` key is PUBLISHABLE by design (like a Firebase web config): security
 * is enforced by Row-Level Security policies on `starling_snapshots`, NOT by
 * keeping this value secret. It is therefore safe to commit — which is exactly
 * what lets every local `npm run dev` clone read/write the shared store with zero
 * per-user setup and no deployment. NEVER put the service-role key here; that one
 * is full-admin and must stay out of the repo.
 *
 * Both values fall back to committed defaults but can be overridden by env (e.g.
 * to point a fork at a different project) without touching code.
 */
export const SUPABASE_URL =
  process.env.STARLING_SUPABASE_URL ??
  "https://jxliasrgjeidqwrecbye.supabase.co";

export const SUPABASE_ANON_KEY =
  process.env.STARLING_SUPABASE_ANON_KEY ??
  "sb_publishable_-r9ZwhBlSUpRf0iB69K08Q_tonn_jB5";

export const SNAPSHOTS_TABLE = "starling_snapshots";

/** Base PostgREST URL for the snapshots table. */
export const SNAPSHOTS_URL = `${SUPABASE_URL}/rest/v1/${SNAPSHOTS_TABLE}`;

/** Headers every PostgREST request needs (anon auth). */
export function supabaseHeaders(
  extra?: Record<string, string>,
): Record<string, string> {
  return {
    apikey: SUPABASE_ANON_KEY,
    authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    ...extra,
  };
}
