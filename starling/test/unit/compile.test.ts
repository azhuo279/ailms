import { describe, it, expect } from "vitest";
import { compile } from "../../src/compile/compile";
import type { Annotation, Session } from "../../src/types";

function ann(over: Partial<Annotation>): Annotation {
  return {
    id: "id1",
    note: "",
    source: null,
    fallbackLocators: [
      {
        strategy: "role",
        value: "button:Place order",
        playwright: 'page.getByRole("button", { name: "Place order" })',
      },
    ],
    context: {
      outerHTMLTrimmed: "<button>",
      textContent: "Place order",
      role: "button",
      tagName: "button",
      componentName: null,
      rect: { x: 0, y: 0, width: 10, height: 10 },
    },
    session: {
      route: "/checkout",
      url: "http://localhost/checkout",
      viewport: { width: 1440, height: 900 },
      capturedAt: "2026-01-01T00:00:00.000Z",
    },
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    ...over,
  };
}

describe("compile", () => {
  it("groups by route and renders source when present", () => {
    const session: Session = {
      version: 1,
      sessionId: "s1",
      annotations: [
        ann({
          id: "a",
          note: "Make this primary.",
          source: {
            relativePath: "src/CheckoutForm.tsx",
            lineNumber: 42,
            columnNumber: 6,
            componentName: "CheckoutForm",
            tier: "fiber",
          },
        }),
      ],
    };
    const md = compile(session);
    expect(md).toContain("# Starling annotations (1)");
    expect(md).toContain("## Route: `/checkout`");
    expect(md).toContain("### src/CheckoutForm.tsx:42 (in <CheckoutForm>)");
    expect(md).toContain("**Note:** Make this primary.");
    expect(md).toContain("```json");
  });

  it("renders the no-source path for null source (React 19 default)", () => {
    const session: Session = {
      version: 1,
      sessionId: "s1",
      annotations: [ann({ id: "b", note: "Tweak.", source: null })],
    };
    const md = compile(session);
    expect(md).toContain("### button (no source — use fallback locators)");
    // Preamble inverts emphasis for React 19: fallback locators are primary.
    expect(md).toContain("are the primary anchor");
  });

  it("includes the enclosing component name when source is null (React 19)", () => {
    const session: Session = {
      version: 1,
      sessionId: "s1",
      annotations: [
        ann({
          id: "c",
          note: "x",
          source: null,
          context: {
            outerHTMLTrimmed: "<span>",
            textContent: "Briefing",
            role: null,
            tagName: "span",
            componentName: "Navbar",
            rect: { x: 0, y: 0, width: 10, height: 10 },
          },
        }),
      ],
    };
    const md = compile(session);
    expect(md).toContain("### span in <Navbar> (no source — use fallback locators)");
  });

  it("handles an empty session", () => {
    const md = compile({ version: 1, sessionId: "s", annotations: [] });
    expect(md).toContain("# Starling annotations (0)");
    expect(md).toContain("_No annotations captured._");
  });

  it("is deterministic (stable output across calls)", () => {
    const session: Session = {
      version: 1,
      sessionId: "s1",
      annotations: [ann({ id: "a", note: "x" }), ann({ id: "b", note: "y" })],
    };
    expect(compile(session)).toBe(compile(session));
  });
});
