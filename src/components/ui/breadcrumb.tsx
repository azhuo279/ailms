import type { ReactNode } from "react";
import { ChevronRight } from "lucide-react";
import NextLink from "next/link";
import { cn } from "@/lib/utils";

export type BreadcrumbSize = "sm" | "md" | "lg";

export interface BreadcrumbItem {
  label: string;
  /** Omit on the current (last) item — it renders as plain text, not a link. */
  href?: string;
  /**
   * Client-side handler for crumbs that navigate in-app without a route change
   * (e.g. clearing a selection to return to a split-view root). Renders the
   * crumb as a button. Ignored when `href` is set or on the current item.
   */
  onClick?: () => void;
  /** Overrides the default truncation width for this item's label. */
  maxWidthClassName?: string;
}

export interface BreadcrumbProps {
  items: BreadcrumbItem[];
  size?: BreadcrumbSize;
  /** Custom separator icon; defaults to a chevron. */
  separator?: ReactNode;
  /**
   * Collapses the middle of a long trail behind an overflow indicator,
   * always keeping the first and last two items visible.
   */
  collapseAfter?: number;
  className?: string;
}

const SIZE_TEXT_CLASSES: Record<BreadcrumbSize, string> = {
  sm: "text-label-s",
  md: "text-label-m",
  lg: "text-label-l",
};

const SIZE_ICON_CLASSES: Record<BreadcrumbSize, string> = {
  sm: "size-3.5",
  md: "size-4",
  lg: "size-4",
};

function CrumbLink({
  item,
  size,
  isCurrent,
}: {
  item: BreadcrumbItem;
  size: BreadcrumbSize;
  isCurrent: boolean;
}) {
  const labelClasses = cn(
    "truncate",
    item.maxWidthClassName ?? "max-w-[12rem]",
  );

  const interactiveClasses = cn(
    labelClasses,
    "rounded-sm text-fg-secondary transition-colors hover:text-fg-primary hover:underline",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-1",
  );

  if (!isCurrent && !item.href && item.onClick) {
    return (
      <button type="button" onClick={item.onClick} title={item.label} className={interactiveClasses}>
        {item.label}
      </button>
    );
  }

  if (isCurrent || !item.href) {
    return (
      <span
        aria-current={isCurrent ? "page" : undefined}
        title={item.label}
        className={cn(labelClasses, "font-medium text-primary-700")}
      >
        {item.label}
      </span>
    );
  }

  return (
    <NextLink
      href={item.href}
      title={item.label}
      className={cn(
        labelClasses,
        "rounded-sm text-fg-secondary transition-colors hover:text-fg-primary hover:underline",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-1",
      )}
    >
      {item.label}
    </NextLink>
  );
}

/**
 * Canonical Breadcrumb — shows hierarchical location and supports upward
 * navigation in nested operational areas (e.g. Orders › Shipment › Stop ›
 * Document). The last item always renders as the current, non-interactive
 * page indicator.
 */
export function Breadcrumb({
  items,
  size = "md",
  separator,
  collapseAfter,
  className,
}: BreadcrumbProps) {
  const shouldCollapse = collapseAfter != null && items.length > collapseAfter && items.length > 3;

  const visibleItems = shouldCollapse
    ? [items[0], { label: "…", href: undefined, __overflow: true } as BreadcrumbItem & { __overflow: true }, ...items.slice(-2)]
    : items;

  return (
    <nav aria-label="Breadcrumb" className={className}>
      <ol className={cn("flex flex-wrap items-center gap-1.5", SIZE_TEXT_CLASSES[size])}>
        {visibleItems.map((item, index) => {
          const isCurrent = index === visibleItems.length - 1 && !("__overflow" in item);
          const isOverflow = "__overflow" in item;

          return (
            <li key={`${item.label}-${index}`} className="flex items-center gap-1.5">
              {index > 0 ? (
                <span aria-hidden="true" className="flex shrink-0 items-center text-fg-muted">
                  {separator ?? <ChevronRight className={SIZE_ICON_CLASSES[size]} />}
                </span>
              ) : null}
              {isOverflow ? (
                <span className="text-fg-muted" aria-hidden="true">
                  {item.label}
                </span>
              ) : (
                <CrumbLink item={item} size={size} isCurrent={isCurrent} />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
