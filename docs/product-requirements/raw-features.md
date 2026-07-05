# Raw Features

## AI Operations Co-Pilot — BCG X | Experience Design, Spring 2026

**Version:** 1.0  
**Status:** Post-ideation, post-merge  
**Source:** Feature ideation loop across all 13 user flows (Sessions 12–12 final)  
**Feature count:** 62 (reduced from 70 via 5 cross-cutting merges)  
**Companion documents:** `prd-v1.4.md` · `user-flows-v1-[3].md` · `MEMORY.md`

> Merged features are marked **[MERGED]** with a note on which original features were consolidated. Features that form designed pairs are marked **[PAIR]** with their counterpart. Features that are part of a unified design pattern are marked **[PATTERN]** with the pattern name.

---

## Flow 4.1b — Triage exception feed (list + geospatial)

---

### F-01 · Shift-start situation brief

**Description:** On session start, the co-pilot displays a 2–3 sentence AI-generated brief above the exception feed showing: total open exceptions, how many are new since the ZOM's last session, and the single highest-risk item with a one-line reason. The ZOM can dismiss the brief or tap to jump directly to the top exception. The brief is labeled as AI-generated throughout.  
**Applicable flows:** 4.1b · _Cross-cutting extension to 4.2b (miss pattern note)_

---

### F-02 · Live score change indicator

**Description:** When an exception's AI priority score changes significantly while the feed is active, its card shows a subtle animated pulse and a "↑ Score updated" micro-label with the reason for the change. The card re-sorts dynamically in the queue. The signal is passive and non-disruptive — the ZOM is not required to interact with it.  
**Applicable flows:** 4.1b  
**[PATTERN]** Live state change — see also F-17.

---

### F-03 · Data source health banner

**Description:** A persistent status rail above the exception feed shows a dot per connected source system (FleetCommand TMS, Nexus WMS, SignalTrack, BorderIQ, OrderPulse, OpsDesk). A degraded or disconnected feed turns its dot amber or red with a tooltip explaining the gap and how long the system has been affected. The ZOM never needs to open a settings panel to know the feed is incomplete.  
**Applicable flows:** 4.1b  
**[PATTERN]** Data transparency language — see also F-10, F-17, F-18.

---

### F-04 · Exception cluster grouping

**Description:** When the AI detects that multiple exceptions share a probable root cause (e.g. the same carrier underperforming across three routes), they are visually grouped in the feed under a parent cluster card. The cluster card shows the shared root cause, combined impact, and a count of affected exceptions. Tapping the cluster card expands it to reveal individual exceptions within the group.  
**Applicable flows:** 4.1b  
**[PAIR]** with F-25 (Batch action across clustered exceptions).

---

### F-05 · Snooze with auto-escalation timer

**Description:** The ZOM can snooze a lower-priority exception for a set duration (15m, 30m, 1h, or custom). When snoozed, the card moves to the bottom of the feed. If the exception's severity score crosses a configurable threshold before the snooze expires, it auto-resurfaces immediately with a "Returned early — severity escalated" label. The AI can override the snooze upward (resurface earlier) but never downward (extend the snooze). This is structured intent-to-revisit, not dismissal.  
**Applicable flows:** 4.1b

---

### F-06 · Quick-filter rail by exception type

**Description:** A horizontal pill-rail sits above the feed showing exception type counts: "Carrier (4)", "Customs (2)", "Dock (7)", "SLA (3)". Tapping any pill filters the feed to that type instantly — no dropdown, no modal. Tapping the same pill again clears the filter. Multiple pills can be active simultaneously. The AI's overall ranking is preserved within the filtered set.  
**Applicable flows:** 4.1b

---

### F-07 · In-progress action status on feed card

**Description:** Exceptions with an action already taken — delegated, escalated, or awaiting carrier response — display a compact status chip directly on the feed card: "Delegated to J. Torres", "Awaiting Director approval", "Carrier notified 14m ago". The ZOM sees the current state without opening the card, preventing re-triage of exceptions already in motion.  
**Applicable flows:** 4.1b

---

### F-08 · Route ribbon in map view

**Description:** In geospatial view, tapping a route-based exception pin renders a simplified route ribbon between origin and destination, colored by severity. Sections of the route with active issues — tracking gap, ETA deviation, customs hold — are highlighted in a distinct color. The ZOM sees not just where the shipment is but which segment of its journey is in trouble. Requires geocoordinate availability from SignalTrack and FleetCommand TMS (contingent on OQ-08 validation).  
**Applicable flows:** 4.1b

---

### F-09 · ZOM-pinned watchlist strip

