<!-- BEGIN:nextjs-agent-rules -->

## Project Overview

This repository is a **Next.js + React + Tailwind** application built and maintained through
an **AI-augmented design loop**. The work here is not a sequence of one-off tasks; it is a
closed loop in which AI participates at every arc — defining the experience, reading designs,
generating UI, auditing the running app, capturing feedback, and ideating fixes — all bound to
a single shared **design-system contract** (the project's design tokens + its local component
library).

This document is the governance for that loop. The flow logic itself — how work is
classified, which skills run, in what order, and where a human weighs in — lives in the
**orchestrator skill** (see below). This file carries the standing rules every skill must
obey. Keep both in sync with `.claude/skills/` — if a skill is added, removed, or changed,
update the orchestrator skill and this file.

---

## Routing: the orchestrator is the front door

**Every incoming instruction goes through the `orchestrator` skill first** — whether it was
typed by a person, fired by a scheduled routine, or triggered by `/loop`. Do not hand a
UI design-and-build request to a downstream skill directly; invoke the orchestrator and let
it classify the request, dispatch the right skill(s), run the human gates, and flag anything
it has no pathway for.

This is a blocking rule: if a request might touch the UI design system at all — build or
change a screen/component; audit or review the UI against the PRD; process Starling or
prompt feedback; add motion; write or update
journeys/flows/stories or the PRD; or invoke any single one of those skills — **route it
through the orchestrator before doing anything else.** All the orchestration logic (pathways,
parallel/sequential dispatch, approval gates, interactive-vs-autonomous behavior) is defined
there, not here.

**This includes anything that reaches the execution stage by any route — most especially
work planned in plan mode.** ALL executional requests must be routed to the orchestrator,
regardless of how they arrived: a direct instruction, a plan approved via ExitPlanMode, a
TODO list, a scheduled routine, `/loop`, or a multi-step task you decomposed yourself. Plan
mode and the harness's planning flow are NOT a substitute for the orchestrator — they decide
*what* to do; the orchestrator decides *how it ships* (which skills run, in what order, and
which gates apply, e.g. `composer` builds and `warden` validates its output before it lands).
Approving a plan does not grant a license to hand-edit the source tree directly: once a plan
that touches the UI design system is approved, the FIRST execution step is to invoke the
orchestrator and let it dispatch the build through `composer`/`warden` (and any other
pathway skills), never to apply the edits yourself. Writing "run warden" into a plan or a
verification checklist does not satisfy this — the gate must actually run.

The orchestrator coordinates the specialist skills, each in `.claude/skills/`:

- **storyteller** — defines the experience (journeys, flows, stories, blueprints) and
  maintains the PRD. Lives in the project's docs directory; never writes to the source tree.
- **architect** — owns the design-system foundation: tokens (the Tailwind `@theme` block in
  the global stylesheet) and the code↔Figma sync via Code Connect. Code is the source of
  truth; Figma is a generated mirror. Runs standalone for token/Figma-sync work, and after the
  `warden` gate (rarely) to push a true net-new component composer built into Figma.
- **composer** — the central build engine; turns intent into production Next.js UI from the
  real component library and tokens. Owns its own motion gate (animator) internally.
- **warden** — validates composer's output for design-system compliance (token reuse,
  component reuse) and drives a bounded correction loop before a build ships.
- **inspector** — audits the running app against the PRD + UX/UI heuristics via Playwright
  MCP; emits a self-contained HTML audit report with findings tagged PRD / UI / UX + severity.
- **inventor** — turns one feedback item (Starling annotation or an inspector finding) into
  three token-grounded design directions in one HTML file. Ideation only — never edits source.
- **influencer** — explores real-world UI patterns (via the Mobbin MCP) to ground a design
  brief before options are generated; pairs with inventor.
- **animator** — research-grounded motion specs; subordinate to composer's motion gate.

If an instruction matches no orchestrator pathway, the orchestrator stops and flags it rather
than improvising — that signals its coverage should be extended deliberately.

### The composer → architect elevation link

When composer builds a **true net-new component** (Step 11 — no existing equivalent in the
component library), it judges whether that component should be **elevated to canonical** —
moved into the shared component library, mirrored into Figma on its own page (code→Figma), and
reused by composer in later builds. Composer judges; architect builds. This is a standing
behavioral link between the two skills, sequenced by the orchestrator's elevation gate (see
`references/compose.md`), and it fires rarely — most builds reuse or lightly vary existing
components and never reach Step 11.

