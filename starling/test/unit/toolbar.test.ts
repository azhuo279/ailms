import { describe, it, expect, vi, beforeEach } from "vitest";
import { Toolbar, type ToolbarCallbacks } from "../../src/ui/Toolbar";

/**
 * The toolbar collapses into a single markup-icon button and expands again.
 * These tests pin that state machine and the lucide icon wiring.
 */
describe("Toolbar collapse/expand", () => {
  let cb: ToolbarCallbacks;
  let toolbar: Toolbar;

  beforeEach(() => {
    cb = {
      onToggleMarkup: vi.fn(),
      onToggleShowAll: vi.fn(),
      onToggleVisible: vi.fn(),
      onToggleSidebar: vi.fn(),
      onCompile: vi.fn(),
      onClearAll: vi.fn(),
    };
    toolbar = new Toolbar(cb);
  });

  const collapseBtn = () =>
    toolbar.el.querySelector<HTMLButtonElement>(".pp-tool-collapse")!;
  const expandBtn = () =>
    toolbar.el.querySelector<HTMLButtonElement>(".pp-tool-expand")!;

  it("renders the collapse chevrons left of the Markup button", () => {
    const full = toolbar.el.querySelector(".pp-toolbar-full")!;
    const first = full.firstElementChild as HTMLElement;
    expect(first.classList.contains("pp-tool-collapse")).toBe(true);

    // The collapse glyph is lucide chevrons-right (two paths).
    const paths = first.querySelectorAll("svg path");
    expect(paths).toHaveLength(2);
    expect(paths[0]!.getAttribute("d")).toBe("m6 17 5-5-5-5");
    expect(paths[1]!.getAttribute("d")).toBe("m13 17 5-5-5-5");

    // The Markup button follows immediately after the collapse button.
    const markup = first.nextElementSibling as HTMLElement;
    expect(markup.textContent).toContain("Markup");
  });

  it("starts expanded", () => {
    expect(toolbar.el.classList.contains("pp-collapsed")).toBe(false);
  });

  it("collapses to the single markup-icon button and expands back", () => {
    collapseBtn().click();
    expect(toolbar.el.classList.contains("pp-collapsed")).toBe(true);

    // The collapsed pill carries a markup icon (lucide mouse-pointer-click).
    const icon = expandBtn().querySelector("svg");
    expect(icon).not.toBeNull();
    expect(icon!.querySelectorAll("path").length).toBeGreaterThan(0);

    expandBtn().click();
    expect(toolbar.el.classList.contains("pp-collapsed")).toBe(false);
  });

  it("collapse/expand toggles never fire the action callbacks", () => {
    collapseBtn().click();
    expandBtn().click();
    expect(cb.onToggleMarkup).not.toHaveBeenCalled();
    expect(cb.onToggleVisible).not.toHaveBeenCalled();
    expect(cb.onCompile).not.toHaveBeenCalled();
  });

  it("mirrors active markup state onto the collapsed pill", () => {
    toolbar.setState({ toolVisible: true, markupMode: true, showAllMarkup: false });
    expect(expandBtn().classList.contains("pp-active")).toBe(true);

    toolbar.setState({ toolVisible: true, markupMode: false, showAllMarkup: false });
    expect(expandBtn().classList.contains("pp-active")).toBe(false);
  });
});

describe("Toolbar Compile button disabled state", () => {
  let cb: ToolbarCallbacks;
  let toolbar: Toolbar;

  beforeEach(() => {
    cb = {
      onToggleMarkup: vi.fn(),
      onToggleShowAll: vi.fn(),
      onToggleVisible: vi.fn(),
      onToggleSidebar: vi.fn(),
      onCompile: vi.fn(),
      onClearAll: vi.fn(),
    };
    toolbar = new Toolbar(cb);
  });

  const compileBtn = () =>
    toolbar.el.querySelector<HTMLButtonElement>(".pp-primary")!;

  it("starts disabled (a fresh session has no annotations)", () => {
    expect(compileBtn().disabled).toBe(true);
  });

  it("enables once the session has annotations, disables again at zero", () => {
    toolbar.setCount(2);
    expect(compileBtn().disabled).toBe(false);
    toolbar.setCount(0);
    expect(compileBtn().disabled).toBe(true);
  });

  it("does not fire onCompile while disabled", () => {
    compileBtn().click();
    expect(cb.onCompile).not.toHaveBeenCalled();
    toolbar.setCount(1);
    compileBtn().click();
    expect(cb.onCompile).toHaveBeenCalledTimes(1);
  });

  it("stays disabled mid-compile even with annotations, and the empty/busy states compose", () => {
    toolbar.setCount(3);
    toolbar.setCompiling(true);
    expect(compileBtn().disabled).toBe(true);
    // Save finishes but the store has reset to zero — must remain disabled.
    toolbar.setCount(0);
    toolbar.setCompiling(false);
    expect(compileBtn().disabled).toBe(true);
  });

  it("disables while viewing a past (read-only) snapshot, even with annotations", () => {
    toolbar.setCount(5); // a loaded snapshot reports its annotation count
    expect(compileBtn().disabled).toBe(false);
    toolbar.setReadOnly(true);
    expect(compileBtn().disabled).toBe(true);
    expect(compileBtn().title).toMatch(/current session/i);
    // Returning to the live session re-enables it (count still > 0).
    toolbar.setReadOnly(false);
    expect(compileBtn().disabled).toBe(false);
  });

  it("does not fire onCompile while read-only", () => {
    toolbar.setCount(5);
    toolbar.setReadOnly(true);
    compileBtn().click();
    expect(cb.onCompile).not.toHaveBeenCalled();
  });
});
