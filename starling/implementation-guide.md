# Starling — Implementation Guide

Companion to **PRD v0.2**. This guide is build-ready: it specifies the architecture, the data model, the load-bearing algorithms (fiber walk, source resolution, anchoring), the mount, the compile format, and a milestone build order. Code is TypeScript and intentionally framework-agnostic in the core, per the decoupling NFR (PRD §8).

---

## 0. Stack & ground rules

- **Language:** TypeScript, ES2020+. No dependency on the host app's React instance.
- **Core UI:** rendered with vanilla DOM inside a Shadow Root (zero framework, keeps the bundle tiny and avoids clashing with the host's React version). Preact is an acceptable alternative if you want components; do **not** reuse the host's React.
- **Build:** `tsup` or Vite library mode → ESM bundle, tree-shakeable, side-effect-free except the explicit `mountStarling()` call.
- **Hard rule:** the package must be a no-op in production and removable by deleting one line (PRD §8). All entry points guard on `NODE_ENV`/`import.meta.env.DEV` and `typeof window`.

---

## 1. Architecture: core + host adapters

```
@starling/core            ← framework-agnostic engine (this guide's focus)
  ├─ inspector/           ← fiber walk, source resolution, locator capture
  ├─ anchoring/           ← position + re-anchor engine
  ├─ store/               ← session state + storage backends
  ├─ ui/                  ← shadow-DOM overlay, toolbar, sticky, badge, sidebar
  ├─ compile/             ← deterministic Markdown+JSON exporter
  ├─ Starling.ts          ← orchestrator wiring the above
  └─ index.ts             ← mountStarling() entry

host adapters (thin):
  @starling/dev-package   ← MVP: exports mountStarling; storage = localStorage
  @starling/extension     ← future: MV3 content script; storage = chrome.storage  (PRD §14)
```

The orchestrator depends only on injected interfaces (`StorageBackend`, `Renderer`), so swapping the host (dev-package → extension) changes adapters, not the engine.

### Suggested file tree

```
packages/core/src/
  Starling.ts
  index.ts
  types.ts
  inspector/fiber.ts
  inspector/source.ts
  inspector/locators.ts
  inspector/a11y.ts
  anchoring/Anchorer.ts
  anchoring/position.ts
  store/SessionStore.ts
  store/backends/LocalStorageBackend.ts
  store/backends/StorageBackend.ts
  ui/ShadowRoot.ts
  ui/Toolbar.ts
  ui/Sticky.ts
  ui/Badge.ts
  ui/Sidebar.ts
  ui/Highlight.ts
  ui/styles.css.ts
  compile/compile.ts
  compile/preamble.ts
  util/dom.ts
  util/debounce.ts
```

---

## 2. Data model (`types.ts`)

```ts
export interface SourceLocation {
  relativePath: string; // e.g. "src/components/CheckoutForm.tsx"
  lineNumber: number;
  columnNumber: number | null;
  componentName: string | null; // ENCLOSING component (context only), null for anonymous
  tier: "attribute" | "fiber"; // how it was obtained (provenance for debugging)
}

export type LocatorStrategy = "testid" | "id" | "role" | "text" | "css";

export interface FallbackLocator {
  strategy: LocatorStrategy;
  value: string; // selector or "role:name"
  playwright: string; // ready-to-paste Playwright expression
}

export interface ElementContext {
  outerHTMLTrimmed: string; // opening tag + truncated content, max ~400 chars
  textContent: string; // trimmed, max ~120 chars
  role: string | null;
  rect: { x: number; y: number; width: number; height: number };
}

export interface SessionContext {
  route: string; // normalized pathname (see §6)
  url: string; // full href at capture
  viewport: { width: number; height: number };
  capturedAt: string; // ISO timestamp
}

export interface Annotation {
  id: string; // nanoid
  note: string;
  source: SourceLocation | null;
  fallbackLocators: FallbackLocator[];
  context: ElementContext;
  session: SessionContext;
  createdAt: string;
  updatedAt: string;
}

export interface Session {
  version: 1;
  sessionId: string;
  annotations: Annotation[];
}

// Runtime-only (never serialized): live element ref + computed view state
export interface RuntimeAnnotation {
  data: Annotation;
  el: Element | null;
  rect: DOMRect | null;
  detached: boolean;
  view: "collapsed" | "hover" | "pinned" | "editing";
}
```

`view` and `el`/`rect` are ephemeral; only `Annotation`/`Session` are persisted.

---

## 3. The inspector (the AI-native spine)

This is what makes the output actionable by Claude. Source resolution is **tiered** to honor both the zero-config NFR and the Next App Router caveat (PRD §11/§12).

### 3.1 Find & walk the fiber (`inspector/fiber.ts`)

```ts
type Fiber = any; // React's internal type; we read defensively

export function getFiberFromNode(node: Element): Fiber | null {
  const key = Object.keys(node).find(
    (k) =>
      k.startsWith("__reactFiber$") || k.startsWith("__reactInternalInstance$"),
  );
  return key ? ((node as any)[key] ?? null) : null;
}

// Host fibers have string `type` (e.g. "div"); component fibers have function/object type.
export function isComponentFiber(f: Fiber): boolean {
  const t = f?.type;
  return typeof t === "function" || (typeof t === "object" && t !== null);
}

export function nearestComponentFiber(f: Fiber | null): Fiber | null {
  while (f) {
    if (isComponentFiber(f)) return f;
    f = f.return;
  }
  return null;
}

export function getComponentName(f: Fiber | null): string | null {
  const t = f?.type;
  if (!t || typeof t === "string") return null;
  return (
    t.displayName ||
    t.name ||
    (t.render && (t.render.displayName || t.render.name)) || // forwardRef
    (t.type && (t.type.displayName || t.type.name)) || // memo
    null
  );
}

// Optional: walk component ancestors for the manual "widen to enclosing component" step.
// NOT used for default selection — selection targets the exact host element (see §8).
export function* ancestorComponents(f: Fiber | null): Generator<Fiber> {
  let cur = nearestComponentFiber(f);
  while (cur) {
    yield cur;
    cur = nearestComponentFiber(cur.return);
  }
}
```

Selection defaults to the **exact host element** under the cursor — there is no automatic walk to a component. The arrow-up/down granularity control (PRD §7) walks the **parent-element chain** (`node.parentElement`); `nearestComponentFiber`/`getComponentName` are used only to label the element with its enclosing component name. `ancestorComponents` remains available for the optional "widen to enclosing component" step, but is never applied automatically.

### 3.2 Resolve source location (`inspector/source.ts`)

```ts
import { nearestComponentFiber, getComponentName } from "./fiber";
import type { SourceLocation } from "../types";

// Tier 1 (preferred, robust): DOM attributes stamped by an optional babel/SWC plugin.
// Survives SSR + needs no fiber → this is the fix for Next App Router Server Components.
function fromAttributes(node: Element): SourceLocation | null {
  const path = node.getAttribute("data-inspector-relative-path");
  const line = node.getAttribute("data-inspector-line");
  if (!path || !line) return null;
  return {
    relativePath: path,
    lineNumber: Number(line),
    columnNumber: node.getAttribute("data-inspector-column")
      ? Number(node.getAttribute("data-inspector-column"))
      : null,
    componentName: null, // filled by caller from fiber if available
    tier: "attribute",
  };
}

// Tier 0 (zero-config): fiber _debugSource / __source. Works for client components
// in Vite + Next dev with no build changes.
function fromFiber(fiber: any, root: string): SourceLocation | null {
  let f = fiber;
  while (f) {
    const dbg = f._debugSource ?? f.memoizedProps?.__source;
    if (dbg?.fileName) {
      return {
        relativePath: toRelative(dbg.fileName, root),
        lineNumber: dbg.lineNumber,
        columnNumber: dbg.columnNumber ?? null,
        componentName: getComponentName(nearestComponentFiber(f)),
        tier: "fiber",
      };
    }
    f = f.return;
  }
  return null;
}

export function resolveSource(
  node: Element,
  fiber: any,
  root: string,
): SourceLocation | null {
  const attr = fromAttributes(node);
  if (attr) {
    attr.componentName =
      getComponentName(nearestComponentFiber(fiber)) ?? attr.componentName;
    return attr;
  }
  return fromFiber(fiber, root); // → null triggers the selector-only fallback (PRD §12)
}

// fileName is usually absolute in dev. Strip to repo-relative.
function toRelative(fileName: string, root: string): string {
  if (root && fileName.startsWith(root))
    return fileName.slice(root.length).replace(/^[\\/]/, "");
  const m = fileName.match(/(?:^|[\\/])(src|app|pages|components)[\\/].*/);
  return m ? m[0].replace(/^[\\/]/, "") : fileName;
}
```

> **Version note:** React's internal `_debugSource` field has shifted across versions; treat both `_debugSource` and `memoizedProps.__source` as candidates, and prefer Tier 1 attributes when present. `react-dev-inspector` is a working reference for both the fiber walk and the attribute plugin.

> **Element-level:** pass the **hovered element's own host fiber** here, not a component fiber. Because babel stamps `__source` on host JSX, `fromFiber` returns that element's exact line; `getComponentName(nearestComponentFiber(f))` fills `componentName` with the _enclosing_ component as context only.

### 3.3 Locator capture (`inspector/locators.ts`)

Build an ordered list of fallback strategies — never rely on one, because any single selector is brittle (PRD §9).

```ts
export function buildFallbackLocators(node: Element): FallbackLocator[] {
  const out: FallbackLocator[] = [];
  const q = (v: string) => JSON.stringify(v);

  const testid =
    node.getAttribute("data-testid") ?? node.getAttribute("data-test");
  if (testid)
    out.push({
      strategy: "testid",
      value: testid,
      playwright: `page.getByTestId(${q(testid)})`,
    });

  if (node.id && !isGeneratedId(node.id)) {
    const sel = `#${CSS.escape(node.id)}`;
    out.push({
      strategy: "id",
      value: sel,
      playwright: `page.locator(${q(sel)})`,
    });
  }

  const role = node.getAttribute("role") ?? implicitRole(node);
  const name = accessibleName(node);
  if (role && name)
    out.push({
      strategy: "role",
      value: `${role}:${name}`,
      playwright: `page.getByRole(${q(role)}, { name: ${q(name)} })`,
    });

  const text = (node.textContent ?? "").trim().slice(0, 60);
  if (text)
    out.push({
      strategy: "text",
      value: text,
      playwright: `page.getByText(${q(text)}, { exact: false })`,
    });

  const css = cssPath(node);
  out.push({
    strategy: "css",
    value: css,
    playwright: `page.locator(${q(css)})`,
  });
  return out;
}

