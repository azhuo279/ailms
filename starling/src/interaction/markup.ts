/* eslint-disable @typescript-eslint/no-explicit-any */
import { getFiberFromNode } from "../inspector/fiber";
import { resolveSource, resolveComponentName } from "../inspector/source";
import { topAppElementAt } from "../util/dom";
import type { Highlight } from "../ui/Highlight";
import type { SourceLocation } from "../types";

export interface MarkupHost {
  isMarkupMode(): boolean;
  projectRoot(): string | undefined;
  highlight: Highlight;
  /** Called on click — create an annotation for the targeted element. */
  createAnnotation(node: Element, fiber: any): void;
  /** Called on double-click — open the targeted element's source in the editor. */
  openSource(source: SourceLocation | null): void;
}

/**
 * A single click in markup mode normally annotates; a double-click opens source.
 * We hold the annotate action this long so a second click can cancel it and route
 * to "open source" instead. Roughly the browser's own dblclick window.
 */
const DOUBLE_CLICK_MS = 250;

interface Hovered {
  node: Element;
  fiber: any;
}

/**
 * Markup-mode interaction: hover-highlight the EXACT element under the cursor
 * (no automatic component snap), arrow-up/down to widen along the PARENT chain
 * (opt-in), capture-phase click to create.
 *
 * Listeners are on `document` in the capture phase so they intercept before the
 * app's own handlers, and are attached/detached with markup mode so the app is
 * untouched when inactive (NFR).
 */
export class MarkupController {
  private hovered: Hovered | null = null;
  private granularity = 0; // 0 = exact element; arrow-up widens to parents
  private baseNode: Element | null = null; // element under cursor pre-widen
  private rafPending = false;
  private lastX = 0;
  private lastY = 0;
  private active = false;
  // True while we replay a synthetic plain click (Alt-bypass), so our own
  // capture-phase handler lets that event through to the app instead of
  // re-processing it.
  private replayingClick = false;
  // Pending single-click annotate, deferred so a double-click can cancel it.
  private pendingAnnotate: ReturnType<typeof setTimeout> | null = null;
  private teardown: Array<() => void> = [];

  constructor(private host: MarkupHost) {}

  attach(): void {
    if (this.active) return;
    this.active = true;
    const move = (e: PointerEvent) => this.onPointerMove(e);
    const click = (e: MouseEvent) => this.onClick(e);
    const dblclick = (e: MouseEvent) => this.onDoubleClick(e);
    const key = (e: KeyboardEvent) => this.onKeyDown(e);

    document.addEventListener("pointermove", move, true);
    document.addEventListener("click", click, true);
    document.addEventListener("dblclick", dblclick, true);
    document.addEventListener("keydown", key, true);

    this.teardown.push(
      () => document.removeEventListener("pointermove", move, true),
      () => document.removeEventListener("click", click, true),
      () => document.removeEventListener("dblclick", dblclick, true),
      () => document.removeEventListener("keydown", key, true),
    );
  }

  detach(): void {
    this.teardown.forEach((fn) => fn());
    this.teardown = [];
    this.cancelPendingAnnotate();
    this.hovered = null;
    this.baseNode = null;
    this.granularity = 0;
    this.host.highlight.hide();
    this.active = false;
  }

  private cancelPendingAnnotate(): void {
    if (this.pendingAnnotate != null) {
      clearTimeout(this.pendingAnnotate);
      this.pendingAnnotate = null;
    }
  }

  private onPointerMove(e: PointerEvent): void {
    if (!this.host.isMarkupMode()) return;
    this.lastX = e.clientX;
    this.lastY = e.clientY;
    this.granularity = 0; // moving the cursor resets the widen level
    if (this.rafPending) return;
    this.rafPending = true;
    requestAnimationFrame(() => {
      this.rafPending = false;
      this.recompute();
    });
  }

  private recompute(): void {
    const base = topAppElementAt(this.lastX, this.lastY);
    if (!base) {
      this.hovered = null;
      this.baseNode = null;
      this.host.highlight.hide();
      return;
    }
    this.baseNode = base;
    this.applyTarget(widen(base, this.granularity));
  }

