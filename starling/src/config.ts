import type { Shortcuts } from "./types";

/** Namespaced storage key — avoids global collisions (NFR isolation). */
export const STORAGE_KEY = "starling:session:default";

/** Shadow host element id. */
export const HOST_ID = "starling-root";

/** Idempotency flag on window — survives HMR + StrictMode double-mount. */
export const GLOBAL_FLAG = "__STARLING__";

export const DEFAULT_SHORTCUTS: Shortcuts = {
  toggleMarkup: "M",
  toggleVisible: "Alt+H",
  toggleShowAll: "A",
  escapeMarkup: "Escape",
};

export const DEFAULT_COMPILE_FILENAME = "starling-annotations.md";

/** Debounce window for localStorage writes (ms). */
export const SAVE_DEBOUNCE_MS = 300;

/** Caps for captured element context, to keep the artifact lean. */
export const MAX_OUTER_HTML = 400;
export const MAX_TEXT_CONTENT = 120;
