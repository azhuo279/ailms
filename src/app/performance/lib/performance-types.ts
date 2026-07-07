import { z } from "zod";
import {
  exceptionTypeSchema,
  priorityTierSchema,
} from "@/app/workspace/lib/exception-types";

/**
 * Domain types for the /performance page (two-tab, two-audience). Tab 1 "Zone
 * Performance" reads how well a zone handles EXCEPTIONS across KPIs and spots
 * lagging warehouses; Tab 2 "AI Adoption" (director-only) governs AI trust and
 * ranks ZOMs. Validated at the fetch boundary (framework doc §5), modeled at
 * the lowest meaningful granularity (one record per warehouse-KPI, one record
 * per ZOM) so a period/zone filter propagates to every data-backed region
 * (KPI tiles, table, chart, leaderboard) from one source.
 *
 * The raw AI priorityScore convention from exception-types.ts is honored here:
 * any internal AI ranking score is INTERNAL and never surfaces in these types
 * or their consumers. Warehouses carry a coarse `status` tag and a rank, never
 * a raw model number.
 */

// ---------------------------------------------------------------------------
// KPI metric registry — the six zone indicators (MTTR primary)
// ---------------------------------------------------------------------------

/**
 * Canonical KPI identifier vocabulary. `mttr` is the primary indicator and
 * sorts the per-warehouse table worst-first by default.
 */
export const kpiIdSchema = z.enum([
  "mttr",
  "triageTime",
  "acceptanceRate",
  "escalationRate",
  "overrideFrequency",
  "manualEntryRate",
]);
export type KpiId = z.infer<typeof kpiIdSchema>;

/**
 * One period bucket for a sparkline / trend. `heightPercent` is 0-100, already
 * normalized by the fetch layer so StatTile renders it directly (StatTile does
 * no normalization of its own). `valueLabel` is the bucket's real reading in
 * the metric's own unit (e.g. "2.6 h", "71%"), shown in the per-bar hover
 * tooltip (Starling 2026-07-06) — distinct from `label`, which is the period
 * name ("Wk 3"), not a value.
 */
export const trendBucketSchema = z.object({
  heightPercent: z.number().min(0).max(100),
  label: z.string(),
  valueLabel: z.string().optional(),
});
export type TrendBucket = z.infer<typeof trendBucketSchema>;

/**
 * A single zone-level KPI reading. `lowerIsBetter` is the per-metric
 * favorability flag that drives StatTile's `isFavorable` (falling MTTR is
 * favorable, falling acceptance rate is unfavorable) — color is NEVER inferred
 * from the raw direction of change.
 */
export const zoneKpiSchema = z.object({
  id: kpiIdSchema,
  label: z.string(),
  /** Preformatted display value, e.g. "2.4 h" or "74%". */
  value: z.string(),
  /** Plain-language trend sentence, e.g. "18 min faster than last week". */
  trendNarrative: z.string(),
  /** Raw arithmetic direction — semantics only, never used to pick color. */
  direction: z.enum(["up", "down", "flat"]),
  /** For metrics where a lower value is the good read (MTTR, escalation, etc). */
  lowerIsBetter: z.boolean(),
  weeklyBuckets: z.array(trendBucketSchema),
});
export type ZoneKpi = z.infer<typeof zoneKpiSchema>;

// ---------------------------------------------------------------------------
// Per-warehouse breakdown — heat-filled ranked table
// ---------------------------------------------------------------------------

/**
 * Coarse attention state for a warehouse row. Maps to the reserved severity
 * ramp only for a true "needs attention" exception state; "watch" uses
 * warning, "on-track" stays neutral. Deliberately not a raw score.
 */
export const warehouseStatusSchema = z.enum(["needs-attention", "watch", "on-track"]);
export type WarehouseStatus = z.infer<typeof warehouseStatusSchema>;

/**
 * A single warehouse's KPI value in the breakdown table. `heat` is a
 * per-KPI favorable-to-unfavorable band (computed by the fetch layer relative
 * to the KPI's own distribution), so the cell can be tinted without the
 * component re-deriving thresholds.
 */
