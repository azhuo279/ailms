interface StarlingServerOptions {
    /** Project root used to resolve `git config` for authorship. Default: cwd. */
    root?: string;
    /**
     * Editor to open a component's source in on double-click. Default: "cursor"
     * (falls back to `STARLING_EDITOR`, then "cursor"). Currently understood:
     * "cursor" | "vscode". Future-configurable per host.
     */
    editor?: string;
}

export type { StarlingServerOptions as S };
