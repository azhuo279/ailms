/**
 * Starling data model.
 *
 * `Annotation` / `Session` are the *persisted* shapes (localStorage, and the
 * compiled artifact). `RuntimeAnnotation` is ephemeral runtime view-state and
 * is never serialized.
 *
 * NOTE on `source`: on React 19+ the fiber source field (`_debugSource`) was
 * removed and React 19.2 strips the `jsxDEV` source object, so zero-config
 * source resolution frequently yields `null`. The whole model treats `source`
 * as *best-effort enrichment* — every feature must work with `source === null`.
 * The `fallbackLocators` are the load-bearing anchor.
 */

export interface SourceLocation {
  /** Repo-relative path, e.g. "src/components/CheckoutForm.tsx". */
  relativePath: string;
  lineNumber: number;
  columnNumber: number | null;
  /** ENCLOSING component name (context only), null for anonymous. */
  componentName: string | null;
  /** How the source was obtained — provenance for debugging coverage. */
  tier: "attribute" | "fiber";
}

export type LocatorStrategy = "testid" | "id" | "role" | "text" | "css";

export interface FallbackLocator {
  strategy: LocatorStrategy;
  /** Selector, or "role:name" for the role strategy. */
  value: string;
  /** Ready-to-paste Playwright expression. */
  playwright: string;
}

/**
 * The control that surfaces a transient overlay (menu, dialog, popover) the
 * annotated element lives inside. When that overlay closes the element leaves
 * the DOM and the marker detaches (Anchorer); the trigger lets a detached
 * marker re-summon the overlay — click the trigger, the overlay remounts, and
 * the existing re-anchor pass recovers the element. Captured only when the
 * annotated element is inside an overlay AND its opener is resolvable; null
 * otherwise (the common case — most elements aren't transient).
 */
export interface TriggerDescriptor {
  /** Locators for the opener control. Same ordered chain as fallbackLocators. */
  locators: FallbackLocator[];
  /** Accessible name of the opener, shown on the reopen affordance (e.g. the avatar button's label). */
  label: string;
}

export interface ElementContext {
  /** Opening tag + truncated content, capped (~400 chars). */
  outerHTMLTrimmed: string;
  /** Trimmed text content, capped (~120 chars). */
  textContent: string;
  role: string | null;
  /** Lowercase tag name of the annotated element, e.g. "button". */
  tagName: string;
  /**
   * Enclosing React component name, resolved from the fiber. Captured here
   * (independent of `source`) because on React 19 it resolves even when source
   * location does not — so labels/output can still say "in <Navbar>".
   */
  componentName: string | null;
  rect: { x: number; y: number; width: number; height: number };
}

export interface SessionContext {
  /** Normalized pathname (see interaction/routing.ts). */
  route: string;
  /** Full href at capture time. */
  url: string;
  viewport: { width: number; height: number };
  /** ISO timestamp. */
  capturedAt: string;
}

export interface Annotation {
  id: string;
  note: string;
  source: SourceLocation | null;
  fallbackLocators: FallbackLocator[];
  /**
   * Opener of the transient overlay this element lives in, when applicable.
   * Lets a detached marker reopen the overlay to re-anchor. Optional/null for
   * the common non-transient case (best-effort enrichment, like `source`).
   */
  trigger?: TriggerDescriptor | null;
  context: ElementContext;
  session: SessionContext;
  createdAt: string;
  updatedAt: string;
}

export interface Session {
  version: 1;
  sessionId: string;
  annotations: Annotation[];
  /**
   * Author of the snapshot, stamped server-side from `git config user.name`
   * when Compile writes the session into `annotations/`. Absent on the live
   * in-memory session (the browser can't read git); present in saved JSON.
   */
  author?: string | null;
  /** ISO timestamp stamped server-side at save time. Absent until saved. */
  savedAt?: string;
}

/**
 * Lightweight metadata for one saved snapshot, returned by the `list` endpoint
 * and rendered in the Rewind sidebar. The heavy `annotations` payload is only
 * fetched on select.
 */
