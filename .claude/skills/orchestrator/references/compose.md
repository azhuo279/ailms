# Compose pathway

Triggered when the instruction is to build or change a UI screen, component, page, or flow from a spec,
journey, flow, or set of requirements. Composer leads; the orchestrator sequences the helper skills around
it.

## The shape

```
[storyteller]          IF intent is undefined (redesign/transform, no flow/stories) — BEFORE composer
        ▼
composer (build the UI)
        │   └── animator   composer-internal (its own Step 10 motion gate) — NOT orchestrator-dispatched
        ▼
WARDEN GATE            ALWAYS — fresh orchestrator-dispatched subagent, immediately AFTER every composer build.
        │              Validates the coded component (token + component-reuse compliance). Drives the
        │              orchestrator-mediated correction loop (≤3 composer outputs) to a pass or escalation
        ▼              BEFORE any downstream step runs. See "warden gate" below.
ELEVATION GATE         CONDITIONAL, RARE — only if composer flagged a component ELEVATE (Step 11a) and
        │              warden passed it. Promotes the file into the canonical component library and
        ▼              dispatches architect to mirror it into Figma + wire Code Connect. See below.
[storyteller]          IF the output shifts the PRD — sequential, AFTER the gate(s) above clear
```

Nothing in this pathway is a parallel helper group. Composer owns animator internally; the **warden gate**
always follows the composer build (in a fresh subagent) and must reach a pass or escalation before anything
downstream runs; the **elevation gate** follows warden but fires rarely; and the PRD-update storyteller runs
_after_ both, because it operates on the files composer produces — which warden may have just had composer
correct. Upstream storyteller, when needed, runs _before_ composer because composer consumes its output as
intent.

## storyteller upstream — if intent is undefined, beforehand

If the request is a redesign, transformation, or net-new feature with **no defined flow or stories**
(e.g. "we're redesigning X, build it"), the intent composer needs doesn't exist yet. Run storyteller
**first** to produce the journey/flow/stories under the project's docs directory, then composer builds
from them. For redesigns
this is where storyteller's as-is/to-be discipline applies — never hand composer a to-be build with no
as-is baseline. Skip this when the request already carries a usable flow, spec, or Figma-derived input.

## animator — composer-internal, not dispatched

Composer decides whether the thing being built should animate via its **own Step 10 motion gate** — which
_usually skips motion_ and only invokes the animator skill for elements that pass the gate. The orchestrator
does **not** dispatch animator as a separate subagent: doing so would double-handle it and, because animator
needs composer's concrete element/state-change decisions, could not run before composer anyway. Let composer
run its machinery.

- If composer's gate passes and animator returns motion specs, composer implements them.
- If animator determines motion is warranted but lacks implementation detail for the specific case,
  composer **falls back to a web search** for current best practices, then implements from that.

## warden gate — always, after every composer build, in a fresh subagent

Every composer build is followed by a **warden** pass. This is non-negotiable and invocation-agnostic: it
fires whether composer was reached through this pathway, a direct invocation (pathway 4), or an inspector- or
feedback-routed fix. Wherever composer produces a coded component, the warden gate follows it.

**Dispatched, not internal — and deliberately so.** Unlike animator (composer-internal), warden is
dispatched by the orchestrator as a **new subagent with a fresh, unbiased context window**. It must not run
inside composer's context: a warden that inherited composer's reasoning would also inherit composer's
rationalizations for why a hardcoded value or a bespoke component "was fine." The fresh context is the whole
point — warden reads the produced artifacts cold and judges them on their own terms.

**What the warden subagent receives** — artifacts only, never composer's reasoning: the generated code
paths, the component manifest, the location of the project's design-system spec (if one exists) and the
component library, and (if available) the Component Library Figma file link. See `warden`'s SKILL.md for
what it does with them.

**The orchestrator-mediated correction loop.** Warden owns the validation logic, the per-transgression
ledger, the correction briefs, the attempt accounting, and the escalation summary — but the orchestrator
mediates the dispatch so every pass stays in fresh context:

