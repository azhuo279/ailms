---
name: orchestrator
description: >-
  Front door and router for the UI design-and-build workflow. EVERY instruction,
  whether typed by a user or fired by a scheduled routine or /loop, passes through this skill first.
  It classifies the request, dispatches the right downstream skill(s) (storyteller, composer, animator,
  inspector, inventor, influencer, warden, architect) as parallel or sequential subagents, runs the human
  approval gates, and stops to flag anything it has no defined pathway for. Use this whenever someone asks to
  build/compose/change a UI screen or component; audit or review a UI against the PRD; process design
  feedback (from a feedback/annotation artifact or a prompt); add motion; explore frontier
  design patterns/best practices to ground a design before generating options; validate or gate
  generated UI against the design system and component library; scaffold, extend, or sync design tokens
  and Code Connect against Figma; write or update user journeys/flows/stories
  or the PRD; or invoke any one of those skills directly. Also use it for any instruction spanning more than one
  skill.
---

# Orchestrator

This skill is the single entry point for the UI design-and-build system. Eight specialist skills do the
real work — `storyteller`, `composer`, `animator`, `inspector`, `inventor`, `influencer`, `warden`,
`architect` — and this skill decides which of them run, in what order, what runs concurrently, and where
a human has to weigh in. It does not produce UI artefacts itself; it routes and coordinates.

The reason a router exists at all: most real instructions touch more than one skill, several skills must
fan out into parallel subagents to finish in reasonable time, and a few transitions are unsafe to make
without a human in the loop. Hard-coding that coordination once, here, keeps every downstream skill
focused on its own job.

## The first rule: route everything, flag the unknown

Every instruction — a user prompt or an automated routine/loop tick — is matched against the known
pathways below. There are exactly two outcomes:

- **It matches a pathway** → run that pathway.
- **It matches nothing** → **stop and flag the user.** Do not improvise a new pathway on the fly.

The flag matters because an unmatched instruction is usually not a one-off. It is a signal that the
orchestrator's coverage is incomplete and should be extended deliberately (a new pathway, a new link)
rather than patched ad hoc inside a single run. Say plainly what was requested, why no pathway covers
it, and ask how to proceed. In an autonomous run (see below) where no human is present, record the
unmatched instruction and halt that branch rather than guessing.

## Know which context you are in: interactive vs autonomous

The orchestrator behaves differently depending on whether a human is present to answer gates.

- **Interactive** — a person typed the instruction and is waiting. Gates pause and ask; the person
  answers and the run continues.
- **Autonomous** — a scheduled routine or an active `/loop` fired the instruction with nobody watching.
  Gates cannot block on input that will never come, so they **degrade to waiting**: the run produces
  everything it can without human input (including any subagent outputs the human will need to review,
  e.g. inventor directions), assembles the plan, and then **queues it for human review instead of
  executing**. Nothing that requires a human decision — validation, reconciliation, or picking a
  direction — executes headless. The next human review picks up the queued plan and only the answered
  items proceed.

Detect the context from how the run was triggered, and carry it through the whole run; it changes only
what the gates do, not which skills run.

## The dispatch model

Downstream skills run as **subagents via the Task tool**. There is no dedicated per-skill agent type, so
"dispatch skill X as a subagent" means: spawn a general-purpose Task agent and instruct it to invoke skill X
via the Skill tool. The coordination rules below govern timing regardless of how the subagent is spawned.

Two coordination rules govern how:

- **Parallelize independent work.** When two pieces of work don't depend on each other, dispatch them
  as concurrent subagents. This is the default whenever independence holds — e.g. one inventor subagent
  per complex finding or feedback item, or independent composer fixes across non-overlapping components.
- **Serialize work that shares a surface.** If one task's edits land inside a component (or region) that
  another task also touches, run them sequentially. Concurrent edits to a shared component collide and
  produce incoherent results, so shared-surface work is ordered, not raced.

A practical test before fanning out: _could these two subagents each finish correctly without seeing the
other's output or touching the other's files?_ If yes, parallel. If no, sequence them.

## The human gates

Three gate shapes recur. All of them follow the interactive/autonomous rule above.

- **Per-item approval gate.** When a plan bundles several proposed actions, present them together and let
  the human respond item by item. Only items that are answered/validated get actioned; unanswered items
  simply don't run (they are not auto-approved and not auto-rejected — they wait). Never block the whole
  plan on one unanswered item.
- **Reconcile pause (blocking).** Some findings are genuinely ambiguous — the orchestrator cannot know
  whether the spec or the implementation is the source of truth. These hard-stop until a human decides.
  See `references/inspect.md`.
- **Second review.** A few decisions create follow-on work that itself needs a human choice (e.g. the
  human rules "the UI is wrong," that fix turns out to be complex, an inventor run produces directions,
  and the human must then pick one). That produces a second, smaller review after the first. Don't try to
  pre-compute work that depends on a decision the human hasn't made yet.

## The pathways

Match each instruction to one of these. Load the matching reference file before running that pathway —
each holds the detailed routing, dispatch grouping, and gate behavior for its pathway.

