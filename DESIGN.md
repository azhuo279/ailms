# AiLMS Design System — Structured Depth

**Status:** Locked. This document is the source of truth for design tokens. `src/app/globals.css`
implements it in code; the Figma library (linked below) mirrors it for design.

**Figma file:** https://www.figma.com/design/TLm314jvknL38gEyMCoB3u/XD-Practical---AiLMS
(canonical `fileKey`: `TLm314jvknL38gEyMCoB3u` — use this for all Figma REST/MCP calls.)

---

## 1. Direction

**Structured Depth** — a calm SaaS dashboard that reads as a trusted advisor workspace, with a
distinct, sparingly-used AI presence rather than an ambient "everything is AI" tint.

- **Base:** light neutral canvas, cool-toned. Raised surfaces are white, separated from the
  canvas by shadow elevation (not by darkness) — a clear, pronounced step up.
- **AI surfaces are the highest-elevation elements on any screen.** Containerized AI components
  (recommendation cards, AI summary cards, reasoning panels) sit above all operational surfaces
  in the Z-order and express this through a frosted glass treatment: a near-WHITE body (only a
  whisper of teal), a soft radial bloom of near-pure-white light across the card face originating
  upper-left and fading out (so light visibly reads across the surface, not just at the edges), a
  crisp near-white top highlight line, a very faint teal border (`ai-300` at low opacity), and
  `backdrop-filter: blur` where the browser supports it. Teal identity comes from the bloom,
  border, and text — not from a tinted fill; the body reads as bright white glass. This makes the
  AI surface read as a categorically different material
  from the flat operational chrome around it. Inline AI labels, badges, and text accents continue
  to use the existing `ai-fg` / `ai-emphasis` tokens — the glass treatment applies only to
  full containerized AI surfaces.
- **AI ramp is reserved.** The teal ramp appears only on AI reasoning/override surfaces. It is
  never reused for ordinary interactive UI (buttons, links, nav).
- **Severity ramp is reserved.** The red-orange ramp appears only for true severity/alert states
  (delays, failures, blocking exceptions) — never mixed with the AI ramp or used decoratively.
- **Primary/interactive is its own role.** A deep, saturated, blue-dominant color (slight cyan
  lean, never green-leaning) drives buttons, links, active nav states, and focus rings. It is
  deliberately darker and more saturated than the AI teal so the two are never confused.
- **Layout:** vertical left navbar (icon + label) for persistent wayfinding, generous whitespace,
  wider type-scale jumps between sizes for explicit hierarchy.
- **Typography:** one typeface throughout — **DM Sans**. No monospace, no second display face.

---

## 2. Primitive color ramps

All primitives are defined in OKLCH (`oklch(L C H)`), each family holding a fixed hue and
chroma curve across 11 lightness steps (`50` lightest → `950` darkest). Reach for a semantic
token (§3) in product code — the primitives below exist so semantic tokens have a governed
palette to draw from, not for direct use in components.

### `neutral` (hue 258 — cool gray, canvas/surface/text)

| Step | Value                   | Hex (approx) |
| ---- | ----------------------- | ------------ |
| 50   | `oklch(0.98 0.006 258)` | `#FAFBFC`    |
| 100  | `oklch(0.95 0.006 258)` | `#F1F2F5`    |
| 200  | `oklch(0.94 0.008 258)` | `#E8EBF1`    |
| 300  | `oklch(0.87 0.008 258)` | `#D1D4DA`    |
| 400  | `oklch(0.78 0.012 258)` | `#B4B8C0`    |
| 500  | `oklch(0.68 0.012 258)` | `#969AA3`    |
| 600  | `oklch(0.56 0.012 258)` | `#767A83`    |
| 700  | `oklch(0.44 0.012 258)` | `#585C64`    |
| 800  | `oklch(0.33 0.014 258)` | `#3C4047`    |
| 900  | `oklch(0.22 0.014 258)` | `#171B21`    |
| 950  | `oklch(0.15 0.014 258)` | `#0C0E12`    |

### `primary` (hue 250 — blue-dominant, interactive)

| Step | Value                   | Hex (approx)              |
| ---- | ----------------------- | ------------------------- |
| 50   | `oklch(0.97 0.016 250)` | `#F1F4FA`                 |
| 100  | `oklch(0.94 0.016 250)` | `#E2E8F4`                 |
| 200  | `oklch(0.87 0.033 250)` | `#C5D2ED`                 |
| 300  | `oklch(0.78 0.059 250)` | `#9DB2E0`                 |
| 400  | `oklch(0.68 0.098 250)` | `#6E8FD6`                 |
| 500  | `oklch(0.58 0.130 250)` | `#3E6DC4`                 |
| 600  | `oklch(0.49 0.130 250)` | `#1E58A8`                 |
| 700  | `oklch(0.41 0.123 250)` | `#0F4C81` ← locked anchor |
| 800  | `oklch(0.33 0.123 250)` | `#0B3A64`                 |
| 900  | `oklch(0.25 0.104 250)` | `#092A48`                 |
| 950  | `oklch(0.18 0.104 250)` | `#051A2D`                 |

