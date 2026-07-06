"use client";

import type { CSSProperties } from "react";
import { useEffect, useId, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Tooltip } from "@/components/ui/tooltip";
import type {
  SourceHealth,
  SourceHealthStatus,
} from "@/app/workspace/lib/exception-types";

/**
 * Source-system health control (Row 1) — an expandable TILE. At rest it is a
 * single summary tile ("All systems healthy" / "N system issues") tinted with
 * the semantic status tones (success when all healthy, warning/danger when
 * there are issues) — NOT the reserved ai / severity ramps, because source
 * health is neither an AI signal nor an exception-severity signal.
 *
 * On hover/focus of the resting tile a left-pointing chevron animates in,
 * signalling it expands leftward. On click (Enter/Space) it expands LEFTWARD
 * into one compact tile per source system — the summary tile stays anchored on
 * the right so the expansion never shoves the notification bell. Each system
 * tile shows a status dot + system name, and reveals a Tooltip popover on
 * hover/focus with the healthy message or the alert detail.
 *
 * Two motion refinements layer on top of the leftward grid expansion:
 *
 *  1. Staggered reveal. The system tiles fade + slide in ONE AT A TIME as the
 *     panel opens. Delay is keyed to DOM index; because the group renders inside
 *     a `flex-row-reverse` root, the DOM-first tile sits nearest the summary
 *     (rightmost), so an ascending index delay makes the reveal emanate from the
 *     trigger and push leftward. Enter decelerates (settles); collapse fades the
 *     group out together (a quick exit — cheaper than a reverse-stagger, and the
 *     grid column is already contracting). Reduced motion jumps to the end state.
 *
 *  2. Summary tile collapses into a close chevron. At rest it is the full
 *     labeled tile with a left-chevron hover affordance. When expanded, the
 *     label content collapses away and the tile becomes a compact right-pointing
 *     ChevronRight close button (accessible name "Collapse system health") sat to
 *     the right of the system-tile row. Clicking it, clicking outside, or Escape
 *     collapses back to the resting summary tile and returns focus to it.
 */

/**
 * Stagger step between successive system tiles (ms). ~40ms sits in the
 * "tens of milliseconds" choreography band; 6 tiles caps the group at ~240ms so
 * the sequence never feels slow. Motion-safe only.
 */
const STAGGER_STEP_MS = 40;

/**
 * Per-status dot color — matches the Badge primitive's own dot conventions.
 * Exported so the evidence-log rows (exception-detail-view) render the exact
 * same source-health dot vocabulary rather than duplicating the color map, so
 * the two stay in sync. Semantic status ramps only (success/warning/danger),
 * never the reserved ai/severity ramps.
 */
export const STATUS_DOT: Record<SourceHealthStatus, string> = {
  healthy: "bg-success-emphasis",
  degraded: "bg-warning-emphasis",
  down: "bg-danger-border",
};

/**
 * Per-status TILE tint — each expanded system tile is slightly tinted to its
 * status, with border + text color reflecting the status too (semantic status
 * ramps only; success/warning/danger, never the reserved ai/severity ramps).
 * `down` maps to the danger set (danger is the form/validation alias of the
 * severity primitive, distinct from the reserved severity role tokens).
 */
const STATUS_TILE_TONE: Record<SourceHealthStatus, string> = {
  healthy:
    "border-success-border bg-success-surface text-success-fg hover:bg-success-surface/70",
  degraded:
    "border-warning-border bg-warning-surface text-warning-fg hover:bg-warning-surface/70",
  down: "border-danger-border bg-danger-surface text-danger-fg hover:bg-danger-surface/70",
};

/** Fallback alert copy when a source has no `detail` string. */
const STATUS_FALLBACK_DETAIL: Record<SourceHealthStatus, string> = {
  healthy: "Source system is healthy",
  degraded: "Degraded, delayed data on this feed",
  down: "Down, no data received",
};

/**
 * Human-readable status word for the accessible name. Exported alongside
 * STATUS_DOT so evidence rows label their health dot with the same vocabulary.
 */
export const STATUS_WORD: Record<SourceHealthStatus, string> = {
  healthy: "healthy",
  degraded: "degraded",
  down: "down",
};

export interface SourceHealthControlProps {
  sourceHealth: SourceHealth[];
  className?: string;
}

