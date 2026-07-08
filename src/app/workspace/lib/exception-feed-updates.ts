import type { ExceptionRecord } from "./exception-types";

/**
 * Batched-update queue for the Dynamic Exception Feed (Direction C, ported
 * from the zone-insights-drawer "activity-log feed" pattern — see
 * inventor-workspace/brief-zone-insights-drawer-20260706-105744-h230ym.md).
 *
 * The feed list renders a frozen `committed` snapshot. Whenever the caller's
 * live `exceptions` prop changes underneath it (a new exception arrives, one
 * resolves out of the queue, or a priority tier changes), the diff is queued
 * rather than applied immediately — nothing visibly reorders while the ZOM is
 * mid-read. A banner surfaces the pending count; applying it swaps the
 * committed snapshot to the latest live set in one step, which the feed list
 * then animates (enter / exit / FLIP reorder-within-tier).
 */

export interface ExceptionDiff {
  added: string[];
  removed: string[];
  /** Ids whose priorityTier stayed the same but whose position within that tier moved. */
  reordered: string[];
  /** Ids whose priorityTier changed — handled as an exit from the old tier + entry into the new one. */
  retiered: string[];
  /**
   * Ids whose tier and order are unchanged but whose data was updated in place
   * (e.g. a score bump that didn't cross a tier boundary, detected via
   * `lastUpdatedAt`). These surface in the View-updates banner so no
   * reprioritization silently bypasses the queue.
   */
  reprioritized: string[];
}

export function isDiffEmpty(diff: ExceptionDiff): boolean {
  return (
    diff.added.length === 0 &&
    diff.removed.length === 0 &&
    diff.reordered.length === 0 &&
    diff.retiered.length === 0 &&
    diff.reprioritized.length === 0
  );
}

export function diffCount(diff: ExceptionDiff): number {
  return (
    diff.added.length +
    diff.removed.length +
    diff.reordered.length +
    diff.retiered.length +
    diff.reprioritized.length
  );
}

/**
 * Computes what changed between the currently-rendered (committed) list and
 * the latest live list, scoped so reordering is only ever detected WITHIN a
 * priority tier — a tier change is classified as `retiered`, never as an
 * in-place reorder, so the feed list never animates a card across the whole
 * list in one leap.
 */
export function diffExceptions(
  committed: ExceptionRecord[],
  incoming: ExceptionRecord[],
): ExceptionDiff {
  const committedById = new Map(committed.map((e) => [e.id, e]));
  const incomingById = new Map(incoming.map((e) => [e.id, e]));

  const added: string[] = [];
  const removed: string[] = [];
  const reordered: string[] = [];
  const retiered: string[] = [];
  const reprioritized: string[] = [];

  for (const exception of incoming) {
    const prev = committedById.get(exception.id);
    if (!prev) {
      added.push(exception.id);
      continue;
    }
    if (prev.priorityTier !== exception.priorityTier) {
      retiered.push(exception.id);
      continue;
    }
    // Same tier — detect in-place updates via lastUpdatedAt so a score bump
    // that doesn't cross a tier boundary (e.g. T1 can't escalate further)
    // still surfaces in the View-updates banner rather than silently landing.
    if (prev.lastUpdatedAt !== exception.lastUpdatedAt) {
      reprioritized.push(exception.id);
    }
  }

  for (const exception of committed) {
    if (!incomingById.has(exception.id)) {
      removed.push(exception.id);
    }
  }

  // Within-tier order check: for each tier present in both snapshots, compare
  // the relative order of the ids common to both. Any id whose neighbors
  // changed counts the tier as reordered (all its members are flagged so
  // ExceptionFeedList's Motion `layout` animation has every id it needs to
  // treat as moved within that tier's LayoutGroup).
  const tiers = new Set([
    ...committed.map((e) => e.priorityTier),
    ...incoming.map((e) => e.priorityTier),
  ]);
  for (const tier of tiers) {
    const committedIds = committed
      .filter((e) => e.priorityTier === tier && incomingById.has(e.id))
      .map((e) => e.id)
      .filter((id) => incomingById.get(id)?.priorityTier === tier);
    const incomingIds = incoming
      .filter((e) => e.priorityTier === tier && committedById.has(e.id))
      .map((e) => e.id)
      .filter((id) => committedById.get(id)?.priorityTier === tier);
    const sameOrder = committedIds.every((id, i) => id === incomingIds[i]);
    if (!sameOrder) {
      reordered.push(...incomingIds);
    }
  }

  return {
    added: [...new Set(added)],
    removed: [...new Set(removed)],
    reordered: [...new Set(reordered)],
    retiered: [...new Set(retiered)],
    reprioritized: [...new Set(reprioritized)],
  };
}
