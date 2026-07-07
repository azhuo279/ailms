"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, LayoutGroup, motion, useReducedMotion } from "motion/react";
import { CheckCircle2, ChevronDown, RadioTower, SearchX } from "lucide-react";
import { cn } from "@/lib/utils";
import { EmptyState } from "@/components/ui/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Menu, MenuItem } from "@/components/ui/menu";
import { MessageBar } from "@/components/ui/message-bar";
import { Skeleton } from "@/components/ui/skeleton";
import { ExceptionCard } from "./exception-card";
import { buildSourceStatusMap } from "@/app/workspace/lib/exception-format";
import {
  SORT_MODE_LABEL,
  SORT_MODES,
  type SortMode,
} from "@/app/workspace/lib/exception-sort";
import {
  diffCount,
  diffExceptions,
  isDiffEmpty,
} from "@/app/workspace/lib/exception-feed-updates";
import type {
  ExceptionRecord,
  PriorityTier,
  SourceHealth,
  Warehouse,
} from "@/app/workspace/lib/exception-types";

/** Priority tiers in urgency order — the grouping key that bounds FLIP reorder
 * animations. Matches `PRIORITY_TIER_ORDER` in workspace-filter-bar.tsx. */
const TIER_ORDER: PriorityTier[] = ["T1", "T2", "T3", "T4"];

/**
 * Groups a priority-sorted exception list into per-tier buckets, preserving
 * within-tier order. Tiers with no members are omitted. Used only under
 * `sortMode === "priority"` (the tier is otherwise not the visible ordering
 * key, so grouping by it would fight the chosen sort).
 */
function groupByTier(
  list: ExceptionRecord[],
): Array<{ tier: PriorityTier; items: ExceptionRecord[] }> {
  const buckets = new Map<PriorityTier, ExceptionRecord[]>();
  for (const exception of list) {
    const bucket = buckets.get(exception.priorityTier);
    if (bucket) {
      bucket.push(exception);
    } else {
      buckets.set(exception.priorityTier, [exception]);
    }
  }
  return TIER_ORDER.filter((tier) => buckets.has(tier)).map((tier) => ({
    tier,
    items: buckets.get(tier)!,
  }));
}

export interface ExceptionFeedListProps {
  exceptions: ExceptionRecord[];
  /** Whether any filter/search narrowing is currently active. */
  isFiltered: boolean;
  onClearFilters: () => void;
  selectedId: string | null;
  onSelect: (id: string) => void;
  /**
   * Symmetric-hover link: the exception whose map pin (or site cluster) is
   * hovered. Its card highlights and, if off-screen, scrolls into view.
   */
  highlightedId?: string | null;
  /** Pointer/focus over a card drives the feed→map hover link. */
  onHoverChange?: (id: string | null) => void;
  nowMs: number;
  /** Live source-system health, used to tint each card's source chips. */
  sourceHealth: SourceHealth[];
  /** Warehouse registry — source of each card's location + site name. */
  warehouseMap: Map<string, Warehouse>;
  /** Active sort mode (single source of truth lives in the parent). */
  sortMode: SortMode;
  onSortChange: (mode: SortMode) => void;
  /**
   * Ids the parent just edited directly (e.g. a priority-tier change from the
   * detail view). Unlike simulated background drift, a direct action must land
   * immediately, NOT queue behind the "N updates" banner — so these ids snap the
   * committed baseline forward at once and get the one-shot FLIP entrance. The
   * feed calls `onForceApplied` with the ids once it has committed them so the
   * parent can clear them (the entrance fires only once).
   */
  forceApplyIds?: Set<string>;
  onForceApplied?: (ids: string[]) => void;
  /** True while the feed's own data is (re)loading — renders row skeletons. */
  isLoading?: boolean;
  /** True when the feed couldn't refresh and is showing a stale snapshot. */
  isStale?: boolean;
  className?: string;
}

const SKELETON_ROW_COUNT = 5;