### `ai` (hue 190 — reserved teal, AI surfaces only)

| Step | Value                   | Hex (approx)              |
| ---- | ----------------------- | ------------------------- |
| 50   | `oklch(0.97 0.013 190)` | `#EFF8F7`                 |
| 100  | `oklch(0.93 0.013 190)` | `#DDEEEC`                 |
| 200  | `oklch(0.87 0.028 190)` | `#C1E1DE`                 |
| 300  | `oklch(0.79 0.050 190)` | `#9BCEC9`                 |
| 400  | `oklch(0.71 0.083 190)` | `#6DB7B0`                 |
| 500  | `oklch(0.63 0.110 190)` | `#1F9D97` ← locked anchor |
| 600  | `oklch(0.53 0.110 190)` | `#187F7A`                 |
| 700  | `oklch(0.44 0.104 190)` | `#136560`                 |
| 800  | `oklch(0.35 0.104 190)` | `#0E4C48`                 |
| 900  | `oklch(0.26 0.088 190)` | `#0A3532`                 |
| 950  | `oklch(0.19 0.088 190)` | `#062220`                 |

### `severity` (hue 38 — reserved red-orange, alerts only)

| Step | Value                  | Hex (approx)              |
| ---- | ---------------------- | ------------------------- |
| 50   | `oklch(0.97 0.020 38)` | `#FBF1EA`                 |
| 100  | `oklch(0.93 0.020 38)` | `#F5E1D2`                 |
| 200  | `oklch(0.87 0.043 38)` | `#EBC7A8`                 |
| 300  | `oklch(0.79 0.077 38)` | `#DEA675`                 |
| 400  | `oklch(0.70 0.128 38)` | `#D07F3D`                 |
| 500  | `oklch(0.60 0.170 38)` | `#C25A0E`                 |
| 600  | `oklch(0.53 0.170 38)` | `#D1552B` ← locked anchor |
| 700  | `oklch(0.44 0.162 38)` | `#8B3812`                 |
| 800  | `oklch(0.35 0.162 38)` | `#6C2B0D`                 |
| 900  | `oklch(0.27 0.136 38)` | `#4F2009`                 |
| 950  | `oklch(0.20 0.136 38)` | `#341506`                 |

### `success` (hue 145 — green, positive/delivered states only)

| Step | Value                   | Hex (approx) |
| ---- | ----------------------- | ------------ |
| 50   | `oklch(0.97 0.02 145)`  | `#EDF9ED`    |
| 100  | `oklch(0.93 0.02 145)`  | `#E0ECE0`    |
| 200  | `oklch(0.87 0.045 145)` | `#C3DDC2`    |
| 300  | `oklch(0.79 0.08 145)`  | `#9BC99B`    |
| 400  | `oklch(0.7 0.12 145)`   | `#6CB26F`    |
| 500  | `oklch(0.6 0.145 145)`  | `#3D9645`    |
| 600  | `oklch(0.53 0.145 145)` | `#258030`    |
| 700  | `oklch(0.44 0.135 145)` | `#06641A`    |
| 800  | `oklch(0.35 0.135 145)` | `#004B00`    |
| 900  | `oklch(0.27 0.11 145)`  | `#003300`    |
| 950  | `oklch(0.2 0.11 145)`   | `#002000`    |

### `warning` (hue 85 — amber-gold, caution/pending-risk states only)

| Step | Value                  | Hex (approx) |
| ---- | ---------------------- | ------------ |
| 50   | `oklch(0.97 0.025 85)` | `#FDF4E3`    |
| 100  | `oklch(0.93 0.025 85)` | `#F0E7D6`    |
| 200  | `oklch(0.87 0.055 85)` | `#E5D2AC`    |
| 300  | `oklch(0.79 0.1 85)`   | `#D8B66D`    |
| 400  | `oklch(0.7 0.145 85)`  | `#C79600`    |
| 500  | `oklch(0.6 0.175 85)`  | `#AF7300`    |
| 600  | `oklch(0.53 0.175 85)` | `#995E00`    |
| 700  | `oklch(0.44 0.165 85)` | `#7B4500`    |
| 800  | `oklch(0.35 0.165 85)` | `#602B00`    |
| 900  | `oklch(0.27 0.135 85)` | `#431A00`    |
| 950  | `oklch(0.2 0.135 85)`  | `#300600`    |

