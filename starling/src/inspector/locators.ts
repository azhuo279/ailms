import type { FallbackLocator } from "../types";
import { indexAmongSiblings } from "../util/dom";
import { accessibleName, implicitRole } from "./a11y";

/**
 * Our own injected unique-anchor attribute. When an annotation is created we
 * stamp the annotation's id onto its target element here, and re-stamp it on
 * every successful anchor pass. Because only the ORIGINAL element ever carries
 * a given id, re-finding by this key is exact and can never resolve to a
 * same-type sibling — the failure mode where, after the original element
 * disappears, a marker grabbed "the nearest matching component" via a loose
 * fallback. The value is a space-separated token list so several annotations
 * can share one element (matched with the `~=` selector).
 */
export const ANCHOR_KEY_ATTR = "data-starling-anchor";

/**
 * querySelector that resolves ONLY when the selector matches exactly one
 * element. Returns null for 0 or >1 matches so an ambiguous selector never
 * silently binds to the first (often wrong) same-type element.
 */
export function queryUnique(sel: string): Element | null {
  try {
    const hits = document.querySelectorAll(sel);
    return hits.length === 1 ? (hits[0] as Element) : null;
  } catch {
    return null;
  }
}

/** Add `key` to an element's anchor-key token list (idempotent). */
export function stampAnchorKey(el: Element, key: string): void {
  const cur = el.getAttribute(ANCHOR_KEY_ATTR);
  const tokens = cur ? cur.split(/\s+/).filter(Boolean) : [];
  if (tokens.includes(key)) return; // already stamped — avoid a redundant write
  tokens.push(key);
  el.setAttribute(ANCHOR_KEY_ATTR, tokens.join(" "));
}

/** Remove `key` from an element's anchor-key list; drop the attr when empty. */
export function clearAnchorKey(el: Element, key: string): void {
  const cur = el.getAttribute(ANCHOR_KEY_ATTR);
  if (!cur) return;
  const tokens = cur.split(/\s+/).filter((t) => t && t !== key);
  if (tokens.length) el.setAttribute(ANCHOR_KEY_ATTR, tokens.join(" "));
  else el.removeAttribute(ANCHOR_KEY_ATTR);
}

/** Find the unique element stamped with `key`, or null. */
export function findByAnchorKey(key: string): Element | null {
  return queryUnique(`[${ANCHOR_KEY_ATTR}~="${cssAttrEscape(key)}"]`);
}

/**
 * Build an ordered list of fallback locators — never rely on one, because any
 * single selector is brittle (PRD §9). This is the *load-bearing* anchor on
 * React 19, where source resolution frequently returns null.
 *
 * Order = most → least stable: testid → id → role+name → text → css path.
 */
export function buildFallbackLocators(node: Element): FallbackLocator[] {
  const out: FallbackLocator[] = [];
  const q = (v: string) => JSON.stringify(v);

  const testid =
    node.getAttribute("data-testid") ?? node.getAttribute("data-test");
  if (testid) {
    out.push({
      strategy: "testid",
      value: testid,
      playwright: `page.getByTestId(${q(testid)})`,
    });
  }

  if (node.id && !isGeneratedId(node.id)) {
    const sel = `#${cssEscape(node.id)}`;
    out.push({ strategy: "id", value: sel, playwright: `page.locator(${q(sel)})` });
  }

  const role = node.getAttribute("role") ?? implicitRole(node);
  const name = accessibleName(node).slice(0, 80);
  if (role && name) {
    out.push({
      strategy: "role",
      value: `${role}:${name}`,
      playwright: `page.getByRole(${q(role)}, { name: ${q(name)} })`,
    });
  }

  const text = (node.textContent ?? "").replace(/\s+/g, " ").trim().slice(0, 60);
  if (text) {
    out.push({
      strategy: "text",
      value: text,
      playwright: `page.getByText(${q(text)}, { exact: false })`,
    });
  }

  const css = cssPath(node);
  out.push({ strategy: "css", value: css, playwright: `page.locator(${q(css)})` });

  return out;
}

/**
 * React `useId()` emits ":r3:" style ids; bundlers/styled-components emit long
 * hashes. Both are unstable across reloads — exclude them from locators.
 */
export function isGeneratedId(elId: string): boolean {
  return /^:r/i.test(elId) || /^[0-9a-f]{8,}$/i.test(elId) || elId.includes(":");
}

/**
 * Bounded structural CSS path. Stops at the first ancestor with a stable
 * id/testid, caps depth at 6, uses :nth-of-type to disambiguate siblings.
 */
