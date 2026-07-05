# Detection Signatures

Concrete patterns for the two checks. This file is loaded only when Warden is actively validating.

## Token compliance — what counts as a hardcoded value

Scan generated code (page file, component files, inline styles) for these. A hit is a _candidate_; it
becomes a **blocking transgression** only after confirming a matching token exists in the project's
design-token source (the live global stylesheet / Tailwind theme catalog — not a spec document's prose
mirror), or that no token exists and it wasn't flagged — see the SKILL table.

### Color

- Hex: `#fff`, `#1d4ed8`, `#00000080`
- Functional: `rgb(...)`, `rgba(...)`, `hsl(...)`, `hsla(...)`
- Tailwind arbitrary color: `bg-[#...]`, `text-[#...]`, `border-[#...]`, `fill-[#...]`, `ring-[#...]`
- Named Tailwind palette used directly where a semantic token exists: `bg-blue-600`, `text-gray-500` — flag
  these when the project's token source defines semantic aliases (e.g. `bg-brand`, `text-muted`) that should
  be used instead. (If the design system _is_ the raw palette, this is not a violation — judge against the
  project's token source.) Note: the host project may define its own token quirks (tokens that are broken,
  translucent, or otherwise need special handling); learn these from the project's token source and spec
  document and judge against them rather than assuming any particular quirk.

### Spacing & sizing

- Tailwind arbitrary: `p-[5px]`, `m-[7px]`, `gap-[10px]`, `w-[326px]`, `h-[42px]`, `top-[13px]`
- Off-scale numeric utilities where the scale is restricted (judge against the spacing scale in the project's
  token source)
- Inline numeric: `style={{ padding: 5, marginTop: '7px', width: 326 }}`

### Radius

- `rounded-[6px]`, `style={{ borderRadius: 6 }}`

### Shadow / effects

- `shadow-[0_2px_8px_rgba(0,0,0,0.1)]`, `style={{ boxShadow: '...' }}`
- arbitrary blur/opacity/backdrop values: `blur-[3px]`, `opacity-[0.85]`, `backdrop-blur-[2px]`

### Typography

- `text-[14px]`, `leading-[1.35]`, `tracking-[0.2px]`, `font-[550]`
- inline `style={{ fontSize: 14, fontWeight: 550, lineHeight: 1.35 }}`
- any font size/weight/line-height/letter-spacing outside the typography scale defined in the project's
  token source

### The legitimate-gap exception

A raw value is **not** a transgression if **both**:

1. No token in the project's token source covers it, and
2. It is explicitly flagged at the site with `// TODO: token` (composer's Step 7 / Failure-Handling rule).

Record these as **legitimate gaps** and roll them into the design-system recommendation on escalation. An
unflagged raw value with no matching token is still **blocking** — the requirement was to flag the gap.

## Component reuse — the high-confidence match bar

A claimed-new component is a **blocking duplication** only when an existing library component clears **all
three** tests at high confidence. If any one is uncertain, drop to **advisory**.

| Test                  | Question                                                                                                                                                |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Intent**            | Does the existing component exist to serve the same user goal? (e.g. "show a single KPI with label + value + trend" — not merely "a box with a number") |
| **Semantics**         | Same role and meaning in the UI? Same essential props/content shape (title, value, state)?                                                              |
| **Interaction model** | Same behavior — clickable vs static, expandable vs fixed, same affordances and states?                                                                  |

Examples:

- New `KpiTile` vs library `MetricCard` that takes label + value + delta and renders identically → **blocking**
  if all three align with high confidence.
- New `FilterDrawer` (slide-over, multi-section, apply/reset) vs library `Sidebar` (static nav) → **advisory**
  at most: intent and interaction model differ.
- New `StatusBadge` vs library `Badge` with a `variant` prop covering the same states → **blocking**.
- New `Chart` wrapper vs a library `Card` (Card is a container, not a chart) → **not a match**, clean.

Always state, for a blocking reuse finding, the exact existing component and its path, so the correction
brief is directly actionable.

## Verifying reuse claims

Each `Reused: X (path)` in the manifest must resolve to a real export at a real path in the project's
component library (primitives or shared/domain components). Check:

- The path exists in the library.
- The named component is actually exported there.
- The generated code actually imports/uses it (not just names it in the manifest).

A claim that fails any of these is a **blocking** transgression (false reuse claim).