export function SourceHealthControl({
  sourceHealth,
  className,
}: SourceHealthControlProps) {
  const [open, setOpen] = useState(false);
  const groupId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const summaryRef = useRef<HTMLButtonElement>(null);

  const issues = sourceHealth.filter((s) => s.status !== "healthy");
  const issueCount = issues.length;
  const hasIssues = issueCount > 0;

  const label = !hasIssues
    ? "All systems healthy"
    : `${issueCount} system ${issueCount === 1 ? "issue" : "issues"}`;

  // Collapse on outside click or Escape. Return focus to the summary tile on
  // Escape so keyboard users keep their place.
  useEffect(() => {
    if (!open) return;

    const handlePointer = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        // Return focus to the restored summary tile (same button element).
        summaryRef.current?.focus();
      }
    };

    document.addEventListener("mousedown", handlePointer);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handlePointer);
      document.removeEventListener("keydown", handleKey);
    };
  }, [open]);

  const summaryTone = hasIssues
    ? "border-warning-border bg-warning-surface text-warning-fg"
    : "border-success-border bg-success-surface text-success-fg";

  const summaryDot = hasIssues ? STATUS_DOT.degraded : STATUS_DOT.healthy;

  // Collapse and return focus to the (now-restored) summary tile so keyboard
  // users keep their place after the chevron close button disappears.
  const collapse = () => {
    setOpen(false);
    // Focus lands on the same button element, which has re-rendered as the
    // resting summary tile.
    summaryRef.current?.focus();
  };

  return (
    // flex-row-reverse anchors the summary tile on the right; the expanding
    // system-tile group therefore grows leftward off that anchor.
    <div
      ref={rootRef}
      className={cn("flex flex-row-reverse items-center", className)}
    >
      {/* One persistent button so focus survives the resting-tile <-> chevron
          morph. At rest it is the full labeled summary tile; when expanded it
          collapses (motion-safe) into a compact right-pointing close chevron.
          The inner label region shrinks its own width to 0 as it fades, so the
          tile visually contracts into the chevron rather than hard-swapping. */}
      <button
        ref={summaryRef}
        type="button"
        onClick={() => (open ? collapse() : setOpen(true))}
        aria-expanded={open}
        aria-controls={groupId}
        aria-label={open ? "Collapse system health" : undefined}
        className={cn(
          "group inline-flex h-8 w-auto shrink-0 items-center rounded-md text-label-s font-medium",
          "motion-safe:transition-[background-color,border-color,color,padding]",
          "motion-safe:duration-[200ms] motion-safe:ease-in-out",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-1",
          // Expanded: GHOST close affordance (no border/fill), compact padding
          // around the right-side content so the button resizes down to just the
          // chevron. Resting: status-toned bordered tile with roomy padding.
          open
            ? "gap-0 border border-transparent bg-transparent px-1 text-fg-secondary hover:bg-option-hover"
            : cn("gap-2 border pl-1.5 pr-3", summaryTone),
        )}
      >
        {/* Chevrons live on the LEFT of the button. At rest a ChevronLeft
            affordance animates in on hover/focus (expands leftward); when
            expanded it becomes a right-pointing ghost close chevron. */}
        <ChevronLeft
          aria-hidden="true"
          className={cn(
            "h-4 shrink-0",
            // Resting affordance: takes ZERO space at rest (w-0, no margin,
            // clipped) and grows in on hover/focus — width + margin animate so
            // the button reserves no space for it until revealed. Hidden entirely
            // once expanded, where the right-chevron close affordance takes over.
            "w-0 translate-x-1 overflow-hidden opacity-0",
            "motion-safe:transition-[opacity,transform,width,margin] motion-safe:duration-[140ms] motion-safe:ease-out",
            "group-hover:mr-1 group-hover:w-4 group-hover:translate-x-0 group-hover:opacity-100",
            "group-focus-visible:mr-1 group-focus-visible:w-4 group-focus-visible:translate-x-0 group-focus-visible:opacity-100",
            open && "hidden",
          )}
        />
        <ChevronRight
          aria-hidden="true"
          className={cn(
            "size-4 shrink-0",
            // Ghost close affordance: present only when expanded; fades in as
            // the label collapses away.
            "opacity-0",
            "motion-safe:transition-opacity motion-safe:duration-[200ms] motion-safe:ease-out",
            open ? "opacity-100" : "hidden",
          )}
        />
        <span
          aria-hidden="true"
          className={cn(
            "size-2 shrink-0 rounded-full",
            summaryDot,
            // Fold the status dot away as the tile collapses into the chevron.
            "motion-safe:transition-[opacity,width,margin]",
            "motion-safe:duration-[200ms] motion-safe:ease-in-out",
            open && "w-0 opacity-0 motion-reduce:hidden",
          )}
        />
        {/* Label region collapses its width to 0 while fading, so the tile
            appears to contract into the chevron. Kept out of the a11y tree when
            expanded (button then carries the "Collapse system health" name). */}
        <span
          aria-hidden={open ? "true" : undefined}
          className={cn(
            "grid overflow-hidden whitespace-nowrap",
            "motion-safe:transition-[grid-template-columns,opacity]",
            "motion-safe:duration-[200ms] motion-safe:ease-in-out",
            open
              ? "grid-cols-[0fr] opacity-0 motion-reduce:hidden"
              : "grid-cols-[1fr] opacity-100",
          )}
        >
          <span className="min-w-0 overflow-hidden">{label}</span>
        </span>
      </button>

      {/* System-tile group — grows LEFTWARD via grid-template-columns 0fr->1fr
          (horizontal analog of the Watchlist grid-rows expand). Reduced-motion
          jumps straight to the end state. */}
      <div
        id={groupId}
        role="group"
        aria-label="Source system health detail"
        aria-hidden={!open}
        inert={!open ? true : undefined}
        className={cn(
          "grid overflow-hidden",
          "motion-safe:transition-[grid-template-columns] motion-safe:duration-[200ms] motion-safe:ease-in-out",
          open
            ? "grid-cols-[1fr] mr-2"
            : "grid-cols-[0fr] motion-reduce:hidden",
        )}
      >
        <div className="min-w-0 overflow-hidden">
          <ul className="flex items-center gap-1.5 whitespace-nowrap">
            {sourceHealth.map((source, index) => {
              // Healthy always reads "Source system is healthy" — the alert
              // detail is only meaningful for a degraded/down feed. Unhealthy
              // uses its own detail, falling back to a status-shaped message.
              const detail =
                source.status === "healthy"
                  ? STATUS_FALLBACK_DETAIL.healthy
                  : (source.detail ?? STATUS_FALLBACK_DETAIL[source.status]);
              const accessibleName = `${source.system}, ${STATUS_WORD[source.status]}`;
              // Staggered enter: delay keyed to DOM index. Under the
              // flex-row-reverse root the DOM-first tile sits nearest the
              // summary (rightmost), so ascending delay makes the reveal
              // emanate from the trigger and push leftward. On collapse the
              // delay is 0 so the group fades out together (a quick exit).
              const tileStyle: CSSProperties = {
                transitionDelay: open ? `${index * STAGGER_STEP_MS}ms` : "0ms",
              };
              return (
                <li
                  key={source.system}
                  style={tileStyle}
                  className={cn(
                    "shrink-0",
                    // Fade + slight leftward slide per tile. Transform + opacity
                    // only (compositor-friendly). Enter decelerates and settles;
                    // exit is quick. Reduced motion renders straight to the end
                    // state (present, no translate).
                    "motion-safe:transition-[opacity,transform]",
                    open
                      ? "opacity-100 translate-x-0 motion-safe:duration-[180ms] motion-safe:ease-out"
                      : "opacity-0 translate-x-1 motion-safe:duration-[120ms] motion-safe:ease-in",
                  )}
                >
                  <Tooltip content={detail} placement="bottom">
                    <button
                      type="button"
                      tabIndex={open ? 0 : -1}
                      aria-label={accessibleName}
                      className={cn(
                        // Each tile is slightly tinted to its status, with
                        // border + text color reflecting the status too.
                        "inline-flex h-8 items-center gap-1.5 rounded-md border px-2.5 text-label-s font-medium",
                        STATUS_TILE_TONE[source.status],
                        "motion-safe:transition-colors",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-1",
                      )}
                    >
                      <span
                        aria-hidden="true"
                        className={cn(
                          "size-2 shrink-0 rounded-full",
                          STATUS_DOT[source.status],
                        )}
                      />
                      <span>{source.system}</span>
                    </button>
                  </Tooltip>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </div>
  );
}
