import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { registerShortcuts, type ShortcutAction } from "../../src/interaction/shortcuts";
import { DEFAULT_SHORTCUTS } from "../../src/config";
import { HOST_ID } from "../../src/config";

/**
 * The typing guard: bare-key shortcuts (M / A / Escape) must NEVER fire while
 * the user is typing — neither in the host app's own inputs nor in our sticky
 * note. Only the modifier shortcut (Alt+H) is allowed through a focused sticky
 * so demo-hide still works mid-edit.
 */
describe("registerShortcuts typing guard", () => {
  let fired: ShortcutAction[];
  let teardown: () => void;

  beforeEach(() => {
    fired = [];
    teardown = registerShortcuts(DEFAULT_SHORTCUTS, (a) => {
      fired.push(a);
      return true;
    });
  });

  afterEach(() => {
    teardown();
    document.body.innerHTML = "";
  });

  function press(key: string, target: Element, mods: Partial<KeyboardEvent> = {}) {
    const code = /^[a-z]$/i.test(key) ? `Key${key.toUpperCase()}` : key;
    const e = new KeyboardEvent("keydown", {
      key,
      code,
      bubbles: true,
      cancelable: true,
      // Real KeyboardEvents are composed, so they cross shadow boundaries and
      // get retargeted to the shadow host on document — the case under test.
      composed: true,
      ...mods,
    });
    // jsdom dispatches from the target; the capture-phase listener on document
    // sees `e.target` as the element we dispatch on.
    target.dispatchEvent(e);
  }

  it("fires bare M / A when NOT typing (focus on the page body)", () => {
    const div = document.createElement("div");
    document.body.appendChild(div);
    press("m", div);
    press("a", div);
    expect(fired).toEqual(["toggleMarkup", "toggleShowAll"]);
  });

  it("does NOT fire M / A while typing in a host <input>", () => {
    const input = document.createElement("input");
    document.body.appendChild(input);
    press("m", input);
    press("a", input);
    expect(fired).toEqual([]);
  });

  it("does NOT fire M / A while typing in a host <textarea>", () => {
    const ta = document.createElement("textarea");
    document.body.appendChild(ta);
    press("m", ta);
    press("a", ta);
    expect(fired).toEqual([]);
  });

  // The sticky textarea lives in a REAL shadow root. Composed KeyboardEvents are
  // retargeted to the shadow host on `document`, so these cases only pass when
  // the guard reads composedPath() rather than e.target.
  function mountShadowTextarea(): HTMLTextAreaElement {
    const host = document.createElement("div");
    host.id = HOST_ID;
    document.body.appendChild(host);
    const root = host.attachShadow({ mode: "open" });
    const ta = document.createElement("textarea");
    root.appendChild(ta);
    return ta;
  }

  it("does NOT fire M / A while typing in our own (shadow) sticky textarea", () => {
    const ta = mountShadowTextarea();
    press("m", ta);
    press("a", ta);
    expect(fired).toEqual([]);
  });

  it("still fires the modifier shortcut (Alt+H) inside our (shadow) sticky", () => {
    const ta = mountShadowTextarea();
    press("h", ta, { altKey: true });
    expect(fired).toEqual(["toggleVisible"]);
  });
});