**Description:** The ZOM can pin up to five exceptions to a persistent watchlist strip above the main feed, independent of AI ranking. Pinned exceptions remain visible and update live even if they drift down the ranked list. Pinning and unpinning are one-tap actions from any feed card. Pinned items are visually distinguished from AI-ranked items to maintain clarity about which ordering is human-driven vs. AI-driven.  
**Applicable flows:** 4.1b

---

## Flow 4.1c — Review exception detail, evaluate AI interpretation

---

### F-10 · Confirmed / Inferred / Unknown epistemic labels

**Description:** Every data point and claim in the exception detail view carries a persistent three-state label: Confirmed (verified event from a source system), Inferred (AI interpretation of available signals), or Unknown (data gap affecting confidence). Labels use icon + text, never color alone. The ZOM reads the summary and immediately sees which sentences are fact and which are AI reasoning.  
**Applicable flows:** 4.1c  
**[PATTERN]** Data transparency language — see also F-03, F-17, F-18.

---

### F-11 · Impact projection panel

**Description:** Below the AI summary, a compact panel shows predicted downstream impact if the exception is not resolved within the breach window: which orders, customers, or SLAs are at risk, with customer tier, SLA deadline, and estimated financial exposure per item. All content is labeled as AI projection — not presented as confirmed outcomes. Labeled with confidence level.  
**Applicable flows:** 4.1c

---

### F-12 · ZOM annotation layer

**Description:** The ZOM can add a short note directly on the exception detail — e.g. "Spoke to carrier at 09:12, ETA confirmed delayed by 2h" — which persists through the exception lifecycle and is visible to any ZOM who subsequently opens the same exception or receives it via delegation. Notes are timestamped, attributed by name, and stored in the audit trail. A single rolling annotation field per exception, not a chat thread.  
**Applicable flows:** 4.1c · 4.4c

---

### F-13 · Exception timeline strip

**Description:** A separate tab in the exception detail view presents a vertical timeline of key events in the exception's lifecycle: when it was first detected, which source system triggered it, what actions have been taken, and what is still pending. Events are dot-stamped with source badge and timestamp. On the main tab, a condensed "last event" summary is shown inline.  
**Applicable flows:** 4.1c

---

### F-14 · Carrier history scorecard

**Description:** For exceptions involving a specific carrier, the detail view surfaces a one-click popover scorecard: on-time rate on this lane (last 30 days), number of prior exceptions, average resolution time, and a trend arrow. Expanding the popover shows a 90-day sparkline. Data sourced from historical source system records. Read-only; the ZOM uses it to contextualize the AI's interpretation before deciding how to respond.  
**Applicable flows:** 4.1c

---

### F-15 · Customer commitment summary card

**Description:** For exceptions linked to a customer order, the detail view shows a permanently visible, read-only card: promised delivery date, SLA tier, customer priority tier (from OrderPulse), and whether a delivery date change has already been communicated. Always visible without a tap because the customer commitment is the single most consequential piece of context for evaluating response urgency and determining the appropriate action tier.  
**Applicable flows:** 4.1c

---

### F-16 · Live ETA delta visualizer

**Description:** For in-transit exceptions, the detail view shows a compact two-bar comparison — planned ETA vs. current AI-predicted ETA — as a visual delta rather than two separate timestamps. The gap between them makes delay magnitude spatial and immediately legible without arithmetic. Both bars update live as SignalTrack events arrive. The predicted ETA carries its confidence band inline (e.g. "±40 min").  
**Applicable flows:** 4.1c

---

### F-17 · Re-evaluation trigger on new event arrival

**Description:** If a new source event arrives for the exception while the ZOM is actively reading the detail view, a non-intrusive banner appears at the top: "New event from SignalTrack — AI summary updated. Tap to refresh." The AI summary does not silently change beneath the ZOM mid-read. The banner persists until dismissed or refreshed. When the ZOM taps refresh, the updated summary is shown as a diff against the previous version — changed sentences highlighted, new information marked "Added", removed information marked "Removed". The diff collapses after 60 seconds.  
**Applicable flows:** 4.1c  
**[PATTERN]** Live state change — see also F-02. **[PATTERN]** Data transparency language.

---

### F-18 · Conflicting signal alert

**Description:** When two or more source systems report contradictory data about the same shipment — e.g. FleetCommand TMS shows ETA on track while SignalTrack GPS places the vehicle two hours behind schedule — the AI surfaces a "Conflicting signals" badge in the detail header rather than silently arbitrating between them. The badge expands to show both readings side by side with source attribution, and names which reading the AI summary used and why.  
**Applicable flows:** 4.1c  
**[PATTERN]** Data transparency language — see also F-03, F-10, F-17.

---

### F-19 · Warehouse readiness signal

