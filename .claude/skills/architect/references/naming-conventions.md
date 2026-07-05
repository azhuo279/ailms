# Naming conventions

Consistent names are not cosmetic here — they are the mechanism that lets Code Connect tie a Figma component to its code counterpart and survive edits on either side. When a Figma property is named the same as the React prop it maps to, the mapping is almost an identity function and stays correct as the component grows. When names drift, mappings silently go stale and Dev Mode starts showing the wrong snippet.

## The master table

| Layer | Code | Figma | Example |
|---|---|---|---|
| Component name | PascalCase | PascalCase (main component / component set name) | `FileUploader` |
| Component file | kebab-case (`.tsx`) | — | `file-uploader.tsx` |
| Prop / property | camelCase | camelCase (Figma component property name) | `isLoading`, `variant`, `size`, `leadingIcon` |
| Variant values | the code union's string literals | identical variant option strings | `'primary' \| 'secondary' \| 'ghost'` ↔ Figma values `primary`, `secondary`, `ghost` |
| Primitive token | `{hue}-{scale}` kebab | `{hue}/{scale}` slash path | `blue-500` ↔ `blue/500` |
| Semantic token | `{role}-{variant}[-{state}]` kebab | `{role}/{variant}[/{state}]` slash path | `bg-primary`, `text-muted`, `border-focus`, `bg-danger-subtle` |
| Dimensional token | `{category}-{step}` kebab | `{category}/{step}` slash path | `space-md`, `radius-lg`, `shadow-sm`, `z-modal` |

## Why each choice

**Components: PascalCase.** This is the React convention and Figma's de-facto convention for main components, so the two already agree. The Code Connect `figma.connect(FileUploader, url)` call references the imported component by its PascalCase name.

**Files: kebab-case.** `file-uploader.tsx` for the `FileUploader` component. Kebab file names are case-insensitive-safe across filesystems and match common monorepo conventions. The mismatch between file name (`file-uploader`) and export (`FileUploader`) is expected and fine — Code Connect imports the named export, not the file stem.

**Props: camelCase, mirrored into Figma.** React props are camelCase. Rather than maintain a translation layer, name the **Figma component property** in camelCase too (`isLoading`, not `Loading?` or `Is Loading`). Then:

```ts
// Near-identity mapping because names already match
figma.connect(FileUploader, "https://figma.com/design/...?node-id=12-34", {
  props: {
    isLoading: figma.boolean("isLoading"),
    variant:   figma.enum("variant", { primary: "primary", secondary: "secondary", ghost: "ghost" }),
    size:      figma.enum("size", { sm: "sm", md: "md", lg: "lg" }),
    label:     figma.string("label"),
  },
  example: ({ isLoading, variant, size, label }) => (
    <FileUploader isLoading={isLoading} variant={variant} size={size}>{label}</FileUploader>
  ),
})
```

**Variant values match the code union.** If the code type is `variant: 'primary' | 'secondary'`, the Figma variant option strings are exactly `primary` and `secondary` — lowercase, identical spelling. The `figma.enum` map then collapses to identical keys and values, and a new variant added on either side is obvious to reconcile.

## Token naming

**Primitives** are a flat scale: `{hue}-{scale}`. Colors are just the hue and the numeric step on the standard 50–950 ramp — `gray-50`, `gray-100`, … `gray-900`, `gray-950`; `blue-500`; `white`/`black` (or `white-1000` if you keep them on the ramp). No semantic meaning, no purpose — primitives are raw.

**Semantics** name *purpose*, with as few segments as possible while staying unambiguous:

- Colors lead with the role, so they need no `color-` prefix: `bg-primary`, `bg-subtle`, `text-primary`, `text-muted`, `text-inverse`, `border-default`, `border-focus`, `icon-secondary`, `ring-danger`. Add a third segment only for a real state/emphasis distinction: `bg-danger-subtle`, `text-link-hover`.
- Avoid over-segmentation. `color-background-primary-default` is four segments saying what `bg-primary` says in two. Prefer the short form.

**Dimensional** tokens keep a one-word category because a bare step is ambiguous (`md` of what?): `space-xs … space-2xl`, `radius-sm … radius-full`, `shadow-sm … shadow-lg`, `z-base … z-modal … z-toast`.

## The `/` ↔ `-` bridge (must be uniform)

Figma groups variables with `/`; code uses `-`. The transform is mechanical: lowercase, replace `/` and spaces with `-`. Apply it **identically to every variable in a collection** — partial or inconsistent transforms are the most common cause of broken token round-tripping.

| Figma variable | Web CSS var | Tailwind v4 |
|---|---|---|
| `blue/500` | `--blue-500` | `--color-blue-500` |
| `bg/primary` | `--bg-primary` | `--color-bg-primary` |
| `space/md` | `--space-md` | `--spacing-md` |

The Figma variable's **WEB code syntax** (set via `setVariableCodeSyntax('WEB', …)`) should hold the *exact* accessor the codebase uses — `var(--bg-primary)` for CSS/Tailwind. That string is what Dev Mode shows and what proves the variable and the code token are the same thing. See `token-system.md`.

## Worked round-trip: `Button`

```
Code:   src/components/button/button.tsx          → export function Button(props: ButtonProps)
        ButtonProps { variant: 'primary'|'secondary'|'ghost'; size: 'sm'|'md'|'lg';
                      isLoading?: boolean; leadingIcon?: ReactNode; children: ReactNode }
        Styles reference only: bg-primary, text-inverse, radius-md, space-sm … (no literals)

Figma:  Component set "Button"
        properties: variant (primary|secondary|ghost), size (sm|md|lg), isLoading (bool),
                    leadingIcon (instance swap), label (text)
        fills/padding/radius all bound to the matching variables

Connect: Button.figma.ts maps each Figma property to the identically-named prop
         label: React; published via CLI and committed to the repo
```

Because every name lines up, adding a `loading` state or a `danger` variant is a one-line change mirrored on each side, and the audit (direction D) can mechanically check that the union literals, Figma variant options, and Code Connect enum keys all still match.
