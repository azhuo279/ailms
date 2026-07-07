"use client";

import { useId } from "react";
import type { ReactNode } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";
import { EmptyState } from "./empty-state";

export type ChartType = "line" | "bar" | "area";

/**
 * Shared stack id for a stacked bar chart. A single constant so every `<Bar>`
 * in a stacked chart lands in the same recharts stack group; used only when
 * `stacked` is true and `type === "bar"`.
 */
const BAR_STACK_ID = "chart-bar-stack";

/**
 * Categorical data-viz sequence — see DESIGN.md §3 ("Phase 3 addition —
 * categorical data-viz sequence") for why this isn't drawn from DESIGN.md's
 * own primitive ramps (`ai`/`severity` are role-reserved; `success`/
 * `warning` are themselves status-reserved). Assign in this fixed order —
 * never cycle or reshuffle, that's the CVD-safety mechanism. When a series
 * means shipment status specifically, use `CHART_STATUS_COLORS` instead.
 */
export const CHART_SERIES_COLORS = [
  "var(--color-chart-1)",
  "var(--color-chart-2)",
  "var(--color-chart-3)",
  "var(--color-chart-4)",
  "var(--color-chart-5)",
  "var(--color-chart-6)",
  "var(--color-chart-7)",
  "var(--color-chart-8)",
] as const;

/** Shipment-status series colors — reuse the reserved status ramp (DESIGN.md §3). */
export const CHART_STATUS_COLORS = {
  intransit: "var(--color-status-intransit)",
  delivered: "var(--color-status-delivered)",
  delayed: "var(--color-status-delayed)",
  pending: "var(--color-status-pending)",
} as const;

export interface ChartSeries {
  /** Data key this series reads from each datum. */
  key: string;
  label: string;
  /** Defaults to the next slot in `CHART_SERIES_COLORS` by index. */
  color?: string;
}

export interface ChartProps {
  type: ChartType;
  data: Record<string, unknown>[];
  series: ChartSeries[];
  /** Data key for the category/time axis. */
  xKey: string;
  isLoading?: boolean;
  emptyMessage?: string;
  /**
   * Fixed pixel height of the plot area. Omit to have the chart fill its
   * flex/grid parent instead (parent must establish a definite height —
   * e.g. a flex column with `flex-1 min-h-0` — since a percentage height
   * needs a sized ancestor to resolve against).
   */
  height?: number;
  /** Hides the legend — only do this for a single, title-named series. */
  hideLegend?: boolean;
  /**
   * Bar charts only — stacks every series into one bar per category instead of
   * grouping them side-by-side. No-op for line/area charts. Default false keeps
   * the existing grouped-bar behavior unchanged.
   */
  stacked?: boolean;
  className?: string;
}

function resolveColor(s: ChartSeries, index: number): string {
  return s.color ?? CHART_SERIES_COLORS[index % CHART_SERIES_COLORS.length];
}

/**
 * Canonical Chart — thin, token-bound wrapper around recharts for KPIs,
 * trends, throughput, dwell time, SLA adherence, and exception rates. Always
 * ships a legend (identity is never color-alone) and reuses neutral tokens
 * for axes/gridlines. Pair with tabular drill-down when actionability
 * matters; prefer a stat tile over a chart for a single headline number.
 */
