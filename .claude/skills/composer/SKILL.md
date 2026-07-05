---
name: composer
description: Translates user intent — journeys, flows, functional requirements, or product specs — into structured, production-ready UI screens using the existing component library and design system. Use this skill whenever someone asks to generate UI from user journeys, user flows, requirements, or specs; assemble full screens or pages; convert Figma-derived specs into code; or compose any multi-screen interface. Trigger even for loosely worded requests like "build me a screen for X", "turn this flow into UI", "create the dashboard for this feature", or "what would this page look like in code". If it sounds like the user wants a UI screen produced from some kind of intent or specification, use this skill.
---

# Composer — Intent → UI Screens

Translates user intent into structured, production-ready UI screens using the existing component library and design tokens. Acts as a **UI orchestrator**, not a layout generator.

## Prerequisites (check before starting)

- [ ] **Design tokens** are accessible — locate the project's design-token source (a global
      stylesheet with CSS variables / Tailwind theme, or a design-system spec document if one
      exists). If none, stop and request it.
- [ ] **Component library** is accessible — typically a primitives folder plus shared/domain
      components. If not, stop and request access.
- [ ] If input is Figma-derived: Reader output (component tree, tokens, layout rules) must be available

---

## Step 1 — Classify Input

Determine what you're working from:

| Input type                  | Description                    | Next step        |
| --------------------------- | ------------------------------ | ---------------- |
| **Structured design input** | Reader output / Figma spec     | → Skip to Step 3 |
| **User journey**            | Goal-driven narrative (WHY)    | → Step 2         |
| **User flow**               | Step-by-step interaction (HOW) | → Step 2         |
| **Functional requirements** | Feature list or product spec   | → Step 2         |

---

## Step 2 — Normalize Intent to Interaction Flow

Only for journey/flow/requirements input.

Extract from the input:

- **User goal** — what the user is trying to accomplish
- **Key actions** — what they do at each step
- **Decision points** — branches or conditional states
- **Outcomes** — success, error, or empty states

Convert into a structured flow:

```
Step 1 → [action] → [system response]
Step 2 → [decision: yes/no] → [branch A / branch B]
Step N → [outcome]
```

> Journeys = WHY · Flows = HOW · Requirements = WHAT

Flows are the contract between intent and UI. Do not skip this step for intent-based input.

---

## Step 3 — Define Screen Architecture

Before selecting any components, define:

**Page type:**

- dashboard · detail view · workflow screen · form · monitoring interface

**Layout regions:**

- header · sidebar · main content · panels/widgets · overlays/modals

**Hierarchy:**

- Which content is primary vs secondary?
- Which regions are persistent vs dynamic?

Output a brief layout map before proceeding. Example:

```
Header: persistent nav + page title
Sidebar: filter panel (collapsible)
Main: KPI tiles (top) + data table (center) + detail drawer (right, conditional)
```

---

## Step 4 — Map Flow Steps to UI Responsibilities

For each step in the interaction flow, assign UI responsibility:

| Flow action        | UI component type                 |
| ------------------ | --------------------------------- |
| Display / overview | Dashboard, card, table, KPI tile  |
| Capture input      | Form, modal, inline edit          |
| Present decision   | CTA, alert, confirmation dialog   |
| Navigate / filter  | Tabs, sidebar filters, drill-down |
| Feedback / status  | Toast, banner, progress indicator |

Output an **interaction map** — screen-level structure with each flow step named.

---

## Step 5 — Discover Existing Components (Critical)

Search the codebase for:

- **Primitives**: Button, Input, Badge, Icon, Tooltip
- **Composites**: Card, Table, Modal, Drawer, Tabs, Select
- **Domain components**: any feature-specific components already built

Rules:

- **ALWAYS** prefer existing components over new ones
- **NEVER** recreate a component if a suitable equivalent exists
- Match by: purpose · props · structure
- If multiple matches exist, choose the most semantically appropriate

Document your findings:

```
Reused: [Button, DataTable, FilterSidebar, StatusBadge]
Missing: [KpiTile] — needs creation
```

---

## Step 6 — Compose UI Hierarchy

Build from atoms → molecules → organisms → page.

Ensure:

- Consistent spacing using design tokens (never hardcoded values)
- Logical grouping — related components clustered together
- Clear visual hierarchy — primary content reads first

For data-heavy UI, extract reusable units:

- Table rows, cards, list items as separate components
- Group repeated patterns into shared components

---

## Step 7 — Apply Design System Constraints

