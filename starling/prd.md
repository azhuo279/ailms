# PRD — Starling (working name)

**An in-browser annotation tool for React prototypes that links visual feedback to source code, so it can be batch-sent to Claude.**

Status: Draft v0.4 · Owner: PM/UX Eng · Type: Lean PRD · Last updated: 2026-06-10

---

## 1. Problem & context

When testing locally-deployed React prototypes with users, feedback arrives as observations about specific on-screen components ("this button is too small," "this card should show price first"). Today that feedback lives in notes, screenshots, and memory, disconnected from the actual code. Translating it into prototype or PRD changes is manual, lossy, and slow — and it doesn't hand a downstream AI agent anything precise to act on.

We want to annotate directly on the running app, attach notes to specific elements, and compile those annotations into a single artifact that an AI agent (Claude / Claude Code) can use to update the prototype, the PRD, or both — with enough precise context (the source file, line, and column) that the agent can locate each element without guessing.

## 2. Target user & usage

A single user — the PM / UX engineer — annotating their own React app while reviewing user feedback. Authoring is single-user (not the end users being tested, and not live multi-person co-editing). A compiled annotation set may be handed to another engineer asynchronously through the repo (see §15), but that is async hand-off, not concurrent collaboration. The user is technical and runs the app via `npm run dev`.

## 3. Goals

- Let the user enter a "markup mode" on a running prototype and attach text stickies to specific elements by hovering and clicking.
- Capture, per annotation, a precise and durable link to the element — primarily its **source location** (file + line + column), with selector-based fallbacks.
- Persist annotations across page navigation within a session, surviving dev hot-reloads.
- Compile all annotations into one artifact — written into the project's `annotations/` folder (or downloaded as a fallback) — readable by a human and parseable by an agent, with clear linkage between each note and its element.
- **Rewind:** restore a previously compiled annotation set from `annotations/` and re-anchor its stickies onto the running app.
- Embed and un-embed cleanly: no edits to the host app's component/application source.
- Be fully deterministic: no LLM API calls inside the tool itself.

## 4. Non-goals (MVP)

- End users placing their own annotations.
- **Real-time / concurrent multi-user collaboration and server-side sync.** Async, git-mediated hand-off of a _compiled_ snapshot is supported (see §15), but live co-editing, merge, and conflict resolution are out of scope.
- Frameworks other than React.
- Generating the recommendations/code changes itself (that's Claude's job downstream).
- Production-build support — the MVP package is dev-only. (The future browser extension extends to hosted sites, but with reduced capability; see §14.)

## 5. Locked design decisions

- **Delivery (MVP):** an in-project dev-only package (one-line mount) plus an optional dev-only build loader for source stamping. A browser-extension delivery is planned (see §13/§14) to extend coverage to any site without per-app installation.
- **UI isolation:** the tool renders its own UI (toolbar, highlight box, stickies, badges, sidebar) inside a **Shadow DOM** overlay so its styles never leak into — or get broken by — the app under review.
- **Selection target:** the **exact host element under the cursor** — no automatic walk up to the nearest component. Annotating a `<div>` annotates that `<div>`, not its enclosing component (which could be the whole page/route). Widening to a parent element is a manual, opt-in step.
- **Source mechanism (revised):** runtime React-fiber source reading is **not** used — React 19 removed `_debugSource`, and an SWC plugin is ABI-brittle against the SWC version Next bundles. Instead, a **dev-only build loader stamps a `data-pp-source="relativePath:line:col"` attribute** onto host JSX elements by transforming module text in memory (it does **not** edit source files). This works for Server Components too (the attribute ships in the server-rendered HTML). A fragile runtime source-map resolver is the zero-config fallback when the loader isn't installed.
- **Primary locator:** the **annotated element's own source location** (relative file path, line, column), read at click time from its `data-pp-source` attribute, with the enclosing component name (from fiber, when present) attached as context only. This attribute is also the highest-priority re-anchor key. Selectors are fallbacks, not the spine.
- **Persistence:** `localStorage` is the working store within a session; the durable, shareable form is a **compiled snapshot written into the repo's `annotations/` folder**, tagged by route, re-anchored on reload/navigation/rewind.
- **Output:** per compile, a human/agent-facing **Markdown** file **plus** a canonical machine-readable **`*.starling.json` sidecar** (the full session) that makes the snapshot losslessly re-importable for rewind.
- **Embed/unembed contract:** no edits to host component/application source. Total footprint is one mount line, one optional config-wrapper line, and one devDependency; dev-server endpoints are hosted off-app (see §10), never as app-route files.

