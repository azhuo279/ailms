import type { ExceptionRecord, Warehouse } from "./exception-types";
import { getWarehouse } from "./exception-format";

/**
 * Feed sort modes (Starling #2, PRD v1.6 FR-51). Priority is the default so the
 * AI-ranked ordering is preserved unless the ZOM chooses otherwise; the
 * priorityScore itself is still never rendered, only used to order the feed.
 */
export const SORT_MODES = ["priority", "date", "warehouse"] as const;
export type SortMode = (typeof SORT_MODES)[number];

/** Short label for the sort trigger and menu items. */
export const SORT_MODE_LABEL: Record<SortMode, string> = {
  priority: "Priority",
  date: "Date detected",
  warehouse: "Warehouse name",
};

/**
 * Returns a NEW array of the exceptions ordered by the chosen mode. Pure and
 * total-ordered so the feed stays stable:
 * - priority   → priorityScore descending (the AI rank, unchanged default)
 * - date       → eventTimestamp newest first
 * - warehouse  → associated warehouse name A to Z (the FR-51 group key)
 */
export function sortExceptions(
  exceptions: ExceptionRecord[],
  mode: SortMode,
  warehouseMap: Map<string, Warehouse>,
): ExceptionRecord[] {
  const next = [...exceptions];

  switch (mode) {
    case "date":
      return next.sort(
        (a, b) =>
          new Date(b.eventTimestamp).getTime() - new Date(a.eventTimestamp).getTime(),
      );
    case "warehouse":
      return next.sort((a, b) => {
        const nameA = getWarehouse(a, warehouseMap)?.name ?? "";
        const nameB = getWarehouse(b, warehouseMap)?.name ?? "";
        return nameA.localeCompare(nameB);
      });
    case "priority":
    default:
      return next.sort((a, b) => b.priorityScore - a.priorityScore);
  }
}
