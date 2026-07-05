/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { MarkupController, type MarkupHost } from "../../src/interaction/markup";

/**
 * Alt-click bypass: instead of letting the original Alt-click through (which the
 * browser treats as "save target", downloading the element), the controller
 * cancels it and replays a plain no-modifier click so the app reacts like a
 * normal click. These tests pin that contract.
 */
describe("MarkupController Alt-click bypass", () => {
  let target: HTMLButtonElement;
  let host: MarkupHost;
  let controller: MarkupController;
  let created: Array<{ node: Element }>;
  let opened: Array<unknown>;

  beforeEach(() => {
    // A button stands in for any clickable app element. (We avoid a real <a
    // href> so the replayed click doesn't trigger jsdom's unimplemented
    // navigation — the point under test is that the click reaches the app.)
    target = document.createElement("button");
    target.type = "button";
    target.textContent = "click me";
    document.body.appendChild(target);

    // elementFromPoint has no layout under jsdom (and may be undefined) — define
    // it so the controller's hover recompute resolves to our target.
    (document as any).elementFromPoint = () => target;

    created = [];
    opened = [];
    host = {
      isMarkupMode: () => true,
      projectRoot: () => undefined,
      highlight: { show: vi.fn(), hide: vi.fn() } as any,
      createAnnotation: (node: Element) => created.push({ node }),
      openSource: (source) => opened.push(source),
    };

    controller = new MarkupController(host);
    controller.attach();

    // Seed the hover target the way a pointermove would. jsdom has no
    // PointerEvent; the handler only reads clientX/Y, so a MouseEvent of type
    // "pointermove" is sufficient. The move schedules a rAF (flushed per test).
    document.dispatchEvent(
      new MouseEvent("pointermove", { clientX: 5, clientY: 5 }),
    );
  });

  afterEach(() => {
    controller.detach();
    target.remove();
    vi.restoreAllMocks();
  });

  it("replays a plain click and never annotates on Alt-click", async () => {
    await flushRaf();

    const appClicks: MouseEvent[] = [];
    target.addEventListener("click", (e) => appClicks.push(e as MouseEvent));

    const altClick = new MouseEvent("click", {
      bubbles: true,
      cancelable: true,
      altKey: true,
      clientX: 5,
      clientY: 5,
    });
    target.dispatchEvent(altClick);

    // Original Alt event is canceled (kills the browser's save-target download).
    expect(altClick.defaultPrevented).toBe(true);
    // No annotation was created.
    expect(created).toHaveLength(0);
    // The app received exactly one synthetic, modifier-free click.
    expect(appClicks).toHaveLength(1);
    const replayed = appClicks[0]!;
    expect(replayed.altKey).toBe(false);
    expect(replayed.metaKey).toBe(false);
    expect(replayed.ctrlKey).toBe(false);
  });

  it("creates an annotation on a plain (no-modifier) click", async () => {
    await flushRaf();

    const plainClick = new MouseEvent("click", {
      bubbles: true,
      cancelable: true,
      clientX: 5,
      clientY: 5,
    });
    target.dispatchEvent(plainClick);

    // The app click is swallowed synchronously, but the annotate is deferred so
    // a double-click can cancel it — nothing is created yet.
    expect(plainClick.defaultPrevented).toBe(true);
    expect(created).toHaveLength(0);

    // After the double-click window elapses, the single click annotates.
    await wait(DOUBLE_CLICK_WINDOW);
    expect(created).toHaveLength(1);
    expect(created[0]!.node).toBe(target);
    expect(opened).toHaveLength(0);
  });

  it("opens source (and never annotates) on a double-click", async () => {
    await flushRaf();

    // Mirror the browser: two clicks then a dblclick on the same target.
    const click = () =>
      target.dispatchEvent(
        new MouseEvent("click", { bubbles: true, cancelable: true, clientX: 5, clientY: 5 }),
      );
    click();
    click();
    target.dispatchEvent(
      new MouseEvent("dblclick", { bubbles: true, cancelable: true, clientX: 5, clientY: 5 }),
    );

    // Wait past the deferral window: the queued annotate must have been canceled.
    await wait(DOUBLE_CLICK_WINDOW);
    expect(created).toHaveLength(0);
    // Source opened exactly once. The plain <button> has no Tier-1 stamping/fiber,
    // so the resolved source is null — the routing is what's under test here.
    expect(opened).toHaveLength(1);
    expect(opened[0]).toBeNull();
  });
});

/** Slightly longer than the controller's internal double-click window. */
const DOUBLE_CLICK_WINDOW = 320;

/** Let any queued requestAnimationFrame callbacks run. */
function flushRaf(): Promise<void> {
  return new Promise((resolve) => requestAnimationFrame(() => resolve()));
}

/** Resolve after `ms` real milliseconds. */
function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
