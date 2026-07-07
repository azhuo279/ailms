import type {
  ExceptionRecord,
  ExceptionType,
  PriorityTier,
  SourceHealth,
  SourceHealthStatus,
} from "./exception-types";
import type { EpistemicTone } from "@/components/ui/epistemic-status";

/**
 * Detail-view derivations for a single ExceptionRecord (Exception Detail View,
 * right pane of the /workspace split). The domain model (exception-types.ts)
 * carries the record's facts; the detail view additionally needs an AI read,
 * recommended actions, an evidence log, a timeline, and routing metadata that
 * the feed record does not store. Those are DERIVED here from real record
 * fields wherever possible (epistemicTone, priorityTier, type, sourceSystems,
 * timestamps) and otherwise generated as realistic, per-type mock content, kept
 * out of the component so the shapes stay swappable for a real service.
 *
 * priorityScore is never read here. The internal sort score is not routing
 * input and is never surfaced (product instruction) — the priority RANK shown
 * in the sidebar is a coarse position derived from the tier alone.
 */

/** A single AI-authored claim in the full summary, with its own epistemic tone. */
export interface AiSummaryClaim {
  id: string;
  /** Sentence text, key phrases pre-bolded via markdown-style **bold**. */
  text: string;
  /** How well grounded this specific claim is. */
  tone: EpistemicTone;
  /** Short basis for the claim's epistemic tag tooltip. */
  basis: string;
}

export interface AiSummary {
  /** 1 to 2 sentence collapsed digest. */
  digest: string;
  /** Full read, one claim per sentence, each independently toned. */
  claims: AiSummaryClaim[];
}

export type ActionTradeoffKind = "cost" | "time" | "risk";

export interface RecommendedAction {
  id: string;
  /** Short action name, e.g. "Expedite corrected invoice". */
  name: string;
  /** One-line description of what the action does. */
  description: string;
  /** Expected outcome if taken. */
  expectedOutcome: string;
  /** Tier this action carries once routed. */
  tier: PriorityTier;
  /** true for the single AI-primary recommendation. */
  isAiPrimary: boolean;
  /** Trade-off note shown on alternatives (omitted on the primary). */
  tradeoff?: { kind: ActionTradeoffKind; note: string };
}

export interface EvidenceEvent {
  id: string;
  /** Absolute-ish clock label, e.g. "13:02 CT". */
  time: string;
  /** Source system or actor that logged the event. */
  source: string;
  /** What the event recorded. */
  detail: string;
  tone: EpistemicTone;
  /**
   * Health of the source system AT THE TIME this event was logged. The event
   * log can therefore show the same system healthy at an earlier entry and
   * degraded/down at a later one. Rendered as the source-health status dot
   * (STATUS_DOT vocabulary), not an epistemic tag.
   */
  healthStatus: SourceHealthStatus;
}

export type TimelineState = "done" | "current" | "upcoming";

export interface TimelineStep {
  id: string;
  label: string;
  time: string;
  state: TimelineState;
}

export interface RoutingMeta {
  /** Routing tier label, e.g. "Tier 1 desk". */
  tier: string;
  /** Authority level required to close, e.g. "Dispatch lead". */
  authority: string;
}

/**
 * A sanctions / legal / compliance hold (inspector F1 / Starling). Read from the
 * record's explicit `requiresLegalEscalation` flag, NOT from headline text or
 * exception type: a T4 Customs Hold can be a routine broker amendment (exc-1014)
 * that is not a legal matter, so the flag is the only safe signal. When true, the
 * AI summary states facts only, proposes NO documentation remedy, and the sole
 * path is a manual escalation to Legal.
 */
export function isLegalHold(exception: ExceptionRecord): boolean {
  return exception.requiresLegalEscalation === true;
}

/** Human sub-type label per exception type — the sidebar's sub-type badge. */
const SUBTYPE_BY_TYPE: Record<ExceptionType, string> = {
  "Carrier Delay": "Transit slip",
  "Customs Hold": "Documentation gap",
  "Dock Congestion": "Yard backlog",
  "Inventory Discrepancy": "Count mismatch",
  Manual: "Analyst flagged",
};

export function getSubType(exception: ExceptionRecord): string {
  return SUBTYPE_BY_TYPE[exception.type];
}

