import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type BadgeTone =
  | "neutral"
  | "success"
  | "warning"
  | "danger"
  | "intransit"
  | "delivered"
  | "delayed"
  | "pending";
export type BadgeSize = "sm" | "md";

const TONE_CLASSES: Record<BadgeTone, string> = {
  neutral: "bg-surface-sunken text-fg-secondary",
  success: "bg-success-surface text-success-fg",
  warning: "bg-warning-surface text-warning-fg",
  danger: "bg-danger-surface text-danger-fg",
  // Logistics status ramp — distinct from severity, informational only.
  intransit: "bg-status-intransit-surface text-status-intransit",
  delivered: "bg-status-delivered-surface text-status-delivered",
  delayed: "bg-status-delayed-surface text-status-delayed",
  pending: "bg-status-pending-surface text-status-pending",
};

const DOT_CLASSES: Record<BadgeTone, string> = {
  neutral: "bg-fg-muted",
  success: "bg-success-emphasis",
  warning: "bg-warning-emphasis",
  danger: "bg-danger-border",
  intransit: "bg-status-intransit",
  delivered: "bg-status-delivered",
  delayed: "bg-status-delayed",
  pending: "bg-status-pending",
};

const SIZE_CLASSES: Record<BadgeSize, string> = {
  sm: "h-4 gap-1 px-1.5 text-footnote",
  md: "h-5 gap-1 px-2 text-label-s",
};

export interface BadgeProps {
  children?: ReactNode;
  tone?: BadgeTone;
  size?: BadgeSize;
  /** Renders a leading status dot instead of/alongside label text. */
  dot?: boolean;
  /** Renders as a numeric count badge — clamps display at 99+. */
  count?: number;
  /** Caps a numeric `count` display (default 99). */
  maxCount?: number;
  className?: string;
}

/**
 * Canonical Badge — compact, system-owned status or count indicator attached
 * to a component or object (unread alerts, delayed loads, row status chips).
 * Use Badge for values the system computes, not user-editable selections —
 * for those, use Tag instead.
 *
 * `intransit` / `delivered` / `delayed` / `pending` map to the reserved
 * shipment-status ramp (DESIGN.md §3) — use only for actual shipment/route
 * state, never as decorative color choices.
 */
export function Badge({
  children,
  tone = "neutral",
  size = "md",
  dot = false,
  count,
  maxCount = 99,
  className,
}: BadgeProps) {
  const displayCount = typeof count === "number" ? (count > maxCount ? `${maxCount}+` : String(count)) : undefined;

  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center whitespace-nowrap rounded-full font-medium",
        SIZE_CLASSES[size],
        TONE_CLASSES[tone],
        className,
      )}
    >
      {dot ? <span aria-hidden="true" className={cn("size-1.5 shrink-0 rounded-full", DOT_CLASSES[tone])} /> : null}
      {displayCount ?? children}
    </span>
  );
}
