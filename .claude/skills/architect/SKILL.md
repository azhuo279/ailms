---
name: architect
description: >-
  Build and maintain the UI design system's foundation end-to-end: design
  tokens (the Tailwind v4 `@theme` block in the global stylesheet), the
  component library's structural conventions, and a clean code-first sync
  between the codebase and the Figma design-system file via Figma Code
  Connect — code is the source of truth and Figma is a generated mirror,
  with a gated read-back for the rare designer tweak. Use this whenever the
  user is setting up, extending, auditing, or reconciling the design system —
  filling out a color/spacing/radius token set from a rough brand guide,
  defining new semantic tokens, pushing a code component into Figma as its
  own mirror page, wiring up or fixing Code Connect, or enforcing naming and
  token consistency across code and Figma. Trigger even when the user
  mentions only part of this — "add a token", "sync this component to
  Figma", "our tokens are a mess", "set up Code Connect", "we have a brand
  guide but no tokens yet", "audit our design-system Figma sync". Do NOT use
  for composing one-off screens or pages out of an already-built design
  system (that is `composer`), for generic Figma diagramming, or for visual
  design work that never touches tokens, shared components, or code↔Figma
  sync.
---

# Architect — design-system foundation: tokens & Code-Connect maintainer

> **Code-first.** In this project, **code is the source of truth** — the Tailwind v4 `@theme`
> block in `src/app/globals.css` (there is no `tailwind.config.js`) and the components in
> `src/components/ui/` / `src/components/shared/` define the system. Any Figma design-system
> file is a **generated mirror + documentation surface**, not a canonical structural source.
> The default sync direction is **code → Figma**: build/maintain in code, then push the result
> to Figma and link it with Code Connect. A **gated read-back** (Figma → code) is retained only
> for the rare case where a designer tweaks the mirror directly and the change must flow back —
> never automatic, always surfaced to a human.

Your job is to build and keep the design-system foundation **well structured and maintained**,
no matter how rough the starting point. You bring structure — a layered token system in
`globals.css`, and a consistent set of Code-Connected components — and keep the codebase and
the Figma library (if one exists for this project) in lockstep.

You do not talk to Figma's raw Plugin API from memory. Writing to Figma goes through the
`use_figma` MCP tool, and **before the first `use_figma` call you load Figma's own guidance**
(the `figma-use` skill, plus `figma-generate-library` when creating components). Those teach
the *how* of the Plugin API; this skill owns the *what*, the *order*, the *naming*, and the
*sync*. See `references/figma-bridge.md`.

## The laws

These are the few hard constraints. Everything else is judgment.

1. **Code is the source of truth; Figma is the generated mirror.** `src/app/globals.css`
   (tokens) + `src/components/ui/` / `src/components/shared/` (components) define the system.
   Figma reflects what code already is — you push to it (code → Figma), you do not read
   structure *from* it as canonical; the only path back is the **gated read-back** (Direction
   C), never automatic.
2. **Tokens are the only place raw values live.** Never write a raw hex/OKLCH literal or a
   magic pixel number into a component — not in JSX/className, not in a Figma fill or padding.
   A component references a *semantic* token; the semantic token holds (or, where a primitive
   scale exists, aliases) the raw value. This is what makes a theme or brand tweak a one-line
   change instead of a find-and-replace across the codebase.
3. **Semantic over primitive at the point of use.** Components should almost never reference a
   primitive directly (`blue-500`); they reference intent (`bg-primary`, `text-muted`,
   `border-focus`). Primitives are an implementation detail of the semantic layer. See
   `references/token-system.md` for the full layering model.
4. **Naming parity is what makes sync clean.** The same component, prop, and token must be
   recognizably the same string on both sides. PascalCase components, camelCase props,
   kebab-case files, kebab/slash token paths — applied identically in code and Figma. Get this
   wrong and Code Connect mappings rot. Full rules: `references/naming-conventions.md`.
5. **A component must be *published* to a Figma library before Code Connect can map it.**
   Mapping an unpublished component fails. Every component follows the same path: build the
   Figma mirror page (from the code component) → publish → map → verify. Each component lives
   on **its own Figma page** (only sub-parts that compose the *same* component share a page,
   e.g. `TableCell` / `TableColumn` / `Table`).
6. **Inspect before you create.** Run a read-only pass over both the codebase and the Figma
   file (if one exists) first, learn the conventions already in use, and match them. Detecting
   and conforming to an existing system beats imposing a fresh one. Only fall back to this
   skill's defaults when there's genuinely nothing to match.
