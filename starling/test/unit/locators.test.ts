import { describe, it, expect, beforeEach } from "vitest";
import {
  buildFallbackLocators,
  cssPath,
  isGeneratedId,
  tryLocator,
  ANCHOR_KEY_ATTR,
  stampAnchorKey,
  clearAnchorKey,
  findByAnchorKey,
} from "../../src/inspector/locators";
import type { FallbackLocator } from "../../src/types";

const textLoc = (value: string): FallbackLocator => ({
  strategy: "text",
  value,
  playwright: "",
});

const loc = (strategy: FallbackLocator["strategy"], value: string): FallbackLocator => ({
  strategy,
  value,
  playwright: "",
});

describe("isGeneratedId", () => {
  it("flags React useId() ids", () => {
    expect(isGeneratedId(":r3:")).toBe(true);
    expect(isGeneratedId("radix-:r1a:")).toBe(true);
  });
  it("flags long hashes", () => {
    expect(isGeneratedId("a1b2c3d4")).toBe(true);
    expect(isGeneratedId("deadbeefcafe")).toBe(true);
  });
  it("keeps human-authored ids", () => {
    expect(isGeneratedId("submit-button")).toBe(false);
    expect(isGeneratedId("main")).toBe(false);
    expect(isGeneratedId("nav-item-1")).toBe(false);
  });
});

describe("cssPath / buildFallbackLocators", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  it("stops the css path at a stable id ancestor", () => {
    document.body.innerHTML = `
      <main id="root">
        <section><button>Save</button></section>
      </main>`;
    const btn = document.querySelector("button")!;
    expect(cssPath(btn)).toBe("#root > section > button");
  });

  it("uses nth-of-type to disambiguate siblings", () => {
    document.body.innerHTML = `
      <ul id="list"><li>a</li><li>b</li><li>c</li></ul>`;
    const third = document.querySelectorAll("li")[2]!;
    expect(cssPath(third)).toBe("#list > li:nth-of-type(3)");
  });

  it("orders fallback locators most→least stable and emits Playwright", () => {
    document.body.innerHTML = `
      <button id="save" data-testid="save-btn" role="button" aria-label="Save changes">Save</button>`;
    const btn = document.querySelector("button")!;
    const locs = buildFallbackLocators(btn);
    expect(locs.map((l) => l.strategy)).toEqual([
      "testid",
      "id",
      "role",
      "text",
      "css",
    ]);
    expect(locs[0]!.playwright).toBe('page.getByTestId("save-btn")');
    expect(locs[2]!.playwright).toBe(
      'page.getByRole("button", { name: "Save changes" })',
    );
  });

  it("omits unstable ids from locators", () => {
    document.body.innerHTML = `<div id=":r7:">x</div>`;
    const div = document.querySelector("div")!;
    const locs = buildFallbackLocators(div);
    expect(locs.some((l) => l.strategy === "id")).toBe(false);
  });

  it("always produces at least a css locator", () => {
    document.body.innerHTML = `<span></span>`;
    const span = document.querySelector("span")!;
    const locs = buildFallbackLocators(span);
    expect(locs.length).toBeGreaterThan(0);
    expect(locs[locs.length - 1]!.strategy).toBe("css");
  });
});

describe("tryLocator(text) — hardened scan", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  it("matches the element whose OWN text equals the target", () => {
    document.body.innerHTML = `
      <div><span>Save changes</span></div>`;
    const hit = tryLocator(textLoc("Save changes"));
    expect(hit?.tagName).toBe("SPAN");
  });

  it("does not anchor to a container that merely contains the substring", () => {
    // The <section> contains the text only via its descendant; the leaf <span>
    // is the own-text owner and must be preferred over its wrappers.
    document.body.innerHTML = `
      <section><article><span>Submit order</span></article></section>`;
    const hit = tryLocator(textLoc("Submit order"));
    expect(hit?.tagName).toBe("SPAN");
  });

  it("returns null when two elements match equally well (ambiguous)", () => {
    document.body.innerHTML = `
      <ul><li>Delete</li><li>Delete</li></ul>`;
    expect(tryLocator(textLoc("Delete"))).toBeNull();
  });

  it("returns null when the text is gone, rather than mis-anchoring", () => {
    // The original target text isn't present; an unrelated substring elsewhere
    // must NOT be claimed as a match.
    document.body.innerHTML = `<p>Something else entirely</p>`;
    expect(tryLocator(textLoc("Save changes"))).toBeNull();
  });
});