0. **Design system scaffolding** — extend or maintain the token layer or the code↔Figma sync without
   composing a screen. Architect-led. Signals: "add a token," "our colors/tokens are a mess," "sync this
   component to Figma," "set up Code Connect," "audit our design-system Figma sync," or a brand guide with
   no tokens yet — **without** a UI screen/component as the primary requested output (a request to build a
   screen that happens to need a new token still routes through pathway 1; composer creates the token
   inline per its own Step 5/11 rules, it does not need architect for that).

   Execution:
   - Token-only work (editing the token source) is a direct architect edit — no composer, no warden;
     tokens are a data layer, not a UI component.
   - Pushing a component to Figma / wiring Code Connect (architect Direction B/E) requires a registered
     Figma design-system file — if none exists yet, architect asks for the file URL before that leg.
   - Human gate: architect's own checkpoints apply (token plan, file/page structure, per-component
     sign-off) — see `architect`'s SKILL.md. The orchestrator does not add a separate gate on top.
   - Direction D (audit) reports findings for the user to pick from; apply picked fixes via the same A/B/C/E
     flows.

1. **Compose UI** — build or change a screen/component/page from a flow, spec, journey, or requirement.
   Composer-led. Composer owns its own animator (Step 10 motion gate) internally — the orchestrator does
   not dispatch animator separately. storyteller runs **before** composer when the intent is undefined
   (a redesign/transform with no flow or stories). **Every composer build is then followed by the warden
   gate** — a fresh orchestrator-dispatched subagent that validates the coded component for design-system
   compliance and drives a bounded correction loop to a pass or escalation **before** anything downstream
   runs. **After warden passes, the elevation gate runs (rarely):** for any true net-new component (no
   existing equivalent) composer flagged `ELEVATE` in its Step 11a manifest, the orchestrator promotes the
   file into the canonical component library and dispatches `architect` (code→Figma + Code Connect) so it
   becomes a canonical, reusable design-system component. storyteller (if the output shifts the PRD) runs
   **after** the gate(s) clear. That downstream storyteller run aligns the PRD to the UI just built, so it
   does **not** fire the targeted-inspector hook (see below). See `references/compose.md`.

2. **Inspector audit** — audit the running UI against the PRD and UX/UI heuristics, then route, gate, and
   repair each finding. Commonly fired by a routine/loop. Approved fixes execute either through composer
   (which carries its own warden correction loop) or, for genuinely small fixes, by direct-edit — in which
   case a **single warden sanity-check subagent runs at the end of the batch**, scoped to the union of UI
   files touched. The contract is enforced at the gate regardless of which executor ran the fix. See
   `references/inspect.md`.

3. **Feedback intake** — a list of design feedback arriving from a feedback/annotation artifact or a user
   prompt; parse it, classify each item, and route simple items to a fix and complex items to design
   exploration (**influencer → inventor**). See `references/feedback.md`.

