# Influencer brief: KPI tile / stat card redesign

## The need

A dashboard hero KPI element used to surface a single headline metric at a glance in a dense
operations/analytics context (fleet, logistics, shipments-style workflows, but the pattern
generalizes across finance, product-analytics, and admin-panel dashboards). The current
element shows a label, a big value, an optional one-line hint, and a status-tone accent color.
It has no trend delta, no inline history, no comparison-to-baseline, and no glanceable signal
for whether the current value is good or bad news. The goal is to make one metric answer, in
under a second of eye contact: **what is it, what was it, is that good or bad, and is it moving**.
Constraints: this is a tile that repeats many times across a dashboard grid (often 3-8 per
row), so per-tile weight has to stay low even as information density goes up.

## Generalized patterns explored

The need decomposes into five searchable sub-problems, each run as its own focused query
against real shipped web dashboards (`search_screens`, `platform: web`, `limit: 5` each, 8
queries total, ~35 screens triaged):

1. Trend delta presentation — arrows, percentage change, colored deltas, "vs. last period" copy
2. Sparkline / inline mini-chart embedding inside a stat card
3. Comparison-to-baseline mechanics — vs. last period, vs. target/goal, vs. previous week
4. Direction-of-change color semantics — glanceable good/bad signaling, including the "down is
   good" inversion case
5. Overall layout/hierarchy for KPI tiles repeated across a dense grid (fleet/ops, finance,
   social/marketing analytics, admin panels, LLM-ops dashboards)

## References (from Mobbin)

**Stripe — "Your overview" dashboard**
https://mobbin.com/screens/06cb64e5-fd69-4211-b37a-8c5095b4e85e
Exemplary because it is the clearest version of the "compare two full periods" pattern: each
card carries a two-line legend (`— Last 7 days` / `— Previous period`) directly under the
metric name, both rendered as full dollar values, with the comparison period explicitly stated
in the page-level control rather than hidden. The move worth borrowing: putting the comparison
period control at the container level (once) and letting every tile inherit it, so the tile
itself stays uncluttered.

**Steep — "SLMobbin" home dashboard**
https://mobbin.com/screens/98441ba2-baad-4448-81a2-669ac88ca00f
Exemplary because it shows three different KPI-tile sub-patterns side by side on one screen:
a bar-chart tile with a "% of Budget" baseline caption, a circular-progress tile for a
target-bound metric (Registrations vs. Budget), and a sparkline tile with a colored percentage
delta ("↑ 103.9% vs last month") plus a small period badge. The move worth borrowing: the
comparison mechanic (bar vs. budget line, ring vs. target, sparkline vs. delta) is chosen per
metric type rather than forcing one visual answer for every KPI.

**Amplitude — metric preview card**
https://mobbin.com/screens/72da281c-87c1-45b6-a9ff-32b917844fbd
Exemplary because it separates the headline number from its context sentence: big number, then
a small caption row with a colored change chip (`▲ >1000%`) followed by plain-language context
("Current Uniques are trending upwards by >1000% since Nov 17"), then the sparkline is given
its own visual space below rather than being squeezed inline. The move worth borrowing: the
plain-language trend sentence as a fallback/companion to the numeric delta, useful for
accessibility and for metrics where a raw percentage is misleading (e.g. small base numbers).

**Whop — "Stats" dashboard**
https://mobbin.com/screens/add1901d-9b32-4751-83e0-b44083fd2c03
Exemplary because it demonstrates the fully-collapsed inline sparkline: value and delta chip
sit at the top of the tile, and a borderless, axis-less line chart fills the remaining tile
body edge-to-edge as pure background texture, not a labeled chart. It also shows the graceful
empty state ("No data available") replacing the sparkline area without breaking the tile's
footprint. The move worth borrowing: the sparkline as ambient texture (no axes, no gridlines,
no legend) so it reads as a shape/trend at a glance, not as a chart to be studied.

**Later — "Organic Social Overview"**
https://mobbin.com/screens/fd51fa4e-8aef-48c0-ab92-21a0436f41d7
Exemplary because it runs the comparison at two levels simultaneously: a page-level hero metric
with an explicit "Analysis Period" vs. "Comparison Period" date-range pair, and then a grid of
eight small KPI tiles below it, each with its own compact colored delta ("↓ 20% from 20"). Delta
color follows metric semantics per tile, not a single fixed rule (see Adaline below for the
sharper version of this). The move worth borrowing: hero tile + supporting tile grid as a
two-tier hierarchy, so one metric gets outsized visual weight while siblings stay compact.