export function cssPath(node: Element): string {
  const parts: string[] = [];
  let el: Element | null = node;
  while (el && el !== document.body && el.nodeType === 1 && parts.length < 6) {
    if (el.id && !isGeneratedId(el.id)) {
      parts.unshift(`#${cssEscape(el.id)}`);
      break;
    }
    const tid = el.getAttribute("data-testid");
    if (tid) {
      parts.unshift(`[data-testid="${cssAttrEscape(tid)}"]`);
      break;
    }
    const tag = el.tagName.toLowerCase();
    const idx = indexAmongSiblings(el);
    parts.unshift(idx ? `${tag}:nth-of-type(${idx})` : tag);
    el = el.parentElement;
  }
  return parts.join(" > ");
}

/**
 * Re-find an element from a fallback locator at runtime (used by the Anchorer
 * after reload/navigation). Selector strategies use querySelector; role/text
 * strategies scan because there's no querySelector for them.
 */
export function tryLocator(loc: FallbackLocator): Element | null {
  try {
    switch (loc.strategy) {
      case "id":
      case "css":
        // Strict: a selector that now matches several elements is ambiguous —
        // refuse it rather than binding to the first (which may be a sibling of
        // the same type that outlived the original).
        return queryUnique(loc.value);
      case "testid":
        return queryUnique(
          `[data-testid="${cssAttrEscape(loc.value)}"], [data-test="${cssAttrEscape(loc.value)}"]`,
        );
      case "role": {
        const sep = loc.value.indexOf(":");
        const role = loc.value.slice(0, sep);
        const name = loc.value.slice(sep + 1);
        return scanByRoleName(role, name);
      }
      case "text":
        return scanByText(loc.value);
      default:
        return null;
    }
  } catch {
    return null;
  }
}

function scanByRoleName(role: string, name: string): Element | null {
  const target = name.trim().toLowerCase();
  const candidates = document.querySelectorAll<HTMLElement>(
    `[role="${role}"], a, button, input, select, textarea, h1, h2, h3, h4, h5, h6, img, nav, main`,
  );
  const matches: Element[] = [];
  for (const el of Array.from(candidates)) {
    const elRole = el.getAttribute("role") ?? implicitRole(el);
    if (elRole !== role) continue;
    if (accessibleName(el).trim().toLowerCase() === target) matches.push(el);
  }
  // Only anchor when the role+name pair is unique. Two buttons both named
  // "Approve" can't be told apart this way, so we stay detached rather than
  // jump to whichever happens to come first in the DOM.
  return matches.length === 1 ? matches[0]! : null;
}

/**
 * Re-find an element by its captured text. Prefers an element whose *own* text
 * (its direct text nodes, excluding descendants) exactly equals the target — a
 * far stronger signal than a container that merely *contains* the substring
 * somewhere in its subtree. When two or more elements match equally well the
 * anchor is ambiguous, so we return null and let the marker stay honestly
 * detached rather than silently jump to the wrong element.
 */
function scanByText(text: string): Element | null {
  const target = text.trim().toLowerCase();
  if (!target) return null;

  const all = Array.from(document.body.querySelectorAll<HTMLElement>("*"));

  // Tier 1: own-text exact match (strongest).
  const exact = all.filter((el) => ownText(el) === target);
  if (exact.length === 1) return exact[0] ?? null;
  if (exact.length > 1) return null; // ambiguous — don't guess

  // Tier 2: fall back to the leaf-most element whose full text equals the
  // target (handles inline-wrapped text that has no single own-text node), and
  // only when that match is unique.
  const fullEq = all.filter(
    (el) => normalizeText(el.textContent) === target,
  );
  if (fullEq.length === 1) return fullEq[0] ?? null;
  if (fullEq.length > 1) {
    // Prefer the deepest, but only if it's unambiguously deeper than the rest.
    const deepest = fullEq.reduce((a, b) => (depth(b) > depth(a) ? b : a));
    const tiesAtDepth = fullEq.filter((el) => depth(el) === depth(deepest));
    return tiesAtDepth.length === 1 ? deepest : null;
  }

  return null;
}

/** An element's own (direct) text content, normalized — excludes descendants. */
function ownText(el: Element): string {
  let s = "";
  for (const node of Array.from(el.childNodes)) {
    if (node.nodeType === 3 /* Node.TEXT_NODE */) s += node.textContent ?? "";
  }
  return normalizeText(s);
}

function normalizeText(s: string | null): string {
  return (s ?? "").replace(/\s+/g, " ").trim().toLowerCase();
}

function depth(el: Element): number {
  let d = 0;
  let n: Element | null = el;
  while (n) {
    d++;
    n = n.parentElement;
  }
  return d;
}

/** CSS.escape with a tiny fallback for non-browser test environments. */
function cssEscape(s: string): string {
  if (typeof CSS !== "undefined" && typeof CSS.escape === "function") {
    return CSS.escape(s);
  }
  return s.replace(/[^a-zA-Z0-9_-]/g, (ch) => `\\${ch}`);
}

function cssAttrEscape(s: string): string {
  return s.replace(/["\\]/g, (ch) => `\\${ch}`);
}