1. Dispatch composer → it builds and returns (this is **output 1**).
2. Dispatch a **fresh warden** subagent on the artifacts.
3. **Pass** (no blocking transgressions) → the gate clears; proceed downstream.
4. **Blocking + attempts remain** → re-dispatch composer with warden's correction brief (**output 2**, then
   **output 3**), and after each correction dispatch a **fresh warden**, carrying forward only the prior
   **ledger** (structured findings + per-attempt status — data, not composer's reasoning) so it can compute
   trajectory while still reading the code cold.
5. **Third output still blocking** → **escalate** (human gate) with warden's transgression summary and
   per-attempt trajectory. Bound: **at most 3 composer outputs** (original + 2 corrections).

**Recursion guard.** A composer run that is itself a warden correction is part of the _in-flight_ warden
loop — it continues the same loop and the same attempt counter; it does **not** start a new, independent
warden cycle with a reset count. Only a fresh _build_ opens a new cycle (its first output is attempt 1).

**Why the gate sits before the downstream steps.** The PRD-update storyteller reacts to the finished build
and operates on the very files warden may force composer to rewrite. Running it before the gate settles
would mean documenting a component that is about to change — a shared-surface collision and wasted work.
So the gate must reach a pass (or escalation) **before** the downstream storyteller run.

**Interactive vs autonomous.** The correction loop needs no human input, so it runs in the headless
production pass in autonomous mode. Only the **escalation** is a human gate: per the orchestrator's
autonomous rule it degrades to waiting — warden produces its summary read-only, and the still-failing build
plus that summary fold into the single queued plan for the next human review rather than shipping. A clean
pass (with any advisories or legitimate token gaps noted) proceeds normally.

## elevation gate — conditional, rare, after warden passes

If composer's output manifest flags a component `ELEVATE` or `BORDERLINE` (Step 11a: judged
against "is this likely to be reused?") **and** the warden gate passed it, the orchestrator acts
on the verdict before moving downstream:

- **`ELEVATE`** — proceed automatically:
  1. **Promote the file** into the project's canonical component library location
     (`src/components/ui/` or `src/components/shared/`, matching where similar existing
     components live) if composer didn't already build it there.
  2. **Dispatch `architect`** (Direction B — see its SKILL.md) on that component: mirror it into
     the Figma design-system file as its own page, publish, and wire Code Connect. This is the
     same human-checkpoint flow architect always uses (token plan / page structure / per-component
     sign-off do not re-run here — only the per-component checkpoint applies, since the token
     layer isn't touched).
- **`BORDERLINE`** — composer flagged genuine uncertainty about reuse. This is a **human gate**:
  present the component and composer's reasoning, and only promote + dispatch architect on
  approval. In an autonomous run this degrades to waiting per the orchestrator's autonomous
  rule — it folds into the queued plan rather than resolving itself either way.
- **Skip entirely** when composer flagged nothing, or when the flagged component didn't survive
  the warden loop (an escalation means nothing gets promoted or pushed).

This gate fires rarely by design — most composer output reuses or lightly varies existing
components, which never reach Step 11a. It exists so a genuinely new, reusable component
doesn't silently drift out of sync with the design-system's Figma mirror the way it would if
architect only ran on direct invocation.

**Interactive vs autonomous.** The promotion (file move) is mechanical and can run headless. The
architect dispatch itself follows architect's own checkpoint behavior — in an autonomous run its
per-component sign-off degrades to waiting, per the orchestrator's autonomous rule, and folds
into the same queued plan as any other pending review from this run.

## storyteller downstream — if the PRD should change, afterward

For any component/feature/screen composer outputs, judge whether it warrants a PRD update (new behavior,
changed flow, a spec that no longer matches what was built). If it does, invoke storyteller **after**
composer's output to rewrite the relevant PRD section in the project's PRD directory (storyteller owns this — see its
SKILL.md). Because this reacts to the finished output, it is sequential, never concurrent with the build.

## Note on reuse from other pathways

When the inspector pathway or the feedback pathway routes a fix to composer, that composer run is this
same pathway — composer still runs its own animator gate, **the warden gate still follows the build**,
and storyteller still updates the PRD afterward (if the spec shifts). Inspector- or feedback-triggered
composer fixes are not "bare" builds — and, like every other composer build, they do not ship until
warden clears them.
