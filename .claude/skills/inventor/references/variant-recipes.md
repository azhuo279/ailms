# Variant Recipes

Two jobs live here: (1) pick **three genuinely different angles** on the same feedback, and
(2) **port a real component/page into a self-contained, token-grounded, interactive HTML
mockup** that reads like real code, not a wireframe.

---

## Part 1 — Choosing three angles

The feedback names a symptom; you redesign the **problem behind it**. From that problem,
pick three lenses that resolve it _differently_. They should sit at different points on an
effort/risk/ambition curve, so the designer sees a real spread of choices.

A reliable default trio:

| Angle                                | Lens                                                                                                                                                                            | Effort/Risk | Picks it when…                                                                   |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------- | -------------------------------------------------------------------------------- |
| **A — Conservative / in-place**      | Smallest change inside the current layout that resolves the feedback. Reuse the exact components; adjust constraints (overflow, height, wrapping, sticky).                      | Low         | The current design is basically right; the feedback is a containment/polish bug. |
| **B — Restructure / re-layout**      | Keep the components but rethink the container and information hierarchy. Split into tabs/sections, summary + expand, regroup, change the grid.                                  | Medium      | The content is right but doesn't _fit_ or doesn't prioritize well.               |
| **C — Reconceive / new interaction** | Change _how_ the user reaches the goal. Swap the interaction model: list → searchable table, static → toggleable, fixed → filterable, modal → inline drawer, scroll → paginate. | High        | The feedback hints the underlying task is harder than the current UI admits.     |

You are not bound to this trio — but whatever three you pick must (a) each fully resolve
the feedback, (b) be buildable from the project's existing component library, and (c)
differ in _kind_, not just _degree_. Three sizes of the same fix is the failure mode.

### Worked example — annotation "Make this scrollable please" on a `<RankBar>` list

Target: a `<ul>` of ranked rows (e.g. Region A 86%, Region B 81%, Region C 78%, Region D
59%…) that overflows its container. The literal ask is "scroll"; the **problem** is _the
ranking overflows and truncates entries the user needs to compare._

- **A — Conservative:** give the `<ul>` a fixed max-height with `overflow-y-auto`, pin the
  title row, and add a subtle fade/scrollbar so it's clearly scrollable. _Tradeoff:_ an
  inner scrollbar adds chrome and hides lower ranks below the fold until the user scrolls.
- **B — Restructure:** show a **top-5 + "show all (N)" expander**. The common case fits with
  no scroll; the full ranking expands inline on demand. _Tradeoff:_ full comparison is one
  click away, not immediate; the expander is a small new affordance to learn.
- **C — Reconceive:** turn the ranking into a **compact searchable/sortable mini-table** —
  type a name to filter, click a column to re-sort. _Tradeoff:_ most capable for
  large sets but heaviest to build, and arguably over-powered for a 6-row list.

All three kill the overflow; each costs something different; each is built from real
primitives (the list/bar pattern, a Button/Link expander, a small table + SearchBox).

---

## Part 2 — Porting a real component into a self-contained HTML mockup

The variant must **look and behave like the real thing**. The trick is to mirror the real
component's structure and _resolve its Tailwind classes to the underlying tokens_, then
write those tokens as inline CSS. You are translating, not redesigning the design system.

### Step 2.0 — Build a component manifest first (MANDATORY, before any HTML)

This is the step whose absence is the #1 failure mode: porting the _target_ component
faithfully but then hand-rolling every incidental button, tag, chip, or input a variant
introduces. A variant that invents its own `<button>` instead of porting the real `Button`
**is not reuse** — it defeats the whole point of grounding directions in the design system. This is a failure mode.

So before writing a single line of mockup HTML, walk all three angles and **enumerate every
component each one renders** — not just the feedback's target, but every primitive the angle
pulls in (a "Show all" expander → `Button`; a count pill → `Tag`; a filter pill → `Chip`; a
toggle → `ContentSwitcher`/`Switch`; a search field → `SearchBox`; a status pill →
`status-tag`). For each, this is the composer's Step 5 ("Discover Existing Components") run
in miniature:

- **ALWAYS** map an element to an existing component in the project's component library
  before inventing markup. If the design system has a `Button`, your variant's buttons are
  ports of `Button` — full stop.
- **READ the real component's source** (`button.tsx`, `tag.tsx`, `chip.tsx`, …) so the port
  matches its actual size scale, radius, padding, typography weight, and **interaction
  states** (default / hover / pressed / selected / disabled). Do not eyeball it.
- **NEVER** hand-roll a primitive the library already provides, even for a one-off. "It's
  just a small button" is exactly when the drift happens.

