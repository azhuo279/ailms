"use client";

import { useMemo } from "react";
import { Plus, Search, SlidersHorizontal } from "lucide-react";
import { FilterBar, FilterField } from "@/components/ui/filter-bar";
import { Combobox, type ComboboxOption } from "@/components/ui/combobox";
import {
  DateRangePicker,
  type DateRange,
} from "@/components/ui/date-range-picker";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Popover } from "@/components/ui/popover";
import { TextField } from "@/components/ui/text-field";
import type {
  ExceptionType,
  PriorityTier,
} from "@/app/workspace/lib/exception-types";

// Scoped filter-label treatment (F2): small-caps, secondary color, smaller size,
// matching the app's established uppercase label convention (MetaBlock / menu
// section labels). Passed via Field's opt-in `labelClassName` so the shared
// Field default stays untouched for every normal form elsewhere.
const FILTER_LABEL_CLASS =
  "text-footnote font-medium uppercase tracking-wide text-fg-muted";

// "Missing origin" is now a selectable pseudo-option folded INTO the Origin
// warehouse checklist (per Starling feedback: it is an option within origin
// warehouse, not a separate filter field). It sits at the top of the warehouse
// option list, separated from the real warehouses by a "(no location)" hint in
// its label, and is toggled independently of the real warehouse ids via a
// dedicated prop pair. This sentinel value cannot collide with a real warehouse
// id (warehouse ids are registry ids, never this literal).
const MISSING_ORIGIN_VALUE = "missing-origin";

export interface WorkspaceFilterBarProps {
  searchValue: string;
  onSearchChange: (value: string) => void;
  /** Priority tier options (multi-select, no search). */
  priorityOptions: ComboboxOption[];
  activePriorityIds: string[];
  onPriorityChange: (ids: string[]) => void;
  /** Exception type options (multi-select, searchable). */
  typeOptions: ComboboxOption[];
  activeTypeIds: string[];
  onTypeChange: (ids: string[]) => void;
  /** Origin warehouse options (multi-select, searchable). */
  warehouseOptions: ComboboxOption[];
  activeWarehouseIds: string[];
  onWarehouseChange: (ids: string[]) => void;
  /**
   * "Missing origin" filter — narrows to exceptions whose origin warehouse has
   * no mappable location (the exact set the map cannot plot). Boolean toggle.
   */
  missingOriginActive: boolean;
  onMissingOriginChange: (active: boolean) => void;
  /** Date-detected range filter. */
  dateRange: DateRange;
  onDateRangeChange: (range: DateRange) => void;
  onClearAll: () => void;
  className?: string;
}

/**
 * Row 2 of the locked layout. Narrows the exception feed and map by the four
 * primary properties of an exception, using the design system's own filter
 * primitives (no bespoke controls):
 *
 * - **Priority** — `Combobox` (multi-select, **no search** via `searchable={false}`):
 *   tiers are a short fixed set, so a checklist reads faster than a typeahead.
 * - **Exception type** — `Combobox` (multi-select, **searchable**).
 * - **Origin warehouse** — `Combobox` (multi-select, **searchable**): the
 *   warehouse list grows, so typeahead keeps it fast. A **"Missing origin"**
 *   pseudo-option sits at the top of this list (per Starling feedback: missing
 *   origin is an option within origin warehouse, not its own field). It is
 *   surfaced through the same control but wired to a separate prop pair.
 * - **Date detected** — `DateRangePicker` (range).
 *
 * All render through the same primitives with one shared label treatment, so the
 * filters read as a single consistent set. **The filters are always collapsed
 * into a single "Filters" popover** (regardless of container width) so the row
 * keeps space for the leading search and the trailing "Add an exception" action.
 *
 * Free-text search (shipment id / carrier / location) stays available as the
 * leading `TextField`. Every control applies instantly (no submit) and drives
 * both the feed list and the map, which read the same filtered dataset in the
 * parent. A single **Clear filters** control appears whenever any filter is
 * active.
 */
