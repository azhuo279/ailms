# Feedback intake pathway

Triggered when design feedback arrives outside of an inspector audit — either from a **design
feedback/annotation artifact** (e.g. an in-browser annotation tool that links UI components directly to
pieces of feedback, where the host project provides one) or from a **user prompt** carrying one or more
feedback items aimed at the general UI and/or specific components/pages.

## Parse first

Both sources must be parsed into individual feedback items before routing. An annotation artifact typically
carries component links; a prompt may bundle several items at different scopes (whole UI, a page, a single
component). Split the input into discrete items and resolve each item's target before classifying.

If the host project provides a feedback-capture tool (an annotation plugin, a feedback store, an exported
artifact, etc.), read its feedback through that tool's documented entrypoint rather than from local files,
and plug it in here. Where no such tool exists, the feedback arrives directly in the user prompt and is
parsed from there. Either way the routing logic below is identical — only the source of the items differs.

The orchestrator fetches/parses when it needs to classify items itself (notably the simple→composer
items). Complex items are handled by the **influencer → inventor** chain, and each skill re-fetches the
feedback per its own prerequisites — so you don't need to hand them the raw feedback, just the item identity.

## Classify each item, route down one edge

Each item takes exactly one of two edges — never both:

- **Simple fix** → composer builds the fix (or, for genuinely small fixes, a direct-edit closed out by a
  warden sanity-check — see _Direct-edit shortcut_ below).
- **Complex** (needs design thinking, no obvious single answer) → **influencer → inventor**.

This is the same simple/complex judgment the inspector uses for UX findings: simple means a clear single
fix; complex means there's design space worth exploring.

## Complex items: parallel influencer → inventor chains, then build

Every item that routes to design exploration runs as its **own parallel chain**: influencer first grounds
the item in frontier patterns (via Mobbin) and returns a synthesized brief, then inventor consumes that
brief and produces a **unique HTML** of three directions for that item. Fan the chains out concurrently
(one per complex item) — and because a subagent can't spawn subagents, the orchestrator owns the fan-out in
two waves: an influencer subagent per item, then that item's inventor subagent fed its brief. Influencer
runs its Mobbin search-and-triage inside its own subagent context, so the preview-image tokens stay
isolated there and only the brief returns.

After review, the human picks a direction per item (per-item, like the inspector gate — only answered
items proceed), and composer builds each chosen direction. Composer runs its full machinery here too (see
`references/compose.md`) — including the warden gate that follows every composer build.

## Direct-edit shortcut (small fixes that skip composer)

A simple feedback item that is genuinely small — a single `aria-label`, one copy tweak, one chip added with
already-defined tokens, one prop wired up — may be executed by direct `Edit`/`Write` (or a general-purpose
subagent) rather than dispatched through composer, exactly as in the inspector pathway's direct-edit
shortcut (see `references/inspect.md` — _Direct-edit shortcut_). The size test is judgment-driven, not
formulaic: if the fix would fit in a single `Edit` against an existing file and touches only tokens and
components that already exist, direct-edit is appropriate. Anything that introduces a new component,
restructures layout, or invents a new token-usage pattern goes through composer. Complex items never
qualify — they are already routed to inventor.

**Direct-edit is not a license to skip the design-system contract.** When composer is skipped on one or
more items in the same execution batch, a **single fresh warden subagent must run** at the end of the batch
as the close-out gate, scoped to the union of all UI files the direct-edits touched. Warden runs here in
**sanity-check mode**, not the full correction loop:

- One validation pass against the design-system contract (semantic-token compliance, component reuse,
  alignment with the project's design-system spec, component-library reuse).
- If warden finds transgressions, fix them in-place (one correction round) and re-validate.
- If it still doesn't pass, escalate to the user with the transgression summary. In an autonomous run this
  escalation degrades to waiting like every other gate — warden produces its summary read-only and the
  still-failing items fold into the single queued plan for the next human review.

Items routed through composer are already gated by composer's own warden correction loop (see
`references/compose.md`); this end-of-batch sanity check covers only the items that skipped composer. Files
outside warden's surface — mock data (the project's mock-data directory) and PRD prose (the project's PRD
directory) — do not trigger the gate, and a batch composed only of those skips warden entirely.

The reason this rule exists is the same as in the inspector pathway: "the fix is small" is precisely when
token-reuse and component-reuse slips quietly. The contract is enforced at the gate, not in the executor's
judgment, regardless of whether composer was the executor.

## Dispatch

Simple composer fixes follow the standard rule — parallel when independent, sequential when they share a
component or region. Genuinely small fixes may instead be direct-edited, closed out by the single
end-of-batch warden sanity-check above. Complex items always fan out as parallel influencer→inventor
chains (two-wave: influencers, then inventors fed their briefs). Because the orchestrator only routes
**complex** items down this edge, inventor's own Step 1.5 triviality gate should normally pass; in an
autonomous run it must degrade to "proceed" rather than stall waiting for a confirmation no one will
answer, and influencer (read-only research) runs unchanged headless.
