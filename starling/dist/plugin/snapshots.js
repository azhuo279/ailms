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

export { fetchSnapshot, fetchSnapshots, insertSnapshot };
//# sourceMappingURL=snapshots.js.map
//# sourceMappingURL=snapshots.js.map