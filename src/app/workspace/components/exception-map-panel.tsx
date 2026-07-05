"use client";

import { useMemo, useState } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { PriorityTierBadge } from "@/components/ui/priority-tier-badge";
import type { ExceptionRecord } from "@/app/workspace/lib/exception-types";

export interface MapCluster {
  key: string;
  /** Normalized 0-100 position within the map canvas, not real lat/lng math. */
  x: number;
  y: number;
  exceptions: ExceptionRecord[];
}

/**
 * Buckets exceptions with coordinates into a small set of on-canvas
 * positions. This is a stylized, token-driven placeholder visualization, not
 * a real geospatial projection — flagged gap, see Step 11a manifest: no map
 * library is a dependency in this project (checked package.json), and
 * CLAUDE.md instructs flagging rather than pulling in a new heavy mapping
 * dependency without confirmation. Coordinates are hashed into a stable
 * pseudo-position so the same exception always renders in the same spot
 * across re-renders and filter changes.
 */
function bucketIntoClusters(exceptions: ExceptionRecord[]): MapCluster[] {
  const withCoords = exceptions.filter((e) => e.coordinates !== null);
  const buckets = new Map<string, MapCluster>();

  for (const exception of withCoords) {
    const { lat, lng } = exception.coordinates!;
    // Coarse grid bucket so nearby exceptions cluster together visually.
    const gridX = Math.round(lng / 4);
    const gridY = Math.round(lat / 4);
    const key = `${gridX}:${gridY}`;

    // Map lng/lat roughly onto a 0-100 canvas (continental US framing).
    const x = Math.min(94, Math.max(6, ((lng + 125) / 60) * 100));
    const y = Math.min(90, Math.max(10, 100 - ((lat - 24) / 25) * 100));

    const existing = buckets.get(key);
    if (existing) {
      existing.exceptions.push(exception);
    } else {
      buckets.set(key, { key, x, y, exceptions: [exception] });
    }
  }

  return Array.from(buckets.values());
}

const TIER_DOT_CLASSES: Record<ExceptionRecord["priorityTier"], string> = {
  T1: "bg-severity-emphasis",
  T2: "bg-severity-emphasis/70",
  T3: "bg-warning-emphasis",
  T4: "bg-fg-muted",
};

export interface ExceptionMapPanelProps {
  exceptions: ExceptionRecord[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  className?: string;
}

/**
 * Right pane of the Row 3 split view. Renders exceptions with coordinates as
 * pins/clusters on a stylized placeholder canvas. Clicking a multi-exception
 * cluster expands it into a small list (Flow 4.1b steps G-H) rendered as a
 * portable overlay card anchored near the cluster. Exceptions without
 * coordinates are intentionally absent from the canvas (they still render in
 * the list pane) rather than silently dropped from the feed altogether.
 */
export function ExceptionMapPanel({ exceptions, selectedId, onSelect, className }: ExceptionMapPanelProps) {
  const clusters = useMemo(() => bucketIntoClusters(exceptions), [exceptions]);
  const [expandedClusterKey, setExpandedClusterKey] = useState<string | null>(null);
  const noGeoCount = exceptions.length - exceptions.filter((e) => e.coordinates !== null).length;

  const expandedCluster = clusters.find((c) => c.key === expandedClusterKey) ?? null;

  return (
    <div
      className={cn(
        "relative flex h-full flex-col overflow-hidden rounded-lg border border-border-subtle bg-surface-raised",
        className,
      )}
    >
      <div className="flex shrink-0 items-center justify-between border-b border-border-subtle px-4 py-3">
        <p className="text-label-l font-medium text-fg-primary">Exception map</p>
        {noGeoCount > 0 ? (
          <p className="text-caption text-fg-muted">{noGeoCount} without location data</p>
        ) : null}
      </div>

      <div
        className="relative min-h-0 flex-1 bg-[repeating-linear-gradient(0deg,var(--color-surface-sunken)_0,var(--color-surface-sunken)_1px,transparent_1px,transparent_32px),repeating-linear-gradient(90deg,var(--color-surface-sunken)_0,var(--color-surface-sunken)_1px,transparent_1px,transparent_32px)]"
        role="img"
        aria-label="Map showing geographic clusters of active exceptions. A list equivalent is always available in the feed pane to the left."
      >
        {clusters.map((cluster) => {
          const isMulti = cluster.exceptions.length > 1;
          const topTier = cluster.exceptions.reduce<ExceptionRecord["priorityTier"]>((acc, e) => {
            return e.priorityTier < acc ? e.priorityTier : acc;
          }, "T4");
          const isSelected = cluster.exceptions.some((e) => e.id === selectedId);

          return (
            <button
              key={cluster.key}
              type="button"
              style={{ left: `${cluster.x}%`, top: `${cluster.y}%` }}
              onClick={() => (isMulti ? setExpandedClusterKey(cluster.key) : onSelect(cluster.exceptions[0].id))}
              className={cn(
                "absolute flex -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full shadow-md transition-transform",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2",
                "hover:scale-110",
                isMulti ? "size-9 text-label-s font-semibold text-fg-on-primary" : "size-4",
                isSelected && "ring-2 ring-focus-ring ring-offset-2",
                TIER_DOT_CLASSES[topTier],
              )}
              aria-label={
                isMulti
                  ? `${cluster.exceptions.length} exceptions near ${cluster.exceptions[0].location}, expand to view`
                  : `${cluster.exceptions[0].headline}, ${cluster.exceptions[0].location}`
              }
            >
              {isMulti ? cluster.exceptions.length : null}
            </button>
          );
        })}
      </div>

      {expandedCluster ? (
        <div
          role="dialog"
          aria-label={`${expandedCluster.exceptions.length} exceptions in this cluster`}
          className="absolute inset-x-3 bottom-3 z-10 max-h-64 overflow-y-auto rounded-lg border border-border-strong bg-surface-overlay p-3 shadow-lg motion-safe:animate-[empty-state-rise-in_180ms_ease-out_both]"
        >
          <div className="mb-2 flex items-center justify-between">
            <p className="text-label-l font-medium text-fg-primary">
              {expandedCluster.exceptions.length} exceptions at {expandedCluster.exceptions[0].location}
            </p>
            <Button
              iconOnly
              variant="ghost"
              size="sm"
              icon={<X />}
              aria-label="Close cluster list"
              onClick={() => setExpandedClusterKey(null)}
            />
          </div>
          <ul className="flex flex-col gap-1">
            {expandedCluster.exceptions.map((exception) => (
              <li key={exception.id}>
                <button
                  type="button"
                  onClick={() => {
                    onSelect(exception.id);
                    setExpandedClusterKey(null);
                  }}
                  className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left transition-colors hover:bg-option-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-inset"
                >
                  <PriorityTierBadge tier={exception.priorityTier} />
                  <span className="min-w-0 flex-1 truncate text-body-s text-fg-primary">{exception.headline}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
