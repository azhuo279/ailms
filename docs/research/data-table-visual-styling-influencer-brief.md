# Influencer brief: visual/structural styling of data tables (row, border, spacing, elevation)

## The need

The core data grid used across a fleet/logistics/shipments management SaaS — the surface an
operator scans continuously to review shipments, orders, and exceptions. This exploration is
scoped **strictly to the presentation layer** of the table: how rows, borders, dividers, spacing,
and elevation are visually treated. It is explicitly **not** about workflow/triage features
(saved views, filter chips, grouping, segmented tabs, bulk-action bars) — a prior exploration
already covers that ground. The question here is narrower and purely visual: when a strong
SaaS/ops/analytics product draws a row, what does the row itself look like, and what separates it
from the row above and below it?

Constraints: web-only; the resulting treatment must keep row selection (checkboxes), status
badges/chips, and column sort affordances fully functional and legible — this is a redesign of
surface treatment, not of interaction model or density.

## Generalized patterns explored

The need decomposed into seven searchable sub-problems, run as focused `search_screens` queries
(`platform: web`, `limit: 4-5` each, deep mode), ~31 screens triaged before narrowing to
confirmed finalists:

1. Card-like, visually separated rows with gaps (rows reading as individual blocks)
2. Fully borderless tables relying on whitespace/typography instead of dividers
3. Zebra striping — alternating row background treatment
4. Logistics/ops tables carrying status badges and checkboxes (functional baseline check)
5. Row hover state with shadow/elevation lift
6. Dense financial/trading tables with minimal dividers (stress-test at high row density)
7. Admin/ops tables with sortable headers, checkboxes, and hairline-only dividers
8. Fleet/device-management list tables with status indicators (closest domain analogue)
9. Alternating white/light-gray striping in enterprise software (direct test of the zebra pattern)

Two supporting queries returned no usable matches: literal "card-like separated rows with
visible gaps" returned adjacent list-of-cards UIs (financial account cards, CRM record panels)
rather than genuine dense data grids, and an explicit "row hover shadow/lift" query returned zero
results — both are treated as findings in their own right (see Convergence vs. divergence).

## References (from Mobbin)