## 6. How it works (overview)

The user mounts the annotator in dev. Activating markup mode overlays the page: hovering highlights the exact host element under the cursor (the div, button, section — whatever you point at), with its enclosing component named only as context. Clicking drops a sticky anchored to that element and captures its `data-pp-source` line and fallback locators; on save the sticky collapses into a small count badge at the element's corner. Stickies persist as the user navigates between routes. The entire tool UI can be hidden instantly for a clean client demo. _Compile_ gathers every annotation across every visited route into one Markdown artifact plus a `*.starling.json` sidecar and writes both into the project's `annotations/` folder. _Rewind_ reads a saved snapshot back from `annotations/` and re-anchors its stickies onto the current build.

## 7. Functional requirements

**Activation**

- A floating toggle (and a keyboard shortcut) enters/exits markup mode. The tool is inert and invisible to app interactions when markup mode is off.
- Mounts only in development; a no-op in production builds.

**Source attribution**

- When the dev-only build loader is installed, every host element carries a `data-pp-source="relativePath:line:col"` attribute, read at click time and used as the primary locator and primary re-anchor key. The column disambiguates multiple elements authored on one line.
- The loader transforms module text in memory during the build; it never modifies files on disk, and the attributes appear only in the dev DOM.
- It works for both client and server components (the attribute is present in server-rendered HTML).
- When the loader is absent, source resolution falls back to a runtime resolver where possible, else to selector-only with a "no source" flag.

**Selection**

- On hover in markup mode, highlight the bounding box of the **exact host element under the cursor**. There is no automatic walk up to the nearest component.
- The enclosing React component (when a client fiber is present) is resolved for **context only** — its name is shown and stored alongside the element, never substituted as the target.
- Granularity is **manual and opt-in**: arrow-up/down widens/narrows the selection along the parent-element chain before committing. (Alt is reserved for the click-bypass below — it is **not** a granularity control.)
- Show the element's tag, source path, and enclosing component in the highlight label so the user can confirm what they're about to annotate (e.g. `div · Dashboard.tsx:58 (in <Dashboard>)`).

**Annotating**

- Clicking the highlighted element creates a sticky anchored to it and captures the locator bundle (see §9).
- The sticky has an editable text field; edits auto-save to `localStorage` (debounced).
- **Empty stickies are never saved.** A sticky whose note is blank or whitespace-only is discarded when editing ends (on Enter-to-save and on blur), and any that slip through are pruned at compile time — so blank notes never reach storage or the artifact.
- **Click-bypass (Alt+click):** while in markup mode, holding **Alt** and clicking does _not_ create an annotation — it simulates an ordinary click on the underlying app element (following a link, pressing a button, etc.). The tool cancels the native Alt-click (which browsers treat as a "save target" download) and replays a synthetic modifier-free click on the same element. Alt is used rather than Cmd/Ctrl because Cmd-click on a link opens a new browser tab.
- Each sticky has an "X" to delete it.
- Multiple stickies may target the same element.

**Confirmation feedback**

- A transient toast appears just above the toolbar to confirm key actions: a success toast when an annotation is saved ("Annotation added"), after a successful compile, and after a successful rewind; an error toast when an action fails (e.g. the save/load endpoint is unreachable). Toasts auto-dismiss, never block interaction, and announce politely to assistive tech (`role="status"` / `aria-live`).

**Visibility & display modes** — three independent controls govern what's on screen:

