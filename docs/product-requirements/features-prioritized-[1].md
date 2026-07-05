# Feature Prioritization

## AI Operations Co-Pilot — BCG X | Experience Design, Spring 2026

---

| Field                     | Value                                                                      |
| ------------------------- | -------------------------------------------------------------------------- |
| **Version**               | 1.0                                                                        |
| **Status**                | Locked — Session 13 (revised)                                              |
| **Total features scored** | 71 (62 features + 3 design patterns + 6 merged features counted once each) |
| **Source**                | `raw-features.md` · `MEMORY.md` Session 13                                 |
| **FigJam board**          | `e8Ftulvja3fluWOLqsRKpL`, "Feature Prioritization" page, section `88:3128` |

---

## Scoring Criteria

Features were ranked on a 2×2 impact–feasibility matrix against five criteria in priority order, plus two sprint-specific levers:

**Project criteria (in priority order):**

1. **Completeness** — Does this feature solve a defined operational problem from the brief?
2. **Trust** — Does it enable fast, confident, trustworthy human decision-making?
3. **Experience** — Does it communicate AI reasoning through exceptional UX?
4. **Innovation** — Does it introduce meaningfully differentiated product patterns?
5. **Feasibility** — Is it technically buildable and operationally realistic?

**Sprint-specific levers:**

- **Journey completeness** — Is the feature load-bearing for at least one end-to-end journey? Can the journey deliver value without it?
- **1-week sprint time** — Can it be fully designed and implemented in one ambitious sprint with mock data and deterministic AI placeholders? (No data engineering included.)

**Axis definitions:**

- **Impact (vertical):** Higher = more critical to brief satisfaction, user trust, or journey completion.
- **Feasibility (horizontal):** Higher = buildable within MVP integrations, standard UI components, and the 1-week sprint constraint using mock data.

**Color coding on the board:**

- 🔵 Blue = Flow 4.1 (Core triage)
- 🟡 Amber = Flow 4.2 (Correction)
- 🔴 Coral = Flow 4.3 (Escalation)
- 🟢 Green = Flow 4.4 (Delegation)
- 🟣 Lavender = Design Patterns

---

## ✅ Yes! Quick Wins — High Impact + High Feasibility

**Sprint 1 build set. 31 items: 28 features + 3 design patterns.**
Every item here is load-bearing for at least one end-to-end journey and fully designable + implementable within one ambitious week using mock data.

### Design Patterns (must be resolved before any wireframing begins)

| ID   | Feature                     | Flow(s)          | Why it's here                                                                                                                                                                                   |
| ---- | --------------------------- | ---------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| P-02 | Data transparency language  | 4.1c, 4.1b, 4.1d | Shared visual vocabulary for source badges, freshness indicators, epistemic labels. Zero engineering cost — pure design system work. Without it, F-03, F-10, F-17, F-18 will look inconsistent. |
| P-01 | Live state change pattern   | 4.1b, 4.1c       | Defines how feed-level vs. detail-level updates are surfaced. Governs F-02 and F-17 interaction. No implementation cost.                                                                        |
| P-03 | ZOM override acknowledgment | 4.2a, 4.2b, 4.1d | Passive, honest, no-dismiss acknowledgment when ZOM overrides AI. Governs F-22, F-29, F-34 copy and behavior. No implementation cost.                                                           |

### Journey 4.1 — Core Triage (9 features)

| ID   | Feature                               | Flow(s) | Why it's here                                                                                                                                                                                               |
| ---- | ------------------------------------- | ------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| F-10 | Confirmed / Inferred / Unknown labels | 4.1c    | Hard FR-13 requirement. The brief's core ask: "how does the manager understand why the AI flagged something." Pure label system — zero engineering beyond state flags. Highest impact, highest feasibility. |
| F-03 | Data source health banner             | 4.1b    | FR-SYS-03. Single status rail per source system. ZOM must always know when the feed is degraded. Reads from existing connection health state.                                                               |
| F-22 | Structured override reason capture    | 4.1d    | FR-24. Hard requirement. Dropdown + optional note on dismiss. Captures the pattern of ZOM overrides as a high-quality model learning signal. Brief ask: "how does the manager override."                    |
| F-01 | Shift-start situation brief           | 4.1b    | 2–3 sentence AI-generated brief above the feed. Mock-trivial to implement. Reduces time-to-first-action at shift open.                                                                                      |
| F-06 | Quick-filter rail by type             | 4.1b    | Pill rail filtering by exception type. Pure UI filter on existing exception type field. Reduces cognitive load in dense feeds.                                                                              |
| F-02 | Live score change indicator           | 4.1b    | Card pulse + micro-label when priority score updates. Passive, non-intrusive. Governs trust that the feed is live. Governed by P-01.                                                                        |
| F-15 | Customer commitment summary card      | 4.1c    | Always-visible SLA/commitment context in detail view. Static mock data. Single most consequential context for action tier decisions.                                                                        |
| F-28 | Inline priority correction ↑↓         | 4.2a    | Brief requirement: "what happens when the AI gets prioritization wrong." Single-tap flow, reason dropdown. Resolves OQ-10 (FR-32 bidirectional).                                                            |
| F-29 | Honest acknowledgment (case scope)    | 4.2a    | D-10 and FR-33. Zero engineering — pure UX copy. Acknowledges correction at case level without over-promising model updates. Governed by P-03.                                                              |

