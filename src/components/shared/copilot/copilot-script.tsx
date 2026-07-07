import type { ChatTurn } from "./types";

/**
 * Canned Copilot conversations (South Texas logistics zone). No message backend
 * is wired, so each exchange is played back DETERMINISTICALLY as a real
 * back-and-forth. **The conversation advances one step per user send** — a
 * suggested prompt (or free text) sends a user turn, a brief thinking indicator
 * shows, then Kase replies with ONE focused turn (a single message or widget).
 * The suggested prompts shown at each step ARE the script driver, so the
 * available asks change to reflect the natural next thing to say.
 *
 * **Per-page scripts.** Kase is context-aware: the script it plays is chosen by
 * the route it is opened on, so what surfaces in the panel is always tied to the
 * dataset on that page. On `/workspace` Kase helps triage and route a live
 * exception; on `/audit-log` it searches history and surfaces override patterns;
 * on `/performance` it explains how the zone is doing. Every id, shipment,
 * warehouse, and figure below matches the mock feed for that route
 * (`workspace-feed.json`, `audit-log.json`, `performance-feed.json`), so the
 * narrative lines up with what the user sees on screen.
 *
 * Confirming a choice or committing an action appends the matching entry from
 * that script's `followUps`, so recovery choices and CTAs keep working inline.
 *
 * Copy rules (CLAUDE.md, strict): no em-dashes, colons/semicolons minimized,
 * scannable, no overexplaining. Any description of three or more sentences bolds
 * its key phrases.
 */

let idCounter = 0;

/** Fresh unique turn id — follow-ups are cloned with a new id per append. */
export function newId(): string {
  idCounter += 1;
  return `turn-${idCounter}`;
}

/**
 * One scripted step of the back-and-forth. `suggestions` are the prompt chips
 * offered to the user WHILE waiting for this step's send (the natural next
 * asks); sending any of them (or free text) plays `reply` after the thinking
 * delay and advances to the next step, whose `suggestions` then replace them.
 */
export interface ConversationStep {
  /** The suggested user prompts offered before this reply is triggered. */
  suggestions: string[];
  /** The single-focus assistant turn played once the user sends. */
  reply: ChatTurn;
}

/** A full per-page conversation: ordered steps plus keyed follow-up turns. */
export interface CopilotScript {
  steps: ConversationStep[];
  followUps: Record<string, ChatTurn>;
}

/** The routes that carry a dedicated Kase conversation. */
export type CopilotPage = "workspace" | "audit-log" | "performance";

/* ------------------------------------------------------------------ *
 * WORKSPACE — triage and route a live exception in the panel.
 * Grounded in workspace-feed.json (exc-1001 / SHP-48213, Laredo WTB).
 * ------------------------------------------------------------------ */