export const warehouseKpiCellSchema = z.object({
  value: z.string(),
  /** Numeric value for sorting only — display uses `value`. */
  raw: z.number(),
  heat: z.enum(["favorable", "neutral", "watch", "unfavorable"]),
});
export type WarehouseKpiCell = z.infer<typeof warehouseKpiCellSchema>;

/** The per-warehouse mini-detail revealed when a breakdown row expands. */
export const warehouseDetailSchema = z.object({
  /** AI diagnosis sentence with load-bearing phrases pre-bolded (markdown **). */
  aiDiagnosis: z.string(),
  /** Open exception counts by type, e.g. { "Customs Hold": 9 }. */
  exceptionCounts: z.array(
    z.object({ type: exceptionTypeSchema, count: z.number().min(0) }),
  ),
  /** Count of open T1 exceptions at this warehouse. */
  openT1Count: z.number().min(0),
  /** Highest open priority tier at this warehouse, for the detail tag. */
  topTier: priorityTierSchema,
});
export type WarehouseDetail = z.infer<typeof warehouseDetailSchema>;

export const warehousePerformanceSchema = z.object({
  /** FK-equivalent short code, mirrors the workspace warehouse registry. */
  id: z.string(),
  name: z.string(),
  location: z.string(),
  /** 1-based worst-first rank by the primary KPI (MTTR). */
  rank: z.number().min(1),
  status: warehouseStatusSchema,
  /** KPI cells keyed by KpiId. Every warehouse carries the full set. */
  cells: z.record(kpiIdSchema, warehouseKpiCellSchema),
  detail: warehouseDetailSchema,
});
export type WarehousePerformance = z.infer<typeof warehousePerformanceSchema>;

// ---------------------------------------------------------------------------
// Active AI insights (Zone tab — "View all insights" drawer)
// ---------------------------------------------------------------------------

/**
 * Category vocabulary for an AI insight. Superset of the exception-type
 * vocabulary (so a Customs Hold / Carrier Delay insight tags consistently with
 * the workspace feed) plus a few zone-analytics categories the AI narrates on.
 */
export const insightCategorySchema = z.enum([
  "Customs Hold",
  "Carrier Delay",
  "Dock Congestion",
  "Inventory Discrepancy",
  "Manual",
  "Acceptance drop",
  "Escalation spike",
  "Zone trend",
]);
export type InsightCategory = z.infer<typeof insightCategorySchema>;

/**
 * Coarse priority for an insight. Reuses the same "needs-attention / watch /
 * on-track" idea as `warehouseStatusSchema` — deliberately NOT a raw AI score.
 * Ordering (the array index / `rank`) plus this coarse tag carry priority; the
 * internal model number is never surfaced (see the module header + FR
 * convention in exception-types.ts).
 */
export const insightSeveritySchema = z.enum(["needs-attention", "watch", "on-track"]);
export type InsightSeverity = z.infer<typeof insightSeveritySchema>;

/**
 * One active AI insight for the Zone tab. `rank` is 1-based priority order (the
 * list renders in this order and the top-ranked one is the banner's lead).
 * `headline` and `narrative` carry `**bold**` load-bearing phrases rendered via
 * `renderBoldMarkdown`. `metric` is a single supporting figure string. No raw
 * score field exists here by design.
 */
export const zoneInsightSchema = z.object({
  id: z.string(),
  /** 1-based priority rank; the array is pre-sorted by it. */
  rank: z.number().min(1),
  category: insightCategorySchema,
  severity: insightSeveritySchema,
  /** One-line finding, load-bearing phrases pre-bolded (markdown **). */
  headline: z.string(),
  /** Fuller narrative body, also bold-marked. */
  narrative: z.string(),
  /** Single supporting metric string, e.g. "2.3x zone median escalation". */
  metric: z.string(),
  /** Optional warehouse this insight is anchored to, for context. */
  warehouseName: z.string().optional(),
  /** Per-insight freshness, e.g. "2 min ago". */
  updatedLabel: z.string(),
  /** True for the single insight already led in the ZoneNarrativeBanner. */
  isLead: z.boolean(),
});
export type ZoneInsight = z.infer<typeof zoneInsightSchema>;

