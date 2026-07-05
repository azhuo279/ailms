"use client";

import { Children, cloneElement, isValidElement, useId, useRef } from "react";
import type { KeyboardEvent, ReactElement, ReactNode } from "react";
import { cn } from "@/lib/utils";

export type TabsSize = "sm" | "md" | "lg";
export type TabsVariant = "underline" | "pill";

export interface TabItem {
  value: string;
  label: string;
  icon?: ReactNode;
  disabled?: boolean;
}

export interface TabsProps {
  items: TabItem[];
  value: string;
  onChange: (value: string) => void;
  size?: TabsSize;
  variant?: TabsVariant;
  /** Panels keyed by tab value, rendered below the tablist. Omit to control panels externally. */
  children?: ReactNode;
  className?: string;
}

const SIZE_TAB_CLASSES: Record<TabsSize, string> = {
  sm: "h-8 gap-1.5 px-2.5 text-label-s",
  md: "h-10 gap-2 px-3 text-label-m",
  lg: "h-11 gap-2 px-4 text-label-l",
};

const SIZE_ICON_CLASSES: Record<TabsSize, string> = {
  sm: "size-3.5",
  md: "size-4",
  lg: "size-4",
};

/**
 * Canonical Tabs — organizes related categories of content within the same
 * page without changing overall location. Poor fit for side-by-side
 * comparison of categories; keep labels short and parallel.
 *
 * `variant="underline"` is the default chrome-level pattern; `variant="pill"`
 * suits a denser, self-contained segmented control inside a card or toolbar.
 */
export function Tabs({
  items,
  value,
  onChange,
  size = "md",
  variant = "underline",
  children,
  className,
}: TabsProps) {
  const baseId = useId();
  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  const enabledValues = items.filter((item) => !item.disabled).map((item) => item.value);

  const focusTab = (targetValue: string) => {
    tabRefs.current[targetValue]?.focus();
    onChange(targetValue);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLButtonElement>, currentValue: string) => {
    const currentIndex = enabledValues.indexOf(currentValue);
    if (currentIndex === -1) return;

    if (e.key === "ArrowRight") {
      e.preventDefault();
      const next = enabledValues[(currentIndex + 1) % enabledValues.length];
      focusTab(next);
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      const prev = enabledValues[(currentIndex - 1 + enabledValues.length) % enabledValues.length];
      focusTab(prev);
    } else if (e.key === "Home") {
      e.preventDefault();
      focusTab(enabledValues[0]);
    } else if (e.key === "End") {
      e.preventDefault();
      focusTab(enabledValues[enabledValues.length - 1]);
    }
  };

  return (
    <div className={className}>
      <div
        role="tablist"
        className={cn(
          "flex items-center",
          variant === "underline" ? "gap-1 border-b border-border-subtle" : "gap-1 rounded-md bg-surface-sunken p-1",
        )}
      >
        {items.map((item) => {
          const isActive = item.value === value;
          const tabId = `${baseId}-tab-${item.value}`;
          const panelId = `${baseId}-panel-${item.value}`;

          return (
            <button
              key={item.value}
              ref={(el) => {
                tabRefs.current[item.value] = el;
              }}
              id={tabId}
              type="button"
              role="tab"
              aria-selected={isActive}
              aria-controls={panelId}
              aria-disabled={item.disabled || undefined}
              tabIndex={isActive ? 0 : -1}
              disabled={item.disabled}
              onClick={() => onChange(item.value)}
              onKeyDown={(e) => handleKeyDown(e, item.value)}
              className={cn(
                "inline-flex shrink-0 items-center whitespace-nowrap font-medium transition-colors",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-1",
                SIZE_TAB_CLASSES[size],
                variant === "underline"
                  ? cn(
                      "-mb-px border-b-2",
                      isActive
                        ? "border-primary-700 text-primary-700"
                        : "border-transparent text-fg-secondary hover:text-fg-primary",
                    )
                  : cn(
                      "rounded-md",
                      isActive
                        ? "bg-surface-raised text-fg-primary shadow-sm"
                        : "text-fg-secondary hover:text-fg-primary",
                    ),
                item.disabled && "cursor-not-allowed text-fg-disabled hover:text-fg-disabled",
              )}
            >
              {item.icon ? (
                <span className={cn("inline-flex shrink-0", SIZE_ICON_CLASSES[size])} aria-hidden="true">
                  {item.icon}
                </span>
              ) : null}
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>
      {children
        ? Children.map(children, (child) => {
            if (!isValidElement(child)) return child;
            const el = child as ReactElement<{ value?: string }>;
            if (el.props.value !== value) return null;
            return cloneElement(el, {
              id: `${baseId}-panel-${el.props.value}`,
              role: "tabpanel",
              "aria-labelledby": `${baseId}-tab-${el.props.value}`,
              tabIndex: 0,
            } as Record<string, unknown>);
          })
        : null}
    </div>
  );
}

export interface TabPanelProps {
  value: string;
  children: ReactNode;
  className?: string;
}

/** Optional panel wrapper for use inside `Tabs`'s `children`. */
export function TabPanel({ children, className }: TabPanelProps) {
  return <div className={cn("pt-4", className)}>{children}</div>;
}
