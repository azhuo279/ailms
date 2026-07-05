import type { Shortcuts } from "../types";
import { isInsideHost } from "../util/dom";

export type ShortcutAction =
  | "toggleMarkup"
  | "toggleVisible"
  | "toggleShowAll"
  | "escapeMarkup";

/**
 * Register keyboard shortcuts on the document (capture phase). Returns a teardown.
 *
 * Typing guard:
 *  - In the HOST app's own inputs we never hijack a key.
 *  - In our own shadow UI (e.g. a focused sticky textarea) we still fire
 *    *modifier* shortcuts (so `Alt+H` works mid-demo), but suppress bare-key
 *    shortcuts (M / A / Escape) so the user can type those letters into a note.
 *
 * `run` returns whether it actually handled the action; we only swallow the
 * event (`preventDefault`/`stopPropagation`) when it did. This lets a no-op
 * shortcut — e.g. Escape while markup is already off — pass through to the host.
 */
export function registerShortcuts(
  shortcuts: Shortcuts,
  run: (action: ShortcutAction) => boolean,
): () => void {
  const map = new Map<string, ShortcutAction>([
    [normalize(shortcuts.toggleMarkup), "toggleMarkup"],
    [normalize(shortcuts.toggleVisible), "toggleVisible"],
    [normalize(shortcuts.toggleShowAll), "toggleShowAll"],
    [normalize(shortcuts.escapeMarkup), "escapeMarkup"],
  ]);

  const handler = (e: KeyboardEvent) => {
    const combo = comboFromEvent(e);
    const action = map.get(combo);
    if (!action) return;

    // Resolve the REAL innermost target. Our sticky lives in a shadow root and
    // KeyboardEvents are composed, so `e.target` is retargeted to the shadow
    // HOST (a plain <div>) — which would defeat the typing check and let a bare
    // M/A toggle fire while a note is being typed. composedPath()[0] pierces the
    // shadow boundary to the actual focused element.
    const target = realTarget(e);
    if (isTypingTarget(target)) {
      // Host inputs are always off-limits; our own shadow allows modifier
      // combos through but not bare keys (which are likely being typed).
      if (!isInsideHost(target)) return;
      if (!hasModifier(e)) return;
    }

    if (!run(action)) return; // no-op action: leave the event for the host
    e.preventDefault();
    e.stopPropagation();
  };

  document.addEventListener("keydown", handler, true);
  return () => document.removeEventListener("keydown", handler, true);
}

/**
 * The innermost element the event actually originated from, looking through any
 * shadow boundary. A listener on `document` sees `e.target` retargeted to the
 * shadow host for composed events, so we read `composedPath()[0]` instead and
 * fall back to `e.target` when the path is unavailable.
 */
function realTarget(e: Event): Node | null {
  const path = e.composedPath?.();
  if (path && path.length > 0) return path[0] as Node;
  return e.target as Node | null;
}

/** A modifier (Ctrl/Meta/Alt) is held — Shift alone still counts as typing. */
function hasModifier(e: KeyboardEvent): boolean {
  return e.ctrlKey || e.metaKey || e.altKey;
}

function isTypingTarget(node: Node | null): boolean {
  if (!(node instanceof HTMLElement)) return false;
  const tag = node.tagName;
  return (
    tag === "INPUT" ||
    tag === "TEXTAREA" ||
    tag === "SELECT" ||
    node.isContentEditable
  );
}

function comboFromEvent(e: KeyboardEvent): string {
  const parts: string[] = [];
  if (e.ctrlKey) parts.push("Ctrl");
  if (e.metaKey) parts.push("Meta");
  if (e.altKey) parts.push("Alt");
  if (e.shiftKey) parts.push("Shift");
  // Use the physical key letter where possible (Alt can mutate e.key on some OSes).
  const key = keyName(e);
  if (key) parts.push(key);
  return parts.join("+");
}

function keyName(e: KeyboardEvent): string {
  if (e.code && /^Key[A-Z]$/.test(e.code)) return e.code.slice(3); // KeyA → A
  if (e.key.length === 1) return e.key.toUpperCase();
  return e.key;
}

function normalize(combo: string): string {
  const parts = combo
    .split("+")
    .map((p) => p.trim())
    .filter(Boolean);
  const mods: string[] = [];
  let key = "";
  for (const p of parts) {
    const lower = p.toLowerCase();
    if (lower === "ctrl" || lower === "control") mods.push("Ctrl");
    else if (lower === "meta" || lower === "cmd" || lower === "command") mods.push("Meta");
    else if (lower === "alt" || lower === "option") mods.push("Alt");
    else if (lower === "shift") mods.push("Shift");
    else key = p.length === 1 ? p.toUpperCase() : p;
  }
  const order = ["Ctrl", "Meta", "Alt", "Shift"];
  mods.sort((a, b) => order.indexOf(a) - order.indexOf(b));
  return [...mods, key].filter(Boolean).join("+");
}