const WORKSPACE_STEPS: ConversationStep[] = [
  // Step 1 — the top exception, in plain words.
  {
    suggestions: [
      "What needs my attention right now?",
      "Any Gold-tier orders at risk?",
    ],
    reply: {
      id: "ws-breach",
      role: "assistant",
      blocks: [
        {
          kind: "text",
          content:
            "The top item is a customs hold at the Laredo World Trade Bridge, shipment SHP-48213. Two Gold-tier orders sit on it and the SLA breach window closes in 3 hours 40 minutes.",
        },
      ],
    },
  },
  // Step 2 — the downstream projection widget.
  {
    suggestions: ["What happens if we leave it?", "Who is affected?"],
    reply: {
      id: "ws-projection",
      role: "assistant",
      blocks: [
        {
          kind: "text",
          content: "Here is the downstream impact if the hold is not cleared in the window.",
        },
        {
          kind: "receipt",
          variant: "projection",
          metrics: [
            { value: "2", label: "Orders at risk" },
            { value: "2", label: "Gold customers" },
            { value: "3h 40m", label: "Breach window" },
          ],
          headline: (
            <>
              If the invoice is not corrected in time, both orders are{" "}
              <strong>projected to miss SLA</strong>.
            </>
          ),
          confidenceLabel: "High confidence · 88%",
          riskCountLabel: "2 orders at risk",
          evidence: [
            {
              id: "ev-1",
              content: (
                <>
                  BorderIQ flags the reason as a <strong>Documentation Gap</strong>,
                  the most common resolvable category.
                </>
              ),
            },
            {
              id: "ev-2",
              content: (
                <>
                  Lane history shows corrected invoices clear Laredo in{" "}
                  <strong>under 40 minutes</strong> on average.
                </>
              ),
            },
            {
              id: "ev-3",
              content: (
                <>
                  OrderPulse confirms <strong>two Gold-tier orders</strong> on the
                  load with a tight receiving window.
                </>
              ),
            },
          ],
          citations: ["BorderIQ", "OrderPulse"],
        },
      ],
    },
  },
  // Step 3 — the trend chart.
  {
    suggestions: ["Is this lane usually this slow?", "Show me the clear-time trend"],
    reply: {
      id: "ws-viz",
      role: "assistant",
      blocks: [
        {
          kind: "text",
          content:
            "Clear times at the bridge have been climbing all week. Friday runs the longest.",
        },
        {
          kind: "viz",
          title: "Avg minutes to clear a documentation-gap hold",
          description: "Laredo World Trade Bridge, this week.",
          chartType: "bar",
          xKey: "day",
          series: [{ key: "minutes", label: "Minutes to clear" }],
          data: [
            { day: "Mon", minutes: 34 },
            { day: "Tue", minutes: 38 },
            { day: "Wed", minutes: 41 },
            { day: "Thu", minutes: 47 },
            { day: "Fri", minutes: 58 },
          ],
        },
      ],
    },
  },
  // Step 4 — the recovery choice (confirm appends "ws-recovery-chosen").
  {
    suggestions: ["What are my options?", "How do we clear it?"],
    reply: {
      id: "ws-recovery",
      role: "assistant",
      blocks: [
        {
          kind: "choices",
          id: "ws-choice-recovery",
          prompt: <>How should I clear this hold?</>,
          control: "radio",
          options: [
            { label: "Expedite a corrected invoice", value: "expedite" },
            { label: "Hold for a broker HS-code review", value: "broker" },
            { label: "Escalate to the compliance desk", value: "escalate" },
          ],
          confirmLabel: "Confirm approach",
          confirmToTurnId: "ws-recovery-chosen",
        },
      ],
    },
  },
  // Step 5 — the predicted-clear read (stat).
  {
    suggestions: ["Will it clear in time?", "Who would I delegate to?"],
    reply: {
      id: "ws-stat",
      role: "assistant",
      blocks: [
        {
          kind: "text",
          content:
            "The broker on call can file the correction and clear it well inside the window. Here is the read.",
        },
        {
          kind: "receipt",
          variant: "stat",
          label: "Predicted clear vs breach",
          value: "—",
          provenanceTone: "ai",
          provenanceLabel: "AI estimate",
          provenanceBasis: "Based on lane clear-time history and broker availability.",
          comparisonBar: {
            plannedLabel: "18:32 breach",
            predictedLabel: "17:10 clear",
            plannedPercent: 62,
            predictedPercent: 40,
            state: "favorable",
            phraseLead: "Clears with 1h 22m buffer",
            phraseDetail: "±20 min",
            asOf: "as of 14:32",
          },
        },
      ],
    },
  },
  // Step 6 — execute in chat: the structured pre-execution confirm card
  // (FR-CONV-03). The whole triage-to-route loop closes in the panel. Confirming
  // appends "ws-delegate-committed" (the routing receipt).
  {
    suggestions: ["Clear the top item", "Delegate it to the broker"],
    reply: {
      id: "ws-confirm-delegate",
      role: "assistant",
      blocks: [
        {
          kind: "text",
          content:
            "Ready to route it. Confirm and I will hand SHP-48213 to the on-call broker with the full AI package.",
        },
        {
          kind: "confirm",
          actionType: "Delegate",
          targetLabel: "SHP-48213 · Laredo customs hold",
          tier: "T1",
          consequence: (
            <>
              Keeps{" "}
              <strong>
                2 Gold-tier orders held inside the 18:32 CT breach window
              </strong>
              .
            </>
          ),
          confirmLabel: "Delegate to broker",
          cancelLabel: "Not now",
          commitToTurnId: "ws-delegate-committed",
        },
      ],
    },
  },
  // Step 7 — the follow-up scope check (multi-select tags).
  {
    suggestions: ["Anything else tied to this carrier?", "Check the rest of my zone"],
    reply: {
      id: "ws-scope",
      role: "assistant",
      blocks: [
        {
          kind: "text",
          content:
            "Two more Redline loads on the I-35 lane into New Braunfels share a dispatcher, SHP-50410 and SHP-50412. SHP-48219 is a separate sanctions hold. Which should I check?",
        },
        {
          kind: "choices",
          id: "ws-choice-scope",
          prompt: <>Which shipments should I review?</>,
          control: "tags",
          multiple: true,
          options: [
            { label: "SHP-50410", value: "shp-50410" },
            { label: "SHP-50412", value: "shp-50412" },
            { label: "SHP-48219", value: "shp-48219" },
          ],
          confirmLabel: "Review selected",
          confirmToTurnId: "ws-scope-reviewed",
        },
      ],
    },
  },
];

