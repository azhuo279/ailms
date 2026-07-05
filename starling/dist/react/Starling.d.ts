interface Shortcuts {
    /** Toggle markup mode on/off. Default: M. */
    toggleMarkup: string;
    /** Toggle tool visibility (demo hide). Default: Alt+H. */
    toggleVisible: string;
    /** Toggle show-all-markup on/off. Default: A. */
    toggleShowAll: string;
    /**
     * Escape (turn OFF) markup mode. Unlike `toggleMarkup` this only ever turns
     * markup off — it's a no-op (and passes through to the host) when markup is
     * already off. Default: Escape.
     */
    escapeMarkup: string;
}
interface StarlingOptions {
    /**
     * Host-app identifier. Scopes every snapshot (save / Rewind list+load) in the
     * shared remote store, so one database can back many host apps. Sent to the
     * dev endpoints (in the save body, and as `?app=` on list/load). When omitted,
     * snapshots are scoped to the empty-string app.
     */
    appId?: string;
    /**
     * Absolute project root used to make source paths repo-relative. Optional —
     * when omitted, source.ts heuristically trims to the first src/app/pages dir.
     */
    projectRoot?: string;
    /** Keyboard shortcut overrides. */
    shortcuts?: Partial<Shortcuts>;
    /** Override the compiled artifact basename. Default: a dated, count-tagged name. */
    compileFilename?: string;
    /**
     * Dev-server endpoint that writes the compiled artifact into the host project's
     * `annotations/` folder. Compile POSTs `{ basename, markdown, sessionJson }`;
     * the server stamps authorship (`git config user.name`) and `savedAt` into the
     * session and writes BOTH `${basename}.md` and `${basename}.starling.json`. It
     * responds with `{ mdPath, jsonPath, author }` (author = the stamped
     * `git config user.name`, or null when git is unconfigured). There is no
     * browser-download fallback — Compile requires this endpoint. After a
     * successful save the client clears the live session and starts a fresh one.
     * Host-agnostic: the host supplies the route (e.g. a Next dev API route).
     */
    saveEndpoint?: string;
    /**
     * Dev-server endpoint that lists saved snapshots in `annotations/` for Rewind.
     * GET returns `{ snapshots: SnapshotMeta[] }` (newest first). When unset, the
     * Rewind sidebar shows only the live current session.
     */
    listEndpoint?: string;
    /**
     * Dev-server endpoint that loads one snapshot's Session JSON for Rewind.
     * GET `?file=<name>.starling.json` returns the raw Session JSON. Rewind always
     * restores from JSON, never from Markdown.
     */
    loadEndpoint?: string;
    /**
     * Dev-server endpoint that opens a component's source file in the local editor
     * (Cursor by default). Double-clicking an element in markup mode POSTs
     * `{ relativePath, lineNumber, columnNumber }`; the server resolves the path
     * against the project root and launches the editor at that line. Dev-only and
     * best-effort — when unset, or when source location is unavailable (no Tier-1
     * stamping), double-click is a no-op with a toast. Requires source stamping,
     * i.e. running the host with `next dev --webpack`.
     */
    openEndpoint?: string;
}

/**
 * Drop-in React mount for Starling — the "one line" embedding for React apps.
 *
 * Render it once, anywhere in the tree (e.g. at the end of your root layout):
 *
 *   import { Starling } from "@starling/dev/react";   // or "@starling/dev/next"
 *   <Starling saveEndpoint="/api/starling/save" />
 *
 * Guarantees:
 * - **Production no-op:** the dynamic `import()` is dead-code-eliminated under a
 *   `NODE_ENV` guard, so zero Starling bytes ship to prod.
 * - **SSR-safe / idempotent:** the heavy module + `mountStarling()` only run in a
 *   browser effect, and `mountStarling` self-guards against double-mount (HMR /
 *   React StrictMode).
 *
 * Removing Starling = delete this one element + the devDependency. No edits to
 * application source.
 */
declare function Starling(props?: StarlingOptions): null;

export { type StarlingOptions as S, Starling, Starling as default };