- **Composer classifies, emits a verdict, never touches Figma itself.** It flags each net-new
  component `ELEVATE` or not in its Step 11a output manifest. The orchestrator runs the
  elevation gate only after warden has passed the build.
- **Elevation rubric — the governing question is "is this likely to be reused?":**
  - **Clearly reusable primitives MUST be elevated.**
  - **Most composite components MUST be elevated** — the default is elevate, unless a
    component is demonstrably bound to a single screen and use case.
  - **Some larger, multi-part components** are elevated — only when clearly reusable, not a
    one-off built for a specific screen. A single-use one stays route/feature-local.
- **Gate order matters:** elevation runs only on a warden-clean component, and before any
  downstream PRD update, so storyteller documents the component at its final, canonical path.
  A component composer escalated (warden never cleared it) is not an elevation candidate.
- **Borderline cases are a human decision.** If composer is unsure whether a component is
  reusable, it flags rather than silently keeping it local; the orchestrator surfaces that as a
  human gate.

---

## Experience artifacts: storyteller & the docs directory

`storyteller` is the project's experience-definition skill, and **the project's docs directory
is its primary working directory** — the source of truth for _what_ we are building and _for
whom_, sitting upstream of the implementation.

**Artifact home.** All journeys, flows, stories, and blueprints are written as Markdown
(with embedded Mermaid) under the docs directory. Recommended layout:

```
docs/
├── journeys/      # user journeys, incl. as-is/to-be pairs
├── flows/         # task-level user flows
├── stories/       # epics, feature stories, task stories + acceptance criteria
└── blueprints/    # service blueprints (operating-model layer)
```

**Conventions (bound to storyteller's own governance):**

- **Naming:** `[area]-[persona]-[goal]-[artifact-type].md` (e.g.
  `claims-newcustomer-fileclaim-journey.md`).
- **Markdown + Mermaid, not bespoke HTML.** Keep artifacts as version-controllable docs.
  Storyteller renders journeys (`journey`), flows (`flowchart TD`), and cadence
  (`timeline`) as embedded Mermaid.
- **The artifact chain holds:** no story enters a composer build without a linked flow (or
  a documented reason none is needed); no net-new flow without a linked journey, heuristic,
  or research source; no journey is "done" until it names owners and next actions.
- **As-is/to-be is a pair.** For any redesign or transformation, never produce a to-be
  journey without an as-is baseline, and never close an as-is without naming opportunities.
- **Measurement is required.** Every journey/flow/story carries at least one user-outcome
  metric and one operational metric, HEART-aligned where natural — this is what lets
  `inspector` later check the running app against a defined intent.
- **storyteller defines, composer builds.** storyteller never writes to the source tree;
  composer reads storyteller's docs artifacts as input intent and is the only skill that
  produces components.

---

## Figma & MCP servers

### Figma MCP — the design↔code bridge

The Figma MCP server bridges code and design in both directions. It is used primarily for
**design-to-code** ("reading" Figma):

- `get_design_context` — the structured spec a node represents (the design-to-code
  "reader" role).
- `get_variable_defs` — Figma variables / design tokens.
- `get_metadata` — node structure/layer metadata.
- `get_screenshot` — a rendered reference image while composing.

It also exposes **code-to-design** (`use_figma`, `create_new_file`) and **Code Connect**
mapping tools (`get_code_connect_map`, `add_code_connect_map`, `get_code_connect_suggestions`).

> **Reader / reconstructor are MCP capabilities, not skills.** "Reading" a design is done
> with the Figma MCP read tools above; pushing UI back into Figma ("reconstruction") is done
> with the Figma MCP code-to-design tools. There is no local skill for either.

#### Resolving a node id (binds every skill that reads Figma)

The Figma MCP is the **Remote server**: it traverses any file autonomously — no desktop
app open, no live selection, no token. Reading a design is always a two-part move — resolve a
real node id, then read it — and the failures below come from getting the first part wrong.

- **A file-level link vs. a direct link are different inputs.**
  - **File-level link** (e.g. a Component Library URL): extract the **`fileKey`
    only** and **ignore its `node-id`** — that id is just whatever page was last viewed when the
    link was copied, not the component you want, and often stale. Resolve the real node by walking
    the live tree: `get_metadata(fileKey)` (no nodeId) → pick the page → `get_metadata(fileKey,
    pageNodeId)` → find the component by name → `get_design_context(fileKey, componentNodeId)`
    (and `get_variable_defs` for its tokens).
  - **Direct component/page link** a human intentionally hands you: that `nodeId` is authoritative
    — **use it straight in `get_design_context`; do not re-walk or re-resolve**, or you discard the
    exact target they chose.
- **Carry the resolved `nodeId` forward explicitly between calls; never re-derive it.** Never call
  `get_design_context` without a live, resolved node id.
- **Do not misread a bad node id as a server limitation.** An **empty `0×0` canvas** from
  `get_metadata`, or a **"nothing selected / select a layer first"** reply from
  `get_design_context`, means the `nodeId` is **stale or not a usable layer** (e.g. a page/canvas,
  or an old id) — *not* that the file is unreadable or that this is a selection-bound desktop
  server. Re-list pages and drill a live one. Only if the walk genuinely cannot surface the
  component do you ask for a "Copy link to selection" URL — framed as "I can't resolve the node
  id," never as "the server can't do this." (`warden`'s `references/figma-library-check.md` carries
  the full cost-bounded walk.)