Six primitive ramps total: `neutral`, `primary`, `ai`, `severity`, `success`, `warning`. Success
and warning complete the stoplight set alongside severity (red-orange = danger/blocking) —
together these three are the only ramps used for status/feedback communication; `ai` and
`primary` never carry status meaning.

Hex values are approximate sRGB conversions for reference/handoff; **OKLCH is the canonical
value** — use it in code and in Figma variables.

---

## 3. Semantic tokens

Semantic tokens are what components and Tailwind classes reference — never a primitive step
directly. Naming follows `role-variant` (e.g. `bg-surface-raised`, `text-fg-primary`,
`bg-btn-primary`). All are defined as CSS custom properties in the `@theme` block so they are
usable as Tailwind utilities (`bg-<token>`, `text-<token>`, `border-<token>`).

| Semantic token              | Primitive                      | Tailwind usage                      | Applies to                                                                                                                                                                                                                                       |
| --------------------------- | ------------------------------ | ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `--color-surface`           | `neutral-200`                  | `bg-surface`                        | App canvas / page background, incl. the app shell's inset route-content canvas                                                                                                                                                                   |
| `--color-surface-raised`    | `white` (`neutral-50` ceiling) | `bg-surface-raised`                 | Shell chrome, cards, panels — always paired with a shadow (for cards/panels) or a lighter surface beneath (for shell chrome), not a darker fill                                                                                                  |
| `--color-surface-sunken`    | `neutral-300`                  | `bg-surface-sunken`                 | Inset wells, input backgrounds, table stripe                                                                                                                                                                                                     |
| `--color-surface-overlay`   | `white` + shadow               | `bg-surface-overlay`                | Modals, dropdowns, popovers (portal to `document.body`)                                                                                                                                                                                          |
| `--color-fg-primary`        | `neutral-900`                  | `text-fg-primary`                   | Primary text, headings                                                                                                                                                                                                                           |
| `--color-fg-secondary`      | `neutral-700`                  | `text-fg-secondary`                 | Secondary/body text                                                                                                                                                                                                                              |
| `--color-fg-muted`          | `neutral-500`                  | `text-fg-muted`                     | Captions, timestamps, placeholder text                                                                                                                                                                                                           |
| `--color-fg-on-primary`     | `neutral-50`                   | `text-fg-on-primary`                | Text/icons on filled primary surfaces                                                                                                                                                                                                            |
| `--color-border-subtle`     | `neutral-200`                  | `border-border-subtle`              | Default dividers, card borders                                                                                                                                                                                                                   |
| `--color-border-strong`     | `neutral-400`                  | `border-border-strong`              | Emphasized dividers, focus-adjacent outlines                                                                                                                                                                                                     |
| `--color-btn-primary`       | `primary-700`                  | `bg-btn-primary`                    | Primary button fill                                                                                                                                                                                                                              |
| `--color-btn-primary-hover` | `primary-800`                  | `hover:bg-btn-primary-hover`        | Primary button hover                                                                                                                                                                                                                             |
| `--color-btn-primary-fg`    | `neutral-50`                   | `text-btn-primary-fg`               | Primary button label                                                                                                                                                                                                                             |
| `--color-link`              | `primary-700`                  | `text-link`                         | Links, text actions                                                                                                                                                                                                                              |
| `--color-link-hover`        | `primary-800`                  | `hover:text-link-hover`             | Link hover                                                                                                                                                                                                                                       |
| `--color-focus-ring`        | `primary-500`                  | `ring-focus-ring`                   | Focus rings on all interactive elements                                                                                                                                                                                                          |
| `--color-nav-active`        | `primary-700`                  | `bg-nav-active` / `text-nav-active` | Active nav item indicator/icon                                                                                                                                                                                                                   |
| `--color-selection-surface` | `primary-50`                   | `bg-selection-surface`              | Data Table batch-actions toolbar (distinct from the neutral `option-hover` row hover)                                                                                                                                                            |
| `--color-ai-surface`        | `ai-50`                        | `bg-ai-surface`                     | Inline AI tint — non-containerized AI regions (e.g. a highlighted row, an inline explanation strip). Lower elevation than glass cards.                                                                                                           |
| `--color-ai-card`           | near-white `oklch(0.98 0.008 190)` | `bg-ai-card`                    | **Frosted glass card fill** — the base fill for all containerized AI surfaces (recommendation cards, summary cards, reasoning panels). A near-WHITE body with only a whisper of teal (brighter than `ai-50`, which still reads as a visible tint). NOT an alias of a primitive step: the body must read as bright white glass, with teal identity coming from the bloom/border/text, not the fill. |
| `--color-ai-card-border`    | `ai-300` at `40% opacity`      | `border-ai-card-border`             | **Frosted glass card border** — faint teal outline that traces the card edge without competing with content. Applied as `border: 1px solid oklch(0.79 0.050 190 / 0.40)` in CSS; no Tailwind utility (opacity modifier required).                |
| `--color-ai-card-inset`     | near-white `oklch(0.995 0.006 190)` | `--color-ai-card-inset`        | **Bloom highlight color** — near-pure-white with a faint teal cast; the bright core of the radial-gradient FACE bloom on `.ai-card` (and the crisp top-highlight line). NOT an alias of a primitive step. Role changed: box-shadow inset only paints the card EDGES and could not render light across the face, so the interior bloom moved to a `radial-gradient` background layer — this token is its highlight color (see §5 AI surface elevation). |
| `--color-ai-border`         | `ai-500`                       | `border-ai-border`                  | AI panel accent border/top-stripe (non-glass contexts — e.g. a left-edge stripe on an inline AI annotation)                                                                                                                                      |
| `--color-ai-fg`             | `ai-700`                       | `text-ai-fg`                        | AI-panel accent text/icons                                                                                                                                                                                                                       |
| `--color-ai-emphasis`       | `ai-600`                       | `bg-ai-emphasis`                    | AI badges, "reasoning" chip fills                                                                                                                                                                                                                |
| `--color-severity-surface`  | `severity-50`                  | `bg-severity-surface`               | Alert/exception row or banner background                                                                                                                                                                                                         |
| `--color-severity-border`   | `severity-600`                 | `border-severity-border`            | Exception left-border stripe, alert outline                                                                                                                                                                                                      |
| `--color-severity-fg`       | `severity-700`                 | `text-severity-fg`                  | Severity text/icons                                                                                                                                                                                                                              |
| `--color-severity-emphasis` | `severity-600`                 | `bg-severity-emphasis`              | Severity badges                                                                                                                                                                                                                                  |
| `--color-success-surface`   | `success-50`                   | `bg-success-surface`                | Positive/confirmation row or banner background                                                                                                                                                                                                   |
| `--color-success-border`    | `success-600`                  | `border-success-border`             | Success outline, confirmation stripe                                                                                                                                                                                                             |
| `--color-success-fg`        | `success-700`                  | `text-success-fg`                   | Success text/icons                                                                                                                                                                                                                               |
| `--color-success-emphasis`  | `success-600`                  | `bg-success-emphasis`               | Success badges                                                                                                                                                                                                                                   |
| `--color-warning-surface`   | `warning-50`                   | `bg-warning-surface`                | Caution row or banner background                                                                                                                                                                                                                 |
| `--color-warning-border`    | `warning-600`                  | `border-warning-border`             | Caution outline, at-risk stripe                                                                                                                                                                                                                  |
| `--color-warning-fg`        | `warning-700`                  | `text-warning-fg`                   | Warning text/icons                                                                                                                                                                                                                               |
| `--color-warning-emphasis`  | `warning-600`                  | `bg-warning-emphasis`               | Warning badges                                                                                                                                                                                                                                   |