export function Chart({
  type,
  data,
  series,
  xKey,
  isLoading = false,
  emptyMessage = "No data for this range yet.",
  height,
  hideLegend = false,
  stacked = false,
  className,
}: ChartProps) {
  const gradientId = useId();
  const isEmpty = !isLoading && data.length === 0;
  const fixedHeight = height ?? 280;

  if (isLoading) {
    return (
      <div
        className={cn(
          "flex items-center justify-center rounded-lg border border-border-subtle bg-surface-raised",
          className,
        )}
        style={height === undefined ? undefined : { height: fixedHeight }}
        role="status"
        aria-label="Loading chart"
      >
        <div className="flex flex-col items-center gap-2 text-fg-muted">
          <BarChart3 className="size-6 animate-pulse" aria-hidden="true" />
          <span className="text-body-s">Loading chart…</span>
        </div>
      </div>
    );
  }

  if (isEmpty) {
    return (
      <div
        className={cn(
          "rounded-lg border border-border-subtle bg-surface-raised",
          className,
        )}
        style={height === undefined ? undefined : { height: fixedHeight }}
      >
        <EmptyState
          title="No data"
          description={emptyMessage}
          className="h-full justify-center py-0"
        />
      </div>
    );
  }

  return (
    <div
      className={cn(
        " bg-surface-raised p-4",
        height === undefined && "min-h-0 flex-1",
        className,
      )}
    >
      <ResponsiveContainer
        width="100%"
        height={height === undefined ? "100%" : fixedHeight}
      >
        {type === "bar" ? (
          <BarChart
            data={data}
            margin={{ top: 4, right: 8, left: 0, bottom: 0 }}
          >
            <CartesianGrid
              stroke="var(--color-border-subtle)"
              vertical={false}
            />
            <XAxis
              dataKey={xKey}
              stroke="var(--color-border-strong)"
              tick={{ fill: "var(--color-fg-muted)", fontSize: 12 }}
              tickLine={false}
              axisLine={{ stroke: "var(--color-border-subtle)" }}
            />
            <YAxis
              stroke="var(--color-border-strong)"
              tick={{ fill: "var(--color-fg-muted)", fontSize: 12 }}
              tickLine={false}
              axisLine={false}
              width={36}
            />
            <Tooltip
              content={<ChartTooltip series={series} />}
              cursor={{ fill: "var(--color-option-hover)" }}
            />
            {series.map((s, i) => (
              <Bar
                key={s.key}
                dataKey={s.key}
                name={s.label}
                fill={resolveColor(s, i)}
                // Stacked bars share one stack id so segments sit on top of one
                // another; a per-segment top radius would notch the joins, so
                // stacked bars render square and grouped bars keep the rounded cap.
                stackId={stacked ? BAR_STACK_ID : undefined}
                radius={stacked ? undefined : [4, 4, 0, 0]}
                maxBarSize={stacked ? 56 : 40}
              />
            ))}
          </BarChart>
        ) : type === "area" ? (
          <AreaChart
            data={data}
            margin={{ top: 4, right: 8, left: 0, bottom: 0 }}
          >
            <defs>
              {series.map((s, i) => (
                <linearGradient
                  key={s.key}
                  id={`${gradientId}-${s.key}`}
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop
                    offset="5%"
                    stopColor={resolveColor(s, i)}
                    stopOpacity={0.28}
                  />
                  <stop
                    offset="95%"
                    stopColor={resolveColor(s, i)}
                    stopOpacity={0.02}
                  />
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid
              stroke="var(--color-border-subtle)"
              vertical={false}
            />
            <XAxis
              dataKey={xKey}
              stroke="var(--color-border-strong)"
              tick={{ fill: "var(--color-fg-muted)", fontSize: 12 }}
              tickLine={false}
              axisLine={{ stroke: "var(--color-border-subtle)" }}
            />
            <YAxis
              stroke="var(--color-border-strong)"
              tick={{ fill: "var(--color-fg-muted)", fontSize: 12 }}
              tickLine={false}
              axisLine={false}
              width={36}
            />
            <Tooltip
              content={<ChartTooltip series={series} />}
              cursor={{ stroke: "var(--color-border-strong)" }}
            />
            {series.map((s, i) => (
              <Area
                key={s.key}
                type="monotone"
                dataKey={s.key}
                name={s.label}
                stroke={resolveColor(s, i)}
                strokeWidth={2}
                fill={`url(#${gradientId}-${s.key})`}
                dot={false}
                activeDot={{
                  r: 4,
                  strokeWidth: 2,
                  stroke: "var(--color-surface-raised)",
                }}
              />
            ))}
          </AreaChart>
        ) : (
          <LineChart
            data={data}
            margin={{ top: 4, right: 8, left: 0, bottom: 0 }}
          >
            <CartesianGrid
              stroke="var(--color-border-subtle)"
              vertical={false}
            />
            <XAxis
              dataKey={xKey}
              stroke="var(--color-border-strong)"
              tick={{ fill: "var(--color-fg-muted)", fontSize: 12 }}
              tickLine={false}
              axisLine={{ stroke: "var(--color-border-subtle)" }}
            />
            <YAxis
              stroke="var(--color-border-strong)"
              tick={{ fill: "var(--color-fg-muted)", fontSize: 12 }}
              tickLine={false}
              axisLine={false}
              width={36}
            />
            <Tooltip
              content={<ChartTooltip series={series} />}
              cursor={{ stroke: "var(--color-border-strong)" }}
            />
            {series.map((s, i) => (
              <Line
                key={s.key}
                type="monotone"
                dataKey={s.key}
                name={s.label}
                stroke={resolveColor(s, i)}
                strokeWidth={2}
                dot={false}
                activeDot={{
                  r: 4,
                  strokeWidth: 2,
                  stroke: "var(--color-surface-raised)",
                }}
              />
            ))}
          </LineChart>
        )}
      </ResponsiveContainer>
      {!hideLegend ? <ChartLegend series={series} /> : null}
    </div>
  );
}

interface ChartTooltipProps {
  active?: boolean;
  label?: string;
  payload?: { name?: string; value?: number | string; color?: string }[];
  series: ChartSeries[];
}

/** Custom tooltip — token-bound surface, direct series labels (never color-alone). */
function ChartTooltip({ active, label, payload }: ChartTooltipProps) {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-md border border-border-subtle bg-surface-overlay px-3 py-2 text-body-s shadow-lg">
      {label ? (
        <p className="mb-1 font-medium text-fg-primary">{label}</p>
      ) : null}
      <div className="flex flex-col gap-0.5">
        {payload.map((entry, i) => (
          <div key={i} className="flex items-center gap-2">
            <span
              className="size-2 shrink-0 rounded-full"
              style={{ backgroundColor: entry.color }}
              aria-hidden="true"
            />
            <span className="text-fg-muted">{entry.name}</span>
            <span className="ml-auto font-medium tabular-nums text-fg-primary">
              {entry.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ChartLegend({ series }: { series: ChartSeries[] }) {
  return (
    <div className="mt-3 justify-end pr-4 flex flex-wrap items-center gap-x-4 gap-y-1.5 ">
      {series.map((s, i) => (
        <div key={s.key} className="flex items-center gap-1.5">
          <span
            className="size-2.5 shrink-0 rounded-full"
            style={{ backgroundColor: resolveColor(s, i) }}
            aria-hidden="true"
          />
          <span className="text-label-s text-fg-secondary">{s.label}</span>
        </div>
      ))}
    </div>
  );
}

export interface ChartFrameProps {
  title: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
}

/** Optional title/description/actions wrapper around a Chart, matching Card's header rhythm. */
export function ChartFrame({
  title,
  description,
  actions,
  children,
  className,
}: ChartFrameProps) {
  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-0.5">
          <h3 className="text-heading-l font-semibold text-fg-primary">
            {title}
          </h3>
          {description ? (
            <p className="text-body-s text-fg-muted">{description}</p>
          ) : null}
        </div>
        {actions ? (
          <div className="flex shrink-0 items-center gap-2">{actions}</div>
        ) : null}
      </div>
      {children}
    </div>
  );
}