**Description:** For inbound shipment exceptions, the detail view pulls a live readiness indicator from Nexus WMS: is the receiving dock scheduled and available for this shipment's revised ETA? Is labor allocated? Is the ASN matched? Displayed as a compact three-row checklist — green/amber/red per item — sourced live from Nexus. Read-only in the detail view; actionable from the action surface in Flow 4.1d.  
**Applicable flows:** 4.1c

---

## Flow 4.1d — Decide and act on exception

---

### F-20 · Action outcome simulation

**Description:** Before confirming a high-consequence action, the ZOM can tap "Simulate" to see the AI's projected outcome: predicted new ETA, estimated cost, likelihood of SLA recovery, and what downstream exceptions this action might create or resolve. The simulation runs in under 3 seconds, is labeled as an AI projection with a confidence level, and allows side-by-side comparison of two action options before committing.  
**Applicable flows:** 4.1d

---

### F-21 · Draft customer communication preview

**Description:** For actions that trigger a customer notification, the action card shows a collapsible preview of the AI-drafted message before the ZOM approves. The ZOM can edit it inline, approve it as-is, or suppress it entirely. The preview shows the recipient, channel, and exact message text. Edits are attributed to the ZOM in the audit log. The draft never sends without ZOM approval — it is always a preview, never an auto-send.  
**Applicable flows:** 4.1d

---

### F-22 · Structured override reason capture

**Description:** When the ZOM dismisses the AI recommendation and chooses a different action, a lightweight reason dropdown appears inline on the action card with five operationally meaningful options ("Prior carrier arrangement," "Cost constraint," "Customer preference," "System data incorrect," "Policy exception") plus an optional free-text field. Completable in under 30 seconds. Captures the pattern of why ZOMs override as a high-quality model learning signal.  
**Applicable flows:** 4.1d  
**[PATTERN]** ZOM override acknowledgment — see also F-29, F-34.

---

### F-23 · Preview as recipient **[MERGED]**

**Description:** Before sending any outbound handoff — escalation brief to a Director or Legal Authority, or delegation package to a Dispatcher — the ZOM can toggle between "Edit view" and "Recipient view." The recipient view renders the package exactly as the approver or Dispatcher will receive it, stripped of editing scaffolding. The ZOM reviews for completeness and clarity from the recipient's perspective before committing. Toggling back to edit view restores the full editing surface. Resolves OQ-12.  
_Merged from: #23 Tier escalation handoff brief preview (4.1d) · #45 Preview as approver toggle (4.3b) · #64 Package preview — what the Dispatcher will see (4.4a)._  
**Applicable flows:** 4.1d · 4.3b · 4.4a

---

### F-24 · Action execution confirmation with undo window

**Description:** After a T1/T2 action is approved, a brief confirmation state replaces the action card: "Action executed — carrier notified. Undo available for 28 minutes." A live countdown shows the remaining undo window. Tapping "Undo" triggers a reversal flow with a single confirmation step. The confirmation transitions to an in-progress monitoring state after the undo window expires. Implements FR-22's reversibility requirement at the UX layer.  
**Applicable flows:** 4.1d

---

### F-25 · Batch action across clustered exceptions

**Description:** When acting on a cluster exception (from F-04), the action surface offers an "Apply to all in cluster" toggle alongside the single-exception path. The ZOM can approve a single action that applies uniformly to all exceptions sharing the same root cause. An explicit list of affected exceptions is shown before confirmation. Batch actions require the same tier authorization as the highest-tier exception in the cluster.  
**Applicable flows:** 4.1d  
**[PAIR]** with F-04 (Exception cluster grouping).

---

### F-26 · Suggested next exception on action completion

**Description:** After an action is confirmed and the undo window starts, the bottom of the action card shows a compact "Next: [exception name] — [one-line reason]" prompt drawn from the feed's current top-ranked unactioned exception. Tapping navigates directly to that exception's detail view. Dismissing returns to the feed. The ZOM is never forced to use it — it is a frictionless shortcut, not a redirect.  
**Applicable flows:** 4.1d

---

### F-27 · Policy conflict warning before approval

**Description:** If the ZOM's chosen action — including a modified or custom one — would violate a configured org policy (e.g. using a non-approved carrier, exceeding a lane-specific spend cap, bypassing a mandatory document check), a warning badge appears on the action card before confirmation: "Policy conflict: non-preferred carrier selected for this lane." The ZOM can acknowledge and proceed, but the conflict is logged. The system does not block the action — it surfaces the friction deliberately and records that the conflict was surfaced and acknowledged.  
**Applicable flows:** 4.1d

---

## Flow 4.2a — Diagnose and correct a mis-ranked exception

---

### F-28 · Inline priority correction — raise or lower