**Status ramp** (shipment/route states — distinct from severity; informational, not alarming):

| Semantic token             | Primitive      | Tailwind usage        |
| -------------------------- | -------------- | --------------------- |
| `--color-status-intransit` | `primary-500`  | `bg-status-intransit` |
| `--color-status-delivered` | `success-500`  | `bg-status-delivered` |
| `--color-status-delayed`   | `severity-500` | `bg-status-delayed`   |
| `--color-status-pending`   | `neutral-500`  | `bg-status-pending`   |

**Phase 3 addition — status soft-fill surfaces**, one step lighter than the accent above, for
Badge/Tag status chips (bg + fg pair) without an opacity-modifier workaround:

| Semantic token                     | Primitive      | Tailwind usage                |
| ---------------------------------- | -------------- | ----------------------------- |
| `--color-status-intransit-surface` | `primary-100`  | `bg-status-intransit-surface` |
| `--color-status-delivered-surface` | `success-100`  | `bg-status-delivered-surface` |
| `--color-status-delayed-surface`   | `severity-100` | `bg-status-delayed-surface`   |
| `--color-status-pending-surface`   | `neutral-200`  | `bg-status-pending-surface`   |

**Phase 3 addition — categorical data-viz sequence (FLAGGED GAP).** This document defines no
categorical/chart-series palette, and its own 6 primitive ramps cannot supply one: `ai` and
`severity` are role-reserved (never decorative/chart use per this document §1 and CLAUDE.md's
"Role-reserved palettes"), leaving only `neutral`/`primary`/`success`/`warning` — 4 hues, and the
latter two are themselves status-reserved. Rather than improvise from those, the 8-hue sequence
below is the `/dataviz` skill's validated brand-neutral default (blue, aqua, yellow, green,
violet, red, magenta, orange in this fixed order — the order is itself the CVD-safety mechanism
and must not be reshuffled). Re-validated against this project's `--color-surface-raised`
(`#f6f9fd`): passes the lightness-band, chroma-floor, and CVD-separation checks; three slots
(`chart-2`/`chart-3`/`chart-7`) land below 3:1 contrast on that surface, which the six-checks
method treats as legal only when the component ships a relief channel — the Chart component
(`src/components/ui/chart.tsx`) always pairs these with a legend and/or direct labels to satisfy
that. **This sequence is a placeholder pending an explicit design decision** — if AiLMS later
wants its own branded categorical order, replace these 8 values (keep the token names) and
re-run the validator.

