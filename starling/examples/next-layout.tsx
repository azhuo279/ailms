/**
 * Example: embedding Starling in a Next.js App Router app — the one-line drop-in.
 *
 * No hand-written mount component needed. The package ships a ready-made,
 * dev-only, SSR-safe client component. Render it once inside <body> in
 * `app/layout.tsx`:
 *
 *   import { Starling } from "@starling/dev/next";
 *   ...
 *   <body>
 *     {children}
 *     <Starling
 *       saveEndpoint="/api/starling/save"   // writes annotations/*.md + *.starling.json
 *       listEndpoint="/api/starling/list"   // Rewind: list saved snapshots
 *       loadEndpoint="/api/starling/load"   // Rewind: load one snapshot (JSON only)
 *     />
 *   </body>
 *
 * Those endpoints are served by an App Router route file — but you don't write
 * it. Wrapping `next.config.ts` with `withStarling()` auto-creates it on dev
 * startup (idempotent; opt out with `autoRoute: false`). The route stamps the
 * author from `git config user.name` (falling back to `user.email`) server-side.
 *
 *   // next.config.ts — the only file you touch
 *   import { withStarling } from "@starling/dev/next/config";
 *   export default withStarling(nextConfig);
 *
 * `withStarling()` also registers the dev-only source-stamping loader (no-op in
 * production). Note: on the default Turbopack dev server source stamping is
 * skipped and Starling uses its selector locators; run `next dev --webpack` for
 * Tier-1 source attributes. (Endpoints + author stamping work either way.)
 *
 * Prefer to manage the route yourself? Pass `autoRoute: false` and add the
 * three-line re-export from examples/next-route.ts.
 *
 * Remove Starling by deleting the <Starling /> element, unwrapping
 * `withStarling(...)`, deleting the generated route file, and uninstalling the
 * devDependency. No source edits.
 */
export {};
