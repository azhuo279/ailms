/* eslint-disable @typescript-eslint/no-explicit-any */
import type {
  Annotation,
  Session,
  SnapshotMeta,
  StarlingOptions,
  RuntimeAnnotation,
  Shortcuts,
  SourceLocation,
  StickyView,
  ToolState,
} from "./types";
import { DEFAULT_SHORTCUTS } from "./config";
import type { StorageBackend } from "./store/backends/StorageBackend";
import { SessionStore } from "./store/SessionStore";
import { Anchorer } from "./anchoring/Anchorer";
import { badgePosition, fanOut, type Point } from "./anchoring/position";
import { Overlay } from "./ui/Overlay";
import { Marker } from "./ui/Marker";
import { MarkupController } from "./interaction/markup";
import { currentRoute, onRouteChange } from "./interaction/routing";
import { registerShortcuts, type ShortcutAction } from "./interaction/shortcuts";
import {
  buildFallbackLocators,
  tryLocator,
  stampAnchorKey,
  clearAnchorKey,
} from "./inspector/locators";
import { captureTrigger } from "./inspector/trigger";
import { resolveSource, resolveComponentName } from "./inspector/source";
import { snapshotContext, isElementInView } from "./util/dom";
import { id } from "./util/id";
import { compile } from "./compile/compile";
import { saveSnapshotToEndpoint, openSourceAtEndpoint } from "./compile/download";

/**
 * Resolve what a sticky should show, composing the three visibility controls
 * with the sticky's own runtime view (PRD §7).
 *
 * When `readOnly` (viewing a past snapshot via Rewind), annotations are
 * never editable, but Show-all still forces every note open — exactly like the
 * live session — so a historical session can be read in full at a glance. With
 * Show-all off, read-only is HOVER-ONLY (a note never pins from a click), so its
 * count badge stays on the canvas instead of being swallowed by an open sticky;
 * the note still reveals on hover (or a sidebar jump, which seeds "hover").
 */
export function resolveView(
  view: StickyView,
  s: ToolState,
  readOnly = false,
): StickyView {
  if (!s.toolVisible) return "collapsed"; // layer hidden anyway
  if (readOnly) {
    // Show-all opens every note (read-only); otherwise reveal only on hover.
    if (s.showAllMarkup) return "pinned";
    return view === "collapsed" ? "collapsed" : "hover";
  }
  if (view === "editing") return "editing";
  if (s.showAllMarkup) return "pinned";
  return view; // 'collapsed' | 'hover' | 'pinned'
}

/**
 * The orchestrator. Depends only on injected interfaces (StorageBackend), so
 * swapping the host (dev-package → extension) changes adapters, not this engine.
 */
export class Starling {
  private store: SessionStore;
  private overlay: Overlay;
  private anchorer: Anchorer;
  private markup: MarkupController;
  private shortcuts: Shortcuts;
  private projectRootValue: string | undefined;
  /** Host-app id; scopes save/list/load in the shared remote store. */
  private appId: string | undefined;
  /** User-supplied override; when unset we build a dated default at compile time. */
  private compileFilename: string | undefined;
  /** Dev-server endpoint that writes the artifact into the host project. */
  private saveEndpoint: string | undefined;
  /** Dev-server endpoint listing saved snapshots in annotations/ (Rewind). */
  private listEndpoint: string | undefined;
  /** Dev-server endpoint loading one snapshot's Session JSON (Rewind). */
  private loadEndpoint: string | undefined;
  /** Dev-server endpoint that opens a component's source file in the editor. */
  private openEndpoint: string | undefined;

  private state: ToolState = {
    toolVisible: true,
    markupMode: false,
    showAllMarkup: false,
  };

  /** Runtime annotations for the CURRENT route only. */
  private runtime: RuntimeAnnotation[] = [];
  private markers = new Map<string, Marker>();
  private sidebarOpen = false;
  /** True while a Compile save is in flight — blocks re-entry. */
  private compiling = false;

