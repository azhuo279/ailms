import type { ExceptionRecord } from "./exception-types";
import type { RecommendedAction } from "./exception-detail";

/**
 * Handoff derivations for the Delegate / Escalate flow (Direction C + the three
 * picked adjustments). Once the ZOM routes an exception's selected AI-recommended
 * action, the recommended-action block is replaced by a live status surface: a
 * Delegation status panel (Delegated tab) or an Escalation status panel
 * (Escalated tab).
 *
 * Everything here is DERIVED from a real ExceptionRecord + the SELECTED
 * RecommendedAction (adjustment 2 — the modal content is bound to that action's
 * situation / proposed action / rationale, never a generic summary), plus
 * realistic per-record mock content kept out of the components so the shapes stay
 * swappable for a real dispatch/approval service.
 *
 * Reserved-ramp discipline (CLAUDE.md): AI-assembled package/brief surfaces use
 * the `ai-*` ramp only; dispatchers/approvers (actors) use `neutral`; the
 * escalation trigger, over-capacity, blocked, deadline-passed and rejection use
 * `severity`/`danger`; completed/approved use `success`. Mock copy: no em-dashes,
 * minimal colons/semicolons, key phrases bolded via **markers** where a
 * description runs three sentences or more.
 */

// ---------------------------------------------------------------------------
// Dispatchers (Delegate pool) — adjustment 1: a DROPDOWN of users. Each option
// shows the name and a small role badge (Starling feedback); region and active
// count are no longer shown, but activeTasks still drives a minimal non-blocking
// over-capacity flag at/over the 5-task threshold. Selection is NEVER blocked.
// ---------------------------------------------------------------------------

/** The soft threshold at/above which a dispatcher reads as over capacity. */
export const DISPATCHER_CAPACITY_THRESHOLD = 5;

export interface Dispatcher {
  id: string;
  /** Display name, e.g. "J. Torres". */
  name: string;
  /** Execution-level role, e.g. "Dispatcher". */
  role: string;
  /** Home hub / region shown in the option, e.g. "MEM hub". */
  region: string;
  /** Open tasks currently assigned. At/over the threshold reads over capacity. */
  activeTasks: number;
}

/**
 * Delegate dispatcher pool. Mock directory, swap for a real
 * directory/permission service. R. Kwan sits over the soft threshold to exercise
 * the non-blocking over-capacity indicator.
 */
export const DISPATCHERS: Dispatcher[] = [
  { id: "dsp-torres", name: "J. Torres", role: "Dispatcher", region: "MEM hub", activeTasks: 3 },
  { id: "dsp-kwan", name: "R. Kwan", role: "Dispatcher", region: "MEM hub", activeTasks: 6 },
  { id: "dsp-osei", name: "D. Osei", role: "Dispatcher", region: "DFW hub", activeTasks: 2 },
  { id: "dsp-nair", name: "P. Nair", role: "Senior dispatcher", region: "LRD cross-dock", activeTasks: 4 },
  { id: "dsp-herrera", name: "L. Herrera", role: "Transport planner", region: "Zone west", activeTasks: 1 },
];

export function isOverCapacity(dispatcher: Dispatcher): boolean {
  return dispatcher.activeTasks >= DISPATCHER_CAPACITY_THRESHOLD;
}

export function getDispatcher(id: string): Dispatcher | undefined {
  return DISPATCHERS.find((d) => d.id === id);
}

// ---------------------------------------------------------------------------
// Approvers (Escalate routing) — the recipient is POLICY-DETERMINED by tier, not
// freely chosen (adjustment 1). T3 escalations route to a Logistics Director;
// T4 customs holds route to Legal / Compliance. The panel confirms who receives
// it and shows whether they already have a pending escalation from this ZOM.
// ---------------------------------------------------------------------------

export interface Approver {
  id: string;
  name: string;
  role: string;
  /** Escalations already open from this ZOM with this approver. */
  openFromYou: number;
  /** Whether this route strips the AI recommendation (T4 Legal-Sanctions). */
  stripsAiRecommendation: boolean;
  /** Why this recipient was chosen, for the confirmation line. */
  policyBasis: string;
}

const DIRECTOR_APPROVER: Approver = {
  id: "apr-singh",
  name: "R. Singh",
  role: "Logistics Director",
  openFromYou: 1,
  stripsAiRecommendation: false,
  policyBasis: "Assigned by T3 spend and authority policy",
};