// React useId() emits ":r3:" style ids; ignore those and long hashes.
function isGeneratedId(id: string): boolean {
  return /^:r|^[0-9a-f]{8,}$/i.test(id) || id.includes(":");
}

// Bounded structural path: stops at the first ancestor with id/testid, caps depth at 6.
function cssPath(node: Element): string {
  const parts: string[] = [];
  let el: Element | null = node;
  while (el && el !== document.body && parts.length < 6) {
    if (el.id && !isGeneratedId(el.id)) {
      parts.unshift(`#${CSS.escape(el.id)}`);
      break;
    }
    const tid = el.getAttribute("data-testid");
    if (tid) {
      parts.unshift(`[data-testid="${tid}"]`);
      break;
    }
    const tag = el.tagName.toLowerCase();
    const idx = indexAmongSiblings(el);
    parts.unshift(idx ? `${tag}:nth-of-type(${idx})` : tag);
    el = el.parentElement;
  }
  return parts.join(" > ");
}
```

`implicitRole`, `accessibleName`, `indexAmongSiblings` are small helpers in `inspector/a11y.ts` / `util/dom.ts` (implementation detail: `accessibleName` ≈ `aria-label` → `aria-labelledby` text → trimmed `textContent`).

---

## 4. Storage (`store/`)

Backend is an interface so the extension can drop in `chrome.storage` later (PRD §11/§14).

```ts
// backends/StorageBackend.ts
export interface StorageBackend {
  load(): Session | null;
  save(session: Session): void;
  clear(): void;
}