  // ---- Rewind / active-session state ----------------------------------------
  /**
   * The active session driving the UI. `null` = the live editable store;
   * otherwise the filename of a loaded past snapshot (read-only).
   */
  private currentSessionId: string | null = null;
  /** In-memory loaded past Session when `currentSessionId !== null`. */
  private loadedSession: Session | null = null;
  /** Snapshot metadata from the list endpoint, for the sidebar picker. */
  private snapshots: SnapshotMeta[] = [];

  private teardown: Array<() => void> = [];

  constructor(backend: StorageBackend, opts: StarlingOptions) {
    this.projectRootValue = opts.projectRoot;
    this.appId = opts.appId;
    this.shortcuts = { ...DEFAULT_SHORTCUTS, ...opts.shortcuts };
    this.compileFilename = opts.compileFilename;
    this.saveEndpoint = opts.saveEndpoint;
    this.listEndpoint = opts.listEndpoint;
    this.loadEndpoint = opts.loadEndpoint;
    this.openEndpoint = opts.openEndpoint;

    this.store = new SessionStore(backend);

    this.overlay = new Overlay(
      {
        onToggleMarkup: () => this.setMarkupMode(!this.state.markupMode),
        onToggleShowAll: () => this.setShowAll(!this.state.showAllMarkup),
        onToggleVisible: () => this.setVisible(!this.state.toolVisible),
        onToggleSidebar: () => this.toggleSidebar(),
        onCompile: () => this.compileAndSave(),
        onClearAll: () => this.clearAll(),
      },
      {
        onJump: (annId) => this.jumpTo(annId),
        onDelete: (annId) => this.deleteAnnotation(annId),
        onClose: () => this.toggleSidebar(false),
        onSelectSession: (filename) => this.selectSession(filename),
      },
    );

    this.markup = new MarkupController({
      isMarkupMode: () => this.state.markupMode,
      projectRoot: () => this.projectRootValue,
      highlight: this.overlay.highlight,
      createAnnotation: (node, fiber) => this.createAnnotationFrom(node, fiber),
      openSource: (source) => this.openSourceInEditor(source),
    });

    this.anchorer = new Anchorer(
      () => this.runtime,
      () => this.repositionMarkers(),
    );

    // Wire global listeners.
    const unsubStore = this.store.subscribe(() => this.onStoreChanged());
    const unsubRoute = onRouteChange(() => this.onRouteChanged());
    const unsubKeys = registerShortcuts(this.shortcuts, (a) => this.runShortcut(a));
    const onUnload = () => this.store.flush();
    window.addEventListener("beforeunload", onUnload);

    this.teardown.push(
      unsubStore,
      unsubRoute,
      unsubKeys,
      () => window.removeEventListener("beforeunload", onUnload),
    );

    // Initial render. renderMarkers() is essential here so annotations restored
    // from storage on page load actually paint their badges (not just on the
    // next store/route/view change).
    this.loadRouteRuntime();
    this.anchorer.start();
    this.renderToolbar();
    this.renderMarkers();
    this.renderSidebar();
  }

  // ---- Active session (Rewind) ----------------------------------------------

  /** True when a past snapshot is loaded — the UI is read-only. */
  private get readOnly(): boolean {
    return this.currentSessionId !== null;
  }

  /** The Session whose annotations currently drive the UI (live or loaded). */
  private activeSession(): Session {
    return this.loadedSession ?? this.store.snapshot();
  }

  // ---- Visibility controls --------------------------------------------------

  private setMarkupMode(on: boolean): void {
    this.state.markupMode = on;
    if (on) this.markup.attach();
    else {
      this.markup.detach();
    }
    this.renderToolbar();
  }

  private setShowAll(on: boolean): void {
    this.state.showAllMarkup = on;
    this.renderToolbar();
    this.renderMarkers();
  }

  private setVisible(on: boolean): void {
    this.state.toolVisible = on;
    this.overlay.setVisible(on);
    // When hidden, markup interaction must not fire.
    if (!on && this.state.markupMode) this.markup.detach();
    else if (on && this.state.markupMode) this.markup.attach();
  }

