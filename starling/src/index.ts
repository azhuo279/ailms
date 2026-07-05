import { Starling } from "./Starling";
import { LocalStorageBackend } from "./store/backends/LocalStorageBackend";
import { GLOBAL_FLAG } from "./config";
import type { StarlingOptions } from "./types";

export type {
  StarlingOptions,
  Shortcuts,
  Annotation,
  Session,
  SourceLocation,
  FallbackLocator,
} from "./types";
export { compile } from "./compile/compile";

/** True when running in a development build, across Vite and webpack/Next. */
function isDevBuild(): boolean {
  // Vite: import.meta.env.DEV. Untyped here; guarded so it can't throw.
  try {
    // @ts-expect-error import.meta.env is bundler-injected and not typed
    if (typeof import.meta !== "undefined" && import.meta.env?.DEV) return true;
  } catch {
    /* import.meta unavailable in this context */
  }
  // webpack/Next/Node: process.env.NODE_ENV.
  if (
    typeof process !== "undefined" &&
    process.env &&
    process.env.NODE_ENV !== "production"
  ) {
    return true;
  }
  return false;
}

/**
 * Mount Starling. The "one line" the host adds in dev.
 *
 * No-op (and tree-shakeable) in production, on the server (SSR), and on repeat
 * calls (HMR / React StrictMode double-effect) — see PRD §8 zero-prod-footprint.
 */
export function mountStarling(opts: StarlingOptions = {}): void {
  if (typeof window === "undefined") return; // SSR guard (Next server pass)
  if (!isDevBuild()) return; // zero production footprint
  const w = window as unknown as Record<string, unknown>;
  if (w[GLOBAL_FLAG]) return; // idempotent across HMR / StrictMode
  w[GLOBAL_FLAG] = new Starling(new LocalStorageBackend(), opts);
}

/** Unmount and clean up. Mainly for tests / explicit teardown. */
export function unmountStarling(): void {
  if (typeof window === "undefined") return;
  const w = window as unknown as Record<string, unknown>;
  const inst = w[GLOBAL_FLAG] as Starling | undefined;
  if (inst) {
    inst.destroy();
    delete w[GLOBAL_FLAG];
  }
}
