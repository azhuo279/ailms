import { defineConfig } from "tsup";

export default defineConfig([
  // Core runtime: framework-agnostic, browser-targeted, side-effect-free.
  // `react`/`react-dom` external — the core imports neither.
  {
    entry: { index: "src/index.ts" },
    format: ["esm"],
    target: "es2020",
    platform: "browser",
    dts: true,
    treeshake: true,
    clean: true,
    splitting: false,
    sourcemap: true,
    external: ["react", "react-dom"],
  },
  // React/Next drop-in mount components. Shipped UNBUNDLED (`bundle: false`) so
  // each file is transpiled in place: the source `"use client"` directive is
  // preserved verbatim (Next needs it), and the dynamic `import("../index.js")`
  // stays a real runtime import that resolves to the sibling core chunk — so the
  // heavy core never inflates these tiny entries and is loaded lazily, in dev.
  {
    entry: ["src/react/Starling.tsx", "src/next/index.ts"],
    outDir: "dist",
    format: ["esm"],
    target: "es2020",
    platform: "browser",
    bundle: false,
    dts: true,
    clean: false,
    sourcemap: true,
    external: ["react", "react-dom"],
    // Keep `process.env.NODE_ENV` LITERAL in the output so the HOST's bundler
    // evaluates the prod guard (and dead-code-eliminates the dev tool in prod).
    // Without this, esbuild folds it to "development" at our build time.
    define: { "process.env.NODE_ENV": "process.env.NODE_ENV" },
  },
  // Build-time plugins (Node): the Vite Babel helper and the Next config wrapper.
  {
    entry: {
      "plugin/vite": "plugin/vite.ts",
      "plugin/next": "plugin/next.ts",
      // The annotation data-access layer, emitted standalone so the agent
      // entrypoint + migration scripts (scripts/*.mjs) can import the built JS.
      "plugin/snapshots": "plugin/snapshots.ts",
    },
    format: ["esm"],
    target: "es2020",
    platform: "node",
    dts: true,
    treeshake: true,
    clean: false,
    splitting: false,
    sourcemap: true,
    external: ["@babel/core", "@babel/types", "vite", "next"],
  },
  // The webpack/Turbopack loader is emitted as CJS so bundlers can require() it.
  {
    entry: { "plugin/loader": "plugin/loader.ts" },
    format: ["cjs"],
    target: "es2020",
    platform: "node",
    dts: false,
    treeshake: true,
    clean: false,
    splitting: false,
    sourcemap: true,
    external: ["@babel/core", "@babel/types"],
  },
]);
