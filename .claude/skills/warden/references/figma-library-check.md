# Figma Component Library Fallback

Runs **only** when both are true:

1. A claimed-new component found **no high-confidence equivalent in the codebase** (the project's component
   library — primitives, then shared/domain components), and
2. A **design-system Figma file link is available** (typically from the project's design-system spec
   document, if one exists).

**Where the link comes from.** Read the project's design-system spec document (if one exists) and look for a
design-system Figma file link (commonly under a "Design System Figma Source" section). Extract the
`figma.com/design/...` URL from there. If no such link is present, treat it as "no link available" and skip
this fallback.

> **From the file-level link, extract the `fileKey` ONLY — ignore any `node-id`.** A file-level URL's
> `node-id` is just _whatever page was last viewed_ when the link was copied — not the components page, and
> frequently stale. Resolve the real component node yourself by walking the live tree (Steps 1–2 below).
> Treating that incidental `node-id` as the components root is a common trap: `get_metadata` on the stale
> page returns an empty `0×0` canvas, which is then misread as "the server can't traverse this file." It can.
> See the failure-mode note below.
>
> **Exception — a human-provided direct link.** If a person intentionally hands you a link that points at
> the specific component/page (scoping you to it), **use that `nodeId` directly** — carry it straight to
> `get_design_context`. Do **not** re-resolve or re-walk the tree; that would discard the exact target they
> chose. The "ignore the node-id" rule is only for the incidental file-level link, not a deliberate one.

Purpose: a component may exist in the design library but never have been implemented in code. Before warden
lets composer ship a bespoke duplicate, it checks the Figma file via the Figma MCP — and if the component
exists there, it becomes a blocking transgression whose remedy is to implement the canonical component and
reuse it.

If no Figma link is available, **do not** silently declare the component "genuinely new." Mark the verdict as
**codebase-only (Figma library not checked)** so the gap is visible.

## Canonical drill-down flow (hybrid: REST for discovery, MCP for build)

