"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown, Clock, Sparkles, ThumbsDown, ThumbsUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { Drawer } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Tag } from "@/components/ui/tag";
import { EpistemicTag } from "@/components/ui/epistemic-status";
import { EmptyState } from "@/components/ui/empty-state";
import { MessageBar } from "@/components/ui/message-bar";
import { PriorityTierBadge } from "@/components/ui/priority-tier-badge";
import { Skeleton } from "@/components/ui/skeleton";
import { renderBoldMarkdown, INSIGHT_SEVERITY_LABEL } from "../lib/performance-format";
import type { InsightSeverity, ZoneInsight } from "../lib/performance-types";

/**
 * "View all active AI insights" — right-side drawer + accordion expand-in-place.
 *
 * Surfaces every active AI insight for the Zone tab as a scrollable list of
 * insight CARDS inside the canonical Drawer (portalled to document.body,
 * focus-trapped, escape-to-close, enter/exit motion). Each card expands IN
 * PLACE (accordion) to reveal its fuller narrative, supporting metric,
 * provenance, and per-insight thumbs up/down feedback — there is no separate
 * detail panel and no back navigation.
 *
 * PRIORITY, NOT A SCORE (intentional deviation from the inventor mock): the
 * inventor variant showed a quantitative "impact score" column. Per the standing
 * project convention (performance-types.ts header + exception-types.ts), the raw
 * AI ranking number is INTERNAL and never surfaces. Priority is expressed only
 * via (1) the coarse severity vocabulary — needs-attention → PriorityTierBadge
 * on the reserved severity ramp, watch → Tag tone="warning", on-track → neutral
 * — and (2) list ORDER (`rank`). No numeric score is rendered anywhere.
 *
 * LIVE UPDATES ARE BATCHED, NOT CONTINUOUS (Starling annotation
 * f7119c49-fcb0-4c6a-9eba-d63eb675dd84 — inventor Variant C gating + Variant A
 * motion payload, see brief-zone-insights-drawer-20260706-105744-h230ym.md):
 * while the drawer is open, simulated background changes (a new insight
 * arrives, one resolves, one re-ranks within its own severity tier) accumulate
 * silently in a pending queue. Nothing in the list changes shape until the user
 * clicks "View updates" on the feed-anchored `MessageBar`. That click is the
 * single moment every queued change applies at once, animated as a FLIP batch:
 * new cards fade+rise in, resolved cards collapse+fade out, and cards that
 * changed rank animate their position delta. Reordering never crosses a
 * severity tier boundary — only reshuffles within "Needs attention" / "Watch" /
 * "On track" — per the influencer synthesis that cross-tier jumps are
 * disorienting in a ranked list a director is actively scanning.
 */

/** Reveal motion for the expanded body — matches AiSummaryCard's `REVEAL`. */
const REVEAL = "motion-safe:animate-[empty-state-rise-in_200ms_ease-out_both]";

/** FLIP batch motion (see globals.css for the full rationale + timings). */
const CARD_ENTER =
  "motion-safe:animate-[insight-card-enter_260ms_cubic-bezier(0,0,0.2,1)_both]";
const CARD_EXIT =
  "motion-safe:animate-[insight-card-exit_220ms_cubic-bezier(0.4,0,1,1)_both]";
const CARD_MOVE_MS = 280;
const CARD_MOVE_EASING = "cubic-bezier(0,0,0.2,1)";

/** How often a background change is simulated while the drawer stays open. */
const SIMULATION_INTERVAL_MS = 9_000;

/** Coarse severity → its reserved-ramp badge. Never a numeric score. */
function InsightSeverityBadge({ severity }: { severity: InsightSeverity }) {
  if (severity === "needs-attention") {
    // True needs-attention → reserved severity ramp via PriorityTierBadge (T1),
    // matching how the breakdown table renders a needs-attention warehouse.
    return <PriorityTierBadge tier="T1" />;
  }
  if (severity === "watch") {
    return (
      <Tag tone="warning" size="md">
        {INSIGHT_SEVERITY_LABEL.watch}
      </Tag>
    );
  }
  return (
    <Tag tone="neutral" size="md">
      {INSIGHT_SEVERITY_LABEL["on-track"]}
    </Tag>
  );
}

