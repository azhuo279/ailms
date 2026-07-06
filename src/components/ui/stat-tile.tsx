"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Card } from "./card";

type StatTone = "default" | "intransit" | "delivered" | "delayed" | "pending";

const TONE_ACCENT: Record<StatTone, string> = {
  default: "text-fg-primary",
  intransit: "text-status-intransit",
  delivered: "text-status-delivered",
  delayed: "text-status-delayed",
  pending: "text-status-pending",
};

/** One bucket in the weekly bar sparkline. `value` is only used to derive `heightPercent`
 *  by the caller — StatTile itself renders bars purely off `heightPercent` so callers can
 *  choose their own normalization (e.g. against a fixed axis vs. the visible max). */
export interface StatTileBucket {
  /** 0-100. Bar height as a percentage of the sparkline track. */
  heightPercent: number;
  /** Optional accessible label for this bucket, e.g. "Week of Jun 22". */
  label?: string;
}

export interface StatTileTrend {
  /** Raw arithmetic direction of the change. Drives nothing but semantics/labels here —
   *  never used to infer color. Color comes exclusively from `isFavorable`. */
  direction: "up" | "down" | "flat";
  /**
   * Whether this specific change is good news for this specific metric, decided by the
   * caller (e.g. from a per-metric `lowerIsBetter` flag in a metric registry). Deliberately
   * decoupled from `direction`: for metrics like delayed shipments or incidents,
   * `direction: "down"` is favorable; for metrics like on-time rate, `direction: "up"` is
   * favorable. Pass `undefined` only for a true flat/no-change reading.
   */
  isFavorable?: boolean;
  /**
   * Full plain-language trend sentence, e.g. "12 fewer delayed shipments than last week"
   * or "1.8 points better than last week". Composed by the caller so metric-specific
   * phrasing ("fewer", "slower", "points better") stays out of this component.
   */
  narrative: string;
  /**
   * Shared comparison-period label, e.g. "Last 7 days" vs "previous 7 days". Intended to
   * be resolved once at the page/grid level (a shared period toggle) and passed down
   * uniformly to every tile in a row, rather than restated per tile.
   */
  periodLabel?: string;
}

/** Favorable/unfavorable/on-time reading for a planned-vs-predicted comparison. Deliberately
 *  its own explicit field (not derived from the two values) for the same reason
 *  `StatTileTrend.isFavorable` is explicit: only the caller knows whether "predicted later
 *  than planned" is good or bad news for this specific metric. */
export type StatTileComparisonState = "favorable" | "unfavorable" | "ontime";

export interface StatTileComparisonBar {
  /** Planned/scheduled value as a compound-range-ready label, e.g. "14:10". */
  plannedLabel: string;
  /** AI-predicted value, e.g. "14:50". Rendered in the reserved AI-ramp accent. */
  predictedLabel: string;
  /** Planned marker position, 0-100 along the track. */
  plannedPercent: number;
  /** Predicted marker position, 0-100 along the track. */
  predictedPercent: number;
  /** Drives delta-segment color, phrase-line color, and whether the halo/delta render at all
   *  ("ontime" collapses both to a negligible/zero-width reading, same convention as the
   *  inventor mockup's on-time toggle state). */
  state: StatTileComparisonState;
  /** Lead clause of the phrase line, bolded, e.g. "Predicted late by 40 min". */
  phraseLead: string;
  /** Trailing plain-language detail, e.g. "±40 min" (the confidence spread). */
  phraseDetail: string;
  /** Footnote timestamp, e.g. "as of 14:32". */
  asOf: string;
}

export interface StatTileProps {
  label: string;
  value: ReactNode;
  /** Optional supporting caption under the value. Omit when `trend` is provided; the
   *  trend narrative supersedes the plain hint. */
  hint?: string;
  /** Semantic tone; maps to a status token accent for the value text. */
  tone?: StatTone;
  /** Plain-language trend narrative shown in place of a numeric delta. */
  trend?: StatTileTrend;
  /** Weekly (or other period-bucket) data for the bar sparkline, oldest first. Mutually
   *  exclusive with `comparisonBar` (see that prop's doc comment for why). */
  weeklyBuckets?: StatTileBucket[];
  /**
   * Planned-vs-predicted comparison pattern (point-in-time, e.g. an ETA delta), a sibling to
   * `weeklyBuckets`'s trend-over-time pattern. Deliberately mutually exclusive with
   * `weeklyBuckets`: both are bleed-strip patterns that occupy the same flush-bottom region
   * and both fully replace the tile's normal value/hint/trend slots with their own headline
   * (the compound range) and phrase line, so a tile answers either "how has this trended"
   * or "how does this compare right now" — never both at once. If both are passed,
   * `comparisonBar` wins and `weeklyBuckets` is ignored.
   */
  comparisonBar?: StatTileComparisonBar;
  className?: string;
}

