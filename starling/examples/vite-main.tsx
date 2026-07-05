/**
 * Example: mounting Starling in a Vite + React app.
 *
 * Add the dynamic import to your existing `src/main.tsx`. The `import.meta.env.DEV`
 * guard + dynamic import means nothing is bundled into production.
 *
 * To get saving (Compile) + Rewind working with the AUTHOR auto-stamped from
 * `git config user.name`, add the dev-server plugin to vite.config.ts — it mounts
 * the /api/starling/{save,list,load} routes the tool talks to:
 *
 *   // vite.config.ts
 *   import { defineConfig } from "vite";
 *   import react from "@vitejs/plugin-react";
 *   import { starling } from "@starling/dev/plugin/vite";
 *   export default defineConfig({ plugins: [react(), starling()] });
 *
 * No hand-written API route, and authorship is resolved server-side (the browser
 * can't read git). The endpoint paths below are the plugin's defaults.
 */
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

// ⬇ The "one line". Delete it to remove Starling entirely.
if (import.meta.env.DEV) {
  import("@starling/dev").then((m) =>
    m.mountStarling({
      saveEndpoint: "/api/starling/save",
      listEndpoint: "/api/starling/list",
      loadEndpoint: "/api/starling/load",
    }),
  );
}
