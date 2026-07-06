import type { NextConfig } from "next";
import path from "node:path";
import { withStarling } from "@starling/dev/next/config";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Pin the workspace root to this project; a parent-directory lockfile on the
  // Desktop otherwise makes Next infer the wrong root for build traces.
  outputFileTracingRoot: path.join(__dirname),
};

// Starling source-stamping. When ENABLED, `withStarling()` scaffolds the
// save/list/load API route into src/app AND registers a webpack loader on every
// .tsx that runs Starling's Babel plugin in-memory (babelrc:false — it does NOT
// change how the rest of the app compiles) so annotations capture exact file:line
// (double-click-to-code). The <Starling/> mount in app/layout.tsx is gated on the
// same NEXT_PUBLIC_ENABLE_STARLING signal, so config + mount stay in sync.
//
// DISABLED on main (the Vercel deployment branch): Starling is a dev annotation
// tool and its API routes / remote store have no place in the public deploy.
// Re-enabled on the dev branch by setting NEXT_PUBLIC_ENABLE_STARLING=true.
//
// KNOWN TRADEOFF when enabled: on this OneDrive-synced tree the loader amplifies
// Next's file-watcher churn into frequent Fast Refresh recompiles; each recompile
// remounts the layout-level <Canvas>, spinning up a new WebGL context and
// accelerating context-pool exhaustion (a driver of the AiAvatar "Context Lost"
// crash). REQUIRED with this on: the dev server must run under WEBPACK, not
// Turbopack — Turbopack does not run the Babel-AST loader, so source stamping is
// silently skipped. On Next 15 webpack is the default, so `next dev` (no
// --turbopack flag) is correct; do NOT add --turbopack to the "dev" script while
// this is true.
const ENABLE_STARLING = process.env.NEXT_PUBLIC_ENABLE_STARLING === "true";

export default ENABLE_STARLING ? withStarling(nextConfig) : nextConfig;
