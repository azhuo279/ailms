import type { ChatTurn } from "./types";

/**
 * Canned Copilot conversation (logistics exception domain). No message backend
 * is wired, so the exchange is played back DETERMINISTICALLY as a real
 * back-and-forth. **The conversation advances one step per user send** — a
 * suggested prompt (or free text) sends a user turn, a brief thinking indicator
 * shows, then Kase replies with ONE focused turn (a single message or widget).
 * The suggested prompts shown at each step ARE the script driver, so the
 * available asks change to reflect the natural next thing to say.
 *
 * Confirming a choice or committing an action still appends the matching entry
 * from `FOLLOW_UP_TURNS`, so the recovery choice and reassignment CTA keep
 * working inline.
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

/**
 * Ordered scripted exchange. Each user send plays the NEXT step's `reply`
 * (guarded past the end by the hook). Decomposed from the old single dumped
 * turn into single-focus replies so the thread reads as a real conversation
 * covering the same content spread across natural turns.
 */
export const CONVERSATION_STEPS: ConversationStep[] = [
  // Step 1 — the exception, in plain words.
  {
    suggestions: [
      "What needs my attention right now?",
      "Any shipments at risk of a breach?",
    ],
    reply: {
      id: "step-breach",
      role: "assistant",
      blocks: [
        {
          kind: "text",
          content:
            "Shipment SH-4471 on the Dallas to Denver lane is tracking behind schedule. It is inside the 4-hour SLA breach window.",
        },
      ],
    },
  },
  // Step 2 — the downstream projection widget.
  {
    suggestions: ["What happens if we leave it?", "Who is affected?"],
    reply: {
      id: "step-projection",
      role: "assistant",
      blocks: [
        {
          kind: "text",
          content: "Here is the downstream impact if it goes unresolved.",
        },
        {
          kind: "receipt",
          variant: "projection",
          headline: (
            <>
              If not resolved within the <strong>4-hour breach window</strong>,{" "}
              <strong>3 orders</strong> tied to{" "}
              <strong>2 Gold-tier customers</strong> are projected to miss SLA.
            </>
          ),
          confidenceLabel: "Medium confidence · 68%",
          riskCountLabel: "3 orders at risk",
          evidence: [
            {
              id: "ev-1",
              content: (
                <>
                  Current transit speed is <strong>18% below</strong> lane
                  average for this corridor.
                </>
              ),
            },
            {
              id: "ev-2",
              content: (
                <>
                  Two orders belong to <strong>Northwind Retail</strong>, a
                  Gold-tier account with a tight receiving window.
                </>
              ),
            },
            {
              id: "ev-3",
              content: (
                <>
                  The assigned carrier has <strong>no recovery slack</strong> on
                  its next two legs.
                </>
              ),
            },
          ],
          citations: ["TMS", "Order Management"],
        },
      ],
    },
  },
  // Step 3 — the trend chart.
  {
    suggestions: ["Show me the delay trend", "How bad is the slip?"],
    reply: {
      id: "step-viz",
      role: "assistant",
      blocks: [
        {
          kind: "text",
          content: "The slip has been building all week. Friday is the worst day.",
        },
        {
          kind: "viz",
          title: "Hours late by day this week",
          description: "SH-4471 lane, rolling delay against plan.",
          chartType: "bar",
          xKey: "day",
          series: [{ key: "hoursLate", label: "Hours late" }],
          data: [
            { day: "Mon", hoursLate: 0.5 },
            { day: "Tue", hoursLate: 1.2 },
            { day: "Wed", hoursLate: 0.9 },
            { day: "Thu", hoursLate: 2.1 },
            { day: "Fri", hoursLate: 3.4 },
          ],
        },
      ],
    },
  },
  // Step 4 — the recovery choice (confirm appends "recovery-chosen").
  {
    suggestions: ["What are my options?", "How do we recover this?"],
    reply: {
      id: "step-recovery",
      role: "assistant",
      blocks: [
        {
          kind: "choices",
          id: "choice-recovery",
          prompt: <>How should I recover this shipment?</>,
          control: "radio",
          options: [
            { label: "Reassign to a backup carrier", value: "reassign" },
            { label: "Expedite with the current carrier", value: "expedite" },
            { label: "Notify customers and hold", value: "notify" },
          ],
          confirmLabel: "Confirm approach",
          confirmToTurnId: "recovery-chosen",
        },
      ],
    },
  },
  // Step 5 — the reassignment read (stat).
  {
    suggestions: ["What does reassigning look like?", "Can a backup pick it up?"],
    reply: {
      id: "step-stat",
      role: "assistant",
      blocks: [
        {
          kind: "text",
          content:
            "A backup carrier can pick up at the Amarillo cross-dock in 90 minutes. Here is the arrival read.",
        },
        {
          kind: "receipt",
          variant: "stat",
          label: "Predicted arrival vs plan",
          value: "—",
          provenanceTone: "ai",
          provenanceLabel: "AI estimate",
          provenanceBasis: "Based on lane history and current transit speed.",
          comparisonBar: {
            plannedLabel: "14:10",
            predictedLabel: "14:50",
            plannedPercent: 40,
            predictedPercent: 62,
            state: "unfavorable",
            phraseLead: "Predicted late by 40 min",
            phraseDetail: "±25 min",
            asOf: "as of 14:32",
          },
        },
      ],
    },
  },
  // Step 6 — the action CTA (commit appends "reassign-committed").
  {
    suggestions: ["Reassign it", "Let's go ahead"],
    reply: {
      id: "step-action",
      role: "assistant",
      blocks: [
        {
          kind: "action",
          text: (
            <>
              Reassigning now keeps both Gold-tier orders inside their receiving
              window.
            </>
          ),
          ctaLabel: "Reassign to backup carrier",
          ctaVariant: "primary",
          commitToTurnId: "reassign-committed",
        },
      ],
    },
  },
  // Step 7 — the follow-up scope check (multi-select tags).
  {
    suggestions: ["Any other shipments at risk?", "Check the rest of the lane"],
    reply: {
      id: "step-scope",
      role: "assistant",
      blocks: [
        {
          kind: "text",
          content:
            "Two more shipments on the same corridor share this carrier. Want me to check them for the same risk?",
        },
        {
          kind: "choices",
          id: "choice-scope",
          prompt: <>Which shipments should I review?</>,
          control: "tags",
          multiple: true,
          options: [
            { label: "SH-4472", value: "sh-4472" },
            { label: "SH-4480", value: "sh-4480" },
            { label: "SH-4491", value: "sh-4491" },
          ],
          confirmLabel: "Review selected",
          confirmToTurnId: "scope-reviewed",
        },
      ],
    },
  },
];

