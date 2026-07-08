# Demo Narrative: Kase — The Operations Co-Pilot
**15-Minute Live Walkthrough Script**
_BCG X AI Experience Designer Presentation · Spring 2026_

---

## Overview & Criterion Map

The demo covers all five assessment criteria across four product verticals. Every moment is mapped below so you can call out the right framing without losing your thread.

| Criterion | Where it lands |
|---|---|
| **AI Thinking** — how the solution behaves and solves the core problem | §1 Workspace overview, §2 Situation Brief, §3 Priority tiers, §4 Exception detail (AI summary + evidence), §5 Kase workspace script |
| **Trust & Transparency** — designing for when AI is wrong | §2 Source health / data confidence, §4 Confidence ring + stale indicators, §6 T4 sanctions anomaly, §7 Override with reason capture, §8 Audit log |
| **Strategic Framing** — business problem, user opportunity, prioritization | §1 Opening frame, §5 Delegate modal + Kase, §9 Performance + director view |
| **Craft** — clarity, polish, usability | §1 Shell + split layout, §4 Detail view tabs, §5 Copilot panel animation, §10 Audit log cluster + drawer |
| **Your Process** — AI tools in the work | Woven into transitions; explicit callout at close |

**The 4 design questions** from the brief and where each is answered:

| Question | Answered at |
|---|---|
| How does AI surface and prioritize exceptions — not just list them? | §2–3 |
| How does the manager understand WHY AI flagged something? | §4 |
| How does the manager act, override, or delegate — and what does AI do next? | §5–7 |
| What happens when AI gets prioritization wrong? | §6–7 |

---

## Pre-Demo Setup Checklist