// ---------------------------------------------------------------------------
// AI adoption (Tab 2, director-only)
// ---------------------------------------------------------------------------

/** AI outcome-mix bucket over time. Three distinct states. */
export const adoptionTrendPointSchema = z.object({
  period: z.string(),
  accepted: z.number().min(0),
  modified: z.number().min(0),
  rejected: z.number().min(0),
});
export type AdoptionTrendPoint = z.infer<typeof adoptionTrendPointSchema>;

/** Headline share for one of the three AI outcome states. */
export const adoptionSummarySchema = z.object({
  acceptedPct: z.number().min(0).max(100),
  acceptedTrend: z.string(),
  modifiedPct: z.number().min(0).max(100),
  modifiedTrend: z.string(),
  rejectedPct: z.number().min(0).max(100),
  rejectedTrend: z.string(),
});
export type AdoptionSummary = z.infer<typeof adoptionSummarySchema>;

/**
 * One model-gap row — an exception type with a high correction (modify +
 * reject) share, flagged for review. A high correction rate is a model gap,
 * not a favorable read, so it is status-tagged for filtering.
 */
export const modelGapSchema = z.object({
  type: exceptionTypeSchema,
  /** Combined modify + reject share, 0-100. */
  correctedPct: z.number().min(0).max(100),
  /** Low-confidence flag — isolates categories the model is unsure about. */
  isLowConfidence: z.boolean(),
});
export type ModelGap = z.infer<typeof modelGapSchema>;

/**
 * One ranked ZOM in the adoption leaderboard. Rendered as a flat ranked list on
 * the shared DataTable (ordered by acceptance rate). The trend sparkline,
 * trajectory cue, tier grouping, and viewer self-row were removed per Starling
 * feedback, so `weeklyBuckets` / `trajectory` / `tier` / `isSelf` no longer
 * exist on this entry.
 */
export const leaderboardEntrySchema = z.object({
  rank: z.number().min(1),
  /** Display name, e.g. "K. Mensah". */
  name: z.string(),
  /** Total AI actions taken in the period (volume). */
  volume: z.number().min(0),
  acceptedPct: z.number().min(0).max(100),
  modifiedPct: z.number().min(0).max(100),
  rejectedPct: z.number().min(0).max(100),
  /** True for top adopters — earns a badge. */
  isTopAdopter: z.boolean(),
});
export type LeaderboardEntry = z.infer<typeof leaderboardEntrySchema>;

// ---------------------------------------------------------------------------
// Root feed
// ---------------------------------------------------------------------------

export const performanceFeedSchema = z.object({
  /** Zone identity line for the page subtitle. */
  zoneLabel: z.string(),
  warehouseCount: z.number().min(0),
  generatedAt: z.string(),
  /** Human-readable "as of" freshness, e.g. "2 min ago". */
  updatedLabel: z.string(),
  /** AI narrative for the Zone tab: names the anomaly, magnitude, warehouse. */
  zoneNarrative: z.object({
    /** Body sentence, load-bearing phrases pre-bolded (markdown **). */
    body: z.string(),
    /** Short deep-link label, e.g. "Open Nogales Port DC breakdown". */
    deepLinkLabel: z.string(),
    /** Warehouse id the deep-link expands. */
    deepLinkWarehouseId: z.string(),
  }),
  zoneKpis: z.array(zoneKpiSchema),
  /**
   * All active AI insights for the Zone tab, pre-sorted by `rank`. The top one
   * (`isLead`) is the single insight surfaced in the ZoneNarrativeBanner; the
   * full set backs the "View all insights" drawer.
   */
  insights: z.array(zoneInsightSchema),
  warehouses: z.array(warehousePerformanceSchema),
  adoption: z.object({
    summary: adoptionSummarySchema,
    trend: z.array(adoptionTrendPointSchema),
    modelGaps: z.array(modelGapSchema),
    leaderboard: z.array(leaderboardEntrySchema),
    managerCount: z.number().min(0),
  }),
});
export type PerformanceFeed = z.infer<typeof performanceFeedSchema>;
