/**
 * Minimal accessibility helpers for locator capture. Not a full ARIA engine —
 * just enough to build robust role/name fallback locators (PRD §9).
 */

/** A pragmatic subset of implicit ARIA roles by tag (and input type). */
export function implicitRole(node: Element): string | null {
  const tag = node.tagName.toLowerCase();
  switch (tag) {
    case "a":
      return node.hasAttribute("href") ? "link" : null;
    case "button":
      return "button";
    case "nav":
      return "navigation";
    case "main":
      return "main";
    case "header":
      return "banner";
    case "footer":
      return "contentinfo";
    case "aside":
      return "complementary";
    case "h1":
    case "h2":
    case "h3":
    case "h4":
    case "h5":
    case "h6":
      return "heading";
    case "img":
      return node.getAttribute("alt") === "" ? null : "img";
    case "ul":
    case "ol":
      return "list";
    case "li":
      return "listitem";
    case "table":
      return "table";
    case "select":
      return "combobox";
    case "textarea":
      return "textbox";
    case "input": {
      const type = (node.getAttribute("type") ?? "text").toLowerCase();
      switch (type) {
        case "button":
        case "submit":
        case "reset":
          return "button";
        case "checkbox":
          return "checkbox";
        case "radio":
          return "radio";
        case "range":
          return "slider";
        case "search":
          return "searchbox";
        case "email":
        case "tel":
        case "url":
        case "text":
          return "textbox";
        default:
          return null;
      }
    }
    default:
      return null;
  }
}

/**
 * Accessible name, simplified: aria-label → aria-labelledby text → alt/value →
 * trimmed textContent. Mirrors how Playwright's getByRole name matching works
 * closely enough for a fallback locator.
 */
export function accessibleName(node: Element): string {
  const ariaLabel = node.getAttribute("aria-label");
  if (ariaLabel && ariaLabel.trim()) return ariaLabel.trim();

  const labelledBy = node.getAttribute("aria-labelledby");
  if (labelledBy) {
    const text = labelledBy
      .split(/\s+/)
      .map((refId) => node.ownerDocument?.getElementById(refId)?.textContent ?? "")
      .join(" ")
      .trim();
    if (text) return text;
  }

  const alt = node.getAttribute("alt");
  if (alt && alt.trim()) return alt.trim();

  if (node instanceof HTMLInputElement && node.value) return node.value.trim();

  const text = (node.textContent ?? "").replace(/\s+/g, " ").trim();
  return text;
}