**Why hybrid.** The MCP's page enumeration can be unreliable — `get_metadata(fileKey)` (no nodeId) may return
only a fixed/partial set (empirically the first page + the file's persisted "current page"), and it
**does not** reflect editor navigation, section un-nesting, or pages force-loaded by node requests. So it
cannot be trusted to discover which pages/components exist. Conversely the **Figma REST API** returns the
*complete* live document, and the **MCP** gives the rich design-to-code context REST lacks. Use each for what
it is good at: **REST to discover the real page/component node id, MCP to read and build from it.**

> **If a human handed you a direct component/page node link, skip discovery entirely (Steps 0–2)** — use
> their `nodeId` straight in Step 3. Re-resolving would throw away the exact target they scoped you to.

0. **Prerequisite — `FIGMA_TOKEN`.** REST needs a Figma PAT in the `X-Figma-Token` header. Read it from the
   env (`$FIGMA_TOKEN`, e.g. set in `.claude/settings.local.json`'s `env` block); never inline or echo the
   value. Outbound calls to `api.figma.com` may need a sandbox exception. If no token is available, say so
   and fall back to asking for a node-scoped link — do **not** rely on MCP `get_metadata(fileKey)`
   enumeration, which can be incomplete.

1. **List all live pages — REST.**
   `GET https://api.figma.com/v1/files/:fileKey?depth=1` → `document.children` = every page (canvas) with
   `id` + `name`. (Cheap: `depth=1` omits page contents.) Pick the relevant page by name (e.g. "Avatar").
   Alternative for a known component: `GET /v1/files/:fileKey/components` lists published components with
   their `node_id` directly.
2. **Get the page's component tree — MCP, with the REST-resolved pageID.**
   `get_metadata(fileKey, pageNodeId)` → XML of everything on that page (frames, components, component sets)
   with node ID, name, type, size. Scan it for the component by name.
3. **Get implementation detail — MCP.** Once a component is judged relevant:
   `get_design_context(fileKey, componentNodeId)` → reference code, screenshot, variables, variants. This is
   what you implement from.
4. **(Optional) Token defs — MCP.** `get_variable_defs(fileKey, componentNodeId)` → the design tokens
   (color, spacing, typography) the component uses, so they map to **codebase semantic tokens** rather than
   hardcoded values.

### Guardrails

1. **Discover via REST, not MCP enumeration.** Treat `get_metadata(fileKey)` (no nodeId) as unreliable for
   discovery; resolve the real page id from the REST document. When a human *intentionally* links the
   component/page, that `nodeId` is authoritative — use it directly and skip discovery.
2. **Never call `get_design_context` without a live, resolved `nodeId`** (from REST → MCP, or supplied
   directly by the human).
3. **Given a *file* (not a page/component), extract the `fileKey` only.** A `nodeId` is relevant **only**
   when scoping to a known page or component — otherwise omit it and resolve the page via REST (Step 1).
4. **Carry the `nodeId` forward explicitly between steps — don't re-derive it.** Once you hold the page id
   (REST) or component id (Step 2 / the human), pass that exact id to the MCP steps. REST returns ids as
   `123:456`; the MCP accepts `123:456` or `123-456`.

### Failure mode — do NOT misread these as a server limitation

The MCP reads/builds from any **resolved** node autonomously (no desktop app, no selection, no token). So:

- `get_metadata(fileKey)` returning only 1–2 pages → that's the **known enumeration gap**, not the full
  page set. Use REST (Step 1) to get the real list; do not conclude pages are missing or the file is broken.
- `get_metadata(nodeId)` returning an **empty `0×0` canvas** → that `nodeId` is **stale or not a real page**
  (e.g. a file-level link's "last-viewed" id), not proof the file is unreadable. Re-resolve via REST and retry.
- `get_design_context` replying **"nothing selected / select a layer first"** → the `nodeId` did **not
  resolve to a usable layer** (stale, or a page/canvas rather than a component), not proof of a
  selection-bound desktop server. Resolve a real component node (REST → MCP) and retry.
- If REST is unavailable (no token) and the component can't be resolved, **ask for a "Copy link to
  selection" node URL** — framed as "I can't resolve the node id," never as "the server can't do this."

## Smart parse — never read the whole file

Design-system libraries are commonly organized roughly one component per page, with semantically named pages
(Button, Carousel, Link, Badge…). Walk the file cheapest-first and stop as early as possible. (Adapt the walk
if the host file is organized differently — e.g. multiple components per page.)

### F1 — Enumerate pages (REST, 1 cheap call)

`GET https://api.figma.com/v1/files/:fileKey?depth=1` (header `X-Figma-Token: $FIGMA_TOKEN`) →
`document.children` = the complete page list (id + name). This is the page-name index. **Do not** use
`get_metadata(fileKey)` here — its enumeration can be incomplete (see the failure-mode note).

### F2 — Shortlist by name

Match page names against the target component's role and its synonyms (status pill → Badge / Chip / Tag /
Pill / Status). Keep the **top 2–3** promising pages; cap the shortlist to bound cost. If no page name is
plausibly related → **stop. No Figma match → genuinely new.**

### F3 — Inspect structure of a promising page (cheap)

`get_metadata(fileKey, nodeId=<page guid>)` → structural XML (node IDs, layer types, names, sizes). Locate
the `COMPONENT` / `COMPONENT_SET` node on the page. Still structure-only, no full content.

### F4 — Judge functional role (1 structured read)

`get_context_for_code_connect(fileKey, nodeId=<component node>)` → property definitions, variant options,
and the descendant tree. Test against the same three-test bar used for codebase matches:

- **Intent** — does it serve the same user goal?
- **Semantics** — same role, same essential props/content shape?
- **Interaction model** — same behavior, states, affordances?

Add **one** `get_screenshot(fileKey, nodeId)` (or `get_design_context`) only if the interaction model is
still ambiguous from props alone. Do not pull design context for pages already ruled out.

### F5 — Verdict + stop

- **High confidence on all three** → Figma match found. **Stop** — do not drill remaining pages.
- **Plausible, not high confidence** → advisory; move to the next shortlisted page only if no better
  candidate emerges. Never escalate a low-confidence Figma match to blocking.
- **Shortlist exhausted, no high-confidence match** → no Figma match → genuinely new.

### Cost budget

Per claimed-new component: 1 page-list call + (per shortlisted page) 1 structure call + 1 structured-context
call (+ at most 1 screenshot). Cap shortlisted pages at ~3. **Never** call `get_design_context` /
`get_context_for_code_connect` across all pages.

## Remedy when a Figma match is found — implement-from-Figma

This is a **blocking** transgression. The correction brief to composer must include:

- **What exists** — the library component name and its Figma node (`fileKey` + `nodeId`).
- **The action** — implement it as a reusable **shared** component in the project's component library (not
  inline, not single-use), generated from the node via `get_design_context(fileKey, nodeId=<component node>)`
  (returns reference code + asset URLs), adapted to the codebase's conventions and **semantic tokens**.
- **Then reuse it** in the screen, replacing the bespoke inline version.

After composer implements it, **re-validate on both dimensions**: the new shared component's own code must
pass token compliance, and the screen must now import and use it. (Both are covered automatically by the
next validation pass.)

## Tool reference (exact signatures)

**Discovery — Figma REST API** (header `X-Figma-Token: $FIGMA_TOKEN`):

- `GET /v1/files/:fileKey?depth=1` — complete page list (`document.children`: id + name). The reliable
  page index; use instead of MCP enumeration.
- `GET /v1/files/:fileKey/components` — published components with their `node_id` (resolve a known
  component by name without walking).
- `GET /v1/files/:fileKey/nodes?ids=:id` — a specific node's document subtree.

**Read / build — Figma MCP** (operate on a REST-resolved or human-supplied `nodeId`):

- `get_metadata(fileKey, nodeId)` — node/page structure (ids, types, names, sizes).
- `get_metadata(fileKey)` — omit `nodeId` → page list, but **enumeration can be incomplete; prefer
  REST `?depth=1` for discovery.**
- `get_context_for_code_connect(fileKey, nodeId)` — properties, variants, descendant tree.
- `get_design_context(fileKey, nodeId)` — reference code + screenshot + assets (used for the build).
- `get_variable_defs(fileKey, nodeId)` — the design tokens (color/spacing/typography) the node uses; map
  these to codebase semantic tokens instead of hardcoding the resolved values.
- `get_screenshot(fileKey, nodeId)` — visual confirmation of interaction model when props are ambiguous.
- `search_design_system(fileKey, query)` — optional accelerator; only sees **published** libraries, so it
  supplements but does not replace the page-walk.

Extract `fileKey` (and any `nodeId`) from a URL of the form
`https://figma.com/design/:fileKey/:fileName?node-id=:int1-:int2` (node id `1-2` → `1:2`).