7. **Role-reserved palettes stay reserved.** If the token set carves out a ramp for a specific
   role (e.g. this project's `status-*` shipment-state colors), never repurpose it for unrelated
   emphasis, and never invent a new raw color when an existing reserved ramp already covers the
   role. See CLAUDE.md's "Role-reserved palettes" section — architect is what extends those
   ramps when a new state is genuinely needed.
8. **A variant is a prop, not a sibling component.** Never split one conceptual component into
   two just to express a configuration of it — an icon-only affordance, a compact density, a
   destructive emphasis are all variants/props on the same component, not a second component
   with its own file and its own Figma page. Merge on sight if you find this pattern (e.g. a
   `Button` and a parallel `IconButton` that differ only by whether `children` is present).
   The one exception is a genuine sub-part of the same system with its own responsibilities
   (`TableCell`/`Table`, or a `ToastProvider`/`useToast` hook alongside the visual `Toast`) —
   that's composition, not a variant split, and those legitimately get their own files while
   still sharing one Figma page per law 5.
9. **Icons inherit color and size from their context — never bind a fixed color/size to an icon
   slot.** An icon placed inside a colored surface (a filled Button, a status Badge, a Message
   Bar) must resolve to the *same* semantic foreground token the adjacent text on that surface
   uses (e.g. a primary Button's label and its leading/trailing icon both resolve to
   `text-btn-primary-fg` — never leave the icon on a default/neutral fill while the label sits on
   `fg-on-primary`). In code this almost always means the icon should inherit `currentColor` (or
   receive the same token class as the text sibling) rather than carrying its own hardcoded
   color; in Figma it means binding the icon instance's fill/stroke to the *same* variable the
   adjacent text layer uses, not leaving it on the Icon component's own default.

   **This is a mandatory, proactive build-time check — not something to fix only when reported.**
   In practice this bug has shown up as a *Figma-only* defect three separate times (Button,
   Tag, Checkbox) while the code component was already correct every time: an icon vector
   inside a filled/colored variant was hardcoded to a raw color or left unbound entirely, and
   it's invisible unless you specifically look at the colored variant (a neutral/default state
   never exposes it). So treat every icon that lives inside a filled/colored/semantic variant —
   not just "new" components — as needing this check, including ones already shipped. Before
   marking any component with an icon-in-colored-surface done: `get_metadata` or
   `get_design_context` the icon's actual fill/stroke value on **every** colored/semantic
   variant (not just default), confirm it's a bound variable (not a raw/hardcoded value) equal
   to the sibling text's variable, and screenshot that specific variant zoomed in enough to
   read the icon's contrast against its fill. Don't infer correctness from the default/neutral
   variant looking fine.

## Naming, in one screen

Full table and worked round-trip example live in `references/naming-conventions.md`. The essentials:

| Thing | Code | Figma | Example |
|---|---|---|---|
| Component | PascalCase | PascalCase (main component / set) | `FileUploader` |
| Component file | kebab-case | — | `file-uploader.tsx` |
| Prop | camelCase | camelCase (Figma property name) | `isLoading`, `variant`, `size` |
| Variant values | code union literals | identical variant option strings | `'primary' \| 'secondary'` ↔ `primary` / `secondary` |
| Semantic token | `{role}-{variant}[-{state}]` | `{role}/{variant}` | `bg-surface` ↔ `bg/surface` |

The bridge between code and Figma token names is the `/` ↔ `-` swap: Figma groups with
slashes, the Tailwind `@theme` block uses hyphens (`--color-fg-primary`). Keep that transform
**uniform** across the whole collection or round-tripping breaks. Name Figma component
*properties* in camelCase to match React props 1:1 — that makes the Code Connect mapping
nearly an identity function.

## Decide the direction first

Before doing anything, figure out which of these you're in. Each links to its detailed
playbook. The everyday direction is **code → Figma** (A then B/E); Figma → code (C) is the
rare, gated exception.

- **A — Tokens (new or filling gaps).** A missing semantic token, a new status color, spacing/
  radius/shadow additions. Define in `src/app/globals.css`'s `@theme` block (never in a
  component). Then, if a Figma design-system file exists for this project, **generate** the
  matching Figma variables from it (semantics → scopes → code syntax). → `references/token-system.md`
- **B — Component built/owned in code → push to Figma (the COMMON path).** A component exists
  in `src/components/ui/` or `src/components/shared/`. Mirror it into Figma: scaffold the
  Figma component/variant set **from the code component** on **its own page**, bind tokens,
  publish, and wire Code Connect. → `references/component-workflow.md` (then `references/code-connect.md`)
- **C — Change made in Figma → gated read-back to code (RARE).** Only when a designer edited a
  token or component *directly in the Figma mirror* and that change must flow back. Read it via
  MCP, **surface a diff to a human** (never auto-apply), and on approval update the matching
  `globals.css` token / component and refresh the Code Connect link. → `references/component-workflow.md`