const WORKSPACE_FOLLOW_UPS: Record<string, ChatTurn> = {
  "ws-recovery-chosen": {
    id: "ws-recovery-chosen",
    role: "assistant",
    blocks: [
      {
        kind: "text",
        content:
          "Good call. Ask whether it clears in time and I will pull the predicted clear against the breach window.",
      },
    ],
  },
  "ws-delegate-committed": {
    id: "ws-delegate-committed",
    role: "assistant",
    blocks: [
      {
        kind: "text",
        content: (
          <>
            Delegated to <strong>Devin Okafor · Customs Broker</strong> with the
            AI package. Both Gold-tier customers have the revised timeline.
          </>
        ),
      },
      {
        kind: "receipt",
        variant: "stat",
        label: "Orders held inside SLA",
        value: "2 of 2",
        hint: "Cleared against the 18:32 CT breach window.",
        provenanceTone: "confirmed",
        provenanceLabel: "Confirmed",
        provenanceBasis: "BorderIQ hold event + OrderPulse SLA tier.",
      },
    ],
  },
  "ws-scope-reviewed": {
    id: "ws-scope-reviewed",
    role: "assistant",
    blocks: [
      {
        kind: "text",
        content:
          "Reviewed. SHP-50410 and SHP-50412 share the same dispatcher, so one call recovers both. SHP-48219 needs the legal desk, not a delegate, so I left it out.",
      },
      {
        kind: "action",
        text: <>Want me to draft the single dispatcher call for both I-35 loads?</>,
        ctaLabel: "Draft the recovery call",
        ctaVariant: "primary",
        commitToTurnId: "ws-delegate-committed",
      },
    ],
  },
};

/* ------------------------------------------------------------------ *
 * AUDIT LOG — search history and surface override patterns.
 * Grounded in audit-log.json (override + feedback events, this week).
 * ------------------------------------------------------------------ */