### Journey 4.2 — Correction (3 features)

| ID   | Feature                           | Flow(s) | Why it's here                                                                                                                                                    |
| ---- | --------------------------------- | ------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| F-32 | Search-first manual entry         | 4.2b    | Resolves OQ-09. ZOM searches by shipment/carrier ID before entering data — links to existing source record rather than re-keying. Simple ID lookup.              |
| F-33 | Duplicate detection before commit | 4.2b    | Single query on exception model before manual entry commits. Prevents feed pollution. Completable in under 2 seconds.                                            |
| F-34 | Manually-added exception badge    | 4.2b    | UI state flag on manually-added exceptions. Epistemic honesty in the feed — ZOM always knows what the AI detected vs. what was human-reported. Governed by P-03. |

### Journey 4.3 — Escalation (13 features)

| ID   | Feature                            | Flow(s) | Why it's here                                                                                                                                                   |
| ---- | ---------------------------------- | ------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| F-38 | Classification + routing preview   | 4.3a    | FR-CUST-01/04. Classification card shows sub-type + routing consequence together. ZOM sees where the exception is going before tapping.                         |
| F-39 | One-step reclassification          | 4.3a    | FR-CUST-03. Three sub-type options with routing consequence. Single-step, completable in one tap.                                                               |
| F-40 | Low-confidence threshold warning   | 4.3a    | Extra tap required when AI confidence is below threshold on customs hold classification. Proportionate friction on the highest-risk misclassification scenario. |
| F-41 | Doc checklist for Doc Gap holds    | 4.3a    | Turns a raw customs hold description into a structured, actionable checklist. Directly reduces ZOM time-to-resolve. Sourced from BorderIQ reason codes.         |
| F-42 | AI-assembled outbound brief [M]    | 4.3b    | FR-25. Pre-assembles escalation and delegation briefs in labeled sections. Mock content, one shared component. Brief ask: "what does the AI do next."           |
| F-43 | Threshold trigger explanation      | 4.3b    | FR-TIER-08. One-line copy explaining which threshold was crossed and who will receive the escalation. Prevents ZOM from guessing why they can't proceed.        |
| F-45 | Escalation receipt confirmation    | 4.3b    | Push notification + card state transition to "Escalated — awaiting approval." Without it, ZOM has no confirmation and will follow up manually.                  |
| F-49 | Single-screen decision surface     | 4.3c    | Brief requirement: approver decides from a single screen without opening any source system. Core approver persona delivery.                                     |
| F-50 | Rationale required (Modify/Reject) | 4.3c    | Structured rationale field for non-approvals. Ensures ZOM receives actionable context with any rejection.                                                       |
| F-51 | Legal Authority facts-only view    | 4.3c    | FR-CUST-05/06. T4 Legal-Sanctions escalations show confirmed facts only — no AI action recommendation. Minimal interface. Hard governance requirement.          |
| F-54 | Decision notification w/ rationale | 4.3c    | FR-26. Push notification to ZOM with verdict + rationale. Without it, ZOM must poll for approver decisions.                                                     |
| F-55 | Decision audit record              | 4.3c    | FR-40, NFR-24. Immutable attributed record at the moment of decision. EU AI Act traceability requirement.                                                       |
| F-58 | Rejected action — alt path surface | 4.3d    | Surfaces 1–2 T1/T2 alternatives when Director rejects an escalation. Prevents ZOM from being stranded with no path forward after a rejection.                   |

### Journey 4.4 — Delegation (5 features)