  /**
   * Run a keyboard action. Returns whether it was handled — callers use this to
   * decide whether to swallow the key event. `escapeMarkup` is the only action
   * that can decline (a no-op when markup is already off), so Escape still
   * reaches the host app in that case.
   */
  private runShortcut(action: ShortcutAction): boolean {
    switch (action) {
      case "toggleMarkup":
        // If hidden, re-show first so the user sees the effect.
        if (!this.state.toolVisible) this.setVisible(true);
        this.setMarkupMode(!this.state.markupMode);
        return true;
      case "toggleVisible":
        this.setVisible(!this.state.toolVisible);
        return true;
      case "toggleShowAll":
        if (!this.state.toolVisible) this.setVisible(true);
        this.setShowAll(!this.state.showAllMarkup);
        return true;
      case "escapeMarkup":
        // Only ever turns markup OFF; a no-op (event passes through) otherwise.
        if (!this.state.markupMode) return false;
        this.setMarkupMode(false);
        return true;
    }
  }

  private toggleSidebar(force?: boolean): void {
    this.sidebarOpen = force ?? !this.sidebarOpen;
    this.overlay.sidebar.setOpen(this.sidebarOpen);
    if (this.sidebarOpen) {
      this.renderSidebar();
      // Refresh the snapshot list when the sidebar opens so the Rewind picker
      // reflects any newly-compiled files. Async; re-renders on completion.
      void this.refreshSnapshots();
    }
  }

  // ---- Rewind: list / select / return ---------------------------------------

  /**
   * Append the host `appId` scope to an endpoint URL so save/list/load all read
   * and write the same app's snapshots. No-op when `appId` is unset.
   */
  private appQuery(url: string): string {
    if (!this.appId) return url;
    const sep = url.includes("?") ? "&" : "?";
    return `${url}${sep}app=${encodeURIComponent(this.appId)}`;
  }

  /** Fetch saved-snapshot metadata from the list endpoint. Degrades to []. */
  private async refreshSnapshots(): Promise<void> {
    if (!this.listEndpoint) {
      this.snapshots = [];
      return;
    }
    try {
      const res = await fetch(this.appQuery(this.listEndpoint));
      if (!res.ok) {
        this.snapshots = [];
      } else {
        const data = (await res.json().catch(() => null)) as
          | { snapshots?: SnapshotMeta[] }
          | null;
        this.snapshots = Array.isArray(data?.snapshots) ? data!.snapshots : [];
      }
    } catch {
      this.snapshots = []; // server-less / unreachable: only the live session shows
    }
    this.renderSidebar();
  }

  /**
   * Swap the active session. `null` returns to the live editable store; otherwise
   * loads a past snapshot (read-only) and re-anchors its stickies onto the build.
   * Always restores from the JSON sidecar — Markdown is never parsed.
   */
  private async selectSession(filename: string | null): Promise<void> {
    if (filename === null) return this.returnToLive();
    if (filename === this.currentSessionId) return; // already active
    if (!this.loadEndpoint) {
      this.overlay.toast.show("Loading snapshots isn't configured", "error");
      return;
    }

    let session: Session | null = null;
    try {
      const res = await fetch(
        this.appQuery(`${this.loadEndpoint}?file=${encodeURIComponent(filename)}`),
      );
      if (res.ok) session = (await res.json().catch(() => null)) as Session | null;
    } catch {
      /* fall through to the error toast below */
    }
    if (!session) {
      this.overlay.toast.show("Couldn't load snapshot", "error");
      return;
    }
    if (session.version !== 1 || !Array.isArray(session.annotations)) {
      this.overlay.toast.show("Snapshot version not supported", "error");
      return;
    }

    // Commit/discard any open live edit before leaving the editable session.
    this.flushPendingEdit();

    this.currentSessionId = filename;
    this.loadedSession = session;

    this.loadRouteRuntime();
    this.anchorer.refresh(); // sets detached via the existing re-find chain
    this.renderToolbar();
    this.renderMarkers();
    this.renderSidebar();
    this.overlay.toast.show("Rewound — read-only", "success");
  }