// backends/LocalStorageBackend.ts
const KEY = "starling:session:default"; // namespaced (NFR: no global collisions)
export class LocalStorageBackend implements StorageBackend {
  load(): Session | null {
    try {
      const r = localStorage.getItem(KEY);
      return r ? JSON.parse(r) : null;
    } catch {
      return null;
    }
  }
  save(s: Session) {
    try {
      localStorage.setItem(KEY, JSON.stringify(s));
    } catch {}
  }
  clear() {
    localStorage.removeItem(KEY);
  }
}
```

`SessionStore` wraps the backend, holds the in-memory `Session`, exposes `add/update/remove/all/byRoute`, debounces saves (~300 ms), and emits change events the UI subscribes to.

```ts
export class SessionStore {
  private session: Session;
  private listeners = new Set<() => void>();
  private save = debounce(() => this.backend.save(this.session), 300);

  constructor(private backend: StorageBackend) {
    this.session = backend.load() ?? {
      version: 1,
      sessionId: nanoid(),
      annotations: [],
    };
  }
  all() {
    return this.session.annotations;
  }
  byRoute(route: string) {
    return this.session.annotations.filter((a) => a.session.route === route);
  }
  add(a: Annotation) {
    this.session.annotations.push(a);
    this.commit();
  }
  update(id: string, patch: Partial<Annotation>) {
    const a = this.session.annotations.find((x) => x.id === id);
    if (a) {
      Object.assign(a, patch, { updatedAt: new Date().toISOString() });
      this.commit();
    }
  }
  remove(id: string) {
    this.session.annotations = this.session.annotations.filter(
      (x) => x.id !== id,
    );
    this.commit();
  }
  subscribe(fn: () => void) {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }
  private commit() {
    this.save();
    this.listeners.forEach((fn) => fn());
  }
}
```

---

## 5. Anchoring engine (`anchoring/`)

Every visible element (highlight, sticky, badge) is positioned from a live `getBoundingClientRect()` and re-anchored on any layout-affecting event. This is also the HMR-survival mechanism (PRD §7).

```ts
export class Anchorer {
  private rafId: number | null = null;
  private teardown: Array<() => void> = [];

