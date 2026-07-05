import { MAX_OUTER_HTML, MAX_TEXT_CONTENT, HOST_ID } from "../config";
import { implicitRole } from "../inspector/a11y";
import type { ElementContext } from "../types";

/** Is this node inside our own shadow host? (so we never annotate our own UI) */
export function isInsideHost(node: Node | null): boolean {
  let n: Node | null = node;
  while (n) {
    if (n instanceof Element && n.id === HOST_ID) return true;
    // Cross shadow boundaries upward.
    n = n.parentNode ?? (n as Node & { host?: Node }).host ?? null;
  }
  return false;
}

/**
 * The top *app* element at a point — i.e. ignoring our overlay. Our overlay
 * layer is pointer-events:none, so `elementFromPoint` normally returns the app
 * element already; this guard handles the widget-children edge case.
 */
export function topAppElementAt(x: number, y: number): Element | null {
  const el = document.elementFromPoint(x, y);
  if (!el) return null;
  if (isInsideHost(el)) return null;
  return el;
}

/**
 * Is any part of `el` currently visible on screen? Intersects the element's rect
 * with the viewport and with every clipping (overflow != visible) ancestor's
 * rect — so an element scrolled out of an inner scroll container reads as
 * out-of-view, not just one scrolled past the window edge. Used to hide a
 * marker whose badge would otherwise clamp to the viewport edge and float over
 * unrelated content; it reappears the moment any sliver of the element returns.
 */
export function isElementInView(el: Element): boolean {
  const rect = el.getBoundingClientRect();
  if (rect.width === 0 && rect.height === 0) return false;

  // The clip window starts as the viewport, then shrinks to each clipping
  // ancestor's bounds.
  let top = 0;
  let left = 0;
  let right = window.innerWidth || document.documentElement.clientWidth;
  let bottom = window.innerHeight || document.documentElement.clientHeight;

  let node: Element | null = el.parentElement;
  while (node && node !== document.body && node !== document.documentElement) {
    const style = getComputedStyle(node);
    const overflow = style.overflow + style.overflowX + style.overflowY;
    if (/(auto|scroll|hidden|clip)/.test(overflow)) {
      const cr = node.getBoundingClientRect();
      top = Math.max(top, cr.top);
      left = Math.max(left, cr.left);
      right = Math.min(right, cr.right);
      bottom = Math.min(bottom, cr.bottom);
    }
    node = node.parentElement;
  }

  return (
    rect.bottom > top &&
    rect.top < bottom &&
    rect.right > left &&
    rect.left < right
  );
}

/**
 * 1-based index of `el` among same-tag siblings, for `:nth-of-type`. Returns 0
 * when it's the only one of its tag (no index needed).
 */
export function indexAmongSiblings(el: Element): number {
  const parent = el.parentElement;
  if (!parent) return 0;
  const tag = el.tagName;
  const sameTag = Array.from(parent.children).filter((c) => c.tagName === tag);
  if (sameTag.length <= 1) return 0;
  return sameTag.indexOf(el) + 1;
}

/**
 * Capture a trimmed, bounded snapshot of an element for the locator bundle.
 * `componentName` is the enclosing component resolved from the fiber (passed in
 * by the caller); it's stored independently of source so it survives the
 * common React-19 case where source resolution returns null.
 */
export function snapshotContext(
  node: Element,
  componentName: string | null = null,
): ElementContext {
  const rect = node.getBoundingClientRect();
  const role = node.getAttribute("role") ?? implicitRole(node);

  // Opening tag only (avoid dumping full subtree), bounded.
  const html = node.outerHTML ?? "";
  const openTagMatch = html.match(/^<[^>]*>/);
  const outerHTMLTrimmed = (openTagMatch ? openTagMatch[0] : html).slice(
    0,
    MAX_OUTER_HTML,
  );

  const textContent = (node.textContent ?? "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, MAX_TEXT_CONTENT);

  return {
    outerHTMLTrimmed,
    textContent,
    role: role ?? null,
    tagName: node.tagName.toLowerCase(),
    componentName,
    rect: {
      x: Math.round(rect.x),
      y: Math.round(rect.y),
      width: Math.round(rect.width),
      height: Math.round(rect.height),
    },
  };
}