- **Tool visibility (demo toggle):** a single control (with a keyboard shortcut for fast mid-demo use) hides _all_ tool UI — toolbar, highlights, badges, and stickies — leaving the app pristine for screen-shares and client demos. Re-enabling restores the prior state.
- **Markup mode:** when the tool is visible, toggles the hover-highlight + click-to-create interaction. With it off, badges/stickies remain viewable but the app is fully interactive for normal clicking.
- **Show all markup:** an overlay toggle that forces every sticky into its expanded state persistently, overriding the default collapsed/badge state.

**Sticky lifecycle & collapsed state**

- On create, a sticky opens expanded with focus in the text field.
- Saving — pressing Enter, or clicking elsewhere to defocus (Shift+Enter for a newline) — collapses the sticky into a small count badge (e.g., `[1]`) anchored to the **top-right corner of the annotated element**. If an element has multiple stickies, the badge shows the count (`[2]`, `[3]`, …).
- Hovering the badge reveals its sticky(ies) transiently — only while hovered.
- Clicking the badge pins the sticky open (persists until defocused again).
- "Show all markup" keeps all stickies expanded regardless of hover/click.
- The badge must stay anchored to the element's top-right corner across scroll, resize, and reload (same re-anchoring as stickies).

**Persistence & anchoring**

- Annotations are stored in one session-wide store, each tagged with its route/URL, viewport size, and timestamp.
- On navigation or dev hot-reload, the overlay renders only the stickies/badges whose route matches the current route and re-anchors each by re-finding its element and recomputing position from the live bounding box. Re-anchor on scroll/resize too.
- Re-find priority: `[data-pp-source="path:line:col"]` → `data-testid` → `id` → ARIA role + accessible name → text → generated CSS path. If none resolve on the current render, mark the sticky "detached" (still editable, still compiled) rather than dropping it.

**Management**

- A sidebar lists all annotations across all routes, grouped by route with counts, allowing jump-to and delete.
- A **"Clear all"** toolbar control deletes every annotation across all routes in one step. It is destructive, so it confirms first, and is disabled when there is nothing to clear.

**Compile**

- A "Compile annotations" action gathers every annotation across all routes (see §9–§10), grouped by route, regardless of which page the user is currently on, and writes out **two files with the same basename**: the human/agent Markdown artifact and the canonical `*.starling.json` sidecar.
- **Output destination:** when a save backend is configured (the default in the in-project package — see §10/§11), Compile writes both files into the host project's `annotations/` folder so feedback lands in the repo where an agent can read it without a manual download/move. If no backend is reachable, it **falls back to a browser download**. A success/error toast reports which path was taken.

**Rewind / restore**

- A "Rewind" control opens a picker listing the saved snapshots in `annotations/` (newest first, showing annotation count and date), populated via a dev-only `list` endpoint.
- Selecting a snapshot loads its `*.starling.json` via a dev-only `load` endpoint, validates the schema `version`, and restores the annotations into the working store (writing `localStorage` so the state survives reload), then re-anchors.
- Default behavior is **Replace** (with a confirm prompt when the current working set is non-empty); **Merge** (dedupe by annotation `id`) is offered as an alternative.
- Loading is **read-only** on the file. To capture the restored-and-edited state, the user re-compiles, which writes a fresh timestamped snapshot.
- Restore is route-aware: loaded annotations carry their route, so the overlay renders only current-route matches and the rest reappear as the user navigates.

## 8. Nonfunctional requirements

- **Non-invasiveness / decoupling (embed/unembed contract):** the package must not modify or depend on the host app's component/application source.
  - The annotator runtime lives in `node_modules` and mounts through a single dev-gated line; removing that line removes it.
  - The source loader transforms module text **in memory during the build** — it never edits files on disk; `data-pp-source` attributes exist only in the dev DOM and vanish when the loader is unregistered. Registration is a single reversible line via a `withStarling()` config wrapper (no-op in production), which is the one unavoidable config touchpoint of any build-time approach.
  - Dev-server endpoints (save/list/load) are hosted **off-app** (Vite plugin, Next sidecar dev server, or the File System Access API — see §10), never as files in the host's `app/`/`pages/` tree.
  - **Total embed footprint:** one mount line + one optional `withStarling(...)` config-wrapper line + one devDependency. Unembed = revert those three; zero residue in component source, zero baked-in attributes, zero API route files.