  /** Return to the live, editable current session. */
  private returnToLive(): void {
    if (this.currentSessionId === null) return;
    this.currentSessionId = null;
    this.loadedSession = null;

    this.loadRouteRuntime();
    this.anchorer.refresh();
    this.renderToolbar();
    this.renderMarkers();
    this.renderSidebar();
    this.overlay.toast.show("Back to current session", "success");
  }

  /**
   * Before swapping sessions, settle any sticky that's mid-edit in the live
   * session: discard it if blank, else collapse + flush so the note persists.
   * No-op when already read-only (no editable sticky exists).
   */
  private flushPendingEdit(): void {
    if (this.readOnly) return;
    const editing = this.runtime.find((r) => r.view === "editing");
    if (editing) {
      if (!this.discardIfEmpty(editing.data.id)) {
        editing.view = "collapsed";
      }
    }
    this.store.flush();
  }

  // ---- Annotation lifecycle -------------------------------------------------

  private createAnnotationFrom(node: Element, fiber: any): void {
    // Read-only gate: past sessions can't be marked up. This is the single
    // creation point all markup-mode clicks funnel through.
    if (this.readOnly) {
      this.overlay.toast.show("Switch to current session to add annotations", "error");
      return;
    }
    const source = resolveSource(node, fiber, this.projectRootValue);
    // Resolve the enclosing component independently of source — on React 19 the
    // component name resolves from the fiber even when source location does not.
    const componentName = source?.componentName ?? resolveComponentName(fiber);
    const now = new Date().toISOString();
    const ann: Annotation = {
      id: id(),
      note: "",
      source,
      fallbackLocators: buildFallbackLocators(node),
      // Best-effort: if this element lives in a transient overlay, remember the
      // control that opened it so a detached marker can re-summon it.
      trigger: captureTrigger(node),
      context: snapshotContext(node, componentName),
      session: {
        route: currentRoute(),
        url: location.href,
        viewport: { width: window.innerWidth, height: window.innerHeight },
        capturedAt: now,
      },
      createdAt: now,
      updatedAt: now,
    };
    // store.add() synchronously fires onStoreChanged → syncRuntimeWithStore,
    // which already inserts a runtime entry for this annotation. We must NOT
    // push our own (that double-counts the badge). Instead, find that entry and
    // seed its live element + open its editor focused.
    this.store.add(ann);
    const rt = this.runtime.find((r) => r.data.id === ann.id);
    if (rt) {
      rt.el = node;
      rt.rect = node.getBoundingClientRect();
      rt.view = "editing";
      // Stamp the unique key now so a later disappearance/re-render re-finds
      // THIS element, never a same-type sibling.
      stampAnchorKey(node, ann.id);
      this.renderMarkers();
      this.markers.get(ann.id)?.focusSticky();
    } else {
      // The store add didn't surface a runtime entry — the sticky can't open.
      this.overlay.toast.show("Couldn't add annotation", "error");
    }
  }

  /**
   * Open the double-clicked element's source file in the local editor via the
   * dev-server `openEndpoint`. Best-effort and toast-only: a missing source
   * (no Tier-1 stamping — e.g. running under Turbopack instead of
   * `next dev --webpack`), an unconfigured endpoint, or a failed launch each
   * surface a toast rather than throwing. Allowed in read-only (Rewind) sessions
   * since it only reads the live DOM's source location, never mutates anything.
   */
  private openSourceInEditor(source: SourceLocation | null): void {
    if (!source) {
      this.overlay.toast.show(
        "No source location — run the app with next dev --webpack",
        "error",
      );
      return;
    }
    if (!this.openEndpoint) {
      this.overlay.toast.show("Opening in editor isn't configured", "error");
      return;
    }
    void openSourceAtEndpoint(this.openEndpoint, {
      relativePath: source.relativePath,
      lineNumber: source.lineNumber,
      columnNumber: source.columnNumber,
    }).then((ok) => {
      if (!ok) this.overlay.toast.show("Couldn't open in editor", "error");
    });
  }

