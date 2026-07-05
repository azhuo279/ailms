"use client";

import { Search } from "lucide-react";
import { FilterBar, FilterField, FilterPillRail, type FilterPillOption } from "@/components/ui/filter-bar";
import { TextField } from "@/components/ui/text-field";
import type { ExceptionType } from "@/app/workspace/lib/exception-types";

export interface WorkspaceFilterBarProps {
  searchValue: string;
  onSearchChange: (value: string) => void;
  typeOptions: FilterPillOption[];
  activeTypeIds: string[];
  onToggleType: (id: string) => void;
  onClearAll: () => void;
  className?: string;
}

/**
 * Row 2 of the locked layout. Implements F-06 (quick-filter rail by
 * exception type, FR-46) using the existing `FilterBar` + `FilterPillRail`
 * composite rather than a bespoke rail, per the mandatory reuse rule. Filters
 * apply instantly (no submit step) and control both the feed list and the
 * map pane beneath this row, since both read from the same filtered dataset
 * computed in the parent page.
 */
export function WorkspaceFilterBar({
  searchValue,
  onSearchChange,
  typeOptions,
  activeTypeIds,
  onToggleType,
  onClearAll,
  className,
}: WorkspaceFilterBarProps) {
  const activeFilters = typeOptions
    .filter((option) => activeTypeIds.includes(option.id))
    .map((option) => ({
      id: option.id,
      label: option.label,
      onRemove: () => onToggleType(option.id),
    }));

  return (
    <FilterBar activeFilters={activeFilters} onClearAll={activeFilters.length > 0 ? onClearAll : undefined} className={className}>
      <FilterField className="w-64">
        <TextField
          label="Search"
          aria-label="Search exceptions"
          placeholder="Shipment ID, carrier, location"
          prefix={<Search className="size-4" aria-hidden="true" />}
          value={searchValue}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </FilterField>
      <FilterPillRail
        options={typeOptions}
        activeIds={activeTypeIds}
        onToggle={onToggleType}
        className="pb-2"
      />
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