/**
 * One expand-in-place insight card. Collapsed: the headline digest clamped to
 * three lines on the `.ai-card` glass. Expanded (accordion, in place): the
 * fuller narrative, supporting metric, provenance, and local thumbs feedback.
 * Structure/classes copied from the canonical `AiSummaryCard`. Content is
 * unchanged by the batched-update motion layer — only the wrapping container
 * (`ZoneInsightsDrawer`) orchestrates enter/exit/move.
 */
function InsightCard({ insight }: { insight: ZoneInsight }) {
  const [expanded, setExpanded] = useState(false);
  const [feedback, setFeedback] = useState<"up" | "down" | null>(null);

  return (
    <div className="ai-card p-3.5">
      <div className="flex min-w-0 items-start gap-2">
        <Sparkles
          className="mt-0.5 size-4 shrink-0 text-ai-emphasis"
          aria-hidden="true"
        />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <InsightSeverityBadge severity={insight.severity} />
            <Tag tone="neutral" size="sm">
              {insight.category}
            </Tag>
          </div>

          {/* Digest — clamped to 3 lines when collapsed (canonical pattern). */}
          <p
            className={cn(
              "mt-2 text-body-m text-fg-primary",
              !expanded && "line-clamp-3",
            )}
          >
            {renderBoldMarkdown(insight.headline)}
          </p>

          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            aria-expanded={expanded}
            className="mt-2 inline-flex items-center gap-1 rounded-md text-label-m font-medium text-ai-fg transition-colors hover:bg-ai-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
          >
            {expanded ? "Hide summary" : "Full summary"}
            <ChevronDown
              aria-hidden="true"
              className={cn(
                "size-4 shrink-0 transition-transform",
                expanded && "rotate-180",
              )}
            />
          </button>
        </div>
      </div>

      {expanded ? (
        <div className={cn("mt-3 border-t border-ai-border/30 pt-3", REVEAL)}>
          <div className="flex items-center gap-2">
            <Sparkles className="size-4 shrink-0 text-ai-fg" aria-hidden="true" />
            <span className="text-label-s font-semibold uppercase tracking-wide text-ai-fg">
              {insight.warehouseName ?? "Zone-wide"}
            </span>
            <EpistemicTag tone="ai" label="AI insight" className="ml-auto" />
          </div>

          <p className="mt-2 text-body-m text-fg-secondary">
            {renderBoldMarkdown(insight.narrative)}
          </p>

          <dl className="mt-3 flex flex-col gap-3">
            <div className="flex flex-col gap-0.5">
              <dt className="text-footnote text-fg-muted">Supporting metric</dt>
              <dd className="text-body-m font-medium tabular-nums text-fg-primary">
                {insight.metric}
              </dd>
            </div>
            <div className="flex items-center gap-1.5 text-footnote text-fg-muted">
              <Clock className="size-3.5 shrink-0" aria-hidden="true" />
              <span>Generated {insight.updatedLabel}</span>
            </div>
          </dl>

          {/* Local acknowledgment feedback — no backend, matching ZoneNarrativeBanner. */}
          <div className="mt-3 flex items-center gap-2 border-t border-ai-border/30 pt-3">
            <span className="text-label-s text-fg-secondary">
              Was this insight helpful?
            </span>
            <div
              className="flex items-center gap-1"
              role="group"
              aria-label="Was this insight helpful?"
            >
              <Button
                iconOnly
                variant="ghost"
                size="sm"
                icon={<ThumbsUp />}
                aria-label="Helpful"
                isSelected={feedback === "up"}
                onClick={() => setFeedback((f) => (f === "up" ? null : "up"))}
              />
              <Button
                iconOnly
                variant="ghost"
                size="sm"
                icon={<ThumbsDown />}
                aria-label="Not helpful"
                isSelected={feedback === "down"}
                onClick={() => setFeedback((f) => (f === "down" ? null : "down"))}
              />
            </div>
            {feedback ? (
              <span role="status" className="text-footnote text-fg-muted">
                Thanks for the feedback.
              </span>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function InsightListSkeleton() {
  return (
    <div className="flex flex-col gap-3" aria-hidden="true">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="ai-card flex flex-col gap-2 p-3.5">
          <Skeleton variant="line" className="w-1/3" />
          <Skeleton variant="line" className="w-4/5" />
          <Skeleton variant="line" className="w-1/4" />
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Batched background-update simulation
// ---------------------------------------------------------------------------

type PendingUpdateKind = "added" | "resolved" | "reranked";

interface PendingUpdate {
  kind: PendingUpdateKind;
  insightId: string;
}

/** A tiny deterministic pool of "new insight" candidates the simulator draws from. */
const SIMULATED_INSIGHT_POOL: Omit<ZoneInsight, "id" | "rank" | "isLead">[] = [
  {
    category: "Carrier Delay",
    severity: "watch",
    headline:
      "**Rio Bravo DC** carrier dwell time is up **34%** versus its weekly average.",
    narrative:
      "Dwell time at the carrier yard has climbed steadily over the past three shifts, driven by a single underperforming lane. No dock congestion is contributing yet.",
    metric: "34% above weekly average",
    warehouseName: "Rio Bravo DC",
    updatedLabel: "just now",
  },
  {
    category: "Inventory Discrepancy",
    severity: "watch",
    headline:
      "**El Paso East DC** flagged a **cycle count mismatch** in zone 4 racking.",
    narrative:
      "A routine cycle count surfaced a variance against system-of-record quantities in one racking zone. Scope is contained to a single zone so far.",
    metric: "1 zone affected",
    warehouseName: "El Paso East DC",
    updatedLabel: "just now",
  },
];

/**
 * Applies one simulated pending update kind to a working insight list,
 * returning the new list. Reorder is bounded to within the moved insight's
 * own severity tier (never promotes/demotes across tiers) per the influencer
 * synthesis. Pure function — no state, easy to reason about per update.
 */
function applyPendingUpdate(
  insights: ZoneInsight[],
  update: PendingUpdate,
  nextIdRef: { current: number },
): ZoneInsight[] {
  if (update.kind === "added") {
    const pick =
      SIMULATED_INSIGHT_POOL[nextIdRef.current % SIMULATED_INSIGHT_POOL.length];
    const newInsight: ZoneInsight = {
      ...pick,
      id: `sim-${nextIdRef.current}`,
      rank: 0,
      isLead: false,
    };
    nextIdRef.current += 1;
    // New insights enter at the front of their tier — most-recent-first within
    // "watch" (the pool never generates a needs-attention insight, matching
    // the brief's bias toward bounded, low-drama background change).
    const insertAt = insights.findIndex((i) => i.severity === newInsight.severity);
    const at = insertAt === -1 ? insights.length : insertAt;
    const next = [...insights.slice(0, at), newInsight, ...insights.slice(at)];
    return next.map((insight, i) => ({ ...insight, rank: i + 1 }));
  }

  if (update.kind === "resolved") {
    const next = insights.filter((i) => i.id !== update.insightId);
    return next.map((insight, i) => ({ ...insight, rank: i + 1 }));
  }

  // "reranked" — move the target insight one position up within its own tier.
  const idx = insights.findIndex((i) => i.id === update.insightId);
  if (idx <= 0) return insights;
  const target = insights[idx];
  const above = insights[idx - 1];
  if (above.severity !== target.severity) return insights;
  const next = [...insights];
  next[idx - 1] = target;
  next[idx] = above;
  return next.map((insight, i) => ({ ...insight, rank: i + 1 }));
}

function pendingSummaryLabel(count: number): string {
  return `${count} ${count === 1 ? "update" : "updates"} while you were viewing`;
}

// ---------------------------------------------------------------------------
// FLIP batch application
// ---------------------------------------------------------------------------

interface CardMotionState {
  entering: Set<string>;
  exiting: Set<string>;
}

export interface ZoneInsightsDrawerProps {
  open: boolean;
  onClose: () => void;
  insights: ZoneInsight[];
  /** True while the backing feed is still loading. */
  isLoading?: boolean;
  /** True if the feed failed to load; renders an error + retry. */
  isError?: boolean;
  onRetry?: () => void;
}

/**
 * The drawer shell + insight list. Route-local: bound to the Zone tab and the
 * performance feed shape, so it stays here rather than in the shared library.
 * The Drawer primitive it wraps IS shared and owns the overlay mechanics
 * (portal, focus trap, escape, enter/exit motion). Each row is an
 * expand-in-place `InsightCard` — no detail panel, no back navigation.
 */
export function ZoneInsightsDrawer({
  open,
  onClose,
  insights,
  isLoading = false,
  isError = false,
  onRetry,
}: ZoneInsightsDrawerProps) {
  // The last-applied snapshot — stays frozen while updates are queued, per
  // the batched-not-continuous gating. Only `handleViewUpdates` advances it.
  const [displayedInsights, setDisplayedInsights] = useState(insights);
  // What's actually rendered. Equal to `displayedInsights` at rest; during an
  // apply that includes removals it briefly also holds the resolved cards so
  // their collapse animation can play before they leave the DOM.
  const [renderList, setRenderList] = useState(insights);
  const [pending, setPending] = useState<PendingUpdate[]>([]);
  const [motion, setMotion] = useState<CardMotionState>({
    entering: new Set(),
    exiting: new Set(),
  });
  const listRef = useRef<HTMLDivElement>(null);
  const nextSimIdRef = useRef(0);
  const baselineRef = useRef(insights);

  // Reset the displayed snapshot whenever the underlying feed itself changes
  // (e.g. a real refetch) rather than a simulated background tick, and clear
  // any stale queue so it never mixes with a genuinely new server payload.
  useEffect(() => {
    if (insights !== baselineRef.current) {
      baselineRef.current = insights;
      setDisplayedInsights(insights);
      setRenderList(insights);
      setPending([]);
    }
  }, [insights]);

  // Simulate a background change every few seconds while the drawer is open.
  // Purely illustrative "liveness" (no live feed exists yet) — see the module
  // doc comment. Changes never touch `displayedInsights` directly; they only
  // grow the pending queue, so the visible list cannot shift under the user.
  useEffect(() => {
    if (!open || isLoading || isError) return;
    const timer = window.setInterval(() => {
      setPending((prevPending) => {
        const working = prevPending.reduce(
          (acc, u) => applyPendingUpdate(acc, u, nextSimIdRef),
          displayedInsights,
        );
        const kinds: PendingUpdateKind[] = ["added", "resolved", "reranked"];
        const eligibleKinds = working.length === 0 ? (["added"] as const) : kinds;
        const kind =
          eligibleKinds[Math.floor(Math.random() * eligibleKinds.length)];

        let insightId = "";
        if (kind === "resolved") {
          const candidates = working.filter((i) => i.severity !== "needs-attention");
          if (candidates.length === 0) return prevPending;
          insightId = candidates[Math.floor(Math.random() * candidates.length)].id;
        } else if (kind === "reranked") {
          const tiers = new Map<string, ZoneInsight[]>();
          for (const insight of working) {
            const list = tiers.get(insight.severity) ?? [];
            list.push(insight);
            tiers.set(insight.severity, list);
          }
          const movable = [...tiers.values()].find((list) => list.length > 1);
          if (!movable) return prevPending;
          insightId = movable[movable.length - 1].id;
        }

        return [...prevPending, { kind, insightId }];
      });
    }, SIMULATION_INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, [open, isLoading, isError, displayedInsights]);

  /**
   * Applies every queued update at once (FLIP batch):
   *   1. Measure ("First") every currently-rendered card's rect.
   *   2. Compute the resolved next list, and the entering/exiting id sets.
   *   3. Render exiting cards in place with the collapse animation (phase 1).
   *   4. After the exit finishes, swap to the final list, let it paint
   *      ("Last"), then invert + play the transform delta on any card whose
   *      position changed and play the enter animation on new cards.
   * Mirrors the inventor Variant A mockup's `reorder` handler (measure ->
   * mutate -> invert -> play), generalized to a whole batch of adds/
   * removes/reorders applied together.
   */
  function handleViewUpdates() {
    if (pending.length === 0) return;

    const beforeIds = new Set(renderList.map((i) => i.id));
    const nextList = pending.reduce(
      (acc, u) => applyPendingUpdate(acc, u, nextSimIdRef),
      displayedInsights,
    );
    const afterIds = new Set(nextList.map((i) => i.id));

    const entering = new Set([...afterIds].filter((id) => !beforeIds.has(id)));
    const exiting = new Set([...beforeIds].filter((id) => !afterIds.has(id)));

    const commit = () => {
      const firstRects = new Map<string, DOMRect>();
      const container = listRef.current;
      if (container) {
        container.querySelectorAll<HTMLElement>("[data-insight-id]").forEach((el) => {
          const id = el.dataset.insightId;
          if (id && !exiting.has(id)) firstRects.set(id, el.getBoundingClientRect());
        });
      }
      setDisplayedInsights(nextList);
      setRenderList(nextList);
      setPending([]);
      setMotion({ entering, exiting: new Set() });
      requestAnimationFrame(() => playFlip(firstRects));
    };

    if (exiting.size > 0) {
      // Phase 1: keep exiting cards mounted (still on `renderList`, which
      // still equals the pre-batch list) and mark them for the collapse
      // animation. Phase 2 (`commit`) runs once that animation finishes.
      setMotion({ entering: new Set(), exiting });
      window.setTimeout(commit, 220); // matches insight-card-exit duration
      return;
    }

    commit();
  }

  /** Inverts + plays the measured position delta for any card that moved. */
  function playFlip(firstRects: Map<string, DOMRect>) {
    const container = listRef.current;
    if (!container) return;
    const prefersReduced =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced) return;

    container.querySelectorAll<HTMLElement>("[data-insight-id]").forEach((el) => {
      const id = el.dataset.insightId;
      if (!id) return;
      const first = firstRects.get(id);
      if (!first) return; // entering cards have no "First" rect — they only fade+rise in.
      const last = el.getBoundingClientRect();
      const dy = first.top - last.top;
      if (Math.abs(dy) < 1) return;
      el.style.transition = "none";
      el.style.transform = `translateY(${dy}px)`;
      requestAnimationFrame(() => {
        el.style.transition = `transform ${CARD_MOVE_MS}ms ${CARD_MOVE_EASING}`;
        el.style.transform = "translateY(0)";
        const clear = () => {
          el.style.transition = "";
          el.style.transform = "";
          el.removeEventListener("transitionend", clear);
        };
        el.addEventListener("transitionend", clear);
      });
    });

    // Entrance classes are one-shot; clear once painted so a later batch
    // doesn't replay a stale animation on the same element.
    window.setTimeout(() => setMotion((m) => ({ ...m, entering: new Set() })), 300);
  }

  return (
    <Drawer open={open} onClose={onClose} title="Active AI insights" width="lg">
      {isLoading ? (
        <InsightListSkeleton />
      ) : isError ? (
        <MessageBar
          severity="error"
          title="Couldn't load insights"
          action={
            onRetry ? (
              <Button variant="secondary" size="sm" onClick={onRetry}>
                Retry
              </Button>
            ) : undefined
          }
        >
          The insights feed failed to load. Check your connection and try again.
        </MessageBar>
      ) : renderList.length === 0 && pending.length === 0 ? (
        <EmptyState
          icon={<Sparkles className="size-6" />}
          title="No other active insights right now"
          description="The AI has nothing else flagged for this zone. New findings will appear here as they surface."
        />
      ) : (
        <div className="flex flex-col gap-3">
          {pending.length > 0 ? (
            <MessageBar
              severity="info"
              action={
                <Button variant="secondary" size="sm" onClick={handleViewUpdates}>
                  View updates
                </Button>
              }
            >
              {pendingSummaryLabel(pending.length)}
            </MessageBar>
          ) : null}

          {renderList.length === 0 ? (
            <EmptyState
              icon={<Sparkles className="size-6" />}
              title="No other active insights right now"
              description="The AI has nothing else flagged for this zone. New findings will appear here as they surface."
            />
          ) : (
            <div ref={listRef} className="flex flex-col gap-3">
              {renderList.map((insight) => (
                <div
                  key={insight.id}
                  data-insight-id={insight.id}
                  className={cn(
                    motion.entering.has(insight.id) && CARD_ENTER,
                    motion.exiting.has(insight.id) && CARD_EXIT,
                  )}
                >
                  <InsightCard insight={insight} />
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </Drawer>
  );
}
