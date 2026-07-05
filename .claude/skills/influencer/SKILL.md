---
name: influencer
description: >-
  Explores real-world UI design patterns through the Mobbin MCP server (600k+ shipped app screens and
  130k+ flows) to extract best practices and produce an implementation-grounded design brief for a
  specific use case. Use this whenever a design need calls for exploration or grounding BEFORE generating
  options — i.e. upstream of the inventor skill, so inventor's directions start from proven frontier
  patterns instead of a blank slate. Trigger it whenever someone wants to know how top apps handle a
  pattern (onboarding, paywalls, checkout, settings, permissions, search, empty states, etc.), asks for
  UX/UI best practices or design references, says "how do the best apps do X", wants to ground a build in
  real-world examples, or before exploring design options for a complex screen/component/flow. Also invoke
  it directly for standalone pattern research. Pairs with inventor: influencer researches and synthesizes;
  inventor turns that synthesis into concrete product-specific directions.
---

# Influencer

This skill grounds design exploration in what already works. It drives the **Mobbin MCP server** — a
hand-curated library of real, shipped UI screens and flows from high-quality apps — to study how strong
products solve the design problem at hand, distills the recurring best practices, and hands a synthesized,
implementation-grounded brief to the next step.

## Where it sits: upstream of inventor

Today a design need that warrants exploration goes straight to **inventor**, which generates three
directions from a blank slate. Influencer inserts itself **before** inventor:

```
design need that needs exploration
        ▼
influencer  — explore the design space on Mobbin, synthesize best practices + implementation specs
        ▼
inventor    — turn that grounded foundation into three concrete, product-specific directions
        ▼
review
```

The division of labour is strict, and keeping it strict is what makes the pair valuable:

- **Influencer does not produce the three directions.** It produces the evidence and the recommended
  patterns — the foundation inventor builds on. If you find yourself drawing three bespoke options for
  _this_ product, you've crossed into inventor's job; stop and hand off.
- **Inventor does not do the research.** It consumes influencer's brief as its starting context so its
  directions begin from proven patterns rather than guesses.

The result: components reach inventor already carrying a baseline of strong UX/UI grounded in frontier
designs, so the directions inventor explores are better-founded and less generic.

## The Mobbin MCP dependency

Influencer's exploration runs on Mobbin. Before doing anything else, confirm the Mobbin MCP tools are
available — `search_screens`, `search_flows`, `search_sections`.

- **Present** → proceed.
- **Absent** → call `search_mcp_registry` with `["mobbin", "design", "ui patterns"]`, then
  `suggest_connectors` so the user can connect it. The official server is `https://api.mobbin.com/mcp`
  (HTTP transport, OAuth; access is included on paid Mobbin plans). Stop and wait — **do not silently fall
  back to generic web search.** Grounding in real curated screens is the whole point of this skill; a web
  fallback loses that and must, if used at all, be flagged loudly as a degraded run.

The three tools, all natural-language search:

| Tool              | Finds                                                    | Required args                    |
| ----------------- | -------------------------------------------------------- | -------------------------------- |
| `search_screens`  | individual UI screens by description                     | `query`, `platform` (ios/web)    |
| `search_flows`    | multi-step user journeys (each with per-screen previews) | `query`, `platform` (ios/web)    |
| `search_sections` | marketing-website sections (pricing, hero, footer, etc.) | `query` (web only — no platform) |

All three return **inline preview images plus JSON metadata**, including a canonical `mobbin_url` per
result — so there is no separate detail-fetch step; you analyse the previews directly and cite the
`mobbin_url`. They also accept `limit` and pagination.

**Picking `platform`.** When the project ships a web UI, `web` is the default for `search_screens` and
`search_flows`. Reach for `ios` when mobile-native patterns are the better reference for the problem (e.g.
gesture-driven interactions, permission priming) even though the build target is web — the patterns
transfer. `search_sections` is web-only and takes no platform.

**Token budget — the two levers.** Pinging Mobbin and parsing previews is the main cost, and **flows are
the expensive case** — every screen in the journey is imaged (a 20-screen flow is ~20 images). Two levers
control this, both applied in step 3:

1. **Low `limit`.** Pin `limit: 3–5` per query. The defaults are heavy (`search_screens`/`search_sections`
   default to 20, `search_flows` to 5), and because screen search scores relevance server-side
   (`mode: "deep"`, the default), a small limit returns the genuinely-best few rather than a truncated
   random set — so this costs you little coverage.
2. **Delegated visual triage.** Spend the image tokens in a **throwaway subagent context** that ingests the
   previews and returns only text, so images never enter this conversation. Mechanics in step 3.

