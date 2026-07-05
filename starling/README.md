# Starling

**A dev-only, in-browser annotation tool for React prototypes.** Enter markup
mode on your running app, click components to attach text stickies, and compile
all your feedback into one Markdown + JSON snapshot that Claude / Claude Code can
act on — updating the prototype, the PRD, or both.

- **Drop-in & agnostic.** One dev-only line in any Vite **or** Next.js React app.
  No changes to your components, routing, or build config.
- **Shared by default.** Compiled snapshots persist to a remote store (Supabase),
  so feedback reaches teammates instantly — no commit, push, or pull. Snapshots
  are scoped by an `appId`, so one database can back many prototypes.
- **Source-aware where possible, selector-anchored always.** Each annotation
  captures robust selector/role/text locators (with ready-to-paste Playwright
  expressions) and, when available, the element's exact `file:line`.
- **Zero production footprint.** Guarded by `NODE_ENV` + dynamic import — nothing
  ships to prod. Remove it by deleting one line.
- **No LLM calls inside the tool.** Compilation is pure and deterministic.

---

## Table of contents

1. [Install / drop-in](#1-install--drop-in)
2. [Mount it (Vite & Next)](#2-mount-it)
3. [Keyboard shortcuts](#3-keyboard-shortcuts)
4. [The three visibility controls](#4-the-three-visibility-controls)
5. [Selecting what to annotate](#5-selecting-what-to-annotate)
6. [Compile, share & hand off to Claude](#6-compile-share--hand-off-to-claude)
7. [⚠️ Source coverage on React 19 (read this)](#7-source-coverage-on-react-19)
8. [Persistence, Rewind & detached annotations](#8-persistence-rewind--detached-annotations)
9. [The shared store (Supabase) — setup](#9-the-shared-store-supabase--setup)
10. [Removal](#10-removal)
11. [API](#11-api)
12. [Limitations / non-goals](#12-limitations--non-goals)
13. [Developing the tool itself](#13-developing-the-tool-itself)

---

## 1. Install / drop-in

Starling is consumed as a local dev dependency — it stays out of your app's
`src/` and never touches your build.

```jsonc
// your app's package.json
{
  "devDependencies": {
    "@starling/dev": "file:./path/to/starling/tool"
  }
}
```

Then build the package once (it ships as ESM in `dist/`):

```bash
cd path/to/starling/tool
npm install
npm run build        # or: npm run dev  (watch mode while iterating on the tool)

cd -                 # back to your app
npm install          # picks up the file: dependency
```

> **Escape hatch (no build step):** if you'd rather skip the build, you can import
> the raw source entry directly — `import("../path/to/starling/tool/src/index.ts")`
> — in a Vite app (Vite transpiles TS on the fly). The built artifact is
> recommended because it's framework-agnostic and keeps the tool's TypeScript out
> of your app's tsconfig/lint.

---

## 2. Mount it

The "one line" is a **dev-only dynamic import** of `mountStarling()`. Copy-paste
snippets live in [`examples/`](./examples).

### Vite

In `src/main.tsx`, after rendering your app:

```ts
if (import.meta.env.DEV) {
  import("@starling/dev").then((m) => m.mountStarling());
}
```

### Next.js (App Router)

The package ships a ready-made dev-only client component — no hand-written mount
file. Render `<Starling />` once inside `<body>` in `app/layout.tsx`:

```tsx
import { Starling } from "@starling/dev/next";

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Starling
          appId="my-app"
          saveEndpoint="/api/starling/save"
          listEndpoint="/api/starling/list"
          loadEndpoint="/api/starling/load"
        />
      </body>
    </html>
  );
}
```

> **`appId` scopes the snapshots.** Every save/list/load is filtered by it, so a
> single shared database can back several prototypes without their feedback
> mixing. Pick a stable slug per app (e.g. `"agentic-spar"`). See
> [§9](#9-the-shared-store-supabase--setup) for the one-time store setup.

Optionally register the dev-only source-stamping loader in `next.config.ts`
(one line, no-op in production):

```ts
import { withStarling } from "@starling/dev/next/config";

export default withStarling(nextConfig);
```

> On the default **Turbopack** dev server, source stamping is skipped (Turbopack
> doesn't run a Babel-AST loader); Starling falls back to its selector locators,
> which work fully. Run `next dev --webpack` for Tier-1 `file:line` source
> attributes. See [`examples/next-layout.tsx`](./examples/next-layout.tsx).

**Why the guards are there:**

- `typeof window === "undefined"` → no-op during SSR.
- `NODE_ENV` / `import.meta.env.DEV` → no-op in production builds; the dynamic
  `import()` is dead-code-eliminated, so nothing is bundled.
- `window.__STARLING__` → idempotent across HMR and React StrictMode's
  double-effect, so you never get two overlays.

A floating toolbar appears bottom-right. You're ready.

---

## 3. Keyboard shortcuts

| Shortcut | Action |
| --- | --- |
| `M` | Toggle **markup mode** on/off (hover-highlight + click-to-annotate) |
| `Esc` | **Escape** markup mode (turn off only; no-op when already off) |
| `A` | Toggle **show all markup** on/off (force every sticky expanded) |
| `Alt` + `H` | Toggle **tool visibility** (demo hide — hides ALL tool UI) |

Shortcuts are ignored while you're typing in **your app's own** inputs. The
modifier shortcut (`Alt+H`) still fires when a sticky is focused (so it works
mid-demo), while the bare-key shortcuts (`M` / `A` / `Esc`) yield to a focused
sticky so you can type those letters into a note. Override them via
`mountStarling({ shortcuts: { … } })` — see [API](#10-api).

---

## 4. The three visibility controls

These are **independent** and compose:

- **Tool visibility (demo hide)** — `Alt+H` or the toolbar's *Hide* button. Hides
  the entire tool: toolbar, highlights, badges, and stickies. The app is left
  pristine for a screen-share or client demo. Re-enabling restores the prior
  state exactly.
- **Markup mode** — `M` (or `Esc` to turn off) or *Markup*. Turns on the
  hover-highlight + click-to-create interaction. When **off**, your existing
  badges/stickies stay visible but your app is fully clickable as normal.
- **Show all markup** — `A` or *Show all*. Forces every sticky into its
  expanded state, overriding the default collapsed-to-badge behavior.

Default state of a saved annotation is a small count **badge** at the element's
top-right corner. **Hover** a badge to reveal its sticky transiently; **click** to
pin it open.

---

## 5. Selecting what to annotate

- Starling highlights the **exact host element under your cursor** — by design,
  with no automatic snap to the enclosing component. (Hovering a button's text
  label highlights the inner `<span>`, not the `<button>`.)
- The confirm label shows what you're about to mark, e.g.
  `div · Dashboard.tsx:58 (in <Dashboard>)`, or `div · (no source) (in <Dashboard>)`
  when no source line is available.
- **Arrow Up / Arrow Down** widens / narrows the selection along the
  **parent-element chain** before you click. Moving the cursor resets it.
- **Click** drops a sticky anchored to that element and opens it focused.
- **Enter** saves and collapses to a badge (**Shift+Enter** for a newline). The
  **×** deletes. Multiple stickies may target the same element — the badge shows
  the count.

---

## 6. Compile, share & hand off to Claude

Click **Compile** in the toolbar (or call the API). Starling saves a single
snapshot containing **every** annotation across **every** route you visited this
session — regardless of which page you're on right now — to the shared remote
store (scoped by `appId`). Authorship is stamped server-side from
`git config user.name`. No file is downloaded and **no git push/pull is needed**:
the moment Compile succeeds, teammates (and Claude agents) can read it.

Each snapshot holds:

1. A **prompt preamble** telling Claude what the feedback is and how to use it
   (update the PRD, or apply changes in code).
2. **Per-route sections**, each entry with the human note, the resolved location,
   and a fenced **JSON** block with the full locator bundle — plus the canonical
   `Session` JSON for round-tripping.

**Hand it to Claude via the fetch entrypoint** (a thin runner over the same query
functions the app uses). A prompter describes the snapshot by metadata — never an
id:

```bash
# List snapshots for an app (newest first); narrow with --author / --since / --latest
npm run starling:fetch -- --app my-app

# Print one snapshot's Markdown (or --json for the canonical Session)
npm run starling:fetch -- --app my-app --latest --content
npm run starling:fetch -- --app my-app --author ada --since 2026-06-10 --content
```

Then: *"Here's UX feedback captured on the running prototype — apply each note to
the marked element."* Claude locates each element from the fallback locators (and
`source` file:line when present) and makes the change.

<details>
<summary>Sample output</summary>

````markdown
<!-- STARLING ANNOTATIONS — read me first -->
… preamble …

# Starling annotations (1)

## Route: `/checkout`

### button (no source — use fallback locators)
**Note:** Submit button should be primary color and full-width on mobile.
```json
{
  "id": "k3l9…",
  "note": "Submit button should be primary color and full-width on mobile.",
  "source": null,
  "fallbackLocators": [
    { "strategy": "role", "value": "button:Place order",
      "playwright": "page.getByRole(\"button\", { name: \"Place order\" })" }
  ],
  "context": { "tagName": "button", "textContent": "Place order", "role": "button",
    "rect": { "x": 220, "y": 540, "width": 160, "height": 44 } },
  "session": { "route": "/checkout", "viewport": { "width": 1440, "height": 900 } }
}
```
````

</details>

---

## 7. Source coverage on React 19

**This matters for how you use the output.** React 19 removed the fiber's
`_debugSource` field and React 19.2 strips the `jsxDEV` source object — so the
classic "read the source file:line off the fiber with zero config" trick **no
longer works**. On a stock **Next 16 / React 19** app, `source` will usually be
`null`.

**Starling is built for this.** Source is treated as *best-effort enrichment*, not
a requirement:

- Every annotation always carries robust **fallback locators** (testid → id →
  role+name → text → css), each with a Playwright expression. These are the
  **primary anchor**, and they're ~100% reliable.
- The enclosing **component name** still resolves from the fiber even without a
  source line, so labels read `(in <Dashboard>)`.
- When `source` *is* present, the compiled artifact and re-anchoring both prefer
  it.

### Want exact `file:line` links? Enable the optional Tier-1 plugin

A build-time plugin stamps `data-inspector-*` attributes onto host elements, which
Starling reads first. See [`plugin/README.md`](./plugin/README.md):

- **Vite — first-class & reliable.** Wire `starlingBabelPlugin()` into
  `@vitejs/plugin-react`'s `babel.plugins` (dev only). Source coverage jumps to
  ~100%.
- **Next 16 — experimental, not recommended as default.** Next uses SWC/Turbopack;
  a Babel route changes your build and an SWC plugin is version-fragile. Expect to
  run **selector-only** on Next, which works fine.

---

## 8. Persistence, Rewind & detached annotations

Two layers of persistence, with distinct jobs:

- **Live session — `localStorage`.** The annotations you're actively writing are
  buffered in `localStorage` under `starling:session:default`, one session-wide
  store, each tagged with route, viewport, and timestamp. This survives page
  navigation and dev hot-reloads, but it's **local to your browser** until you
  Compile. On a successful Compile it's flushed and the session id rotates.
- **Compiled snapshots — the shared store.** Compile persists the session to the
  remote store (see [§9](#9-the-shared-store-supabase--setup)), scoped by `appId`.
  This is the durable, shared, round-trippable source of truth — what teammates
  and Claude agents read.

On each render the tool shows only the **current route's** annotations and
re-anchors each by re-finding its element (via the stored locators) and
recomputing position from the live bounding box — also on scroll and resize. If a
target can't be re-found on the current view (e.g. a closed modal), the annotation
is marked **detached** (⚠ in the sticky and sidebar) rather than dropped — the note
and last-known context are kept and still compile.

The **List** button opens a sidebar with the live annotations grouped by route
(counts, jump-to, delete) plus **Rewind**: a picker of past snapshots for this
`appId`, fetched live from the store. Selecting one loads it **read-only** and
re-anchors its stickies onto the current build; "back to current session" returns
to the live editable set.

**Clear the live session:**
`window.localStorage.removeItem("starling:session:default")`, then reload. (This
only clears the local buffer — compiled snapshots in the store are unaffected.)

---

## 9. The shared store (Supabase) — setup

Compiled snapshots live in a Supabase table; the dev endpoints
(`save`/`list`/`load`) and the agent entrypoint all talk to it through one
data-access layer (`plugin/snapshots.ts`). Setup is **one-time, by the
maintainer** — every other clone just works.

**1. Create the table.** In the Supabase dashboard → SQL Editor:

```sql
create table public.starling_snapshots (
  id               uuid primary key default gen_random_uuid(),
  app_id           text not null,
  basename         text not null,
  session_id       text,
  author           text,
  version          int,
  annotation_count int  not null default 0,
  saved_at         timestamptz not null default now(),
  session_json     jsonb not null,
  markdown         text  not null
);
create index starling_snapshots_app_saved_idx
  on public.starling_snapshots (app_id, saved_at desc);

alter table public.starling_snapshots enable row level security;
-- anon may read and append; no update/delete from clients.
create policy "anon read"   on public.starling_snapshots for select to anon using (true);
create policy "anon insert" on public.starling_snapshots for insert to anon with check (true);
```

**2. Point Starling at the project.** Edit `plugin/supabase.ts` with your project
URL and **publishable / anon** key, or set `STARLING_SUPABASE_URL` /
`STARLING_SUPABASE_ANON_KEY`. After editing, **rebuild** (`npm run build`) — the
values are bundled into `dist/` at build time.

> **Security model.** The anon/publishable key is *designed* to be embedded in
> client code; the boundary is the RLS policies above, **not** key secrecy — so it
> is safe to commit, which is what gives every clone zero-setup access with no
> deployment and no per-user tokens. **Never** commit the service-role key (it's
> full-admin). With the policies above, anyone who can read the repo can read and
> append annotations — fine for an internal tool; tighten the `insert` policy if
> you need a stronger boundary.

**3. (Optional) migrate legacy file snapshots.** If you have an old
`annotations/` folder of `*.starling.json` files, import them once:

```bash
npm run starling:migrate -- --app my-app          # add --dry to preview
```

Then delete the `annotations/` folder — the store is the source of truth.

---

## 10. Removal

Zero production footprint and trivially removable:

1. Delete the mount line (Vite) or the `<Starling />` element + the
   `withStarling(...)` wrapper in `next.config.ts` (Next).
2. Remove `"@starling/dev"` from `devDependencies`.
3. (Optional) delete the `starling/tool` folder.

Because the import is dev-guarded and dynamic, production builds never include it
even if you forget step 1.

---

## 11. API

```ts
import { mountStarling, unmountStarling, compile } from "@starling/dev";

mountStarling({
  // Scopes every save/list/load in the shared store, so one database can back
  // many prototypes. Pick a stable slug per app. Optional (defaults to "").
  appId: "my-app",

  // Dev endpoints the tool talks to. With the Vite plugin / Next withStarling()
  // wrapper these are auto-mounted; the defaults match those routes.
  saveEndpoint: "/api/starling/save",
  listEndpoint: "/api/starling/list",
  loadEndpoint: "/api/starling/load",

  // Absolute project root — used to make source paths repo-relative.
  // Optional; falls back to a src/app/pages/components heuristic.
  projectRoot: undefined,

  // Keyboard shortcut overrides (combine with +). Defaults shown.
  shortcuts: {
    toggleMarkup: "M",
    toggleVisible: "Alt+H",
    toggleShowAll: "A",
    escapeMarkup: "Escape",
  },

  // Override the snapshot basename (its human-readable label). Optional;
  // defaults to a dated, count-tagged name.
  compileFilename: undefined,
});

// Programmatic teardown (mainly for tests).
unmountStarling();

// Pure compiler — also exported for custom pipelines / the future extension.
// compile(session: Session): string
```

`mountStarling` is a **no-op** on the server, in production, and on repeat calls.

The shared data-access functions are also exported for scripts/agents:

```ts
// from "@starling/dev/plugin/snapshots" (Node)
fetchSnapshots(query): Promise<SnapshotMeta[]>   // resolve by appId + metadata
fetchSnapshot({ appId, id }): Promise<{ session, markdown } | null>
insertSnapshot(input): Promise<{ id, savedAt, author }>
```

---

## 12. Limitations / non-goals

- **Dev-only.** Not for production builds or hosted/minified sites (a browser
  extension that extends to those is a planned fast-follow).
- **Shared store, not live collaboration.** Compiled snapshots are shared via the
  remote store and appear in others' Rewind, but there's no real-time co-editing
  or merge — each Compile writes a new immutable snapshot.
- **React only.** Relies on the React fiber for component names.
- **No recommendations generated.** Starling captures and compiles; producing the
  PRD/code changes is Claude's job downstream.
- **No LLM calls inside the tool** — compilation is deterministic.

---

## 13. Developing the tool itself

```bash
npm install
npm run build        # bundle to dist/ (ESM + d.ts)
npm run dev          # watch build
npm run typecheck    # tsc --noEmit
npm test             # vitest unit tests (jsdom)
```

Architecture (framework-agnostic core + thin host adapter):

```
src/
  index.ts            mountStarling() — the dev-package host adapter + guards
  Starling.ts         orchestrator: store + anchorer + overlay + state machine
  types.ts            data model
  inspector/          fiber walk, tiered source resolution, fallback locators
  anchoring/          re-anchor engine + badge positioning
  store/              SessionStore + storage backends (the extension seam)
  ui/                 shadow-DOM overlay: toolbar, highlight, sticky, badge, sidebar
  interaction/        markup mode, routing, shortcuts
  compile/            deterministic Markdown+JSON exporter + preamble
  util/               id, debounce, groupBy, dom helpers
plugin/
  vite.ts             Vite dev middleware mounting save/list/load
  next.ts             withStarling() + createStarlingRoute() (App Router)
  server.ts           endpoint core: git authorship + delegates persistence
  snapshots.ts        the data-access layer (insert/fetch via Supabase REST)
  supabase.ts         connection config (publishable key + table)
  babel-plugin-…      optional Tier-1 source-attribute plugin
scripts/
  fetch.mjs           agent entrypoint — resolve+read snapshots by metadata
  migrate-annotations.mjs   one-time import of legacy annotations/ files
```

The orchestrator depends only on injected interfaces (`StorageBackend`), so the
planned browser extension reuses this core unchanged — it just swaps in a
`chrome.storage` backend and a main-world injection adapter. Likewise, every DB
query lives in `plugin/snapshots.ts`, so re-pointing the store (e.g. behind a
secret-holding proxy) is a single-file change.