const AUDIT_LOG_STEPS: ConversationStep[] = [
  // Step 1 — the headline pattern.
  {
    suggestions: [
      "Where are we overriding the AI most?",
      "Show this week's override pattern",
    ],
    reply: {
      id: "al-pattern",
      role: "assistant",
      blocks: [
        {
          kind: "text",
          content:
            "This week the overrides cluster on Customs Hold. You modified 3 of the last 4 customs-hold recommendations before routing them.",
        },
      ],
    },
  },
  // Step 2 — corrections by type.
  {
    suggestions: ["Break that down by type", "Which categories get corrected?"],
    reply: {
      id: "al-viz-type",
      role: "assistant",
      blocks: [
        {
          kind: "text",
          content: "Here is the correction rate by exception type across the log.",
        },
        {
          kind: "viz",
          title: "Recommendations corrected by type (%)",
          description: "Modify plus reject, this week.",
          chartType: "bar",
          xKey: "type",
          series: [{ key: "corrected", label: "% corrected" }],
          data: [
            { type: "Customs Hold", corrected: 41 },
            { type: "Inventory", corrected: 28 },
            { type: "Dock", corrected: 19 },
            { type: "Carrier", corrected: 12 },
            { type: "Manual", corrected: 6 },
          ],
        },
      ],
    },
  },
  // Step 3 — the common thread.
  {
    suggestions: ["Why customs holds specifically?", "What's the common reason?"],
    reply: {
      id: "al-thread",
      role: "assistant",
      blocks: [
        {
          kind: "text",
          content:
            "The common thread is confidence. On the Laredo hold SHP-48213 you flagged a classification question, and on the cold-chain reefer SHP-51002 you marked the recommendation not helpful because confidence read too high on a dropped feed.",
        },
      ],
    },
  },
  // Step 4 — the confidence read (stat).
  {
    suggestions: ["What did I flag not helpful?", "Show the confidence issue"],
    reply: {
      id: "al-stat",
      role: "assistant",
      blocks: [
        {
          kind: "receipt",
          variant: "stat",
          label: "Confidence flagged too high",
          value: "2 loads",
          hint: "Both recommendations rested on degraded SignalTrack data.",
          provenanceTone: "ai",
          provenanceLabel: "AI pattern",
          provenanceBasis: "From your Not-helpful feedback on SHP-51002 and one Q1 reefer.",
        },
      ],
    },
  },
  // Step 5 — which sites drive it.
  {
    suggestions: ["Which sites drive this?", "Is it one warehouse?"],
    reply: {
      id: "al-viz-site",
      role: "assistant",
      blocks: [
        {
          kind: "text",
          content:
            "It is the two border sites. Pharr-Reynosa and Eagle Pass carry most of the customs-hold corrections. Laredo clears them clean.",
        },
        {
          kind: "viz",
          title: "Customs-hold corrections by site",
          description: "Override count, this week.",
          chartType: "bar",
          xKey: "site",
          series: [{ key: "overrides", label: "Overrides" }],
          data: [
            { site: "Pharr-Reynosa", overrides: 9 },
            { site: "Eagle Pass", overrides: 6 },
            { site: "Laredo WTB", overrides: 1 },
          ],
        },
      ],
    },
  },
  // Step 6 — execute in chat: the structured pre-execution confirm card
  // (FR-CONV-03). A Tier A query turns into a compiled export, no tier badge.
  // Confirming appends "al-export-committed".
  {
    suggestions: ["Can I export this?", "Compile it for the review"],
    reply: {
      id: "al-confirm-export",
      role: "assistant",
      blocks: [
        {
          kind: "text",
          content:
            "I can compile these into one summary. Confirm and I will bundle the records for the review.",
        },
        {
          kind: "confirm",
          actionType: "Export",
          targetLabel: "Customs Hold override records · this week",
          consequence: (
            <>
              <strong>8 override records</strong> with reason codes and
              confidence, ready for the performance review.
            </>
          ),
          confirmLabel: "Export summary",
          cancelLabel: "Not now",
          commitToTurnId: "al-export-committed",
        },
      ],
    },
  },
  // Step 7 — pull a specific trail (multi-select tags).
  {
    suggestions: ["Search a specific shipment", "Pull a full trail"],
    reply: {
      id: "al-scope",
      role: "assistant",
      blocks: [
        {
          kind: "text",
          content: "Which shipment's full trail do you want to open?",
        },
        {
          kind: "choices",
          id: "al-choice-trail",
          prompt: <>Pick a trail to open</>,
          control: "tags",
          multiple: false,
          options: [
            { label: "SHP-48213", value: "shp-48213" },
            { label: "SHP-48901", value: "shp-48901" },
            { label: "SHP-51002", value: "shp-51002" },
          ],
          confirmLabel: "Open trail",
          confirmToTurnId: "al-trail-opened",
        },
      ],
    },
  },
];

const AUDIT_LOG_FOLLOW_UPS: Record<string, ChatTurn> = {
  "al-export-committed": {
    id: "al-export-committed",
    role: "assistant",
    blocks: [
      {
        kind: "text",
        content:
          "Done. Exported the customs-hold override records with reason codes and confidence. It lines up with the Customs Hold model gap on the performance page.",
      },
      {
        kind: "receipt",
        variant: "stat",
        label: "Records exported",
        value: "8",
        hint: "Customs Hold overrides, this week.",
        provenanceTone: "confirmed",
        provenanceLabel: "Confirmed",
        provenanceBasis: "From the immutable audit trail.",
      },
    ],
  },
  "al-trail-opened": {
    id: "al-trail-opened",
    role: "assistant",
    blocks: [
      {
        kind: "text",
        content:
          "Pulled it. SHP-48213 has four events, Kase classified the hold, recommended a re-file, then you held for a broker and delegated it. The full chain is expanded in the log below.",
      },
    ],
  },
};