/** Routing tier + authority, keyed to priority tier (higher tier, higher desk). */
const ROUTING_BY_TIER: Record<PriorityTier, RoutingMeta> = {
  T1: { tier: "Tier 1 desk", authority: "Dispatch lead" },
  T2: { tier: "Tier 2 desk", authority: "Senior dispatcher" },
  T3: { tier: "Standard queue", authority: "Dispatcher" },
  T4: { tier: "Standard queue", authority: "Dispatcher" },
};

export function getRouting(exception: ExceptionRecord): RoutingMeta {
  return ROUTING_BY_TIER[exception.priorityTier];
}

/**
 * Coarse priority RANK label from the tier only (never the internal score).
 * T1 leads, then T2, and so on — a position band a dispatcher can read without
 * exposing the AI's continuous score.
 */
const RANK_BY_TIER: Record<PriorityTier, string> = {
  T1: "Top of queue",
  T2: "High band",
  T3: "Mid band",
  T4: "Low band",
};

export function getPriorityRank(exception: ExceptionRecord): string {
  return RANK_BY_TIER[exception.priorityTier];
}

/** Numeric rank position for the "Why ranked #N?" chip, derived from tier. */
const RANK_NUMBER_BY_TIER: Record<PriorityTier, number> = {
  T1: 1,
  T2: 4,
  T3: 9,
  T4: 14,
};

export function getRankNumber(exception: ExceptionRecord): number {
  return RANK_NUMBER_BY_TIER[exception.priorityTier];
}

/**
 * AI confidence in the summary read, 0-100. Derived from the record's epistemic
 * tone (a confirmed source event is trusted more than an inferred read) and
 * lifted when a second source system corroborates the signal. This is the AI's
 * self-reported confidence in its summary, shown on the AI summary card, so it
 * lives on the `ai-*` reserved surface only.
 */
const CONFIDENCE_BY_TONE: Record<EpistemicTone, number> = {
  confirmed: 88,
  ai: 72,
  unknown: 54,
};

export function getAiConfidence(exception: ExceptionRecord): number {
  const base = CONFIDENCE_BY_TONE[exception.epistemicTone];
  // A corroborating second source raises confidence; cap at 97 so it never
  // reads as certainty.
  const corroborated = exception.sourceSystems.length > 1 ? base + 7 : base;
  return Math.min(97, corroborated);
}

/**
 * Estimated time to resolve, keyed to priority tier (a top-of-queue exception
 * gets faster hands than a low-band one). Returns a short human label for the
 * AI summary card's second row.
 */
const RESOLUTION_ETA_BY_TIER: Record<PriorityTier, string> = {
  T1: "~2 hrs",
  T2: "~5 hrs",
  T3: "~1 day",
  T4: "~2 days",
};

export function getResolutionEta(exception: ExceptionRecord): string {
  return RESOLUTION_ETA_BY_TIER[exception.priorityTier];
}

/**
 * AI summary — a digest plus a three-claim full read. The digest reuses the
 * record's own description first sentence where present so the collapsed view
 * echoes the confirmed facts; the expanded claims layer inferred reads on top,
 * each toned independently so a dispatcher sees which sentence is confirmed
 * versus AI-projected.
 */
