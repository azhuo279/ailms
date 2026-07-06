"use client";

import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Tag } from "@/components/ui/tag";
import { Tooltip } from "@/components/ui/tooltip";
import { Chart, CHART_SERIES_COLORS } from "@/components/ui/chart";
import { AdoptionLeaderboard } from "./adoption-leaderboard";
import type { PerformanceFeed } from "../lib/performance-types";

// Accepted / Modified / Rejected map to chart-1 / chart-2 / chart-3 in fixed
// order (ai + severity are role-locked OUT of charts per DESIGN.md §3).
const ADOPTION_SERIES = [
  { key: "accepted", label: "Accepted", color: CHART_SERIES_COLORS[0] },
  { key: "modified", label: "Modified", color: CHART_SERIES_COLORS[1] },
  { key: "rejected", label: "Rejected", color: CHART_SERIES_COLORS[2] },
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
// warning ramp, low = a neutral fill — no success color anywhere.
const GAP_BAR_FILL: Record<GapSeverity, string> = {
  high: "bg-danger-border",
  moderate: "bg-warning-emphasis",
  low: "bg-fg-muted",
};

export interface AiAdoptionTabProps {
  feed: PerformanceFeed;
}

/**
 * Tab 2 — AI Adoption (inventor Direction C, director-only). Read-only, with a
 * page-level Export control (PNG / PDF / CSV via a portalled Menu). One Card, two
 * columns: LEFT (1/3) stacks the outcome-mix stacked-bar chart and the model-gaps
 * breakdown; RIGHT (2/3) holds the per-ZOM leaderboard on the paginated DataTable. The
 * Trend / Model gaps segment toggle was removed per Starling feedback so both
 * views read together. Export lives on the page tablist row, not in this tab.
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
    <div className="flex flex-col gap-4 h-full">
      {/* Card fills the remaining page height (Starling). flex-1 lets it grow in
          the h-full flex column; contentClassName="h-full" makes the Card's inner
          padding div stretch so the grid's h-full resolves against real height. */}
      <Card className="flex-1" contentClassName="h-full">
        <div className="grid grid-cols-1 gap-5 h-full lg:grid-cols-3">
          {/* LEFT (1/3): stacked outcome-mix chart then model gaps. */}
          <div className="flex flex-col gap-4 lg:col-span-1">
            <h3 className="text-heading-m font-semibold text-fg-primary px-2">
              Outcome mix over time
            </h3>
            <Chart
              type="bar"
              data={chartData}
              series={ADOPTION_SERIES}
              xKey="period"
              stacked
              height={220}
            />

            <section
              aria-label="Model gaps"
              className="flex flex-col gap-3 px-2"
            >
              <h3 className="text-heading-m font-semibold text-fg-primary">
                Model gaps
              </h3>

              <ul className="flex flex-col gap-3">
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
          </div>

          {/* RIGHT (2/3): per-ZOM leaderboard on the paginated DataTable. */}
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
      </Card>
    </div>
  );
}