/* ------------------------------------------------------------------ *
 * PERFORMANCE — explain how the zone is doing.
 * Grounded in performance-feed.json (Pharr drag, Laredo reference).
 * ------------------------------------------------------------------ */

const PERFORMANCE_STEPS: ConversationStep[] = [
  // Step 1 — the zone headline.
  {
    suggestions: ["How is my zone doing?", "What needs attention this week?"],
    reply: {
      id: "pf-headline",
      role: "assistant",
      blocks: [
        {
          kind: "text",
          content:
            "Zone MTTR is down to 2.4 hours, 18 minutes better than last week. The one drag is Pharr-Reynosa Border DC.",
        },
      ],
    },
  },
  // Step 2 — why Pharr.
  {
    suggestions: ["Why is Pharr dragging?", "What's happening there?"],
    reply: {
      id: "pf-why",
      role: "assistant",
      blocks: [
        {
          kind: "text",
          content:
            "Three things stack up at Pharr. MTTR climbed 41 minutes, escalation runs 2.3x the zone median, and AI acceptance fell to 58 percent, almost all of it on customs holds.",
        },
      ],
    },
  },
  // Step 3 — acceptance vs the zone.
  {
    suggestions: ["Show acceptance vs the zone", "How far below is it?"],
    reply: {
      id: "pf-viz",
      role: "assistant",
      blocks: [
        {
          kind: "text",
          content: "Here is AI acceptance by site against the zone average.",
        },
        {
          kind: "viz",
          title: "AI acceptance rate by site (%)",
          description: "Zone average is 74%.",
          chartType: "bar",
          xKey: "site",
          series: [{ key: "acceptance", label: "% accepted" }],
          data: [
            { site: "Pharr-Reynosa", acceptance: 58 },
            { site: "Eagle Pass", acceptance: 69 },
            { site: "San Antonio Hub", acceptance: 71 },
            { site: "Laredo WTB", acceptance: 88 },
          ],
        },
      ],
    },
  },
  // Step 4 — trust vs speed.
  {
    suggestions: ["Is it the model or the people?", "Trust or speed problem?"],
    reply: {
      id: "pf-stat",
      role: "assistant",
      blocks: [
        {
          kind: "text",
          content:
            "It is trust, not speed. Triage at Pharr is only a little slow, but the model itself is uncertain on this work.",
        },
        {
          kind: "receipt",
          variant: "stat",
          label: "Customs holds corrected",
          value: "41%",
          hint: "The model flags this category low confidence.",
          provenanceTone: "ai",
          provenanceLabel: "AI diagnosis",
          provenanceBasis: "Overrides cluster on BorderIQ customs holds at the border sites.",
        },
      ],
    },
  },
  // Step 5 — the fix (confirm appends "pf-plan-chosen").
  {
    suggestions: ["What would fix it?", "Where do I start?"],
    reply: {
      id: "pf-plan",
      role: "assistant",
      blocks: [
        {
          kind: "choices",
          id: "pf-choice-plan",
          prompt: <>Where should I focus first?</>,
          control: "radio",
          options: [
            { label: "Review the customs-hold model with the vendor", value: "model" },
            { label: "Pair Pharr with the Laredo playbook", value: "playbook" },
            { label: "Shift afternoon staffing 14:00 to 18:00", value: "staffing" },
          ],
          confirmLabel: "Confirm focus",
          confirmToTurnId: "pf-plan-chosen",
        },
      ],
    },
  },
  // Step 6 — execute in chat: the structured pre-execution confirm card
  // (FR-CONV-03). Journey 4.5 export, done conversationally, no tier badge.
  // Confirming appends "pf-review-committed".
  {
    suggestions: ["Draft that for the director", "Summarize this for review"],
    reply: {
      id: "pf-confirm-draft",
      role: "assistant",
      blocks: [
        {
          kind: "text",
          content:
            "I can turn this into a one-page zone review. Confirm and I will draft it for the director.",
        },
        {
          kind: "confirm",
          actionType: "Draft",
          targetLabel: "Weekly zone review · South Texas",
          consequence: (
            <>
              Leads with the <strong>Pharr customs-hold gap</strong> and the{" "}
              <strong>Laredo reference pattern</strong>, 3 sections.
            </>
          ),
          confirmLabel: "Draft zone review",
          cancelLabel: "Not now",
          commitToTurnId: "pf-review-committed",
        },
      ],
    },
  },
  // Step 7 — compare sites (multi-select tags).
  {
    suggestions: ["Compare Pharr to Laredo", "Who is my best site?"],
    reply: {
      id: "pf-scope",
      role: "assistant",
      blocks: [
        {
          kind: "text",
          content: "Which sites should I put side by side?",
        },
        {
          kind: "choices",
          id: "pf-choice-compare",
          prompt: <>Pick sites to compare</>,
          control: "tags",
          multiple: true,
          options: [
            { label: "Pharr-Reynosa", value: "pharr" },
            { label: "Eagle Pass", value: "eagle-pass" },
            { label: "Laredo WTB", value: "laredo" },
          ],
          confirmLabel: "Compare selected",
          confirmToTurnId: "pf-compare-done",
        },
      ],
    },
  },
];