| ID   | Feature                              | Flow(s) | Why it's here                                                                                                                            |
| ---- | ------------------------------------ | ------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| F-59 | Delegation sent + status tracking    | 4.4a    | FR-21. Card transitions to "Delegated — awaiting Dispatcher response." Core brief ask: "what does the AI do when the manager delegates." |
| F-61 | Delegation audit log                 | 4.4a    | FR-40, AC-13. Chain-of-custody record: who delegated, to whom, when, with what package. Hard acceptance criterion.                       |
| F-63 | Structured completion status options | 4.4b    | Four pre-defined reply options for the Dispatcher. Enables automated card state updates without ZOM interpretation. Closes PB-03.        |
| F-66 | Resolution verify before closure     | 4.4c    | Core brief requirement. Exception does not auto-close on Dispatcher "Done." ZOM confirms resolution with system-corroborating signals.   |
| F-67 | Partial resolution — keep open       | 4.4c    | Returns partially-resolved exception to active queue with Dispatcher outcome note appended. Preserves context, prevents false closure.   |

---

## 🔶 Stretch Goals — High Impact + Low Feasibility

**Sprint 2 planning targets. 10 features.**
Genuinely high operational value but require capabilities outside the MVP integration scope: unsupervised ML clustering, P1 connector data, simulation engines, or bi-directional messaging infrastructure.

| ID   | Feature                         | Flow(s) | Feasibility constraint                                                                               | When to pull forward                                                              |
| ---- | ------------------------------- | ------- | ---------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| F-04 | Exception cluster grouping      | 4.1b    | Requires multi-exception root-cause clustering — unsupervised ML pattern not in MVP scope            | When F-02 live scoring data is mature enough to train a clustering model          |
| F-20 | Action outcome simulation       | 4.1d    | Requires a simulation engine running against historical resolution patterns                          | After MVP trust scaffolding is proven (SM-2 ≥ 70% acceptance rate)                |
| F-25 | Batch action across cluster     | 4.1d    | Sequential dependency on F-04 — cannot build without cluster grouping                                | After F-04 ships                                                                  |
| F-11 | Impact projection panel         | 4.1c    | Requires SLA + financial exposure modelling against OrderPulse data (P1 connector)                   | After OrderPulse P1 connector is integrated                                       |
| F-52 | Approver escalation queue       | 4.3c    | Requires a separate Director workspace with a distinct data model and routing surface                | High priority for Sprint 2 — Director persona has no dedicated surface without it |
| F-19 | Warehouse readiness signal      | 4.1c    | Requires Nexus WMS real-time dock + labor APIs at full P1 integration depth                          | After Nexus WMS P1 connector is integrated                                        |
| F-27 | Policy conflict warning         | 4.1d    | Requires policy rules engine + carrier master + lane-spend data not in MVP scope                     | After policy admin UI (V-07) is built                                             |
| F-18 | Conflicting signal alert        | 4.1c    | Requires cross-source signal reconciliation logic at event level                                     | After multi-source event correlation is stable in production                      |
| F-60 | Carrier context pre-loaded      | 4.4a    | Requires FleetCommand TMS carrier master + contact records surfaced via API                          | After FleetCommand TMS integration is deepened                                    |
| F-64 | Blocked → clarification routing | 4.4b    | Requires structured bi-directional messaging protocol between co-pilot and external dispatch channel | After Dispatcher-native interface (V-05) is scoped                                |

---

## 🔔 Bells & Whistles — Low Impact + High Feasibility

**Sprint 2+ polish and enrichment. 28 features.**
These are technically easy but do not complete any journey on their own. The journey delivers value without them. All are strong Sprint-2 candidates once the MVP loop is proven.

### Upper tier — closest to meaningful impact (Sprint 2 priority)

| ID   | Feature                               | Flow(s)    | Note                                                                                                         |
| ---- | ------------------------------------- | ---------- | ------------------------------------------------------------------------------------------------------------ |
| F-17 | Re-evaluation trigger on new event    | 4.1c       | Banner when AI summary updates mid-read. Sprint-2 live-update sophistication.                                |
| F-07 | In-progress status on feed card       | 4.1b       | Compact status chip on feed card. Polish layer on a working loop.                                            |
| F-53 | Request more info — reply path        | 4.3c       | Fourth decision option for approvers. Resolves OQ-13. Single-recurrence limit.                               |
| F-46 | No-response recovery [M]              | 4.3b, 4.4c | Timer + recovery options when escalation or delegation gets no response. Requires timing infrastructure.     |
| F-56 | Decision notif. — outcome + next step | 4.3d       | Expanded notification with single-tap action button. F-54 covers the baseline; this is the enriched version. |
| F-24 | Action confirm + undo window          | 4.1d       | Countdown-timer undo window after T1/T2 action. Reversibility is a backend concern; not week-1 UI-blocking.  |
| F-47 | Escalation history (prior decisions)  | 4.3b       | Prior escalations on same carrier/lane shown before submitting. Enrichment on a working escalation flow.     |

### Mid tier — solid quality-of-life improvements

