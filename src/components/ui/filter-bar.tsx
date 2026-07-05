"use client";

import { useId, useState } from "react";
import type { ReactNode } from "react";
import { ChevronDown, Pin } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./button";
import { Tag } from "./tag";

export interface ActiveFilterToken {
  id: string;
  label: string;
  onRemove: () => void;
}

export interface FilterBarProps {
  /** Filter controls — compose from Select, Combobox, Date Range Picker, Search Field, etc. */
  children: ReactNode;
  /** Renders as removable tokens beneath the control row when any are present. */
  activeFilters?: ActiveFilterToken[];
  onClearAll?: () => void;
  /** Collapses less-common filters behind a "More filters" disclosure. */
  advancedFilters?: ReactNode;
  className?: string;
}

/**
 * Canonical Filter Bar — high-value enterprise composite for narrowing
 * tables and lists using multiple criteria (status, date range, carrier,
 * route, site, priority). Compose its control row from existing form
 * primitives (Select, Combobox, Date Range Picker, Search Field); render the
 * active selections as removable **Tag** tokens below.
 */
export function FilterBar({
  children,
  activeFilters = [],
  onClearAll,
  advancedFilters,
  className,
}: FilterBarProps) {
  const hasActiveFilters = activeFilters.length > 0;

  return (
    <div className={cn("flex flex-col gap-3 rounded-lg border border-border-subtle bg-surface-raised p-4", className)}>
      <div className="flex flex-wrap items-end gap-3">
        {children}
        {advancedFilters ? <div className="flex flex-wrap items-end gap-3">{advancedFilters}</div> : null}
      </div>

      {hasActiveFilters ? (
        <div className="flex flex-wrap items-center gap-2 border-t border-border-subtle pt-3">
          {activeFilters.map((filter) => (
            <Tag key={filter.id} onRemove={filter.onRemove}>
              {filter.label}
            </Tag>
          ))}
          {onClearAll ? (
            <Button variant="ghost" size="sm" onClick={onClearAll}>
              Clear all
            </Button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

export interface FilterFieldProps {
  children: ReactNode;
  className?: string;
}

/** Sizing wrapper for a single control inside the Filter Bar's control row. */
export function FilterField({ children, className }: FilterFieldProps) {
  return <div className={cn("w-48 shrink-0", className)}>{children}</div>;
}

export interface FilterPillOption {
  id: string;
  label: string;
  /** Live match count shown inside the pill. Renders de-emphasized (not hidden) at 0. */
  count: number;
}

export interface FilterPillRailProps {
  options: FilterPillOption[];
  /** Ids of the currently active (multi-select) pills. */
  activeIds: string[];
  onToggle: (id: string) => void;
  className?: string;
}

/**
 * Quick-filter pill rail — zero-latency, multi-select toggle row. Every
 * simultaneously-active pill gets the identical fill-inversion treatment
 * (never a uniquely-colored "the one active pill"). Zero-count pills stay
 * fully interactive but render at reduced opacity so the rail never reflows
 * as counts change.
 */
export function FilterPillRail({ options, activeIds, onToggle, className }: FilterPillRailProps) {
  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      {options.map((option) => {
        const isActive = activeIds.includes(option.id);
        const isZero = option.count === 0;
        return (
          <button
            key={option.id}
            type="button"
            aria-pressed={isActive}
            onClick={() => onToggle(option.id)}
            className={cn(
              "inline-flex h-7 shrink-0 items-center rounded-full px-3 text-label-s font-medium transition-colors",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2",
              isActive ? "bg-btn-primary text-fg-on-primary hover:bg-btn-primary-hover" : "bg-surface-sunken text-fg-primary hover:opacity-90",
              isZero && !isActive && "opacity-55",
            )}
          >
            <span>{option.label}</span>
            <span
              className={cn(
                "ml-3 tabular-nums",
                isActive ? "opacity-100" : "opacity-85",
              )}
            >
              {option.count}
            </span>
          </button>
        );
      })}
    </div>
  );
}

export interface WatchlistItem {
  id: string;
  title: string;
  /** Supporting meta text, e.g. "Watching 12m". */
  meta?: string;
}

export interface WatchlistProps {
  items: WatchlistItem[];
  onUnpin: (id: string) => void;
  onManage?: () => void;
  /** Max pinned items allowed — the capacity badge reflects `items.length / capacity`. */
  capacity?: number;
  /** Uncontrolled default open state. */
  defaultExpanded?: boolean;
  className?: string;
}

/**
 * Pinned watchlist — a persistent, human-authored artifact, structurally and
 * visually distinct from the AI-ranked feed it sits above. Collapses to a
 * compact summary row by default; expands into a bordered Card with a
 * "Manage" action and the full pinned list. Never reaches for `--color-ai-*`
 * or `--color-severity-*` for its own identity — it signals "human action"
 * via the project's non-reserved interactive tint (`bg-selection-surface`).
 */
export function Watchlist({ items, onUnpin, onManage, capacity = 5, defaultExpanded = false, className }: WatchlistProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const panelId = useId();
  const headerId = useId();

  const header = (
    <div className="flex items-center gap-2 px-4 py-3">
      <button
        type="button"
        id={headerId}
        aria-expanded={isExpanded}
        aria-controls={panelId}
        onClick={() => setIsExpanded((prev) => !prev)}
        className="flex min-w-0 flex-1 items-center gap-2 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2"
      >
        <Pin className="size-4 shrink-0 text-fg-secondary" aria-hidden="true" />
        <span className="text-label-l font-medium text-fg-primary">Watchlist</span>
        <span className="inline-flex h-5 shrink-0 items-center rounded-full bg-surface-sunken px-2 text-label-s font-medium tabular-nums text-fg-secondary">
          {items.length}/{capacity}
        </span>
        <ChevronDown
          className={cn(
            "size-4 shrink-0 text-fg-muted motion-safe:transition-transform motion-safe:duration-[160ms] motion-safe:ease-in-out",
            isExpanded && "rotate-180",
          )}
          aria-hidden="true"
        />
      </button>
      {isExpanded && onManage ? (
        <Button variant="ghost" size="sm" onClick={onManage}>
          Manage
        </Button>
      ) : null}
    </div>
  );

  return (
    <div
      className={cn(
        "rounded-lg transition-colors",
        isExpanded && "border border-border-subtle bg-surface-raised shadow-sm",
        className,
      )}
    >
      {header}
      <div
        id={panelId}
        role="region"
        aria-labelledby={headerId}
        aria-hidden={!isExpanded}
        inert={!isExpanded ? true : undefined}
        className={cn(
          "overflow-hidden motion-safe:transition-[grid-template-rows] motion-safe:duration-[220ms] motion-safe:ease-in-out",
          "grid",
          isExpanded ? "grid-rows-[1fr]" : "grid-rows-[0fr] motion-reduce:hidden",
        )}
      >
        <div className="min-h-0">
          <div className="flex flex-col gap-2 px-4 pb-4">
            {items.map((item) => (
              <div key={item.id} className="flex items-center gap-3 rounded-md bg-selection-surface px-3 py-2">
                <div className="min-w-0 flex-1">
                  <div className="truncate text-label-l font-medium text-fg-primary">{item.title}</div>
                  {item.meta ? <div className="truncate text-caption text-fg-muted">{item.meta}</div> : null}
                </div>
                <Button
                  iconOnly
                  variant="ghost"
                  size="sm"
                  icon={<Pin className="fill-current" aria-hidden="true" />}
                  aria-label={`Unpin ${item.title}`}
                  onClick={() => onUnpin(item.id)}
                  className="text-btn-primary hover:bg-option-hover"
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