**Adaline — project observability dashboard**
https://mobbin.com/screens/4ff7d2c3-8b4a-4740-b543-8d964db2704b
Exemplary because it is the cleanest example of **direction-of-change semantics that are not
just "up = green"**: "Avg eval score 0.72 ↓" and "Avg latency 5.27s ↑" sit side by side, arrows
pointing opposite directions, and the tiles make clear (via the accompanying sparkline shape
and grouping) that these are read differently — a rising eval score is good, a rising latency
is not. The move worth borrowing: the arrow communicates direction of the raw number, and a
separate semantic layer (color, or explicit tile grouping) communicates whether that direction
is favorable — the two must not be conflated into one rule.

## Best-practice synthesis

**1. The delta is a first-class sibling of the value, not a caption.**
Every strong reference places a compact delta immediately adjacent to (usually directly under
or beside) the headline number: an arrow glyph, a percentage, and a comparison anchor
("vs last period", "from 20", "last 7 days"). This is what makes the tile glanceable — the eye
lands once and reads value + direction + magnitude together. Weak/legacy patterns bury the
comparison in a tooltip or a separate panel, which defeats the point of a KPI tile.

**2. Direction-of-change color must be decoupled from arithmetic sign.**
The strongest dashboards (Adaline, and the healthier examples in Later/Whop) treat "did the
number go up or down" (the arrow) as a separate fact from "is that good or bad" (the color).
A naive implementation ties green to "increased" and red to "decreased," which is wrong for
any metric where lower is better (error rate, churn, late-delivery rate, cost). The recurring
correct pattern is: **arrow shows direction of the raw number; color is driven by a per-metric
"good direction" flag**, so a falling error-rate tile and a rising revenue tile can both be
green.

**3. Sparklines are ambient, not analytical.**
Every card-embedded sparkline in the sample (Whop, Steep, Adaline, Vercel, Revolut Business)
strips axes, gridlines, tick labels, and legends — the line or bar shape alone communicates
"trending up," "flat," "volatile" at a glance. None of them expect the user to read exact
values off the inline chart; that's what a drill-down or tooltip is for. The moment a sparkline
grows axis labels it has stopped being a stat-tile sparkline and become a small chart, which
belongs in a different, larger component.