  constructor(
    private getRuntime: () => RuntimeAnnotation[],
    private onUpdated: () => void, // triggers UI reposition
    private root: string,
  ) {}

  start() {
    const schedule = () => {
      if (this.rafId == null)
        this.rafId = requestAnimationFrame(() => {
          this.rafId = null;
          this.reanchorAll();
        });
    };
    addEventListener("scroll", schedule, true); // capture: catches nested scrollers
    addEventListener("resize", schedule);
    const mo = new MutationObserver(schedule); // catches re-renders + HMR swaps
    mo.observe(document.body, { childList: true, subtree: true });
    this.teardown.push(
      () => removeEventListener("scroll", schedule, true),
      () => removeEventListener("resize", schedule),
      () => mo.disconnect(),
    );
    schedule();
  }

  reanchorAll() {
    for (const r of this.getRuntime()) {
      let el = r.el?.isConnected ? r.el : null;
      if (!el) el = this.refind(r); // re-find after reload/navigation
      if (el) {
        r.el = el;
        r.rect = el.getBoundingClientRect();
        r.detached = false;
      } else {
        r.detached = true;
      } // keep note; mark detached (PRD §12)
    }
    this.onUpdated();
  }

  // Re-find priority mirrors locator robustness: attribute → testid → role+name → css.
  private refind(r: RuntimeAnnotation): Element | null {
    const s = r.data.source;
    if (s?.tier === "attribute")
      return document.querySelector(
        `[data-inspector-relative-path="${s.relativePath}"][data-inspector-line="${s.lineNumber}"]`,
      );
    for (const loc of r.data.fallbackLocators) {
      const el = tryLocator(loc); // testid/id/css → querySelector; role/text → scan
      if (el) return el;
    }
    return null;
  }