const NARRATIVE_TONE_CLASSES = {
  favorable: "text-success-fg",
  unfavorable: "text-danger-fg",
  flat: "text-fg-secondary",
} as const;

function narrativeTone(trend: StatTileTrend): keyof typeof NARRATIVE_TONE_CLASSES {
  if (trend.direction === "flat" || trend.isFavorable === undefined) return "flat";
  return trend.isFavorable ? "favorable" : "unfavorable";
}

/**
 * KPI tile — a compact-content variant of the canonical **Card**, not a
 * parallel component. Kept as its own named export because its label/value/
 * trend contract is a stable, narrower API than Card's general-purpose
 * header/body/footer slots; internally it's just `Card` + a fixed content
 * shape, so it inherits Card's elevation, radius, and border treatment.
 *
 * Trend narrative + sparkline direction (Direction C, see
 * inventor-workspace/brief-stat-tile-20260705-164632-r25phh.md): color for
 * both the narrative sentence and the sparkline's final bar is driven solely
 * by `trend.isFavorable`, an explicit per-metric flag — never inferred from
 * `trend.direction`. This is what lets "12 fewer delayed shipments" (down)
 * and "1.8 points better" (up) both render as favorable/success on the same
 * dashboard, per the influencer brief's core finding.
 */
export function StatTile({
  label,
  value,
  hint,
  tone = "default",
  trend,
  weeklyBuckets,
  comparisonBar,
  className,
}: StatTileProps) {
  const tone_ = trend ? narrativeTone(trend) : null;

  // `comparisonBar` fully replaces the value/hint/trend slots with its own headline (the
  // compound range) and phrase line — see the prop's doc comment for why it wins over
  // `weeklyBuckets` when both are passed.
  if (comparisonBar) {
    return (
      <Card padding="compact" className={className}>
        <p className="text-label-s font-medium uppercase tracking-wide text-fg-muted">{label}</p>
        <StatTileComparisonHeadline comparisonBar={comparisonBar} />
        {/* Same bleed-strip technique as the sparkline strip below: cancel Card's
            `padding="compact"` p-3 inset on this strip only, via a matching negative margin,
            so this pattern also sits flush to Card's rounded bottom edge. */}
        <div className="-mx-3 -mb-3 mt-2">
          <StatTileComparisonBarStrip comparisonBar={comparisonBar} />
        </div>
      </Card>
    );
  }

  return (
    <Card padding="compact" className={className}>
      <p className="text-label-s font-medium uppercase tracking-wide text-fg-muted">{label}</p>
      <p className={cn("mt-1 text-heading-xl font-semibold tabular-nums", TONE_ACCENT[tone])}>{value}</p>
      {trend ? (
        <p className={cn("mt-1.5 text-body-s", tone_ ? NARRATIVE_TONE_CLASSES[tone_] : NARRATIVE_TONE_CLASSES.flat)}>
          {trend.narrative}
        </p>
      ) : hint ? (
        <p className="mt-1 text-caption text-fg-secondary">{hint}</p>
      ) : null}
      {weeklyBuckets?.length ? (
        // Card's `padding="compact"` applies p-3 (0.75rem) on all sides to its inner content
        // div, and Card has no slot outside that padded region. Rather than adding a
        // bottom-padding override to Card's own API (which would affect every other
        // consumer), cancel just the bottom + side inset for this strip with a matching
        // negative margin, sized to the exact `p-3` token (0.75rem), so the sparkline runs
        // flush to Card's rounded bottom edge while every other consumer of Card is
        // untouched.
        <div className="-mx-3 -mb-3 mt-2.5">
          <StatTileSparkline buckets={weeklyBuckets} favorable={tone_ === "favorable"} unfavorable={tone_ === "unfavorable"} />
        </div>
      ) : null}
    </Card>
  );
}