const LEGAL_APPROVER: Approver = {
  id: "apr-nadeem",
  name: "S. Nadeem",
  role: "Legal / Compliance duty officer",
  openFromYou: 0,
  stripsAiRecommendation: true,
  policyBasis: "Customs / sanctions holds route to Legal by policy",
};

/**
 * Policy routing. A sanctions / legal hold routes to Legal (AI recommendation
 * stripped); every other escalation routes to the Logistics Director. Keyed off
 * the record's explicit `requiresLegalEscalation` flag, not tier+type: a routine
 * T4 Customs Hold (a broker amendment with no compliance risk) must NOT reach
 * Legal, only a flagged sanctions/prohibited-goods hold does.
 */
export function getPolicyApprover(exception: ExceptionRecord): Approver {
  return exception.requiresLegalEscalation === true
    ? LEGAL_APPROVER
    : DIRECTOR_APPROVER;
}

// ---------------------------------------------------------------------------
// The AI-assembled package (delegate) and decision-memo brief (escalate). Both
// are DERIVED from the SELECTED recommended action (adjustment 2) so the modal
// carries that action's own situation / proposed action / rationale, not a
// generic summary. Each field is editable inline in the modal before sending.
// ---------------------------------------------------------------------------

export interface PackageField {
  /** Short key, e.g. "Situation". */
  key: string;
  /** Value text, key phrases bolded via **markers**. */
  value: string;
  /** true when the ZOM may edit the value inline before sending. */
  editable: boolean;
}

/** Carrier + reference facts, keyed off the record so they read plausibly. */
function carrierRefs(exception: ExceptionRecord) {
  const bookingRef = `BK-${exception.shipmentId.replace(/\D/g, "").slice(-5)}`;
  const holdRef = `HLD-${exception.shipmentId.replace(/\D/g, "").slice(-4)}`;
  return { bookingRef, holdRef };
}

/** SLA deadline label, derived from tier (tighter tier, tighter window). */
export function getSlaWindow(exception: ExceptionRecord): string {
  switch (exception.priorityTier) {
    case "T1":
      return "14:30 today, 88 min left";
    case "T2":
      return "16:00 today, ~3 hrs left";
    case "T3":
      return "End of shift today";
    case "T4":
      return "Next business day";
  }
}

/**
 * Delegate handoff package, built from the selected action. Situation echoes the
 * record, action + rationale come from the selected action, and the carrier /
 * refs / SLA are the execution facts a dispatcher needs to act.
 */
export function buildDelegatePackage(
  exception: ExceptionRecord,
  action: RecommendedAction,
): PackageField[] {
  const { bookingRef, holdRef } = carrierRefs(exception);
  return [
    {
      key: "Situation",
      value: exception.headline,
      editable: true,
    },
    {
      key: "Action requested",
      value: action.description,
      editable: true,
    },
    {
      key: "AI rationale",
      value: action.expectedOutcome,
      editable: false,
    },
    {
      key: "Carrier contact",
      value: `${exception.carrier} dispatch, via **FleetCommand TMS**`,
      editable: false,
    },
    {
      key: "Booking / hold ref",
      value: `**${bookingRef}** and hold ${holdRef}`,
      editable: false,
    },
    {
      key: "SLA deadline",
      value: getSlaWindow(exception),
      editable: false,
    },
  ];
}

/**
 * Escalate decision-memo brief, built from the selected action. Decision-memo
 * structure (Situation, Impact, Proposed action + AI rationale, ZOM context).
 * For a Legal / Compliance route the AI recommendation is stripped entirely
 * (`approver.stripsAiRecommendation`), so the approver sees confirmed facts only.
 */
export function buildEscalateBrief(
  exception: ExceptionRecord,
  action: RecommendedAction,
  stripAiRecommendation: boolean,
): PackageField[] {
  const impactByTier: Record<string, string> = {
    T1: "**2 downstream SLAs** at risk, exposure near **$18k**",
    T2: "**1 downstream SLA** at risk, exposure near **$6k**",
    T3: "Contained to this load, minor cost exposure",
    T4: "Load held pending a compliance ruling",
  };

  const fields: PackageField[] = [
    { key: "Situation", value: exception.headline, editable: true },
    {
      key: "Impact",
      value: impactByTier[exception.priorityTier],
      editable: true,
    },
  ];

  if (!stripAiRecommendation) {
    fields.push(
      { key: "Proposed action", value: action.description, editable: true },
      { key: "AI rationale", value: action.expectedOutcome, editable: false },
    );
  } else {
    fields.push({
      key: "Confirmed facts",
      value:
        "Sanctions / prohibited-goods screening match on this load. **No AI resolution is proposed** for a Legal / Compliance review.",
      editable: false,
    });
  }

  return fields;
}