  stop() {
    this.teardown.forEach((fn) => fn());
    this.teardown = [];
  }
}
```

Badge position (top-right of the element, with the collision rule from PRD §12):

```ts
export function badgePosition(rect: DOMRect): { left: number; top: number } {
  const OFFSET = 6,
    BADGE = 18;
  // Clamp into viewport so it isn't clipped by overflow:hidden ancestors or screen edge.
  const left = Math.min(
    rect.right - BADGE + OFFSET,
    window.innerWidth - BADGE - 2,
  );
  const top = Math.max(rect.top - OFFSET, 2);
  return { left, top };
}
```

For multiple badges colliding on adjacent tiny elements, fan them out by a few px using a simple occupancy check during render (implementation detail).

---

## 6. Route normalization & cross-route rendering

Annotations are tagged with a normalized route and only the current route's are rendered (PRD §7).

```ts
export function currentRoute(): string {
  return location.pathname; // pathname only; query/hash excluded by default (configurable)
}
```

Detect navigation in SPAs (Next App Router, client routers) by patching history + listening to `popstate`:

```ts
function onRouteChange(cb: () => void) {
  const fire = () => cb();
  for (const m of ["pushState", "replaceState"] as const) {
    const orig = history[m];
    history[m] = function (...args: any[]) {
      const r = orig.apply(this, args as any);
      fire();
      return r;
    };
  }
  addEventListener("popstate", fire);
}
```

On route change: re-filter runtime annotations to `byRoute(currentRoute())`, reset element refs to null, and let the Anchorer re-find them.

---

## 7. Visibility & display state machine (`Starling.ts`)

Three independent controls (PRD §7), composed into a per-sticky resolved view:

```ts
interface ToolState {
  toolVisible: boolean; // demo toggle: false hides ALL tool UI
  markupMode: boolean; // hover-select-create interaction
  showAllMarkup: boolean; // force every sticky expanded
}

// Resolve what a given sticky shows:
function resolveView(
  r: RuntimeAnnotation,
  s: ToolState,
): RuntimeAnnotation["view"] {
  if (!s.toolVisible) return "collapsed"; // (entire layer hidden anyway)
  if (r.view === "editing") return "editing";
  if (s.showAllMarkup) return "pinned";
  return r.view; // 'collapsed' | 'hover' | 'pinned'
}
```

Render gating:

- `toolVisible === false` → the Shadow host gets `display:none`. Nothing renders; app is pristine for demos. Restoring flips it back with prior state intact.
- Default keyboard shortcuts (configurable): `Alt+A` markup mode, `Alt+H` tool visibility, `Alt+S` show-all. Register on `document` with capture, ignore when focus is inside the host's inputs unless inside our shadow.

---

## 8. Interaction flow (markup mode)

Listeners live on `document` in capture phase so they intercept before the app's handlers, and are attached/detached with markup mode (NFR: app untouched when inactive).

```ts
// pointermove (throttled to rAF): highlight the EXACT element under the cursor
function onPointerMove(e: PointerEvent) {
  if (!state.markupMode) return;
  let node = topAppElementAt(e.clientX, e.clientY); // exact element; no component snap
  if (!node) return;
  if (granularity > 0) node = widen(node, granularity); // manual arrow-up only (opt-in)
  const fiber = getFiberFromNode(node); // THIS element's host fiber
  const ctxComponent = nearestComponentFiber(fiber); // context label only
  highlight.show(node.getBoundingClientRect(), labelFor(node, ctxComponent));
  hovered = { node, fiber }; // target = the element itself
}

// arrow-up/down adjusts `granularity`; widen walks the PARENT-ELEMENT chain (never auto).
function widen(node: Element, steps: number): Element {
  let el = node;
  for (let i = 0; i < steps && el.parentElement; i++) el = el.parentElement;
  return el;
}

