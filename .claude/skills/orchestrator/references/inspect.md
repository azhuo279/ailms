# Inspector pathway

Triggered manually, or — commonly — by a defined routine or `/loop` on an interval. The inspector drives
the running UI through the Playwright MCP server as a simulated user, compares what it sees against the
current PRD and UX/UI heuristics, and emits a set of findings, each tagged with a criticality
(High/Medium/Low) and an issue type (PRD / UI / UX).

The orchestrator then routes each finding, runs any design exploration the plan will need, gates the
whole plan on the human, and executes only what was approved.

## Invocation modes

Inspector runs in one of two modes, determined by how the orchestrator invokes it.

**Full audit** (routine / loop-triggered, or manually requested via pathway 2)
The default. Inspector navigates every active screen, cross-references the complete PRD, and applies
UX/UI heuristics globally. This is the mode the rest of this document assumes when no scope parameter
is present.

**Targeted audit** (triggered by a PRD diff via the orchestrator's cross-cutting hook)
The orchestrator supplies the **storyteller diff manifest** as scope: each entry is a changed PRD
section/requirement plus the screen(s)/route(s)/component(s) it governs (see storyteller's
`Maintaining the PRD` rule). Because the author of the change declares the mapping, inspector does not
infer it — there is no index lookup and no lexical heading↔route guessing. Inspector restricts its work
as follows:

- **Screen set.** Navigate the screens the manifest names. Then expand by **one hop**: include any screen
  that consumes a **shared** component (from the project's shared/domain component directory) the manifest
  lists, resolved via the component's import/usage sites, so a regression introduced through a shared
  component is still caught.
  This mirrors the compose pathway's shared-surface rule. Keep it to one hop — don't transitively expand
  to the whole app.
- **Scoped navigation.** Playwright navigation is limited to that screen set. Inspector does not visit
  screens outside it.
- **Scoped heuristic checks.** UX/UI heuristics are applied only within the navigated screens and only
  for elements or patterns that the changed sections specify or imply. Global heuristics (e.g. overall
  navigation structure, cross-screen consistency) are skipped unless a changed section directly concerns
  them.
- **Scoped finding emission.** A finding is emitted only if it is traceable to at least one changed
  section — either because the affected element lives in a navigated screen, or because the finding
  references a PRD requirement that was part of the diff.

Everything downstream — the routing table, reconcile pause, influencer→inventor barrier, plan gate, and execution
— is **identical** in both modes. Targeted invocation narrows the input surface only; it does not alter
routing or gate logic.

Two edge cases, kept distinct:

- **No UI-affecting change** — the manifest names only non-UI/back-office changes, or no active screen
  implements any changed section. Inspector exits cleanly and reports that no in-scope screens were
  found, rather than silently falling back to a full audit.
- **Unresolved mapping** — a manifest entry is flagged `screen: unknown` (storyteller changed a
  requirement it could not tie to a screen). Inspector does **not** exit clean here: it flags the entry
  for the human (or audits the candidate screens it can identify), so a real change is never silently
  skipped. Don't conflate this with the no-coverage case above.

## Routing table — one row per finding

| Finding                                                       | Route                                                                  |
| ------------------------------------------------------------- | ---------------------------------------------------------------------- |
| **PRD: missing spec — simple** (clear implementation path)    | composer builds it                                                     |
| **PRD: missing spec — complex** (no implementation specified) | influencer → inventor (parallel) → 2nd review → composer builds chosen |
| **PRD: conflict / stale** (UI and PRD disagree)               | **human reconcile (blocking)** — see below                             |
| **UI bug** (layout, hierarchy, typography, rendering)         | composer fixes                                                         |
| **UX: simple** (accessibility, minor gaps)                    | composer fixes                                                         |
| **UX: complex** (needs design thinking)                       | influencer → inventor (parallel) → review → composer builds chosen     |

"Complex" anywhere means: there is real design space to explore and no obvious single answer. Those go to
**influencer → inventor**: influencer grounds the problem in frontier patterns (via Mobbin) and hands
inventor a synthesized brief, then inventor produces three directions from that grounding before anything
gets built. "Simple" means a clear, single fix — straight to composer.

**The sub-classes are derived, not tagged.** Inspector emits only `type` (PRD / UI / UX) plus a severity
(High / Medium / Low) — it does **not** label findings as missing-spec vs conflict/stale, or simple vs
complex. The orchestrator derives those distinctions by reading each finding's body (`prd`, `app`,
`heuristic`, `recommendation`) and then applies the routing table. Don't expect the sub-class to arrive in
the tag; classify it from the finding's content.

## The reconcile pause (blocking)

A PRD conflict/stale finding is genuinely ambiguous: the orchestrator can't know whether the PRD is out
of date or the UI mis-implemented the spec. This **hard-stops** for a human decision:

- **PRD is stale** → storyteller updates the PRD.
- **UI is wrong** → check fixability:
  - **simple** → composer fixes the UI to match the PRD.
  - **complex** (reconciling with the PRD needs design exploration) → influencer grounds the problem,
    then inventor produces directions (parallel) → **second review** where the human picks one → composer
    builds it.

The complex branch here cannot be pre-computed: it only becomes relevant after the human rules "UI is
wrong," so its influencer→inventor run starts after that decision and produces a second, smaller review.

## The influencer → inventor barrier

Some findings require design exploration whose output the human needs _at review time_ to choose a
direction — specifically **complex UX** findings and **complex missing-spec** findings. Each such finding
is grounded then explored as an **influencer → inventor chain**: influencer researches frontier patterns
on Mobbin and returns a synthesized brief, then inventor turns that brief into its own HTML of three
directions. These chains don't depend on any human input, so run them up front.

**Dispatch under the no-nested-subagent rule.** The chains are independent across findings, so they
parallelize — but within a chain influencer must finish before inventor starts (inventor consumes the
brief). Because a subagent cannot spawn subagents, the orchestrator owns the fan-out and runs it in **two
waves**: dispatch one influencer subagent per complex finding (parallel); as each returns its brief,
dispatch that finding's inventor subagent (parallel), passing the brief as context. Influencer does its
Mobbin search-and-triage **inside its own subagent context** (inline triage — it can't spawn its own
helper), so the preview-image tokens stay isolated there and only the text brief returns.

The inspector's final plan **cannot be presented until every inventor run has finished** — otherwise the
human would be asked to pick a direction that doesn't exist yet. Treat this as a barrier: fan out the
influencer wave, then the inventor wave, wait for all, then assemble the plan.

(The reconcile→UI-wrong→complex chain is the exception — it's triggered by a decision made _during_ review,
so it lands in the second review rather than the first.)

Both skills carry their own gates that must not stall a headless run. Influencer is read-only research, so
it runs unchanged in an **autonomous** pass. Inventor has a Step 1.5 triviality gate; the orchestrator only
fans the chains out for findings it already judged **complex**, so that gate should normally pass, and in an
autonomous run it must degrade to "proceed" (the orchestrator already made the complex call) so a headless
run produces the directions instead of stalling on a confirmation no one will answer.

## The plan gate (per-item)

Assemble one plan combining the inventor directions and every proposed action, and present it to the
human. The human's responses come in three shapes:

- **Reconcile** each PRD conflict/stale finding (PRD stale vs UI wrong) — required to action those items.
- **Pick a direction** for each inventor-attended issue.
- **Validate** the rest (yes/no).

Action only what the human answered. If they don't answer everything, the unanswered items wait; the
answered ones proceed. In an autonomous run, the entire plan waits for a human — nothing executes headless.

## Execution

Once items are approved, deploy the executing subagents under the dispatch rule: **independent fixes run
as parallel subagents; fixes that touch a shared/nested component run sequentially.** Chosen inventor
directions are built by composer. Every composer fix here runs the full compose machinery (see
`references/compose.md`).

### Direct-edit shortcut (small fixes that skip composer)

A fix that is genuinely small — a single `aria-label`, one heading insertion, one chip added with
already-defined tokens, one prop wired up, one persistent-store key, one mock-data field — may be
executed by direct `Edit`/`Write` or by a general-purpose subagent rather than dispatched through
composer. The size test is judgment-driven, not formulaic: if the fix would fit in a single `Edit`
call against an existing file and touches only tokens and components that already exist in the
codebase, direct-edit is appropriate. Anything that introduces a new component, restructures layout, invents a new token-usage pattern goes through composer, or involves significant redesign.

**Direct-edit is not a license to skip the design-system contract.** When composer is skipped on one
or more fixes in the same execution batch, a **single fresh warden subagent must run** at the end of
execution as the close-out gate, scoped to the union of all UI files the direct-edits touched.
Warden runs here in **sanity-check mode**, not the full correction loop:

- One validation pass against the design-system contract (semantic-token compliance, component
  reuse, alignment with the project's design-system spec, component-library reuse).
- If warden finds transgressions, fix them in-place (one correction round) and re-validate.
- If it still doesn't pass, escalate to the user with the transgression summary.

Files outside warden's surface — mock data (the project's mock-data directory), PRD prose (the project's
PRD directory), and other non-component edits — do not trigger this gate and are not part of the warden scope when other
fixes in the same batch do trigger it. A batch composed _only_ of mock-data and PRD edits skips
warden entirely.

The reason this rule exists: "the fix is small" is precisely when token-reuse and component-reuse
slips quietly. The contract is enforced at the gate, not in the executor's judgment, regardless of
whether composer was the executor.
