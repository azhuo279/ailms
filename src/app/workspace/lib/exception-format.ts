import type {
  ExceptionRecord,
  SourceHealth,
  SourceHealthStatus,
  SourceSystem,
  Warehouse,
} from "./exception-types";

/**
 * Workspace-local formatting helpers for the exception feed. Kept out of the
 * card components so the timestamp rules (finding #10) and the source-status
 * vocabulary (finding #4) live in one testable place and stay consistent
 * across the card, the map overlay, and any future detail view.
 */

const HOUR_MS = 60 * 60 * 1000;

export interface RelativeTime {
  /** Short label, e.g. "1h ago" / "12m ago" / "just now". */
  short: string;
  /** Full absolute timestamp for a tooltip, e.g. "Jul 5, 2026, 2:28 PM CT". */
  absolute: string;
  /** True once the data is older than one hour — drives the amber stale tint. */
  isStale: boolean;
  /** Elapsed milliseconds, exposed for callers that need finer control. */
  elapsedMs: number;
}

/**
 * The single absolute-time convention for the whole workspace: "Jul 5, 2026,
 * 2:28 PM CT". Any place that renders an absolute timestamp MUST format through
 * this so the tooltip, the card, and any future detail view read identically.
 * `timeZoneName: "short"` is what actually produces the trailing zone label the
 * face relative label ("1h ago") points back to.
 */
const ABSOLUTE_FORMAT: Intl.DateTimeFormatOptions = {
  year: "numeric",
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
  timeZoneName: "short",
};

/**
 * Short relative label + absolute tooltip string + a >1h staleness flag.
 * Finding #10: replaces the verbose "1h 34m ago" with a single coarse unit
 * ("1h ago") and moves the exact time into the tooltip.
 */
export function formatRelativeTime(iso: string, nowMs: number): RelativeTime {
  const then = new Date(iso);
  const elapsedMs = Math.max(0, nowMs - then.getTime());
  const minutes = Math.round(elapsedMs / 60_000);

  let short: string;
  if (minutes < 1) {
    short = "just now";
  } else if (minutes < 60) {
    short = `${minutes}m ago`;
  } else {
    const hours = Math.floor(minutes / 60);
    if (hours < 24) {
      short = `${hours}h ago`;
    } else {
      const days = Math.floor(hours / 24);
      short = `${days}d ago`;
    }
  }

  return {
    short,
    absolute: new Intl.DateTimeFormat("en-US", ABSOLUTE_FORMAT).format(then),
    isStale: elapsedMs > HOUR_MS,
    elapsedMs,
  };
}

/**
 * Source epistemic status — how much we trust a source system's data right
 * now. Finding #4: source chips are tinted by this instead of a uniform gray.
 * Maps the live `sourceHealth` feed onto a small vocabulary reused by the
 * design system's status tones:
 * - verified → healthy source, data is confirmed (success tone)
 * - inferred → degraded source, values are estimated not confirmed (warning)
 * - stale    → down source, no fresh events (danger tone)
 * A source with no health record defaults to `verified` (assume good until the
 * feed says otherwise) rather than silently rendering it as an error.
 */
export type SourceEpistemicStatus = "verified" | "inferred" | "stale";

const HEALTH_TO_STATUS: Record<SourceHealthStatus, SourceEpistemicStatus> = {
  healthy: "verified",
  degraded: "inferred",
  down: "stale",
};

export const SOURCE_STATUS_LABEL: Record<SourceEpistemicStatus, string> = {
  verified: "Verified",
  inferred: "Inferred",
  stale: "Stale",
};

/** Builds a fast lookup from source-system name to its epistemic status. */
export function buildSourceStatusMap(
  sourceHealth: SourceHealth[],
): Map<SourceSystem, SourceEpistemicStatus> {
  const map = new Map<SourceSystem, SourceEpistemicStatus>();
  for (const source of sourceHealth) {
    map.set(source.system, HEALTH_TO_STATUS[source.status]);
  }
  return map;
}

export function getSourceStatus(
  system: SourceSystem,
  statusMap: Map<SourceSystem, SourceEpistemicStatus>,
): SourceEpistemicStatus {
  return statusMap.get(system) ?? "verified";
}

/**
 * Builds a fast lookup from warehouse id to its full record (PRD v1.6). Built
 * once in the workspace container and threaded down to the feed list, cards,
 * and map panel, mirroring the `buildSourceStatusMap` pattern so geographic +
 * name truth lives in one place.
 */
export function buildWarehouseMap(warehouses: Warehouse[]): Map<string, Warehouse> {
  const map = new Map<string, Warehouse>();
  for (const warehouse of warehouses) {
    map.set(warehouse.id, warehouse);
  }
  return map;
}

/**
 * Resolves the warehouse an exception is anchored to. Returns `undefined` when
 * the FK has no match in the registry (a data gap the caller should tolerate,
 * not crash on) — callers fall back to a neutral label and skip plotting.
 */
export function getWarehouse(
  exception: ExceptionRecord,
  warehouseMap: Map<string, Warehouse>,
): Warehouse | undefined {
  return warehouseMap.get(exception.warehouseId);
}
