import { Fragment, type ReactNode } from "react";
import type {
  InsightSeverity,
  WarehouseKpiCell,
  WarehouseStatus,
} from "./performance-types";

/**
 * Renders a plain string with `**bold**` spans as emphasized text — the
 * convention used for the AI narrative and diagnosis copy where load-bearing
 * phrases are bolded (CLAUDE.md mock-data rule). Bold spans use `font-semibold
 * text-fg-primary` so they read as the load-bearing phrase against the
 * lighter surrounding body copy.
 */
export function renderBoldMarkdown(text: string): ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={i} className="font-semibold text-fg-primary">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return <Fragment key={i}>{part}</Fragment>;
  });
}

/**
 * Per-KPI heat band → token classes. Bands are favorable-to-unfavorable and
 * map to the semantic KPI-favorability ramps (success / neutral / warning /
 * danger). Deliberately NOT the reserved `ai` (teal) or `severity` ramps: heat
 * here is generic KPI good/bad coloring, so it uses success/warning/danger.
 * `danger-*` aliases the severity ramp in tokens, which is the intended
 * "worst KPI cell" read without invoking the severity role directly.
 */
export const KPI_HEAT_CLASSES: Record<WarehouseKpiCell["heat"], string> = {
  favorable: "bg-success-surface text-success-fg",
  neutral: "bg-surface-sunken text-fg-secondary",
  watch: "bg-warning-surface text-warning-fg",
  unfavorable: "bg-danger-surface text-danger-fg",
};

/** Human-readable warehouse status label + Tag/tier treatment selection. */
export const WAREHOUSE_STATUS_LABEL: Record<WarehouseStatus, string> = {
  "needs-attention": "Needs attention",
  watch: "Watch",
  "on-track": "On track",
};

/**
 * Insight severity → coarse label. Mirrors the warehouse-status vocabulary so
 * the drawer expresses priority with the SAME coarse language as the breakdown
 * table (needs-attention / watch / on-track). This is the ONLY priority signal
 * shown for an insight — there is deliberately no raw AI score. Ranking is also
 * carried by list order (`rank`), never by a rendered number.
 */
export const INSIGHT_SEVERITY_LABEL: Record<InsightSeverity, string> = {
  "needs-attention": "Needs attention",
  watch: "Watch",
  "on-track": "On track",
};