// click: capture phase, prevent app navigation, create annotation
function onClick(e: MouseEvent) {
  if (!state.markupMode || !hovered) return;
  e.preventDefault();
  e.stopPropagation();
  createAnnotationFrom(hovered.node, hovered.fiber); // node = exact element, fiber = its host fiber
}
```

Notes:

- The overlay/highlight layer is `pointer-events:none`, so `elementFromPoint`/`e.target` returns the underlying **app** element, not our UI.
- `topAppElementAt` ignores nodes inside our Shadow host (guard: `host.contains(node)` → skip).
- Granularity: default is the exact element (`granularity = 0`); annotating a `<div>` annotates that `<div>`. Arrow-up increments it and `widen` re-highlights the parent element; arrow-down decrements. This **never** snaps to a component automatically — `nearestComponentFiber` is used only for the context label. Optionally, an Alt-held modifier can prefer the nearest interactive ancestor (`button`/`a`/`[role]`) when the cursor lands on a leaf text node.
- `labelFor` shows the confirm preview, e.g. `div · Dashboard.tsx:58 (in <Dashboard>)`, so the user sees exactly what they're about to annotate.

`createAnnotationFrom`:

```ts
function createAnnotationFrom(node: Element, fiber: any) {
  const source = resolveSource(node, fiber, opts.projectRoot);
  const ann: Annotation = {
    id: nanoid(),
    note: "",
    source,
    fallbackLocators: buildFallbackLocators(node),
    context: snapshotContext(node),
    session: {
      route: currentRoute(),
      url: location.href,
      viewport: { width: innerWidth, height: innerHeight },
      capturedAt: new Date().toISOString(),
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  store.add(ann);
  openStickyEditor(ann.id); // expanded + focused (PRD §7 lifecycle)
}
```

---

## 9. Sticky lifecycle (PRD §7)

State transitions per sticky:

```
create ──► editing ──(Enter / blur)──► collapsed (badge [n])
collapsed ──(badge hover)──► hover ──(mouseleave)──► collapsed
collapsed ──(badge click)──► pinned ──(click outside)──► collapsed
any ──(showAllMarkup ON)──► pinned (forced)
editing ──(click X)──► deleted
```

Implementation: the badge element owns `mouseenter`/`mouseleave` (→ `hover`) and `click` (→ `pinned`); the sticky body has the textarea (auto-save on `input`, debounced via the store), `Enter` to save+collapse (`Shift+Enter` newline), and an `×` to `store.remove(id)`. Editing/hover/pinned are runtime-only; on reload everything starts `collapsed`.

---

## 10. Shadow-DOM overlay (`ui/`)

```ts
export function createOverlay(): { host: HTMLElement; root: ShadowRoot } {
  const host = document.createElement("div");
  host.id = "starling-root";
  host.style.cssText = "all: initial;"; // isolate from inherited styles
  const root = host.attachShadow({ mode: "open" });
  const style = document.createElement("style");
  style.textContent = STYLES; // scoped to shadow root only
  root.appendChild(style);
  document.body.appendChild(host);
  return { host, root };
}
```

Layering inside the shadow root:

- a **highlight** layer (`pointer-events:none`),
- a **markers** layer holding badges + stickies (`pointer-events:auto` on the widgets themselves),
- a fixed **toolbar** (markup toggle, show-all toggle, demo/hide toggle, "Compile", sidebar toggle),
- a **sidebar** listing all annotations grouped by route with counts and jump/delete (jump = scroll element into view + pin its sticky).

Reposition on every `onUpdated()` from the Anchorer using `position: fixed; transform: translate(x,y)` from each `rect`. Keep the DOM stable and only mutate transforms/coordinates to avoid layout thrash.

---

## 11. Compile (`compile/`)

Pure, deterministic. No LLM call (PRD §3). Produces one Markdown file with a static preamble, grouped by route, with a fenced JSON block per annotation.

````ts
export function compile(session: Session): string {
  const byRoute = groupBy(session.annotations, (a) => a.session.route);
  const sections = Object.entries(byRoute).map(([route, anns]) => {
    const body = anns.map(renderAnnotation).join("\n\n");
    return `## Route: \`${route}\`\n\n${body}`;
  });
  return [
    PREAMBLE,
    `# Starling annotations (${session.annotations.length})`,
    ...sections,
  ].join("\n\n");
}

