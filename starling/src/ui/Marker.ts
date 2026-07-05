import type { RuntimeAnnotation, StickyView } from "../types";
import { badgePosition, stickyPosition, type Point } from "../anchoring/position";
import { Badge } from "./Badge";
import { Sticky } from "./Sticky";

export interface MarkerCallbacks {
  onNoteInput(annId: string, note: string): void;
  onSave(annId: string): void;
  onDelete(annId: string): void;
  /** Badge hover begin — reveal transiently. */
  onBadgeEnter(annId: string): void;
  /** Badge hover end — collapse if it was a transient hover-reveal. */
  onBadgeLeave(annId: string): void;
  /** Badge click — pin open. */
  onBadgeClick(annId: string): void;
  /** Sticky lost focus — collapse (unless show-all forces it open). */
  onStickyBlur(annId: string): void;
  /** Reopen the overlay a detached annotation lives in, via its trigger. */
  onReopen(annId: string): void;
}

/**
 * One annotation's on-screen presence: a count badge + an (optionally shown)
 * sticky. Owns its DOM nodes; the Overlay positions it each anchor pass.
 */
export class Marker {
  readonly badge: Badge;
  readonly sticky: Sticky;
  private annId: string;
  /** When true, both nodes stay hidden regardless of view (detached + read-only). */
  private hidden = false;
  /** When true, the anchored element is scrolled out of view / clipped — hide. */
  private offscreen = false;
  /** View-derived intent from the last update(), re-applied when un-suppressed. */
  private showSticky = false;
  private showBadge = false;

  constructor(runtime: RuntimeAnnotation, cb: MarkerCallbacks) {
    this.annId = runtime.data.id;

    this.badge = new Badge({
      onEnter: () => cb.onBadgeEnter(this.annId),
      onLeave: () => cb.onBadgeLeave(this.annId),
      onClick: () => cb.onBadgeClick(this.annId),
    });

    this.sticky = new Sticky({
      onInput: (note) => cb.onNoteInput(this.annId, note),
      onSave: () => cb.onSave(this.annId),
      onDelete: () => cb.onDelete(this.annId),
      onBlur: () => cb.onStickyBlur(this.annId),
      onReopen: () => cb.onReopen(this.annId),
    });
  }

  /** Render the marker for the given runtime state + resolved view. */
  update(
    runtime: RuntimeAnnotation,
    resolvedView: StickyView,
    badgeCount: number,
    readOnly = false,
  ): void {
    const detached = runtime.detached;
    this.badge.setDetached(detached);
    this.sticky.setDetached(detached);
    // Offer "Reopen" only when the marker is detached AND we know the control
    // that opens its overlay. Read-only snapshots hide detached markers entirely
    // (setHidden), so the affordance never shows there.
    this.sticky.setTrigger(
      detached ? (runtime.data.trigger?.label ?? null) : null,
    );
    this.sticky.setNote(runtime.data.note);
    this.sticky.setWhere(whereLabel(runtime));
    this.sticky.setReadOnly(readOnly);
    this.badge.setCount(badgeCount);

    // Show the sticky for any non-collapsed view.
    this.showSticky = resolvedView !== "collapsed";
    // Keep the badge visible until it's clicked open (pinned/editing). Crucially
    // it stays put through `hover`: the badge is the cursor's hover target, so
    // hiding it mid-hover fires mouseleave → collapse → it reappears → re-hover,
    // flickering between open/closed. It sits just above the sticky (no overlap),
    // so leaving it up during hover is purely additive. Once pinned/editing
    // (opened by a click), it hides so it doesn't sit over the annotated element.
    this.showBadge = resolvedView === "collapsed" || resolvedView === "hover";
    this.applyVisibility();
  }

  /**
   * Suppress both nodes entirely. Used for annotations whose element was deleted
   * while viewing a past snapshot — they're flagged in the list, not the canvas.
   */
  setHidden(hidden: boolean): void {
    if (this.hidden === hidden) return;
    this.hidden = hidden;
    this.applyVisibility();
  }

  /**
   * Toggle off-screen suppression: the anchored element is scrolled out of view
   * or clipped by a scroll container. Both nodes hide (no data is touched) and
   * re-appear at their view-derived state once the element returns to view.
   */
  setOffscreen(offscreen: boolean): void {
    if (this.offscreen === offscreen) return;
    this.offscreen = offscreen;
    this.applyVisibility();
  }

  /** Paint final display = view intent gated by hard-hidden / off-screen. */
  private applyVisibility(): void {
    const suppressed = this.hidden || this.offscreen;
    const showSticky = !suppressed && this.showSticky;
    const showBadge = !suppressed && this.showBadge;
    this.sticky.el.style.display = showSticky ? "" : "none";
    this.badge.el.style.display = showBadge ? "" : "none";
    // setNote() may have run while the sticky was hidden (scrollHeight 0).
    // Re-measure now that it's visible so a restored/multi-line note sizes right.
    if (showSticky) this.sticky.refreshHeight();
  }

  position(rect: DOMRect | null, fallback: Point | null): void {
    if (rect) {
      const bp = badgePosition(rect);
      this.badge.el.style.left = `${bp.left}px`;
      this.badge.el.style.top = `${bp.top}px`;
      const sp = stickyPosition(rect);
      this.sticky.el.style.left = `${sp.left}px`;
      this.sticky.el.style.top = `${sp.top}px`;
    } else if (fallback) {
      // Detached: park at last-known / provided fallback point.
      this.badge.el.style.left = `${fallback.left}px`;
      this.badge.el.style.top = `${fallback.top}px`;
      this.sticky.el.style.left = `${fallback.left}px`;
      this.sticky.el.style.top = `${fallback.top + 22}px`;
    }
  }

  /** Move the badge to an explicit (fanned-out) point. */
  setBadgePoint(p: Point): void {
    this.badge.el.style.left = `${p.left}px`;
    this.badge.el.style.top = `${p.top}px`;
  }

  focusSticky(): void {
    this.sticky.focus();
  }

  stickyContainsFocus(active: Element | null): boolean {
    return this.sticky.containsFocus(active);
  }

  remove(): void {
    this.badge.el.remove();
    this.sticky.el.remove();
  }
}

function whereLabel(r: RuntimeAnnotation): string {
  const s = r.data.source;
  if (s) {
    return `${baseName(s.relativePath)}:${s.lineNumber}${
      s.componentName ? ` · <${s.componentName}>` : ""
    }`;
  }
  const comp = r.data.context.componentName;
  return comp
    ? `${r.data.context.tagName} · <${comp}>`
    : r.data.context.tagName;
}

function baseName(path: string): string {
  const i = Math.max(path.lastIndexOf("/"), path.lastIndexOf("\\"));
  return i >= 0 ? path.slice(i + 1) : path;
}