**Description:** From either the feed card or the detail view, the ZOM can tap "Adjust priority" to raise or lower an exception's AI-assigned rank. Selecting a direction opens a reason-code dropdown (max 5 options per direction) covering real operational error categories for both raise and lower cases. The correction applies immediately and the card re-sorts in the feed in real time. Completable in under 30 seconds without leaving the current view. Resolves OQ-10 — FR-32 should be amended to cover both directions.  
**Applicable flows:** 4.2a

---

### F-29 · Honest acknowledgment — case-level scope

**Description:** After a priority correction is submitted, the system shows a brief passive acknowledgment — no modal, no dismiss button — stating exactly what changed and at what scope: "Priority updated for this exception. Your feedback is noted and will inform future scoring for similar exceptions on this carrier and lane." The acknowledgment is honest about scope (case-level context retained; global model does not update in real time), disappears after 5 seconds, and honors D-10 and FR-33. Resolves OQ-11.  
**Applicable flows:** 4.2a  
**[PATTERN]** ZOM override acknowledgment — see also F-22, F-34.

---

### F-30 · Similar exceptions — apply correction across

**Description:** After submitting a priority correction, the acknowledgment optionally surfaces: "2 similar exceptions on this carrier are currently ranked using the same scoring logic — apply this correction to those too?" The ZOM can accept or skip. Accepting applies the same reason code and directional correction to the listed exceptions. The ZOM sees exactly which exceptions will be affected before confirming. Compounds a single correction into a broader signal when the AI error is systemic.  
**Applicable flows:** 4.2a

---

### F-31 · Recurring error pattern alert to Admin

**Description:** When corrections with the same reason code accumulate above a configurable threshold (e.g. five "Data feed stale" corrections on SignalTrack exceptions within 24 hours), the system automatically surfaces a pattern alert in the Admin/Director view: "Recurring correction pattern detected — SignalTrack data quality may be degraded." ZOMs are not shown this alert; it routes to the person who can act on a systemic source-system issue. Feeds the V-08 AI Performance and Adoption Dashboard extension.  
**Applicable flows:** 4.2a · _Admin/Director view (V-08)_

---

## Flow 4.2b — Diagnose and surface a missed exception

---

### F-32 · Search-first manual entry — link, don't re-key

**Description:** The "Add exception manually" flow opens with a search field: the ZOM types a shipment ID, carrier name, warehouse ID, or order number. If a matching source record exists in any connected system, results surface immediately and the ZOM links to it rather than re-entering data from scratch. Only if no record is found does the flow offer a blank-form entry path. The linked record becomes the exception's canonical data anchor. Resolves OQ-09.  
**Applicable flows:** 4.2b

---

### F-33 · Duplicate detection before entry commits

**Description:** Before a manual exception is committed to the feed, the system checks whether an existing exception already covers the same shipment, carrier, or entity. If a probable duplicate is found, the ZOM sees a side-by-side preview: "A similar exception for this shipment is already in your feed — is this the same issue?" with options to merge, proceed as separate, or cancel. The check runs silently and completes in under 2 seconds.  
**Applicable flows:** 4.2b

---

### F-34 · Manually-added exception badge and audit trail

**Description:** Any exception added manually carries a persistent "Manually added" badge on its feed card — distinguishable from AI-detected exceptions at a glance. The badge tooltip shows: added by whom, when, and which source system the exception is linked to (or "No source record"). The badge is visible to all ZOMs and appears in the audit log with the same attribution fields as AI-generated exceptions, maintaining epistemic honesty in the feed.  
**Applicable flows:** 4.2b  
**[PATTERN]** ZOM override acknowledgment — see also F-22, F-29.

---

### F-35 · Miss source capture — where did you hear this?

**Description:** During manual entry, a single required dropdown field captures how the ZOM became aware of the issue: "Phone call from carrier," "Email from customer," "Direct observation at dock," "Colleague told me," "Other system not connected." The selected source is stored on the exception record and feeds the AI miss analysis log — telling the system not just that it missed something, but which channel is generating undetected exceptions. Enables integration gap diagnosis rather than just model retraining.  
**Applicable flows:** 4.2b

---

### F-36 · AI watch request — monitor this shipment

**Description:** After adding a manual exception, the ZOM can tap "Ask AI to watch this" to instruct the system to begin active monitoring of the linked shipment or entity for new source events. If the AI subsequently detects a confirming event, it surfaces it as a corroborating signal on the manually-added exception card, upgrading its evidence basis from "ZOM-reported" to "ZOM-reported + system-confirmed." The watch request is logged and the watch status is visible on the exception card.  
**Applicable flows:** 4.2b  
**[PAIR]** with F-37 (Auto-resolve when source system catches up).