describe("tryLocator — strict (ambiguity-rejecting) selectors", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  it("resolves a css selector only when it matches exactly one element", () => {
    document.body.innerHTML = `<ul><li>a</li><li>b</li></ul>`;
    // Two <li> match — ambiguous, so we refuse rather than grab the first.
    expect(tryLocator(loc("css", "li"))).toBeNull();
    document.body.innerHTML = `<ul><li>only</li></ul>`;
    expect(tryLocator(loc("css", "li"))?.textContent).toBe("only");
  });

  it("refuses an id shared by two elements (duplicate ids)", () => {
    document.body.innerHTML = `<div id="dup">1</div><div id="dup">2</div>`;
    expect(tryLocator(loc("id", "#dup"))).toBeNull();
  });

  it("refuses a testid shared by two elements", () => {
    document.body.innerHTML = `
      <button data-testid="row">A</button>
      <button data-testid="row">B</button>`;
    expect(tryLocator(loc("testid", "row"))).toBeNull();
  });

  it("anchors role+name only when that pair is unique", () => {
    document.body.innerHTML = `
      <button aria-label="Approve">A</button>
      <button aria-label="Approve">B</button>`;
    // Two same-named buttons — the original is gone, so don't jump to a sibling.
    expect(tryLocator(loc("role", "button:Approve"))).toBeNull();

    document.body.innerHTML = `<button aria-label="Approve">only</button>`;
    expect(tryLocator(loc("role", "button:Approve"))?.textContent).toBe("only");
  });
});

describe("anchor keys (unique identifying attribute)", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  it("stamps and finds the exact element, never a same-type sibling", () => {
    document.body.innerHTML = `
      <button id="a">A</button><button id="b">B</button>`;
    const a = document.getElementById("a")!;
    stampAnchorKey(a, "ann-1");
    expect(a.getAttribute(ANCHOR_KEY_ATTR)).toBe("ann-1");
    expect(findByAnchorKey("ann-1")).toBe(a);
    // A sibling of the same type is NOT matched.
    expect(findByAnchorKey("ann-1")).not.toBe(document.getElementById("b"));
  });

  it("supports several annotations sharing one element (token list)", () => {
    document.body.innerHTML = `<button>x</button>`;
    const btn = document.querySelector("button")!;
    stampAnchorKey(btn, "ann-1");
    stampAnchorKey(btn, "ann-2");
    expect(btn.getAttribute(ANCHOR_KEY_ATTR)).toBe("ann-1 ann-2");
    expect(findByAnchorKey("ann-1")).toBe(btn);
    expect(findByAnchorKey("ann-2")).toBe(btn);
  });

  it("is idempotent — re-stamping the same key doesn't duplicate it", () => {
    document.body.innerHTML = `<button>x</button>`;
    const btn = document.querySelector("button")!;
    stampAnchorKey(btn, "ann-1");
    stampAnchorKey(btn, "ann-1");
    expect(btn.getAttribute(ANCHOR_KEY_ATTR)).toBe("ann-1");
  });

  it("clears one key and drops the attribute when the last is removed", () => {
    document.body.innerHTML = `<button>x</button>`;
    const btn = document.querySelector("button")!;
    stampAnchorKey(btn, "ann-1");
    stampAnchorKey(btn, "ann-2");
    clearAnchorKey(btn, "ann-1");
    expect(btn.getAttribute(ANCHOR_KEY_ATTR)).toBe("ann-2");
    expect(findByAnchorKey("ann-1")).toBeNull();
    clearAnchorKey(btn, "ann-2");
    expect(btn.hasAttribute(ANCHOR_KEY_ATTR)).toBe(false);
  });
});
