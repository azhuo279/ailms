"use client";

import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Tag } from "@/components/ui/tag";
import { Tooltip } from "@/components/ui/tooltip";
import { Chart } from "@/components/ui/chart";
import { AdoptionLeaderboard } from "./adoption-leaderboard";
import type { PerformanceFeed } from "../lib/performance-types";

// Accepted / Modified / Rejected are outcome states, not decorative
// categories — they use the status-typed `--color-outcome-*` alias ramp
// (success/warning/severity) instead of the chart-N categorical sequence,
// matching the vocabulary Badge/Tag and the exception feed already use for
// the same outcomes (mirrors the `--color-status-*` pattern for shipment
// status per DESIGN.md §3).
const ADOPTION_SERIES = [
  { key: "accepted", label: "Accepted", color: "var(--color-outcome-accepted)" },
  { key: "modified", label: "Modified", color: "var(--color-outcome-modified)" },
  { key: "rejected", label: "Rejected", color: "var(--color-outcome-rejected)" },
];

/**
 * Severity for a model gap, derived from its correction share. A higher
 * corrected% means the model is wrong more often on that type, so it reads as a
 * worse gap. Starling: stop using the success/green fill and map to the
 * semantic error/warning/neutral ramps instead (never the reserved chart or
 * ai/severity ramps). The `danger` semantic ramp is the design system's own
 * error role. Thresholds: high >= 30%, moderate >= 15%, else low.
 */
type GapSeverity = "high" | "moderate" | "low";

function gapSeverity(correctedPct: number): GapSeverity {
  if (correctedPct >= 30) return "high";
  if (correctedPct >= 15) return "moderate";
  return "low";
}

// Correction-bar fill per severity. High = danger (error) ramp, moderate =
// warning ramp, low = a neutral fill — no success color anywhere. Opacity
// modifiers lighten the -600-step tokens (Starling feedback 2026-07-06: at
// full strength these read heavy/saturated as a filled progress-bar area,
// same issue as the outcome-mix chart above) while keeping the same
// semantic token and hue — no new token introduced, matching the existing
// `bg-severity-emphasis/80` opacity-modifier pattern already used elsewhere
// (exception-card.tsx tier fills).
const GAP_BAR_FILL: Record<GapSeverity, string> = {
  high: "bg-danger-border/70",
  moderate: "bg-warning-emphasis/70",
  low: "bg-fg-muted",
};

export interface AiAdoptionTabProps {
  feed: PerformanceFeed;
}

/**
 * Tab 2 — AI Adoption (inventor Direction C, director-only). Read-only, with a
 * page-level Export control (PNG / PDF / CSV via a portalled Menu). Two columns
 * at the page level (Starling 2026-07-06, replacing the earlier single-outer-
 * Card layout): LEFT stacks two separate Cards — the outcome-mix stacked-bar
 * chart, then the model-gaps breakdown — that together fill the row height;
 * RIGHT has no card surface at all, just the per-ZOM leaderboard's paginated
 * DataTable extending down to fill the same height. The Trend / Model gaps
 * segment toggle was removed per earlier Starling feedback so both views read
 * together. Export lives on the page tablist row, not in this tab.
 */
export function AiAdoptionTab({ feed }: AiAdoptionTabProps) {
  const { adoption } = feed;

  const chartData = useMemo(
    () =>
      adoption.trend.map((p) => ({
        period: p.period,
        accepted: p.accepted,
        modified: p.modified,
        rejected: p.rejected,
      })),
    [adoption.trend],
  );

  const gapRows = adoption.modelGaps;

  return (
    <div className="grid flex-1 grid-cols-1 gap-5 lg:grid-cols-3">
      {/* LEFT: two stacked Cards (chart, then model gaps) sharing the column
          height evenly — flex-1 on each lets both grow to fill the row. */}
      <div className="flex min-h-0 flex-col gap-4 lg:col-span-1">
        <Card
          className="flex min-h-0 flex-1 flex-col"
          contentClassName="flex h-full min-h-0 flex-col"
        >
          <h3 className="text-heading-m font-semibold text-fg-primary">
            Outcome mix over time
          </h3>
          {/* Chart height is flexible (no fixed px height) so it grows to
              fill its Card rather than sitting at a fixed 220px regardless
              of the space Starling asked it to fill. */}
          <Chart
            type="bar"
            data={chartData}
            series={ADOPTION_SERIES}
            xKey="period"
            stacked
          />
        </Card>

        <Card
          className="flex min-h-0 flex-1 flex-col"
          contentClassName="flex h-full min-h-0 flex-col"
        >
          <section
            aria-label="Model gaps"
            className="flex flex-1 flex-col gap-3"
          >
            <h3 className="text-heading-m font-semibold text-fg-primary">
              Model gaps
            </h3>

            <ul className="flex flex-1 flex-col justify-between gap-3">
              {gapRows.map((gap) => {
                const severity = gapSeverity(gap.correctedPct);
                return (
                  <li key={gap.type} className="flex flex-col gap-1">
                    <div className="flex items-center justify-between text-body-s">
                      <span className="flex items-center gap-2 text-fg-primary">
                        {gap.type}
                        {gap.isLowConfidence ? (
                          <Tooltip content="The model is frequently corrected on this exception type, so its recommendations here are less reliable.">
                            <span tabIndex={0} className="inline-flex cursor-default outline-none focus-visible:ring-2 focus-visible:ring-focus-ring rounded-full">
                              <Tag tone="warning" size="sm">
                                Low confidence
                              </Tag>
                            </span>
                          </Tooltip>
                        ) : null}
                      </span>
                      <span className="tabular-nums text-fg-secondary">
                        {gap.correctedPct}% corrected
                      </span>
                    </div>
                    <div
                      className="h-2 overflow-hidden rounded-full bg-surface-sunken"
                      role="img"
                      aria-label={`${gap.type}: ${gap.correctedPct} percent corrected`}
                    >
                      {/* Fill colored by severity (derived from corrected%):
                          high -> danger, moderate -> warning, low -> neutral.
                          No success/green fill (Starling). */}
                      <div
                        className={cn("h-full rounded-full", GAP_BAR_FILL[severity])}
                        style={{ width: `${gap.correctedPct}%` }}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>
        </Card>
      </div>

      {/* RIGHT: no card surface (Starling) — just the per-ZOM leaderboard
          extending down to fill the same height as the left column. */}
      <section
        aria-label="Per-manager leaderboard"
        className="flex flex-col gap-2 lg:col-span-2"
      >
        <div className="flex items-baseline justify-between gap-3">
          <h3 className="text-title font-semibold text-fg-primary">
            Per-ZOM leaderboard
          </h3>
          <span className="text-footnote text-fg-muted">
            {adoption.managerCount} managers. Ranked by acceptance rate.
          </span>
        </div>
        <AdoptionLeaderboard
          entries={adoption.leaderboard}
          className="flex-1"
        />
      </section>
    </div>
  );
}
