"use client";

import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { StatTile } from "@/components/ui/stat-tile";
import {
  DataTable,
  type DataTableColumn,
  type SortDirection,
} from "@/components/ui/data-table";
import { Pagination } from "@/components/ui/pagination";
import { ZoneNarrativeBanner } from "./zone-narrative-banner";
import { ZoneInsightsDrawer } from "./zone-insights-drawer";
import { KPI_HEAT_CLASSES } from "../lib/performance-format";
import type {
  KpiId,
  PerformanceFeed,
  WarehousePerformance,
} from "../lib/performance-types";

/** KPI columns shown in the per-warehouse table, in read order. */
const TABLE_KPIS: { id: KpiId; header: string }[] = [
  { id: "mttr", header: "MTTR" },
  { id: "triageTime", header: "Triage" },
  { id: "acceptanceRate", header: "Acceptance" },
  { id: "escalationRate", header: "Escalation" },
];

/** KPI ids excluded from the top-of-page KPI tile row (still shown in the table). */
const HIDDEN_KPI_TILE_IDS: ReadonlySet<KpiId> = new Set(["triageTime"]);

/**
 * Warehouse rows per page in the breakdown table. Sized so the table body +
 * pagination clear the viewport fold below the narrative banner and KPI tile
 * row (at the ~1512×812 design viewport, thead 40px + 5×58px rows + pagination
 * lands ~780px, under the 812px fold) rather than overflowing the page column.
 */
const ROWS_PER_PAGE = 5;

function HeatCell({ cell }: { cell: WarehousePerformance["cells"][KpiId] }) {
  if (!cell) return <span className="text-fg-muted">—</span>;
  return (
    <span
      className={cn(
        "inline-block rounded-md px-2 py-0.5 text-body-s font-semibold tabular-nums",
        KPI_HEAT_CLASSES[cell.heat],
      )}
    >
      {cell.value}
    </span>
  );
}

export interface ZonePerformanceTabProps {
  feed: PerformanceFeed;
}

/**
 * Tab 1 — Zone Performance (all users). Compact AI narrative (single top
 * insight) → equal-height KPI tile row (MTTR primary, per-metric favorability +
 * sparkline) → heat-filled ranked breakdown table, default-sorted worst-first
 * by MTTR. Rows are no longer drilldownable — all insight lives at the top of
 * the page. The table is paginated so it never exceeds its container height.
 */
export function ZonePerformanceTab({ feed }: ZonePerformanceTabProps) {
  const [sort, setSort] = useState<{ id: string; dir: SortDirection }>({
    id: "mttr",
    dir: "desc",
  });
  const [page, setPage] = useState(1);
  const [insightsOpen, setInsightsOpen] = useState(false);

  // Pre-sorted by rank in the feed; sort defensively so list order (the only
  // priority signal besides the coarse severity tag) is always correct.
  const insights = useMemo(
    () => [...feed.insights].sort((a, b) => a.rank - b.rank),
    [feed.insights],
  );

  const kpiTiles = useMemo(
    () => feed.zoneKpis.filter((kpi) => !HIDDEN_KPI_TILE_IDS.has(kpi.id)),
    [feed.zoneKpis],
  );

  const rows = useMemo(() => {
    const kpi = sort.id as KpiId;
    return [...feed.warehouses].sort((a, b) => {
      // Default MTTR desc = worst (highest) MTTR first, i.e. rank order.
      const av = a.cells[kpi]?.raw ?? 0;
      const bv = b.cells[kpi]?.raw ?? 0;
      return sort.dir === "desc" ? bv - av : av - bv;
    });
  }, [feed.warehouses, sort]);

  const totalPages = Math.max(1, Math.ceil(rows.length / ROWS_PER_PAGE));
  const currentPage = Math.min(page, totalPages);
  const pageRows = useMemo(
    () =>
      rows.slice(
        (currentPage - 1) * ROWS_PER_PAGE,
        currentPage * ROWS_PER_PAGE,
      ),
    [rows, currentPage],
  );

  const columns: DataTableColumn<WarehousePerformance>[] = [
    {
      id: "warehouse",
      header: "Warehouse",
      widthClassName: "w-64",
      cell: (row) => (
        <div className="flex flex-col">
          <span className="font-medium text-fg-primary">{row.name}</span>
          <span className="text-footnote text-fg-muted">{row.location}</span>
        </div>
      ),
    },
    ...TABLE_KPIS.map<DataTableColumn<WarehousePerformance>>((k) => ({
      id: k.id,
      header: k.header,
      sortable: true,
      align: "end",
      widthClassName: "w-28",
      cell: (row) => <HeatCell cell={row.cells[k.id]} />,
    })),
  ];

  return (
    <div className="flex h-full min-h-0 flex-col gap-4">
      <ZoneNarrativeBanner
        body={feed.zoneNarrative.body}
        insightCount={insights.length}
        onViewAllInsights={() => setInsightsOpen(true)}
      />

      <ZoneInsightsDrawer
        open={insightsOpen}
        onClose={() => setInsightsOpen(false)}
        insights={insights}
      />

      {/* flex-1 lets this row claim the whitespace the fixed-height breakdown
          table below leaves unused (Starling 2026-07-06); each StatTile's
          h-full + its internal flex-col content div then stretches the
          sparkline strip to match, so the bar chart grows in proportion.
          min-h-32 is a floor, not a fixed size — it's the tile's natural
          content height (label + value + trend text), so the row still
          reads correctly on short viewports where there's no whitespace to
          fill, and only grows past it when flex-1 actually has room to give. */}
      <section aria-label="Zone key indicators" className="min-h-32 flex-1">
        <div className="grid h-full auto-rows-fr grid-cols-2 items-stretch gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {kpiTiles.map((kpi) => {
            // Per-metric favorability drives StatTile color, never raw direction.
            const isFavorable =
              kpi.direction === "flat"
                ? undefined
                : kpi.lowerIsBetter
                  ? kpi.direction === "down"
                  : kpi.direction === "up";
            return (
              <StatTile
                key={kpi.id}
                label={kpi.id === "mttr" ? "MTTR (primary)" : kpi.label}
                value={kpi.value}
                trend={{
                  direction: kpi.direction,
                  isFavorable,
                  narrative: kpi.trendNarrative,
                }}
                weeklyBuckets={kpi.weeklyBuckets}
                className="h-full"
              />
            );
          })}
        </div>
      </section>

      <section aria-label="Per-warehouse breakdown">
        <div className="mb-2 flex items-baseline justify-between gap-3">
          <h2 className="text-title font-semibold text-fg-primary">
            Breakdown by warehouse
          </h2>
        </div>
        <DataTable
          columns={columns}
          rows={pageRows}
          layout="fixed"
          getRowId={(row) => row.id}
          minRows={ROWS_PER_PAGE}
          sortColumnId={sort.id}
          sortDirection={sort.dir}
          onSortChange={(id, dir) => {
            setSort({ id, dir });
            setPage(1);
          }}
        />
        {totalPages > 1 ? (
          <Pagination
            className="mt-3"
            align="center"
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setPage}
            pageSize={ROWS_PER_PAGE}
            totalItems={rows.length}
          />
        ) : null}
      </section>
    </div>
  );
}