// ---------------------------------------------------------------------------
// The named escalation trigger (adjustment / full spec) — surfaced verbatim on
// the escalation modal header on the severity ramp.
// ---------------------------------------------------------------------------

export function getEscalationTrigger(
  exception: ExceptionRecord,
  approver: Approver,
): string {
  if (approver.stripsAiRecommendation) {
    return "Customs / sanctions hold routed to Legal and Compliance for a ruling.";
  }
  return "This action requires Director approval, estimated cost exceeds the T2 spend threshold.";
}

/**
 * A prior similar escalation on this carrier / lane with its outcome — the
 * "Similar escalation" chip. One realistic mock precedent.
 */
export interface SimilarEscalation {
  label: string;
  outcome: "approved" | "rejected";
}

export function getSimilarEscalation(
  exception: ExceptionRecord,
): SimilarEscalation | null {
  if (exception.priorityTier === "T4") return null;
  return {
    label: `${exception.carrier} ${exception.type} re-route`,
    outcome: "approved",
  };
}

// ---------------------------------------------------------------------------
// Deadline presets (Delegate footer). The SLA window is surfaced as a reference
// point beside them; the confirm verb reads "Send delegation".
// ---------------------------------------------------------------------------

export interface DeadlinePreset {
  id: string;
  label: string;
}

export const DEADLINE_PRESETS: DeadlinePreset[] = [
  { id: "dl-30", label: "30 min" },
  { id: "dl-60", label: "1 hr" },
  { id: "dl-120", label: "2 hrs" },
  { id: "dl-custom", label: "Custom" },
];

// ---------------------------------------------------------------------------
// Lifecycle status — the owner-attributed status-chip table + the highlighted
// NEXT STEP card. Modeled as chronological updates so the table renders them in
// order and the header state is the latest meaningful state.
// ---------------------------------------------------------------------------

/** Status-chip tone per lifecycle stage, mapped to the reserved ramps. */
export type StatusChipTone = "neutral" | "warning" | "success" | "danger";

export interface StatusUpdate {
  id: string;
  /** Owner who produced the update (dispatcher or approver name). */
  owner: string;
  /** What happened, e.g. "Contacting Ryder". */
  update: string;
  /** Short status word for the chip, e.g. "In progress". */
  statusLabel: string;
  tone: StatusChipTone;
  /** Display timestamp, e.g. "13:02". */
  time: string;
}

/** Delegation lifecycle state — drives the status header + recovery actions. */
export type DelegationState =
  | "awaiting"
  | "in-progress"
  | "blocked"
  | "completed"
  | "deadline-passed";

/** Escalation lifecycle state — drives the status header + recovery actions. */
export type EscalationState =
  | "awaiting"
  | "reviewing"
  | "decided"
  | "returned"
  | "no-response";

export interface DelegationStatus {
  state: DelegationState;
  dispatcherName: string;
  sentAt: string;
  deadline: string;
  updates: StatusUpdate[];
}

export interface EscalationDecision {
  outcome: "approved" | "modified" | "rejected";
  approverName: string;
  rationale: string;
  /** Changed parameter line, when the decision modified the request. */
  changedParameter?: string;
  time: string;
  /**
   * For a rejection, the ZOM's next-step options within T1/T2 authority,
   * filtered by the rejection rationale.
   */
  rejectionNextSteps?: { title: string; note: string }[];
}

export interface EscalationStatus {
  state: EscalationState;
  approverName: string;
  approverRole: string;
  submittedAt: string;
  updates: StatusUpdate[];
  decision?: EscalationDecision;
}

/**
 * Delegation status for a delegated exception. Mock lifecycle keyed off the
 * record's tier so different delegated records read differently (a blocked
 * state on a tighter tier, a completed one otherwise).
 */