- App running at `localhost:3000`, which redirects to `/workspace`
- Browser window full-screen, sidebar expanded
- Persona set to **Jordan Lee — Zone Ops Manager** (default; sidebar footer)
- No exception pre-selected (no `?exceptionId=` param in URL)
- Copilot panel **closed**
- Situation Brief modal **closed** (do not pre-open it — you'll open it live in §2 by clicking the notification bell)
- Browser zoom at 100%, display at 1440px+ width

---

## §1 · Opening Frame `[0:00–1:00]`

**Screen:** `/workspace` — Pending queue, full layout visible, live feed refreshing

### Voiceover

> "This is Kase — an operations co-pilot built for the zone operations managers who run the logistics network behind 400-plus warehouses. Today those managers spend 60% of their shift triaging alerts across six disconnected tools. They miss escalations, act late, and burn out.
>
> The product question wasn't 'how do we build another dashboard?' It was 'how do we give an expert their time back — without taking away their judgment?' That tension — between AI speed and human trust — is the thread running through every design decision you're about to see.
>
> There's a second question underneath that one: where should AI decide, and where should it step back? A rule system can sort exceptions by type and age. A model can simultaneously weight customer tier, time-to-breach, carrier history, downstream order value, and regional co-occurrence — and update those weights as it learns from every correction a manager makes. But a model also has to know where it's the wrong tool. We'll see both in this demo."

**Criterion called out:** Strategic Framing — anchors the business problem before touching the UI.

**What's on screen to point at:**
- The three-pane layout: queue tab strip → filter bar → feed / map split
- The simulated feed update firing (cards re-ranking in real time; FLIP animation)
- Source health badge in the top-right of the tab strip (6 system dots)

---

## §2 · Situation Brief: AI Sees the Zone Before You Do `[1:00–2:30]`

**Screen:** `/workspace` — Notification bell in the top shell bar

**Action:** Click the notification bell icon in the top-right of the shell → the Situation Brief modal opens as a 5-step carousel

### Voiceover

> "The first thing a manager does at the start of a shift isn't open their queue — it's check what changed overnight. Kase synthesizes across all six source systems and writes a shift briefing in plain language. Jordan gets it the moment she opens the app."

**Slide 1 — Zone snapshot (read the AI callout):**

> "13 exceptions active, up from 8 at last shift close. Three queues: 5 pending, 3 escalated, 3 delegated. The brief leads with what changed, not just what exists."

**Advance to Slide 2 — Highest-priority cluster:**

> *"The highest-priority cluster is three customs holds at the Laredo World Trade Bridge tied to Gold-tier orders, with the tightest breach window closing in 3 hours 40 minutes."*

**Point at the SLA urgency bar:**

> "Kase renders the breach window as a progress bar — 7% of the day remaining on that SLA. That's not a number Jordan has to compute. The urgency is visible before she touches the queue."

**Advance to Slide 3 — Source systems health:**

> "And here's the trust layer. SignalTrack is degraded — GPS tracking is running 8 to 15 minutes delayed. OrderPulse is down — no events for 42 minutes. Kase flags its own data gaps inline."

> "Notice what this does. It tells Jordan where its own data is uncertain — cold-chain status on two refrigerated loads is inferred, not confirmed. That last part is a trust signal, not a disclaimer. The model has been designed to surface its own confidence gaps."

**Point at the source health grid:**

> "Four green systems, one degraded, one down. When Jordan makes a decision in this tool, she always knows which signals are solid and which are lagging."

**Advance to Slides 4–5 — Escalated and Delegated items. Click 'Start shift' to close:**

> "The final two slides surface what's already in motion — exceptions already escalated to legal or compliance, and items Jordan delegated to vendors. She steps into the shift knowing where everything stands."

**Criterion called out:**
- **AI Thinking** — AI writes context, not just data; synthesizes across 6 sources
- **Trust & Transparency** — explicit data-confidence disclosures; system health surface; inferred vs. confirmed signals

---

## §3 · Priority Feed: Ranked, Not Listed `[2:30–4:30]`

**Screen:** `/workspace` → Pending tab, feed visible on left, map on right

### Voiceover

> "Here's the feed. Eight pending exceptions right now. But notice — this isn't a list sorted by timestamp. Kase has already tiered every exception by urgency using a model that weighs shipment value, customer tier, downstream impact, time-to-breach, and exception type."

**Point at the tier labels on cards (T1, T2, T3, T4):**

> "T1 is critical — act now. T4 means the AI has routed it to a holding pattern. The manager doesn't need to compute urgency; they need to decide on urgency. That's the shift this product makes."

**Point at the top T1 card (SHP-48213, Laredo):**

> "Take this one — the Laredo customs hold at the top. Why is it T1 and not T2? Three signals converge: Gold-tier customer, a 3h40m breach window, and two other exceptions co-located at the same crossing. Any one of those individually might be a T2. The combination — Gold orders, a closing SLA window, and a regional cluster — is what tips it to critical. A rule system can catch any single signal. Only a model reads the combination and assigns urgency from it."

**Demo the filter bar briefly:**

> "And if Jordan needs to cut the list — maybe she only owns a subset of sites — she can filter by exception type, priority tier, or warehouse. The map updates in real time."

**Point at the map panel — clusters, popover on hover:**

> "The map gives geographic context the feed doesn't. Three exceptions clustering around Laredo tells a different story than three exceptions scattered across the zone. That cluster view is how you spot a regional cascade before it becomes a crisis."

**Show the sort control — switch from Priority to Warehouse sort, then back:**

> "Default sort is AI-ranked. But if she's doing a site walkthrough she can flip to warehouse sort. The model's recommendation is always recoverable — it's never hidden, just deprioritized when she needs a different lens."

**Criterion called out:**
- **AI Thinking** — tiered ranking by model, not timestamp; multi-signal scoring
- **Strategic Framing** — shift from triage labor to judgment work

---

## §4 · Exception Detail: Why Did Kase Flag This? `[4:30–7:30]`

**Screen:** Click `exc-1001` — SHP-48213, Laredo World Trade Bridge, T1 customs hold

**Action:** Click the top card in the feed. The detail view opens in the right pane.

### Voiceover

> "This is the customs hold Kase flagged as the most critical exception in the zone. Let me walk you through what the detail view tells Jordan — and how it earns her trust."

**Point at the AI Summary Card:**

> "At the top: a plain-language summary Kase generated from four data sources. In 30 seconds Jordan knows what happened, why it matters, and what's at risk. Below the summary there's a confidence ring."

**Point at the confidence ring / donut:**

> "87% confidence. That number is not decorative. It means the model surfaced this exception on strong signals from BorderIQ and FleetCommand, but with partial uncertainty — because OrderPulse is down and customer-tier data may be stale. High confidence doesn't mean perfect. It means 'the signals that matter most are reliable.'"

**Point at estimated resolution ETA in the AI summary:**

> "And the model estimates resolution at 3 hours 40 minutes if action is taken now. That number feeds directly into Jordan's urgency calculus."

**Click the Evidence tab:**

> "This tab is the answer to 'why did Kase flag this?' Every signal the model read, the weight it assigned, and the flags it couldn't resolve — all of it is here. This is what separates a co-pilot from an autocomplete: the recommendation is open to inspection. If Jordan thinks the model missed something, she can trace the reasoning back to the exact source document and find where it read the situation differently than she would."

**Point at source system attribution in the metadata sidebar:**

> "Every fact is source-attributed. FleetCommand owns the carrier update. BorderIQ owns the customs hold flag. SignalTrack is degraded — so the cold-chain status on this load is grayed out with an inferred label. Jordan sees the evidence graph, not just the conclusion. That distinction matters — it's the difference between trusting AI because it told you to, and trusting AI because you can see what it saw."

**Click the Progress tab:**

> "Progress shows the lifecycle — when the exception was first detected, who touched it, what actions were taken. Not a timeline of timestamps. A stepper that shows where the exception is in its resolution arc."

**Criterion called out:**
- **AI Thinking** — confidence ring, ETA, reasoning trace, evidence tab
- **Trust & Transparency** — source attribution, degraded-signal disclosure, evidence access
- **Craft** — tab structure keeps density controlled; information hierarchy is clear without being sparse

---

## §5 · Acting: Kase Proposes, Jordan Decides `[7:30–10:00]`

**Screen:** Exception detail — Recommended Action tab (default)

### Voiceover

> "Back to the Recommended Action tab. Kase has ranked three options. Option 1 is contact the customs broker for expedited invoice review. It's pre-written as an instruction Jordan can send immediately."

**Point at the accordion of ranked action options:**

> "But Jordan's been on this route for three years. She knows Broker Devin Okafor gets documentation faster than the standard queue. She edits the instruction directly."

**Demo: click to expand Option 1, then edit the instruction text in the text field:**

> "The action is now marked 'Modified.' The co-pilot proposed; the expert refined. That modification — the original recommendation alongside what Jordan changed and why — goes into the audit log as a labeled training event. Every time an expert improves on what the model suggested, that's a data point. The model gets more accurate because of Jordan's corrections, not in spite of them."

> "Now she's going to open Kase to run through the impact projection before committing."

**Action:** Click the AI avatar in the shell corner → Copilot panel slides in, main content reflows left

> "The panel opens in context. Kase already knows which exception Jordan is looking at."

**Advance through the workspace copilot script, Steps 1–6. Read each response:**

**Step 1 (Kase surfaces the exception):**
> "Good. Kase confirms: the Laredo customs hold on SHP-48213 is the highest-risk item in the queue — Gold-tier orders, 3 hours 40 minutes to breach."

**Step 2 (Receipt/projection block — downstream orders at risk):**
> "Two Gold-tier orders in the breach window. This isn't just a delayed shipment; it's a potential SLA violation on the company's highest-value customers."

**Step 3 (Bar chart: time-to-clear by day of week):**
> "Kase pulls historical data. Mondays average 34 minutes to clear a documentation hold. Fridays average 58. Today is Tuesday — this is a favorable window, but only if action is taken in the next 40 minutes."

**Step 4 (Recovery choice — radio buttons):**
> "Kase offers three recovery paths and asks Jordan to commit. Not a dropdown — a choice card with tradeoffs visible."

**Select 'Expedite invoice review via broker':**

**Step 5 (Predicted clear time vs breach time comparison stat):**
> "17:10 predicted clear time. 18:32 is the breach window. The model shows the margin — Jordan has a decision to make, and she can see exactly how much room she has."

**Step 6 (Pre-execution confirm card — 'Delegate to broker'):**
> "Kase writes the delegation brief. Jordan reviews it, confirms. The action is committed and the exception moves to the Delegated queue."

> "This is the full loop: AI surfaces, AI explains, human decides, AI executes. No copy-pasting between tools. No manual ticket creation. The operation runs in one place."

**Criterion called out:**
- **AI Thinking** — full sense-reason-act loop; historical pattern retrieval; impact projection
- **Craft** — panel animation, context-aware script, confirm card UX, reflow behavior
- **Trust & Transparency** — human must confirm before execution; modification tracked; margin shown

---

## §6 · Trust Design: When AI Steps Back, and What to Do When It's Wrong `[10:00–11:30]`

**Screen:** Close copilot panel. In the Pending feed, scroll to `exc-1002` — SHP-48219, Laredo WTB, T4

**Action:** Point at T4 label on the card, then click the exception to open the detail view.

### Voiceover

> "I want to spend a moment on two design questions that don't get enough time in AI product demos: where should the AI not be making recommendations at all — and what can the user do when they think the AI got something wrong?"

**Part 1 — Where AI steps back:**

**Point at the LegalHoldActionPanel replacing the normal recommendation block:**

> "This exception is T4 — Routed. Second card from the top, just below the T1 we just acted on. Open it."

> "The recommendation block is missing. There's no 'contact broker,' no 'reroute carrier.' There's a single action: Escalate to Legal. Kase recognized that this is a sanctions compliance hold — and made a deliberate choice not to recommend an operational resolution, because it's outside the scope where AI should be deciding. It didn't suppress the exception. It surfaced it with the right affordance for the right chain of authority."

> "This is a design choice, not a gap. The tier system isn't just urgency — it's routing intent. T4-Routed means 'wrong tool for this decision.' A model that tries to operationally resolve a sanctions hold is more dangerous than one that escalates it and waits."

**Part 2 — When Jordan thinks the AI got it wrong:**

> "Now let's say Jordan looks at a different exception and genuinely disagrees with the tier. Maybe it's T3 and she thinks it should be T1 based on something she knows about this customer that the model doesn't."

**Action:** Click the EditableTierControl (tier badge in the detail header) — the tier change modal opens

> "She can override it. The tier badge is editable — she clicks it, picks the new tier, and Kase asks for a reason. Not to block the action. Not as a warning. As a learning input."

**Point at the structured reason codes in the modal:**

> "The reason options are structured — 'customer context not reflected,' 'regional pattern,' 'data source lagging' — so the override doesn't just change this one exception. It writes a labeled training event. The model now knows that for this exception type, in this region, with this kind of customer signal, its weighting was off. Enough corrections like this and the model recalibrates."

> "And if Jordan is wrong? The override is in the audit log — attributed, timestamped, with before-and-after diffs. The system doesn't pretend overrides are always right. It records them so the team can learn from both the model's mistakes and the manager's."

**Criterion called out:**
- **Trust & Transparency** — explicit AI scope boundaries (where AI declines to recommend); override with reason capture; audit trail for human corrections
- **AI Thinking** — legal hold routing is a model behavior design choice; structured override as model calibration input

---

## §7 · Escalated + Delegated: The Full Lifecycle `[11:30–12:30]`

**Screen:** Click Escalated tab, then Delegated tab

### Voiceover

> "The workspace isn't just a triage queue. It's the full lifecycle of every exception in Jordan's zone."

**Click Escalated tab — show 3 exceptions including exc-1009 (sanctions, Pharr, T4) and exc-1010 (carrier silent, T1):**

> "Escalated holds everything Jordan has routed upward — to legal, compliance, or the director. The status panel shows who it was escalated to, when, and what response is pending. Jordan doesn't have to follow up by email; the context stays in the tool."

**Click Delegated tab — show 3 exceptions:**

> "Delegated holds everything she's routed to a teammate or vendor — with the instruction she sent and the current status. The action Jordan committed in Kase's confirm card is here, attributed and timestamped. The co-pilot and the workspace are one system."

> "And what does Kase do after Jordan commits an action? It doesn't disappear. It monitors for resolution — if the vendor doesn't respond within the expected window, it surfaces a follow-up prompt. If the exception clears, it logs the outcome against the prediction it made. That outcome data is what lets it get better at estimating resolution times for the next similar exception. Every loop closes."

**Criterion called out:**
- **Strategic Framing** — full operational loop, not just triage UI
- **AI Thinking** — post-action monitoring and outcome logging close the model feedback loop
- **Craft** — three-tab architecture makes the lifecycle legible without overwhelming the default view

---

## §8 · Performance: How Is the Zone Actually Doing? `[12:30–13:30]`

**Screen:** Navigate to `/performance` — Zone Performance tab

### Voiceover

> "Switching to Performance. This is the zone-level view — not individual exceptions, but trends. How is the AI performing as a system?"

**Point at the Zone Narrative Banner:**

> "Kase writes a zone narrative at the top — the same way it wrote the situation brief on the workspace. One sentence of AI-authored context before the data."

**Click 'View all insights':**

> "Six AI insights, ranked. The highest-severity one: Pharr-Reynosa has a 2.3x escalation rate versus the zone median. The model is telling Jordan where to direct her coaching attention, not just where the KPIs are red."

**Close drawer. Point at KPI stat tiles:**

> "Mean time to resolution, AI acceptance rate, escalation rate, override frequency. Each tile has a 6-week sparkline and a trend narrative. The zone is improving on MTTR but the AI acceptance rate is holding at 74% — meaning 26% of AI recommendations are being modified or overridden."

> "That number isn't a failure metric. It's a trust signal. A 100% acceptance rate would suggest managers aren't exercising judgment. A 26% override rate means the model is mostly right — and when it's wrong, humans are catching it."

**Switch to Director persona (sidebar account menu → 'Switch to Director'):**

> "Now, switching to the director persona — which Jordan's manager Rhea Patel would use. The AI Adoption tab appears."

**Click AI Adoption tab:**

> "Rhea can see which exception types the model gets wrong most often. Customs Hold is flagged with a 'Low confidence' model gap tag — 41% of customs hold recommendations are being corrected. That's a model improvement signal, not just a UX metric. The product team can take that to the data science team."

**Point at per-ZOM leaderboard:**

> "And the per-manager leaderboard shows who is working with the model, who is routinely overriding it, and who might need coaching on either the tool or their process."

**Criterion called out:**
- **Strategic Framing** — product as a management system, not just a tool
- **AI Thinking** — AI-authored narrative; model gap detection; acceptance rate as system health signal
- **Trust & Transparency** — override rate is surfaced positively, not hidden

---

## §9 · Audit Log: The Immutable Record of Human-AI Collaboration `[13:30–14:30]`

**Screen:** Navigate to `/audit-log`

### Voiceover

> "The final vertical: the Audit Log. Every AI recommendation, every human modification, every override, every escalation — immutable, source-attributed, and queryable."

**Point at the clustered exception table:**

> "Exceptions are clustered by case. Each row is one exception's full history, expandable inline."

**Expand exc-1001 cluster:**

> "The customs hold from the workspace: Kase recommended Option 1 → Jordan modified it → Jordan delegated → feedback marked. The full chain, timestamped, with before-and-after diffs on every change."

**Click the AI recommendation event row → AuditEventDrawer opens:**

> "Each event opens to a full detail drawer: Kase's reasoning steps at the time of recommendation, the confidence score, the source signals. If there's ever a dispute about why a shipment was handled a certain way — this is the record."

**Open Kase in the audit log context:**

> "Kase is also present here — but doing a different job. On the workspace, it helps you decide. On the audit log, it helps you analyze."

**Advance through Audit Log copilot script to Step 2 (bar chart — correction rate by exception type):**

> "Kase surfaces a pattern: 41% of customs hold recommendations were corrected by humans. That's not an operational report — it's a model calibration signal. The co-pilot is helping the team understand where the AI needs more training."

**Step 6 (Pre-execution confirm — export 8 override records):**

> "And when the director needs to bring evidence to a vendor review, Kase builds the export. Not a data dump — a curated package of the records that matter for that specific conversation."

**Criterion called out:**
- **Trust & Transparency** — immutable trail; full reasoning access; before/after diffs
- **AI Thinking** — Kase in audit context does pattern analysis, not just action support
- **Craft** — clustered table keeps audit legible; drawer keeps detail contained

---

## §10 · Close: What's Next `[14:30–15:00]`

**Screen:** Return to `/workspace` — full layout visible

### Voiceover

> "To close the demo: Kase is one answer to a real problem — the expert who has 400 exceptions in their queue, six tools open, and 60% of their day spent triaging instead of deciding.
>
> The design bets are: AI should explain itself or humans won't trust it. Overrides are features, not failures. And the co-pilot's job isn't to replace judgment — it's to give experts their judgment back at the right moment.
>
> Given more time with a small team, I'd validate three things: whether the confidence ring communicates calibration or just adds noise to operators under time pressure; whether the Kase copilot script needs to be adaptive rather than deterministic for the long tail of exception types; and whether the Audit Log needs a faster path from pattern finding to model retraining request — closing the feedback loop all the way back to the data science team."

> "That's Kase."

**Criterion called out:**
- **Your Process** — honest about what's validated, what's assumed, what's next
- **Strategic Framing** — closes on the product bet, not the features

---

## Appendix A: Source System Glossary

Kase aggregates signals from six disconnected systems that the zone operations manager previously had to monitor individually. Each system surfaces in the Situation Brief health grid, on exception cards as source chips, and in the Evidence tab as attributed signals.

| System | Category | What it does | Exception types it surfaces |
|---|---|---|---|
| **FleetCommand TMS** | Transportation Management | Route plans, carrier assignments, tender status, booking confirmations, TMS-modeled ETA. The dispatch layer — the source of truth for what carrier is on which load and where it is contractually expected to be. | Carrier delay, tender failure, routing guide violation, carrier non-response |
| **Nexus WMS** | Warehouse Management | Dock schedules, inbound/outbound shipment status, inventory levels, pick-pack-ship progress, receiving events, ASN matching. Covers what is physically happening at the warehouse and dock level. | Dock congestion, inventory discrepancy, short shipment, ASN mismatch, labor shortfall |
| **SignalTrack** | Real-time carrier visibility | GPS/telematics events, carrier milestone confirmations, geofence triggers, live ETA predictions, cold-chain condition monitors. The eyes on the load while it is in transit. When SignalTrack degrades, cold-chain and location signals become inferred rather than confirmed. | Tracking drop, missed milestone, ETA deviation, carrier silent period, cold-chain breach |
| **BorderIQ** | Customs and trade compliance | Customs filing status, hold type and reason codes, document completeness scores, duty/tariff flags, sanctions screening results. The source Kase reads to classify a customs hold as Documentation Gap, Regulatory, or Legal/Sanctions — and to decide whether to recommend an operational action or escalate to Legal. | Customs hold (Documentation Gap / Regulatory / Legal sub-types), missing documents, sanctions flag |
| **OrderPulse** | ERP / Order management | Customer orders, delivery commitments, SLA tier per customer, order change events, invoice status, customer priority ratings. The source of Gold/Silver/Standard tier attribution — what makes a shipment high-stakes from a customer relationship standpoint. When OrderPulse is down, customer-tier data becomes stale and confidence scores are capped. | SLA breach prediction, order change or cancellation, invoice discrepancy |
| **OpsDesk** | Operational incident management | Manually filed incident tickets, escalation history, cross-system alert aggregation, shift handoff notes. The catch-all for exceptions that don't originate from automated feeds — situations a previous shift manager or field operator reported by hand. Analogous to ServiceNow or PagerDuty in the enterprise stack. | Manually reported incident, unacknowledged alert, escalation breach, shift-handoff risk item |

**How source systems surface in the demo:**
- **Situation Brief — Slide 3:** The source health grid shows all six systems. Four green, one degraded (SignalTrack), one down (OrderPulse) at the time of the scripted brief.
- **Exception cards:** Source chips on each card show which systems contributed signals to that exception.
- **Exception detail — Evidence tab:** Every signal the model read is attributed to its source system with its health status at the time of ingestion. Degraded or down systems render their signals with an "inferred" label.
- **AI confidence ring:** The 87% confidence on exc-1001 reflects strong BorderIQ and FleetCommand signals with a cap from the stale OrderPulse customer-tier data.

---

## Appendix B: Features Built for This Demo

### Situation Brief Modal — accessible via notification bell

**What it is:** A 5-step carousel modal that surfaces an AI-authored zone situation brief at the start of each shift. Jordan opens it by clicking the notification bell in the top shell bar. The modal walks through: (1) zone snapshot with exception counts and queue status, (2) highest-priority cluster with SLA urgency bar, (3) source systems health grid with data-confidence disclosures, (4) escalated items, and (5) delegated items. Clicking "Start shift" on the final step closes the modal.

**Why it matters for the demo:** This is the single highest-impact moment for **AI Thinking** and **Trust & Transparency** criteria. It shows that Kase synthesizes across sources proactively — before the manager has touched a filter — and surfaces its own data-confidence gaps inline. The carousel format means each insight gets dedicated focus rather than competing in a dense banner.

**Status:** The banner flag (`SHOW_SITUATION_BRIEF`) is set to `false` — the modal replaces it entirely. No flag change is needed before the demo; the modal is always accessible via the notification bell.

---

## Appendix C: Criterion Coverage Assessment

| Criterion | Coverage | Strongest Moment | Gap / Risk |
|---|---|---|---|
| **AI Thinking** | Strong | §4 Evidence tab + confidence ring; §5 Kase workspace script with impact projection and historical data retrieval | Copilot scripts are deterministic — if a panelist asks Kase an off-script question during demo, it won't respond. Brief the room that this is a scripted simulation, not a live model. |
| **Trust & Transparency** | Strong | §6 T4 sanctions anomaly + override with reason capture; §2 source health disclosures; §8 audit log reasoning trace | The confidence ring at 87% could prompt a question about how the number is computed. Be ready to explain: it reflects signal-source reliability weighted by data freshness, not model certainty in a vacuum. |
| **Strategic Framing** | Strong | §1 opening frame; §8 director AI Adoption view with model gap detection | The "rules vs. model" question from the brief ("what does it unlock over rules or a person?") is implicit but not explicitly stated during the demo. Add one sentence in §1: "Rules could tier by exception type — but a model can weight customer tier, time-to-breach, and regional cascade risk simultaneously, and update those weights as it learns." |
| **Craft** | Strong | Copilot panel reflow animation; FLIP reorder on feed updates; audit drawer; tab navigation in detail view | Ensure the app has had time to load the MapLibre tile layer before the demo starts — a blank map on first load undersells the geographic context moment in §3. Open the workspace in a pre-warmed tab. |
| **Your Process** | Moderate | Callout at close in §10 | This criterion is best satisfied in the presentation framing *outside* the demo — showing prompts, iterations, and Claude Code usage. Make sure slides or an artifact precede the demo to establish process. The demo itself shows the output; the slides should show the work. |

---

## Appendix D: Narrative Moments — Exception Reference Sheet

| Exception | Shipment | Tier | Key Demo Role |
|---|---|---|---|
| exc-1001 | SHP-48213 | T1 | Primary demo exception — Laredo customs hold, full detail walk, Kase action loop |
| exc-1002 | SHP-48219 | T4 (score: 92) | Trust anomaly — high score in low tier; LegalHoldActionPanel replaces recommendations |
| exc-1003 | SHP-51002 | T1 | Cold-chain stale data; cold-chain status "inferred, not confirmed" |
| exc-1009 | SHP-48901 | T4 (score: 99) | Escalated queue — sanctions hold already routed to legal; shows lifecycle |
| exc-1010 | SHP-49220 | T1 | Escalated — carrier silent 3h; highest urgency in escalated queue |
| exc-1012 | SHP-51550 | T3 | Delegated — dock delay, SAT-HUB; shows Jordan already acted |

---

## Appendix E: Talking Points for Common Panelist Questions

**"Why a model here instead of rules?"**
Rules can sort by exception type and age. A model can simultaneously weight customer tier (Gold vs. standard), time-to-breach, carrier history, downstream order value, and regional co-occurrence — and update those weights as new patterns emerge. The T4 sanctions routing is a case where the model learned that operational urgency and legal routing are orthogonal dimensions — a rule system would have conflated them.

**"What's the confidence ring measuring?"**
Signal-source reliability weighted by data freshness and exception-type model performance. On this customs hold: BorderIQ and FleetCommand are healthy → strong signals. OrderPulse is down → customer-tier signal is stale → confidence capped. It is not a posterior probability — it's a data-quality-weighted confidence in the recommendation, not the classification.

**"How does the override feedback actually improve the model?"**
Every override with a reason code writes a labeled training event to the audit log. The data science team can query by override reason × exception type to find where the model is systematically under-weighting a signal. The per-ZOM leaderboard on the AI Adoption tab surfaces which managers override most — not to penalize them, but to identify whether there's a regional pattern the global model hasn't learned yet.

**"What happens when Kase is wrong and Jordan misses it?"**
The audit log is the accountability layer. Every recommendation is timestamped and attributed. If a shipment breaches and the T1 exception was in the queue, the audit log shows the exact moment it appeared, who saw it, and what action was taken or not taken. This doesn't prevent failures — but it makes post-incident learning concrete rather than anecdotal.

**"Is the copilot replacing the decision or supporting it?"**
Supporting. Every Kase execution step ends on a confirm card — Jordan must commit. The modification tracking (Jordan edited the instruction, Kase marked it 'Modified') is the UX signature of a co-pilot, not an autopilot. The product bet is that the expert's judgment applied at the right moment — after context is surfaced, before execution — is more valuable than either pure automation or pure manual triage.

---

## Appendix F: Design Defense Q&A — Visual Design, Layout & AI Integration

Pre-empting the highest-likelihood questions from a design-literate panel, each backed by the competitive benchmark or market research.

---

### Visual Design

**"Why a three-pane layout — queue, filter bar, and feed/map split — rather than a single full-screen list?"**

The three-pane structure is a direct response to the density anti-pattern the competitive benchmark identified in SAP Transportation Management. SAP's planning cockpit puts a Gantt timeline, a live map, an info panel, and a load table all visible simultaneously with no progressive disclosure — "everything is always visible, nothing is prioritized." The result is an expert-mode surface that requires operators to scan the entire cockpit to find what matters.

Kase flips that. The default view is the prioritized queue — a ranked few items, not the full operational surface. The map is a contextual pane, not the primary canvas. When Jordan needs geographic context (the Laredo cluster), it's immediately to her right without a navigation step. When she doesn't, it stays ambient. Better Stack's benchmark pattern — pairing a ranked table with a map of the same data — validates this split as the right approach for spatial-plus-list triage. The three-pane architecture earns its complexity by cutting navigation steps, not adding them.

---

**"Why T1/T2/T3/T4 tier labels on cards instead of a numeric score or color-coding alone?"**

Three reasons. First, labels communicate intent, not just rank. A numeric score of 92 on a T4 exception (exc-1002, the sanctions hold) would read as "urgent — act now." The T4-Routed label reads as "wrong tool for this decision." That distinction is a design choice, not a data display choice. Color alone can't carry that nuance.

Second, the benchmark shows that ClickUp's priority grouping works because the group header, not just the row color, carries the count and the meaning. Linear goes further and treats priority as a named, saved view — priority as a first-class concept, not a sort toggle. Kase's tier labels follow that logic: they're the primary organizing principle of the workspace, not a visual garnish on a timestamp-sorted list.

Third, numeric scores are harder to act on under time pressure. A manager needs to know "T1 means act now" — not compute where 87 sits relative to 94.

---

**"Why a carousel for the Situation Brief rather than a persistent banner or an always-open panel?"**

The carousel format was chosen because each insight — zone snapshot, priority cluster, source health, escalated items, delegated items — is structurally different and deserves focused attention without competing with the others. A banner collapses five distinct signal types into a compressed strip, requiring the manager to parse density before they've even started their shift.

The benchmark pattern from project44's Disruption Navigator is instructive by contrast: its news feed shows disruption events and shipment-impact counts in a scrollable list — which works well for ambient awareness, but not for the start-of-shift orientation moment Kase is targeting. The carousel gates each insight so Jordan processes one thing at a time. Clicking "Start shift" is an explicit commitment signal — she's not just glanced at a banner; she's cleared it. That interaction boundary matters for accountability.

---

**"Why open the exception detail in a right pane rather than navigating to a dedicated page?"**

Two reasons — one usability, one competitive.

The usability reason: a manager working through a queue needs to scan an exception, decide whether to act on it, and return to the queue. A full-page navigation means a back button, a page load, and context re-establishment on every loop. The split-pane model keeps the queue list as a persistent left-side anchor. Linear's "saved view" pattern is the clearest benchmark analogue — the list and the detail are one mental space, not two.

The competitive reason: SAP and Oracle navigate to full-page detail views, which is appropriate for planning workflows where an operator expects to dwell in one item for 10–20 minutes. Kase's use case is exception triage: Jordan needs to process 8–12 items per shift. The panel model is the right architecture for a high-volume, time-pressured triage loop, not a planning cockpit.

---

**"Why a confidence ring / donut instead of a plain text label like 'High confidence'?"**

A label like "High confidence" or "Low confidence" is a categorical judgment with no surface area for calibration. The ring renders confidence as a continuous value — 87% reads differently than 72%, and both read differently than 41% — which is important because confidence in Kase is not a binary. It's a composite of source-health weighting, data freshness, and exception-type model performance.

More importantly, the ring is the visual entry point to the Evidence tab. When Jordan sees 87% and then opens Evidence, she can trace why it's 87 — strong BorderIQ and FleetCommand signals, but OrderPulse down, so customer-tier data is stale. If the ring showed "High," there would be no question to ask. The 87% invites inspection; the label would suppress it. That is the trust design intent.

---

**"Why does the Kase copilot slide in as a side panel that reflows the main content, rather than opening as a modal or floating overlay?"**

Overlays and modals create a hard foreground/background split — the modal is "what you're doing now"; everything behind it is suspended. That's the right pattern for a one-off action (confirming a destructive operation), but wrong for a co-pilot that needs to refer back to the exception Jordan is actively working on.

The reflow pattern keeps the exception detail visible in the narrowed left pane while Kase occupies the right. Jordan doesn't lose context — she can see the confidence ring, the source attribution, and the recommended action while Kase walks her through the impact projection. The Superhuman Mail benchmark pattern shows this best: the AI edit is anchored to the text it's modifying, not displaced above it. Same principle — the co-pilot is a layer over the workspace, not a departure from it.

---

### AI Integration Design

**"Why does the T4 sanctions exception have no recommendation block at all — isn't that a missing feature?"**

It's a deliberate scope boundary, not a gap. When Kase identifies a sanctions compliance hold, it has been designed to withhold an operational recommendation because the decision doesn't belong to the operational layer. Replacing the recommendation block with a single escalation affordance is the product making an explicit claim: "I know this is outside my mandate, and I'm not going to pretend otherwise."

This is directly supported by market research. The EU AI Act, which enters enforcement in August 2026, requires that high-consequence AI recommendations in regulated domains be auditable and have clear human override paths — and the clearest audit defense is showing where the model chose not to recommend. A model that generates a routing suggestion on a sanctions hold is more dangerous than one that escalates it and waits. The T4-Routed tier is the trust mechanism, not a failure mode.

---

**"Why are override reasons structured as coded options rather than free text?"**

Free text is expressive but unqueryable at scale. If Jordan writes "I know this customer, their supply chain always has a Friday surge," that's a valid reason — but the data science team can't aggregate it against 200 other override events to find a regional pattern.

Structured reason codes — "customer context not reflected," "regional pattern," "data source lagging" — are a compromise that preserves the spirit of the override while creating a structured training signal. The benchmark shows Grammarly doing this best: beyond simple accept/reject, it offers "Incorrect suggestion" and "Offensive content" as labeled negative-feedback reasons. Kase follows the same logic — the structured code is what connects a single manager's override to a model improvement, not just a local correction.

---

**"The copilot scripts are scripted / deterministic — why not a live model?"**

This is worth being transparent about: the demo Kase is a scripted simulation of an LLM-powered co-pilot, not the live model. The interaction design — context-aware opening, step-by-step reasoning disclosure, confirm-before-execute cards — reflects how the product should behave with a real model. The scripted version exists to demonstrate the interaction architecture reliably in a demo context.

In production, the scripts would be replaced by a model that generates each response from the live exception data, with the same structural constraints (step types, confirm cards, source attribution) enforced by a response schema. The interaction surface you're seeing is the design; the model is the implementation detail. What's genuinely speculative is whether a live model would stay within the step schema consistently without fine-tuning on correction data — that's one of the three next-validation items called out in the closing.

---

**"Why show 74% AI acceptance rate prominently — isn't that admitting the AI is wrong 26% of the time?"**

This is the question the Performance page is designed to prompt. The 74% number is surfaced deliberately because the alternative — hiding override frequency or targeting 100% acceptance — would be a worse product design. A 100% acceptance rate signals that managers aren't exercising judgment; it would likely mean the tool is being rubber-stamped, which is exactly the "autopilot not co-pilot" failure mode.

26% of recommendations being modified or overridden means the model is mostly right — and when it's wrong, experts are catching it. That's a healthy human-AI collaboration ratio. The framing matters: the metric is called "AI acceptance rate," not "AI error rate." The Audit Log copilot goes further, surfacing where the 26% concentrates (customs hold: 41% correction rate) — turning an aggregate metric into a model improvement signal. This is a differentiator from how competitors frame AI performance. SAP and Oracle surface KPIs about operational outcomes; Kase surfaces KPIs about the quality of human-AI collaboration itself.

---

### Competitive Differentiation

**"How is this different from what project44, Oracle, or SAP are already doing?"**

Three structural differences, each grounded in the benchmark:

**1. We surface AI uncertainty proactively; they don't.** The benchmark found no incumbent logistics vendor that surfaces its own data-confidence gaps inline during a shift briefing. Oracle's tour leads with ML transit-time predictions without any degraded-signal disclosure. project44's Disruption Management Agent shows numbered clusters but no per-cluster confidence. Kase's Situation Brief tells Jordan which source systems are degraded *before* she acts on any recommendation — and inferred signals are labeled as such in every exception detail. That's a design choice that costs surface area and is worth defending.

**2. We disclose the reasoning; they show the outcome.** project44's closest disclosure pattern — the Initial Planned / Prediction / Reason Behind ETA three-column table — is the best "why did this rank/change" disclosure found in the entire benchmark for logistics. But it's scoped to ETA delta, not to the full exception triage decision. Kase's Evidence tab discloses every signal the model read, the weight assigned, and the flags it couldn't resolve for any exception in the queue. The Cohere and Perplexity benchmark patterns ("show your work" with literal tool calls and reasoning steps) informed this tab directly.

**3. We're building the feedback loop, not just the recommendation.** project44's Execution Recovery Agent is impressive — it logs negotiation steps, even plays back carrier phone calls as audio. But that log is a record, not a learning loop. Kase's override mechanism, reason codes, and per-ZOM leaderboard are explicitly designed to close the loop: every correction feeds labeled training data back to the model. The audit log isn't just accountability infrastructure — it's model calibration infrastructure. No incumbent in the benchmark makes that claim in their product interaction design.

**4. We don't pretend AI belongs everywhere.** The T4-Routed legal hold pattern has no equivalent in the benchmark. Every competitor either recommends an action or routes to a generic "contact support." Kase is the only design that has a principled, visible "not my decision" affordance. As the EU AI Act enforcement timeline approaches and high-consequence decision audit requirements mature, that's a design posture that will look prescient rather than conservative.

---

## Appendix G: Design Defense Q&A — Typography, Theme, and Visual Language

Pre-empting the highest-likelihood challenges on visual design decisions that go beyond layout and AI integration — specifically the choices that will be most visible to a design-literate panel.

---

### Theme

**"Why light theme? Operations tools look like command centers for a reason."**

This is the most predictable pushback and deserves the sharpest answer.

**The short version:** A command center aesthetic is appropriate when the primary interaction mode is passive monitoring — watching a wall of screens for anomalies. Kase's primary interaction mode is active judgment: reading AI summaries, weighing evidence, writing override reasons. Dark UI patterns are optimized for glanceability in low-light surveillance environments; light UI is optimized for reading dense text and making annotated decisions. Jordan is not watching a wall of screens — she is triaging 8–12 exceptions per shift, reading paragraphs, and making consequential calls. That's document-work, not dashboard-watching.

**Three structural reasons:**

1. **Cognitive load under time pressure.** The Exception Detail view is the highest-cognitive-load moment in Kase: an AI summary paragraph, a confidence score, an evidence tab with source attribution, a recommended action. Dark chrome plus dark content creates a contrast inversion problem — white card text pops, but evidence metadata becomes muddy at small sizes. A light canvas with white raised surfaces and shadow elevation is the right material for content-dense text work. The closest domain analogue — medical decision support (high-stakes, time-pressured, text-heavy) — consistently shows lower error rates on light backgrounds for reading and annotation tasks.

2. **The AI surface distinction only works against a light canvas.** The teal frosted-glass AI card — the single most important visual differentiator in the product — reads as categorically different material only because the surrounding operational chrome is neutral. On a dark theme, the AI surface would need to go brighter or more saturated to read as elevated, and the result would be an "everything glows" aesthetic that removes the signal of exactly where Kase is and isn't contributing. Restraint in the base layer is what makes AI surfaces legible as AI surfaces. That contrast is load-bearing — it's the trust hierarchy made visible.

3. **The existing expert stack is light.** SAP TMS, Oracle Fusion, internal OpsDesk — the six tools Jordan currently splits her attention across are all light-themed. A dark Kase would read as more foreign than it needs to be for a product whose adoption bet is "feels like a better version of what you already trust." Linear, GitHub, Notion, Vercel's dashboard — all light-default for the same reason: the primary mode of interaction is reading and writing, not ambient monitoring.

**If pushed hard:** "Dark mode is a valid alternative for a different product bet — one where the primary use case is ambient situational awareness from a distance. We made the opposite bet: close-range, high-stakes cognitive work. Both are defensible. Ours is grounded in the interaction model, not the aesthetic."

---

### Typography

**"Why DM Sans? Why not Inter — the industry standard — or a serif for authority?"**

**DM Sans vs. Inter — the specific difference:** Inter is engineered for UI density at 12–14px, where its tight spacing and neogrotesque letterforms maximize information in small footprints. At body and heading sizes (16–28px), that same engineering reads as slightly cold and undifferentiated when set in paragraph quantity. DM Sans has a more humanist geometry — rounder apertures on 'c', 'e', and 's', a double-story 'a', a more open 'g' — that gives sustained prose (the AI summary card, the Situation Brief narrative, the audit reasoning trace) slightly more warmth and readability without sacrificing the neutrality a SaaS tool requires. The key demo moment — Jordan reading the Kase AI summary — needs to feel like confident, trustworthy prose, not like a UI label. DM Sans handles the prose-to-label register range within a single typeface; Inter would handle the label half better than the prose half.

**Why not serif:** Serif typefaces (Freight, Tiempos, Playfair) carry an editorial authority register — journalism, consulting reports, financial documents. Kase is an operational tool, not a document. At the small label sizes that dominate the workspace card layer (tier badges, metadata chips, source tags), serif letterforms introduce rendering artifacts at non-integer pixel sizes that a geometric sans handles cleanly. The visual mismatch between a serif heading and a dense exception-card grid would read as a genre dissonance — "expensive consulting deck" instead of "expert tool."

**One typeface throughout:** The design principle is a single face, no monospace, no display supplement. This is a discipline choice: a two-typeface system (display + body, or slab + geometric) adds complexity the product has to earn through design maturity. A single face with three weights (Regular, Medium, Semibold) and a range from 13px to 28px expresses the hierarchy without a second font. It reads as confident, not decorated.

**If pushed hard:** "The alternative I'd test in a next round is Geist (Vercel's typeface) or ABC Whyte — both have a similar humanist-geometric balance at heading sizes. But Inter is an engineering team's performance choice, not a typographic one. Kase's type moments are longer-form than a typical UI, and that's the case DM Sans is built for."

---

### AI Surface Color

**"Why teal for the AI surface? That's an unconventional choice."**

Teal is reserved, not decorative. The token system has four strictly non-substitutable color roles: neutral (base surfaces), primary blue (interactive), severity red-orange (true alerts/exceptions), and teal (AI surfaces only). The fourth role had to be perceptually distinct from all three others — it could not read as an interactive element (blue), an alert state (red-orange), or a neutral surface (gray). Teal sits between blue and green in perceptual space, separated enough from the severity ramp to avoid alarm associations, and separated enough from the primary blue to avoid being mistaken for a link or button.

The practical result: a manager scanning the workspace can immediately locate Kase's active judgment — white card = operational data; teal-trimmed frosted glass = Kase's recommendation. That semantic color separation is not available in any other slot on the palette. And teal has an established association with AI-native product surfaces (Anthropic, Cohere, a generation of enterprise copilot products) without being as overdone as blue-gradient AI aesthetics. It reads as "considered, intelligent, calm" — the register the design is targeting.

---

### Confidence Ring

**"The confidence ring feels decorative. A text label would be cleaner."**

A binary label ("High / Low") flattens a continuous dimension and removes the invitation to inspect. The ring at 87% creates a specific question: *why 87 and not 94?* That question is what drives Jordan to the Evidence tab. If the ring showed "High confidence," there would be no question to ask — the label would resolve the curiosity that the number keeps open. The ring is not a gauge for its own sake; it's the trust mechanism's visual entry point. It is designed to produce a follow-up action (open Evidence), not to terminate the inquiry.

---

### Tab Structure in the Detail View

**"Four tabs in the exception detail feels fragmented. Why not fewer?"**

The tabs separate categorically different cognitive modes, not just content types:
- **Recommended Action** — decision mode: what do I do?
- **Evidence** — verification mode: why did Kase say that?
- **Progress** — status mode: what has already happened?
- **AI Summary** — orientation mode: thirty-second read-in

Collapsing these into a single scroll forces Jordan to scan through evidence signals she doesn't need when she just wants the progress stepper, and vice versa. Each tab has a distinct entry condition — a manager working quickly may skip Evidence entirely; one who distrusts the recommendation will go straight to it. Tabs are the right affordance precisely because the content categories are not equally relevant to every decision.

---

## Appendix H: Design Inspiration — Reference Apps and Influences

**"What was your design inspiration? Which existing apps — LMS or otherwise — did you draw from?"**

The design draws from three distinct categories of reference: logistics and operations tools (domain), enterprise AI products (interaction model), and mainstream SaaS tools (visual language and layout architecture). The honest answer is that no single reference inspired the product — the design emerged from placing those three layers in tension and resolving the conflicts.

---

### Logistics and Operations — What to Avoid, and What to Take

The primary competitive benchmark covered five logistics platforms, and the most instructive references were the **negative** ones:

**SAP Transportation Management** — identified as the clearest density anti-pattern. SAP's planning cockpit surfaces a Gantt chart, a live map, an info panel, and a load table simultaneously with no progressive disclosure. Everything is visible, nothing is prioritized. This is the "expert-mode cockpit" approach: assume the user knows what they want and put everything in front of them. Kase is explicitly designed against this. The three-pane layout with a ranked queue as the primary surface is the corrective: the AI pre-processes the surface, so the manager's first view is priority order, not raw data.

**project44's Disruption Navigator** — the most technically sophisticated logistics AI reference in the benchmark. Its three-column "Initial Planned / Prediction / Reason Behind ETA" table is the best precedent found for surfacing model reasoning in a logistics context. Kase's Evidence tab is a direct extension of that pattern — but expands it from ETA delta to the full exception triage decision, and makes the signal weighting and confidence gaps explicit rather than implicit. The Situation Brief's scrollable awareness feed is also informed by project44's news-feed approach, though Kase replaces scroll with carousel to enforce per-insight focus at shift start.

**FlexPort** — the closest precedent for clean, light-themed SaaS in a logistics context. FlexPort demonstrated that freight and customs workflows don't have to look like legacy ERP. The visual precedent (light canvas, card-based structure, tight typography, no decorative chrome) validated that logistics could coexist with modern SaaS aesthetics without losing operational credibility.

---

### Enterprise AI Products — How to Handle Reasoning and Trust

**Perplexity** — the primary reference for reasoning disclosure. Perplexity's "show your work" interaction pattern — surfacing sources, search steps, and the reasoning path that produced an answer — directly informed Kase's Evidence tab. The key insight from Perplexity: users trust AI answers more when they can see what the AI read to produce them, not just what it concluded. Kase's Evidence tab is that same pattern applied to exception triage: every signal the model read, the weight assigned, and the flags it couldn't resolve.

**Cohere's enterprise copilot** — referenced for the "step-by-step reasoning disclosure" pattern that Kase uses in the copilot panel. Cohere's cited-sources interface, where each claim is hyperlinked to its source document, informed the source-attribution approach in the exception detail's metadata sidebar. Every fact tied to its originating system (FleetCommand, BorderIQ, SignalTrack) with a freshness indicator is that pattern applied to operational data.

**Grammarly** — the primary reference for structured negative feedback on AI suggestions. Grammarly's "Incorrect suggestion" and "Offensive content" labeled rejection reasons (beyond simple accept/dismiss) directly informed the structured override reason codes in Kase's tier-edit modal. The key insight: a labeled rejection is a training event; an unlabeled one is just noise. Kase's structured reason codes — "customer context not reflected," "regional pattern," "data source lagging" — follow Grammarly's logic applied to exception triage.

**GitHub Copilot (in the IDE)** — referenced specifically for the "co-pilot that stays anchored to the context you're in" pattern. GitHub Copilot doesn't open a new panel that obscures your code; it completes inline, at cursor, always subordinate to the surrounding code. Kase's reflow panel — which narrows the exception detail rather than overlaying it — applies the same principle: Kase is always secondary to the operational context Jordan is in, never displacing it.

---

### Enterprise SaaS — Layout, Type, and Visual Language

**Linear** — the single most influential reference for workspace architecture. Linear's treatment of priority as a first-class concept (saved views, group headers that carry count and meaning, not just row colors) directly informed Kase's tier label design. More importantly, Linear's list-plus-detail split-pane model — where the list and the item detail share one mental space without a navigation step between them — is the direct architectural precedent for Kase's feed-plus-exception-panel layout. Linear demonstrated that a high-volume work queue can be navigated without page transitions, and that the list is the anchor point the user returns to, not an entry vestibule to leave behind.

**Superhuman** — the primary reference for the copilot panel reflow behavior. Superhuman's AI edit panel stays anchored to the email it's modifying — it doesn't open a modal above the content; it opens alongside it. When Jordan opens Kase while reviewing an exception, the exception detail narrows but stays visible in the left pane. That's Superhuman's principle applied: the AI is a layer over your work, not a departure from it.

**Notion** — referenced for the single-typeface, whitespace-first visual discipline. Notion demonstrated at scale that a light neutral canvas with generous whitespace and one well-chosen typeface at clear weight/size intervals creates an interface that feels calm and expert without being sparse. The "Structured Depth" design direction is a Notion-adjacent visual language applied to a dense operational context — the challenge being that Kase can't afford Notion's information sparsity, so elevation (shadow, not darkness) carries the hierarchy that whitespace alone can't.

**Vercel's dashboard** — the closest visual precedent for the specific combination of light theme + stat tiles + sparklines + AI narrative banners. Vercel's deployment dashboard surfaces status information in a similar format: headline KPI + trend + a short narrative explanation. The Performance page's zone narrative banner and KPI stat tiles with 6-week sparklines are directly informed by that pattern.

**Better Stack** — referenced for the ranked-table-plus-map split. Better Stack's incident dashboard pairs a severity-ranked list of incidents with a geographic heat map of the same data. The insight applied to Kase: the map isn't an alternative view of the queue — it's simultaneous spatial context for a list that is inherently geographic. Showing both without requiring the user to switch between them is the architectural decision Better Stack validated for infrastructure monitoring, and Kase carries it into logistics exception triage.

---

### One Category Deliberately Not Referenced

**Generic "AI dashboard" design kits and templates** (the Dribbble/Framer universe of dark glassmorphism, gradient mesh backgrounds, glowing card borders). This aesthetic was explicitly set aside. It communicates "AI is the primary actor" through visual saturation — every surface glows because the product is about the AI. Kase's design bet is the opposite: AI is a layer inside an expert tool, present where it's contributing a judgment and quiet everywhere else. The frosted-glass teal card reads as distinct only because the surrounding interface is not competing with it. The inspiration for restraint came from looking at what those templates looked like in operational contexts and deciding they felt like demos, not tools.