export function buildAiSummary(exception: ExceptionRecord): AiSummary {
  const firstSentence =
    exception.description.split(". ")[0]?.replace(/\.$/, "") ?? exception.headline;

  // Legal / sanctions holds branch BEFORE the type switch (inspector F1). The AI
  // states confirmed facts and that manual legal clearance is required, and
  // proposes NO documentation remedy of any kind. A documentation-gap cue here
  // would be wrong and dangerous for a sanctions matter.
  if (isLegalHold(exception)) {
    const digest = `${exception.headline}. **Manual legal clearance is required, no AI resolution is proposed.**`;

    const claims: AiSummaryClaim[] = [
      {
        id: "claim-fact",
        text: `${firstSentence}.`,
        tone: exception.epistemicTone,
        basis: exception.epistemicBasis ?? "Source system event",
      },
      {
        id: "claim-screening",
        text: "A **sanctions or prohibited-goods screening match** blocks this load until a compliance ruling clears it.",
        tone: "confirmed",
        basis: "Screening system flag on this shipment",
      },
      {
        id: "claim-next",
        text: "This hold **cannot be actioned from here**. The only path is to **escalate to Legal** for a manual clearance decision.",
        tone: "confirmed",
        basis: "Sanctions / legal holds route to Legal by policy",
      },
    ];

    return { digest, claims };
  }

  const digest = `${exception.headline}. **${digestActionCue(exception.type)}**`;

  const claims: AiSummaryClaim[] = [
    {
      id: "claim-fact",
      text: `${firstSentence}.`,
      tone: exception.epistemicTone,
      basis: exception.epistemicBasis ?? "Source system event",
    },
    {
      id: "claim-impact",
      text: impactClaim(exception.type),
      tone: "ai",
      basis: "Projected from lane history and current queue depth",
    },
    {
      id: "claim-next",
      text: nextStepClaim(exception.type),
      tone: exception.sourceSystems.length > 1 ? "ai" : "unknown",
      basis:
        exception.sourceSystems.length > 1
          ? "Cross-referenced across the attached source systems"
          : "Single-source read, corroboration pending",
    },
  ];

  return { digest, claims };
}

function digestActionCue(type: ExceptionType): string {
  switch (type) {
    case "Customs Hold":
      return "Clear the document gap to resolve fastest.";
    case "Carrier Delay":
      return "Rebook a backup carrier to recover the window.";
    case "Dock Congestion":
      return "Reslot the dock to avoid a backlog.";
    case "Inventory Discrepancy":
      return "Run a cycle count to fix the mismatch.";
    case "Manual":
      return "Review the analyst context before routing.";
  }
}

function impactClaim(type: ExceptionType): string {
  switch (type) {
    case "Customs Hold":
      return "Left unresolved, **downstream orders miss their SLA window** and the load holds overnight at the crossing.";
    case "Carrier Delay":
      return "The slip **cascades to two connecting legs** unless the ETA is recovered this shift.";
    case "Dock Congestion":
      return "The yard backlog **spreads to three inbound appointments** if the slot is not cleared soon.";
    case "Inventory Discrepancy":
      return "The count gap **blocks two outbound picks** until it is reconciled.";
    case "Manual":
      return "Impact is **not yet modeled**, this record was added by an analyst rather than a source feed.";
  }
}

function nextStepClaim(type: ExceptionType): string {
  switch (type) {
    case "Customs Hold":
      return "The recommended path is to **expedite the corrected invoice** through the broker.";
    case "Carrier Delay":
      return "The recommended path is to **rebook a backup carrier** on the same lane.";
    case "Dock Congestion":
      return "The recommended path is to **reslot the dock appointment** to the next open window.";
    case "Inventory Discrepancy":
      return "The recommended path is to **trigger a cycle count** on the affected SKU.";
    case "Manual":
      return "The recommended path is to **confirm the analyst note** before routing.";
  }
}

/**
 * Recommended actions — one AI-primary plus one or two alternatives with
 * trade-off notes. Keyed to exception type so each record reads plausibly. The
 * primary carries the record's own tier; alternatives step down a band to
 * signal a lighter-touch trade.
 */
