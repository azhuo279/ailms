import { z } from "zod";

/**
 * Domain types for the Workspace exception feed (Flow 4.1b — Triage exception
 * feed, PRD FR-01/FR-05/FR-09/FR-13/FR-45/FR-46/FR-49/FR-50). Validated at the
 * fetch boundary (framework doc §5). Modeled at the lowest meaningful
 * granularity (one record per exception) so filters/tabs propagate to every
 * data-backed region (feed list, map pins, pill counts) from one source.
 */

// Canonical six source systems (PRD prd-v5 §5.0 Source System Registry).
export const sourceSystemSchema = z.enum([
  "FleetCommand TMS",
  "Nexus WMS",
  "SignalTrack",
  "BorderIQ",
  "OrderPulse",
  "OpsDesk",
]);
export type SourceSystem = z.infer<typeof sourceSystemSchema>;

// Canonical exception type vocabulary (PRD FR-46 / F-06 quick-filter rail).
export const exceptionTypeSchema = z.enum([
  "Carrier Delay",
  "Customs Hold",
  "Dock Congestion",
  "Inventory Discrepancy",
  "Manual",
]);
export type ExceptionType = z.infer<typeof exceptionTypeSchema>;

// Queue the exception currently sits in — drives the Row 1 tab toggle.
export const exceptionQueueSchema = z.enum(["pending", "escalated", "delegated"]);
export type ExceptionQueue = z.infer<typeof exceptionQueueSchema>;

// Priority tier communicates urgency without exposing the underlying AI
// score/ranking number itself (explicit human instruction — score is
// computed internally for sort order only, never rendered).
export const priorityTierSchema = z.enum(["T1", "T2", "T3", "T4"]);
export type PriorityTier = z.infer<typeof priorityTierSchema>;

export const epistemicToneSchema = z.enum(["confirmed", "ai", "unknown"]);
export type EpistemicToneValue = z.infer<typeof epistemicToneSchema>;

export const geoCoordinatesSchema = z.object({
  lat: z.number(),
  lng: z.number(),
});
export type GeoCoordinates = z.infer<typeof geoCoordinatesSchema>;

export const exceptionRecordSchema = z.object({
  id: z.string(),
  shipmentId: z.string(),
  carrier: z.string(),
  queue: exceptionQueueSchema,
  type: exceptionTypeSchema,
  // Internal-only sort key. Never rendered in the UI (per explicit human
  // instruction) — used solely to order the feed and mark cards ELEVATE-
  // ineligible for a raw numeric display.
  priorityScore: z.number().min(0).max(100),
  priorityTier: priorityTierSchema,
  headline: z.string(),
  description: z.string(),
  sourceSystems: z.array(sourceSystemSchema).min(1),
  epistemicTone: epistemicToneSchema,
  epistemicBasis: z.string().optional(),
  location: z.string(),
  coordinates: geoCoordinatesSchema.nullable(),
  eventTimestamp: z.string(),
  lastUpdatedAt: z.string(),
  isStale: z.boolean(),
  isManuallyAdded: z.boolean(),
  scoreRecentlyUpdated: z.boolean(),
});
export type ExceptionRecord = z.infer<typeof exceptionRecordSchema>;

export const sourceHealthStatusSchema = z.enum(["healthy", "degraded", "down"]);
export type SourceHealthStatus = z.infer<typeof sourceHealthStatusSchema>;

export const sourceHealthSchema = z.object({
  system: sourceSystemSchema,
  status: sourceHealthStatusSchema,
  detail: z.string().optional(),
});
export type SourceHealth = z.infer<typeof sourceHealthSchema>;

export const workspaceFeedSchema = z.object({
  situationBrief: z.string(),
  sourceHealth: z.array(sourceHealthSchema),
  exceptions: z.array(exceptionRecordSchema),
  generatedAt: z.string(),
});
export type WorkspaceFeed = z.infer<typeof workspaceFeedSchema>;
