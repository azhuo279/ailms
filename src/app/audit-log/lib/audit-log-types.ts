import { z } from "zod";

/**
 * Domain types for the Audit Log (PRD §5.10, FR-40/FR-41/FR-42). One record per
 * logged event — the lowest meaningful granularity for the domain — so every
 * filter (actor type, action type, tier, date range, exception, user)
 * propagates from a single source and the clustered view, the applied-filter
 * chips, and the export scope all read from the same filtered set.
 *
 * Events are IMMUTABLE by construction (FR-41): there is no update/delete shape
 * and the UI exposes copy-only affordances. Validated at the fetch boundary.
 */

// Who authored the action. The AI co-pilot is visually distinguished from
// human-authorized actions everywhere (FR-41) and is its own filter facet.
export const actorKindSchema = z.enum(["ai", "human"]);
export type ActorKind = z.infer<typeof actorKindSchema>;

/**
 * Event-type vocabulary (FR-40). Each type carries a stable icon + color in the
 * UI. `ai_recommendation` is the only AI-authored type; the rest are human ZOM
 * actions and system-recorded outcomes.
 */
export const auditEventTypeSchema = z.enum([
  "ai_recommendation",
  "approval",
  "override",
  "escalation",
  "delegation",
  "customs_hold",
  "tier_routing",
  "feedback",
  "dismiss",
]);
export type AuditEventType = z.infer<typeof auditEventTypeSchema>;

// Priority tier the event was routed at (FR-42 filterable). Reuses the
// workspace tier vocabulary so PriorityTierBadge renders it unchanged.
export const auditTierSchema = z.enum(["T1", "T2", "T3", "T4"]);
export type AuditTier = z.infer<typeof auditTierSchema>;

/** The actor who authored the event — identity plus a role label (FR-40). */
export const auditActorSchema = z.object({
  /** Stable id for the User filter facet (FR-42). */
  id: z.string(),
  /** Display name, e.g. "Maria Santos" or "Kase". */
  name: z.string(),
  /** Role label, e.g. "Dispatcher", "Director", "AI Co-pilot". */
  role: z.string(),
  kind: actorKindSchema,
});
export type AuditActor = z.infer<typeof auditActorSchema>;

/**
 * A single structured before/after field for an override's context payload
 * (FR-41 drawer). `before`/`after` are plain strings — the payload is a
 * human-readable diff, not a typed schema per field.
 */
export const auditChangeSchema = z.object({
  label: z.string(),
  before: z.string(),
  after: z.string(),
});
export type AuditChange = z.infer<typeof auditChangeSchema>;

/**
 * Optional structured context per event, surfaced only in the detail drawer.
 * Which keys are present depends on the event type (override → changes,
 * delegation → delegateTarget, ai_recommendation → reasoning + confidence,
 * customs_hold → classificationRationale). All optional so one shape covers
 * every event type without a discriminated union at the fetch boundary.
 */
export const auditContextSchema = z.object({
  /** Before/after fields for an override. */
  changes: z.array(auditChangeSchema).optional(),
  /** Who a delegation/escalation was routed to, "Name · Role". */
  routedTo: z.string().optional(),
  /** AI classification rationale for a customs-hold classification. */
  classificationRationale: z.string().optional(),
  /** AI reasoning steps (ai_recommendation only) — expandable in the drawer. */
  reasoning: z.array(z.string()).optional(),
  /** AI confidence 0-100 (ai_recommendation only). */
  confidence: z.number().min(0).max(100).optional(),
  /** Free-text note attached at authoring time (feedback, modified routing). */
  note: z.string().optional(),
});
export type AuditContext = z.infer<typeof auditContextSchema>;

export const auditEventSchema = z.object({
  id: z.string(),
  /** FK to the exception this event belongs to (FR-40). Clustering key. */
  exceptionId: z.string(),
  /** Human-readable shipment id shown in the cluster header, e.g. "SHP-48213". */
  shipmentId: z.string(),
  type: auditEventTypeSchema,
  actor: auditActorSchema,
  /** ISO 8601 with offset — rendered to the second with a tz label. */
  timestamp: z.string(),
  tier: auditTierSchema,
  /**
   * The action content (FR-40) — one scannable line, key phrases pre-bolded
   * with markdown-style `**...**` markers (mock-data convention). Truncated in
   * the row, shown in full in the drawer.
   */
  content: z.string(),
  context: auditContextSchema.optional(),
});
export type AuditEvent = z.infer<typeof auditEventSchema>;

export const auditLogFeedSchema = z.object({
  events: z.array(auditEventSchema),
  generatedAt: z.string(),
});
export type AuditLogFeed = z.infer<typeof auditLogFeedSchema>;

/**
 * A cluster of events grouped under one exception (Direction C). Derived, not
 * stored — the fetch payload is a flat event list, clustered client-side so
 * filtering re-clusters from the same source.
 */
export interface AuditCluster {
  exceptionId: string;
  shipmentId: string;
  /** Newest event's timestamp in the cluster — drives newest-first ordering. */
  latestTimestamp: string;
  events: AuditEvent[];
}