export interface SnapshotMeta {
  /**
   * Stable lookup key passed back to the `load` endpoint. Holds the snapshot's
   * remote row id (historically a `*.starling.json` filename).
   */
  filename: string;
  /** Human-readable label, e.g. "starling-7-annotations-2026-06-10-1432". */
  basename: string;
  annotationCount: number;
  /** ISO timestamp (session.savedAt, else file mtime). */
  savedAt: string;
  version: number | null;
  author: string | null;
}

export type StickyView = "collapsed" | "hover" | "pinned" | "editing";

/** Runtime-only: live element ref + computed view state. Never serialized. */
export interface RuntimeAnnotation {
  data: Annotation;
  el: Element | null;
  rect: DOMRect | null;
  detached: boolean;
  view: StickyView;
  /**
   * Locators re-derived from the live element on each successful anchor. Unlike
   * `data.fallbackLocators` (frozen at creation time) these track the element's
   * current DOM shape, so a same-route unmount/remount can re-anchor even after
   * the surrounding structure shifts. Never serialized.
   */
  liveLocators?: FallbackLocator[];
}

/** The three independent visibility controls (PRD §7). */
export interface ToolState {
  /** Demo toggle: false hides ALL tool UI for a clean screen-share. */
  toolVisible: boolean;
  /** Hover-select-create interaction. */
  markupMode: boolean;
  /** Force every sticky expanded, overriding collapsed/badge default. */
  showAllMarkup: boolean;
}

export interface Shortcuts {
  /** Toggle markup mode on/off. Default: M. */
  toggleMarkup: string;
  /** Toggle tool visibility (demo hide). Default: Alt+H. */
  toggleVisible: string;
  /** Toggle show-all-markup on/off. Default: A. */
  toggleShowAll: string;
  /**
   * Escape (turn OFF) markup mode. Unlike `toggleMarkup` this only ever turns
   * markup off — it's a no-op (and passes through to the host) when markup is
   * already off. Default: Escape.
   */
  escapeMarkup: string;
}

export interface StarlingOptions {
  /**
   * Host-app identifier. Scopes every snapshot (save / Rewind list+load) in the
   * shared remote store, so one database can back many host apps. Sent to the
   * dev endpoints (in the save body, and as `?app=` on list/load). When omitted,
   * snapshots are scoped to the empty-string app.
   */
  appId?: string;
  /**
   * Absolute project root used to make source paths repo-relative. Optional —
   * when omitted, source.ts heuristically trims to the first src/app/pages dir.
   */
  projectRoot?: string;
  /** Keyboard shortcut overrides. */
  shortcuts?: Partial<Shortcuts>;
  /** Override the compiled artifact basename. Default: a dated, count-tagged name. */
  compileFilename?: string;
  /**
   * Dev-server endpoint that writes the compiled artifact into the host project's
   * `annotations/` folder. Compile POSTs `{ basename, markdown, sessionJson }`;
   * the server stamps authorship (`git config user.name`) and `savedAt` into the
   * session and writes BOTH `${basename}.md` and `${basename}.starling.json`. It
   * responds with `{ mdPath, jsonPath, author }` (author = the stamped
   * `git config user.name`, or null when git is unconfigured). There is no
   * browser-download fallback — Compile requires this endpoint. After a
   * successful save the client clears the live session and starts a fresh one.
   * Host-agnostic: the host supplies the route (e.g. a Next dev API route).
   */
  saveEndpoint?: string;
  /**
   * Dev-server endpoint that lists saved snapshots in `annotations/` for Rewind.
   * GET returns `{ snapshots: SnapshotMeta[] }` (newest first). When unset, the
   * Rewind sidebar shows only the live current session.
   */
  listEndpoint?: string;
  /**
   * Dev-server endpoint that loads one snapshot's Session JSON for Rewind.
   * GET `?file=<name>.starling.json` returns the raw Session JSON. Rewind always
   * restores from JSON, never from Markdown.
   */
  loadEndpoint?: string;
  /**
   * Dev-server endpoint that opens a component's source file in the local editor
   * (Cursor by default). Double-clicking an element in markup mode POSTs
   * `{ relativePath, lineNumber, columnNumber }`; the server resolves the path
   * against the project root and launches the editor at that line. Dev-only and
   * best-effort — when unset, or when source location is unavailable (no Tier-1
   * stamping), double-click is a no-op with a toast. Requires source stamping,
   * i.e. running the host with `next dev --webpack`.
   */
  openEndpoint?: string;
}