**4. Comparison baseline is a per-metric or per-page choice, not a hardcoded default.**
The frontier shows the comparison target is genuinely contextual: previous equivalent period
(Stripe, Later's "Analysis Period vs Comparison Period"), a fixed target/budget/goal (Steep's
ring vs. budget, Navan's "vs similar companies" or "2024 target"), or trailing baseline
("from 20" meaning the prior sample). The best dashboards make the comparison anchor explicit
in copy every time ("vs last month," "Budget 2024," "last 7 days") rather than assuming the
user remembers what a bare percentage is relative to.

**5. Hierarchy scales by tile role, not just tile size.**
Where one metric matters more than its neighbors (Later's hero total-followers metric vs. its
supporting 8-tile grid; Amplitude's single expanded metric preview), the frontier gives it a
larger number, its own comparison-period control, and sometimes its own larger sparkline —
while sibling tiles in the grid stay compact and uniform. This lets a dense grid hold many
KPIs without every one competing for the same visual weight.

**6. Empty, loading, and "no data" states are designed, not defaulted.**
Whop and Later both show a tile with the value slot rendered ($0.00 / 0) but the sparkline area
swapped for a calm "No data available" or blank placeholder that preserves the tile's exact
footprint — no layout jump when data arrives later.

## Convergence vs. divergence

**Converged (high confidence, 6/6 finalists agree, corroborated across the wider 35-screen
sample):**
- Delta sits directly adjacent to the value (not detached into a separate section).
- Delta is composed of three parts: directional arrow glyph, percentage or absolute change,
  and a comparison-anchor label in words.
- Sparklines embedded in a stat tile are stripped of axes/gridlines/legends — ambient shape
  only.
- The comparison anchor is always named in copy, never left implicit.

**Forked (present competing approaches; leave open for inventor):**
- **Delta shape:** compact inline chip with arrow+percentage (Amplitude, Later, Whop) vs. a
  written trend sentence (Amplitude's secondary caption) vs. a progress-to-target bar/ring
  (Steep, Navan) — the fork is essentially "trend-over-time" metrics vs. "progress-to-goal"
  metrics, and a single KPI tile component may need to support more than one comparison mode.
- **Sparkline chart type:** line (Amplitude, Adaline, Revolut) vs. bar/column (Steep's booking
  lead time, Revolut's income tile) — line reads as continuous trend, bar reads as discrete
  period buckets; the choice tracks the underlying metric's shape rather than being a fixed
  house style.
- **Where the comparison period lives:** stated once at the page/section level and inherited by
  every tile (Stripe, Later's hero) vs. restated per-tile (Later's supporting grid, Steep). Dense
  ops grids seem to favor per-tile restatement since tiles are often scanned independently or
  screenshotted individually; a single hero metric favors page-level statement.
- **Color-to-direction mapping mechanism:** an explicit semantic flag per metric (implied by
  Adaline's opposite-direction color treatment) vs. a single fixed polarity applied dashboard-wide
  (several of the simpler finance examples effectively assume "up is good" and don't visibly
  handle the inverse) — the fixed-polarity approach is common but is the weaker pattern for an
  ops/logistics context where "down is good" metrics (delays, incidents, error rates) are
  frequent, not exceptions.

## Implementation specs

**Core anatomy (per tile):**
- Label (metric name), small, muted weight, top of tile.
- Headline value, largest text in the tile, high contrast.
- Delta chip, directly adjacent to the value: `[arrow glyph] [±X%] [comparison anchor text]`.
  Arrow reflects arithmetic direction of the raw value; chip color reflects a per-metric
  "favorable direction" flag, not the arrow's direction directly.
- Optional ambient sparkline or micro-bar-chart filling the remaining tile footprint below the
  value/delta line — no axes, no gridlines, no tick labels, no legend. Chart type (line vs.
  bar) chosen per metric shape: continuous trend → line; discrete period buckets → bar.
- Optional secondary caption line for plain-language context or a progress-to-target
  affordance (thin bar or ring) when the comparison mode is "vs. goal" rather than "vs. prior
  period."

**States:**
- **Default/populated** — full anatomy as above.
- **No comparison available** (e.g. first period of data) — delta chip omitted or replaced with
  a neutral "—" plus a short explanatory caption ("No prior period"), value still shown at full
  size; do not fabricate a 0% delta.
- **Loading** — value and delta area replaced by a skeleton matching the exact footprint of the
  populated state (label stays static) to avoid layout shift on load.
- **Empty/no data** — value shows the real zero/placeholder value if known, sparkline area
  replaced by a calm placeholder message, tile footprint unchanged.
- **Error** — tile shows the label and a short inline error/retry affordance in place of the
  value; does not silently show a stale or zero value as if it were current.

**Interaction + motion notes:**
- Sparkline and delta are typically non-interactive at the tile level (glanceable, not
  explorable); a click/tap on the tile is the affordance for drilling into the full chart, not
  hovering the sparkline itself.
- If hover affordances are added, keep them lightweight (a single point tooltip on the
  sparkline at most) — the tile is a summary, not the analysis surface.
- Value/delta updates on live-refreshing dashboards should animate as a subtle number
  transition (count-up/count-down or crossfade), not an abrupt swap, so periodic polling
  doesn't read as flicker.

**Content/copy guidance:**
- Always name the comparison anchor in words ("vs last week," "vs target," "last 7 days") —
  never show a bare percentage with no stated baseline.
- Keep the delta chip terse: arrow + number + short anchor, not a full sentence, to preserve
  scannability in a repeated grid; reserve a full sentence (Amplitude-style) for a single hero
  metric, not for a dense grid of sibling tiles.
- For metrics where "down" is the favorable direction, make sure copy doesn't accidentally imply
  the opposite (avoid ambiguous verbs; prefer explicit framing like "3% fewer late deliveries"
  over a bare "-3%" when space allows).

## Open questions for inventor

- How many distinct comparison modes does this component need to support out of the gate
  (period-over-period delta, progress-to-target, both), versus which ones are deferred to a
  later variant?
- Should the favorable-direction flag be an explicit per-instance prop, or inferred from a
  metric-type registry/config elsewhere in the app? This affects how safely the "down is good"
  case can be guaranteed correct by default versus left to the implementer to set correctly
  every time.
- Line vs. bar sparkline: fixed per component variant, or switchable per metric? Worth
  prototyping both to see which holds up better at very small (tile-sized) dimensions.
- Does the hero-vs-grid hierarchy (one large emphasized tile plus compact siblings) apply to
  this dashboard's layout, or are all KPI tiles peers here — this changes whether one size of
  tile needs to carry the fuller anatomy (sentence caption, larger sparkline) and others a
  reduced one.
