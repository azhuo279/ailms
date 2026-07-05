import type { NextConfig } from "next";
import path from "node:path";
import { withStarling } from "@starling/dev/next/config";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Pin the workspace root to this project; a parent-directory lockfile on the
  // Desktop otherwise makes Next infer the wrong root for build traces.
  outputFileTracingRoot: path.join(__dirname),
};

// Starling is currently disabled (the <Starling/> mount is commented out in
// app/layout.tsx). `withStarling()` in dev both scaffolds an API route into
// src/app and registers a webpack loader on every .tsx — on this OneDrive-synced
// tree that amplifies Next's file-watcher churn into frequent Fast Refresh
// recompiles, and each recompile remounts the layout-level <Canvas>, spinning up
// a new WebGL context and accelerating context-pool exhaustion (a driver of the
// AiAvatar "Context Lost" crash). So keep the config unwrapped while Starling is
// off. To re-enable Starling, uncomment its mount in app/layout.tsx AND swap the
// export below back to `withStarling(nextConfig)`.
const ENABLE_STARLING = false;

export default ENABLE_STARLING ? withStarling(nextConfig) : nextConfig;
