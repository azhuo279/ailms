import * as Babel from '@babel/core';
import { PluginObj } from '@babel/core';
import { S as StarlingServerOptions } from '../server-CnuOIrqn.js';

interface StarlingSourceOptions {
    /** Project root; stamped paths are made relative to it. Default: cwd. */
    root?: string;
    /** Skip files matching these substrings (e.g. node_modules). */
    exclude?: string[];
}
/**
 * Babel plugin (Tier-1) that stamps source-location DOM attributes onto JSX
 * host elements (lowercase tag names) at build time — the only RELIABLE source
 * path on React 19, where the fiber source field was removed.
 *
 * Output:
 *   <div />  →  <div data-inspector-relative-path="src/X.tsx"
 *                    data-inspector-line="10" data-inspector-column="6" />
 *
 * Dev-only by design — wire it through @vitejs/plugin-react's babel.plugins so
 * it never runs in production builds (see plugin/vite.ts and plugin/README.md).
 *
 * NOTE: stamps only host (DOM) elements, identified by a lowercase first char,
 * so component instances aren't polluted. Starling annotates the exact host
 * element under the cursor, so this is exactly the data it needs.
 */
declare function starlingSourcePlugin(babel: typeof Babel, options?: StarlingSourceOptions): PluginObj;

/**
 * Vite plugin that mounts Starling's SAVE/LIST/LOAD dev-server endpoints so the
 * tool works the moment it's imported — no hand-written API route. Authorship is
 * stamped here, server-side, from `git config user.name` (the browser can't read
 * git), so saved snapshots and the Rewind list carry "… by <name>" automatically.
 *
 * Usage in vite.config.ts:
 *
 *   import { defineConfig } from "vite";
 *   import react from "@vitejs/plugin-react";
 *   import { starling } from "@starling/dev/plugin/vite";
 *
 *   export default defineConfig({ plugins: [react(), starling()] });
 *
 * Then point the component at the matching routes (these are the defaults):
 *
 *   <Starling
 *     saveEndpoint="/api/starling/save"
 *     listEndpoint="/api/starling/list"
 *     loadEndpoint="/api/starling/load"
 *   />
 *
 * Dev-only: the middleware lives on Vite's dev server and ships with nothing in a
 * production build.
 */
interface StarlingViteOptions extends StarlingServerOptions {
    /** Route prefix for the endpoints. Default: "/api/starling". */
    base?: string;
}
declare function starling(options?: StarlingViteOptions): any;
/**
 * Vite helper for enabling Starling Tier-1 source stamping. Vite's React plugin
 * already runs Babel in dev, so this is a clean, first-class integration.
 *
 * Usage in vite.config.ts:
 *
 *   import react from "@vitejs/plugin-react";
 *   import { starlingBabelPlugin } from "@starling/dev/plugin/vite";
 *
 *   export default defineConfig(({ mode }) => ({
 *     plugins: [
 *       react({
 *         babel: {
 *           plugins: mode === "development" ? [starlingBabelPlugin()] : [],
 *         },
 *       }),
 *     ],
 *   }));
 *
 * Returns the `[plugin, options]` tuple shape @vitejs/plugin-react expects.
 */
declare function starlingBabelPlugin(options?: StarlingSourceOptions): [typeof starlingSourcePlugin, StarlingSourceOptions];

export { type StarlingSourceOptions, type StarlingViteOptions, starling, starlingBabelPlugin, starlingSourcePlugin };
