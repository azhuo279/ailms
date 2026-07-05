import { describe, it, expect } from "vitest";
import { resolveView } from "../../src/Starling";
import { groupBy } from "../../src/util/group";
import { debounce } from "../../src/util/debounce";

describe("resolveView (visibility state machine)", () => {
  const base = { toolVisible: true, markupMode: false, showAllMarkup: false };

  it("collapses everything when tool is hidden", () => {
    expect(resolveView("pinned", { ...base, toolVisible: false })).toBe("collapsed");
    expect(resolveView("editing", { ...base, toolVisible: false })).toBe("collapsed");
  });

  it("editing always wins over show-all", () => {
    expect(resolveView("editing", { ...base, showAllMarkup: true })).toBe("editing");
  });

  it("show-all forces pinned", () => {
    expect(resolveView("collapsed", { ...base, showAllMarkup: true })).toBe("pinned");
    expect(resolveView("hover", { ...base, showAllMarkup: true })).toBe("pinned");
  });

  it("passes through the runtime view otherwise", () => {
    expect(resolveView("collapsed", base)).toBe("collapsed");
    expect(resolveView("hover", base)).toBe("hover");
    expect(resolveView("pinned", base)).toBe("pinned");
  });

  describe("read-only (Rewind): hover-only at rest, but Show-all opens all", () => {
    it("with Show-all off, never pins — pinned/editing collapse to hover", () => {
      expect(resolveView("pinned", base, true)).toBe("hover");
      expect(resolveView("editing", base, true)).toBe("hover");
    });

    it("honors show-all — forces every note open, just like the live session", () => {
      expect(resolveView("collapsed", { ...base, showAllMarkup: true }, true)).toBe(
        "pinned",
      );
      expect(resolveView("hover", { ...base, showAllMarkup: true }, true)).toBe(
        "pinned",
      );
      expect(resolveView("pinned", { ...base, showAllMarkup: true }, true)).toBe(
        "pinned",
      );
    });

    it("still reveals on hover, and stays collapsed at rest", () => {
      expect(resolveView("collapsed", base, true)).toBe("collapsed");
      expect(resolveView("hover", base, true)).toBe("hover");
    });

    it("a hidden tool still collapses everything, even read-only", () => {
      expect(resolveView("hover", { ...base, toolVisible: false }, true)).toBe(
        "collapsed",
      );
    });
  });
});

describe("groupBy", () => {
  it("groups by key, preserving first-seen order", () => {
    const out = groupBy(
      [
        { r: "/b", n: 1 },
        { r: "/a", n: 2 },
        { r: "/b", n: 3 },
      ],
      (x) => x.r,
    );
    expect(Object.keys(out)).toEqual(["/b", "/a"]);
    expect(out["/b"]!.map((x) => x.n)).toEqual([1, 3]);
  });
});

describe("debounce", () => {
  it("coalesces calls and flush runs the pending one", () => {
    const calls: number[] = [];
    const d = debounce((n: number) => calls.push(n), 50);
    d(1);
    d(2);
    d(3);
    expect(calls).toEqual([]);
    d.flush();
    expect(calls).toEqual([3]);
  });
});
