# Component workflow

**Code-first.** The code component is the source of truth; the Figma component is its mirror. They stay the same component — named and tokenized identically, linked by Code Connect. Always **inspect first** (law #6) — `search_design_system` and a read of the codebase tell you whether the thing already exists and what conventions to match.

Build in dependency order: **primitives before composites.** A composite is composed of primitive instances, so its primitives must exist (and be mapped) first.

## Direction B — built/owned in code, push to Figma (the COMMON path)

Use whenever a component exists (or was just built) in `src/components/ui/` or
`src/components/shared/` and its Figma mirror needs to be created or refreshed. This is the
everyday flow — code leads, Figma follows.

1. **Confirm the contract.** Component name (PascalCase), file (kebab-case), props (camelCase) with their types/unions, and which tokens it uses. If a needed token doesn't exist, create it first (`token-system.md`) — _no token, no component._
2. **Read the code component, token-only.** Every style references a semantic token from the Tailwind `@theme` block; zero literals. If the component doesn't exist yet, it must be built to this standard before mirroring.
3. **Create the matching Figma component on its OWN page** with `use_figma` (load `figma-use` + `figma-generate-library` first; see `figma-bridge.md`). One component per page under `Components`; only sub-parts that compose the *same* component share a page (e.g. `TableCell` / `TableColumn` / `Table`). Build it as a **variant set** whose properties are named in **camelCase to match the props**, with variant option strings equal to the code union literals. Bind every visual property (fill, stroke, padding, gap, radius) to the matching variable — never a literal fill. Return the created node IDs.
4. **Validate visually.** `get_screenshot` the variant set; check nothing is clipped and states read correctly. Fix via a follow-up `use_figma` if needed (remember: failed scripts are atomic, so a fix is safe to retry).
5. **Publish** the library (Code Connect needs published components).
6. **Map Code Connect.** For a primitive, map now (`add_code_connect_map` with `nodeId`, `fileKey`, `source`, `componentName`, `label`), then `get_code_connect_map` to confirm. Commit a `.figma.tsx` template for durability. For a composite, defer mapping to the final pass after its primitives are mapped. See `code-connect.md`.
7. **Checkpoint** with the user (screenshot + the new Code Connect snippet) before moving to the next component.

## Direction C — gated read-back (Figma → code, RARE)

Use **only** when a designer edited a component (or a token it depends on) *directly in the Figma mirror* and that change must flow back to code. This is the exception, not a routine sync — code is the source of truth, so a read-back is always a deliberate, human-requested pull.

1. **Resolve the node** (REST API or `get_metadata`) and **read it** with `get_design_context` — you get reference code, a screenshot, the tokens in play, and the existing Code Connect snippet. For token-only changes, `get_variable_defs` is enough.
2. **Diff against the code component.** Identify what changed: a new variant, a renamed/added property, a different token binding, new geometry. Map Figma property names back to camelCase props and variant options back to the code union.
3. **Surface the diff to a human — never auto-apply.** Show the code value and the Figma value side by side and let the user choose. Code is canonical, so the default is to keep code (and regenerate the mirror); only propagate Figma → code on explicit approval. Never silently overwrite a token or component value with a Figma one.
4. **Update the code component**, still token-only. New token needed? Create it (and its Figma variable) first so both sides stay layered.
5. **Refresh Code Connect.** A renamed/added property means the mapping's `props`/`example` must be updated — edit the `.figma.tsx` template (or re-`add_code_connect_map` with a corrected `template`) and re-publish. Confirm with `get_code_connect_map`.
6. **Verify** the snippet in Dev Mode reflects the real, updated code.

## Primitive example — `Badge`

- Code: `badge.tsx` → `Badge`, props `tone: 'neutral'|'success'|'danger'`, `children`. Styles: `bg-{tone}-subtle`, `text-{tone}`, `radius-full`, `space-xs` — all tokens.
- Figma: `Badge` variant set, property `tone` (neutral|success|danger), text property `label`; fill bound to the `bg/{tone}/subtle` variable, text bound to `text/{tone}`, radius to `radius/full`.
- Connect: `add_code_connect_map` → confirm → commit `Badge.figma.tsx` mapping `tone`/`label`. Mapped per-component because it's a primitive.

## Composite example — `SearchField`

- Composed of primitive instances: an `Input` and a `Button` (or icon button). Build the primitives and map them first.
- Code: `search-field.tsx` → `SearchField`, props `value`, `onChange`, `placeholder`, `isLoading`. Internally renders `<Input/>` + `<Button/>`; no literals, only tokens for its own spacing/layout.
- Figma: `SearchField` component containing instances of the `Input` and `Button` components; expose `placeholder` (text) and `isLoading` (bool) as properties; layout spacing bound to `space/*` variables.
- Connect: mapped in the **final pass**. Its template references the primitives' mappings (via `figma.instance` / `figma.children`), which is why the primitives must be connected first. Use `send_code_connect_mappings` for the composite batch.

## Done means

For any component you touched: named consistently across code and Figma (parity table), styled only through tokens, present and published in Figma, Code Connect mapping confirmed and (for keepers) committed as a `.figma.tsx` file, and reviewed by the user at the checkpoint.
