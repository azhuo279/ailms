"use client";
/**
 * Next.js entry. Re-exports the drop-in `<Starling />` mount under a Next-flavored
 * import path so hosts can write `import { Starling } from "@starling/dev/next"`.
 * (The build-time config wrapper lives separately at `@starling/dev/next/config`.)
 */
export { Starling, default } from "../react/Starling.js";
export type { StarlingOptions } from "../types.js";
