/**
 * groupBy — replaces `lodash.groupBy`. Preserves first-seen key order so the
 * compiled artifact's route sections are deterministic.
 */
export function groupBy<T>(
  items: readonly T[],
  keyOf: (item: T) => string,
): Record<string, T[]> {
  const out: Record<string, T[]> = {};
  for (const item of items) {
    const key = keyOf(item);
    (out[key] ??= []).push(item);
  }
  return out;
}
