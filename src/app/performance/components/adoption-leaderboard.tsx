"use client";

import { Fragment } from "react";
import { TrendingUp, TrendingDown, Minus, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import type { LeaderboardEntry, Trajectory } from "../lib/performance-types";

const TRAJECTORY_CONFIG: Record<
  Trajectory,
  { icon: typeof TrendingUp; label: string; className: string }
> = {
  rising: { icon: TrendingUp, label: "Rising", className: "text-success-fg" },
  steady: { icon: Minus, label: "Steady", className: "text-fg-muted" },
  // Falling adoption is a governance concern, not a shipment exception, so it
  // uses the danger (unfavorable-KPI) ramp — never the reserved severity role.
  falling: { icon: TrendingDown, label: "Falling", className: "text-danger-fg" },
};

/** Tiny bar sparkline for a leaderboard row's acceptance trajectory. Ported
 *  from StatTile's ambient bar-track pattern at row scale (not the Chart
 *  component, which always draws axes/legend). */
function RowSparkline({
  buckets,
}: {
  buckets: LeaderboardEntry["weeklyBuckets"];
}) {
  return (
    <div
      className="flex h-6 w-24 items-end gap-0.5"
      role="img"
      aria-label={`Acceptance trend over the last ${buckets.length} weeks`}
    >
      {buckets.map((b, i) => (
        <div
          key={b.label ?? i}
          className="min-w-0 flex-1 rounded-t-sm bg-primary-500 opacity-70"
          style={{ height: `${Math.max(4, Math.min(100, b.heightPercent))}%` }}
          title={b.label}
        />
      ))}
    </div>
  );
}

function TrajectoryCue({ trajectory }: { trajectory: Trajectory }) {
  const cfg = TRAJECTORY_CONFIG[trajectory];
  const Icon = cfg.icon;
  return (
    <span className={cn("inline-flex items-center gap-1 text-body-s font-medium", cfg.className)}>
      <Icon className="size-3.5 shrink-0" aria-hidden="true" />
      {cfg.label}
    </span>
  );
}

export interface AdoptionLeaderboardProps {
  entries: LeaderboardEntry[];
  className?: string;
}

/**
 * Per-ZOM adoption leaderboard (inventor Direction C). Ranked rows sorted by
 * acceptance rate (primary), with columns for volume / modify / reject / a
 * trend sparkline. A tier divider separates superusers from those trailing, the
 * signed-in director's own row is highlighted, each row carries an up/down/steady
 * trajectory cue, and top adopters earn a Badge. Built as a native semantic
 * table (the shared DataTable has no divider-row or self-highlight affordance);
 * reuses Badge + the StatTile bar-sparkline pattern + tokens throughout.
 */
export function AdoptionLeaderboard({ entries, className }: AdoptionLeaderboardProps) {
  // Group into the two tiers, preserving the incoming acceptance-rate order.
  const superusers = entries.filter((e) => e.tier === "superuser");
  const trailing = entries.filter((e) => e.tier === "trailing");

  const tiers: { key: string; label: string; rows: LeaderboardEntry[] }[] = [
    { key: "superuser", label: "Superusers", rows: superusers },
    { key: "trailing", label: "Trailing behind", rows: trailing },
  ];

  const colHeader =
    "px-4 py-3 text-label-s font-medium text-fg-secondary";

  return (
    <div className={cn("overflow-auto rounded-lg border border-border-subtle", className)}>
      <table className="w-full border-collapse text-body-s">
        <caption className="sr-only">
          Per-manager AI adoption leaderboard, ranked by acceptance rate
        </caption>
        <thead className="bg-surface-sunken">
          <tr>
            <th scope="col" className={cn(colHeader, "w-12")}>Rank</th>
            <th scope="col" className={colHeader}>Zone Ops Manager</th>
            <th scope="col" className={cn(colHeader, "text-right")}>Volume</th>
            <th scope="col" className={cn(colHeader, "text-right")} aria-sort="descending">Accepted</th>
            <th scope="col" className={cn(colHeader, "text-right")}>Modified</th>
            <th scope="col" className={cn(colHeader, "text-right")}>Rejected</th>
            <th scope="col" className={colHeader}>Trend</th>
            <th scope="col" className={colHeader}>Trajectory</th>
          </tr>
        </thead>
        <tbody className="bg-surface-raised">
          {tiers.map((tier) =>
            tier.rows.length === 0 ? null : (
              <Fragment key={tier.key}>
                <tr>
                  <th
                    scope="colgroup"
                    colSpan={8}
                    className="bg-surface-sunken px-4 py-1.5 text-left text-footnote font-semibold uppercase tracking-wide text-fg-muted"
                  >
                    {tier.label}
                  </th>
                </tr>
                {tier.rows.map((row) => (
                  <tr
                    key={row.name}
                    aria-current={row.isSelf ? "true" : undefined}
                    className={cn(
                      "transition-colors hover:bg-option-hover",
                      row.isSelf &&
                        "bg-selection-surface shadow-[inset_3px_0_0_var(--color-primary-700)]",
                    )}
                  >
                    <td className="px-4 py-3 tabular-nums text-fg-secondary">{row.rank}</td>
                    <td className="px-4 py-3">
                      <span className="flex items-center gap-2">
                        <span className={cn("font-medium text-fg-primary", row.isSelf && "text-primary-700")}>
                          {row.name}
                        </span>
                        {row.isTopAdopter ? (
                          <Badge tone="brand" size="sm">
                            <Trophy className="size-3" aria-hidden="true" />
                            Top adopter
                          </Badge>
                        ) : null}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-fg-secondary">
                      {row.volume.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold tabular-nums text-fg-primary">
                      {row.acceptedPct}%
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-fg-secondary">
                      {row.modifiedPct}%
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-fg-secondary">
                      {row.rejectedPct}%
                    </td>
                    <td className="px-4 py-3">
                      <RowSparkline buckets={row.weeklyBuckets} />
                    </td>
                    <td className="px-4 py-3">
                      <TrajectoryCue trajectory={row.trajectory} />
                    </td>
                  </tr>
                ))}
              </Fragment>
            ),
          )}
        </tbody>
      </table>
    </div>
  );
}