| ID   | Feature                             | Flow(s)    | Note                                                                                                 |
| ---- | ----------------------------------- | ---------- | ---------------------------------------------------------------------------------------------------- |
| F-44 | Structured context prompts [M]      | 4.3b, 4.4a | Prompt fields in brief assembly. Polish on F-42.                                                     |
| F-16 | Live ETA delta visualizer           | 4.1c       | Two-bar ETA comparison. AI summary already contains ETA; this is a visualizer polish layer.          |
| F-48 | Preview as approver toggle          | 4.3b       | Recipient-view toggle before submitting escalation. Same component as F-23; Sprint-2.                |
| F-21 | Draft customer comms preview        | 4.1d       | AI-drafted customer notification preview before action. Action executes without it.                  |
| F-05 | Snooze + auto-escalation timer      | 4.1b       | Structured snooze with auto-resurface on severity breach. Convenience; journey completes without it. |
| F-57 | Action chain summary on closure [M] | 4.3d, 4.4c | Attributed timestamped chain at closure. Audit completeness feature; Sprint-2.                       |
| F-13 | Exception timeline strip            | 4.1c       | Lifecycle event timeline in detail view. Detail-on-detail; AI summary covers the essential.          |
| F-23 | Preview as recipient [M]            | 4.1d, 4.3b | "Edit / Recipient view" toggle before handoff. Sprint-2 — quality gate, not a blocker.               |
| F-14 | Carrier history scorecard           | 4.1c       | On-time rate popover for the involved carrier. Nice-to-have context; not journey-blocking.           |

### Lower tier — pure delight and analytics (Sprint 3+)

| ID   | Feature                             | Flow(s) | Note                                                                                                    |
| ---- | ----------------------------------- | ------- | ------------------------------------------------------------------------------------------------------- |
| F-08 | Route ribbon in map view            | 4.1b    | Route segment highlighted by severity on map. Contingent on OQ-08 geocoordinate validation.             |
| F-12 | ZOM annotation layer                | 4.1c    | Persistent note field per exception. Decorative on J4.1; no journey breaks without it.                  |
| F-30 | Apply correction to similar         | 4.2a    | Batch-apply a priority correction to similar exceptions. Enrichment on the correction flow.             |
| F-09 | ZOM-pinned watchlist strip          | 4.1b    | Pinned exceptions above the ranked feed. Personal productivity; doesn't change resolution speed.        |
| F-26 | Suggested next exception            | 4.1d    | "Next: [exception]" prompt after action confirmation. Efficiency nudge; not decision-quality impacting. |
| F-36 | AI watch request                    | 4.2b    | Ask AI to actively monitor a manually-added exception. Useful trust-building feature; Sprint-2/3.       |
| F-62 | Recall delegation                   | 4.4a    | Cancel a pending delegation before Dispatcher acknowledges. Edge-case escape hatch.                     |
| F-35 | Miss source capture dropdown        | 4.2b    | "Where did you hear about this?" on manual entry. Signal value; J4.2 completes without it.              |
| F-65 | Package format per channel          | 4.4b    | Channel-specific formatting for delegation handoff. Content matters more than format at MVP.            |
| F-37 | Auto-resolve when source catches up | 4.2b    | AI detects system confirmation of a manually-added exception. Useful; depends on F-36.                  |
| F-68 | Dispatcher outcome note on record   | 4.4c    | Dispatcher's "Done" narrative preserved on closed record. Institutional memory; Sprint-2/3.             |
| F-31 | Recurring error alert to Admin      | 4.2a    | Pattern alert when correction reason codes accumulate. V-08 Admin dashboard territory.                  |

---

## 🚫 No. Deprioritize

**0 features.**

Nothing in the 71-feature set scored low enough on both dimensions to land here. The raw-features set was produced through a disciplined ideation loop grounded in explicit FR requirements, resolved open questions, and proposed behaviors from the user flows document. Features without a clear user need or PRD anchor were filtered out before this session. Under the mock-data constraint, the 1-week sprint test removes the data engineering risk that would otherwise push the lowest-feasibility features into this quadrant — they instead land in Stretch Goals, where they belong.

---

## Summary Table

| Quadrant            | Count                             | Sprint target |
| ------------------- | --------------------------------- | ------------- |
| ✅ Yes! Quick Wins  | **31** (28 features + 3 patterns) | Sprint 1      |
| 🔶 Stretch Goals    | **10**                            | Sprint 2      |
| 🔔 Bells & Whistles | **28**                            | Sprint 2–3    |
| 🚫 No. Deprioritize | **0**                             | —             |
| **Total**           | **71**                            |               |

---

_End of features-prioritized.md — v1.0, Session 13 (revised)_
