"use client";

import { Fragment } from "react";
import type { ReactNode } from "react";
import { ArrowDown, ArrowUp, ChevronRight, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Checkbox } from "./checkbox";
import { EmptyState } from "./empty-state";

export type SortDirection = "asc" | "desc";

export interface DataTableColumn<T> {
  id: string;
  header: ReactNode;
  /** Renders a cell's content for a given row. */
  cell: (row: T) => ReactNode;
  sortable?: boolean;
  /** Fixed/utility width, e.g. "w-32". */
  widthClassName?: string;
  align?: "start" | "end" | "center";
}

export interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  rows: T[];
  /** Stable row identity, used for selection and expansion tracking. */
  getRowId: (row: T) => string;
  isLoading?: boolean;
  /** Skeleton row count while loading. */
  loadingRowCount?: number;
  emptyState?: ReactNode;
  // Sorting (controlled)
  sortColumnId?: string;
  sortDirection?: SortDirection;
  onSortChange?: (columnId: string, direction: SortDirection) => void;
  // Row selection (controlled)
  selectedIds?: Set<string>;
  onSelectedIdsChange?: (ids: Set<string>) => void;
  // Row expansion
  renderExpandedRow?: (row: T) => ReactNode;
  expandedIds?: Set<string>;
  onExpandedIdsChange?: (ids: Set<string>) => void;
  // Row interaction
  onRowClick?: (row: T) => void;
  // Layout
  density?: "default" | "compact";
  stickyHeader?: boolean;
  className?: string;
}

const ALIGN_CLASSES: Record<NonNullable<DataTableColumn<unknown>["align"]>, string> = {
  start: "text-left",
  center: "text-center",
  end: "text-right",
};

/**
 * Canonical Data Table — the single highest-value enterprise component for
 * organizing, sorting, selecting, expanding, and acting on row-based data
 * (shipments, orders, invoices, loads, exceptions). Prefer native table
 * semantics; only reach for a grid pattern when arrow-key cell navigation
 * and in-cell editing are genuinely required (not modeled here).
 */