#### Figma REST API — use first for autonomous node discovery

When you need to find nodes in a Figma file autonomously (no human-provided direct link),
**use the Figma REST API before the MCP** to cheaply locate the right node id, then switch to
MCP tools once you have a confirmed id. The REST API is available via a `FIGMA_API_KEY`
(or equivalent) token read from the environment — never hardcode it.

```
1. GET https://api.figma.com/v1/files/{fileKey}?depth=2
   Header: X-Figma-Token: $FIGMA_API_KEY
   → Returns the document tree (pages + top-level frames/components) without
     downloading every node. Use this to identify which page and frame contains
     what you need.

2. GET https://api.figma.com/v1/files/{fileKey}/nodes?ids={nodeId}
   → Drill into a specific subtree once you've identified the candidate from step 1.

3. Once you have a confirmed live nodeId → switch to MCP:
   get_design_context(fileKey, nodeId)  ← authoritative structured spec
   get_screenshot(fileKey, nodeId)      ← rendered reference
```

**Why REST first:** `get_metadata` via MCP fetches the entire file tree at once, which is slow
and context-heavy for large files. The REST API's `depth` parameter lets you scan the top-level
structure cheaply, then drill only into the subtree you need. **Do not use REST for design spec
extraction** — always use `get_design_context` (MCP) for the actual component spec; the REST
API returns raw Figma JSON that is harder to interpret.

### Playwright MCP — the agent's hands and eyes

The Playwright MCP server lets the agent drive a real browser as a sequence of tool calls
(`browser_navigate`, `browser_snapshot`, `browser_click`, `browser_take_screenshot`,
`browser_resize`, …). It is the observation surface for the **inspector** skill: the
accessibility tree from `browser_snapshot` is the primary signal, so a11y issues surface
naturally, and the audit is adaptive (it reasons between actions) rather than a brittle
pre-written spec.

When using the Playwright MCP, always call `browser_close` as the final action of any task that opened a browser, before delivering the final answer. Treat this as required cleanup, not optional.

---

## Feedback capture: Starling

The feedback pathway accepts a feedback item from one of two sources:

- a **design annotation artifact** — this project's in-browser annotation tool is **Starling**
  (see below); agents read annotations via its documented fetch entrypoint (never from local
  files); annotations are source-traceable (component name, file:line, fallback locators,
  route, context) so a finding maps back to real code.
- a **prompt** — the feedback is described directly in the request.

Routing logic is identical either way. This is the input contract for **inventor** (and, for
implementation, **composer**).

`starling/` (published as `@starling/dev`) is the project's in-browser annotation tool. A
designer/PM marks up components in the running app; annotations are source-traceable
(component name, file:line, Playwright fallback locators, route, context) and persist to a
shared Supabase store (`starling_snapshots`) with zero per-user setup.

Agents read annotations via the fetch entrypoint — never from local files:

```bash
npm run starling:fetch -- --app ailms                     # list snapshots (metadata)
npm run starling:fetch -- --app ailms --latest --content  # one snapshot as markdown
npm run starling:fetch -- --app ailms --latest --content --json   # canonical Session JSON
```

---

## Design-system contract (source of truth)

All skills are bound to one contract. Locate each artifact in the host project; do not assume
fixed paths:

- **Tokens** — the project's design-token source (a global stylesheet with CSS variables /
  a Tailwind theme). The live source of truth for color, spacing, radius, shadow, type.
- **Design-system spec** — the prose specification of the design system, if one exists (color,
  typography, effects, spacing, radii, naming conventions, Tailwind integration), plus any
  semantic-token vocabulary mapping primitives to named roles.
- **Component library** — the project's primitives plus shared/domain components. Built
  locally; reuse over rebuild.
- **Storybook** (if present) — renders each component variant against the real tokens and ties
  it back to its source Figma node.

**Code + tokens are canonical where Figma diverges.** The local component library is often more
faithfully built than the Figma library (e.g. dynamic slots, clean token usage). When the Figma
design system and the code disagree on structure or naming, treat **the code component + the
shared tokens as the source of truth**, not the Figma version.

---

## Design-system rules (non-negotiable)

These bind `composer`, `inventor`, and any UI work. Reference tokens — never hard-code.
(`storyteller` produces docs, not UI, so these UI rules do not constrain its artifacts —
but its flows/stories should reference real design-system components and patterns by name
where they exist, rather than inventing UI vocabulary.)

### Role-reserved palettes

If the project reserves part of its palette for a specific role — for example an AI/agentic
surface ramp, a "danger" ramp, or a brand-emphasis ramp — **honor that reservation
consistently**:

- Always reference the reserved tokens (e.g. `var(--color-<role>-700)`) — never a raw hex or a
  raw Tailwind color utility (`text-purple-*` / `bg-blue-*`).
- A reserved ramp is reserved: use it only for its role, and reach for a different semantic
  token (`warning` / `info` / a secondary emphasis ramp) for unrelated emphasis.
- When a primitive (`Tag`, `Chip`, `Badge`) has no variant for the role, pass the reserved
  tokens via its `bgColor` / `textColor` / `color` props rather than redefining the variant.
- Keep unrelated actors on a `neutral` ramp so the reserved surfaces stay visually distinct.

Learn the project's specific reservations from its token source / design-system spec; do not
hard-code one project's mapping into another.

### Tokens & utilities

- **No inline px.** Never write `top-[28px]`, `text-[15px]`, `px-[12px]`, etc. Map any
  pixel value to the nearest spacing/text token. Sub-pixel rounding (27.67 → 28 → token)
  is fine.
- **Learn the project's token quirks from its token source.** Some themes ship tokens that are
  broken, translucent, or otherwise need special handling (e.g. a "white" token that resolves
  to transparent, a card token that is semi-transparent and needs a `backdrop-blur`, or
  semantic `bg-*` tokens that are defined outside `@theme` and so need arbitrary syntax like
  `bg-[var(--bg-error-50)]`). Read the token source and the design-system spec for the
  project's specific quirks rather than assuming; flag any you discover.

### Composition

- Keep UI **simple and low-density**: drop non-load-bearing chips/meta-tags; prefer a
  clean title + bullets over densely structured cards.
- **Portal all overlays** (dropdowns, menus, tooltips, popovers, modals, drawers) to
  `document.body` so they escape stacking/overflow traps.
- If a token or component is genuinely missing, **flag the gap** — do not invent a value.
- For any mock data generated, especially text, absolutely **DO NOT USE em-dashes** and minimize the use of colons and semicolons. All text, especially descriptions, must be scannable and do not overexplain. If we have long descriptions (3 or more consecutive sentences), there should be key phrases and words directly bolded in the text.

---

## Component reuse & Code Connect

- **Always prefer existing components** over new ones; match by purpose, props, structure.
- **Code Connect:** if a Code Connect mapping exists for a component, all skills MUST use
  it. If it does not, fall back to **decomposition** (build from the real code component +
  tokens). **Never mix mapped and inferred components inconsistently within a component** —
  consistency is per-component: a fully-mapped Button alongside a fully-decomposed Card is
  fine; half-mapping one component is not.

<!-- END:nextjs-agent-rules -->