- **Isolation:** all UI lives in a Shadow DOM — no global CSS, no global-variable collisions, namespaced storage keys. Event listeners attach/detach cleanly with markup mode so the app's own interactions are untouched when the tool is inactive.
- **Removability / zero production footprint:** the mount and the loader are no-ops (tree-shaken or `NODE_ENV`-guarded) in production builds, so nothing ships when the UI is promoted to production.
- **Reusability / portability:** the annotation runtime is a self-contained, dependency-light core with an abstracted storage layer. All captured locators are repo-relative and route-by-pathname, so a compiled snapshot is portable across machines and is what the future browser extension wraps (see §14).

## 9. The annotation locator bundle (the core data)

Each annotation captures:

- `note` — the user's text.
- `source` (primary anchor) — `{ relativePath, lineNumber, columnNumber, componentName }`, read from the element's `data-pp-source` attribute, so it points at the precise JSX line/column of the element you marked. The path is **repo-relative** (portable across machines). `componentName` is the **enclosing** component, captured as context, not the target. Absent when the loader isn't installed and no runtime resolver applies; fall back gracefully.
- `fallbackLocators` (for Playwright/runtime + re-anchor) — multiple strategies, because any single one is fragile: `id` / `data-testid` if present; ARIA `role` + accessible name; text; a generated DOM-path selector.
- `context` — trimmed `outerHTML`, text content, ARIA role, and bounding box at capture time.
- `session` — route (pathname), full URL, viewport size, timestamp. Route matching uses **pathname only**, so a different localhost port doesn't break rendering; viewport/URL are metadata.
- _(Optional, later)_ a sanitized subset of props and a small thumbnail as a human/multimodal aid.

The full bundle (with `note`, `id`, and timestamps) is what the `*.starling.json` sidecar serializes, making each snapshot losslessly restorable.

## 10. Output artifact spec & delivery

**Two files per compile, same basename** (e.g. `starling-7-annotations-2026-06-10-1432.{md,starling.json}`):

1. **Markdown** (human/agent-facing) — a static **prompt preamble** (what the file is; the two ways to use it — update PRD/FRD or apply changes in code; that `source` is the primary anchor pointing at the exact element line/column and `componentName` is enclosing context; that fallback locators are for verification or `.map()` instance disambiguation; that repo-relative paths are openable), followed by **per-route sections** with one entry per annotation: the note, the source path + enclosing component, and a fenced JSON block of the locator bundle.
2. **`*.starling.json` sidecar** (machine-canonical) — the complete `Session` (every annotation with `id`, `note`, `source`, `fallbackLocators`, `context`, `session`, timestamps, and a schema `version`). This is the source of truth for rewind.

**Delivery / endpoints.** The core stays host-agnostic via a `saveEndpoint` (and `listEndpoint`/`loadEndpoint`) mount option; the _backend_ behind them is hosted **off the host app's source tree** so embed/unembed stays clean:

- **Vite hosts:** a dev-only Vite plugin (`configureServer`) attaches the save/list/load handlers to the existing dev server. Cleanest.
- **Next hosts:** a small **sidecar dev server** started by the mount handles the `annotations/` folder over localhost (works everywhere), or the **File System Access API** (`showDirectoryPicker`) lets the browser read/write the folder with no server at all (Chromium-only; folder granted once per session).
- All backends are dev-gated (inert in production) and sanitize filenames to a safe basename to prevent path traversal. None add route files to the host's `app/`/`pages/`. _(This revises the v0.3 plan of a `POST /api/starling/save` Next app route, which would have injected source files.)_

The compiler is a pure deterministic template (within the no-LLM constraint).

## 11. Technical approach (high level)