function renderAnnotation(a: Annotation): string {
  const where = a.source
    ? `${a.source.relativePath}:${a.source.lineNumber}${a.source.componentName ? ` (in <${a.source.componentName}>)` : ""}`
    : `(no source — use fallback locators)`;
  const json = JSON.stringify(
    {
      id: a.id,
      source: a.source,
      fallbackLocators: a.fallbackLocators,
      context: a.context,
      session: a.session,
    },
    null,
    2,
  );
  return [
    `### ${where}`,
    `**Note:** ${a.note || "_(empty)_"}`,
    "```json",
    json,
    "```",
  ].join("\n");
}
````

Download (dev-package): Blob + temporary `<a download>`; extension uses `chrome.downloads` (PRD §14).

```ts
export function download(filename: string, text: string) {
  const url = URL.createObjectURL(new Blob([text], { type: "text/markdown" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
```

### Sample output

````markdown
<!-- STARLING ANNOTATIONS — read me first -->

You are receiving UX feedback captured on a running React prototype. Each entry has a
human NOTE and a machine-readable locator. Two ways to use this file:

1. Update the PRD/FRD: treat each NOTE as a change request for the marked element.
2. Apply in code: open `source.relativePath` at `lineNumber` — that is the exact
   authored location of the element that was marked. `source.componentName` names the
   ENCLOSING component for context, not the edit target. The fallbackLocators
   (Playwright) are for runtime verification when `source` is null (e.g. server-rendered
   DOM) or to disambiguate repeated `.map()` items. Repo-relative paths are openable
   from the project root.

# Starling annotations (2)

## Route: `/checkout`

### src/components/CheckoutForm.tsx:42 (in <CheckoutForm>)

**Note:** Submit button should be primary color and full-width on mobile.

```json
{
  "id": "k3l9...",
  "source": {
    "relativePath": "src/components/CheckoutForm.tsx",
    "lineNumber": 42,
    "columnNumber": 6,
    "componentName": "CheckoutForm",
    "tier": "fiber"
  },
  "fallbackLocators": [
    {
      "strategy": "role",
      "value": "button:Place order",
      "playwright": "page.getByRole(\"button\", { name: \"Place order\" })"
    }
  ],
  "context": {
    "textContent": "Place order",
    "role": "button",
    "rect": { "x": 220, "y": 540, "width": 160, "height": 44 }
  },
  "session": {
    "route": "/checkout",
    "viewport": { "width": 1440, "height": 900 }
  }
}
```
````

````

---

## 12. Host adapter: the mount (`index.ts`)

```ts
import { Starling } from './Starling';
import { LocalStorageBackend } from './store/backends/LocalStorageBackend';

export interface StarlingOptions { projectRoot?: string; shortcuts?: Partial<Shortcuts>; }

export function mountStarling(opts: StarlingOptions = {}) {
  if (typeof window === 'undefined') return;                  // SSR guard (Next)
  // @ts-ignore - both bundlers tree-shake the dead branch in prod
  const isDev = (typeof import.meta !== 'undefined' && (import.meta as any).env?.DEV)
             || process.env.NODE_ENV !== 'production';
  if (!isDev) return;                                          // zero production footprint
  if ((window as any).__STARLING__) return;                   // idempotent across HMR
  (window as any).__STARLING__ = new Starling(new LocalStorageBackend(), opts);
}
````

### Wiring it in (the "one line")

**Vite** — in `src/main.tsx`:

```ts
if (import.meta.env.DEV)
  import("@starling/dev-package").then((m) => m.mountStarling());