| Semantic token    | Value                      | Hue     |
| ----------------- | -------------------------- | ------- |
| `--color-chart-1` | `oklch(0.575 0.163 255.5)` | blue    |
| `--color-chart-2` | `oklch(0.669 0.141 162.1)` | aqua    |
| `--color-chart-3` | `oklch(0.764 0.161 75.1)`  | yellow  |
| `--color-chart-4` | `oklch(0.529 0.18 142.5)`  | green   |
| `--color-chart-5` | `oklch(0.433 0.167 283.6)` | violet  |
| `--color-chart-6` | `oklch(0.623 0.191 24.9)`  | red     |
| `--color-chart-7` | `oklch(0.716 0.141 357.4)` | magenta |
| `--color-chart-8` | `oklch(0.671 0.175 40.6)`  | orange  |

For shipment-status series (in transit / delivered / delayed / pending), Chart uses the existing
`--color-status-*` tokens instead of this sequence — that ramp already carries the documented
meaning (DESIGN.md §3) and reusing it keeps a status-typed chart consistent with Badge/Tag.

**Phase 1 component-library additions** (added when scaffolding the core action/input
components — `src/components/ui/`):

| Semantic token                | Primitive              | Tailwind usage                 | Applies to                                       |
| ----------------------------- | ---------------------- | ------------------------------ | ------------------------------------------------ |
| `--color-fg-disabled`         | `neutral-400`          | `text-fg-disabled`             | Disabled text across buttons, inputs, controls   |
| `--color-surface-disabled`    | `neutral-200`          | `bg-surface-disabled`          | Disabled fill across buttons, inputs, controls   |
| `--color-border-disabled`     | `neutral-300`          | `border-disabled`              | Disabled outline across inputs, checkboxes, etc. |
| `--color-btn-secondary`       | `white` (`neutral-50`) | `bg-btn-secondary`             | Secondary/ghost button fill                      |
| `--color-btn-secondary-hover` | `neutral-100`          | `hover:bg-btn-secondary-hover` | Secondary button hover                           |
| `--color-btn-secondary-fg`    | `primary-700`          | `text-btn-secondary-fg`        | Secondary button label                           |
| `--color-option-hover`        | `neutral-100`          | `bg-option-hover`              | Select/Combobox/listbox option row hover         |
| `--color-checked`             | `primary-700`          | `bg-checked`                   | Checkbox/Radio/Switch-on fill                    |
| `--color-danger-surface`      | `severity-50`          | `bg-danger-surface`            | Form-field invalid state background              |
| `--color-danger-border`       | `severity-600`         | `border-danger-border`         | Form-field invalid state outline                 |
| `--color-danger-fg`           | `severity-700`         | `text-danger-fg`               | Form-field invalid state text/icon               |

`danger-*` is deliberately **not** the same semantic token as `severity-*`. `severity-*` stays
reserved for true shipment-level alerts/exceptions per this document's role-reserved-palette
rule; `danger-*` is form/input validation only, aliasing the same `severity` primitive ramp for
visual consistency without borrowing the reserved role. Form-valid state reuses `success-*`
directly (its reservation — "positive/delivered states only" — does not exclude form validation).

**Phase 4 addition — feedback and layered interaction components** (`src/components/ui/`:
Dialog, Drawer, Popover, Tooltip, Message Bar, Toast, Progress Indicator, Spinner, Skeleton):

| Semantic token          | Primitive     | Tailwind usage       | Applies to                                       |
| ----------------------- | ------------- | -------------------- | ------------------------------------------------ |
| `--color-info-surface`  | `primary-50`  | `bg-info-surface`    | Message Bar / Toast informational background     |
| `--color-info-border`   | `primary-600` | `border-info-border` | Message Bar / Toast informational outline/stripe |
| `--color-info-fg`       | `primary-700` | `text-info-fg`       | Message Bar / Toast informational text/icon      |
| `--color-info-emphasis` | `primary-600` | `bg-info-emphasis`   | Informational badge/icon fill                    |