- **Architecture:** a framework-agnostic, dependency-light **core** (overlay rendering, source-attribute read, locator capture, anchoring, storage abstraction, compile, rewind) wrapped by thin **host adapters**. MVP host = the dev-package mount; future host = the browser-extension content script. Storage and endpoint transport are abstracted (`localStorage` + off-app dev endpoints now; `chrome.storage` later).
- **Source capture:** a dev-only build **loader** parses each `.jsx/.tsx` with `@babel/parser` (parse-only — it does not replace the compiler) and stamps `data-pp-source="relativePath:line:col"` on **host (lowercase) JSX elements**, transforming module text in memory. Registered dev-only via `withStarling()` (Turbopack `turbopack.rules` / webpack `module.rules`). At click time the runtime reads `el.closest('[data-pp-source]')`. This sidesteps both React internals (React 19 removed `_debugSource`) and SWC-plugin ABI brittleness.
- **Server Components:** because the attribute is stamped at build time and rendered server-side, RSC-produced DOM carries source too — closing the gap that runtime fiber-reading can't. When the loader is absent, fall back to a runtime source-map resolver (fragile), else selector-only with a "no source" flag.
- **Overlay:** Shadow DOM root for all tool UI; highlight box, stickies, and badges positioned via live bounding boxes.
- **Rewind / restore:** the `*.starling.json` sidecar round-trips the full session; rewind loads it, replaces/merges the store, and reuses the same Anchorer re-find chain (`data-pp-source` first) to place stickies on the current build.
- **Storage:** one keyed session store, array of locator bundles; re-anchor logic on render/scroll/resize; compiled snapshots are the durable form in `annotations/`.

## 12. Risks & open questions

- **Build-time config touchpoint** — robust source lines require one dev-gated `withStarling()` line in the bundler config (no source-file edits, fully reversible). The only config-free alternative is the fragile runtime source-map resolver. Accepted tradeoff.
- **Cross-machine restore depends on parity** — a snapshot re-anchors precisely on another machine only when both are on the **same app-source commit**, the **annotator setup is committed/shared** (so the loader stamps `data-pp-source` for the second user), and `annotations/` is **committed (not gitignored)**. See §15 for the full contract; drift degrades to fallback locators or "detached."
- **Line/column drift** — format-on-save or `core.autocrlf` line-ending rewrites can shift `line:col` even on logically identical code, demoting an exact match to a fallback. Monorepo project-root resolution can also change relative paths.
- **Anonymous components** (unnamed arrow functions) may lack a clean name — entry shows `file:line:col` only.
- **Transient UI** (modals, hover/focus states) is hard to re-anchor after reload/rewind — flag as detached and keep the note + last-known context.
- **Leaf-element selection** — annotating exactly what's under the cursor means hovering a button's text label lands on the inner `<span>`. By design; mitigated by the confirm-label preview and the manual arrow-up widen.
- **Repeated elements (`.map()`)** — list items share a single source line, so `source` pins the JSX but not which instance; fallback locators (text, nth-child, key-derived testid) disambiguate the instance.
- **Selector brittleness** — mitigated by capturing multiple fallback strategies and treating source as primary.
- **Turbopack loader support** — not every webpack loader works under Turbopack, but the simple text-rewriting source loader is in the supported set.
- **Props capture** — valuable but needs scrubbing (functions, circular refs, PII); deferred.
- **Badge placement** — top-right anchoring can collide for adjacent/tiny elements or get clipped by `overflow:hidden` parents; needs a collision/offset rule.
- Open: an "open in IDE" jump (dev-server middleware) remains deferred as a separate fast-follow (§14-B) unless it proves useful.

## 13. Scope & phasing

**MVP — in-project dev package**