/**
 * Follow-up turns keyed by a choice's `confirmToTurnId` or an action's
 * `commitToTurnId`. Confirming/committing clones the matching entry with a fresh
 * id and appends it, so the thread continues.
 */
export const FOLLOW_UP_TURNS: Record<string, ChatTurn> = {
  "recovery-chosen": {
    id: "recovery-chosen",
    role: "assistant",
    blocks: [
      {
        kind: "text",
        content:
          "Good call. Ask me what reassigning looks like and I will pull the arrival read.",
      },
    ],
  },
  "reassign-committed": {
    id: "reassign-committed",
    role: "assistant",
    blocks: [
      {
        kind: "text",
        content:
          "Done. SH-4471 is reassigned and both Gold-tier customers were notified of the updated ETA.",
      },
      {
        kind: "receipt",
        variant: "stat",
        label: "Orders back inside SLA",
        value: "3 of 3",
        hint: "Recovered against the 4-hour breach window.",
        provenanceTone: "confirmed",
        provenanceLabel: "Confirmed",
        provenanceBasis: "TMS reassignment event 14:33 CT.",
      },
    ],
  },
  "scope-reviewed": {
    id: "scope-reviewed",
    role: "assistant",
    blocks: [
      {
        kind: "text",
        content:
          "Reviewed. Only SH-4480 shows the same delay pattern. The others are tracking on plan.",
      },
      {
        kind: "action",
        text: <>Want me to apply the same recovery to SH-4480?</>,
        ctaLabel: "Recover SH-4480",
        ctaVariant: "primary",
        commitToTurnId: "reassign-committed",
      },
    ],
  },
};