From the project's design-system spec document (if one exists) and the token source, enforce:

- All color, spacing, radius, shadow via semantic tokens
- Typography scale only — no ad-hoc font sizes
- Spacing scale only — no arbitrary pixel values

Rules:

- **NEVER** use hardcoded values (`#3b82f6`, `px-3`, `mt-5` → use tokens)
- **ALWAYS** use semantic tokens when available
- If a token is missing: **flag the gap**, do not invent values

---

## Step 8 — Translate Layout to Tailwind

Convert layout map into Tailwind classes:

- `flex` / `grid` for structure
- Spacing tokens for margins/padding
- Alignment utilities for positioning

Preserve:

- Responsive behavior (mobile → desktop breakpoints)
- Density patterns (compact vs comfortable)
- Section relationships (sidebars, drawers, overlays)

Handle layered UI explicitly:

- Modals: z-index + backdrop
- Tooltips: positioning + overflow
- Floating actions: absolute/fixed positioning

**Portaling requirement (mandatory):**
Any floating/overlay UI — dropdown menus, select menus, tooltips, popovers, context
menus, modals, and drawers — **MUST** be rendered into a portal attached to
`document.body` (e.g. React's `createPortal`, or a primitive's `Portal`/`portalled`
variant such as Radix `<Portal>`). This guarantees they escape parent stacking
contexts and `overflow: hidden` clipping, so they remain above all other elements in
z-index. **NEVER** render these elements inline within their trigger's DOM subtree.

**Motion corollary (mandatory):** Every element identified here as requiring a portal has
an enter transition and an exit transition by structural necessity. Do not defer to the
Step 10 gate to decide whether these animate — they do. Before leaving Step 8, log each
portalled element in the Step 10 motion manifest, pre-marked "yes," with interaction
class "small enter" / "small exit". Step 10 then supplies the animator spec for those
elements; it does not re-evaluate the gate decision.

---

## Step 9 — Integrate States and Interactions

Every component must handle its full state set:

| State   | Handling                     |
| ------- | ---------------------------- |
| Loading | Skeleton loaders or spinner  |
| Empty   | Empty state message + CTA    |
| Error   | Inline error or error banner |
| Success | Confirmation feedback        |

For multi-step flows:

- Maintain state continuity across screens
- Render conditional UI based on flow position
- Provide clear feedback loops at each transition

---

## Step 10 — Motion Design Assessment

Before writing any code, assess whether motion will add genuine communicative value to this UI. Motion earns
its place by doing a specific job — confirming an action, showing system state, directing attention, revealing
structure, or preserving continuity. If it does none of these, skip it.

**Auto-pass components — do not evaluate the gate for these:**

The following always invoke the animator. If any are present in the screen, mark them
"yes" in the manifest immediately and proceed to the animator workflow:

- Dropdown panels and notification panels
- Popovers and command menus
- Modals and confirmation dialogs
- Drawers and side sheets
- Tooltips and context menus
- Toasts and inline banners that enter/exit the DOM

These are auto-pass because enter/exit transitions are structural, not stylistic — the
component literally appears and disappears. The only open question is _how_, which is
what the animator answers.

The gate checkboxes below apply only to elements **not** on this list (e.g. a row
being added to a table, a button press acknowledgment, a filter updating results in place).

**Gate: only proceed to the animator skill if at least one item below is true for this screen:**

- [ ] The screen has **state changes users need to track** — a panel opens, a filter updates results, a row
      is added or removed, a status flips. Motion can make the change legible without a full re-read.
- [ ] There are **user actions that need acknowledgment** — button presses, form submissions, toggles,
      drag-and-drop. Micro-feedback tells users the system received their input.
- [ ] The screen has **enter/exit transitions** for overlays, drawers, toasts, tooltips, or modals whose
      appearance/disappearance could otherwise feel jarring or spatially disorienting.
- [ ] Loading or async states are present and the wait could feel **uncertain or longer than it is**.
- [ ] The context is **consumer-facing, onboarding, or expressive** — moments where polish and delight
      are part of the product's appeal and a richer motion language is appropriate.

**If none of the above apply** — e.g. a static data table, a read-only dashboard, a dense internal tool
where users want no distractions — skip this step entirely. Do not add motion.

**If one or more apply**, read the `animator` skill and use it to specify motion for those elements only.
Work through its workflow (intent → interaction class → duration/easing → continuity anchor →
reduced-motion fallback → performance check) for each qualifying element. Document the decisions in the
motion manifest below, then carry the specs into Step 13's output.

