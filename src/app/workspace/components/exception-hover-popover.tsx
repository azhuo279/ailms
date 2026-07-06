"use client";

import { createPortal } from "react-dom";
import { ArrowUpRight, Clock, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { Tag } from "@/components/ui/tag";
import { PriorityTierBadge } from "@/components/ui/priority-tier-badge";
import {
  buildPreviewFact,
  getPrimaryActionPhrase,
} from "@/app/workspace/lib/exception-detail";
import { formatRelativeTime } from "@/app/workspace/lib/exception-format";
import type {
  ExceptionRecord,
  PriorityTier,
  Warehouse,
} from "@/app/workspace/lib/exception-types";

/**
 * Map hover-popover — a portalled, non-blocking PREVIEW anchored to a map pin's
 * screen position. It answers "is this worth opening?" in under 2 seconds; it is
 * deliberately NOT a mini detail panel (no full AI summary, no evidence, no
 * confidence score, no action alternatives, no tabs). Two shapes:
 *
 * - Single-exception pin → title + priority, site, one operational fact, the
 *   AI's one-line recommended action (verb phrase only), time since detection +
 *   source badges, and a "View exception" affordance.
 * - Cluster pin → warehouse name + count, a compact ranked top-3 list, and a
 *   "View all N" link that filters the feed to the site.
 *
 * Portaled to document.body so it escapes the map's overflow/stacking traps
 * (Popover primitive pattern). Enter transition is the shared
 * `empty-state-rise-in` keyframe, gated by `motion-safe:` (reduced motion snaps
 * to the end state); it unmounts instantly on exit, matching a short-lived hover
 * surface. Positioned as `fixed` at the pin's viewport point, offset upward so
 * the arrow of attention sits above the pin.
 */

const REVEAL =
  "motion-safe:animate-[empty-state-rise-in_200ms_var(--motion-ease-decelerate,cubic-bezier(0,0,0.2,1))_both]";

/** Highest severity first (T1) for the cluster preview ranked list. */
function byPriority(a: ExceptionRecord, b: ExceptionRecord): number {
  return a.priorityTier.localeCompare(b.priorityTier);
}

export interface HoverPreviewTarget {
  /** Viewport x of the anchoring pin. */
  x: number;
  /** Viewport y of the anchoring pin. */
  y: number;
  /** All exceptions at this pin/site (1 → single, >1 → cluster). */
  exceptions: ExceptionRecord[];
  warehouse: Warehouse | undefined;
}

export interface ExceptionHoverPopoverProps {
  target: HoverPreviewTarget;
  nowMs: number;
  /** Opens the detail view for a single exception (single-pin "View exception"). */
  onOpenException: (id: string) => void;
  /** Filters the feed to this site (cluster "View all N at this site"). */
  onViewSite: (warehouseId: string) => void;
  /** Keeps the popover open while the pointer is over the surface itself. */
  onPointerEnter: () => void;
  onPointerLeave: () => void;
}

export function ExceptionHoverPopover({
  target,
  nowMs,
  onOpenException,
  onViewSite,
  onPointerEnter,
  onPointerLeave,
}: ExceptionHoverPopoverProps) {
  const { x, y, exceptions, warehouse } = target;
  const isCluster = exceptions.length > 1;
  const siteName = warehouse?.name ?? "Location unknown";
  const siteCode = warehouse?.id;

  return createPortal(
    <div
      role="dialog"
      aria-label={
        isCluster
          ? `${exceptions.length} exceptions at ${siteName}, preview`
          : `${exceptions[0].headline}, preview`
      }
      onPointerEnter={onPointerEnter}
      onPointerLeave={onPointerLeave}
      style={{
        position: "fixed",
        left: x,
        top: y,
        // Anchor the popover's bottom just above the pin, horizontally centered.
        transform: "translate(-50%, calc(-100% - 14px))",
      }}
      className={cn(
        "z-50 w-72 rounded-lg border border-border-subtle bg-surface-overlay p-3 text-fg-primary shadow-lg",
        REVEAL,
      )}
    >
      {isCluster ? (
        <ClusterPreview
          exceptions={exceptions}
          siteName={siteName}
          warehouseId={warehouse?.id ?? ""}
          nowMs={nowMs}
          onViewSite={onViewSite}
        />
      ) : (
        <SinglePreview
          exception={exceptions[0]}
          siteName={siteName}
          siteCode={siteCode}
          nowMs={nowMs}
          onOpenException={onOpenException}
        />
      )}
    </div>,
    document.body,
  );
}

function SinglePreview({
  exception,
  siteName,
  siteCode,
  nowMs,
  onOpenException,
}: {
  exception: ExceptionRecord;
  siteName: string;
  siteCode: string | undefined;
  nowMs: number;
  onOpenException: (id: string) => void;
}) {
  const fact = buildPreviewFact(exception);
  const action = getPrimaryActionPhrase(exception);
  const detected = formatRelativeTime(exception.eventTimestamp, nowMs);

  return (
    <div className="flex flex-col gap-2.5">
      {/* Title + priority — readable immediately. */}
      <div className="flex items-start justify-between gap-2">
        <p className="min-w-0 flex-1 text-body-m font-bold leading-tight text-fg-primary">
          {exception.headline}
        </p>
        <PriorityTierBadge tier={exception.priorityTier} />
      </div>

      {/* Warehouse name + site code. */}
      <p className="text-caption text-fg-muted">
        {siteName}
        {siteCode ? ` · ${siteCode}` : null}
      </p>

      {/* The single most operationally relevant fact for this type. */}
      <div className="rounded-md bg-surface-sunken px-2.5 py-1.5">
        <span className="text-footnote text-fg-muted">{fact.label}</span>
        <p className="text-body-s font-medium text-fg-primary">{fact.value}</p>
      </div>

      {/* AI one-line recommended action — verb phrase only, on the reserved ai
          ramp (this is AI-authored). No rationale, no alternatives. */}
      <div className="flex items-start gap-1.5">
        <Sparkles
          className="mt-0.5 size-3.5 shrink-0 text-ai-emphasis"
          aria-hidden="true"
        />
        <p className="min-w-0 flex-1 text-body-s text-ai-fg">
          <span className="sr-only">AI recommended action: </span>
          {action}
        </p>
      </div>

      {/* Time since detection + source badge(s). */}
      <div className="flex flex-wrap items-center gap-1.5 text-caption text-fg-muted">
        <Clock className="size-3 shrink-0" aria-hidden="true" />
        <span title={detected.absolute}>Detected {detected.short}</span>
        {exception.sourceSystems.slice(0, 2).map((system) => (
          <Tag key={system} tone="neutral" size="sm">
            {system}
          </Tag>
        ))}
      </div>

      {/* View exception affordance. */}
      <button
        type="button"
        onClick={() => onOpenException(exception.id)}
        className="mt-0.5 inline-flex items-center justify-center gap-1 rounded-md border border-border-subtle px-2.5 py-1.5 text-label-m font-medium text-link transition-colors hover:bg-option-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
      >
        View exception
        <ArrowUpRight className="size-3.5 shrink-0" aria-hidden="true" />
      </button>
    </div>
  );
}

function ClusterPreview({
  exceptions,
  siteName,
  warehouseId,
  nowMs,
  onViewSite,
}: {
  exceptions: ExceptionRecord[];
  siteName: string;
  warehouseId: string;
  nowMs: number;
  onViewSite: (warehouseId: string) => void;
}) {
  const ranked = [...exceptions].sort(byPriority);
  const top = ranked.slice(0, 3);
  const overflow = exceptions.length - top.length;

  return (
    <div className="flex flex-col gap-2.5">
      {/* Warehouse name + total count. */}
      <div className="flex items-baseline justify-between gap-2">
        <p className="min-w-0 flex-1 truncate text-body-m font-bold text-fg-primary">
          {siteName}
        </p>
        <span className="shrink-0 text-caption font-medium text-fg-secondary">
          {exceptions.length} exceptions
        </span>
      </div>

      {/* Compact ranked top-3: priority badge + title + time detected. No
          per-item recommended actions, this is a triage prompt not a decision
          surface. */}
      <ul className="flex flex-col gap-1.5">
        {top.map((exception) => {
          const detected = formatRelativeTime(exception.eventTimestamp, nowMs);
          return (
            <li key={exception.id} className="flex items-start gap-2">
              <PriorityTierBadge tier={exception.priorityTier} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-body-s text-fg-primary">
                  {exception.headline}
                </p>
                <p className="text-caption text-fg-muted" title={detected.absolute}>
                  Detected {detected.short}
                </p>
              </div>
            </li>
          );
        })}
      </ul>

      {/* View all N at this site → filters the feed to this warehouse. */}
      <button
        type="button"
        onClick={() => onViewSite(warehouseId)}
        className="mt-0.5 inline-flex items-center justify-center gap-1 rounded-md border border-border-subtle px-2.5 py-1.5 text-label-m font-medium text-link transition-colors hover:bg-option-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
      >
        {overflow > 0
          ? `View all ${exceptions.length} at this site`
          : "View these in the feed"}
        <ArrowUpRight className="size-3.5 shrink-0" aria-hidden="true" />
      </button>
    </div>
  );
}

/** Exported for the map panel's tier compare helper reuse if needed. */
export type { PriorityTier };
