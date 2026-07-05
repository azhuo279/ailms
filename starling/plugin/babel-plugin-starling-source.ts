import type * as Babel from "@babel/core";
import type { PluginObj } from "@babel/core";
import * as path from "node:path";

export interface StarlingSourceOptions {
  /** Project root; stamped paths are made relative to it. Default: cwd. */
  root?: string;
  /** Skip files matching these substrings (e.g. node_modules). */
  exclude?: string[];
}

const PATH_ATTR = "data-inspector-relative-path";
const LINE_ATTR = "data-inspector-line";
const COL_ATTR = "data-inspector-column";

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
export default function starlingSourcePlugin(
  babel: typeof Babel,
  options: StarlingSourceOptions = {},
): PluginObj {
  const t = babel.types;
  const root = options.root ?? process.cwd();
  const exclude = options.exclude ?? ["node_modules"];

  return {
    name: "starling-source",
    visitor: {
      JSXOpeningElement(nodePath, state) {
        const filename = (state.file?.opts?.filename as string | undefined) ?? "";
        if (!filename) return;
        if (exclude.some((frag) => filename.includes(frag))) return;

        const nameNode = nodePath.node.name;
        // Only host elements: <div>, <button>… (JSXIdentifier, lowercase start).
        if (!t.isJSXIdentifier(nameNode)) return;
        if (!/^[a-z]/.test(nameNode.name)) return;

        // Skip if already stamped (idempotent across re-runs / fast refresh).
        const already = nodePath.node.attributes.some(
          (attr) =>
            t.isJSXAttribute(attr) &&
            t.isJSXIdentifier(attr.name) &&
            attr.name.name === PATH_ATTR,
        );
        if (already) return;

        const loc = nodePath.node.loc;
        if (!loc) return;

        const rel = path
          .relative(root, filename)
          .split(path.sep)
          .join("/");

        nodePath.node.attributes.push(
          jsxAttr(t, PATH_ATTR, rel),
          jsxAttr(t, LINE_ATTR, String(loc.start.line)),
          jsxAttr(t, COL_ATTR, String(loc.start.column)),
        );
      },
    },
  };
}

function jsxAttr(t: typeof Babel.types, name: string, value: string) {
  return t.jsxAttribute(t.jsxIdentifier(name), t.stringLiteral(value));
}
