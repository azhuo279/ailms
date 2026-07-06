import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import { Button } from "./button";
import { Select } from "./select";
import { cn } from "@/lib/utils";

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  /** Shows first/last jump controls in addition to previous/next. */
  showFirstLast?: boolean;
  /** Page-size selector — omit to hide. */
  pageSize?: number;
  pageSizeOptions?: number[];
  onPageSizeChange?: (size: number) => void;
  /** Total item count, used to render the summary text. */
  totalItems?: number;
  /**
   * Horizontal layout of the control cluster. "between" (default) keeps the
   * summary/page-size on the left and the prev/next/page-number controls on the
   * right. "center" centers the control cluster within the nav while the summary
   * and page-size selector stay to the left, so the controls read as centered.
   */
  align?: "between" | "center";
  className?: string;
}

function getPageItems(current: number, total: number): (number | "ellipsis")[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  const items: (number | "ellipsis")[] = [1];

  if (current > 3) items.push("ellipsis");

  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);
  for (let page = start; page <= end; page += 1) items.push(page);

  if (current < total - 2) items.push("ellipsis");

  items.push(total);
  return items;
}

/**
 * Canonical Pagination — for content intentionally chunked across pages,
 * especially dense tables or long search results. Do not use for sequential
 * step journeys; use Progress Tracker instead.
 */
export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  showFirstLast = false,
  pageSize,
  pageSizeOptions = [10, 25, 50, 100],
  onPageSizeChange,
  totalItems,
  align = "between",
  className,
}: PaginationProps) {
  const pageItems = getPageItems(currentPage, totalPages);
  const canPrev = currentPage > 1;
  const canNext = currentPage < totalPages;

  const rangeStart = pageSize ? (currentPage - 1) * pageSize + 1 : undefined;
  const rangeEnd = pageSize && totalItems ? Math.min(currentPage * pageSize, totalItems) : undefined;

  const isCentered = align === "center";

  return (
    <nav
      aria-label="Pagination"
      className={cn(
        "gap-3",
        // "between": summary/page-size left, controls right (default).
        // "center": a 3-column grid so the control cluster sits truly centered
        // within the nav while the summary/page-size stays on the left.
        isCentered
          ? "grid grid-cols-[1fr_auto_1fr] items-center"
          : "flex flex-wrap items-center justify-between",
        className,
      )}
    >
      <div className="flex items-center gap-3 text-body-s text-fg-muted">
        {totalItems != null && pageSize != null ? (
          <span>
            {rangeStart}–{rangeEnd} of {totalItems}
          </span>
        ) : null}
        {onPageSizeChange && pageSize != null ? (
          <div className="w-32">
            <Select
              label="Rows per page"
              className="[&_label]:sr-only [&_p]:sr-only"
              value={String(pageSize)}
              onChange={(value) => onPageSizeChange(Number(value))}
              options={pageSizeOptions.map((size) => ({ label: `${size} / page`, value: String(size) }))}
            />
          </div>
        ) : null}
      </div>

      <div className="flex items-center justify-center gap-1">
        {showFirstLast ? (
          <Button
            iconOnly
            variant="ghost"
            size="sm"
            icon={<ChevronsLeft />}
            aria-label="First page"
            disabled={!canPrev}
            onClick={() => onPageChange(1)}
          />
        ) : null}
        <Button
          iconOnly
          variant="ghost"
          size="sm"
          icon={<ChevronLeft />}
          aria-label="Previous page"
          disabled={!canPrev}
          onClick={() => onPageChange(currentPage - 1)}
        />

        {pageItems.map((item, index) =>
          item === "ellipsis" ? (
            <span key={`ellipsis-${index}`} className="flex h-8 w-8 items-center justify-center text-fg-muted">
              …
            </span>
          ) : (
            <Button
              key={item}
              variant={item === currentPage ? "primary" : "ghost"}
              size="sm"
              isSelected={item === currentPage}
              aria-current={item === currentPage ? "page" : undefined}
              onClick={() => onPageChange(item)}
              className="w-8 px-0"
            >
              {item}
            </Button>
          ),
        )}

        <Button
          iconOnly
          variant="ghost"
          size="sm"
          icon={<ChevronRight />}
          aria-label="Next page"
          disabled={!canNext}
          onClick={() => onPageChange(currentPage + 1)}
        />
        {showFirstLast ? (
          <Button
            iconOnly
            variant="ghost"
            size="sm"
            icon={<ChevronsRight />}
            aria-label="Last page"
            disabled={!canNext}
            onClick={() => onPageChange(totalPages)}
          />
        ) : null}
      </div>

      {/* Trailing spacer — balances the summary column so the control cluster
          reads as centered in the "center" layout. Omitted in "between". */}
      {isCentered ? <div aria-hidden="true" /> : null}
    </nav>
  );
}