---

### F-37 · Auto-resolve when source system catches up

**Description:** If a manually-added exception is linked to a source record and the AI subsequently detects a resolution event from a connected system — a milestone confirmed, an ASN received, a customs hold lifted — the exception card surfaces a "System now tracking — possible resolution detected" notification. The ZOM can confirm closure or keep the exception open. Auto-resolution never triggers without ZOM confirmation. Prevents manually-added exceptions from becoming permanent orphans in the feed.  
**Applicable flows:** 4.2b  
**[PAIR]** with F-36 (AI watch request).

---

## Flow 4.3a — Classify and route a customs hold exception

---

### F-38 · Classification card with routing consequence preview

**Description:** The customs hold exception card displays the AI's sub-type classification (Documentation Gap / Regulatory / Legal-Sanctions) with its confidence level and a one-sentence routing consequence: "Documentation Gap → you handle this" / "Regulatory → routes to Director" / "Legal-Sanctions → routes to Legal Authority, no AI action shown." The ZOM sees where this exception is going before tapping anything — classification and routing consequence are visible together, not sequentially.  
**Applicable flows:** 4.3a

---

### F-39 · One-step reclassification with reason

**Description:** A "Reclassify" affordance on the classification card opens a single-step surface: the three sub-type options displayed as clearly labeled buttons, each with its routing consequence shown beneath. The ZOM taps the correct sub-type, optionally adds a brief reason note, and confirms. The reclassification completes in one step and is logged as a ZOM override event with the original AI classification, the new classification, and the reason note. Implements FR-CUST-03.  
**Applicable flows:** 4.3a

---

### F-40 · Classification confidence threshold warning

**Description:** When the AI's customs hold classification falls below a configurable confidence threshold, the card surfaces a distinct warning state — not just a low-confidence indicator, but an explicit prompt: "Classification confidence is low — review the BorderIQ reason codes before routing." The routing button remains available but requires a deliberate extra tap to proceed from a low-confidence state. High-confidence classifications route with a single tap; low-confidence ones require two. Adds proportionate friction to the highest-risk classification scenario.  
**Applicable flows:** 4.3a

---

### F-41 · Document checklist for Documentation Gap holds

**Description:** When a Documentation Gap hold routes to the ZOM's T1/T2 queue, the action surface presents a structured document checklist derived from the BorderIQ reason codes: which specific documents are missing, incomplete, or incorrect. Each checklist item shows its source (BorderIQ field name) and a status badge. The ZOM works through the checklist rather than inferring what's needed from a raw hold description.  
**Applicable flows:** 4.3a

---

## Flow 4.3b — Prepare and submit escalation

---

### F-42 · AI-assembled outbound brief **[MERGED]**

**Description:** When routing to escalation or delegation, the co-pilot pre-assembles a structured brief in labeled sections — for escalation: Situation, Impact, Proposed action, ZOM context; for delegation: exception summary, AI-recommended action, carrier context, deadline. Every AI-authored sentence carries a persistent "AI" label. The ZOM reviews section by section and edits inline where the AI got something wrong. The brief is structured like a decision memo — short, scannable, and action-oriented.  
_Merged from: #47 AI-assembled brief with section labels (4.3b) · #59 AI-assembled handoff package (4.4a)._  
**Applicable flows:** 4.3b · 4.4a

---

### F-43 · Threshold trigger explanation

**Description:** When the action surface routes a ZOM to escalation, a clear one-line explanation appears before the brief: "This action requires Director approval — estimated cost ($3,200) exceeds the $2,500 T2 threshold." The explanation names the specific threshold crossed, the configured value, and who will receive the escalation. The ZOM never has to guess why they cannot proceed, which reduces attempts to work around tier gates.  
**Applicable flows:** 4.3b

---

### F-44 · Structured context prompts for outbound handoffs **[MERGED]**

**Description:** Rather than a blank "Add note" free-text field, the ZOM context section of escalation briefs and delegation packages offers structured prompt fields that surface specific operational knowledge the recipient needs. Escalation prompts: "What does the AI not know about this situation?" / "Any prior arrangements with this carrier or customer?" / "Anything that should change the recommended action?" Delegation prompts: "What does the Dispatcher need to know that isn't in the brief?" / "Any constraints on how they should approach this?" All fields are optional and skippable in one tap.  
_Merged from: #44 Structured ZOM context prompts (4.3b) · Structured ZOM note prompts for handoff (4.4a — previously unsaved candidate)._  
**Applicable flows:** 4.3b · 4.4a

---

### F-45 · Escalation receipt confirmation