4. **Direct skill invocation** — a one-off request that maps cleanly to a single skill (e.g. "run the
   animator on this drawer," "write stories for this flow," "audit my UI," "give me
   variants for this feedback," "research how the best apps handle this screen," "build this screen,"
   "validate this screen against our design system," "sync this component to Figma," "set up Code Connect
   for Button").
   Route straight to that one skill, skipping the composite-thread wrapping. Note: a direct invocation
   **still runs that skill's own machinery** — if the target is composer, composer still invokes animator
   and the rest exactly as defined; "direct" only means the orchestrator isn't wrapping it in pathways 1–3,
   not that the skill runs stripped down. **The warden gate is not part of that pathway-1–3 wrapping that
   direct invocation skips — it is universal.** A direct "build this screen" composer run is still followed
   by a fresh warden subagent exactly as in pathway 1; warden follows every composer build regardless of how
   composer was reached. When the direct target is storyteller and the run produces PRD changes, that is a
   driver edit, so the cross-cutting hook below applies.

Pathways are not mutually exclusive across a session: a single instruction may match one pathway, and a
gate inside that pathway may later spawn another (an inspector finding routes into a composer build,
which itself runs the compose machinery). Compose the pathways; don't flatten them.

## Cross-cutting hook: PRD diff → targeted inspector

This hook fires only when a PRD change is the **driver** of the work — a direct PRD edit (pathway 4),
or a spec change that precedes implementation. It does **not** fire when the PRD change is a
**consequence** of a UI change: the pathway-1 post-compose storyteller, the reconcile "PRD stale →
storyteller" branch (see `references/inspect.md`), and any targeted-fix → downstream storyteller run all
align the PRD to UI that is already the source of truth, so re-auditing that UI would be circular. That
exclusion is also what guarantees a hook-fired audit's own composer fixes can't re-arm the hook.

Steps the orchestrator performs:

1. **Consume the diff manifest.** A driver PRD edit is made by storyteller, which returns a structured
   PRD-diff manifest as its output (see its `Maintaining the PRD` rule). Each entry is a changed
   section/requirement plus the screen(s)/route(s)/component(s) it governs. The orchestrator does not
   snapshot or re-diff the PRD — the author of the change declares what changed.
2. **Trigger.** If the manifest names any UI-affecting change → invoke inspector in **targeted mode**,
   passing the manifest as scope. See `references/inspect.md` — Targeted invocation.
3. **Skip.** If the manifest is empty or names only non-UI changes → no inspector run.

The targeted inspector is a **dependent step**: it runs after storyteller completes, never concurrently.
All standard inspector routing, gate, and execution rules apply — the scope only narrows which screens
and sections inspector examines, not how it handles what it finds. In an **autonomous** run the hook's
targeted audit runs read-only within the same headless production pass, and its findings fold into the
**single** queued plan for the next human review — the hook never opens a second, independent review cycle.

## The skill registry

The eight skills this orchestrator coordinates, and what each is for:

- **storyteller** — produces UX artefacts: user journeys, flows, stories, blueprints; also rewrites PRD
  sections when the spec changes.
- **architect** — owns the design-system foundation: tokens (the Tailwind `@theme` block) and the
  code↔Figma sync via Code Connect, keeping code as source of truth and Figma as a generated mirror. The
  orchestrator dispatches it for pathway-0 token/Figma work and for the **elevation gate** — which fires
  rarely: only after warden passes on a true net-new component flagged `ELEVATE`, which architect then
  pushes code→Figma + Code Connect. See `references/compose.md` (elevation gate).
- **composer** — builds production UI screens/components from a flow or spec, reusing the real design
  system; consults animator internally via its Step 10 motion gate. Any PRD-update storyteller run
  happens after composer (sequenced by the orchestrator), not inside it. Every composer build is
  followed by the warden gate (below), dispatched fresh by the orchestrator — not composer-internal.
- **animator** — decides whether something should animate and, if so, supplies grounded motion specs.
- **inspector** — audits a running Next.js UI against the PRD and heuristics via Playwright MCP, emitting
  tagged findings (criticality + PRD/UI/UX). Supports two invocation modes: full audit (all screens,
  complete PRD) and targeted audit (scoped to the storyteller-supplied PRD-diff manifest).
- **inventor** — turns one piece of feedback (or finding, or missing/complex spec) into three design
  directions rendered as one self-contained HTML for review. When the problem warrants exploration,
  **influencer runs first and inventor consumes its brief** as starting context, so the directions begin
  from proven frontier patterns rather than a blank slate.
- **influencer** — explores frontier UX/UI design patterns via the **Mobbin MCP**, synthesizes recurring
  best practices into an implementation-grounded brief (reporting where the frontier has converged vs.
  forks), and hands it to inventor. Runs **upstream of inventor** wherever a complex problem goes to design
  exploration (inspector complex findings, the reconcile UI-wrong-complex branch, feedback complex items);
  also directly invocable for standalone pattern research. Deliberately **design-system-blind** — grounding
  in the design system happens downstream at composer. See `references/inspect.md` and
  `references/feedback.md` for where it sits in each pathway.
- **warden** — validates a coded component change against the design system (the project's design-system
  spec, if one exists) and component library, on two dimensions only: semantic-token compliance and
  component reuse (with a Figma Component Library fallback for designed-but-unbuilt components). Always
  dispatched as a **fresh subagent** — never
  composer-internal — so its context is unbiased. Runs in two modes:
  - **Correction loop** — after a composer build (pathway 1, and direct composer invocations in pathway 4):
    drives a bounded correction loop of ≤3 composer outputs to a pass or escalation. See
    `references/compose.md`.
  - **Sanity check** — after a direct-edit batch that skipped composer (pathway 2's _Direct-edit shortcut_,
    and the equivalent in pathway 3's simple→direct route): one validation pass scoped to the union of
    files the direct-edits touched; one in-place correction round if needed; escalate otherwise. See
    `references/inspect.md` — _Direct-edit shortcut_.

  Owns the validation ledger, correction briefs, and escalation; the orchestrator mediates either loop.
  Mock data (the project's mock-data directory) and PRD prose (the project's PRD directory) are outside
  warden's surface and do not trigger the gate on their own.

## Reference files

- `references/compose.md` — the compose pathway: storyteller upstream (conditional, when intent is
  undefined), animator (composer-internal Step 10 gate, with a web-search fallback), the warden gate (always,
  a fresh post-composer subagent with an orchestrator-mediated correction loop), the elevation gate
  (conditional and rare, after warden passes — promotes an `ELEVATE`-flagged true net-new component to the
  canonical component library and dispatches architect to make it canonical), storyteller downstream
  (conditional, after the gates, for PRD).
- `references/inspect.md` — the inspector pathway: invocation modes (full vs. targeted), finding routing
  table, the reconcile pause and its second review, the influencer→inventor exploration chains and their
  barrier, the per-item plan gate, and dependency-aware execution.
- `references/feedback.md` — the feedback-intake pathway: parsing feedback-artifact/prompt input and the
  simple→composer / complex→influencer→inventor split.
