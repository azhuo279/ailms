/**
 * Route tagging + SPA navigation detection. Annotations are tagged with the
 * normalized route and only the current route's are rendered (PRD §7).
 */

/** Normalized route key. Pathname only — query/hash excluded by default. */
export function currentRoute(): string {
  return location.pathname || "/";
}

/**
 * Fire `cb` on client-side navigation. SPAs (Next App Router, React Router)
 * navigate via history.pushState/replaceState which emit no event, so we patch
 * them; popstate covers back/forward. Returns a teardown that restores the
 * original methods.
 */
export function onRouteChange(cb: () => void): () => void {
  const fire = () => {
    // Defer one tick so the router has updated location before we re-filter.
    Promise.resolve().then(cb);
  };

  const patched: Array<["pushState" | "replaceState", typeof history.pushState]> =
    [];

  for (const m of ["pushState", "replaceState"] as const) {
    const orig = history[m];
    patched.push([m, orig]);
    history[m] = function (this: History, ...args: unknown[]) {
      const result = orig.apply(
        this,
        args as Parameters<typeof history.pushState>,
      );
      fire();
      return result;
    } as typeof history.pushState;
  }

  window.addEventListener("popstate", fire);
  window.addEventListener("hashchange", fire);

  return () => {
    for (const [m, orig] of patched) history[m] = orig;
    window.removeEventListener("popstate", fire);
    window.removeEventListener("hashchange", fire);
  };
}
