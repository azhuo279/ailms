# Token system

A maintainable token system is **layered**, and the layers are never collapsed:

1. **Primitives** — the raw values. Every literal hex and number lives here and *only* here. Flat scales, no purpose, no theming. In Figma: a single `Primitives` collection with one mode (`Value`) and scopes hidden (`[]`) so designers don't pick them by accident.
2. **Semantics** — purpose-named tokens that **alias** primitives. This is the layer components consume. It's where theming happens (light/dark, brand, contrast) via Figma modes / CSS variants. A semantic never holds a raw value — it points at a primitive.
3. **Component tokens** (optional, only when justified) — e.g. `button-bg`, used when a component needs to vary independently of the global semantics. Don't create these speculatively.

The discipline that makes the whole thing pay off: **components reference semantics, semantics alias primitives, primitives hold the raw value.** A rebrand or a theme is then a change in one layer, not a sweep through the app.

## Starting from a rough brand guide (the common case)

You usually arrive with a few seed colors and little else. Build up, don't demand completeness:

1. **Identify the seeds.** Pull whatever exists — brand primary, maybe a neutral, an accent — from the brand guide or existing CSS/Figma.
2. **Propose a complete primitive palette.** For each hue, generate the full **50–950** ramp (`50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950`) anchored on the seed (seed typically lands near `500`–`600`). Include a neutral/gray ramp always; add success/warning/danger/info ramps if the product needs status colors. Keep steps perceptually even (lightness descending smoothly); state your method so the user can adjust.
3. **Propose the semantic layer** mapped onto those primitives: backgrounds (`bg-primary`, `bg-subtle`, `bg-muted`), text (`text-primary`, `text-muted`, `text-inverse`, `text-link`), borders (`border-default`, `border-focus`), status (`bg-danger`, `text-danger`, …), plus dimensional semantics (`space-*`, `radius-*`, `shadow-*`, `z-*`).
4. **Checkpoint.** Show the proposed primitives + semantics (a swatch summary is ideal) and get sign-off *before* writing variables or code. This is the token-plan gate.

Fill gaps; never delete or renumber existing tokens without flagging it as a breaking change.

## The code side — detect, then match

Inspect the repo first and match what's there. When greenfield, default by platform:

### Tailwind v4 (default for web)

Tokens are CSS custom properties declared in `@theme`; Tailwind generates utilities from them. Primitives and semantics both live as CSS variables; semantics reference primitives.

```css
@theme {
  /* primitives */
  --color-gray-50: #f9fafb;
  --color-gray-900: #111827;
  --color-blue-500: #3b82f6;
  --spacing-md: 1rem;
  --radius-lg: 0.75rem;

  /* semantics alias primitives */
  --color-bg-primary: var(--color-gray-50);
  --color-text-primary: var(--color-gray-900);
  --color-border-focus: var(--color-blue-500);
}
```

Dark mode: redefine the **semantic** variables under a `dark` variant / `[data-theme="dark"]` selector; primitives stay fixed.

### Plain CSS custom properties (fallback)

Same idea without Tailwind's `--color-`/`--spacing-` prefixes:

```css
:root {
  --gray-900: #111827; --blue-500: #3b82f6;   /* primitives */
  --bg-primary: var(--gray-50);                /* semantics  */
  --text-primary: var(--gray-900);
}
[data-theme="dark"] { --bg-primary: var(--gray-900); --text-primary: var(--gray-50); }
```

## The Figma side — variables that round-trip

Create variables with `use_figma` (load `figma-use` + `figma-generate-library` first — see `figma-bridge.md`). The rules that keep Figma honest and connected to code:

- **`Primitives` collection**, one mode (`Value`), holds the raw hex/numbers. Scopes `[]` so they're hidden from pickers. (Exception: semi-transparent overlay primitives used in shadows get `["EFFECT_COLOR"]`.)
- **Semantic collections** alias primitives via `{ type: 'VARIABLE_ALIAS', id: primitiveVar.id }` — **never** copy a raw value into the semantic layer. Color semantics use `Light`/`Dark` modes; dimensional collections (`Spacing`, `Radius`, …) use a single `Value` mode.
- **Scopes on every variable** — never leave `ALL_SCOPES`. Backgrounds → `["FRAME_FILL","SHAPE_FILL"]`, text → `["TEXT_FILL"]`, borders → `["STROKE_COLOR"]`, spacing → `["GAP"]`, radius → `["CORNER_RADIUS"]`. Unscoped variables pollute every picker and make the system unmaintainable.
- **Code syntax on every variable.** Set `WEB` to the exact codebase accessor:
  - Tailwind/CSS: `variable.setVariableCodeSyntax('WEB', 'var(--bg-primary)')` (with the `var()` wrapper).
  - Derive the name from the codebase first; if it doesn't exist yet, derive from the Figma name with the uniform `/`→`-` transform and use that *same* name when you write the code token.
- **Bind, don't paint.** Every visual property of a component (fill, stroke, padding, gap, corner radius) is bound to a variable, not set to a literal. Fixed geometry that is intentionally not tokenized (an icon's pixel grid, a 1px hairline) is the documented exception.

### Token round-trip in one move

Setting code syntax is literally the bidirectional link — it makes a Figma variable and a code token provably the same thing. Bulk-apply it across a collection inside `use_figma`:

```js
const colls = await figma.variables.getLocalVariableCollectionsAsync();
const color = colls.find(c => c.name === 'Color');
for (const id of color.variableIds) {
  const v = await figma.variables.getVariableByIdAsync(id);
  if (!v) continue;
  const cssVar = 'var(--' + v.name.toLowerCase().replace(/\//g, '-').replace(/\s+/g, '-') + ')';
  v.setVariableCodeSyntax('WEB', cssVar);
}
return { done: true };
```

## Exit criteria for the token layer

Before moving on to components, confirm: every planned primitive and semantic exists; semantics alias primitives (no duplicated raw values); every variable has explicit scopes; every variable has WEB code syntax; the code token file and the Figma variables use the same names under the `/`↔`-` transform; light/dark (if used) only varies the semantic layer.
