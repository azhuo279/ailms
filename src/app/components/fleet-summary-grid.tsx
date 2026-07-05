"use client";

// ⚠️ SCAFFOLD EXAMPLE — safe to delete. Demonstrates a hook-backed component
// with the §9 skeleton + inline-error-with-retry pattern. See SCAFFOLD.md.
import { useState } from "react";
import { AlertTriangle } from "lucide-react";
import { StatTile, type StatTileBucket } from "@/components/ui/stat-tile";
import { cn } from "@/lib/utils";
import { useFleetSummary } from "@/app/hooks/use-fleet-summary";

type PeriodKey = "7d" | "30d" | "qtd";

const PERIOD_OPTIONS: { key: PeriodKey; label: string }[] = [
  { key: "7d", label: "7d" },
  { key: "30d", label: "30d" },
  { key: "qtd", label: "QTD" },
];

const PERIOD_LABELS: Record<PeriodKey, string> = {
  "7d": "Last 7 days",
  "30d": "Last 30 days",
  qtd: "Quarter to date",
};

/**
 * Mock weekly-bucket generator, standing in for a real trend history feed.
 * The fetched fleet-summary fixture only carries point-in-time counts, so
 * bucket history is derived here rather than added to that schema — this
 * keeps the scaffold's fetch/validation contract (`fleet-summary-types.ts`)
 * untouched while still exercising StatTile's real sparkline prop shape.
 */
function mockBuckets(seed: number, favorableLast: boolean): StatTileBucket[] {
  const heights = [45, 55, 50, 62, 58, 70, favorableLast ? 88 : 40];
  return heights.map((h, i) => ({
    heightPercent: Math.max(10, Math.min(100, h + ((seed + i) % 7) - 3)),
  }));
}

/**
 * Home overview KPI grid. Backed by a data hook, so it renders a skeleton on
 * `isPending` and an inline error with retry on `isError` (framework doc §9).
 * Never silently render empty UI on error.
 *
 * The comparison-period control is shared across the whole tile row (per the
 * stat-tile Direction C brief) rather than restated per tile: `period` is
 * page-level state resolved once here and passed down as each tile's
 * `trend.periodLabel`.
 */
export function FleetSummaryGrid() {
  const [period, setPeriod] = useState<PeriodKey>("7d");
  const { data, isPending, isError, error, refetch, isFetching } =
    useFleetSummary();

  if (isPending) {
    return (
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="h-24 animate-pulse rounded-lg border border-border-subtle bg-surface-raised"
            aria-hidden
          />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-start gap-3 rounded-lg border border-border-subtle bg-surface p-4">
        <div className="flex items-center gap-2 text-status-delayed">
          <AlertTriangle className="size-5" aria-hidden />
          <p className="text-sm font-medium">Could not load fleet summary.</p>
        </div>
        <p className="text-xs text-fg-secondary">{error.message}</p>
        <button
          type="button"
          onClick={() => refetch()}
          className={cn(
            "rounded-md border border-border-strong px-3 py-1.5 text-sm font-medium",
            "text-fg-primary transition-colors hover:bg-surface-sunken",
            isFetching && "opacity-60",
          )}
          disabled={isFetching}
        >
          {isFetching ? "Retrying…" : "Retry"}
        </button>
      </div>
    );
  }

  const periodLabel = PERIOD_LABELS[period];

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3 rounded-lg border border-border-subtle bg-surface-raised px-3 py-2 text-caption text-fg-secondary">
        <span>
          Comparison period: <strong className="font-semibold text-fg-primary">{periodLabel}</strong>
        </span>
        <div className="flex gap-1.5">
          {PERIOD_OPTIONS.map((option) => (
            <button
              key={option.key}
              type="button"
              aria-pressed={period === option.key}
              onClick={() => setPeriod(option.key)}
              className={cn(
                "rounded-full border border-border-subtle px-2 py-0.5 text-footnote font-medium text-fg-secondary",
                period === option.key && "border-btn-primary bg-btn-primary text-btn-primary-fg",
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatTile
          label="In transit"
          value={data.inTransit}
          tone="intransit"
          trend={{
            direction: "up",
            isFavorable: true,
            narrative: `Trending up since ${periodLabel.toLowerCase()}`,
            periodLabel,
          }}
          weeklyBuckets={mockBuckets(1, true)}
        />
        <StatTile
          label="Delivered"
          value={data.delivered}
          tone="delivered"
          trend={{
            direction: "up",
            isFavorable: true,
            narrative: `More deliveries than ${periodLabel.toLowerCase()}`,
            periodLabel,
          }}
          weeklyBuckets={mockBuckets(2, true)}
        />
        <StatTile
          label="Delayed"
          value={data.delayed}
          tone="delayed"
          trend={{
            direction: "down",
            isFavorable: true,
            narrative: `Fewer delayed shipments than ${periodLabel.toLowerCase()}`,
            periodLabel,
          }}
          weeklyBuckets={mockBuckets(3, true)}
        />
        <StatTile
          label="On-time rate"
          value={`${Math.round(data.onTimeRate * 100)}%`}
          tone="default"
          trend={{
            direction: "up",
            isFavorable: true,
            narrative: `Better on-time rate than ${periodLabel.toLowerCase()}`,
            periodLabel,
          }}
          weeklyBuckets={mockBuckets(4, true)}
        />
      </div>
    </div>
  );
}
