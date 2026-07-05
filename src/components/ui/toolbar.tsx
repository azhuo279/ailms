import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface ToolbarProps {
  /** Leading group — typically view controls, density, group-by. */
  children: ReactNode;
  /** Trailing group — typically search, export, primary action, overflow menu. */
  end?: ReactNode;
  /** Sticks the toolbar to the top of its scroll container. */
  sticky?: boolean;
  /** Indicates a contextual selection mode (e.g. "3 selected") is active. */
  selectionCount?: number;
  onClearSelection?: () => void;
  className?: string;
}

/**
 * Canonical Toolbar — a compact, task-relevant container for controls such
 * as table actions, view settings, export, density, search, or filters.
 * Compose its slots from `Button` (including `iconOnly` mode for icon
 * actions) and `Menu` (for overflow) — Toolbar itself only lays out the
 * groups and separators.
 */
export function Toolbar({
  children,
  end,
  sticky = false,
  selectionCount,
  onClearSelection,
  className,
}: ToolbarProps) {
  const hasSelection = typeof selectionCount === "number" && selectionCount > 0;

  return (
    <div
      role="toolbar"
      className={cn(
        "flex h-12 shrink-0 items-center justify-between gap-3 border-b border-border-subtle bg-surface-raised px-4",
        sticky && "sticky top-0 z-10 shadow-sm",
        className,
      )}
    >
      {hasSelection ? (
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
      ) : (
        <div className="flex min-w-0 flex-1 items-center gap-2">{children}</div>
      )}
      {end ? <div className="flex shrink-0 items-center gap-2">{end}</div> : null}
    </div>
  );
}

export function ToolbarSeparator() {
  return <div aria-hidden="true" className="h-6 w-px shrink-0 bg-border-subtle" />;
}

export interface ToolbarGroupProps {
  children: ReactNode;
  className?: string;
}

/** Groups related controls so they read as one visual unit within the Toolbar. */
export function ToolbarGroup({ children, className }: ToolbarGroupProps) {
  return <div className={cn("flex items-center gap-1", className)}>{children}</div>;
}