export function buildDelegationStatus(
  exception: ExceptionRecord,
): DelegationStatus {
  const dispatcher = DISPATCHERS[0];
  // A T3 delegated record demonstrates the blocked path; others show completed.
  const isBlocked = exception.priorityTier === "T3";

  if (isBlocked) {
    return {
      state: "blocked",
      dispatcherName: dispatcher.name,
      sentAt: "12:58",
      deadline: "13:58",
      updates: [
        {
          id: "du-1",
          owner: dispatcher.name,
          update: "Acknowledged",
          statusLabel: "Received",
          tone: "neutral",
          time: "13:01",
        },
        {
          id: "du-2",
          owner: dispatcher.name,
          update: "Contacting carrier dispatch",
          statusLabel: "In progress",
          tone: "warning",
          time: "13:02",
        },
        {
          id: "du-3",
          owner: dispatcher.name,
          update: "Carrier needs the failed-unit release code first",
          statusLabel: "Blocked",
          tone: "danger",
          time: "13:11",
        },
      ],
    };
  }

  return {
    state: "completed",
    dispatcherName: dispatcher.name,
    sentAt: "12:58",
    deadline: "13:58",
    updates: [
      {
        id: "du-1",
        owner: dispatcher.name,
        update: "Acknowledged",
        statusLabel: "Received",
        tone: "neutral",
        time: "13:01",
      },
      {
        id: "du-2",
        owner: dispatcher.name,
        update: "Contacting carrier dispatch",
        statusLabel: "In progress",
        tone: "warning",
        time: "13:02",
      },
      {
        id: "du-3",
        owner: dispatcher.name,
        update: "Carrier confirmed",
        statusLabel: "Completed",
        tone: "success",
        time: "13:34",
      },
    ],
  };
}

/**
 * Escalation status for an escalated exception. Mock lifecycle keyed off tier so
 * different escalated records read differently: a T1 shows a no-response
 * recovery state, others show a received decision (approved-with-change or,
 * for a T2, a rejection with next steps).
 */
export function buildEscalationStatus(
  exception: ExceptionRecord,
): EscalationStatus {
  const approver = getPolicyApprover(exception);

  // A T1 escalated record demonstrates the no-response recovery path.
  if (exception.priorityTier === "T1") {
    return {
      state: "no-response",
      approverName: approver.name,
      approverRole: approver.role,
      submittedAt: "13:04",
      updates: [
        {
          id: "eu-1",
          owner: approver.name,
          update: "Submitted for approval",
          statusLabel: "Awaiting",
          tone: "warning",
          time: "13:04",
        },
      ],
    };
  }

  // A T2 escalated record demonstrates a rejection with filtered next steps.
  if (exception.priorityTier === "T2") {
    return {
      state: "decided",
      approverName: approver.name,
      approverRole: approver.role,
      submittedAt: "13:04",
      updates: [
        {
          id: "eu-1",
          owner: approver.name,
          update: "Opened brief",
          statusLabel: "In review",
          tone: "neutral",
          time: "13:08",
        },
        {
          id: "eu-2",
          owner: approver.name,
          update: "Rejected the request",
          statusLabel: "Decided",
          tone: "danger",
          time: "13:19",
        },
      ],
      decision: {
        outcome: "rejected",
        approverName: approver.name,
        rationale:
          "Spend is not justified for a single load. Try the in-network option first, escalate again only if it is unavailable.",
        changedParameter: "Cost ceiling held at $3,000.",
        time: "13:19",
        rejectionNextSteps: [
          {
            title: "Book in-network carrier, est. $2,600",
            note: "Within the $3,000 ceiling the rejection set",
          },
          {
            title: "Delegate a partial reload to the current carrier",
            note: "Keeps the assigned carrier, no new spend",
          },
        ],
      },
    };
  }

  // T3 / T4 show an approved-with-change decision (no action required).
  return {
    state: "decided",
    approverName: approver.name,
    approverRole: approver.role,
    submittedAt: "13:04",
    updates: [
      {
        id: "eu-1",
        owner: approver.name,
        update: "Opened brief",
        statusLabel: "In review",
        tone: "neutral",
        time: "13:08",
      },
      {
        id: "eu-2",
        owner: approver.name,
        update: "Approved with a change",
        statusLabel: "Decided",
        tone: "success",
        time: "13:19",
      },
    ],
    decision: {
      outcome: "modified",
      approverName: approver.name,
      rationale:
        "Approved the re-route. Capped spend and asked to use the in-network option first where it is available.",
      changedParameter: "Cost ceiling $4,800 to $4,200.",
      time: "13:19",
    },
  };
}
