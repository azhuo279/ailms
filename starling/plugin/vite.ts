/* eslint-disable @typescript-eslint/no-explicit-any */
import starlingSourcePlugin, {
  type StarlingSourceOptions,
} from "./babel-plugin-starling-source";
import {
  listSnapshots,
  loadSnapshot,
  openInEditor,
  saveSnapshot,
  type OpenBody,
  type SaveBody,
  type StarlingServerOptions,
} from "./server";

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
export interface StarlingViteOptions extends StarlingServerOptions {
  /** Route prefix for the endpoints. Default: "/api/starling". */
  base?: string;
}

export function starling(options: StarlingViteOptions = {}): any {
  const base = (options.base ?? "/api/starling").replace(/\/$/, "");
  const serverOpts: StarlingServerOptions = {
    root: options.root,
    editor: options.editor,
  };

  return {
    name: "starling-endpoints",
    apply: "serve" as const, // dev server only
    configureServer(server: any) {
      server.middlewares.use(`${base}/save`, (req: any, res: any, next: any) => {
        if (req.method !== "POST") return next();
        // `appId` rides in the body (set by the <Starling/> prop).
        readJsonBody(req)
          .then(async (body: SaveBody) =>
            sendJson(res, 200, await saveSnapshot(body, serverOpts)),
          )
          .catch(() => sendJson(res, 500, { error: "save failed" }));
      });

      server.middlewares.use(`${base}/open`, (req: any, res: any, next: any) => {
        if (req.method !== "POST") return next();
        readJsonBody(req)
          .then(async (body: OpenBody) =>
            sendJson(res, 200, await openInEditor(body, serverOpts)),
          )
          .catch(() => sendJson(res, 500, { ok: false, error: "open failed" }));
      });

      server.middlewares.use(`${base}/list`, (req: any, res: any, next: any) => {
        if (req.method !== "GET") return next();
        const url = new URL(req.url ?? "", "http://localhost");
        const appId = url.searchParams.get("app") ?? "";
        listSnapshots(appId, serverOpts)
          .then((snapshots) => sendJson(res, 200, { snapshots }))
          .catch(() => sendJson(res, 200, { snapshots: [] }));
      });

      server.middlewares.use(`${base}/load`, (req: any, res: any, next: any) => {
        if (req.method !== "GET") return next();
        const url = new URL(req.url ?? "", "http://localhost");
        const appId = url.searchParams.get("app") ?? "";
        loadSnapshot(url.searchParams.get("file") ?? "", appId, serverOpts)
          .then((json) => {
            if (json == null) return sendJson(res, 404, { error: "not found" });
            res.statusCode = 200;
            res.setHeader("content-type", "application/json");
            res.end(json); // already-serialized Session JSON
          })
          .catch(() => sendJson(res, 404, { error: "not found" }));
      });
    },
  };
}

function readJsonBody(req: any): Promise<any> {
  return new Promise((resolvePromise, reject) => {
    let raw = "";
    req.on("data", (chunk: Buffer) => (raw += chunk));
    req.on("end", () => {
      try {
        resolvePromise(JSON.parse(raw || "{}"));
      } catch (err) {
        reject(err);
      }
    });
    req.on("error", reject);
  });
}

function sendJson(res: any, status: number, body: unknown): void {
  res.statusCode = status;
  res.setHeader("content-type", "application/json");
  res.end(JSON.stringify(body));
}

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
export function starlingBabelPlugin(
  options: StarlingSourceOptions = {},
): [typeof starlingSourcePlugin, StarlingSourceOptions] {
  return [starlingSourcePlugin, options];
}

export { starlingSourcePlugin };
export type { StarlingSourceOptions };