- Dev-only mount + markup-mode toggle (+ shortcut; default Alt+A, with Alt+H hide / Alt+S show-all).
- Dev-only **source-stamping loader** + `withStarling()` config wrapper (Vite + Next; webpack + Turbopack), stamping `data-pp-source`.
- Hover-highlight at exact-element granularity (arrow-up/down to widen); click to drop sticky.
- Alt+click bypass that replays a normal click on the app instead of annotating.
- Sticky text with auto-save and delete; empty/whitespace-only stickies discarded.
- Collapsed badge state + hover-reveal + click-to-pin + "Show all markup" toggle.
- Tool-visibility (demo) toggle that hides all tool UI.
- "Clear all" control (confirm-guarded).
- Transient success/error toasts for annotation-saved, compile, and rewind.
- Locator bundle capture with `data-pp-source` primary + selector fallbacks.
- Cross-route session persistence with re-anchoring.
- Sidebar list of all annotations.
- Compile to Markdown **+ `*.starling.json` sidecar**, written into `annotations/` via an **off-app** backend (Vite plugin / Next sidecar / FS-API), with browser-download fallback.
- **Rewind / restore** from `annotations/` (list + load), replace/merge, re-anchor.

**Fast-follow extensions** (effort & tooling detailed in §14)

- **Browser extension** — run on any site, local or hosted, without per-app install.
- "Open in IDE" jump.
- Playwright verification helper script generated alongside the artifact.
- Optional thumbnails and sanitized props.
- Selection-granularity keyboard-nav refinement.

## 14. Scope extensions — additional effort & tooling

Each item lists only what is _additional_ beyond the reusable MVP core.

**A. Browser extension (any site — local or hosted)** — the headline extension

_Goal:_ run the same annotator on any page without a per-app install, including sites you don't own.

_Key capability constraint:_ the source-location spine exists only where the dev build stamped `data-pp-source` (or where source maps are shipped) — i.e., your own dev builds. On hosted/production sites that data is stripped, so annotations there degrade to selector + DOM-context locators. In practice: pointed at your own local dev app, the extension matches the in-project package; pointed at an arbitrary hosted site, it is selector-only.

_Additional tooling/effort (the annotation core is reused as-is):_

- **Extension scaffold** — Manifest V3 (Chrome/Edge) with a Firefox manifest variant; a build framework such as WXT or CRXJS + Vite.
- **Main-world injection** — fiber/context data lives in the _page's_ JS context, which a default isolated-world content script cannot read. Requires injecting into the main world (`world: "MAIN"` in MV3, or a page-injected `<script>`). Main net-new complexity. (Note: `data-pp-source` attributes are plain DOM and readable from any world.)
- **Permissions & CSP** — `activeTab`, `scripting`, and host permissions; main-world injection also lets it run under strict site CSPs.
- **Storage swap** — replace `localStorage` with `chrome.storage.local`, keyed by origin + route (the abstracted storage layer makes this a drop-in).
- **Extension UI + download** — a popup/options surface for the toggles, and the `chrome.downloads` API for the compiled files.
- **Distribution** — unpacked load for personal use, or Chrome Web Store review; cross-browser packaging.

_Effort driver:_ almost entirely extension plumbing — not the annotation logic.

**B. "Open in IDE" jump** _(fast-follow)_

- Add a dev-server middleware (the `launch-editor` pattern) plus a click action on each annotation/badge. Tooling: a small Vite/Next dev-server plugin. Low effort; dev-only.

**C. Playwright verification helper** _(fast-follow)_

- Emit a companion script that converts each annotation's fallback locators into Playwright queries for runtime verification. Tooling: a template generator; Playwright is a downstream dependency. Low effort; pure template.

**D. Thumbnails / props capture** _(fast-follow)_

- Per-annotation element snapshot via `html-to-image`/canvas, plus a sanitized props serializer. Tooling: an image-capture lib + a safe serializer (functions, circular refs, PII). Moderate effort, mostly the sanitizer.

## 15. Async sharing via git (supported pattern)

A compiled snapshot can be shared with another engineer through the repo — async hand-off, not live collaboration. Because every locator is repo-relative and route-by-pathname, User 1's annotations re-anchor on User 2's machine **when all of the following hold:**

