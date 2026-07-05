/* eslint-disable @typescript-eslint/no-explicit-any */
import type { SourceLocation } from "../types";
import {
  getComponentName,
  nearestComponentFiber,
  nearestNamedComponentName,
} from "./fiber";

/**
 * Resolve the source location of the *annotated element itself* (its exact JSX
 * line), with the enclosing component name attached as context only.
 *
 * TIERED, best-effort — and on React 19 frequently `null`:
 *
 *  Tier 1 (attribute)  DOM attributes stamped by the optional build plugin
 *                      (plugin/). Survives SSR + needs no fiber. The ONLY
 *                      reliable source path on React 19. Opt-in.
 *  Tier 0 (fiber)      React's internal source field. Worked on React ≤18 in
 *                      Vite/Next dev with no config. On React 19 `_debugSource`
 *                      was removed and 19.2 strips the jsxDEV source object, so
 *                      this usually returns null here — kept as a cheap, harmless
 *                      opportunistic fallback.
 *  (none)              → null. Capture still proceeds with fallback locators.
 *
 * Returning null must NEVER throw or short-circuit anything downstream.
 */
export function resolveSource(
  node: Element,
  fiber: any,
  root: string | undefined,
): SourceLocation | null {
  // Tier 1: build-plugin attributes (preferred, robust).
  const attr = fromAttributes(node);
  if (attr) {
    attr.componentName =
      getComponentName(nearestComponentFiber(fiber)) ?? attr.componentName;
    return attr;
  }
  // Tier 0: fiber source (degraded on React 19; opportunistic).
  return fromFiber(fiber, root);
}

/**
 * The enclosing component name, resolved independently of source. This DOES
 * work on React 19 (the fiber still carries component types), so the highlight
 * label can show "in <Dashboard>" even when file:line is unavailable. Walks past
 * anonymous wrappers to the nearest NAMED component so leaf elements (whose
 * immediate component is often an unnamed arrow fn) still get a useful label.
 */
export function resolveComponentName(fiber: any): string | null {
  return nearestNamedComponentName(fiber);
}

/**
 * Tier 1 — read source attributes stamped by a build plugin. We accept several
 * conventions so we interoperate with whatever the host may already have on
 * (Starling's own plugin, react-dev-inspector, Sentry/SWC annotate).
 */
function fromAttributes(node: Element): SourceLocation | null {
  // Starling / react-dev-inspector convention.
  const path =
    node.getAttribute("data-inspector-relative-path") ??
    node.getAttribute("data-source-file") ??
    node.getAttribute("data-sentry-source-file");
  const line =
    node.getAttribute("data-inspector-line") ??
    node.getAttribute("data-source-line");
  if (!path || !line) return null;

  const colAttr =
    node.getAttribute("data-inspector-column") ??
    node.getAttribute("data-source-column");

  return {
    relativePath: path,
    lineNumber: Number(line),
    columnNumber: colAttr != null ? Number(colAttr) : null,
    componentName: null, // filled by caller from the fiber if available
    tier: "attribute",
  };
}

/**
 * Tier 0 — walk the fiber chain looking for a source field. Tries the historical
 * fields in order; expected to find nothing on React 19, which is fine.
 */
function fromFiber(fiber: any, root: string | undefined): SourceLocation | null {
  let f = fiber;
  while (f) {
    const dbg =
      f._debugSource ?? // React ≤18
      f.memoizedProps?.__source ?? // classic runtime __source prop
      f._debugInfo?.[0]; // React 19 defensive (usually absent/unusable)
    if (dbg?.fileName) {
      return {
        relativePath: toRelative(dbg.fileName, root),
        lineNumber: typeof dbg.lineNumber === "number" ? dbg.lineNumber : 0,
        columnNumber: typeof dbg.columnNumber === "number" ? dbg.columnNumber : null,
        componentName: getComponentName(nearestComponentFiber(f)),
        tier: "fiber",
      };
    }
    f = f.return;
  }
  return null;
}

/** fileName is usually absolute in dev. Strip to a repo-relative path. */
export function toRelative(fileName: string, root: string | undefined): string {
  if (root && fileName.startsWith(root)) {
    return fileName.slice(root.length).replace(/^[\\/]/, "");
  }
  const m = fileName.match(/(?:^|[\\/])(src|app|pages|components)[\\/].*/);
  return m ? m[0].replace(/^[\\/]/, "") : fileName;
}
