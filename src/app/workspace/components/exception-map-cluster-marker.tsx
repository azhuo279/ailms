"use client";

import { cn } from "@/lib/utils";
import type { PriorityTier } from "@/app/workspace/lib/exception-types";

/**
 * The single, unified map marker (finding #7). Driven by `topTier` (severity),
 * `count`, and interaction state. The map communicates severity SPATIALLY: size
 * AND color carry it together, so priority reads at a glance without a legend.
 *
 * Severity mapping (reserved ramps, never a raw color):
 * - T1 → `severity` emphasis, LARGEST
 * - T2 → `severity` emphasis (softened), mid-large
 * - T3 → `warning` emphasis, smaller
 * - T4 → neutral `fg-muted`, smallest
 *
 * A cluster (count > 1) renders a filled count circle sized up from its single
 * equivalent; a single pin (count 1) renders a filled dot. The count on a
 * cluster tells you HOW MANY, its color tells you HOW BAD (the worst exception
 * in the cluster).
 *
 * Interaction states, all distinct from each other:
 * - `selected`  → focus-ring ring, the "you opened this" state.
 * - `escalated` → a thin dashed status ring meaning "already being handled",
 *                 visually distinct from selection (dashed, neutral offset).
 * - `hovered`   → an ambient lift + slow pulse halo drawing the eye when its
 *                 feed card is hovered (motion-safe only).
 */

/** Per-tier fill for cluster count circles (text on fill). */
export const TIER_MARKER_FILL: Record<PriorityTier, string> = {
  T1: "bg-severity-emphasis text-fg-on-primary",
  T2: "bg-severity-emphasis/80 text-fg-on-primary",
  T3: "bg-warning-emphasis text-fg-on-primary",
  T4: "bg-fg-muted text-fg-on-primary",
};

/** Per-tier fill for single-exception dots. */
const TIER_DOT_FILL: Record<PriorityTier, string> = {
  T1: "bg-severity-emphasis",
  T2: "bg-severity-emphasis/80",
  T3: "bg-warning-emphasis",
  T4: "bg-fg-muted",
};

/**
 * Severity-scaled SIZE. Higher severity is larger, so a critical pin is
 * spatially dominant even before its color registers. Single dots and cluster
 * circles each get their own scale; the cluster is always a step larger than
 * the matching single dot so "grouped" also reads by size.
 */
const TIER_DOT_SIZE: Record<PriorityTier, string> = {
  T1: "size-5",
  T2: "size-4",
  T3: "size-3.5",
  T4: "size-3",
};

const TIER_CLUSTER_SIZE: Record<PriorityTier, string> = {
  T1: "size-10 text-label-m",
  T2: "size-9 text-label-s",
  T3: "size-8 text-label-s",
  T4: "size-7 text-footnote",
};

/** Halo size tracks the pin size so the pulse reads as one object. */
const TIER_HALO_SIZE: Record<PriorityTier, string> = {
  T1: "-inset-2",
  T2: "-inset-2",
  T3: "-inset-1.5",
  T4: "-inset-1.5",
};

const TIER_HALO_FILL: Record<PriorityTier, string> = {
  T1: "bg-severity-emphasis",
  T2: "bg-severity-emphasis",
  T3: "bg-warning-emphasis",
  T4: "bg-fg-muted",
};

export interface ClusterMarkerProps {
  /** Highest-severity tier present in this pin/cluster. */
  topTier: PriorityTier;
  /** Number of exceptions represented. 1 → single pin, >1 → cluster. */
  count: number;
  selected?: boolean;
  /** True when this pin's feed card is being hovered — ambient lift + pulse. */
  hovered?: boolean;
  /** True when the pin/cluster is already being handled (escalated/delegated). */
  handled?: boolean;
  label?: string;
}

export function ClusterMarker({
  topTier,
  count,
  selected = false,
  hovered = false,
  handled = false,
  label,
}: ClusterMarkerProps) {
  const isCluster = count > 1;

  return (
    <div
      aria-label={label}
      role="img"
      className={cn(
        "relative flex items-center justify-center rounded-full ring-2 ring-surface-raised",
        isCluster
          ? cn(
              TIER_CLUSTER_SIZE[topTier],
              "font-semibold shadow-md",
              TIER_MARKER_FILL[topTier],
            )
          : cn(TIER_DOT_SIZE[topTier], "shadow-sm", TIER_DOT_FILL[topTier]),
        // Hovered (from a feed-card hover): lift the pin so it wins the eye.
        hovered && "scale-125 transition-transform motion-reduce:transition-none",
        // Selected: focus-ring ring + offset — the "you opened this" state.
        selected &&
          "ring-focus-ring ring-offset-1 ring-offset-surface-raised scale-110",
      )}
    >
      {/* Escalated/delegated status ring — a thin DASHED ring meaning "already
          being handled". Static (no motion) and dashed so it never reads as the
          solid selection ring. Sits just outside the pin. */}
      {handled ? (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute -inset-1 rounded-full border border-dashed border-fg-secondary"
        />
      ) : null}

      {/* Ambient hover halo — a slow, low-amplitude pulse (peripheral "this is
          the one" cue, not an alarm). motion-safe only; reduced motion shows a
          faint static halo instead of a loop. */}
      {hovered ? (
        <span
          aria-hidden="true"
          className={cn(
            "pointer-events-none absolute rounded-full opacity-20",
            TIER_HALO_SIZE[topTier],
            TIER_HALO_FILL[topTier],
            "motion-safe:animate-[marker-hover-pulse_2s_ease-in-out_infinite]",
          )}
        />
      ) : null}

      {isCluster ? count : null}
    </div>
  );
}