export function WorkspaceFilterBar({
  searchValue,
  onSearchChange,
  priorityOptions,
  activePriorityIds,
  onPriorityChange,
  typeOptions,
  activeTypeIds,
  onTypeChange,
  warehouseOptions,
  activeWarehouseIds,
  onWarehouseChange,
  missingOriginActive,
  onMissingOriginChange,
  dateRange,
  onDateRangeChange,
  onClearAll,
  className,
}: WorkspaceFilterBarProps) {
  // Active-filter count (the four dropdown filters only — search has its own
  // always-visible field, so it is excluded from the collapsed trigger's badge).
  const activeFilterCount =
    (activePriorityIds.length > 0 ? 1 : 0) +
    (activeTypeIds.length > 0 ? 1 : 0) +
    (activeWarehouseIds.length > 0 ? 1 : 0) +
    (missingOriginActive ? 1 : 0) +
    (dateRange.start !== null || dateRange.end !== null ? 1 : 0);

  const hasActiveFilters =
    activeFilterCount > 0 || searchValue.trim().length > 0;

  // Origin warehouse options with the "Missing origin" pseudo-option folded in
  // at the top (Starling: it is an option within origin warehouse, not a
  // separate field). The "(no location)" hint separates it from the real
  // warehouses without needing a divider the Combobox does not support.
  const warehouseOptionsWithMissing = useMemo<ComboboxOption[]>(
    () => [
      { value: MISSING_ORIGIN_VALUE, label: "Missing origin (no location)" },
      ...warehouseOptions,
    ],
    [warehouseOptions],
  );

  // The combobox `value` reflects BOTH the active real-warehouse ids AND the
  // missing-origin pseudo-option, so both selections render as checked rows.
  const warehouseValue = useMemo<string[]>(
    () =>
      missingOriginActive
        ? [MISSING_ORIGIN_VALUE, ...activeWarehouseIds]
        : activeWarehouseIds,
    [missingOriginActive, activeWarehouseIds],
  );

  // Split a combobox change back into its two concerns: the pseudo-option drives
  // `onMissingOriginChange`; every real id drives `onWarehouseChange`.
  const handleWarehouseChange = (v: string | string[]) => {
    const next = Array.isArray(v) ? v : [];
    onMissingOriginChange(next.includes(MISSING_ORIGIN_VALUE));
    onWarehouseChange(next.filter((id) => id !== MISSING_ORIGIN_VALUE));
  };

  // The dropdown filters, rendered ONCE inside the Filters popover. They stack
  // to fill the popover width (`w-full`).
  const filterFields = (
    <>
      <FilterField className="w-full">
        <Combobox
          label="Priority"
          labelClassName={FILTER_LABEL_CLASS}
          placeholder="Any priority"
          multiple
          searchable={false}
          options={priorityOptions}
          value={activePriorityIds}
          onChange={(v) => onPriorityChange(Array.isArray(v) ? v : [])}
        />
      </FilterField>

      <FilterField className="w-full">
        <Combobox
          label="Exception type"
          labelClassName={FILTER_LABEL_CLASS}
          placeholder="Any type"
          multiple
          options={typeOptions}
          value={activeTypeIds}
          onChange={(v) => onTypeChange(Array.isArray(v) ? v : [])}
        />
      </FilterField>

      {/* Origin warehouse — the real warehouses PLUS a "Missing origin"
          pseudo-option at the top (Starling feedback). The two concerns stay
          wired separately through `handleWarehouseChange` / `warehouseValue`. */}
      <FilterField className="w-full">
        <Combobox
          label="Origin warehouse"
          labelClassName={FILTER_LABEL_CLASS}
          placeholder="Any warehouse"
          multiple
          options={warehouseOptionsWithMissing}
          value={warehouseValue}
          onChange={handleWarehouseChange}
        />
      </FilterField>

      <FilterField className="w-full">
        <DateRangePicker
          label="Date detected"
          labelClassName={FILTER_LABEL_CLASS}
          value={dateRange}
          onChange={onDateRangeChange}
        />
      </FilterField>
    </>
  );

  return (
    <FilterBar className={className}>
      {/*
        One row, always: search anchored left; the filter set folded into a
        single "Filters" popover; and the "Add an exception" primary action at
        the far right (Starling feedback — the filters are collapsed at every
        width so this action always has room). `justify-between` pins the two
        groups to the row's edges; the search caps its own width so the gap
        stays open. Neutral chrome only — no AI tokens leak onto this
        operational row.
      */}
      <div className="flex w-full flex-wrap items-end justify-between gap-x-4 gap-y-3">
        {/* Search — capped so it neither crushes nor eats the trailing gap. */}
        <FilterField className="w-full min-w-56 max-w-80 shrink sm:w-auto sm:flex-1">
          <TextField
            label="Search"
            labelClassName={FILTER_LABEL_CLASS}
            aria-label="Search exceptions"
            placeholder="Shipment ID, carrier, location"
            prefix={<Search className="size-4" aria-hidden="true" />}
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </FilterField>

        {/* Right-side action group: Clear filters (ghost, conditional) ·
            Filters popover · Add an exception (primary). */}
        <div className="flex shrink-0 items-end gap-2">
          {hasActiveFilters ? (
            <Button variant="ghost" onClick={onClearAll}>
              Clear filters
            </Button>
          ) : null}

          {/* The filter set lives behind one Filters trigger, always collapsed
              regardless of container width. Popover portals to document.body
              (overlay rule) and closes on outside-click / Escape. An
              active-count Badge (neutral brand emphasis, not AI) surfaces how
              many filters are set while hidden. */}
          <Popover
            align="end"
            className="w-72"
            trigger={
              <Button
                variant="secondary"
                leadingIcon={<SlidersHorizontal aria-hidden="true" />}
                trailingIcon={
                  activeFilterCount > 0 ? (
                    <Badge tone="brand" size="sm" count={activeFilterCount} />
                  ) : undefined
                }
              >
                Filters
              </Button>
            }
          >
            <div className="flex flex-col gap-3">{filterFields}</div>
          </Popover>

          {/* Add an exception — mock action (does nothing yet, per feedback),
              but a real, focusable, accessible primary button. */}
          <Button
            variant="primary"
            leadingIcon={<Plus aria-hidden="true" />}
            onClick={() => {
              /* Mock action — wiring pending. */
            }}
          >
            Add an exception
          </Button>
        </div>
      </div>
    </FilterBar>
  );
}

export const EXCEPTION_TYPE_ORDER: ExceptionType[] = [
  "Carrier Delay",
  "Customs Hold",
  "Dock Congestion",
  "Inventory Discrepancy",
  "Manual",
];

/** Priority tiers in urgency order, with compact dropdown labels (FR-46). */
export const PRIORITY_TIER_ORDER: Array<{ id: PriorityTier; label: string }> = [
  { id: "T1", label: "T1 Critical" },
  { id: "T2", label: "T2 High" },
  { id: "T3", label: "T3 Medium" },
  { id: "T4", label: "T4 Low" },
];
