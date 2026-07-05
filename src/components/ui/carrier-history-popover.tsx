"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Popover, PopoverTitle } from "./popover";

export interface CarrierHistoryStat {
  label: string;
  value: string;
}

export interface CarrierHistoryTrend {
  /** Raw arithmetic direction — drives the arrow glyph only, never color. */
  direction: "up" | "down";
  /** Whether this change is good news for this metric — drives color, decoupled from `direction`. */
  isFavorable: boolean;
  /** e.g. "+4% vs. last 90 days". */
  label: string;
}

export interface CarrierHistoryPoint {
  /** 0-100, normalized for the sparkline's viewBox. */
  value: number;
}

export interface CarrierHistoryPopoverProps {
  /** e.g. "Meridian Freight · PHX-LAX". */
  carrierLane: string;
  /** Stage-1 stat rows: on-time rate, prior exceptions, avg. resolution time. Trend renders separately. */
  stats: CarrierHistoryStat[];
  trend: CarrierHistoryTrend;
  /** Stage-2 sparkline series, oldest first, last entry is "today". */
  ninetyDayTrend: CarrierHistoryPoint[];
  /** Stage-2 label row value, e.g. "91.4%" — paired with a fixed "90-day on-time rate" label. */
  ninetyDayRateLabel: string;
  className?: string;
}

const SPARK_WIDTH = 256;
const SPARK_HEIGHT = 44;
const DOT_RADIUS = 3;

function buildPolylinePoints(points: CarrierHistoryPoint[]): string {
  if (points.length === 0) return "";
  const lastIndex = points.length - 1;
  return points
    .map((point, index) => {
      const x = lastIndex === 0 ? 0 : (index / lastIndex) * SPARK_WIDTH;
      const clamped = Math.max(0, Math.min(100, point.value));
      // Invert: 100 -> top (y=4), 0 -> bottom (y=SPARK_HEIGHT - 4), matching SVG's y-down axis.
      const y = SPARK_HEIGHT - 4 - (clamped / 100) * (SPARK_HEIGHT - 8);
      return `${x},${y}`;
    })
    .join(" ");
}

/**
 * Carrier history popover — a composed pattern (not a top-level primitive) built from
 * the canonical `Popover` for a trigger row that discloses carrier/lane performance in
 * two stages within a single continuous surface:
 *
 * - Stage 1: text-only stat list (on-time rate, prior exceptions, avg. resolution, trend chip).
 * - Stage 2 (optional expand): the same popover grows downward in place to reveal an
 *   axis-free inline SVG sparkline — matching `StatTileSparkline`'s "ambient shape, not a
 *   chart" philosophy — never the canonical `Chart` component, which is built for full
 *   dashboard chrome (axes/gridlines/legend) that would defeat this popover's compact scale.
 *
 * Reuses `Popover` as-is for portal-to-body, outside-click/Escape dismissal, and
 * positioning — this component never reimplements anchoring logic.
 */
export function CarrierHistoryPopover({
  carrierLane,
  stats,
  trend,
  ninetyDayTrend,
  ninetyDayRateLabel,
  className,
}: CarrierHistoryPopoverProps) {
  const [expanded, setExpanded] = useState(false);
  const polylinePoints = buildPolylinePoints(ninetyDayTrend);
  const lastPoint = ninetyDayTrend[ninetyDayTrend.length - 1];
  const lastY = lastPoint
    ? SPARK_HEIGHT - 4 - (Math.max(0, Math.min(100, lastPoint.value)) / 100) * (SPARK_HEIGHT - 8)
    : SPARK_HEIGHT / 2;
  const strokeColor = trend.isFavorable ? "var(--color-success-fg)" : "var(--color-danger-fg)";

  return (
    <Popover
      className={cn("w-80 p-0", className)}
      trigger={
        <button
          type="button"
          className={cn(
            "flex w-full items-center justify-between gap-3 rounded-lg border border-border-subtle bg-surface-raised px-4 py-3 text-left shadow-sm transition-shadow",
            "hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2",
          )}
        >
          <span className="flex min-w-0 flex-col gap-0.5">
            <span className="truncate text-body-m font-medium text-fg-primary">{carrierLane}</span>
            <span className="text-body-s text-fg-muted">View carrier history</span>
          </span>
          <ChevronDown className="size-4 shrink-0 text-fg-muted" aria-hidden="true" />
        </button>
      }
    >
      <div className="p-4">
        <PopoverTitle>Carrier history — last 30 days</PopoverTitle>
        <div className="mt-3 flex flex-col gap-2">
          {stats.map((stat) => (
            <div key={stat.label} className="flex items-center justify-between gap-3">
              <span className="text-body-s text-fg-secondary">{stat.label}</span>
              <span className="text-body-s font-medium tabular-nums text-fg-primary">{stat.value}</span>
            </div>
          ))}
          <div className="flex items-center justify-between gap-3">
            <span className="text-body-s text-fg-secondary">Trend</span>
            <span
              className={cn(
                "inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-full px-2 text-label-s font-medium",
                trend.isFavorable ? "bg-success-surface text-success-fg" : "bg-danger-surface text-danger-fg",
              )}
            >
              {trend.direction === "up" ? (
                <svg className="size-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} aria-hidden="true">
                  <path d="M6 15l6-6 6 6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              ) : (
                <svg className="size-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} aria-hidden="true">
                  <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
              {trend.label}
            </span>
          </div>
        </div>

        <div className="mt-3 border-t border-border-subtle pt-2">
          <button
            type="button"
            onClick={() => setExpanded((prev) => !prev)}
            aria-expanded={expanded}
            className={cn(
              "flex w-full items-center justify-center gap-1.5 rounded-md py-2 text-label-m font-medium text-btn-secondary-fg",
              "hover:bg-option-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2",
            )}
          >
            <span>View 90-day trend</span>
            <ChevronDown
              className={cn(
                "size-4 shrink-0 motion-safe:transition-transform motion-safe:duration-200 motion-safe:ease-in-out",
                expanded && "rotate-180",
              )}
              aria-hidden="true"
            />
          </button>
        </div>

        <div
          className={cn(
            "overflow-hidden motion-safe:transition-[max-height,opacity] motion-safe:duration-200 motion-safe:ease-in-out",
            expanded ? "mt-3 max-h-40 opacity-100" : "max-h-0 opacity-0",
          )}
        >
          <div className="flex items-center justify-between gap-3">
            <span className="text-label-s text-fg-secondary">90-day on-time rate</span>
            <span className="text-label-s font-medium tabular-nums text-fg-primary">{ninetyDayRateLabel}</span>
          </div>
          <div className="mt-2">
            <svg
              width="100%"
              height={SPARK_HEIGHT}
              viewBox={`0 0 ${SPARK_WIDTH} ${SPARK_HEIGHT}`}
              preserveAspectRatio="none"
              role="img"
              aria-label={`90-day on-time rate trend, ending ${trend.isFavorable ? "favorable" : "unfavorable"}`}
            >
              <polyline
                points={polylinePoints}
                fill="none"
                stroke={strokeColor}
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {lastPoint ? <circle cx={SPARK_WIDTH} cy={lastY} r={DOT_RADIUS} fill={strokeColor} /> : null}
            </svg>
          </div>
          <div className="mt-1 flex items-center justify-between text-footnote text-fg-muted">
            <span>90 days ago</span>
            <span>Today</span>
          </div>
        </div>
      </div>
    </Popover>
  );
}