export function buildRecommendedActions(
  exception: ExceptionRecord,
): RecommendedAction[] {
  // Legal / sanctions holds branch BEFORE the type switch (inspector F1). No
  // self-serve documentation remedy is EVER returned for these, even though the
  // detail view suppresses the recommended-action list entirely. The single
  // returned action carries the record's T4 tier so getRoutingKind resolves to
  // "escalate", and it is the escalation-to-Legal action the modal derives from.
  // Its copy contains no documentation-gap remedy. isAiPrimary is true because
  // this IS the AI's sole recommendation (no alternatives exist to choose
  // instead) — leaving it false made isModified always true for every
  // legal-hold escalation, forcing a reason category on an untouched routing
  // (inspector F2).
  if (isLegalHold(exception)) {
    return [
      {
        id: "act-escalate-legal",
        name: "Escalate to Legal for manual clearance",
        description:
          "Route this hold to Legal and Compliance for a manual clearance ruling. No action can be taken from here.",
        expectedOutcome:
          "Legal reviews the screening match and issues a clearance decision.",
        tier: exception.priorityTier,
        isAiPrimary: true,
      },
    ];
  }

  const lower: PriorityTier =
    exception.priorityTier === "T1"
      ? "T2"
      : exception.priorityTier === "T2"
        ? "T3"
        : "T4";

  switch (exception.type) {
    case "Customs Hold":
      return [
        {
          id: "act-primary",
          name: "Expedite corrected invoice",
          description: "Push the corrected commercial invoice to the broker for same-day refiling.",
          expectedOutcome: "Hold clears within the current SLA window.",
          tier: exception.priorityTier,
          isAiPrimary: true,
        },
        {
          id: "act-alt-1",
          name: "Request broker pre-clearance",
          description: "Ask the broker to pre-clear on a bond while the invoice is corrected.",
          expectedOutcome: "Buys time but adds a bond fee.",
          tier: lower,
          isAiPrimary: false,
          tradeoff: { kind: "cost", note: "Adds a bond fee, faster release" },
        },
        {
          id: "act-alt-2",
          name: "Hold for next-day refile",
          description: "Leave the load staged and refile at the next crossing window.",
          expectedOutcome: "Lowest cost, misses the SLA window.",
          tier: lower,
          isAiPrimary: false,
          tradeoff: { kind: "time", note: "Slower, no added cost" },
        },
      ];
    case "Carrier Delay":
      return [
        {
          id: "act-primary",
          name: "Rebook backup carrier",
          description: "Assign the pre-qualified backup carrier on the same lane.",
          expectedOutcome: "Recovers most of the lost transit window.",
          tier: exception.priorityTier,
          isAiPrimary: true,
        },
        {
          id: "act-alt-1",
          name: "Hold for original carrier",
          description: "Wait for the assigned carrier to recover on its own.",
          expectedOutcome: "No added cost, higher slip risk.",
          tier: lower,
          isAiPrimary: false,
          tradeoff: { kind: "risk", note: "Higher slip risk, no added cost" },
        },
      ];
    case "Dock Congestion":
      return [
        {
          id: "act-primary",
          name: "Reslot dock appointment",
          description: "Move the appointment to the next open dock window.",
          expectedOutcome: "Clears the backlog before it cascades.",
          tier: exception.priorityTier,
          isAiPrimary: true,
        },
        {
          id: "act-alt-1",
          name: "Divert to overflow yard",
          description: "Stage the load in the overflow yard until a door frees.",
          expectedOutcome: "Frees the dock, adds a handling touch.",
          tier: lower,
          isAiPrimary: false,
          tradeoff: { kind: "cost", note: "Extra handling touch" },
        },
      ];
    case "Inventory Discrepancy":
      return [
        {
          id: "act-primary",
          name: "Trigger cycle count",
          description: "Send a cycle-count task to the floor for the affected SKU.",
          expectedOutcome: "Reconciles the count and releases the picks.",
          tier: exception.priorityTier,
          isAiPrimary: true,
        },
        {
          id: "act-alt-1",
          name: "Accept WMS count",
          description: "Trust the WMS figure and release the picks now.",
          expectedOutcome: "Fastest, risks shipping short.",
          tier: lower,
          isAiPrimary: false,
          tradeoff: { kind: "risk", note: "Risks a short ship" },
        },
      ];
    case "Manual":
      return [
        {
          id: "act-primary",
          name: "Confirm and route",
          description: "Confirm the analyst note and route to the standard queue.",
          expectedOutcome: "Enters the queue with analyst context attached.",
          tier: exception.priorityTier,
          isAiPrimary: true,
        },
        {
          id: "act-alt-1",
          name: "Return for detail",
          description: "Send back to the analyst for more context before routing.",
          expectedOutcome: "Cleaner routing, adds a round trip.",
          tier: lower,
          isAiPrimary: false,
          tradeoff: { kind: "time", note: "Adds an analyst round trip" },
        },
      ];
  }
}