Write the manifest into `brief.md` (and surface it in the report's per-variant "Reuses"
line) in this shape (component names are illustrative — use the real ones from the host
project's library):

```
Variant A reuses: Card shell · InlineAlert · Tag(size=small, rounded)
Variant B reuses: + Button(secondaryOutline, medium) · Accordion (collapse)
Variant C reuses: + Button(secondaryOutline) for actions · ContentSwitcher (view toggle)
Missing (needs new): <none> | <name + why nothing fits>
```

Only after the manifest exists do you port tokens (2.1) and shapes (2.2). Every component in
the manifest must be ported per 2.2 with its real classes resolved to tokens — including the
state you depict (a hovered button uses the real hover token, a selected chip the real
selected fill).

### Step 2.1 — Pull the used token subset into the report `:root`

Read the real component's classes and the project's token source, and copy **only the
tokens the mockups actually use** into the template's `:root`. This keeps the file small and
the values exact. Use the canonical values from the project's token source — examples below
are illustrative; verify against the live token file, don't trust this list as authoritative:

```css
:root {
  /* type scale */
  --font-sans: system-ui, sans-serif;
  --text-xs: 0.75rem;
  --text-sm: 0.875rem;
  --text-md: 1rem;
  --text-lg: 1.125rem;
  /* spacing base (token n = n * 0.25rem) */
  --space-1: 0.25rem;
  --space-2: 0.5rem;
  --space-3: 0.75rem;
  --space-4: 1rem;
  --space-6: 1.5rem;
  /* radius */
  --radius-sm: 0.25rem;
  --radius-md: 0.5rem;
  --radius-full: 9999px;
  --radius-card: 1rem;
  /* shadow */
  --shadow-sm:
    0px 1px 2px 0px rgba(16, 24, 40, 0.05),
    0px 1px 3px 0px rgba(16, 24, 40, 0.05);
  /* neutrals — non-AI surfaces */
  --color-neutral-100: #f3f4f6;
  --color-neutral-200: #e5e7eb;
  --color-neutral-300: #d2d6db;
  --color-neutral-500: #6c737f;
  --color-neutral-700: #384250;
  --color-neutral-900: #111927;
  /* semantic fg/bg — copy the specific ones your surface uses from the token source */
  /* primary / band colors — pull the exact ramp steps the component renders */
  --color-primary-600: #1b8354;
  /* any role-reserved ramp the project defines (e.g. AI surfaces) — pull its real value */
  --color-secondary-600: #6d428f;
}
```

Rules that carry over verbatim from the design system (confirm the specifics against the
host project — the examples below show the _kind_ of rule to honor):

- **Honor role-reserved palettes.** If the project reserves a ramp for a specific role
  (e.g. a dedicated palette for AI-generated surfaces), use it only for that role and use
  neutral for everything else — never hard-code its hex and never repurpose it for unrelated
  emphasis.
- **No inline px.** Map every pixel to the nearest token. Sub-pixel rounding (27.67→28) is
  fine, but reference a token, not a raw px, in the mockup.
- **Watch for broken or special-cased tokens** the project documents (e.g. a "white"
  utility that resolves to transparent — use `#ffffff` directly; or a translucent surface
  that needs a paired `backdrop-filter: blur(...)`).
- **Semantic `bg-*` tokens may not be plain utilities** in some setups — but in the _mockup_
  you're writing raw CSS, so just use `background: var(--bg-error-50)` after copying that
  variable in. Keep the names aligned with the token source so it stays auditable.

### Step 2.2 — Mirror each manifest component's real shape

Recreate the structure the real component renders, class-for-token — **for every component
in the manifest, not only the feedback's target.** A ported `Button` must carry the real
`rounded-full`, height/padding scale, `text-sm font-medium`, and the correct style palette
(e.g. `secondaryOutline` = transparent fill + `border-border-subtle` + `text-fg-default`,
hover → `bg-surface-hover`). A ported `Tag` must carry its `h-6 px-2 rounded-full`, semibold
text, and the exact `bgColor`/`textColor` the real call passes. When in doubt, open the
component file and copy its class string, then resolve each class to its token. Example: a
real `RankBar` row is

```jsx
<li className="flex items-center gap-2 rounded-sm px-1 py-0.5">
  <span className="w-28 shrink-0 truncate text-xs ...">{peer.name}</span>
  <span className="relative flex-1 overflow-hidden rounded-full bg-neutral-100 h-4">
    <span
      className="absolute inset-y-0 left-0 rounded-full <band-fill>"
      style={{ width: `${pct}%` }}
    />
  </span>
  <span className="w-12 shrink-0 text-right text-xs tabular-nums">{value}</span>
</li>
```

becomes, in the mockup:

```html
<li class="rank-row">
  <span class="rank-name">Region A</span>
  <span class="rank-track"
    ><span class="rank-fill" style="width:86%"></span
  ></span>
  <span class="rank-val">86%</span>
</li>
```

```css
.rank-row {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  border-radius: var(--radius-sm);
  padding: var(--space-1) var(--space-1);
}
.rank-name {
  width: 7rem;
  flex: none;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: var(--text-xs);
  color: var(--color-neutral-500);
}
.rank-track {
  position: relative;
  flex: 1;
  overflow: hidden;
  border-radius: var(--radius-full);
  background: var(--color-neutral-100);
  height: 1rem;
}
.rank-fill {
  position: absolute;
  inset: 0 auto 0 0;
  border-radius: var(--radius-full);
  background: var(--color-primary-600);
} /* band fill via token, not hex */
.rank-val {
  width: 3rem;
  flex: none;
  text-align: right;
  font-size: var(--text-xs);
  font-variant-numeric: tabular-nums;
  color: var(--color-neutral-500);
}
```

Same widths (`w-28` = 7rem), same radii, same neutral track, same tabular numerals. It
_is_ the component, ported.

### Step 2.3 — Use realistic content

Pull real values from the component's data shape and the feedback's captured context text
(e.g. the same entity names and percentages, the same metric labels, real record fields).
No "Lorem ipsum," no "Item 1 / Item 2." Realistic content is what makes a mockup read as a
real screen and lets the designer judge the layout under true density.

### Step 2.4 — Make it interactive where the angle implies it

If a variant introduces an interaction, wire it with **tiny inline vanilla JS** or native
controls so the reviewer can try it. No React, no CDNs.

- **Scroll region (Angle A):** just CSS — `max-height` + `overflow-y:auto`; add a sticky
  header and a fade mask so it's discoverably scrollable.
- **Expand / show-all (Angle B):** a `<button>` that toggles a `hidden`/`open` class on the
  overflow rows. ~5 lines of JS.
- **Filter / search (Angle C):** a native `<input>` whose `input` event hides rows whose
  text doesn't match; a sortable header that reorders by a `data-value` attr. ~15 lines.
- **Tabs / toggle / content-switcher:** native `<button>`s flipping an `active` class and
  showing/hiding panels — mirror the look of the project's `ContentSwitcher`/`Tab`.

Keep JS scoped to the variant (query within the section element) so the three variants stay
independent in one document.

### Step 2.5 — Scope styles per variant

Each variant section gets an id (`#variant-a`, `#variant-b`, `#variant-c`). Prefix mockup
CSS with that id (or use distinct class names per variant) so styles don't leak between the
three mockups sharing one document. The shared design tokens live in `:root`; only the
per-variant _layout_ CSS is scoped.

### Step 2.6 — Frame by scope

- **Component scope:** render the single component inside a realistic card frame
  (`--radius-card`, `--shadow-sm`, white surface) at a sensible width — as it'd sit on the
  page. Don't rebuild the whole page around it.
- **Subpage / section scope:** render the section plus just enough neighboring context
  (its heading, the adjacent control strip) so the layout reads.
- **Page scope:** render the key regions — header strip, primary content, the changed
  region — framed in a simplified app-shell outline. You're showing the _redesign of the
  region in context_, not pixel-cloning the entire app shell. A thin neutral frame standing
  in for the navbar/sidebar is fine and keeps focus on what changed.
- **Flow scope:** render the 2–3 key steps as a short horizontal/vertical sequence of
  framed states with arrows between them, each step a real mini-mockup.

---

## Part 3 — The comment block per variant

Every variant ends with a comment panel containing two labeled parts:

- **How the feedback was addressed** — 1–3 sentences mapping _this angle_ to the _problem_
  (not the literal instruction). "Replaces the overflowing list with a top-5 view and an
  inline 'show all' expander, so the common case fits with no scroll and full comparison is
  one click away."
- **Advantages / Disadvantages** — a compact, two-column pair of bulleted lists, **not
  prose**. Keep each bullet to a short phrase (≈3–8 words). The left column is what the
  direction wins on (low build effort, fits the current layout, fewer clicks, clearer
  hierarchy); the right is what it costs (added chrome/density, a new affordance to learn,
  deviation from current patterns, weak at scale, needs backend X). Every direction
  sacrifices something — each variant must carry **at least one bullet in each column**; an
  empty Disadvantages list means you haven't looked hard enough.

  Render it with the template's `.tradeoffs` two-column grid:

  ```html
  <div class="tradeoffs">
    <div class="tradeoffs__col tradeoffs__col--pro">
      <div class="tradeoffs__label">Advantages</div>
      <ul>
        <li>Lowest build effort</li>
        <li>No layout change</li>
        <li>Ships fastest</li>
      </ul>
    </div>
    <div class="tradeoffs__col tradeoffs__col--con">
      <div class="tradeoffs__label">Disadvantages</div>
      <ul>
        <li>Still a flat list</li>
        <li>Freshness only cosmetic</li>
        <li>Needs per-item timestamp</li>
      </ul>
    </div>
  </div>
  ```

Optionally add a **Reuses** line listing the real components/tokens the variant leans on
(`Card`, `Button`, `--color-primary-600`, the bar/track pattern) — it signals to the
designer how close to "free" the variant is to actually implement via composer.
