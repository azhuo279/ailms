# Code Connect

Code Connect links a Figma component node to its real code implementation, so Dev Mode (and MCP `get_design_context`) shows the true production snippet from your codebase instead of an auto-generated approximation. For this skill it's the thing that keeps Figma and code provably attached: when a designer opens a component in Figma, they see exactly how to call it in code; when you pull a component into code, MCP hands you `componentName` + `source` + a rendered snippet.

## Prerequisites

- **A published Figma library.** Code Connect maps **published** components only. Build → publish → map. Mapping an unpublished component fails with `CODE_CONNECT_NO_LIBRARY_FOUND` / `CODE_CONNECT_ASSET_NOT_FOUND`.
- **Plan availability & seat.** Code Connect is an Organization/Enterprise feature and needs a Design or Dev seat. If the user is on a plan without it, say so plainly rather than producing mappings that can't publish.
- **The CLI + config** for the committed path (below): `@figma/code-connect` installed (Node 16+) and a `figma.config.json` in the project root.

## Two surfaces — and when to use each

There are two ways to create mappings. They are complementary; use both deliberately.

**1. Committed `.figma.tsx` template files (the durable source of truth).**
Co-located with the component, code-reviewed, version-controlled, published with the CLI. This is what you want to *persist* — it survives, it's diffable, and it's the canonical mapping. Prefer template files for first-time setup of any component you intend to keep.

**2. MCP mapping tools (fast, agent-driven).**
`add_code_connect_map`, `get_code_connect_map`, `send_code_connect_mappings`, `get_code_connect_suggestions`. Great for bootstrapping a mapping the instant you create a component (the node ID is already in hand), for verifying, and for bulk-retrofitting an existing file. Use these to move fast during a build; back them with a committed `.figma.tsx` for anything permanent.

Recommended default: **map via MCP per-component as you build** (immediate, errors surface early), then **write/commit `.figma.tsx` template files** so the mappings live in the repo.

## `figma.config.json`

Lives at the project root. Set `label`/`language` to match the codebase; `include` to find your template files; `importPaths`/`paths` so the generated imports match how consumers actually import the components (e.g. from a package, not a relative path).

```json
{
  "codeConnect": {
    "include": ["src/components/**/*.figma.tsx"],
    "label": "React",
    "language": "typescript",
    "importPaths": { "src/components/*": "@/components/*" },
    "paths": { "@/components/*": ["src/components/*"] }
  }
}
```

No `figma.config.json` exists yet in this project — creating it is the first step of any Direction B/E work.

## The common case here: a code component → its own Figma mirror page

**Code-first.** This project's components live in `src/components/ui/` (primitives) and
`src/components/shared/` (cross-route composites), and **code is the source of truth**. Any
Figma design-system file is a *generated mirror*. So the flow is: you **push the component into
Figma as its own page** (Direction B), then Code-Connect the component to that mirror node.

1. **Mirror the component into Figma.** Via `use_figma`, create the component on **its own
   page** under `Components`, with camelCase variant properties matching the component's prop
   API; publish it (`references/component-workflow.md` + `references/figma-bridge.md`). Note
   the new `nodeId`.
2. **Map component props → the mirror component's Figma properties.** The component's public
   prop API is the contract; the Figma properties were generated to match it 1:1.
3. **Commit a `.figma.tsx` template** co-located with the component, `label: "React"`, pointing
   at the design-system file's `nodeId`.

```tsx
// src/components/ui/button.figma.tsx — component connected to its mirror page in the design-system file
import figma from '@figma/code-connect/react';
import { Button } from './button';

figma.connect(Button, 'https://www.figma.com/design/<fileKey>?node-id=<buttonMirrorNode>', {
  props: {
    // the mirror's camelCase Figma properties map 1:1 onto the component's prop API
    variant: figma.enum('variant', { primary: 'primary', outline: 'outline' }),
    label:   figma.string('label'),
  },
  example: (props) => <Button variant={props.variant}>{props.label}</Button>,
});
```

## A template file

Name it for the component (`Button.figma.tsx`) and co-locate it. Because Figma properties are camelCase matching the React props (see `naming-conventions.md`), the mapping is near-trivial:

```ts
import figma from "@figma/code-connect/react"
import { Button } from "./button"

figma.connect(Button, "https://figma.com/design/<fileKey>?node-id=<node>", {
  props: {
    variant:   figma.enum("variant", { primary: "primary", secondary: "secondary", ghost: "ghost" }),
    size:      figma.enum("size", { sm: "sm", md: "md", lg: "lg" }),
    isLoading: figma.boolean("isLoading"),
    label:     figma.string("label"),
  },
  example: ({ variant, size, isLoading, label }) => (
    <Button variant={variant} size={size} isLoading={isLoading}>{label}</Button>
  ),
})
```

Publish with the CLI (`npx figma connect publish`). Template files are treated as *strings* — they aren't executed — so hooks are fine and conditionals render verbatim. Helpers you'll reach for: `figma.string`, `figma.boolean`, `figma.enum`, `figma.instance` (for slotted child components / icons), and `figma.children` (for nested instances).

## MCP mapping tools

| Tool | Job |
|---|---|
| `add_code_connect_map` | Map one node. Args: `nodeId`, `fileKey`, `source` (e.g. `src/components/ui/button.tsx`), `componentName`, `label`. Add `template` only when you need precise prop-level rendering. |
| `get_code_connect_map` | Read current mapping(s). Call right after adding to confirm, and before a bulk send to audit existing state. |
| `send_code_connect_mappings` | Apply many mappings in one call (array of `{nodeId, componentName, source, label}`). Failures report per-mapping; the rest still succeed. |
| `get_code_connect_suggestions` | Discover unmapped components and a suggested code match — drives audits (direction D) and bulk retrofits. |

Common errors: `CODE_CONNECT_MAPPING_ALREADY_EXISTS` (a mapping for that label already exists — disconnect it first), `CODE_CONNECT_NO_LIBRARY_FOUND` (publish the file as a library first), `CODE_CONNECT_INSUFFICIENT_PERMISSIONS` (need edit access).

## Order: primitives per-component, composites in a final pass

Map in dependency order, because a composite's snippet references its primitives' mappings:

- **Primitives** (Button, Input, Badge, Avatar): map **per-component** as you create each one — node ID is fresh, the 1:1 code match is obvious, and errors surface before dependents are built.
- **Composites & domain components**: map in a **final pass** after all primitives are mapped, so their snippets can correctly reference the primitives' Code Connect IDs. `send_code_connect_mappings` is ideal for this batch.

## Verify

After mapping, confirm before declaring done:

- **Via MCP (fast):** `get_code_connect_map(nodeId, fileKey)` — the response should include `componentName`, `source`, `label`, and a non-empty `snippet`.
- **In Dev Mode:** select an *instance* (not the main component), and the Inspect panel should show your snippet, not `[auto-generated]`. If it's missing, re-check that the component is published and the mapping exists.