  private deleteAnnotation(annId: string): void {
    // Strip our injected key off the element so a stale token can't linger on
    // the host DOM after the annotation is gone.
    const rt = this.runtime.find((r) => r.data.id === annId);
    if (rt?.el) clearAnchorKey(rt.el, annId);
    this.store.remove(annId);
    // store change → onStoreChanged → re-syncs runtime
  }

  // ---- Store / route reactions ----------------------------------------------

  private onStoreChanged(): void {
    // While a past snapshot is active the live store must not repaint the
    // canvas — only refresh the count/list. (We never mutate the store when
    // read-only, so this guards against stray debounced events.)
    if (this.readOnly) {
      this.renderToolbar();
      this.renderSidebar();
      return;
    }
    this.syncRuntimeWithActive();
    this.renderToolbar();
    this.renderMarkers();
    this.renderSidebar();
  }

  private onRouteChanged(): void {
    this.loadRouteRuntime();
    this.anchorer.refresh();
    this.renderMarkers();
    this.renderSidebar();
  }

  /** (Re)build the runtime list for the current route from the active session. */
  private loadRouteRuntime(): void {
    const route = currentRoute();
    const existing = new Map(this.runtime.map((r) => [r.data.id, r]));
    this.runtime = this.annotationsForRoute(route).map((data) => {
      const prev = existing.get(data.id);
      if (prev) {
        prev.data = data; // refresh data, keep el/rect/view
        return prev;
      }
      return this.toRuntime(data);
    });
  }

  /** Annotations on `route` from whichever session is active (live or loaded). */
  private annotationsForRoute(route: string): Annotation[] {
    return this.activeSession().annotations.filter((a) => a.session.route === route);
  }

  /** Reconcile runtime with the active session after add/update/remove on this route. */
  private syncRuntimeWithActive(): void {
    const route = currentRoute();
    const onRoute = this.annotationsForRoute(route);
    const byId = new Map(this.runtime.map((r) => [r.data.id, r]));
    const next: RuntimeAnnotation[] = [];
    for (const data of onRoute) {
      const prev = byId.get(data.id);
      if (prev) {
        prev.data = data;
        next.push(prev);
      } else {
        next.push(this.toRuntime(data));
      }
    }
    this.runtime = next;
  }

  private toRuntime(data: Annotation): RuntimeAnnotation {
    return { data, el: null, rect: null, detached: false, view: "collapsed" };
  }

  // ---- Rendering ------------------------------------------------------------

  private renderToolbar(): void {
    this.overlay.toolbar.setState(this.state);
    this.overlay.toolbar.setCount(this.activeSession().annotations.length);
    // A loaded past snapshot is read-only — Compile saves the live session only.
    this.overlay.toolbar.setReadOnly(this.readOnly);
  }

  private renderSidebar(): void {
    if (!this.sidebarOpen) return;
    const detached = new Set(
      this.runtime.filter((r) => r.detached).map((r) => r.data.id),
    );
    this.overlay.sidebar.render({
      liveAnnotations: this.store.all(),
      snapshots: this.snapshots,
      activeFilename: this.currentSessionId,
      loadedAnnotations: this.loadedSession?.annotations ?? null,
      currentRoute: currentRoute(),
      detachedIds: detached,
    });
  }

