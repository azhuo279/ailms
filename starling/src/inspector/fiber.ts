/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * React fiber access. We read React's *internal* structures defensively — the
 * shapes shift between versions, so every access is guarded.
 *
 * On React 19 the fiber no longer carries a usable source field (see
 * inspector/source.ts), but it DOES still carry the component name/hierarchy,
 * which we use for the "(in <Component>)" context label.
 */

// React's internal type. We never trust its shape — read defensively.
type Fiber = any;

/** Find the fiber attached to a host DOM node, if React mounted it. */
export function getFiberFromNode(node: Element): Fiber | null {
  const key = Object.keys(node).find(
    (k) =>
      k.startsWith("__reactFiber$") || k.startsWith("__reactInternalInstance$"),
  );
  return key ? ((node as any)[key] ?? null) : null;
}

/**
 * Host fibers have a string `type` (e.g. "div"); component fibers have a
 * function/object type (the component itself, or a memo/forwardRef wrapper).
 */
export function isComponentFiber(f: Fiber): boolean {
  const t = f?.type;
  return typeof t === "function" || (typeof t === "object" && t !== null);
}

/** Nearest ancestor (or self) fiber that is a component. */
export function nearestComponentFiber(f: Fiber | null): Fiber | null {
  let cur = f;
  while (cur) {
    if (isComponentFiber(cur)) return cur;
    cur = cur.return;
  }
  return null;
}

/** Resolve a display name from a component fiber, unwrapping memo/forwardRef. */
export function getComponentName(f: Fiber | null): string | null {
  const t = f?.type;
  if (!t || typeof t === "string") return null;
  return (
    t.displayName ||
    t.name ||
    (t.render && (t.render.displayName || t.render.name)) || // forwardRef
    (t.type && (t.type.displayName || t.type.name)) || // memo
    null
  );
}

/**
 * Walk component ancestors — available for the optional manual "widen to
 * enclosing component" step. NEVER used for default selection, which targets
 * the exact host element under the cursor (PRD §7).
 */
export function* ancestorComponents(f: Fiber | null): Generator<Fiber> {
  let cur = nearestComponentFiber(f);
  while (cur) {
    yield cur;
    cur = nearestComponentFiber(cur.return);
  }
}

/**
 * The nearest enclosing component that has a usable NAME, walking up past
 * anonymous wrappers (unnamed arrow functions, nameless memo/forwardRef). Many
 * leaf elements' immediate component is anonymous, so this recovers a
 * meaningful label far more often than `nearestComponentFiber` alone.
 * Bounded so we never traverse the whole tree on a deep app.
 */
export function nearestNamedComponentName(f: Fiber | null): string | null {
  let steps = 0;
  for (const comp of ancestorComponents(f)) {
    if (steps++ > 30) break;
    const name = getComponentName(comp);
    if (name) return name;
  }
  return null;
}