/**
 * Left pane of the Row 3 split view, the "Dynamic Exception Feed". Direction A
 * "Command console": rows are joined by hairline dividers into one crisp,
 * flat feed with a compact sticky header (count + "Sorted by priority").
 * Exceptions arrive pre-sorted by the AI's internal priority score (highest
 * first); the score itself is never passed to or rendered by `ExceptionCard`.
 *
 * Background/live updates (Direction C, ported from the zone-insights-drawer
 * "activity-log feed" pattern) accumulate in a pending queue instead of
 * reordering the list under the ZOM mid-read: an "N updates" banner surfaces
 * at the top of the scroll area, and applying it animates new cards in,
 * resolved cards out, and reordered cards to their new slot WITHIN their
 * existing priority tier only (a tier change exits the old tier and
 * re-enters the new one rather than sliding the whole way across the list).
 *
 * Three distinct empty states:
 * - Zero exceptions in this queue with no filters active: reads as
 *   "verified clear" per Flow 4.1b's explicit note, a positive confirmation,
 *   not a failure or blank screen.
 * - Zero results because of active filters/search: a normal no-results
 *   empty state with a clear-filters action.
 * - Loading: row skeletons matching the card's shape.
 */
export function ExceptionFeedList({
  exceptions,
  isFiltered,
  onClearFilters,
  selectedId,
  onSelect,
  highlightedId = null,
  onHoverChange,
  nowMs,
  sourceHealth,
  warehouseMap,
  sortMode,
  onSortChange,
  forceApplyIds,
  onForceApplied,
  isLoading = false,
  isStale = false,
  className,
}: ExceptionFeedListProps) {
  const sourceStatusMap = useMemo(
    () => buildSourceStatusMap(sourceHealth),
    [sourceHealth],
  );
  const prefersReducedMotion = useReducedMotion();

  // The rendered ("committed") snapshot. The live `exceptions` prop can
  // change underneath this at any time (simulated background updates); those
  // changes queue behind the banner instead of reordering the list in place.
  const [committed, setCommitted] = useState(exceptions);
  const committedRef = useRef(committed);
  committedRef.current = committed;

  // Ids the last "View updates" apply changed, so their card gets a one-shot
  // entrance/highlight treatment instead of every card re-animating.
  const [justApplied, setJustApplied] = useState<Set<string>>(new Set());

  const diff = useMemo(
    () => diffExceptions(committed, exceptions),
    [committed, exceptions],
  );
  const pendingCount = diffCount(diff);
  const hasPending = !isDiffEmpty(diff);

  // A change in filters/sort/queue tab is a direct user action, not a
  // background push — snap the committed baseline forward immediately so
  // filtering never gets stuck behind a stale pending banner. Only genuine
  // background drift (same filtered set, different membership/order) queues.
  // Heuristic: a large membership swing between the last committed set and
  // the incoming set means the working set itself changed (filter/tab/sort),
  // so the baseline resets immediately with no banner. A small drift (a few
  // adds/removes/re-tiers from the simulated background feed) queues instead.
  useEffect(() => {
    const committedIds = new Set(committedRef.current.map((e) => e.id));
    // An empty committed baseline (nothing rendered yet — e.g. this is the
    // very first data delivery, or the previous filter genuinely matched
    // nothing) is never "the same logical list, just wait." Snap forward
    // immediately so the feed never gets stuck showing zero items behind an
    // invisible pending banner.
    if (committedIds.size === 0) {
      if (exceptions.length > 0) setCommitted(exceptions);
      return;
    }
    const nextIds = new Set(exceptions.map((e) => e.id));
    const overlap = [...nextIds].filter((id) => committedIds.has(id)).length;
    const overlapRatio = overlap / committedIds.size;
    if (overlapRatio < 0.5) {
      setCommitted(exceptions);
    }
  }, [exceptions]);

  const handleApplyUpdates = () => {
    const changedIds = new Set([
      ...diff.added,
      ...diff.removed,
      ...diff.reordered,
      ...diff.retiered,
    ]);
    setCommitted(exceptions);
    setJustApplied(changedIds);
    window.setTimeout(() => setJustApplied(new Set()), 700);
  };

  // Direct user edits (e.g. a priority-tier change) must land AT ONCE, not queue
  // behind the background-update banner. When the parent flags ids in
  // `forceApplyIds`, snap the committed baseline forward immediately, give those
  // cards the one-shot FLIP entrance, and tell the parent it can clear them.
  const onForceAppliedRef = useRef(onForceApplied);
  onForceAppliedRef.current = onForceApplied;
  useEffect(() => {
    if (!forceApplyIds || forceApplyIds.size === 0) return;
    const ids = [...forceApplyIds];
    setCommitted(exceptions);
    setJustApplied((prev) => {
      const next = new Set(prev);
      for (const id of ids) next.add(id);
      return next;
    });
    window.setTimeout(() => setJustApplied(new Set()), 700);
    onForceAppliedRef.current?.(ids);
  }, [forceApplyIds, exceptions]);

  // Scroll the map-highlighted card into view when it is off-screen. Native
  // scrollIntoView; smooth under motion-safe, instant when the OS asks for
  // reduced motion (matches the project's motion-safe convention).
  const listRef = useRef<HTMLUListElement>(null);
  useEffect(() => {
    if (!highlightedId) return;
    const el = listRef.current?.querySelector<HTMLElement>(
      `[data-exception-id="${CSS.escape(highlightedId)}"]`,
    );
    if (!el) return;
    el.scrollIntoView({
      behavior: prefersReducedMotion ? "auto" : "smooth",
      block: "nearest",
    });
  }, [highlightedId, prefersReducedMotion]);

  const rendered = committed;

  // FLIP reorder is bounded to within a priority tier only when priority IS
  // the visible ordering (the default and the mode this pattern is scoped
  // to). Under "date detected" / "warehouse name" sort, tier is no longer
  // the key the ZOM is tracking, so the whole list is one group — grouping
  // by tier there would silently reshuffle the chosen sort order instead of
  // just bounding an animation.
  const tierGroups = useMemo<
    Array<{ tier: PriorityTier | "all"; items: ExceptionRecord[] }>
  >(() => {
    if (sortMode !== "priority") {
      return [{ tier: "all", items: rendered }];
    }
    return groupByTier(rendered);
  }, [rendered, sortMode]);

  return (
    <div
      className={cn(
        "flex min-h-0 flex-col rounded-lg shadow-sm bg-surface-raised",
        className,
      )}
    >
      {/* Sticky feed header — section title + count pill (Starling #5) and the
          real sort control (Starling #2, FR-51). Roomier than the old compact
          note row (Starling #1). */}
      <div className="flex shrink-0 items-center justify-between gap-2 border-b border-border-subtle px-3.5 py-3">
        <div className="flex items-center gap-2">
          <h2 className="text-label-l font-semibold text-fg-primary">
            Exception Feed
          </h2>
          {isLoading ? (
            <Skeleton className="h-5 w-8 rounded-full" />
          ) : (
            <Badge
              count={rendered.length}
              tone="neutral"
              className="tabular-nums"
            />
          )}
          {isStale ? (
            <Badge tone="warning" dot>
              Stale
            </Badge>
          ) : null}
        </div>
        <Menu
          align="end"
          trigger={
            <Button
              variant="ghost"
              size="sm"
              trailingIcon={<ChevronDown />}
              disabled={isLoading}
              aria-label={`Sort exceptions, currently ${SORT_MODE_LABEL[sortMode]}`}
            >
              Sort: {SORT_MODE_LABEL[sortMode]}
            </Button>
          }
        >
          {SORT_MODES.map((mode) => (
            <MenuItem
              key={mode}
              checked={mode === sortMode}
              onSelect={() => onSortChange(mode)}
            >
              {SORT_MODE_LABEL[mode]}
            </MenuItem>
          ))}
        </Menu>
      </div>

      {isLoading ? (
        <div
          className="min-h-0 flex-1 overflow-y-auto"
          aria-hidden="true"
        >
          {Array.from({ length: SKELETON_ROW_COUNT }).map((_, i) => (
            <div
              key={i}
              className="flex items-start gap-2.5 border-b border-border-subtle px-3.5 py-4"
            >
              <Skeleton className="h-full w-[3px] self-stretch rounded-sm" />
              <div className="min-w-0 flex-1 space-y-2">
                <Skeleton variant="line" className="w-3/4" />
                <Skeleton variant="line" className="w-2/5" />
                <Skeleton variant="line" className="w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : rendered.length === 0 ? (
        <div className="min-h-0 flex-1 overflow-y-auto">
          {isFiltered ? (
            <EmptyState
              icon={<SearchX className="size-6" aria-hidden="true" />}
              title="No exceptions match these filters"
              description="Try clearing a filter or broadening your search."
              primaryAction={
                <Button variant="secondary" size="sm" onClick={onClearFilters}>
                  Clear filters
                </Button>
              }
            />
          ) : (
            <EmptyState
              icon={<CheckCircle2 className="size-6" aria-hidden="true" />}
              title="Verified clear"
              description="No active exceptions in this queue right now. The feed is live and will update the moment something needs your attention."
            />
          )}
        </div>
      ) : (
        <div className="flex min-h-0 flex-1 flex-col">
          {/* Pending-updates banner — anchored to the feed's own scroll area,
              never a global toast (Direction C). Nothing below reorders,
              enters, or exits until the ZOM explicitly applies. */}
          {hasPending ? (
            <div className="shrink-0 border-b border-border-subtle p-2">
              <MessageBar
                severity="info"
                action={
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={handleApplyUpdates}
                  >
                    View updates
                  </Button>
                }
              >
                <span className="flex items-center gap-1.5">
                  <RadioTower className="size-3.5 shrink-0" aria-hidden="true" />
                  {pendingCount} {pendingCount === 1 ? "update" : "updates"}{" "}
                  while you were viewing
                </span>
              </MessageBar>
            </div>
          ) : null}

          <ul
            ref={listRef}
            className="min-h-0 flex-1 overflow-y-auto"
            role="list"
            aria-label={`Dynamic exception feed, sorted by ${SORT_MODE_LABEL[sortMode].toLowerCase()}`}
          >
            {tierGroups.map(({ tier, items }) => (
              // Each tier gets its own LayoutGroup, so Motion's shared-layout
              // FLIP measurement is scoped to cards within that tier only —
              // a card can never be measured against, or animate across, a
              // position in a different tier's section. A tier CHANGE moves
              // an id to a different group entirely, which Motion treats as
              // an unmount in the old group + a fresh mount in the new one
              // (exit + re-entry), never a cross-group translate.
              <LayoutGroup key={tier} id={`tier-${tier}`}>
                <AnimatePresence initial={false}>
                  {items.map((exception) => (
                    <motion.li
                      key={exception.id}
                      layout={prefersReducedMotion ? false : "position"}
                      data-exception-id={exception.id}
                      initial={
                        justApplied.has(exception.id) && !prefersReducedMotion
                          ? { opacity: 0, y: -8 }
                          : false
                      }
                      animate={{ opacity: 1, y: 0 }}
                      exit={
                        prefersReducedMotion
                          ? { opacity: 0 }
                          : {
                              opacity: 0,
                              scale: 0.97,
                              transition: {
                                duration: 0.2,
                                ease: [0.4, 0, 1, 1],
                              },
                            }
                      }
                      transition={{
                        layout: { duration: 0.26, ease: [0, 0, 0.2, 1] },
                        opacity: { duration: 0.22 },
                        y: { duration: 0.26, ease: [0, 0, 0.2, 1] },
                      }}
                      className={cn(
                        justApplied.has(exception.id) &&
                          !prefersReducedMotion &&
                          "motion-safe:shadow-[inset_2px_0_0_var(--color-ai-border)]",
                      )}
                    >
                      <ExceptionCard
                        exception={exception}
                        selected={exception.id === selectedId}
                        highlighted={exception.id === highlightedId}
                        onSelect={onSelect}
                        onHoverChange={onHoverChange}
                        nowMs={nowMs}
                        sourceStatusMap={sourceStatusMap}
                        warehouseMap={warehouseMap}
                        showPriorityUpdatePing={justApplied.has(exception.id)}
                      />
                    </motion.li>
                  ))}
                </AnimatePresence>
              </LayoutGroup>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