**1. Fresha — client list table (fully borderless)**
[mobbin.com/screens/77260bad-dd3d-4ba6-8db8-cd9fefa57982](https://mobbin.com/screens/77260bad-dd3d-4ba6-8db8-cd9fefa57982)
No visible grid lines or row dividers anywhere in the body. Rows are separated purely by
generous vertical padding, a consistent baseline rhythm, and an avatar-plus-two-line text block
per row. The only color in the row is a semantic status chip (red/amber/green) at the right edge,
which reads instantly precisely because nothing else on the row competes with it. Column headers
carry a sort caret but no header underline/border beyond a faint hairline under the whole header
row. This is the cleanest realization of the "borderless" pattern.

**2. Attio — CRM company table (hairline dividers, selective column divider, dense)**
[mobbin.com/screens/221f159e-b623-47fd-a186-89173dddc092](https://mobbin.com/screens/221f159e-b623-47fd-a186-89173dddc092)
A genuinely dense multi-column data grid (10+ columns, 20+ visible rows) that still reads as
calm. Row dividers exist but are extremely low-contrast — barely darker than the row background —
so they register as rhythm rather than as heavy grid structure. Notably, one vertical divider is
used deliberately to freeze/separate the leading identity column (checkbox + name) from the
scrolling data columns, i.e. a divider used selectively for a structural purpose rather than a
uniform grid. Checkbox and sort caret both sit inline in the header/row without extra visual
weight.

**3. Fey — financial ratings/insider-trades table (dark mode, dense, near-borderless)**
[mobbin.com/screens/1b7d8583-92b5-45cc-9961-48d0ddeff112](https://mobbin.com/screens/1b7d8583-92b5-45cc-9961-48d0ddeff112) and
[mobbin.com/screens/f5c31c11-16b7-426c-87a7-f6e5c4c203aa](https://mobbin.com/screens/f5c31c11-16b7-426c-87a7-f6e5c4c203aa)
Stress-tests the borderless approach at high density and in dark mode, where grid lines are
usually assumed necessary to stop rows from blurring together. Instead, rows are separated by
whitespace alone; the selected/active row is called out with a single accent-colored left border
rule (a "flag," not a full-row treatment) and numeric columns are right-aligned and tabular so the
eye tracks columns without needing vertical rules. Directional/negative values use color
(red/green) rather than iconography, keeping the row visually quiet everywhere else.

**4. Tailscale — device management table (borderless, hover-only affordance)**
[mobbin.com/screens/df8e39bc-0025-4b45-916b-a620ca633c91](https://mobbin.com/screens/df8e39bc-0025-4b45-916b-a620ca633c91)
The domain-closest analogue to a fleet/asset list (rows = managed devices, each with a live status
dot, tags, and metadata columns). No dividers between rows; a subtle background-tint change is the
only separator, reserved for hover rather than shown at rest. Status is carried entirely by a small
colored dot plus label, never a heavy badge, which keeps rows visually light even with 4-5 data
points per row.

**5. Clay — spreadsheet-grid table (hairline grid + tinted selection, divergence case)**
[mobbin.com/screens/1b7d8583-92b5-45cc-9961-48d0ddeff112](https://mobbin.com/screens/14020139-fdf1-4860-8301-210d0148a649)
Included as the counter-example / divergence case. Clay renders a full spreadsheet-style grid
(both horizontal and vertical hairlines) because the product's job is literal cell-level editing.
Selected rows get a flat lavender-tint background applied uniformly — this is a **selection
state**, not zebra striping, and it is the closest thing to "alternating row color" found anywhere
in the sample; true zebra striping (alternating treatment at rest, independent of selection) did
not appear in any strong exemplar. Useful as a boundary marker for when a fuller grid is
justified (cell-level data entry) versus when it isn't (read/scan/act tables).

## Best-practice synthesis

**1. Whitespace and typography do the separating work, not lines.** Across every strong
exemplar (Fresha, Attio, Fey, Tailscale), the primary separator between rows is consistent
vertical rhythm (padding) and a clear type hierarchy (primary label weight/color vs. secondary
metadata muted), not a drawn rule. Rationale: a hairline or absent divider keeps the eye moving
horizontally across a row instead of registering the grid as a structural object in its own
right — reduces visual noise at scan speed, which matters most exactly when row counts are high.

**2. When a divider is used, it is low-contrast and often partial, not uniform.** Attio's
divider is barely-there and is applied selectively (separating a frozen identity column) rather
than as a uniform full grid. The dividers that do appear in strong products read as a faint
rhythm cue, never as a heavy rule competing with content.

**3. Status carries color; the row does not.** In every exemplar, saturated color is reserved
for the status chip/dot/badge and occasionally a directional numeric value (red/green). The row
background itself stays neutral at rest. This preserves the badge's job as the fastest scan
target — if the row itself were tinted, badges would have to compete with row-level color for
attention.

**4. Hover is where elevation/emphasis lives, not the resting state.** No exemplar showed
rows with shadow/elevation at rest ("floating cards"); the literal "shadow on hover / lift"
query returned zero Mobbin matches, suggesting that pattern is not a current frontier practice
in dense ops/analytics tables (it's more common in marketing/content card grids, a different
UI class entirely). Where hover is used (Tailscale, Attio, Clay's row highlight), it is a flat
background-tint shift, not a shadow or transform.

**5. Card-like, gapped rows appear at low row-density / low-column-count only, not in dense
grids.** The card-separated-row pattern (visible gaps, rounded-corner blocks per row) showed up
consistently in board/list contexts (Trello, Todoist, Slack lists) but never in a genuinely
dense, multi-column, sortable/checkable data grid. This is a meaningful boundary: gapped-card
rows are a pattern for shallow, low-column lists (3-5 fields, task-card mental model), not for
operational data tables carrying 6+ columns, sort, and selection.

**6. True zebra striping (alternating row background at rest) is rare to the point of absence
in the current frontier sample.** The only alternating-background behavior found was Clay's
uniform selection-tint, which is state-driven, not a static stripe pattern. This suggests zebra
striping has fallen out of favor in modern SaaS/ops tables in favor of whitespace + hairline
approaches — treat it as a legacy pattern rather than a frontier default.

## Convergence vs. divergence

**Convergence (high confidence — 4 of 5 exemplars agree):** the frontier has settled on
**borderless-to-hairline row treatment**, where separation comes from padding and typography
first, with at most a very low-contrast divider as a secondary cue. This holds true across light
mode (Fresha, Attio), dark mode (Fey), and domain-adjacent ops tooling (Tailscale). Recommend
this as the strong default direction for any redesign.

**Convergence (high confidence):** color is reserved for status/semantic signals (badges, chips,
directional values), not applied to row backgrounds at rest. Recommend keeping row backgrounds
neutral regardless of which divider/border treatment is chosen.

**Divergence / boundary case:** full-grid, hairline-both-axes styling (Clay) remains legitimate,
but converges specifically around **cell-level editing / spreadsheet-like manipulation** use
cases, not scan-and-act row review. This is a fork based on task, not aesthetic preference — if
the table's job is "review and act on rows," the borderless/hairline direction applies; if the
job is "edit individual cell values directly in the grid," a fuller grid remains justified.
Inventor should treat this as a decision point tied to the table's actual job, not a free
stylistic choice.

**Divergence / open fork:** whether a divider should be fully absent (Fresha) or present but
minimized (Attio, Fey) is not settled by the sample — both are strong, shipped, current
patterns. This is a genuine fork for inventor to explore as two distinct directions rather than
a single converged answer.

**Notable absence, worth flagging as a negative finding:** neither "card-like gapped rows in a
dense grid" nor "shadow/hover-lift elevation on rows" produced any strong or even mediocre match
among true operational/analytics data tables. Both patterns exist in adjacent UI classes (task
boards, content card grids) but do not appear to be current frontier practice for dense,
sortable, selectable data tables. Inventor should treat these as higher-risk/unproven directions
if pursued, not as safe defaults.

## Implementation specs

**Pattern A — Borderless row treatment (primary recommendation)**
- *Components:* table row, cell, header cell, status indicator (dot or chip), checkbox, sort
  affordance.
- *Layout/hierarchy:* remove horizontal rules between body rows entirely; rely on consistent
  vertical padding (generous enough that rows don't visually merge, tight enough to keep scan
  density) and a two-tier type treatment — primary field at full-emphasis color/weight, secondary
  metadata fields muted. Keep a single faint rule (or none) under the header row only, to anchor
  where data begins.
- *States:* at rest, no background differentiation between rows. On hover, a flat, low-opacity
  background tint across the full row (not a shadow, not a transform) signals interactivity. On
  select, a slightly stronger flat tint than hover, applied uniformly to the row background — this
  is the one place a "highlight fill" is earned. Loading and empty states unaffected by this
  choice (skeleton rows, empty-state message continue to span full width).
- *Interaction/motion:* hover/select background transitions should be an near-instant fade
  (no elevation, no movement) — consistent with "hover is a tint shift, not a lift" finding.
- *Content/copy:* status must be carried entirely by the badge/chip/dot, never implied by row
  tint — keep row backgrounds neutral so badges remain the fastest scan target.

**Pattern B — Minimal hairline row treatment (secondary/fork option)**
- *Components:* same as Pattern A, plus a divider element.
- *Layout/hierarchy:* keep a divider between rows, but drop its contrast well below a standard
  border color — it should be barely perceptible at a glance and only resolve on close inspection.
  Optionally apply the divider selectively (e.g. only under the header, or only to visually
  separate a frozen/leading column from scrolling columns) rather than uniformly under every row.
- *States/interaction:* identical to Pattern A — hover and select still rely on background tint,
  not the divider, to communicate state.
- *When to choose over Pattern A:* if user testing or existing product conventions suggest rows
  need a slightly stronger anchor (e.g. very wide tables where the eye needs a horizontal guide
  across many columns), the hairline gives a subtle assist without reverting to a heavy grid.

**Both patterns — functional affordances to preserve:**
- *Checkboxes:* sit inline at the row's leading edge, unaffected by border removal; selection
  state should be communicated primarily via the row background tint described above, with the
  checkbox as the explicit, accessible control.
- *Sort affordance:* header-level only (caret/arrow icon next to column label); no dependency on
  row dividers, so removing them doesn't affect sortability legibility.
- *Status badges/chips:* remain the only saturated-color element at the row level in both
  patterns; do not let either treatment introduce competing row-level color.

**States to design regardless of pattern chosen:** empty (no rows — message replaces body,
full-width, unaffected by row-styling choice), loading (skeleton rows should match the chosen
row rhythm/padding so the loading state doesn't jump when data arrives), and a dense/compact
density variant (if the product supports one) — verify the chosen padding scale still reads as
separated rows at the compact setting, since borderless treatments depend more heavily on
padding than a bordered grid does.

## Open questions for inventor

- Choose between Pattern A (fully borderless) and Pattern B (minimal hairline, possibly
  selective) as the primary direction, or present both as competing options — the research does
  not settle this fork.
- Decide whether a frozen/leading-column divider (Attio's selective-divider move) is worth
  adopting given the current table's checkbox + expand-affordance leading columns.
  Also confirm the current table's sticky-header treatment doesn't fight with a borderless
  body — a sticky header without a stronger separating rule risks header/body ambiguity on
  scroll, which is worth explicitly validating with a live long-list example, not just at rest.
- Given the finding that hover-elevation/lift is essentially unproven at the frontier for dense
  tables, confirm hover should stay a flat tint rather than exploring elevation, or explicitly
  flag it as an experimental deviation from convergence if the team wants to try it anyway.
- Card-gapped rows were found to be a mismatched pattern for dense multi-column grids; if there's
  appetite to explore that direction regardless (e.g. for a lower-density summary view rather
  than the primary operational table), that should be scoped as a distinct component, not a
  restyling of the existing dense table.