export function DataTable<T>({
  columns,
  rows,
  getRowId,
  isLoading = false,
  loadingRowCount = 5,
  emptyState,
  sortColumnId,
  sortDirection,
  onSortChange,
  selectedIds,
  onSelectedIdsChange,
  renderExpandedRow,
  expandedIds,
  onExpandedIdsChange,
  onRowClick,
  density = "default",
  stickyHeader = false,
  className,
}: DataTableProps<T>) {
  const hasSelection = Boolean(selectedIds && onSelectedIdsChange);
  const hasExpansion = Boolean(renderExpandedRow);
  const cellPadding = density === "compact" ? "px-3 py-2" : "px-4 py-3";

  const allIds = rows.map(getRowId);
  const allSelected = hasSelection && allIds.length > 0 && allIds.every((id) => selectedIds!.has(id));
  const someSelected = hasSelection && !allSelected && allIds.some((id) => selectedIds!.has(id));

  const toggleAll = () => {
    if (!onSelectedIdsChange) return;
    onSelectedIdsChange(allSelected ? new Set() : new Set(allIds));
  };

  const toggleRow = (id: string) => {
    if (!selectedIds || !onSelectedIdsChange) return;
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    onSelectedIdsChange(next);
  };

  const toggleExpanded = (id: string) => {
    if (!expandedIds || !onExpandedIdsChange) return;
    const next = new Set(expandedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    onExpandedIdsChange(next);
  };

  const handleSort = (columnId: string) => {
    if (!onSortChange) return;
    const nextDirection: SortDirection = sortColumnId === columnId && sortDirection === "asc" ? "desc" : "asc";
    onSortChange(columnId, nextDirection);
  };

  const columnCount = columns.length + (hasSelection ? 1 : 0) + (hasExpansion ? 1 : 0);

  // Frozen identity cluster (expand chevron + selection checkbox). The
  // "Selective Frozen-Column Hairline" treatment — a low-contrast vertical
  // border-r plus a cast shadow, per DESIGN.md's "Structured Depth" language —
  // was REMOVED per Starling feedback: the cluster is no longer separated from
  // the scrolling data columns by a border or shadow. The cluster keeps only its
  // stacking context (relative z-10) so its own bg fill stays above the body on
  // horizontal scroll. No horizontal row dividers are drawn anywhere in the body.
  const frozenClusterBase = "relative z-10";
  const frozenHeaderClassName = cn(frozenClusterBase, "bg-surface");
  const frozenCellClassName = cn(frozenClusterBase, "bg-surface-raised");

  return (
    <div className={cn("overflow-auto rounded-lg border border-border-subtle", className)}>
      {/* w-full fills the container when columns fit; min-w-max lets intrinsic
          column widths win when they need more room than the container, so the
          overflow-auto wrapper scrolls horizontally instead of squishing cells.
          No scrollbar appears when everything already fits. */}
      <table className="w-full min-w-max border-collapse text-body-s">
        <thead className={cn("bg-surface", stickyHeader && "sticky top-0 z-10")}>
          <tr>
            {hasExpansion ? (
              <th className={cn("w-8 px-2 py-3", !hasSelection && frozenHeaderClassName)} aria-hidden="true" />
            ) : null}
            {hasSelection ? (
              <th className={cn("w-10 px-4 py-3", frozenHeaderClassName)}>
                <Checkbox
                  aria-label="Select all rows"
                  checked={allSelected}
                  indeterminate={someSelected}
                  onChange={toggleAll}
                />
              </th>
            ) : null}
            {columns.map((column) => {
              const isSorted = sortColumnId === column.id;
              return (
                <th
                  key={column.id}
                  scope="col"
                  className={cn(
                    "px-4 py-3 text-label-s font-medium text-fg-secondary",
                    ALIGN_CLASSES[column.align ?? "start"],
                    column.widthClassName,
                  )}
                  aria-sort={isSorted ? (sortDirection === "asc" ? "ascending" : "descending") : undefined}
                >
                  {column.sortable ? (
                    <button
                      type="button"
                      onClick={() => handleSort(column.id)}
                      className={cn(
                        "inline-flex items-center gap-1 rounded-sm transition-colors hover:text-fg-primary",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring",
                      )}
                    >
                      {column.header}
                      {isSorted ? (
                        sortDirection === "asc" ? (
                          <ArrowUp className="size-3.5" aria-hidden="true" />
                        ) : (
                          <ArrowDown className="size-3.5" aria-hidden="true" />
                        )
                      ) : (
                        <ChevronsUpDown className="size-3.5 text-fg-muted" aria-hidden="true" />
                      )}
                    </button>
                  ) : (
                    column.header
                  )}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody className="bg-surface-raised">
          {isLoading ? (
            Array.from({ length: loadingRowCount }).map((_, index) => (
              <tr key={`skeleton-${index}`}>
                {hasExpansion ? (
                  <td className={cn(cellPadding, !hasSelection && frozenCellClassName)} />
                ) : null}
                {hasSelection ? <td className={cn(cellPadding, frozenCellClassName)} /> : null}
                {columns.map((column) => (
                  <td key={column.id} className={cellPadding}>
                    <div className="h-4 w-full max-w-32 animate-pulse rounded bg-surface-sunken" aria-hidden="true" />
                  </td>
                ))}
              </tr>
            ))
          ) : rows.length === 0 ? (
            <tr>
              <td colSpan={Math.max(columnCount, 1)} className="p-0">
                {emptyState ?? <EmptyState title="No rows to display" />}
              </td>
            </tr>
          ) : (
            rows.map((row) => {
              const id = getRowId(row);
              const isSelected = hasSelection && selectedIds!.has(id);
              const isExpanded = hasExpansion && expandedIds?.has(id);
              const isInteractive = Boolean(onRowClick);
              // The frozen cell owns its own bg-surface-raised fill (for the elevation
              // shadow to read correctly against the scrolling body), so row hover/select
              // tinting is re-applied on the frozen cell explicitly via `group-hover`/state
              // rather than relying on the <tr>'s background showing through.
              const frozenRowCellClassName = cn(
                frozenCellClassName,
                isInteractive && "group-hover:bg-option-hover",
                isSelected && "bg-option-hover",
              );

              return (
                <Fragment key={id}>
                  <tr
                    onClick={isInteractive ? () => onRowClick!(row) : undefined}
                    aria-selected={hasSelection ? isSelected : undefined}
                    className={cn(
                      "group transition-colors",
                      isInteractive && "cursor-pointer hover:bg-option-hover",
                      isSelected && "bg-option-hover",
                    )}
                  >
                    {hasExpansion ? (
                      <td className={cn(cellPadding, "w-8", !hasSelection && frozenRowCellClassName)}>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleExpanded(id);
                          }}
                          aria-label={isExpanded ? "Collapse row" : "Expand row"}
                          aria-expanded={isExpanded}
                          className="flex size-5 items-center justify-center rounded-sm text-fg-muted transition-colors hover:text-fg-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
                        >
                          <ChevronRight className={cn("size-4 transition-transform", isExpanded && "rotate-90")} aria-hidden="true" />
                        </button>
                      </td>
                    ) : null}
                    {hasSelection ? (
                      <td className={cn(frozenRowCellClassName, cellPadding)} onClick={(e) => e.stopPropagation()}>
                        <Checkbox aria-label={`Select row ${id}`} checked={isSelected} onChange={() => toggleRow(id)} />
                      </td>
                    ) : null}
                    {columns.map((column) => (
                      <td
                        key={column.id}
                        className={cn(cellPadding, "text-fg-primary", ALIGN_CLASSES[column.align ?? "start"])}
                      >
                        {column.cell(row)}
                      </td>
                    ))}
                  </tr>
                  {isExpanded && renderExpandedRow ? (
                    <tr className="bg-surface-sunken">
                      <td colSpan={columnCount} className="p-0">
                        {renderExpandedRow(row)}
                      </td>
                    </tr>
                  ) : null}
                </Fragment>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}

export interface DataTableToolbarProps {
  selectionCount: number;
  onClearSelection?: () => void;
  children?: ReactNode;
  className?: string;
}

/** Contextual batch-actions bar shown above the table when rows are selected. */
export function DataTableToolbar({ selectionCount, onClearSelection, children, className }: DataTableToolbarProps) {
  if (selectionCount === 0) return null;

  return (
    <div
      className={cn(
        "flex items-center justify-between gap-3 rounded-t-lg border border-b-0 border-border-subtle bg-selection-surface px-4 py-2.5",
        className,
      )}
    >
      <div className="flex items-center gap-3">
        <span className="text-label-m font-medium text-primary-700">{selectionCount} selected</span>
        {onClearSelection ? (
          <button
            type="button"
            onClick={onClearSelection}
            className="rounded-sm text-label-m text-link hover:text-link-hover hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
          >
            Clear
          </button>
        ) : null}
      </div>
      {children ? <div className="flex items-center gap-2">{children}</div> : null}
    </div>
  );
}