interface StatTileSparklineProps {
  buckets: StatTileBucket[];
  favorable: boolean;
  unfavorable: boolean;
}

/**
 * Ambient weekly bar sparkline — discrete period buckets, not a continuous line, since
 * these are weekly snapshots (per the inventor brief). Deliberately not built on the
 * canonical `Chart` component: `Chart` always renders axes/gridlines/legend/tooltip,
 * which would defeat the "ambient shape, not a chart" requirement. Ported instead as a
 * plain flex-bar track using the same success/danger emphasis tokens `Chart` and `Badge`
 * already use for favorable/unfavorable state, at sparkline scale.
 *
 * Sits flush against the card's bottom edge (see the negative-margin wrapper in `StatTile`
 * that cancels Card's `padding="compact"` inset on this strip) so it reads as integrated
 * with the tile above rather than boxed in by padding on all sides — StatTile's own
 * composition choice, not a change to Card's shared padding API.
 */
function StatTileSparkline({ buckets, favorable, unfavorable }: StatTileSparklineProps) {
  const lastIndex = buckets.length - 1;

  return (
    <div
      className="flex h-7 items-end gap-1 overflow-hidden rounded-b-lg px-2"
      role="img"
      aria-label={`Trend over the last ${buckets.length} periods`}
    >
      {buckets.map((bucket, index) => {
        const isLast = index === lastIndex;
        return (
          <div
            key={bucket.label ?? index}
            className={cn(
              "min-w-0 flex-1 rounded-t-sm bg-fg-muted opacity-35 motion-safe:transition-[height] motion-safe:duration-200 motion-safe:ease-out",
              isLast && favorable && "bg-success-emphasis opacity-100",
              isLast && unfavorable && "bg-severity-emphasis opacity-100",
            )}
            style={{
              height: `${Math.max(0, Math.min(100, bucket.heightPercent))}%`,
              transitionDelay: `${index * 24}ms`,
            }}
            title={bucket.label}
          />
        );
      })}
    </div>
  );
}

interface StatTileComparisonHeadlineProps {
  comparisonBar: StatTileComparisonBar;
}

/**
 * Compound-range headline that replaces the tile's normal big-number value slot entirely
 * (Direction C, see inventor-workspace/stat-tile-comparison-bar-20260705-192504-0zly22-directions.html).
 * The predicted segment is colored with the reserved AI-ramp `text-ai-fg` — a legitimate use
 * here because the value genuinely is an AI prediction, not decoration; every other tone in
 * this pattern stays on the success/severity/neutral ramps.
 */
function StatTileComparisonHeadline({ comparisonBar }: StatTileComparisonHeadlineProps) {
  const { plannedLabel, predictedLabel, state, phraseLead, phraseDetail } = comparisonBar;

  return (
    <div className="mt-1">
      <p className="text-heading-l tabular-nums text-fg-primary">
        {plannedLabel}
        {"–"}
        <span className="text-ai-fg">{predictedLabel}</span>
      </p>
      <p
        className={cn(
          "mt-1 text-body-s",
          state === "unfavorable" && "text-severity-fg",
          state === "favorable" && "text-success-fg",
          state === "ontime" && "text-fg-muted",
        )}
      >
        <strong className="font-bold">{phraseLead}</strong> · {phraseDetail}
      </p>
    </div>
  );
}

interface StatTileComparisonBarStripProps {
  comparisonBar: StatTileComparisonBar;
}