  /** Build/refresh marker DOM to match the current runtime set. */
  private renderMarkers(): void {
    const root = this.overlay.markersRoot;
    const live = new Set(this.runtime.map((r) => r.data.id));

    // Remove markers no longer present.
    for (const [annId, marker] of this.markers) {
      if (!live.has(annId)) {
        marker.remove();
        this.markers.delete(annId);
      }
    }

    // Create / update markers.
    for (const rt of this.runtime) {
      let marker = this.markers.get(rt.data.id);
      if (!marker) {
        marker = new Marker(rt, {
          onNoteInput: (annId, note) => this.store.update(annId, { note }),
          onSave: (annId) => this.saveAndCollapse(annId),
          onDelete: (annId) => this.deleteAnnotation(annId),
          onBadgeEnter: (annId) => this.setView(annId, "hover"),
          onBadgeLeave: (annId) => this.onBadgeLeave(annId),
          onBadgeClick: (annId) => this.togglePin(annId),
          onStickyBlur: (annId) => this.onStickyBlur(annId),
          onReopen: (annId) => this.reopenTrigger(annId),
        });
        root.append(marker.badge.el, marker.sticky.el);
        this.markers.set(rt.data.id, marker);
      }
      const resolved = resolveView(rt.view, this.state, this.readOnly);
      const count = this.badgeCountFor(rt);
      marker.update(rt, resolved, count, this.readOnly);
      // In a loaded read-only session, an annotation whose element was deleted
      // must NOT draw on the canvas (it's flagged in the list instead). In the
      // live session, detached badges stay parked at their last-known point.
      marker.setHidden(rt.detached && this.readOnly);
    }

    this.repositionMarkers();
  }

  /**
   * Multiple stickies can target the same element. The badge shows the count;
   * we render one badge per annotation but label each with the group count.
   */
  private badgeCountFor(rt: RuntimeAnnotation): number {
    // Group by anchor identity: same source line, else same first locator.
    const key = anchorKey(rt);
    return this.runtime.filter((r) => anchorKey(r) === key).length;
  }

  private repositionMarkers(): void {
    // Position each marker from its live rect, then fan out colliding badges.
    const points: Array<{ rt: RuntimeAnnotation; marker: Marker; pt: Point | null }> =
      [];
    for (const rt of this.runtime) {
      const marker = this.markers.get(rt.data.id);
      if (!marker) continue;
      marker.position(rt.rect, rt.detached ? lastKnownPoint(rt) : null);
      // Hide a marker whose anchored element is scrolled out of view or clipped
      // by a scroll container, so its badge doesn't clamp to the viewport edge
      // and float over unrelated content. The annotation is untouched and
      // reappears when the element returns to view. Detached (unmounted) markers
      // keep their parked + Reopen behavior and are excluded here.
      marker.setOffscreen(!rt.detached && !!rt.el && !isElementInView(rt.el));
      const rect = rt.rect;
      points.push({
        rt,
        marker,
        pt: rect
          ? badgePosition(rect)
          : rt.detached
            ? lastKnownPoint(rt)
            : null,
      });
    }
    const fanned = fanOut(points.map((p) => p.pt ?? { left: -9999, top: -9999 }));
    points.forEach((p, i) => {
      const fp = fanned[i];
      if (p.pt && fp) p.marker.setBadgePoint(fp);
    });

    this.syncEditingHighlight();
  }

  /**
   * Keep the highlight box pinned on the element whose note is being written, so
   * it stays visible until the note is saved or deleted. Tracks scroll/resize
   * because this runs on every anchor pass. Cleared when nothing is editing.
   */
  private syncEditingHighlight(): void {
    const editing = this.runtime.find((r) => r.view === "editing" && r.rect);
    if (editing && editing.rect) {
      this.overlay.highlight.pin(editing.rect);
    } else if (this.overlay.highlight.isPinned()) {
      this.overlay.highlight.unpin();
    }
  }

  // ---- View transitions -----------------------------------------------------

  private setView(annId: string, view: StickyView): void {
    const rt = this.runtime.find((r) => r.data.id === annId);
    if (!rt) return;
    rt.view = view;
    this.renderMarkers();
  }

  /**
   * Explicit save (Enter). Collapses the sticky and confirms with a toast when
   * the note actually persisted; a blank note is silently discarded (no toast)
   * since nothing was added. Distinct from a blur-collapse, which never toasts.
   */
  private saveAndCollapse(annId: string): void {
    if (this.discardIfEmpty(annId)) return;
    this.setView(annId, "collapsed");
    this.overlay.toast.show("Annotation added", "success");
  }