/**
 * Evidence event log — the source events the AI read, newest first.
 *
 * Each event carries a `healthStatus` DERIVED from the event's source system +
 * time (user decision). Derivation:
 *  1. A system's CURRENT health is the ground truth — read it from the feed's
 *     `sourceHealth` (keyed by system name). A source not present there defaults
 *     to "healthy".
 *  2. Health changed over time: a system that is currently degraded/down was
 *     healthy earlier and only slipped at its most-recent entry. So for each
 *     system, only its NEWEST event carries the current (possibly unhealthy)
 *     status; earlier events for that same system read "healthy". This makes the
 *     log visibly show the change (e.g. healthy at 14:02, degraded at 14:28),
 *     matching the annotation's example, and stays internally consistent (a
 *     currently-healthy system reads healthy at every entry).
 */
export function buildEvidence(
  exception: ExceptionRecord,
  sourceHealth: SourceHealth[] = [],
): EvidenceEvent[] {
  const [primary, secondary] = exception.sourceSystems;

  // Current health per source system; absent -> healthy.
  const currentHealth = new Map<string, SourceHealthStatus>();
  for (const source of sourceHealth) {
    currentHealth.set(source.system, source.status);
  }
  const currentStatusFor = (system: string): SourceHealthStatus =>
    currentHealth.get(system) ?? "healthy";

  const events: EvidenceEvent[] = [
    {
      id: "ev-1",
      time: "14:28 CT",
      source: primary,
      detail: exception.epistemicBasis ?? "Logged the originating exception event.",
      tone: exception.epistemicTone,
      // placeholder; assigned by the per-system pass below
      healthStatus: "healthy",
    },
    {
      id: "ev-2",
      time: "14:02 CT",
      source: primary,
      detail: "Status refreshed, no change to the exception state.",
      tone: "confirmed",
      healthStatus: "healthy",
    },
  ];
  if (secondary) {
    events.splice(1, 0, {
      id: "ev-3",
      time: "14:10 CT",
      source: secondary,
      detail: "Corroborating signal received, used to raise the AI confidence.",
      tone: "ai",
      healthStatus: "healthy",
    });
  }

  // events are already newest-first. For each system, the FIRST (newest) event
  // gets that system's current status; all older events for the same system
  // read "healthy" — showing the health change over time.
  const seenSystem = new Set<string>();
  for (const event of events) {
    if (!seenSystem.has(event.source)) {
      seenSystem.add(event.source);
      event.healthStatus = currentStatusFor(event.source);
    } else {
      event.healthStatus = "healthy";
    }
  }

  return events;
}

/** Resolution timeline — detected, triaged (current), resolution (upcoming). */
export function buildTimeline(): TimelineStep[] {
  return [
    { id: "tl-1", label: "Detected", time: "13:02 CT", state: "done" },
    { id: "tl-2", label: "Ranked and queued", time: "13:04 CT", state: "done" },
    { id: "tl-3", label: "In triage", time: "Now", state: "current" },
    { id: "tl-4", label: "Resolution", time: "Pending", state: "upcoming" },
  ];
}

export const TRADEOFF_LABEL: Record<ActionTradeoffKind, string> = {
  cost: "Cost",
  time: "Time",
  risk: "Risk",
};

// ---------------------------------------------------------------------------
// Routing model (routing IS execution — no approve/confirm step).
//
// A recommendation is never "approved". It is EXECUTED by routing it to a
// person: T1/T2 recs are DELEGATED to an execution-level user (dispatcher or
// planner); T3/T4 recs are ESCALATED to a Director-level user or Legal
// Authority for a consequential call. The recipient pools below are the
// eligible people per routing type.
//
// MOCK DATA — clearly-labeled placeholder recipients. Swap for a real
// directory/permission service. Kept flat and typed so the shapes stay
// swappable. Scannable, no em-dashes.
// ---------------------------------------------------------------------------

/** Which CTA a recommendation shows, decided by its tier. */
export type RoutingKind = "delegate" | "escalate";

/** T1/T2 delegate to execution level; T3/T4 escalate for a bigger decision. */
export function getRoutingKind(tier: PriorityTier): RoutingKind {
  return tier === "T1" || tier === "T2" ? "delegate" : "escalate";
}

/** A person a recommendation can be routed to. */
export interface RoutingRecipient {
  id: string;
  name: string;
  /** Role shown after the name in the picker, e.g. "Dispatcher". */
  role: string;
}