`image_format` (`webp`/`jpg`) is **not** a token lever — images are tokenized by dimensions/tiles, not file
size, so don't reach for it to save budget.

## The workflow

### 1. Identify the design need

Pin down what is actually being designed and for whom, from the invoking context — the inspector finding,
the feedback item, the spec, or the direct prompt. Name the screen/component/flow, the user goal, and the
constraints (platform, surface, any PRD requirement it must satisfy). If the need is genuinely unclear and
no invoking context resolves it, ask one focused question rather than guessing — a vague need yields vague
references.

### 2. Generalize to features and components

Decompose the need into the **patterns and UI primitives** to go looking for. This is the step that makes
the Mobbin search productive: a request to "design the trial paywall" generalizes to plan-comparison
tables, feature-gating treatments, price framing, CTA hierarchy, trust/social-proof elements, and the
dismiss/skip affordance. Search for these generalized patterns, not the literal feature name — the library
is indexed by pattern, and the best references often come from a different product solving the same
sub-problem.

This decomposition **is** your query set. Coverage of the design space comes from the number of distinct
sub-problem queries you run, not from the depth of any one query — breadth is bought with cheap extra
queries, while depth-per-query (a high `limit`) is what burns tokens. So list the sub-problems explicitly;
each becomes its own focused search in step 3.

### 3. Search and triage — over-sample privately, return only text

Run **one focused query per sub-problem** from step 2, each at `limit: 3–5`, choosing the tool by shape:

- **`search_screens`** — single surfaces (settings page, empty state, dashboard, form). **Lead with
  screens**: they're the cheap way to find the best apps and patterns.
- **`search_flows`** — sequential needs (onboarding, checkout, permission priming). Expensive (every step
  imaged), so pull a flow **only for a finalist** where the _sequence itself_ is what you're studying — not
  during broad exploration or when understanding the flow is unnecessary to the design problem.
- **`search_sections`** — marketing/landing surfaces (pricing tables, heroes, footers). Web-only.

**Do the visual triage in a throwaway context, not this one.** Parsing every preview in the main
conversation is what blows the budget. Instead, the search-and-triage runs as a **disposable subagent
task**: it executes the per-sub-problem queries, ingests all the returned preview images in its own
context, ranks them against the rubric in step 4, and returns **only text** — a ranked shortlist of
`app + screen/flow name`, the `mobbin_url`, a one-line "why relevant", and a borderline flag. The image
tokens are spent once, privately, and never enter the synthesis thread.

Because the triage context is disposable, it can afford to **look wider than the final set** — pull the
moderate `limit: 3–5` across several queries and let the triage rank the union down. This over-sampling is
deliberate: it's what lets step 4 tell genuine convergence from a thin-search artifact (see there).

**Dispatch (mind the no-nested-subagent rule).** Influencer is itself an orchestrator-dispatched subagent,
so it **cannot** spawn its own. The orchestrator runs the Mobbin search-and-triage as the **leaf task** and
hands influencer back the text shortlist. When influencer is running somewhere without subagents at all
(e.g. a plain chat session), it **degrades to inline triage**: do the searches directly, view the previews
in-context, and just be disciplined about `limit` and screens-first to keep the cost down.

### 4. Rank, then read convergence vs. divergence

The triage ranks candidates on three criteria — note these are the rubric the step-3 subagent applies:

- **Fit** to the specific sub-problem (a close match beats a famous app).
- **Quality** — exemplary execution, from products known for strong UX/UI.
- **Recency** — current patterns over dated ones, unless a dated one is the canonical reference.

**Diversity is not a criterion.** Don't manufacture spread for its own sake. Instead, once the shortlist is
ranked, read **why** the strong references look the way they do:

