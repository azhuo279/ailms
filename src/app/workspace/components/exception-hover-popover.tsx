"use client";

import { createPortal } from "react-dom";
import { Clock, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { Tag } from "@/components/ui/tag";
import { MessageBar, type MessageBarSeverity } from "@/components/ui/message-bar";
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
 *
 * Positioning uses the standalone `translate` CSS property (NOT `transform`)
 * for the same reason documented on `cbar-pulse`/`marker-hover-pulse` in
 * globals.css: the `empty-state-rise-in` reveal animates `transform`
 * (translateY 3px -> 0, fill `both`), which would OVERRIDE an inline
 * `transform` — clobbering the -50%/-100%-14px offset so the popover renders
 * mispositioned under the pointer and thrashes enter/leave. Driving the offset
 * via `translate` lets the reveal's `transform` compose on top, so the popover
 * stays correctly anchored above the pin throughout the animation.
 */

const REVEAL =
  "motion-safe:animate-[empty-state-rise-in_200ms_var(--motion-ease-decelerate,cubic-bezier(0,0,0.2,1))_both]";

/** Highest severity first (T1) for the cluster preview ranked list. */
function byPriority(a: ExceptionRecord, b: ExceptionRecord): number {
  return a.priorityTier.localeCompare(b.priorityTier);
}

/**
 * The single-preview fact block is a `MessageBar` (the canonical inline alert)
 * colored to match the `PriorityTierBadge` above it, so the callout reads on
 * the same ramp as the priority. Tier→ramp mirrors the badge's own mapping:
 * T1/T2 use the reserved `severity-*` ramp (a true shipment-level exception —
 * the sanctioned MessageBar override per its doc comment), T3 uses `warning-*`,
 * T4 stays neutral so a low-priority fact does not read as alarming.
 *
 * `severity` only selects MessageBar's leading icon; the ramp itself is driven
 * entirely by the `className` override.
 */
const TIER_ALERT: Record<
  PriorityTier,
  { severity: MessageBarSeverity; className: string }
> = {
  T1: {
    severity: "error",
    className: "border-severity-border bg-severity-surface text-severity-fg",
  },
  T2: {
    severity: "error",
    className: "border-severity-border bg-severity-surface/60 text-severity-fg",
  },
  T3: {
    severity: "warning",
    className: "border-warning-border bg-warning-surface text-warning-fg",
  },
  T4: {
    severity: "info",
    className: "border-border-subtle bg-surface-sunken text-fg-secondary",
  },
};

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
  /** Keeps the popover open while the pointer is over the surface itself. */
  onPointerEnter: () => void;
  onPointerLeave: () => void;
}

export function ExceptionHoverPopover({
  target,
  nowMs,
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
        // Uses `translate` (not `transform`) so the reveal keyframe's transform
        // composes on top instead of clobbering this offset (see doc comment).
        translate: "-50% calc(-100% - 14px)",
      }}
      className={cn(
        "z-50 w-72 rounded-lg border border-border-subtle bg-surface-overlay p-3 text-fg-primary shadow-lg",
        REVEAL,
      )}
    >
      {/* Invisible hover bridge spanning the 14px (h-3.5) dead gap between the
          pin and this popover. It is a child of the popover, so the pointer
          moving pin -> popover stays continuously "inside" this surface and
          never crosses a region belonging to neither — which was half of the
          enter/leave flicker loop. Shares the popover's pointer lifecycle. */}
      <span aria-hidden="true" className="absolute inset-x-0 top-full h-3.5" />
      {isCluster ? (
        <ClusterPreview
          exceptions={exceptions}
          siteName={siteName}
          nowMs={nowMs}
        />
      ) : (
        <SinglePreview
          exception={exceptions[0]}
          siteName={siteName}
          siteCode={siteCode}
          nowMs={nowMs}
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
}: {
  exception: ExceptionRecord;
  siteName: string;
  siteCode: string | undefined;
  nowMs: number;
}) {
  const fact = buildPreviewFact(exception);
  const action = getPrimaryActionPhrase(exception);
  const detected = formatRelativeTime(exception.eventTimestamp, nowMs);
  const alert = TIER_ALERT[exception.priorityTier];

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

      {/* The single most operationally relevant fact for this type, as an
          inline alert colored to the exception's priority tier (matches the
          PriorityTierBadge ramp above). */}
      <MessageBar
        severity={alert.severity}
        title={fact.label}
        className={cn("px-2.5 py-2 gap-2 text-current", alert.className)}
      >
        <span className="font-medium text-current">{fact.value}</span>
      </MessageBar>

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
    </div>
  );
}

function ClusterPreview({
  exceptions,
  siteName,
  nowMs,
}: {
  exceptions: ExceptionRecord[];
  siteName: string;
  nowMs: number;
}) {
  const ranked = [...exceptions].sort(byPriority);
  const top = ranked.slice(0, 3);

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

    </div>
  );
}

/** Exported for the map panel's tier compare helper reuse if needed. */
export type { PriorityTier };