/**
 * Planned-vs-predicted comparison track — a sibling ambient pattern to `StatTileSparkline`,
 * for a point-in-time comparison (e.g. an ETA delta) rather than a trend over time. Built
 * from Direction C ("range-as-value lead + pulsing halo") in the inventor directions file,
 * with Direction B's taller 2rem track-wrap substituted in for Direction C's own (narrower)
 * proportions, per the approved hybrid brief.
 *
 * Both floating markers, the delta segment, and the confidence halo share one vertical
 * centerline (`top-1/2 -translate-y-1/2`) inside the 2rem-tall wrapper, so everything is
 * exactly optically centered by construction rather than by hand-tuned offsets — this avoids
 * needing any off-scale spacing token to hit a fractional centering value.
 *
 * Sits flush against the card's bottom edge via the same bleed-strip technique
 * `StatTileSparkline` uses (see the negative-margin wrapper in `StatTile`): that wrapper
 * cancels Card's inset, and — same convention as the sparkline — the track below is the
 * true LAST rendered element and carries `rounded-b-lg` itself, so the physical bottom
 * edge is the track, not the footnote text. `StatTileSparkline` is a single bar with no
 * companion text, so its track alone is the whole strip; this pattern also has a footnote
 * row (asOf / "AI-predicted"), so that row is placed ABOVE the track — same flush-bottom
 * outcome as the sparkline, adapted for a track+text composition instead of reordering the
 * footnote below the track (which would leave the wrapper, not the track, flush).
 */
function StatTileComparisonBarStrip({ comparisonBar }: StatTileComparisonBarStripProps) {
  const { plannedPercent, predictedPercent, state, asOf } = comparisonBar;
  const isOntime = state === "ontime";
  const isFavorable = state === "favorable";

  const left = Math.min(plannedPercent, predictedPercent);
  const width = Math.abs(predictedPercent - plannedPercent);

  return (
    <div>
      <div className="flex items-center justify-between px-3 pb-2 text-footnote text-fg-muted">
        <span>{asOf}</span>
        <span className="font-semibold text-ai-fg">AI-predicted</span>
      </div>

      <div className="relative h-8 rounded-b-lg px-3">
        {/* Neutral rail. `inset-x-0` here (not an extra inset) because the wrapper's `relative
            px-3` already establishes a padding-box containing block for the absolutely
            positioned children below — percentage `left` values on those children are
            measured edge-to-edge across that same padding box, so plain `left: pct%`
            (no extra rem offset) lines up exactly with this rail's own edges. */}
        <div className="absolute inset-x-0 top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-fg-muted opacity-35" />

        {/* Delta segment: spans from the planned marker to the predicted marker. Collapses to
            zero width for the on-time reading, same convention as the inventor mockup. */}
        {!isOntime ? (
          <div
            className={cn(
              "absolute top-1/2 h-1.5 -translate-y-1/2 rounded-full motion-safe:transition-[left,width] motion-safe:duration-300 motion-safe:ease-out",
              isFavorable ? "bg-success-emphasis" : "bg-severity-emphasis",
            )}
            style={{ left: `${left}%`, width: `${width}%` }}
          />
        ) : null}

        {/* Pulsing confidence halo: centered on the PREDICTED marker only, never the planned
            one. `motion-safe:` gates the whole animation utility — under
            `prefers-reduced-motion: reduce` the element never receives the `animate-*`
            utility at all, so it renders at this static base state (baseline `opacity-15`),
            not mid-pulse. `opacity-15` (Tailwind's stock scale step) is used deliberately
            here instead of an arbitrary value so it can be exactly, genuinely identical to
            the `cbar-pulse` keyframe's 0%/100% resting frame in globals.css — see that
            keyframe's comment for the animator-reviewed timing rationale. */}
        {!isOntime ? (
          <div
            className="absolute top-1/2 size-6 -translate-x-1/2 -translate-y-1/2 rounded-full bg-ai-emphasis opacity-15 motion-safe:animate-[cbar-pulse_2.2s_ease-in-out_infinite] motion-safe:transition-[left] motion-safe:duration-300 motion-safe:ease-out"
            style={{ left: `${predictedPercent}%` }}
          />
        ) : null}

        {/* Planned marker */}
        <div
          className="absolute top-1/2 z-10 size-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-fg-muted ring-2 ring-surface-raised motion-safe:transition-[left] motion-safe:duration-300 motion-safe:ease-out"
          style={{ left: `${plannedPercent}%` }}
        />

        {/* Predicted marker: higher z-index than the planned marker so it stays on top where
            the two are close together. */}
        <div
          className="absolute top-1/2 z-20 size-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-ai-emphasis ring-2 ring-surface-raised motion-safe:transition-[left] motion-safe:duration-300 motion-safe:ease-out"
          style={{ left: `${predictedPercent}%` }}
        />
      </div>
    </div>
  );
}