  private applyTarget(node: Element): void {
    const fiber = getFiberFromNode(node);
    const source = resolveSource(node, fiber, this.host.projectRoot());
    const component = source?.componentName ?? resolveComponentName(fiber);
    this.host.highlight.show(node.getBoundingClientRect(), {
      tag: node.tagName.toLowerCase(),
      source: source ? `${baseName(source.relativePath)}:${source.lineNumber}` : null,
      component,
    });
    this.hovered = { node, fiber };
  }

  private onKeyDown(e: KeyboardEvent): void {
    if (!this.host.isMarkupMode() || !this.baseNode) return;
    if (e.key === "ArrowUp") {
      e.preventDefault();
      this.granularity++;
      this.applyTarget(widen(this.baseNode, this.granularity));
    } else if (e.key === "ArrowDown") {
      if (this.granularity === 0) return;
      e.preventDefault();
      this.granularity--;
      this.applyTarget(widen(this.baseNode, this.granularity));
    }
  }

  private onClick(e: MouseEvent): void {
    // Let a replayed synthetic click (see Alt-bypass below) pass straight
    // through to the app without being re-processed as a markup click.
    if (this.replayingClick) return;
    if (!this.host.isMarkupMode() || !this.hovered) return;
    // Alt-click bypasses markup: simulate an ordinary click on the element
    // (e.g. following a link, pressing a button) without annotating. We can't
    // just let the original event through — the browser treats Alt-click as a
    // "save target" gesture and downloads the element/link. So we cancel the
    // original Alt event and replay a fresh plain (no-modifier) click on the
    // same target instead. Alt is preferred over Cmd/Ctrl because Cmd-click on
    // a link opens a new browser tab.
    if (e.altKey) {
      e.preventDefault();
      e.stopPropagation();
      this.replayPlainClick(e);
      return;
    }
    e.preventDefault();
    e.stopPropagation();
    // Defer creating the annotation: a double-click (open source) fires a second
    // click right after, which cancels this timer in onDoubleClick. A genuine
    // single click falls through and annotates once the window elapses. Snapshot
    // the target now so a later pointer move can't retarget it.
    const { node, fiber } = this.hovered;
    this.cancelPendingAnnotate();
    this.pendingAnnotate = setTimeout(() => {
      this.pendingAnnotate = null;
      this.host.createAnnotation(node, fiber);
    }, DOUBLE_CLICK_MS);
  }

  private onDoubleClick(e: MouseEvent): void {
    if (this.replayingClick) return;
    if (!this.host.isMarkupMode() || !this.hovered) return;
    if (e.altKey) return; // Alt is the click-through bypass; never opens source.
    e.preventDefault();
    e.stopPropagation();
    // Cancel the annotate the two clicks would otherwise have queued.
    this.cancelPendingAnnotate();
    const { node, fiber } = this.hovered;
    const source = resolveSource(node, fiber, this.host.projectRoot());
    this.host.openSource(source);
  }

  /**
   * Dispatch a plain (no-modifier) click on the element actually under the
   * cursor, mirroring the original event's coordinates/button so the app's own
   * handlers react exactly as for a normal user click.
   */
  private replayPlainClick(src: MouseEvent): void {
    const target =
      (document.elementFromPoint(src.clientX, src.clientY) as Element | null) ??
      (src.target as Element | null);
    if (!target) return;
    const replay = new MouseEvent("click", {
      bubbles: true,
      cancelable: true,
      clientX: src.clientX,
      clientY: src.clientY,
      button: src.button,
      buttons: src.buttons,
      // Explicitly strip every modifier so this reads as an ordinary click.
      altKey: false,
      ctrlKey: false,
      metaKey: false,
      shiftKey: false,
    });
    this.replayingClick = true;
    try {
      target.dispatchEvent(replay);
    } finally {
      this.replayingClick = false;
    }
  }
}

/** Walk up the PARENT-ELEMENT chain (never snaps to a component). */
export function widen(node: Element, steps: number): Element {
  let el = node;
  for (let i = 0; i < steps && el.parentElement; i++) el = el.parentElement;
  return el;
}

function baseName(path: string): string {
  const i = Math.max(path.lastIndexOf("/"), path.lastIndexOf("\\"));
  return i >= 0 ? path.slice(i + 1) : path;
}
