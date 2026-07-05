import { S as StarlingServerOptions } from '../server-CnuOIrqn.js';

/**
 * `withStarling()` — the one-line, dev-only Next config wrapper that registers
 * Starling's source-stamping loader. Wrap your existing config:
 *
 *   import { withStarling } from "@starling/dev/next/config";
 *   const nextConfig = { ...your config... };
 *   export default withStarling(nextConfig);
 *
 * Properties:
 * - **No-op in production** (and when `enabled: false`): returns your config
 *   untouched, so nothing is registered in prod builds.
 * - **Auto-mounts the endpoints:** on dev startup it creates the App Router route
 *   file (`<app>/api/starling/[action]/route.ts`) that serves save/list/load, so
 *   you only touch `next.config`. Idempotent; opt out with `autoRoute: false`.
 *   (Next has no config seam to register a route at runtime — unlike Vite — so
 *   the file must exist on disk; this just writes it for you.)
 * - **Composes:** spreads your config and chains any existing `webpack(...)` fn
 *   last, so your customizations win.
 * - Registers the source-stamping loader on the **webpack** dev rule.
 *
 * Caveat (PRD §12): Turbopack — Next's default dev engine — does not reliably run
 * a Babel-AST loader (its loader model is for simple text rewriting; registering
 * one re-processes the loader output and doubles the module extension). So this
 * wrapper does NOT add a Turbopack rule. On the default Turbopack dev server
 * Starling runs WITHOUT Tier-1 source stamping and relies on its selector
 * locators — fully functional either way (source attributes are an enrichment,
 * and are pure DOM, so Rewind/anchoring are unaffected). For guaranteed source
 * stamping, run the host with `next dev --webpack`.
 */
interface WithStarlingOptions {
    /** Project root used to make stamped paths repo-relative. Default: cwd. */
    root?: string;
    /** Force enable/disable. Default: enabled only outside production. */
    enabled?: boolean;
    /**
     * Auto-create the App Router route file that serves save/list/load on dev
     * startup (Next has no config seam to mount routes — the file must exist on
     * disk). Idempotent: skipped when the file already exists. Default: true.
     * Set false to manage the route file yourself.
     */
    autoRoute?: boolean;
    /**
     * Where the app directory lives, relative to `root`. Default: auto-detect —
     * `src/app` if present, else `app`. Set explicitly to override.
     */
    appDir?: "src/app" | "app";
}
declare function withStarling<T extends Record<string, any>>(nextConfig?: T, opts?: WithStarlingOptions): T;

/**
 * Next App Router route handlers for Starling's SAVE/LIST/LOAD endpoints. Next's
 * dev server has no `next.config` middleware seam (unlike Vite), so the host drops
 * ONE catch-all route file in that re-exports these. Authorship is stamped here,
 * server-side, from `git config user.name`.
 *
 *   // app/api/starling/[action]/route.ts
 *   import { createStarlingRoute } from "@starling/dev/next/config";
 *   export const { GET, POST } = createStarlingRoute();
 *
 * The `[action]` segment ("save" | "list" | "load") is read from the URL, so a
 * single file serves all three. Match the component's endpoints to this path
 * (the defaults already do):
 *
 *   <Starling
 *     saveEndpoint="/api/starling/save"
 *     listEndpoint="/api/starling/list"
 *     loadEndpoint="/api/starling/load"
 *   />
 */
declare function createStarlingRoute(options?: StarlingServerOptions): {
    GET: (req: Request) => Promise<Response>;
    POST: (req: Request) => Promise<Response>;
};

export { type WithStarlingOptions, createStarlingRoute, withStarling as default, withStarling };
