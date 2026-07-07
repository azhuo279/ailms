"use client";

import { useMemo, useState } from "react";
import { Trophy } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import {
  DataTable,
  type DataTableColumn,
  type SortDirection,
} from "@/components/ui/data-table";
import { Pagination } from "@/components/ui/pagination";
import type { LeaderboardEntry } from "../lib/performance-types";

/**
 * Rows per leaderboard page. Sits in the right column of the AI Adoption tab,
 * which now spans the full card height with no card surface of its own
 * (Starling 2026-07-06: "just the full ZOM leaderboard table... extends
 * completely down to fill the height of the parent container"). Raised from
 * 6 to 13 — verified against the shipped layout at the 1440x900 design
 * viewport (the left column's two stacked Cards set the row's rendered
 * height); 13 rows fills that height closely without the table
 * overflowing it. Paired with the DataTable `minRows` padding — a partial
 * page pads out with aria-hidden filler rows up to this count, keeping the
 * body height stable and the pagination control fixed.
 */
const ROWS_PER_PAGE = 13;

export interface AdoptionLeaderboardProps {
  entries: LeaderboardEntry[];
  className?: string;
}

/**
 * Per-ZOM adoption leaderboard (inventor Direction C). One flat ranked list on
 * the shared DataTable, ordered by acceptance rate (rank ascending), with
 * columns for volume / accepted / modified / rejected. Top adopters earn a
 * Badge. Paginated with fixed-height rows (no inner scroll) so the control
 * position stays stable across pages. Tier grouping, the trend sparkline, the
 * trajectory cue, and the viewer self-row were removed per Starling feedback
 * (the viewer is the director and never appears on a ZOM leaderboard).
 */
/** Numeric accessor per sortable column id; `name` sorts alphabetically. */
const SORT_VALUE: Record<string, (e: LeaderboardEntry) => number> = {
  rank: (e) => e.rank,
  volume: (e) => e.volume,
  accepted: (e) => e.acceptedPct,
  modified: (e) => e.modifiedPct,
  rejected: (e) => e.rejectedPct,
};

export function AdoptionLeaderboard({ entries, className }: AdoptionLeaderboardProps) {
  const [page, setPage] = useState(1);
  // Controlled sort. Default stays rank ascending (the feed's ranked order).
  const [sort, setSort] = useState<{ id: string; dir: SortDirection }>({
    id: "rank",
    dir: "asc",
  });

  const rows = useMemo(() => {
    const sorted = [...entries];
    const accessor = SORT_VALUE[sort.id];
    sorted.sort((a, b) => {
      if (accessor) {
        const diff = accessor(a) - accessor(b);
        return sort.dir === "asc" ? diff : -diff;
      }
      // `name` (or any string column) sorts alphabetically.
      const diff = a.name.localeCompare(b.name);
      return sort.dir === "asc" ? diff : -diff;
    });
    return sorted;
  }, [entries, sort]);

  const totalPages = Math.max(1, Math.ceil(rows.length / ROWS_PER_PAGE));
  const currentPage = Math.min(page, totalPages);
  const pageRows = useMemo(
    () => rows.slice((currentPage - 1) * ROWS_PER_PAGE, currentPage * ROWS_PER_PAGE),
    [rows, currentPage],
  );

  const columns: DataTableColumn<LeaderboardEntry>[] = [
    {
      id: "rank",
      header: "Rank",
      sortable: true,
      widthClassName: "w-12",
      cell: (row) => (
        <span className="tabular-nums text-fg-secondary">{row.rank}</span>
      ),
    },
    {
      id: "name",
      header: "Zone Ops Manager",
      sortable: true,
      widthClassName: "w-40",
      cell: (row) => (
        <span className="flex items-center gap-2">
          <span className="font-medium text-fg-primary">{row.name}</span>
          {row.isTopAdopter ? (
            <Badge tone="brand" size="sm">
              <Trophy className="size-3" aria-hidden="true" />
              Top adopter
            </Badge>
          ) : null}
        </span>
      ),
    },
    {
      id: "volume",
      header: "Volume",
      sortable: true,
      align: "end",
      widthClassName: "w-20",
      cell: (row) => (
        <span className="tabular-nums text-fg-secondary">
          {row.volume.toLocaleString()}
        </span>
      ),
    },
    {
      id: "accepted",
      header: "Accepted",
      sortable: true,
      align: "end",
      widthClassName: "w-20",
      cell: (row) => (
        <span className="font-semibold tabular-nums text-fg-primary">
          {row.acceptedPct}%
        </span>
      ),
    },
    {
      id: "modified",
      header: "Modified",
      sortable: true,
      align: "end",
      widthClassName: "w-20",
      cell: (row) => (
        <span className="tabular-nums text-fg-secondary">{row.modifiedPct}%</span>
      ),
    },
    {
      id: "rejected",
      header: "Rejected",
      sortable: true,
      align: "end",
      widthClassName: "w-20",
      cell: (row) => (
        <span className="tabular-nums text-fg-secondary">{row.rejectedPct}%</span>
      ),
    },
  ];

  return (
    // h-full + flex-col so the module fills its column; the table wrapper grows
    // (flex-1) and its minRows filler rows pad the body to the available height.
    <div className={cn("flex h-full flex-col gap-3", className)}>
      <DataTable
        className="flex-1"
        columns={columns}
        rows={pageRows}
        getRowId={(row) => row.name}
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
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setPage}
          pageSize={ROWS_PER_PAGE}
          totalItems={rows.length}
        />
      ) : null}
    </div>
  );
}
