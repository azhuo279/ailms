import { describe, it, expect, beforeEach } from "vitest";
import { Anchorer } from "../../src/anchoring/Anchorer";
import { buildFallbackLocators } from "../../src/inspector/locators";
import type { Annotation, RuntimeAnnotation } from "../../src/types";

/** Minimal annotation with locators built from a node, source unresolved. */
function annFor(node: Element): Annotation {
  return {
    id: "a1",
    note: "n",
    source: null,
    fallbackLocators: buildFallbackLocators(node),
    context: {
      outerHTMLTrimmed: "",
      textContent: "",
      role: null,
      tagName: node.tagName.toLowerCase(),
      componentName: null,
      rect: { x: 0, y: 0, width: 0, height: 0 },
    },
    session: {
      route: "/",
      url: "http://localhost/",
      viewport: { width: 800, height: 600 },
      capturedAt: "2026-06-11T00:00:00.000Z",
    },
    createdAt: "2026-06-11T00:00:00.000Z",
    updatedAt: "2026-06-11T00:00:00.000Z",
  };
}

describe("Anchorer — same-route remount recovery", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  it("re-anchors after the element unmounts and remounts into a new structure", () => {
    // Original DOM: button is the 2nd <li> in a list (a structural cssPath).
    document.body.innerHTML = `
      <main id="root">
        <ul><li>one</li><li><button>Confirm purchase</button></li></ul>
      </main>`;
    const original = document.querySelector("button")!;

    const rt: RuntimeAnnotation = {
      data: annFor(original),
      el: original,
      rect: null,
      detached: false,
      view: "collapsed",
    };

    const anchorer = new Anchorer(
      () => [rt],
      () => {},
    );

    // First pass: anchors to the live element and snapshots liveLocators.
    anchorer.refresh();
    expect(rt.detached).toBe(false);
    expect(rt.liveLocators).toBeTruthy();

    // Simulate a same-route view switch: the subtree re-renders into a DIFFERENT
    // structure (no <ul>/<li> wrapper now), so the creation-time cssPath
    // (#root > ul > li:nth-of-type(2) > button) no longer matches. The element
    // is a brand-new node with the same accessible text.
    document.body.innerHTML = `
      <main id="root">
        <section><button>Confirm purchase</button></section>
      </main>`;
    rt.el = null; // old node is gone (isConnected would be false)

    anchorer.refresh();

    // Recovery succeeds: liveLocators carried the role/text signal, so the
    // remounted element re-anchors instead of staying detached.
    expect(rt.detached).toBe(false);
    expect(rt.el).toBe(document.querySelector("button"));

    anchorer.stop();
  });

  it("stays detached when the element is genuinely gone", () => {
    document.body.innerHTML = `
      <main id="root"><button>Archive item</button></main>`;
    const node = document.querySelector("button")!;
    const rt: RuntimeAnnotation = {
      data: annFor(node),
      el: node,
      rect: null,
      detached: false,
      view: "collapsed",
    };
    const anchorer = new Anchorer(
      () => [rt],
      () => {},
    );
    anchorer.refresh();
    expect(rt.detached).toBe(false);

    // Element removed and nothing matching remains.
    document.body.innerHTML = `<main id="root"></main>`;
    rt.el = null;
    anchorer.refresh();

    expect(rt.detached).toBe(true);
    expect(rt.el).toBeNull();
    anchorer.stop();
  });
});
