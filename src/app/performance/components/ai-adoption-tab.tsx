"use client";

import { useMemo, useState } from "react";
import { Download, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Menu, MenuItem } from "@/components/ui/menu";
import { Tabs } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { StatTile } from "@/components/ui/stat-tile";
import { Tag } from "@/components/ui/tag";
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

export interface AiAdoptionTabProps {
  feed: PerformanceFeed;
}

/**
 * Tab 2 — AI Adoption (inventor Direction C, director-only). Read-only,
 * page-level Export control (PNG / PDF / CSV via a portalled Menu). A trend-lead
 * stacked chart of AI outputs accepted / modified / rejected over time (three
 * distinct states) with a Trend / Model gaps segment control; the model-gaps
 * view isolates low-confidence / frequently-corrected categories. Closes with
 * the per-ZOM leaderboard.
 */
export function AiAdoptionTab({ feed }: AiAdoptionTabProps) {
  const [subView, setSubView] = useState("trend");
  const [gapsFilter, setGapsFilter] = useState<"all" | "lowConfidence">("all");
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

  const gapRows = useMemo(
    () =>
      gapsFilter === "lowConfidence"
        ? adoption.modelGaps.filter((g) => g.isLowConfidence)
        : adoption.modelGaps,
    [adoption.modelGaps, gapsFilter],
  );

  return (
    <div className="flex flex-col gap-4">
      {/* Section header: title, segment control, and the read-only Export menu. */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h2 className="text-title font-semibold text-fg-primary">
            AI outcome mix over time
          </h2>
          <Tabs
            items={[
              { value: "trend", label: "Trend" },
              { value: "model", label: "Model gaps" },
            ]}
            value={subView}
            onChange={setSubView}
            variant="pill"
            size="sm"
          />
        </div>
        <Menu
          align="end"
          trigger={
            <Button variant="secondary" size="md" leadingIcon={<Download />}>
              Export
            </Button>
          }
        >
          <MenuItem onSelect={() => undefined}>Export as PNG</MenuItem>
          <MenuItem onSelect={() => undefined}>Export as PDF</MenuItem>
          <MenuItem onSelect={() => undefined}>Export as CSV</MenuItem>
        </Menu>
      </div>

      {subView === "trend" ? (
        <>
          <Chart
            type="bar"
            data={chartData}
            series={ADOPTION_SERIES}
            xKey="period"
          />

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <StatTile
              label="Accepted"
              value={`${adoption.summary.acceptedPct}%`}
              trend={{ direction: "up", isFavorable: true, narrative: adoption.summary.acceptedTrend }}
            />
            <StatTile
              label="Modified"
              value={`${adoption.summary.modifiedPct}%`}
              trend={{ direction: "flat", narrative: adoption.summary.modifiedTrend }}
            />
            <StatTile
              label="Rejected"
              value={`${adoption.summary.rejectedPct}%`}
              trend={{ direction: "down", isFavorable: true, narrative: adoption.summary.rejectedTrend }}
            />
          </div>

          <section aria-label="Per-manager leaderboard">
            <div className="mb-2 flex items-baseline justify-between gap-3">
              <h3 className="text-title font-semibold text-fg-primary">
                Per-ZOM leaderboard
              </h3>
              <span className="text-footnote text-fg-muted">
                {adoption.managerCount} managers. Ranked by acceptance rate.
              </span>
            </div>
            <AdoptionLeaderboard entries={adoption.leaderboard} />
          </section>
        </>
      ) : (
        <section aria-label="Model gaps">
          <Card>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="flex min-w-0 flex-col gap-0.5">
                <h3 className="text-heading-m font-semibold text-fg-primary">
                  Where the model is being corrected
                </h3>
                <p className="text-body-s text-fg-muted">
                  Highest combined modify + reject share by exception type. A high
                  correction rate is a model gap to review, not a favorable read.
                </p>
              </div>
              <Tag
                tone={gapsFilter === "lowConfidence" ? "warning" : "neutral"}
                size="md"
                onClick={() =>
                  setGapsFilter((f) => (f === "all" ? "lowConfidence" : "all"))
                }
                isSelected={gapsFilter === "lowConfidence"}
                leadingIcon={<AlertTriangle />}
              >
                Low confidence only
              </Tag>
            </div>

            <ul className="mt-4 flex flex-col gap-3">
              {gapRows.map((gap) => (
                <li key={gap.type} className="flex flex-col gap-1">
                  <div className="flex items-center justify-between text-body-s">
                    <span className="flex items-center gap-2 text-fg-primary">
                      {gap.type}
                      {gap.isLowConfidence ? (
                        <Tag tone="warning" size="sm">
                          Low confidence
                        </Tag>
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
                    <div
                      className={cn("h-full rounded-full")}
                      style={{
                        width: `${gap.correctedPct}%`,
                        // Modify/reject correction bar reads on chart-2 (the
                        // "modified" series color) — stays inside the chart ramp.
                        backgroundColor: CHART_SERIES_COLORS[1],
                      }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          </Card>
        </section>
      )}
    </div>
  );
}
