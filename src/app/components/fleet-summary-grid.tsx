"use client";

// ⚠️ SCAFFOLD EXAMPLE — safe to delete. Demonstrates a hook-backed component
// with the §9 skeleton + inline-error-with-retry pattern. See SCAFFOLD.md.
import { AlertTriangle } from "lucide-react";
import { StatTile } from "@/components/ui/stat-tile";
import { cn } from "@/lib/utils";
import { useFleetSummary } from "@/app/hooks/use-fleet-summary";

/**
 * Home overview KPI grid. Backed by a data hook, so it renders a skeleton on
 * `isPending` and an inline error with retry on `isError` (framework doc §9).
 * Never silently render empty UI on error.
 */
export function FleetSummaryGrid() {
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

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
      <StatTile label="In transit" value={data.inTransit} tone="intransit" />
      <StatTile label="Delivered" value={data.delivered} tone="delivered" />
      <StatTile label="Delayed" value={data.delayed} tone="delayed" hint="Action needed" />
      <StatTile
        label="On-time rate"
        value={`${Math.round(data.onTimeRate * 100)}%`}
        tone="default"
      />
    </div>
  );
}