/**
 * Delegate pool — execution-level users who carry out the action. Shown when
 * the recommendation is T1 or T2.
 */
export const DELEGATE_RECIPIENTS: RoutingRecipient[] = [
  { id: "rcp-d1", name: "Marta Ochoa", role: "Dispatcher" },
  { id: "rcp-d2", name: "Devon Pryce", role: "Dispatcher" },
  { id: "rcp-d3", name: "Priya Nair", role: "Senior dispatcher" },
  { id: "rcp-d4", name: "Luis Herrera", role: "Transport planner" },
  { id: "rcp-d5", name: "Anika Roy", role: "Transport planner" },
];

/**
 * Escalate pool — Director-level users and Legal Authority who make the
 * consequential decision. Shown when the recommendation is T3 or T4.
 */
export const ESCALATE_RECIPIENTS: RoutingRecipient[] = [
  { id: "rcp-e1", name: "Grace Odum", role: "Operations director" },
  { id: "rcp-e2", name: "Tomas Vieira", role: "Regional director" },
  { id: "rcp-e3", name: "Helen Zhao", role: "Legal authority" },
];

/** Recipient pool for a routing kind. */
export function getRecipients(kind: RoutingKind): RoutingRecipient[] {
  return kind === "delegate" ? DELEGATE_RECIPIENTS : ESCALATE_RECIPIENTS;
}

/**
 * Reason categories for a MODIFIED routing (FR-24 style). A modified route
 * requires the zone-ops manager to name WHY the AI primary was changed before
 * routing can complete; a free-text note stays optional. Scannable labels, no
 * em-dashes.
 */
export interface ReasonCategory {
  id: string;
  label: string;
}

export const MODIFICATION_REASONS: ReasonCategory[] = [
  { id: "reason-carrier", label: "Better carrier option" },
  { id: "reason-deadline", label: "Deadline adjustment" },
  { id: "reason-instruction", label: "Instruction correction" },
  { id: "reason-alt-path", label: "Alternative path preferred" },
  { id: "reason-other", label: "Other" },
];

// ---------------------------------------------------------------------------
// Map hover-popover preview derivations.
//
// The map's hover popover answers one question in under 2 seconds: "is this
// worth opening?" It is NOT a mini detail view. Each helper below returns the
// SINGLE most operationally relevant fact for a preview, per exception type,
// plus the AI's recommended action as a verb phrase only (never the rationale).
// All derived from real record fields wherever possible, otherwise realistic
// per-type mock content kept out of the component. Scannable, no em-dashes.
// ---------------------------------------------------------------------------

/**
 * The single most operationally relevant fact for a pin preview, chosen per
 * exception type. Returns a short label + value pair so the popover can render
 * the value with emphasis. This is the "why open it" fact, not a summary.
 */
export interface PreviewFact {
  /** Quiet lead-in, e.g. "SLA window" or "Deviation". */
  label: string;
  /** The load-bearing value, e.g. "3h 40m left" or "2 orders affected". */
  value: string;
}

const PREVIEW_FACT_BY_TYPE: Record<ExceptionType, PreviewFact> = {
  "Customs Hold": { label: "Hold reason", value: "Documentation gap, SLA closes in 3h 40m" },
  "Carrier Delay": { label: "ETA deviation", value: "Beyond threshold, 2 orders affected" },
  "Dock Congestion": { label: "Yard backlog", value: "3 inbound appointments at risk" },
  "Inventory Discrepancy": { label: "Count gap", value: "Blocks 2 outbound picks" },
  Manual: { label: "Analyst note", value: "Impact not yet modeled" },
};

export function buildPreviewFact(exception: ExceptionRecord): PreviewFact {
  return PREVIEW_FACT_BY_TYPE[exception.type];
}

/**
 * The AI's recommended action as a bare verb phrase (the primary rec's name),
 * e.g. "Expedite corrected invoice". No rationale, no outcome, no alternatives.
 * Pulled from the same buildRecommendedActions source the detail view uses.
 */
export function getPrimaryActionPhrase(exception: ExceptionRecord): string {
  const actions = buildRecommendedActions(exception);
  const primary = actions.find((a) => a.isAiPrimary) ?? actions[0];
  return primary.name;
}