`info-*` is a genuine gap fill, not a new primitive ramp: this document's stoplight set
(`success`/`warning`/`severity`) has no informational member, and `ai`/`severity` stay
role-reserved per §1 and CLAUDE.md's role-reservation rule. Rather than invent a 7th 11-step
primitive family for one variant, `info-*` aliases the existing `primary` ramp — the project's
established non-reserved interactive/emphasis role — mirroring the same alias pattern `danger-*`
already uses against `severity`. Message Bar and Toast's `info` severity variant uses these
tokens; their `success`/`warning`/`error` variants reuse the existing `success-*`/`warning-*`/
`danger-*` tokens above unchanged. `severity-*` remains available to either component for the
rare case for a Message Bar/Toast that is specifically surfacing a true shipment-level exception
(not a generic error) — that distinction is documented per-component in each file's doc comment.

### Dark mode

Structured Depth is defined light-first. A `.dark` remap of the surface/fg/border semantic
tokens only (not primary/ai/severity, which stay constant across themes) can be added later;
out of scope for this lock-in pass. `globals.css` keeps the remap hook but does not populate new
values beyond what's inherited from the previous placeholder theme.

---

## 4. Typography

**Single typeface: DM Sans** (Google Font, variable weights). No monospace. No second display
face — hierarchy comes from weight and size steps only, per the Structured Depth type scale.

14-style scale, replacing the earlier 5-style set — every UI role (workspace chrome, section/
card hierarchy, body copy, interactive labels, metadata) gets its own token instead of reusing
a handful of styles across unrelated purposes.

| Token               | Size                 | Weight | Line-height | Usage                     |
| ------------------- | -------------------- | ------ | ----------- | ------------------------- |
| `--text-display-xl` | `40px` / `2.5rem`    | 700    | `46px`      | Workspace titles          |
| `--text-display-l`  | `32px` / `2rem`      | 700    | `37px`      | Major pages               |
| `--text-heading-xl` | `24px` / `1.5rem`    | 600    | `30px`      | Section headers           |
| `--text-heading-l`  | `20px` / `1.25rem`   | 600    | `26px`      | Card titles               |
| `--text-heading-m`  | `18px` / `1.125rem`  | 600    | `23px`      | Nested sections           |
| `--text-title`      | `16px` / `1rem`      | 600    | `22px`      | Panels, dialogs           |
| `--text-body-l`     | `16px` / `1rem`      | 400    | `24px`      | AI summaries              |
| `--text-body-m`     | `14px` / `0.875rem`  | 400    | `21px`      | Standard paragraphs       |
| `--text-body-s`     | `13px` / `0.8125rem` | 400    | `19px`      | Table cells               |
| `--text-label-l`    | `14px` / `0.875rem`  | 500    | `18px`      | Form labels               |
| `--text-label-m`    | `13px` / `0.8125rem` | 500    | `17px`      | Buttons, tabs             |
| `--text-label-s`    | `12px` / `0.75rem`   | 500    | `16px`      | Chips, status             |
| `--text-caption`    | `12px` / `0.75rem`   | 400    | `16px`      | Metadata                  |
| `--text-footnote`   | `11px` / `0.6875rem` | 400    | `15px`      | Legal, secondary metadata |

Font weights used: 400 (body/caption/footnote), 500 (labels), 600 (headings/title), 700 (display
only). Do not introduce 300 or 800/900 — keep the weight vocabulary to these four steps, which
map 1:1 to DM Sans's Regular/Medium/SemiBold/Bold cuts. No letter-spacing/tracking is applied
anywhere in this scale (all styles use default `0` tracking) — the earlier caption treatment's
uppercase + wide tracking was dropped when the scale expanded; if a component needs an
uppercase/tracked micro-label, apply `uppercase` + tracking utilities directly rather than
baking it into a shared token.

Implementation: loaded via `next/font/google` as `DM_Sans`, bound to `--font-sans`; Tailwind's
default `font-sans` utility resolves to it project-wide. No `--font-mono` token remains — any
previously mono-styled field (IDs, timestamps) uses `--text-caption` or `--text-body-s` in the
same DM Sans family instead, per this lock-in's "no mono" instruction.