```

**Next.js (App Router)** — a tiny client component imported once in `app/layout.tsx`:

```tsx
"use client";
import { useEffect } from "react";
export function Starling() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production")
      import("@starling/dev-package").then((m) => m.mountStarling());
  }, []);
  return null;
}
```

Removal = delete that one import/line. Nothing is bundled into production because of the env guard + dynamic import (PRD §8, §15).

---

## 13. Optional Tier-1 source plugin (recommended for Next App Router)

To recover source for **Server Components** (no client fiber) and to make re-anchoring rock-solid, add a build-time transform that stamps `data-inspector-relative-path/-line/-column` onto JSX host elements. These attributes render server-side and are readable with no fiber — exactly the gap in PRD §11/§12.

- **Vite:** add `react-dev-inspector`'s Vite plugin (or a ~40-line custom `@babel/plugin` using `JSXOpeningElement` + `state.filename`).
- **Next:** use `react-dev-inspector`'s Next integration / SWC plugin.

This stays opt-in and dev-only, so the zero-config default (Tier 0) still works without it; Tier 1 is the upgrade path. (When you build the extension, Tier 1 is what lets it read source from your own dev builds' DOM.)

---

## 14. Edge cases → handling

- **No source (server components / minified):** `resolveSource` returns null → annotation still saved with fallback locators; compile marks "(no source — use fallback locators)". Tier-1 plugin removes most of these.
- **Element-level selection:** the target is exactly the element under the cursor; no walk to the enclosing component. Hovering a button's text label lands on the inner `<span>` — by design; the label preview + manual arrow-up `widen` (and optional Alt modifier) handle it.
- **Repeated elements (`.map()`):** list items share one source line, so `source` pins the JSX but not the instance — fallback locators (text / nth-child / key-derived testid) disambiguate which one.
- **Anonymous components:** `componentName` null → entry shows `file:line` only (still the precise element's line).
- **Transient UI (modals/menus):** on reload the element won't re-find → `detached=true`; the note + last-known `context.rect` persist and still compile. Surface detached items in the sidebar with a warning glyph.
- **Generated ids (`:r3:`):** excluded from locators (`isGeneratedId`).
- **Badge clipping/collision:** clamp into viewport (`badgePosition`) + fan-out on overlap.
- **HMR reload:** `__STARLING__` idempotency + MutationObserver re-anchor; notes never lost (persisted before reload).
- **Our UI vs app events:** Shadow host skipped in `topAppElementAt`; capture-phase listeners detached when markup mode is off.

---

## 15. Testing

- **Unit (Vitest):** `getComponentName`, `isGeneratedId`, `cssPath`, `buildFallbackLocators`, `toRelative`, `resolveView`, `compile` (snapshot the Markdown).
- **Fiber walk:** mount a small React tree in a real browser env and assert `resolveSource` returns the expected `relativePath:line` for known components (Tier 0). Repeat with the Tier-1 plugin enabled to assert attribute reads.
- **Integration (Playwright):** real layout is required for anchoring (jsdom has no layout). Scenarios: create → collapse to badge → hover reveal → pin; scroll/resize keeps anchor; route change filters correctly; reload re-finds; demo toggle hides everything; compile downloads a file containing the note + source path.
- **Matrix:** run integration against both a Vite sample app and a Next (App + Pages) sample app to validate the source/fallback chain and the ≥90% source-coverage criterion (PRD §15).

---

## 16. Build order (milestones)

1. **Skeleton + mount:** package scaffold, `mountStarling` with env/SSR/idempotency guards, Shadow overlay + empty toolbar. Verify zero prod footprint.
2. **Inspector:** fiber walk + Tier-0 source + fallback locators; log the bundle on click. (This de-risks the AI-native spine first.)
3. **Capture + sticky:** markup mode listeners, highlight, create annotation, editable sticky, auto-save to `localStorage`, delete.
4. **Collapse/badge + visibility:** badge `[n]`, hover/pin, show-all, demo hide toggle, shortcuts.
5. **Anchoring + cross-route:** Anchorer (scroll/resize/mutation), route detection + filtering, reload re-find, detached handling.
6. **Sidebar + compile:** sidebar list/jump/delete; deterministic Markdown+JSON exporter with preamble + download.
7. **Tier-1 plugin (optional):** attribute stamping for Next server components and robust re-anchoring.
8. **Hardening:** edge cases (§14), Playwright matrix (§15), docs/README for reuse across codebases.

Then, post-MVP, the extension adapter (PRD §14): reuse `@starling/core`, swap in a `ChromeStorageBackend`, inject the engine into the page's main world, and add the popup UI + `chrome.downloads`.
