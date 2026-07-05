/**
 * Save the compiled snapshot to the shared remote store via a dev-server
 * endpoint. There is no browser-download path — Compile always persists so
 * feedback lands where an agent (and Rewind) can read it, and propagates to
 * other users with no git push/pull.
 *
 * The endpoint receives `appId` + a basename + the two artifacts; the server
 * stamps authorship (`git config user.name`) into the Session and inserts one
 * row scoped by `appId`. We post the Session JSON as the round-trippable source
 * of truth for Rewind (which never parses Markdown).
 */
export interface SaveResult {
  /** Row id of the saved snapshot (the key Rewind later loads by). */
  id: string;
  /** ISO timestamp the server stamped at save time. */
  savedAt: string;
  /**
   * Author the server stamped into the saved session, read from
   * `git config user.name`. `null` when git is unconfigured or the server
   * doesn't report it — the save still succeeded.
   */
  author?: string | null;
}

/**
 * POST `{ appId, basename, markdown, sessionJson }` to the save endpoint. Returns
 * the saved row id on success, or `null` on any non-OK response / network error
 * so the caller can surface an error toast. Never throws.
 */
export async function saveSnapshotToEndpoint(
  endpoint: string,
  appId: string,
  basename: string,
  markdown: string,
  sessionJson: string,
): Promise<SaveResult | null> {
  const safe = sanitizeBasename(basename);
  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ appId, basename: safe, markdown, sessionJson }),
    });
    if (!res.ok) return null;
    const data = (await res.json().catch(() => null)) as Partial<SaveResult> | null;
    if (!data || typeof data.id !== "string") return null;
    // `author` is best-effort: the server stamps it from `git config user.name`,
    // but the save is valid even when git is unconfigured or the field is absent.
    const author = typeof data.author === "string" ? data.author : null;
    const savedAt = typeof data.savedAt === "string" ? data.savedAt : "";
    return { id: data.id, savedAt, author };
  } catch {
    return null;
  }
}

/**
 * POST a source location to the open endpoint so the dev server launches the
 * local editor at that file:line. Returns `true` when the server reported a
 * launch, `false` on any non-OK response, network error, or refusal — so the
 * caller can toast. Never throws.
 */
export async function openSourceAtEndpoint(
  endpoint: string,
  location: { relativePath: string; lineNumber: number; columnNumber: number | null },
): Promise<boolean> {
  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(location),
    });
    if (!res.ok) return false;
    const data = (await res.json().catch(() => null)) as { ok?: boolean } | null;
    return data?.ok === true;
  } catch {
    return false;
  }
}

/**
 * Reduce a name to a safe basename (no extension, no path components). The server
 * sanitizes again defensively, but trimming client-side keeps the request clean.
 */
function sanitizeBasename(name: string): string {
  const trimmed = (name || "").trim().replace(/\.(md|starling\.json)$/i, "");
  const cleaned = trimmed.replace(/[^a-zA-Z0-9._-]/g, "-");
  return cleaned || "starling-annotations";
}