  /**
   * Remove an annotation whose note is blank (empty or only whitespace).
   * Returns true when it was discarded, so callers can skip a follow-up
   * collapse. Used when editing ends (save / blur) so empty stickies never
   * reach storage or the compiled artifact.
   */
  private discardIfEmpty(annId: string): boolean {
    const note = this.store.get(annId)?.note ?? "";
    if (note.trim() !== "") return false;
    this.deleteAnnotation(annId);
    return true;
  }

  private onBadgeLeave(annId: string): void {
    const rt = this.runtime.find((r) => r.data.id === annId);
    if (!rt) return;
    // Only collapse if it was a transient hover (not pinned/editing).
    if (rt.view === "hover") this.setView(annId, "collapsed");
  }

  private togglePin(annId: string): void {
    const rt = this.runtime.find((r) => r.data.id === annId);
    if (!rt) return;
    this.setView(annId, rt.view === "pinned" ? "collapsed" : "pinned");
  }

  private onStickyBlur(annId: string): void {
    // Defer so a click moving focus within our sticky doesn't collapse it.
    setTimeout(() => {
      const active = this.overlay.activeElement();
      const marker = this.markers.get(annId);
      if (marker && marker.stickyContainsFocus(active)) return;
      const rt = this.runtime.find((r) => r.data.id === annId);
      if (rt && (rt.view === "editing" || rt.view === "hover")) {
        // Blurring away from a blank note discards it rather than persisting
        // an empty sticky.
        if (this.discardIfEmpty(annId)) return;
        this.setView(annId, "collapsed");
      }
    }, 0);
  }

  /**
   * Re-summon the overlay a detached annotation lives in by clicking its
   * captured trigger (e.g. the avatar button that opens the persona menu). The
   * overlay remounts, the MutationObserver fires, and the Anchorer's existing
   * re-find chain re-attaches the marker — no special-casing needed here beyond
   * a follow-up refresh in case the mount lands between observer batches.
   */
  private reopenTrigger(annId: string): void {
    if (!this.state.toolVisible) this.setVisible(true);
    const rt = this.runtime.find((r) => r.data.id === annId);
    const trigger = rt?.data.trigger;
    if (!trigger) return;

    let el: Element | null = null;
    for (const loc of trigger.locators) {
      el = tryLocator(loc);
      if (el) break;
    }
    if (!el) {
      this.overlay.toast.show("Couldn't find the control that opens this", "error");
      return;
    }

    (el as HTMLElement).click?.();
    // The overlay may mount asynchronously; nudge a re-anchor on the next frame
    // (the MutationObserver also covers this, but this guarantees a pass).
    requestAnimationFrame(() => {
      this.anchorer.refresh();
      // Pin the sticky open so the reattached note is visible immediately.
      const after = this.runtime.find((r) => r.data.id === annId);
      if (after && !after.detached) this.setView(annId, "pinned");
    });
  }

  private jumpTo(annId: string): void {
    if (!this.state.toolVisible) this.setVisible(true);
    const rt = this.runtime.find((r) => r.data.id === annId);
    if (rt?.el) {
      rt.el.scrollIntoView({ behavior: "smooth", block: "center" });
    }
    this.setView(annId, "pinned");
  }

  // ---- Compile --------------------------------------------------------------

