import { describe, it, expect } from "vitest";
import { toRelative, resolveSource } from "../../src/inspector/source";

describe("toRelative", () => {
  it("strips an absolute root", () => {
    expect(toRelative("/Users/me/proj/src/App.tsx", "/Users/me/proj")).toBe(
      "src/App.tsx",
    );
  });
  it("falls back to first known dir when root unknown", () => {
    expect(toRelative("/abs/whatever/src/components/Btn.tsx", undefined)).toBe(
      "src/components/Btn.tsx",
    );
  });
  it("returns the original when nothing matches", () => {
    expect(toRelative("Btn.tsx", undefined)).toBe("Btn.tsx");
  });
});

describe("resolveSource (React 19 reality)", () => {
  it("returns null gracefully when no attributes and no fiber source", () => {
    const node = document.createElement("div");
    expect(resolveSource(node, null, undefined)).toBeNull();
  });

  it("reads Tier-1 attributes when present", () => {
    const node = document.createElement("div");
    node.setAttribute("data-inspector-relative-path", "src/X.tsx");
    node.setAttribute("data-inspector-line", "42");
    node.setAttribute("data-inspector-column", "6");
    const s = resolveSource(node, null, undefined);
    expect(s).toMatchObject({
      relativePath: "src/X.tsx",
      lineNumber: 42,
      columnNumber: 6,
      tier: "attribute",
    });
  });

  it("reads Sentry/SWC attribute convention", () => {
    const node = document.createElement("div");
    node.setAttribute("data-sentry-source-file", "src/Y.tsx");
    node.setAttribute("data-source-line", "7");
    const s = resolveSource(node, null, undefined);
    expect(s).toMatchObject({ relativePath: "src/Y.tsx", lineNumber: 7 });
  });
});
