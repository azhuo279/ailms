import type { TriggerDescriptor } from "../types";
import { buildFallbackLocators } from "./locators";
import { accessibleName } from "./a11y";

/**
 * Capture the control that opened the transient overlay an annotated element
 * lives in — so a marker that detaches when the overlay closes can re-summon it
 * (see Anchorer + Sticky reopen affordance).
 *
 * This is best-effort enrichment, exactly like source resolution: it returns
 * `null` for the common case (the element isn't inside an overlay, or no opener
 * is resolvable) and every consumer must work without it.
 *
 * Resolution, most → least precise:
 *   1. A control with `aria-controls` referencing the overlay (or any ancestor
 *      of `node`) — the unambiguous ARIA contract.
 *   2. `node` is inside an overlay (role=menu/dialog/listbox/… or [aria-modal])
 *      AND exactly one expanded control (`aria-expanded="true"`) exists — the
 *      common pattern for menus/popovers that omit `aria-controls`.
 * Anything ambiguous returns null rather than guessing the wrong opener.
 */
export function captureTrigger(node: Element): TriggerDescriptor | null {
  const doc = node.ownerDocument;
  if (!doc) return null;

  const expanded = Array.from(
    doc.querySelectorAll<HTMLElement>('[aria-expanded="true"]'),
  ).filter((el) => !el.contains(node)); // the opener is never inside its own overlay

  // 1) aria-controls pointing at the overlay (or an ancestor of node).
  for (const el of expanded) {
    const controls = el.getAttribute("aria-controls");
    if (!controls) continue;
    for (const refId of controls.split(/\s+/)) {
      const target = refId && doc.getElementById(refId);
      if (target && (target === node || target.contains(node))) {
        return describe(el);
      }
    }
  }

  // 2) node is inside a recognized overlay + a single expanded opener exists.
  if (isInsideOverlay(node) && expanded.length === 1) {
    return describe(expanded[0]!);
  }

  return null;
}

/** Walk ancestors for an overlay container (portalled menu/dialog/popover). */
function isInsideOverlay(node: Element): boolean {
  const OVERLAY_ROLES = new Set([
    "menu",
    "dialog",
    "alertdialog",
    "listbox",
    "tooltip",
    "grid", // combobox popups
  ]);
  let el: Element | null = node;
  while (el && el !== el.ownerDocument?.body) {
    const role = el.getAttribute("role");
    if (role && OVERLAY_ROLES.has(role)) return true;
    if (el.hasAttribute("aria-modal")) return true;
    el = el.parentElement;
  }
  return false;
}

function describe(trigger: Element): TriggerDescriptor {
  const name = accessibleName(trigger).slice(0, 80);
  return {
    locators: buildFallbackLocators(trigger),
    label: name || trigger.tagName.toLowerCase(),
  };
}