const PERFORMANCE_FOLLOW_UPS: Record<string, ChatTurn> = {
  "pf-plan-chosen": {
    id: "pf-plan-chosen",
    role: "assistant",
    blocks: [
      {
        kind: "text",
        content:
          "Good pick. Pharr's triage lag lines up with the 14:00 to 18:00 window, so an afternoon staffing shift should move the needle fastest.",
      },
    ],
  },
  "pf-review-committed": {
    id: "pf-review-committed",
    role: "assistant",
    blocks: [
      {
        kind: "text",
        content:
          "Done. Drafted a zone review leading with the Pharr customs-hold gap and the Laredo site as the reference pattern.",
      },
      {
        kind: "receipt",
        variant: "stat",
        label: "Zone MTTR",
        value: "2.4 h",
        hint: "18 min better than last week.",
        provenanceTone: "confirmed",
        provenanceLabel: "Confirmed",
        provenanceBasis: "Rolling 6-week performance feed.",
      },
    ],
  },
  "pf-compare-done": {
    id: "pf-compare-done",
    role: "assistant",
    blocks: [
      {
        kind: "text",
        content:
          "Compared. Laredo World Trade Bridge clears customs holds at 88 percent acceptance and 1.9 hour MTTR. Pharr sits at 58 percent and 3.8 hours on the same work, so the Laredo playbook is the closest template.",
      },
    ],
  },
};

/* ------------------------------------------------------------------ */

/** Every per-page conversation, keyed by route. */
export const COPILOT_SCRIPTS: Record<CopilotPage, CopilotScript> = {
  workspace: { steps: WORKSPACE_STEPS, followUps: WORKSPACE_FOLLOW_UPS },
  "audit-log": { steps: AUDIT_LOG_STEPS, followUps: AUDIT_LOG_FOLLOW_UPS },
  performance: { steps: PERFORMANCE_STEPS, followUps: PERFORMANCE_FOLLOW_UPS },
};

/** The route Kase defaults to when it has no dedicated script for a page. */
const DEFAULT_COPILOT_PAGE: CopilotPage = "workspace";

/** Map a pathname to its Copilot page key (workspace is the default). */
export function getCopilotPage(pathname: string | null | undefined): CopilotPage {
  if (!pathname) return DEFAULT_COPILOT_PAGE;
  if (pathname.startsWith("/audit-log")) return "audit-log";
  if (pathname.startsWith("/performance")) return "performance";
  return DEFAULT_COPILOT_PAGE;
}

/** Resolve the conversation for a page key. */
export function getCopilotScript(page: CopilotPage): CopilotScript {
  return COPILOT_SCRIPTS[page] ?? COPILOT_SCRIPTS[DEFAULT_COPILOT_PAGE];
}