**Description:** After submitting an escalation, the ZOM sees an immediate in-feed confirmation: "Escalation sent to [Director name] at [timestamp]. You'll be notified when they respond." The exception card transitions to an "Escalated — awaiting approval" state with the approver's name visible. If the approver has not acknowledged within a configurable window (default: 30 minutes), the card surfaces a "No response yet" indicator.  
**Applicable flows:** 4.3b

---

### F-46 · No-response recovery **[MERGED]**

**Description:** When an outbound handoff — escalation or delegation — receives no response within a configurable window (default: 30 minutes for escalation, configurable per delegation), the exception card surfaces a "No response yet" indicator with two recovery options: "Send a reminder" (triggers a second notification to the recipient) or "Re-route / Handle myself" (opens a re-route flow or returns the exception to the ZOM's active queue). Both options log the deadline breach and the ZOM's response in the audit trail.  
_Merged from: #46 No-response escalation nudge (4.3b) · Delegation no-response path within F-60 (4.4a) · Stalled delegation re-surface — PB-01 candidate (4.4c)._  
**Applicable flows:** 4.3b · 4.4a · 4.4c

---

### F-47 · Escalation history — prior decisions on similar exceptions

**Description:** Before submitting an escalation, a compact "Similar escalations" chip shows 1–2 prior escalations of the same type involving the same carrier, lane, or customer — with their outcome and the Director's decision. The same history is automatically included in the brief the approver receives, without the ZOM having to manually reference it. Grounds both the ZOM's context note and the approver's decision in precedent.  
**Applicable flows:** 4.3b

---

## Flow 4.3c — Approver reviews and decides

---

### F-48 · Single-screen decision surface

**Description:** The approver's entire interaction fits on one screen: the AI-assembled brief (Situation, Impact, Proposed action, ZOM context), three decision buttons (Approve / Modify / Reject), and rationale fields for non-approvals. Approve requires a single tap with no confirmation dialog. Modify opens an inline parameter-edit surface. Reject opens a one-line reason field. The approver never needs to navigate to another screen or open a source system. Decision achievable in under 2 minutes from notification to confirmed response.  
**Applicable flows:** 4.3c

---

### F-49 · Rationale required for Modify and Reject

**Description:** Approve requires a single tap with no mandatory rationale — the approved action speaks for itself. Modify requires the Director to state what changed and why before confirming. Reject requires a one-line reason. Both use a structured prompt. The rationale is forwarded to the ZOM with the decision notification and stored in the audit trail. Ensures the ZOM receives actionable context with any non-approval rather than a blocked exception with no path forward.  
**Applicable flows:** 4.3c

---

### F-50 · Legal Authority facts-only interface

**Description:** T4 Legal-Sanctions escalations show the Legal Authority confirmed facts only — hold reason codes, shipment details, affected entities — with no AI action recommendation. Two decision options only: Acknowledge / Record Disposition. Record Disposition opens a structured field for formal outcome logging. The interface never shows an AI-suggested resolution for T4 holds. Implements FR-CUST-05 and FR-CUST-06 — the AI must not propose a resolution for a Legal-Sanctions hold.  
**Applicable flows:** 4.3c

---

### F-51 · Approver escalation queue — prioritized inbox

**Description:** The Director has a dedicated lightweight inbox separate from the ZOM exception feed — a minimal decision surface showing pending escalations ranked by urgency flag, breach countdown, and SLA tier. Each row shows the submitting ZOM, exception type, and a one-line situation summary. Designed for 3–10 decisions per day, not 50+ exceptions per shift. Reflects the fundamentally different task of the approver persona vs. the ZOM persona.  
**Applicable flows:** 4.3c

---

### F-52 · Request more info — structured reply path

**Description:** A fourth decision option alongside Approve/Modify/Reject. The Director specifies the question and a response deadline (default: 30 minutes). The request routes back to the ZOM's queue as a high-priority notification with the specific question. The escalation status transitions to "Pending ZOM response" and the SLA clock is paused. A single-recurrence limit prevents infinite loops. Resolves OQ-13.  
**Applicable flows:** 4.3c

---

### F-53 · Decision notification to ZOM with full rationale

**Description:** When the approver submits their decision, the ZOM receives an in-feed notification immediately: "Director [name] approved / modified / rejected — [rationale]. Tap to act." For Modify, the notification shows the specific parameters changed. For Reject, it shows the reason and any suggested alternative path. The notification links directly back to the exception's action surface. Implements FR-26 at the UX layer.  
**Applicable flows:** 4.3c

---

### F-54 · Decision audit record — attributed and immutable

**Description:** At the moment the Director or Legal Authority confirms their decision, the system creates an immutable audit record: decision type, approver name and role, timestamp, the brief version they reviewed, the rationale they provided, and the action that was or wasn't executed. Accessible to Admin users. Stored independently of the exception's ongoing audit trail. Satisfies NFR-24's EU AI Act traceability requirement for human oversight documentation at the moment of consequential decision-making.  
**Applicable flows:** 4.3c

---

## Flow 4.3d — ZOM receives decision and closes

---

### F-55 · Decision notification — outcome + next step

**Description:** The decision notification the ZOM receives includes a single prominent next-step prompt based on the decision type: Approved → "Confirm execution" button; Modified → "Review changes and confirm" button; Rejected → "Choose alternate action" button. The ZOM can act directly from the notification without opening the exception detail first, collapsing the gap between receiving a decision and acting on it.  
**Applicable flows:** 4.3d

---

### F-56 · Action chain summary on closure **[MERGED]**

**Description:** The closure state shows a compact, attributed, timestamped chain of the complete decision pathway — ZOM submitted → approver or dispatcher actioned → outcome confirmed → exception closed. Each link in the chain is attributed by name and timestamped. The ZOM can expand any step to see the full rationale or outcome note. The chain is preserved in the audit trail and visible on the closed exception record. Satisfies AC-13 and AC-09.  
_Merged from: #57 Escalation chain summary on closure (4.3d) · #69 Delegation chain summary on closure (4.4c)._  
**Applicable flows:** 4.3d · 4.4c

---

### F-57 · Rejected action — alternate path surface

**Description:** When the Director rejects an escalation, the notification routes the ZOM back to the action surface with the rejected action greyed out and the Director's rationale displayed inline above the remaining options. The AI surfaces 1–2 alternative actions that fall within the ZOM's own T1/T2 authority, filtered by the rejection rationale. If no T1/T2 alternative exists, the action surface shows only the Manual Mode option and a free-text note field. Prevents a rejection from leaving the ZOM stranded with no path forward.  
**Applicable flows:** 4.3d

---

## Flow 4.4a — Select dispatcher and prepare handoff

---

### F-58 · Dispatcher workload signal

**Description:** The dispatcher selection step shows each available dispatcher with their current active delegated task count — "J. Torres · 3 active tasks," "M. Osei · 1 active task." Count only; no performance data, no availability status. If all dispatchers exceed a configurable threshold (default: 5 active tasks), a soft warning appears: "All dispatchers are currently busy — consider handling this yourself or setting a longer deadline." Closes the availability gap flagged in Flow 4.4a of the user flows doc.  
**Applicable flows:** 4.4a

---

### F-59 · Delegation sent confirmation with status tracking

**Description:** After confirming delegation, the exception card transitions to a "Delegated — awaiting Dispatcher response" state showing: the assigned Dispatcher's name, the time delegated, and the deadline. The card status updates automatically when the Dispatcher responds via their channel. If the deadline passes without a response, F-46 (No-response recovery) surfaces the recovery options. The ZOM is not required to monitor the delegation actively.  
**Applicable flows:** 4.4a

---

### F-60 · Carrier context pre-loaded in handoff package

**Description:** The AI-assembled handoff package automatically includes carrier-specific context the Dispatcher will need to act: the carrier's primary contact (from the carrier master in FleetCommand TMS), the carrier's current performance score on this lane, any active tender or booking reference numbers, and the preferred escalation path within the carrier org. This context is pulled at package-assembly time and is read-only in the package the Dispatcher receives. Eliminates the most common reason a Dispatcher returns with a clarification question.  
**Applicable flows:** 4.4a

---

### F-61 · Delegation audit log — chain of custody

**Description:** At the moment of delegation, the co-pilot creates an immutable delegation record: which ZOM delegated, to which Dispatcher, at what time, with what package content, and what deadline was set. This record is stored in the exception's audit trail independently of what subsequently happens in the Dispatcher's external channel. When the Dispatcher's completion status is received back, it is appended to the same record, satisfying AC-13.  
**Applicable flows:** 4.4a

---

### F-62 · Recall delegation — take it back

**Description:** While a delegation is pending — before the Dispatcher has confirmed they have started working on it — the ZOM can recall the delegation from the exception card with a single tap. Recalling sends a cancellation notification through the same channel the original package was sent, returns the exception to the ZOM's active queue, and logs the recall with timestamp and reason. Recall is disabled once the Dispatcher sends any response. Provides a correction path for misrouted or premature delegations without requiring a direct conversation with the Dispatcher.  
**Applicable flows:** 4.4a

---

## Flow 4.4b — Dispatcher executes delegated task

_(Features scoped to what the co-pilot controls: package content sent and status responses received)_

---

### F-63 · Structured completion status options

**Description:** The outbound delegation package includes a structured reply mechanism — at MVP, a simple reply link or SMS keyword — with four pre-defined response options the Dispatcher can select without composing free text: "Done — carrier confirmed," "In progress — expect resolution by [time]," "Blocked — need more info from ZOM," or "Unable to complete — returning to ZOM." Each maps to a distinct status that the co-pilot can parse and surface on the exception card without ambiguity, enabling automated card state updates without ZOM intervention.  
**Applicable flows:** 4.4b  
**[PAIR]** with F-64 (Blocked status — clarification request routing).

---

### F-64 · Blocked status — clarification request routing

**Description:** When the Dispatcher replies "Blocked — need more info," their reply is parsed and the exception card in the ZOM's feed surfaces a high-priority notification: "Dispatcher J. Torres needs clarification — [Dispatcher's question if included]." The ZOM can reply via an inline text field that routes back through the same channel. The clarification exchange is logged in the audit trail. Implements PB-03 from the user flows doc — the structured clarification reply path called essential at MVP.  
**Applicable flows:** 4.4b  
**[PAIR]** with F-63 (Structured completion status options).