  /**
   * Compile the active session and persist it to the shared remote store (both
   * the Markdown and the canonical Session JSON) via the save endpoint. There is
   * no browser-download path: Compile requires a save endpoint, which also stamps
   * authorship server-side and scopes the snapshot by `appId`. The JSON is the
   * round-trippable source of truth for Rewind, and the save propagates to other
   * users with no git push/pull.
   */
  private compileAndSave(): void {
    if (!this.saveEndpoint) {
      this.overlay.toast.show("Saving isn't configured", "error");
      return;
    }
    // Compile only ever saves the live session. While a past snapshot is loaded
    // the UI is read-only and the toolbar button is disabled; guard the engine
    // independently so no stray entry point can re-save a historical session.
    if (this.readOnly) {
      this.overlay.toast.show("Switch to the current session to compile", "error");
      return;
    }
    // Already pushing the last batch — ignore re-entrant clicks. The button is
    // disabled while compiling too, but guard the engine independently.
    if (this.compiling) return;
    this.compiling = true;
    this.overlay.toolbar.setCompiling(true);
    this.store.pruneEmpty();
    this.store.flush();
    const session = this.activeSession();
    const md = compile(session);
    const sessionJson = JSON.stringify(session);
    const basename =
      stripExt(this.compileFilename) ??
      defaultCompileBasename(session.annotations.length);

    saveSnapshotToEndpoint(
      this.saveEndpoint,
      this.appId ?? "",
      basename,
      md,
      sessionJson,
    ).then(
      (result) => {
        if (result == null) {
          this.overlay.toast.show(
            "Couldn't save — is the dev server running?",
            "error",
          );
          return;
        }
        const by = result.author ? ` by ${result.author}` : "";
        this.overlay.toast.show(`Saved${by}`, "success");
        // The batch now lives on disk. Start a fresh local session: clear the
        // annotations from the UI and rotate the sessionId so subsequent work is
        // a distinct session. (Only the live session can reach here — read-only
        // is rejected up front.)
        this.store.reset();
        // A new snapshot now exists on disk; refresh the Rewind list.
        void this.refreshSnapshots();
      },
    ).finally(() => {
      // DB operation complete (success or failure): release the button.
      this.compiling = false;
      this.overlay.toolbar.setCompiling(false);
    });
  }

  /**
   * Wipe every annotation across all routes. Destructive, so it confirms
   * first. The store change cascades through onStoreChanged → re-sync runtime,
   * clearing markers and refreshing the count.
   */
  private clearAll(): void {
    // Clear acts on the live store only; refuse while viewing a past snapshot.
    if (this.readOnly) {
      this.overlay.toast.show("Switch to current session to clear", "error");
      return;
    }
    const total = this.store.all().length;
    if (total === 0) return;
    const noun = total === 1 ? "annotation" : "annotations";
    if (!window.confirm(`Delete all ${total} ${noun}? This can't be undone.`)) {
      return;
    }
    this.store.clear();
  }

  // ---- Teardown -------------------------------------------------------------

  destroy(): void {
    this.store.flush();
    this.markup.detach();
    this.anchorer.stop();
    this.teardown.forEach((fn) => fn());
    this.teardown = [];
    this.markers.forEach((m) => m.remove());
    this.markers.clear();
    this.overlay.destroy();
  }
}

/** A stable-ish key identifying the anchored element, for badge counts. */
function anchorKey(rt: RuntimeAnnotation): string {
  const s = rt.data.source;
  if (s) return `src:${s.relativePath}:${s.lineNumber}:${s.columnNumber ?? ""}`;
  const first = rt.data.fallbackLocators[0];
  return first ? `loc:${first.strategy}:${first.value}` : `id:${rt.data.id}`;
}

function lastKnownPoint(rt: RuntimeAnnotation): Point {
  const r = rt.data.context.rect;
  return { left: Math.max(r.x + r.width - 12, 8), top: Math.max(r.y - 6, 8) };
}

/**
 * Human-readable default basename (no extension), distinguishable within the same
 * day. Includes the annotation count plus date + hour-minute, e.g.
 *   `starling-7-annotations-2026-06-10-1432`.
 * The server appends `.md` and `.starling.json`.
 */
function defaultCompileBasename(count: number): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  const date = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const time = `${pad(d.getHours())}${pad(d.getMinutes())}`;
  const noun = count === 1 ? "annotation" : "annotations";
  return `starling-${count}-${noun}-${date}-${time}`;
}

/** Strip a known artifact extension from a user-supplied compile name. */
function stripExt(name: string | undefined): string | undefined {
  if (!name) return undefined;
  return name.replace(/\.(md|starling\.json)$/i, "");
}