- **D — Audit / reconcile / maintain.** Sweep for drift: components not Code-Connected to a
  Figma page, raw values that should be tokens, naming inconsistencies. → see *Maintenance*
  below.
- **E — Code-Connect a component to its Figma page.** A component in `src/components/ui/` or
  `src/components/shared/` exists and its mirror page is published. Map component props → the
  Figma component's properties, and commit a `.figma.tsx` template. → `references/code-connect.md`

If the user's intent spans several of these (common — "set up our design system in Figma"),
sequence them: tokens (A) first, then mirror + Code-Connect the components (B → E) in
dependency order (primitives before composites), then an audit (D). Direction C is invoked
only on an explicit read-back request.

## Conflict policy (code-first)

**Code wins by default.** Code → Figma is the primary loop; you regenerate the Figma mirror
from code whenever they diverge. The only time you propagate Figma → code is the **gated
read-back** (Direction C): a deliberate, human-requested pull for a change a designer made
directly in the mirror. Even then, never auto-apply — **show the diff (code vs. Figma) side by
side and let the user choose** before touching `globals.css` or the component. Never silently
overwrite code with a Figma value. This mirrors CLAUDE.md's "Code + tokens are canonical where
Figma diverges" rule.

## The Figma bridge, briefly

`use_figma` and the read tools need a concrete `fileKey` + `nodeId`; they can't act on a vague
"the button somewhere in the file." So:

- Use the **Figma REST API** (or MCP `get_metadata` as the no-token fallback) purely to
  *navigate and resolve* — list the file's pages, find the component/node you want by name,
  read back its `nodeId`.
- Use the **Figma MCP** to do the actual work: read (`get_design_context`, `get_variable_defs`,
  `search_design_system`, `get_context_for_code_connect`), write (`use_figma`), and Code Connect
  (`add_code_connect_map`, `get_code_connect_map`, `send_code_connect_mappings`,
  `get_code_connect_suggestions`).

This project currently has **no registered Figma design-system file** — if the user hasn't
given you a file URL, ask for one before any Direction A/B/C/E work that needs to write to
Figma; token work that stays code-only (editing `globals.css`) never requires this. Details,
auth, and the figma-use loading rule: `references/figma-bridge.md`.

## Checkpoints

A maintained system is reviewed as it's built. Pause for the user's sign-off at these gates,
showing a screenshot or summary each time:

- After the **token plan** (the proposed primitive palette + semantic set) and before writing
  to `globals.css` or creating Figma variables.
- After the **file/page structure** in Figma and before building components.
- After **each component** (or each small batch) — show the rendered variants before moving on.

These gates exist because subtle design choices (a wrong token name, a clipped frame, an off
semantic mapping) are cheap to fix early and expensive later. Don't batch a whole library past
the user unseen.

## Maintenance (direction D)

When asked to audit or "clean up" the design system, check and report on:

- **Raw values** in components (hex, OKLCH, px, rgba) that should be tokens.
- **Naming drift** — components/props/tokens that violate the parity table, or whose `/`↔`-`
  transform is inconsistent.
- **Unmapped components** — components in `src/components/ui/` / `src/components/shared/` with
  no Figma mirror page or no Code Connect entry (`get_code_connect_suggestions`).
- **Orphans & duplicates** — tokens defined but unused, or two tokens with the same value.
- **Scope/code-syntax gaps** — Figma variables left at `ALL_SCOPES` or missing WEB code syntax
  (breaks Dev Mode handoff and token round-trip).
- **Reserved-ramp violations** — a role-reserved palette (e.g. `status-*`) used for something
  outside its role, per CLAUDE.md.

Present findings as a prioritized list with proposed fixes; apply them in the same A/B/C/E
flows above once the user picks.

## Reference files

- `references/naming-conventions.md` — the complete naming law and a Button round-trip example.
- `references/token-system.md` — the layered token model, generating primitive scales from a
  brand guide, and the exact `@theme` representation and Figma-variable mechanics.
- `references/figma-bridge.md` — REST API navigation, MCP read/write tools, the figma-use
  loading rule, Plugin API laws, and the standard page structure.
- `references/code-connect.md` — Code Connect setup, `figma.config.json`, the component → its
  Figma mirror page mapping pattern, committed `.figma.tsx` templates vs. MCP mapping tools, the
  primitives-then-composites order, and verification.
- `references/component-workflow.md` — step-by-step for direction B (code→Figma, the common
  path) and direction C (the gated Figma→code read-back), with a primitive and a composite
  example.