---

### F-65 · Package format optimized per channel

**Description:** The co-pilot sends the handoff package in a format optimized for the selected delivery channel. Email: structured sections with headers, full context, and reply-link buttons. SMS: compressed summary under 160 characters with a link to the full package and reply keywords. Existing system (OpsDesk/ServiceNow): structured task card with all fields pre-populated. The ZOM selects the channel at delegation time; the co-pilot handles formatting automatically. Implements the quality guarantee made by F-23 (preview as recipient) in practice.  
**Applicable flows:** 4.4b

---

## Flow 4.4c — ZOM confirms resolution and closes

---

### F-66 · Resolution verification before closure

**Description:** When the Dispatcher sends a "Done" status, the exception card does not auto-close. The co-pilot surfaces a verification step: the Dispatcher's outcome note alongside any system-corroborating signals it can verify automatically — a new milestone in SignalTrack, an updated booking in FleetCommand TMS, an ASN confirmation in Nexus WMS. The ZOM sees what the Dispatcher reported and what the system independently confirms, then taps "Confirm closure" or "Keep open — needs follow-up." A "Done" from the Dispatcher is a human report, not a verified system state.  
**Applicable flows:** 4.4c

---

### F-67 · Partial resolution — keep open with updated context

**Description:** When the ZOM reviews the Dispatcher's outcome and determines it is only partially resolved — carrier contacted but rebooking not yet confirmed — they tap "Keep open — needs follow-up." The exception returns to the active queue with the Dispatcher's outcome note appended as a ZOM annotation, the delegation event logged, and the exception's priority re-scored by the AI based on the updated situation. Preserves operational context from the partial delegation attempt rather than requiring the ZOM to start from scratch.  
**Applicable flows:** 4.4c