**Typography primitives.** Unlike color, Tailwind/CSS has no notion of a typography "variable" —
each text token above is a fixed bundle of family + size + weight + line-height, not a single
value. In Figma this is mirrored as a dedicated `Typography Primitives` variable collection
(`font/family/*`, `font/weight/*`, `font/size/*`, `font/line-height/*`, `font/letter-spacing/*`),
and each of the 14 text styles binds its `fontFamily` / `fontSize` / `fontStyle` / `lineHeight`
fields to those variables rather than holding raw literals — so a primitive change (e.g. bumping
`font/size/body-m`) propagates to every style built on it. Code has no equivalent bindable
primitive layer for typography; `globals.css` keeps the bundled values directly on `--text-*`
tokens as shown in the table above.

**Line-height unit gotcha (binding, not display).** Figma's Plugin API accepts `{value, unit:
'PERCENT'}` on an _unbound_ text style's `lineHeight`, but once a variable is bound to that field
via `setBoundVariable`, Figma always interprets the bound number as **absolute pixels** —
the unit is not preserved from the literal set beforehand. The `font/line-height/*` primitives
are therefore authored directly in pixels (not percentages), computed from each style's ratio
(e.g. Display XL: 40px × 1.15 ≈ 46px) rather than stored as a percent and converted at apply
time. Get this wrong and every bound text style silently renders with its line-height value
misapplied as a pixel count instead of a percentage (e.g. a "150%" intended value becomes a
literal, absurd 150px line-height) — correct but only visible once you inspect the rendered
style, not from the script succeeding.

---

## 5. Spacing, radius, shadow

Per this lock-in decision, these three token families use **Tailwind's stock utility scale
directly** — no custom `--spacing-*`/`--radius-*`/`--shadow-*` overrides in `@theme`. Reference
Tailwind's defaults (`p-4`, `gap-6`, `rounded-lg`, `shadow-md`, etc.) directly in components.

Two conventions from the style-tile exploration to carry forward when applying these utilities:

- **Elevation is a shadow step, not a darker fill.** Raised surfaces are `bg-surface-raised`
  (white) at increasing `shadow-*` weights as depth increases (`shadow-sm` → `shadow-md` →
  `shadow-lg`), never a darker background color.
- **Radius:** `rounded-lg` (`0.5rem`) for cards/panels, `rounded-md` (`0.375rem`) for buttons/
  inputs, `rounded-full` for badges/pills/avatars. Do not introduce a custom radius scale.

### AI surface elevation (glass treatment)

AI containerized surfaces (recommendation cards, summary cards, reasoning panels) are the
**highest-elevation elements on any screen** — they sit above all operational chrome in the Z-order
and must feel materially distinct. The treatment has three layers:

**1. Fill — `bg-ai-card` (near-white `oklch(0.98 0.008 190)`)**
A near-WHITE body with only a whisper of teal — it must read as bright white glass, not a teal
panel. Teal identity comes from the bloom, border, and text, not the fill. Not an alias of a
primitive step: even `ai-50` (`0.97`) reads as a visible teal tint, so the fill is pushed brighter
to `0.98` with minimal chroma.

**2. Face bloom — radial gradient of near-pure-white light across the card face**
This is what makes the card read as glass rather than a flat even box. A `box-shadow` inset only
paints the card **edges**, so it cannot render light across the card **face** — the interior bloom
is therefore a `radial-gradient` layered over the fill via `background`. A bright near-pure-white
core (`oklch(0.995 0.006 190)`, `--color-ai-card-inset`) originates **upper-left** (`15% 0%`) and
fades to transparent by ~`55%`, so light visibly blooms across the surface and falls off into the
near-white body. A single crisp near-white top-highlight line (`box-shadow` inset `0 1px 0`) marks
the glass top edge. Applied as a layered `background` plus a slimmed `box-shadow`:

```css
.ai-card {
  background:
    radial-gradient(
      120% 120% at 15% 0%,
      oklch(0.995 0.006 190 / 0.9) 0%,
      oklch(0.99 0.006 190 / 0) 55%
    ),
    /* near-white face bloom — upper-left, fades out */ var(--color-ai-card); /* near-white body */
  border: 1px solid oklch(0.79 0.05 190 / 0.4); /* ai-300 @ 40% opacity */
  border-radius: 0.75rem; /* rounded-xl — one step up from standard cards */
  box-shadow:
    inset 0 1px 0 0 oklch(0.99 0.008 190 / 0.95),
    /* near-white crisp top highlight line */ 0 4px 24px 0
      oklch(0.63 0.11 190 / 0.1),
    /* ai-500 outer glow — subtle halo */ 0 1px 4px 0
      oklch(0.44 0.104 190 / 0.08); /* ai-700 contact shadow — grounds the card */
  backdrop-filter: blur(
    8px
  ); /* frosted glass — graceful degradation: no fill change if unsupported */
  -webkit-backdrop-filter: blur(8px);
}
```

**3. Border — `ai-300` at 40% opacity**
A faint teal hairline that traces the card edge. Kept at low opacity so it reads as a material
boundary, not a colorful accent. Do not substitute `--color-ai-border` (`ai-500`) here — that
token is for non-glass accent stripes (left-edge annotations, inline callouts) and is too
saturated for a full card border.

**Radius exception:** AI glass cards use `rounded-xl` (`0.75rem`) instead of the standard
`rounded-lg` (`0.5rem`) for cards. The larger radius softens the material quality and prevents
the glass treatment from reading as an alert or modal. Inline AI surfaces (strips, annotations)
retain `rounded-lg`.

**Figma implementation note:** Figma does not support `backdrop-filter` — represent the frosted
glass in Figma with two layered fills on the frame: a **radial-gradient fill** for the face bloom
(from near-white `oklch(0.995 0.006 190)` at 90% at the upper-left focal point `15% 0%`, fading to
0% alpha by ~55% of the radius) over a solid near-white base fill (`oklch(0.98 0.008 190)`). Add an
inner shadow effect (color: near-white `oklch(0.99 0.008 190)`, offset: 0/1, blur: 0, spread: 0)
for the crisp top-highlight line. The outer shadow effect uses `ai-500` at 10% (plus the `ai-700`
contact shadow at 8%). Note that Figma's inner-shadow effects cannot reproduce a face bloom, so the
gradient fill is what carries it — do not fall back to an inner shadow for the bloom. Document the
`backdrop-filter` as a code-only
enhancement on the Radius and Spacing Foundations page.

**Elevation stack (full screen, low → high):**

| Layer | Surface                                | Treatment                                                  |
| ----- | -------------------------------------- | ---------------------------------------------------------- |
| 0     | App canvas                             | `bg-surface` (neutral-200) — the floor                     |
| 1     | Operational panels (feed, context col) | `bg-surface-raised` (white) + `shadow-sm`                  |
| 2     | Operational cards within panels        | `bg-surface-raised` + `shadow-md`                          |
| 3     | **AI glass cards**                     | `bg-ai-card` + inset glow + outer halo + `backdrop-filter` |
| 4     | Modals / overlays                      | `bg-surface-overlay` (white) + `shadow-lg`                 |

AI glass cards (layer 3) sit above all operational content (layers 1–2) but below modals
(layer 4). They never compete with modal overlays and never appear inside a modal.

---

## 6. Figma sync

- **File:** https://www.figma.com/design/TLm314jvknL38gEyMCoB3u/XD-Practical---AiLMS
  (`fileKey = TLm314jvknL38gEyMCoB3u`)
- **Five variable collections** mirror the token layers in this document:
  - `Primitives` — all 66 color steps (6 ramps × 11 steps: `neutral`, `primary`, `ai`, `severity`,
    `success`, `warning`), scopes hidden (`[]`) so they never appear in ordinary pickers.
  - `Semantic Colors` — every token in §3, aliasing `Primitives` (never holding a raw value),
    each scoped to its actual use (`TEXT_FILL`, `FRAME_FILL`/`SHAPE_FILL`, `STROKE_COLOR`, etc.)
    and carrying `WEB` code syntax pointing at the exact `var(--color-*)` name in `globals.css`.
  - `Typography Primitives` — `font/family/*`, `font/weight/*`, `font/size/*`,
    `font/line-height/*` (authored in pixels — see the binding gotcha in §4),
    `font/letter-spacing/*`; the 14 text styles bind to these rather than holding literals.
  - `Radius` — `radius/sm|md|lg|xl|2xl|3xl|full`, matching Tailwind's stock corner-radius scale.
  - `Spacing` — `spacing/1..24`, matching Tailwind's stock `p-*`/`gap-*` scale (4px base unit).
  - Shadow has no Figma variable type (effects aren't variable-bindable) — documented on the
    Radius and Spacing Foundations page as reference effect styles only, not a variable collection.
- Typography tokens in §4 are pushed as Figma **text styles** — `Display XL/700`, `Display L/700`,
  `Heading XL/600`, `Heading L/600`, `Heading M/600`, `Title/600`, `Body L/400`, `Body M/400`,
  `Body S/400`, `Label L/500`, `Label M/500`, `Label S/500`, `Caption/400`, `Footnote/400` — each
  bound to the `Typography Primitives` collection.
- **Foundations pages** (`Colors`, `Typography`, `Radius and Spacing`) visually document every
  collection above with swatches, specimens, and a primitives reference table — regenerate them
  whenever a primitive or semantic value changes so the mirror never goes stale.
- Code is the source of truth. If Figma variables or styles drift from this document, this
  document and `globals.css` win — resync Figma, not the reverse.
