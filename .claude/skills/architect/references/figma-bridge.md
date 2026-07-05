# The Figma bridge

## Canonical file (read this first)

Before doing any Figma work, check whether the project has a registered design-system Figma
file URL/key (a project doc, README, or prior conversation). That entry is the single source of
truth for which file to operate on. If none is registered yet, ask the user for the file URL
before proceeding with any Direction A/B/C/E work that needs to write to Figma — token work
that stays code-only (editing the token source) never requires this. Once you have a URL,
extract the file key and use it for all MCP calls below — never ask the user to re-supply it
mid-task.

---

Two surfaces talk to Figma, with different jobs:

- **Figma REST API** — *navigation and resolution only.* It tells you which pages exist and the `nodeId` of the component you mean. Use it to make sure you're operating on the right page and node before you touch anything.
- **Figma MCP** — *reading and writing.* Every read of design/tokens and every write to the canvas goes through MCP tools, which require a concrete `fileKey` + `nodeId` to act on.

The division exists because the MCP tools can't act on "the Button, wherever it is" — they need a node. The REST API (or, without a token, MCP `get_metadata`) is how you turn a name into that node.

## Resolving the page and node (REST API)

Authenticate with a personal access token in the `X-Figma-Token` header. Read it from the environment (e.g. `FIGMA_TOKEN`) — never hardcode it. The `fileKey` and any `node-id` come from the Figma URL: `https://figma.com/design/:fileKey/:name?node-id=1-2` → `fileKey = :fileKey`, `nodeId = 1:2` (the URL's `1-2` becomes `1:2`).

```bash
# List pages (top-level canvases) to find the right one
curl -s -H "X-Figma-Token: $FIGMA_TOKEN" \
  "https://api.figma.com/v1/files/$FILE_KEY?depth=1" \
  | jq '.document.children[] | {id, name}'

# Pull a page's subtree and find a component/component-set by name → its nodeId
curl -s -H "X-Figma-Token: $FIGMA_TOKEN" \
  "https://api.figma.com/v1/files/$FILE_KEY/nodes?ids=$PAGE_ID" \
  | jq '.. | objects | select(.type=="COMPONENT_SET" or .type=="COMPONENT") | {id, name, type}'
```

With the `nodeId` in hand, hand it to the MCP tools. If no REST token is available, use the MCP-native fallback: `get_metadata` with no `nodeId` lists the top-level pages; `get_metadata` with a page id returns that page's node tree (ids, names, types) so you can drill to the target.

## Reading from Figma (MCP)

- **`get_metadata`** — cheap structural overview (ids, names, types, positions). Use to orient and to find nodes. Prefer `get_design_context` for anything richer.
- **`get_design_context`** — the primary design-to-code read: reference code, a screenshot, and contextual metadata (including Code Connect output if a mapping exists). Use when pulling a Figma component back into code (direction C).
- **`get_variable_defs`** — variable definitions reachable from a node (e.g. `{ 'bg/primary': #fff }`). Use to read tokens off a design.
- **`search_design_system`** — find components/variables/styles by text across libraries. Use to check whether something already exists before creating a duplicate (supports law #6, inspect first).
- **`get_context_for_code_connect`** — structured component metadata: property definitions, variant options, and the descendant tree. This is what you build a Code Connect template from.

## Writing to Figma (MCP `use_figma`)

`use_figma` runs JavaScript against the Figma Plugin API. **Before the first call, load Figma's own guidance** — it encodes Plugin API rules that are easy to get wrong and hard to debug:

- Load the **`figma-use`** skill if it's available (e.g. `/figma-use`), otherwise read the `skill://figma/figma-use/SKILL.md` MCP resource. It covers the return pattern, page handling, font loading, color ranges, and the query helpers.
- When the task **creates or edits components** (not just tokens), also load **`figma-generate-library`** — it owns the component-creation workflow (variant sets, variable bindings, the phase order). Both load together for component work.
- Pass the loaded skill names in the `skillNames` argument (prefix with `resource:` if loaded via the MCP resource) so usage is logged correctly.

Plugin API laws that matter most for a maintainable system (the loaded skills are authoritative; this is the short list):

- **Atomic failures.** A failed `use_figma` script makes *no* changes — there are no partial nodes. On error, **STOP**, read the message, understand the cause, fix, then retry. Do not blind-retry. If the state is unclear, call `get_metadata` / `get_screenshot` first.
- **Return all created/mutated node IDs** from every write script (`return { createdNodeIds: [...], mutatedNodeIds: [...] }`) — later calls, Code Connect mapping, and verification all need them.
- **Set `variable.scopes` explicitly** and **set code syntax** on every variable (see `token-system.md`). Never ship `ALL_SCOPES`.
- **Alias semantics to primitives**; never duplicate raw values.
- **Every component-set frame uses real auto layout, hugging both axes.** Set `layoutMode`
  (`HORIZONTAL` or `VERTICAL`, matching how variants are laid out) and set **both**
  `primaryAxisSizingMode: "AUTO"` and `counterAxisSizingMode: "AUTO"` on the frame itself — not
  just on the individual variant instances inside it — so the set auto-expands as variants are
  added or resized instead of needing manual resizing. Remember which axis is which: for a
  `VERTICAL` frame, `primaryAxisSizingMode` governs height and `counterAxisSizingMode` governs
  width (and the reverse for `HORIZONTAL`) — getting this backwards silently collapses the frame
  to a sliver. Never leave a component set as a plain fixed-size frame.
- **Validate after writing** — `get_metadata` for structure, `get_screenshot` for visual
  correctness — before the user checkpoint. For any component with an icon slot, the visual
  check must confirm two things, not just "an icon is present": (1) the glyph is actually the
  intended icon (a broken/unresolved Instance Swap binding renders as a wrong fallback glyph,
  not an empty slot — it *looks* like an icon at a glance, so zoom in and check the shape), and
  (2) on every colored/semantic variant, the icon's fill/stroke resolves to the same token as
  the adjacent text (see law 9) — check this on the colored variants themselves, not only the
  default/neutral one. For (2), a screenshot alone is not sufficient proof — colors that are
  close in value can look "fine enough" at a glance, and a screenshot can't tell you *why* a
  color is correct (bound to the right variable) vs. accidentally correct (a hardcoded value
  that happens to match today). Read the icon node's actual fill/stroke paint via
  `get_metadata`/`get_design_context` and confirm it's a **bound variable** — not a raw/literal
  color — pointing at the same variable the sibling text uses. This has been the single most
  recurring defect class across this file's build history (Button, Tag, and Checkbox all
  shipped with hardcoded/unbound icon colors that only failed visibly on filled/colored
  variants) — treat it as a standing checklist item on every component with an icon-in-colored-
  surface, including components already built and shipped, not just new ones.

## Standard file structure

Keep the design-system file navigable:

```
Foundations  →  Colors  →  Typography  →  ────  →  Components  (one page per component below)
```

The **Foundations / Colors / Typography** pages document the tokens *generated from the code
token source* (color variable swatches, type specimens, spacing / radius / shadow bars). After
the `────` divider, the **Components** section holds **one page per component** — this is a
firm rule, not a default: never stack different components on the same page. The *only*
exception is sub-parts that compose the **same** component (e.g. `TableCell` / `TableColumn` /
`Table` together on one `Table` page). This structure is itself a checkpoint gate — show the
page list + a screenshot and get sign-off before building components.

> **Code-first reminder.** Foundations and every Component page are *generated from code* (the
> token source + the components in the design-system folder). REST is for discovery/resolution
> only; MCP `use_figma` does the writing. You are mirroring code into Figma, not authoring a
> design that code will chase.