---

### F-68 · Dispatcher outcome note on closed record

**Description:** The Dispatcher's outcome note — whatever they reported alongside their "Done" status — is preserved on the closed exception record alongside the ZOM annotation layer (F-12). It is attributed to the Dispatcher by name, timestamped, and read-only. Future ZOMs who view the closed record for reference see the full resolution story including the Dispatcher's first-hand account of what they did. Turns closed exceptions into institutional memory that makes the carrier history scorecard (F-14) and similar past exception references actionable.  
**Applicable flows:** 4.4c

---

## Cross-cutting design patterns

The following are not standalone features but design system decisions that govern how multiple features above must be built consistently. They should be resolved before wireframing begins.

### P-01 · Live state change interaction pattern

**Scope:** F-02 (live score change indicator) · F-17 (re-evaluation trigger)  
**Decision required:** Feed-level changes use a passive card pulse with a micro-label. Detail-level changes use an explicit banner prompt. No silent updates at either level. The ZOM always controls when their reading context changes.

### P-02 · Data transparency design language

**Scope:** F-03 (source health banner) · F-10 (epistemic labels) · F-17 (re-evaluation trigger) · F-18 (conflicting signal alert)  
**Decision required:** Shared visual vocabulary for source badges, freshness indicators, epistemic state labels (Confirmed / Inferred / Unknown), and conflict notation. One visual system across all four features.

### P-03 · ZOM override acknowledgment pattern

**Scope:** F-22 (override reason capture) · F-29 (honest acknowledgment) · F-34 (manually-added badge)  
**Decision required:** When the ZOM overrides or corrects the AI, the acknowledgment is always passive (no modal, no dismiss), honest about scope, and brief. Copy varies by context; behavior and visual treatment are identical across all three surfaces.

---

_End of raw-features.md_  
_Total features: 62 (5 cross-cutting merges applied) + 3 design patterns_  
_Last updated: Session 12 final_
