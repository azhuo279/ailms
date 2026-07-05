"use client";

import { useEffect } from "react";
import type { StarlingOptions } from "../types";

/**
 * Drop-in React mount for Starling — the "one line" embedding for React apps.
 *
 * Render it once, anywhere in the tree (e.g. at the end of your root layout):
 *
 *   import { Starling } from "@starling/dev/react";   // or "@starling/dev/next"
 *   <Starling saveEndpoint="/api/starling/save" />
 *
 * Guarantees:
 * - **Production no-op:** the dynamic `import()` is dead-code-eliminated under a
 *   `NODE_ENV` guard, so zero Starling bytes ship to prod.
 * - **SSR-safe / idempotent:** the heavy module + `mountStarling()` only run in a
 *   browser effect, and `mountStarling` self-guards against double-mount (HMR /
 *   React StrictMode).
 *
 * Removing Starling = delete this one element + the devDependency. No edits to
 * application source.
 */
export function Starling(props: StarlingOptions = {}): null {
  useEffect(() => {
    if (process.env.NODE_ENV === "production") return;
    let cancelled = false;
    // Lazy-load the heavy core only here, in dev. Shipped unbundled (see
    // tsup.config.ts), so this resolves to the sibling `../index.js` at runtime
    // and the core never inflates this entry.
    import("../index.js").then((m) => {
      if (!cancelled) m.mountStarling(props);
    });
    return () => {
      cancelled = true;
    };
    // Mount once; option changes after first mount are intentionally ignored
    // (the tool is a singleton keyed on window).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return null;
}

export default Starling;
