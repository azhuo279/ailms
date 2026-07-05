# Starling Tier-1 source plugin (optional)

Starling works **without** this plugin — it anchors every annotation with robust
selector/role/text locators, and the compiled artifact is fully usable. This
plugin is an **opt-in upgrade** that recovers a precise `source` (file + line) for
each annotation.

## Why you'd want it

On **React 19+**, the zero-config "read source off the fiber" path is gone:
React removed the `_debugSource` fiber field, and React 19.2 strips the `jsxDEV`
source object. So `source` will usually be `null` unless something stamps it at
build time.

This plugin stamps `data-inspector-relative-path` / `-line` / `-column` onto JSX
host elements during the dev build. Starling reads those attributes first
(Tier-1), so you get exact `file:line` links in the compiled artifact and even
sturdier re-anchoring after reload.

It stamps **only host elements** (lowercase tags like `<div>`, `<button>`), never
component instances, and is idempotent.

---

## Vite — first-class (recommended)

Vite's React plugin already runs Babel in dev, so wiring this in is clean and
reliable.

```ts
// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { starlingBabelPlugin } from "@starling/dev/plugin/vite";

export default defineConfig(({ mode }) => ({
  plugins: [
    react({
      babel: {
        // Dev only — never stamp production builds.
        plugins: mode === "development" ? [starlingBabelPlugin()] : [],
      },
    }),
  ],
}));
```

Optionally pass `{ root, exclude }`:

```ts
starlingBabelPlugin({ root: process.cwd(), exclude: ["node_modules", "/.next/"] });
```

Verify: enter markup mode, click an element, run **Compile** — entries should now
show `source` with `"tier": "attribute"` and a real `relativePath:lineNumber`.

---

## Next.js 16 — experimental, **not recommended** as the default

Next uses **SWC/Turbopack**, not Babel, by default. There is no clean, supported
way to add a JSX-attribute Babel plugin in Next dev without trade-offs:

- **Babel route:** adding a `.babelrc`/`babel.config.js` makes Next run Babel for
  your app. Under Turbopack (the Next 16 default) a built-in Babel loader is
  auto-enabled when a config is detected, but this is a slower, degraded path and
  it changes your host build — which violates Starling's non-invasiveness goal.
- **SWC Wasm plugin route:** an SWC component-annotate plugin under
  `experimental.swcPlugins` can stamp attributes natively, but SWC Wasm plugins
  are pinned to Next's internal SWC core version and are historically brittle
  across Next majors. Treat as experimental and pin versions carefully.

**Recommendation for Next 16:** ship **without** Tier-1 and rely on Starling's
selector baseline (which is ~100% reliable). The fiber still resolves the
enclosing **component name** for the highlight label even without source. If you
do want source links on Next, prototype the SWC-plugin path in a branch and pin
the SWC version — don't make it a hard dependency.

---

## How the runtime reads it

`src/inspector/source.ts` reads several attribute conventions, so this plugin
interoperates with existing tooling:

- `data-inspector-relative-path` / `-line` / `-column` (this plugin,
  react-dev-inspector)
- `data-source-file` / `-line` / `-column`
- `data-sentry-source-file` (Sentry/SWC annotate)

If any of those are already present on your elements, Starling will use them and
you may not need this plugin at all.