**Motion manifest (fill in only for elements that pass the gate):**

```
Element           | Interaction class       | Intent                        | Invoke animator?
──────────────────────────────────────────────────────────────────────────────────────────────
[e.g. FilterPanel]| contextual transition   | show results updated in-place | yes
[e.g. SaveButton] | immediate acknowledgment| confirm input received        | yes
[e.g. DataTable]  | —                       | static; no motion warranted   | no
```

Elements marked "no" receive no motion treatment. Elements marked "yes" have their motion spec produced
by the animator skill before code is written, so timing and easing are grounded rather than guessed.

---

## Step 11 — Create New Components (Rare)

Only if no suitable existing component exists.

New components **must**:

- Follow design system conventions
- Use tokens exclusively (no hardcoded values)
- Be reusable across contexts (not single-use)
- Not duplicate any existing pattern

### Step 11a — Flag true net-new components for elevation

Classify every true net-new component against the governing question: **is this likely to be
reused?**

- **Clearly reusable primitives (atoms)** — buttons, badges, inputs, icons — **MUST** be
  flagged `ELEVATE`.
- **Composite components (molecules)** — a search field, a card, a form row — **MUST** be
  flagged `ELEVATE` by default, unless demonstrably bound to one screen and use case.
- **Larger, multi-part components (organisms)** — a full panel, a page section — are flagged
  `ELEVATE` **only** when clearly reusable across screens, not a one-off built for a specific
  page. Otherwise keep it route-local.
- **Unsure?** Flag it as a **borderline** elevation candidate rather than silently deciding
  either way — the orchestrator surfaces borderline cases as a human gate.

Flag `ELEVATE` (or `BORDERLINE`) in your output manifest alongside the component's file path.
This is the signal the orchestrator uses to promote it into the canonical component library and
dispatch `architect` to mirror it into Figma and wire Code Connect, after the warden gate
passes. Don't flag: single-use compositions, anything that's really a variant of an existing
component, or anything built inside a route-local components folder for one screen's use.

---

## Step 12 — Handle Data

For components requiring data:

1. **Use provided data sources** if specified
2. Otherwise, create a **mock dataset** in the project's mock-data / public assets directory as structured JSON

Mock data rules:

- Stored in the project's mock-data / public assets directory only — not embedded in components
- Designed for easy swap-and-replace with real data
- Typed with schemas defined in the project's type-definitions location

**Aggregation requirement:**  
All data must be modeled at the **lowest meaningful granularity for the domain at hand** first, then aggregated upward. This ensures that any filters on the screen dynamically update all data-backed components (KPI tiles, charts, tables) by propagating from the granular records.

```js
// type-definition example pattern
export const Record = {
  id: String,
  category: String,
  metrics: { ... }
}
```

---

## Step 13 — Output

Produce, in order:

1. **Interaction map** — flow steps → UI responsibilities
2. **Screen architecture** — layout regions + hierarchy
3. **Component manifest**:
   - Reused components (with source paths)
   - New components (with rationale)
   - Token usage summary
4. **State handling plan** — per component
5. **Generated code**:
   - Next.js page file
   - Composed component files
   - Mock data JSON in the project's mock-data / public assets directory (if applicable)
   - Type definitions (if applicable)

---

## Failure Handling

When ambiguity is encountered, **flag it — do not guess silently**:

| Problem                          | Response                                                            |
| -------------------------------- | ------------------------------------------------------------------- |
| Component mapping unclear        | List candidates, ask user to confirm                                |
| Conflicting patterns in codebase | Surface both, explain tradeoffs                                     |
| Missing design token             | Flag gap, use closest token temporarily, mark with `// TODO: token` |
| Ambiguous flow step              | Propose two interpretations, ask for confirmation                   |

---

## Quality Checklist

Before delivering output, verify:

- [ ] Structural consistency — component hierarchy is logical and clean
- [ ] Design system compliance — no hardcoded values, all tokens used correctly
- [ ] Flow alignment — every flow step has a corresponding UI element
- [ ] Reusability — no duplicated components, minimal bespoke code
- [ ] State coverage — loading/empty/error/success handled for all data components
- [ ] Data aggregation — lowest-level first, filters propagate correctly
- [ ] Portaling — all dropdowns, menus, tooltips, popovers, and modals are portaled to `document.body`
- [ ] Motion — Step 10 gate was applied; motion is present only where it passed; all motion specs were produced by the animator skill with reduced-motion fallbacks included

---