- **Convergence** — the exemplars agree because the problem has a settled best answer. This is a _finding_,
  often the most valuable one: report it as a high-confidence recommendation ("the frontier has converged
  on X — N of M exemplars do it this way"), a strong default for inventor to anchor on rather than
  relitigate.
- **Divergence** — the frontier genuinely forks into competing approaches. Surface each fork as a distinct
  option for inventor to explore.

The trap is that **convergence and a thin search look identical** in a starved result set. This is exactly
why step 3 over-samples across several decomposed queries in a throwaway context: a convergence claim only
counts if agreement **survives** that wider, multi-query sample. Agreement inside one shallow query is not
convergence — it's an artifact. **Backstop:** if the shortlist comes back thin or you can't tell
convergence from artifact, reframe and run one or two more sub-problem queries before finalizing rather
than reporting a starved set as a finding.

**Confirm the finalists on the real images, and they are what you cite.** Settle on a small final set —
**3–5 references, as few as cleanly make the point** (one or two per principle or fork; fewer when the
frontier has converged). View the full previews of those yourself (via their `mobbin_url`/screen) before
locking them in — so the final quality call is made on real screens, not on the triage subagent's text
proxy. Pull a finalist's full `search_flows` here if its sequence is what matters. These confirmed
finalists **are** the references that go in the brief — don't cite anything you didn't inspect.

(The throwaway triage context still over-samples far beyond this in step 3 — that wide sample is how
convergence gets earned. The 3–5 is only what survives into the brief, not what you looked at.)

For each chosen reference, capture _why_ it's a good reference and the specific move worth borrowing — the
insight, not just the screenshot.

### 5. Synthesize findings and implementation specs

Turn the chosen references into a synthesis, not a gallery. Extract the **recurring best-practice
principles** (what the strong solutions share and _why_ it works — the underlying UX rationale), report
**convergence vs. divergence** from step 4 (where the frontier has settled on one answer, recommend it with
confidence; where it genuinely forks, lay out the competing approaches as options), and translate each
principle into a concrete **implementation spec**: the components involved, layout/hierarchy, states
(including the unglamorous ones — empty, loading, error, permission-denied), interaction and motion notes,
and content/copy guidance. Specs should be concrete enough that inventor can design against them and
composer could ultimately build them.

Keep the specs **design-system-blind** — describe patterns in general UI terms, not mapped to your own
components or tokens. Grounding in the design system happens downstream: inventor's chosen direction goes
to composer, which is design-system-grounded and warden-gated. Pre-mapping here would only narrow the
exploration to what already exists, which is the opposite of what this skill is for.

### 6. Hand off to inventor

Emit the brief (below) as influencer's output. Inventor consumes it as its starting context.

## Output format

ALWAYS produce a single structured markdown brief with this shape:

```markdown
# Influencer brief: <design need>

## The need

<one paragraph: what's being designed, for whom, the goal, key constraints>

## Generalized patterns explored

<the features/components this need decomposes into — what was searched for>

## References (from Mobbin)

<the 3–5 confirmed finalists — as few as cleanly make the point (one or two per principle or fork; fewer
on convergence). For each: app + screen/flow name, what makes it exemplary, and the specific move worth
borrowing. Include the canonical `mobbin_url` for each.>

## Best-practice synthesis

<the recurring principles across the references, each with the UX rationale for _why_ it works>

## Convergence vs. divergence

<where the frontier has converged (report as a confident default, with how many exemplars agree) and
where it genuinely forks (competing approaches for inventor to explore as distinct directions)>

## Implementation specs

<per recommended pattern: components, layout/hierarchy, states (incl. empty/loading/error),
interaction + motion notes, content/copy guidance>

## Open questions for inventor

<what's deliberately left open for inventor to resolve in its directions>
```

## Invocation modes

- **Upstream of inventor** (the common pathway) — the orchestrator runs influencer first, then passes its
  brief into inventor. Influencer is a **dependent step** before inventor, never concurrent with it.
- **Direct** — invoked on its own for standalone pattern research ("how do top apps handle X", "research
  best practices for our settings screen"). It still runs the full workflow and emits the same brief; it
  just isn't wrapped into the inventor handoff.

**Interactive vs autonomous.** Influencer is research and synthesis — it reads and writes only its own
brief, executes nothing, and contains no human gate, so it runs unchanged in a headless/autonomous pass.
Its brief simply flows into inventor (or into the queued plan) for the next step to act on.

## What to avoid

- **Don't generate the three directions.** That's inventor. Influencer stops at the grounded foundation.
- **Don't invent patterns you didn't observe.** Every recommendation traces to real Mobbin references; if
  the library has nothing relevant, say so rather than fabricating a "best practice".
- **Don't return a screenshot gallery.** The value is the synthesis and the implementation specs — the
  _why_ and the _how_, not a pile of images.
- **Don't let preview images into the synthesis thread.** Over-sample and parse them in the throwaway
  triage context; bring back only text (shortlist + `mobbin_url`s), then view full images for the 3–5
  finalists only.
- **Don't manufacture diversity, and don't treat convergence as a failure.** When the strong exemplars
  agree, that convergence is the finding — report it as a confident default. Only force more searching when
  the agreement might be a thin-search artifact, not because the set "looks too similar".
- **Don't buy coverage with depth.** Coverage comes from more decomposed queries at `limit: 3–5`, not from
  a high `limit` or deep pagination. `image_format` saves nothing (images tokenize by dimensions, not
  bytes), and flows are the costly case — reserve them for finalists.
- **Don't map to the design system.** Stay design-system-blind — describe patterns in general UI terms,
  not in our components or tokens. Inventor → composer handles grounding, and composer is
  design-system-grounded and warden-gated; pre-constraining here narrows exploration to what already
  exists.
