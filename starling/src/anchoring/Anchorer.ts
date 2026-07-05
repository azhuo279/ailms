import type { RuntimeAnnotation } from "../types";
import {
  buildFallbackLocators,
  tryLocator,
  findByAnchorKey,
  stampAnchorKey,
  queryUnique,
} from "../inspector/locators";

/**
 * Keeps every visible marker positioned from a live getBoundingClientRect, and
 * re-anchors on any layout-affecting event. This is also the HMR / navigation
 * survival mechanism (PRD §7): after a reload the stored element ref is stale,
 * so we re-find it via its locators.
 */
export class Anchorer {
  private rafId: number | null = null;
  private teardown: Array<() => void> = [];
  private running = false;

  constructor(
    private getRuntime: () => RuntimeAnnotation[],
    private onUpdated: () => void, // triggers UI reposition
  ) {}

  start(): void {
    if (this.running) return;
    this.running = true;

    const schedule = () => {
      if (this.rafId == null) {
        this.rafId = requestAnimationFrame(() => {
          this.rafId = null;
          this.reanchorAll();
        });
      }
    };

    window.addEventListener("scroll", schedule, true); // capture: nested scrollers
    window.addEventListener("resize", schedule);
    const mo = new MutationObserver(schedule); // re-renders + HMR swaps
    mo.observe(document.body, { childList: true, subtree: true });

    this.teardown.push(
      () => window.removeEventListener("scroll", schedule, true),
      () => window.removeEventListener("resize", schedule),
      () => mo.disconnect(),
    );

    schedule();
  }

  /** Force a re-anchor pass now (e.g. right after a route change). */
  refresh(): void {
    this.reanchorAll();
  }

  private reanchorAll(): void {
    for (const r of this.getRuntime()) {
      let el: Element | null = r.el && r.el.isConnected ? r.el : null;
      if (!el) el = this.refind(r); // re-find after reload/navigation
      if (el) {
        r.el = el;
        r.rect = el.getBoundingClientRect();
        r.detached = false;
        // Stamp our unique key on the resolved element so subsequent passes
        // re-find THIS exact element (not a same-type sibling), and so a key
        // recovered via a locator persists with the node across re-renders.
        stampAnchorKey(el, r.data.id);
        // Refresh locators from the element's current shape so a later
        // unmount/remount on the same route can re-anchor even if the
        // surrounding structure shifted since creation time.
        r.liveLocators = buildFallbackLocators(el);
      } else {
        r.el = null;
        r.rect = null;
        r.detached = true; // keep the note; mark detached (PRD §12)
      }
    }
    this.onUpdated();
  }

  /**
   * Re-find priority: unique key → source attribute → freshest locators →
   * creation-time chain. Every tier resolves only when it identifies a SINGLE
   * element; an ambiguous match yields null so the marker stays honestly
   * detached instead of binding to a same-type sibling. `liveLocators`
   * (re-derived on the last successful anchor) track the element's current DOM
   * shape, so they recover same-route remounts the frozen creation-time
   * locators no longer match.
   */
  private refind(r: RuntimeAnnotation): Element | null {
    // 1) Our injected unique key — exact, and only the original element carries
    //    it, so this can never resolve to a sibling.
    const keyed = findByAnchorKey(r.data.id);
    if (keyed) return keyed;

    // 2) Build-time source attribute, but ONLY when it's unique. A list that
    //    renders one component from a single JSX line stamps every item with the
    //    same path+line, so a non-strict match would grab the first item — the
    //    exact wrong-attach we're guarding against.
    const s = r.data.source;
    if (s?.tier === "attribute") {
      const sel = `[data-inspector-relative-path="${cssAttr(s.relativePath)}"][data-inspector-line="${s.lineNumber}"]`;
      const hit = queryUnique(sel);
      if (hit) return hit;
    }
    if (r.liveLocators) {
      for (const loc of r.liveLocators) {
        const el = tryLocator(loc);
        if (el) return el;
      }
    }
    for (const loc of r.data.fallbackLocators) {
      const el = tryLocator(loc);
      if (el) return el;
    }
    return null;
  }

  stop(): void {
    this.teardown.forEach((fn) => fn());
    this.teardown = [];
    if (this.rafId != null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    this.running = false;
  }
}

function cssAttr(s: string): string {
  return s.replace(/["\\]/g, (ch) => `\\${ch}`);
}
