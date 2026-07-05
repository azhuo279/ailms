import { describe, it, expect, afterEach } from "vitest";
import { captureTrigger } from "../../src/inspector/trigger";

/**
 * Trigger capture: when an annotated element lives in a transient overlay
 * (menu/dialog/popover) we remember the control that opened it, so a marker
 * that detaches on close can re-summon it. These tests pin which DOM shapes
 * resolve a trigger and which stay null (no guessing).
 */
describe("captureTrigger", () => {
  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("resolves the opener via aria-controls pointing at the overlay", () => {
    document.body.innerHTML = `
      <button aria-haspopup="menu" aria-expanded="true" aria-controls="m" aria-label="Account">avatar</button>
      <div id="m" role="menu"><button id="item">Switch language</button></div>
    `;
    const item = document.getElementById("item")!;
    const trigger = captureTrigger(item);
    expect(trigger).not.toBeNull();
    expect(trigger!.label).toBe("Account");
    expect(trigger!.locators.length).toBeGreaterThan(0);
  });

  it("resolves a single expanded opener when inside a role=menu (no aria-controls)", () => {
    // Mirrors the avatar menu: trigger has aria-haspopup + aria-expanded but no
    // aria-controls; the menu is a separate role=menu container.
    document.body.innerHTML = `
      <button aria-haspopup="menu" aria-expanded="true" aria-label="Open persona menu">avatar</button>
      <div role="menu"><button id="item">Switch to English</button></div>
    `;
    const trigger = captureTrigger(document.getElementById("item")!);
    expect(trigger?.label).toBe("Open persona menu");
  });

  it("returns null for an ordinary element not inside an overlay", () => {
    document.body.innerHTML = `
      <button aria-expanded="true" aria-label="Sidebar toggle">menu</button>
      <main><button id="plain">Save</button></main>
    `;
    expect(captureTrigger(document.getElementById("plain")!)).toBeNull();
  });

  it("returns null when inside an overlay but the opener is ambiguous", () => {
    // Two expanded controls, neither owns the overlay via aria-controls — don't guess.
    document.body.innerHTML = `
      <button aria-expanded="true" aria-label="A">a</button>
      <button aria-expanded="true" aria-label="B">b</button>
      <div role="dialog"><button id="item">OK</button></div>
    `;
    expect(captureTrigger(document.getElementById("item")!)).toBeNull();
  });

  it("ignores an expanded control that contains the annotated element itself", () => {
    // A self-expanded wrapper (e.g. an accordion header) is not an overlay opener.
    document.body.innerHTML = `
      <div role="dialog">
        <button aria-expanded="true" aria-label="Self">
          <span id="item">label</span>
        </button>
      </div>
    `;
    expect(captureTrigger(document.getElementById("item")!)).toBeNull();
  });
});