1. **`annotations/` is committed** (not gitignored), so the `*.starling.json` snapshot actually travels.
2. **Both are on the same app-source commit**, so `data-pp-source="path:line:col"` regenerates identically on User 2's build. (Annotations made against uncommitted local edits won't match.)
3. **The annotator setup is committed/shared** — the `withStarling()` wrapper, the mount line, and the devDependency — so User 2's build also stamps `data-pp-source`. Otherwise the second user has no source attributes to match and degrades to selector fallbacks.
4. **Compatible package version**, so the sidecar's schema `version` matches the loader's validation.

The transport is the file, not `localStorage` (which never leaves a machine): User 1 must **Compile** (write the snapshot) before pushing, and User 2 **Rewinds** to load it. When the conditions hold, stickies re-anchor precisely and render per route as User 2 navigates; on code drift they degrade to fallback locators or show as detached with the note preserved.

**Boundary:** this is one-directional snapshot hand-off. If two users edit the same `*.starling.json` and push, the result is an ordinary git merge conflict in JSON, which the tool does **not** resolve — that is the concurrent-collaboration territory scoped out in §4.

## 16. Success criteria

- The user can annotate a multi-route prototype end-to-end and produce one artifact (Markdown + sidecar) written into `annotations/` in a single session.
- With the loader installed, ≥90% of annotations carry a usable source location in both Vite and Next, **including Server Components**.
- Handing the artifact to Claude Code lets it locate and edit the right element primarily from the source path/line/column, without screenshots.
- Stickies survive dev hot-reloads and navigation without losing notes, and collapse to badges by default. Empty stickies are never persisted.
- **Rewind:** a teammate who pulls a committed snapshot on the same commit (per §15) can restore it and see the large majority of stickies re-anchor, with the remainder clearly flagged detached.
- Tool UI can be fully hidden for a clean client demo, and the tool fully removed with no edits to component/application source (one mount line + one config line + one devDependency).

## 17. Changelog

**v0.4 (2026-06-10) — source mechanism, rewind, decoupling**

- **Source mechanism replaced** (§5, §7 _Source attribution_, §9, §11): runtime React-fiber reading dropped (React 19 removed `_debugSource`; SWC plugins are ABI-brittle). A dev-only build loader now stamps `data-pp-source="relativePath:line:col"` by transforming module text in memory — fixing Server Components and adding column precision — with a fragile runtime source-map resolver as the zero-config fallback.
- **Rewind / restore** (§3, §7 _Rewind / restore_, §10, §11): load a saved snapshot from `annotations/` and re-anchor its stickies; replace or merge; read-only on file.
- **Round-trippable output** (§5, §10): each compile now writes a canonical `*.starling.json` sidecar alongside the Markdown.
- **Off-app endpoint hosting** (§8, §10): save/list/load are hosted via a Vite plugin, a Next sidecar dev server, or the File System Access API — never as Next app-route files (revises v0.3's `POST /api/starling/save` route, which would have injected source).
- **Embed/unembed contract** (§5, §8, §16): explicit footprint (one mount line + one config-wrapper line + one devDependency) with no edits to host component/application source; the loader transforms in memory only.
- **Async sharing via git** (§2, §4, §15): documented as a supported one-directional snapshot hand-off with a four-condition contract; concurrent co-editing remains a non-goal.

**v0.3 (2026-06-10) — feature changes since initial build**

- **Alt+click bypass** (§7 _Annotating_): Alt+click replays a normal click on the underlying app element instead of annotating; replaces the earlier Cmd/Ctrl bypass.
- **Empty stickies discarded** (§7 _Annotating_, §16): blank / whitespace-only notes dropped on save and blur, pruned at compile.
- **"Clear all" control** (§7 _Management_): one-step, confirm-guarded deletion of all annotations.
- **Confirmation toasts** (§7 _Confirmation feedback_): transient success/error toasts for key actions.
- **Compile writes into the project** (§7 _Compile_, §10): artifact saved to `annotations/`, with a browser-download fallback.
- **Stale spec corrected** (§7 _Selection_): removed the never-implemented "hold Alt to prefer enclosing interactive element" granularity modifier; Alt is the click-bypass and granularity is arrow-up/down only.
