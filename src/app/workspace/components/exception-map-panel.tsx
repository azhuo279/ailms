"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MapPinOff } from "lucide-react";
import type { Map as MapLibreMap, Marker as MapLibreMarker } from "maplibre-gl";
// CSS is a side-effect import (no `window` access) so it can live at module top
// level in this client component; the JS runtime is still loaded dynamically in
// the effect below to keep it out of the server bundle.
import "maplibre-gl/dist/maplibre-gl.css";
import { cn } from "@/lib/utils";
import { Spinner } from "@/components/ui/spinner";
import { ClusterMarker } from "./exception-map-cluster-marker";
import {
  ExceptionHoverPopover,
  type HoverPreviewTarget,
} from "./exception-hover-popover";
import { getWarehouse } from "@/app/workspace/lib/exception-format";
import type {
  ExceptionQueue,
  ExceptionRecord,
  PriorityTier,
  Warehouse,
} from "@/app/workspace/lib/exception-types";

export interface MapCluster {
  key: string;
  /** Warehouse id — the site this cluster belongs to (feed-filter key). */
  warehouseId: string;
  /** Real geographic centroid of the grouped exceptions. */
  lng: number;
  lat: number;
  /** Human-readable location of the anchoring warehouse, for labels. */
  location: string;
  topTier: PriorityTier;
  /** True when every exception here is escalated/delegated (being handled). */
  allHandled: boolean;
  exceptions: ExceptionRecord[];
  warehouse: Warehouse | undefined;
}

/** An exception's queue counts as "being handled" once it leaves pending. */
function isHandledQueue(queue: ExceptionQueue): boolean {
  return queue === "escalated" || queue === "delegated";
}

/**
 * Groups exceptions by their anchoring warehouse so pins that share a site
 * render as one count marker (FR-52 — warehouse-anchored map pins). Coordinates
 * and the location label are DERIVED from the warehouse registry, the single
 * source of geographic truth. A warehouse with null coordinates (or unresolved
 * FK) does not plot — those exceptions surface via the no-geodata indicator and
 * the feed list, never silently dropped.
 */
function bucketIntoClusters(
  exceptions: ExceptionRecord[],
  warehouseMap: Map<string, Warehouse>,
): MapCluster[] {
  const buckets = new Map<
    string,
    { warehouse: Warehouse; group: ExceptionRecord[] }
  >();

  for (const exception of exceptions) {
    const warehouse = getWarehouse(exception, warehouseMap);
    if (!warehouse || warehouse.coordinates === null) continue;
    const existing = buckets.get(warehouse.id);
    if (existing) existing.group.push(exception);
    else buckets.set(warehouse.id, { warehouse, group: [exception] });
  }

  return Array.from(buckets.entries()).map(([key, { warehouse, group }]) => {
    // Lowest tier string (T1 < T2 < ...) is the highest severity.
    const topTier = group.reduce<PriorityTier>(
      (acc, e) => (e.priorityTier < acc ? e.priorityTier : acc),
      "T4",
    );
    return {
      key,
      warehouseId: warehouse.id,
      lng: warehouse.coordinates!.lng,
      lat: warehouse.coordinates!.lat,
      location: warehouse.location,
      topTier,
      allHandled: group.every((e) => isHandledQueue(e.queue)),
      exceptions: group,
      warehouse,
    };
  });
}

/**
 * Keyless, lightweight VECTOR basemap — CARTO's hosted Positron GL style, a
 * muted near-white basemap so the severity-colored markers are the only
 * saturated layer. Keyless so it works out of the box in this mock-first repo.
 *
 * FLAGGED (Step 11a): `basemaps.cartocdn.com` is CARTO's public style endpoint,
 * fine for development. A production deployment should move to a self-hosted or
 * account-scoped style and honor CARTO's attribution/usage terms.
 */
const BASEMAP_STYLE =
  "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json";

// Continental-US framing default, used when there are no plottable exceptions.
const DEFAULT_CENTER: [number, number] = [-98.35, 39.5];
const DEFAULT_ZOOM = 3.2;

export interface ExceptionMapPanelProps {
  exceptions: ExceptionRecord[];
  /** Warehouse registry — the source of each pin's coordinates + location. */
  warehouseMap: Map<string, Warehouse>;
  selectedId: string | null;
  /** Exception hovered in the feed — its map pin lifts + pulses as a visual link. */
  hoveredId?: string | null;
  /**
   * Exceptions that could not plot (their warehouse has no coordinates). Never
   * silently dropped: surfaced via a corner indicator that snaps the feed to
   * them via `onShowOffMap` (FR-52).
   */
  offMapExceptions?: ExceptionRecord[];
  onShowOffMap?: () => void;
  /** Called when a single-exception marker is clicked — passes the exception id. */
  onSelect?: (id: string) => void;
  /** Called when a cluster marker is clicked — narrows the feed to that warehouse. */
  onFilterWarehouse?: (warehouseId: string) => void;
  /** Called when a map marker is hovered — passes the exception id, or null on leave. */
  onHoverChange?: (id: string | null) => void;
  /** Compact inset mode — the persistent small map beside an open detail view. */
  inset?: boolean;
  nowMs?: number;
  className?: string;
}

/**
 * Right pane of the workspace split — a real MapLibre GL map that acts as one
 * half of a linked triage instrument. SSR-safe: `maplibre-gl` is imported
 * dynamically inside an effect so its WebGL/`window` access never runs during
 * server render. Each marker is the shared `ClusterMarker`, rendered into the
 * MapLibre marker element via its own React root.
 *
 * Markers are interactive: clicking a pin selects its top-priority exception
 * via `onSelect`; hovering a pin lifts + pulses it and sets `onHoverChange`
 * so the linked feed card highlights in sync. The selected pin is visually
 * distinguished by a focus-ring ring.
 *
 * In `inset` mode the map shrinks to a compact persistent context panel (no
 * nav control) that keeps the active pin visible while the detail view owns
 * the pane.
 */
export function ExceptionMapPanel({
  exceptions,
  warehouseMap,
  selectedId,
  hoveredId = null,
  offMapExceptions = [],
  onShowOffMap,
  onSelect,
  onFilterWarehouse,
  onHoverChange,
  inset = false,
  nowMs,
  className,
}: ExceptionMapPanelProps) {
  const clusters = useMemo(() => {
    const all = bucketIntoClusters(exceptions, warehouseMap);
    // Inset is a static locator for the OPEN exception: plot only the pin for
    // the selected exception's site, never the whole filtered set. The full map
    // (no selection) keeps every cluster.
    if (inset && selectedId) {
      return all.filter((c) => c.exceptions.some((e) => e.id === selectedId));
    }
    return all;
  }, [exceptions, warehouseMap, inset, selectedId]);

  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  // Each marker keeps its cluster + React root so its VISUAL state (selected /
  // hovered / handled) can be re-rendered in place, without tearing down and
  // recreating the MapLibre marker on every hover (that caused pin flicker).
  const markersRef = useRef<
    { cluster: MapCluster; marker: MapLibreMarker; root: Root }[]
  >([]);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const [mapError, setMapError] = useState(false);

  const [nowMsLocal] = useState(() => nowMs ?? Date.now());

  // Hover popover — pinned to the marker's screen position. Null = hidden.
  const [popoverTarget, setPopoverTarget] = useState<HoverPreviewTarget | null>(
    null,
  );
  // Timer to delay dismissal so the pointer can travel from pin to popover.
  const popoverCloseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Stable refs for callbacks — event listeners read these so they always see
  // the latest handler without requiring the marker build effect to re-run.
  const onSelectRef = useRef(onSelect);
  const onFilterWarehouseRef = useRef(onFilterWarehouse);
  const onHoverChangeRef = useRef(onHoverChange);
  // setPopoverTarget is stable (React guarantee) so no update needed.
  const setPopoverRef = useRef(setPopoverTarget);
  const insetRef = useRef(inset);
  useEffect(() => {
    onSelectRef.current = onSelect;
    onFilterWarehouseRef.current = onFilterWarehouse;
    onHoverChangeRef.current = onHoverChange;
    insetRef.current = inset;
  });

  // Renders one marker's ClusterMarker into its root with the current visual
  // state. Reused by both the build effect and the in-place state-update effect
  // so a hover/select never recreates the MapLibre marker itself (that churn
  // caused pin flicker + unstable click targets on hover).
  const renderMarker = useCallback(
    (cluster: MapCluster, root: Root) => {
      const isSelected = cluster.exceptions.some((e) => e.id === selectedId);
      const isHovered = cluster.exceptions.some((e) => e.id === hoveredId);
      root.render(
        <ClusterMarker
          topTier={cluster.topTier}
          count={cluster.exceptions.length}
          selected={isSelected}
          hovered={isHovered}
          handled={cluster.allHandled}
          label={
            cluster.exceptions.length > 1
              ? `${cluster.exceptions.length} exceptions at ${cluster.location}`
              : `${cluster.exceptions[0].headline}, ${cluster.location}`
          }
        />,
      );
    },
    [selectedId, hoveredId],
  );

  // Create the map once, client-side only.
  useEffect(() => {
    let cancelled = false;
    let map: MapLibreMap | null = null;

    (async () => {
      if (!containerRef.current) return;
      try {
        const maplibre = await import("maplibre-gl");
        if (cancelled || !containerRef.current) return;

        // In the compact inset the map is a STATIC locator for the open
        // exception, not an interactive surface: disable every gesture up front
        // via the constructor options so it never pans/zooms/rotates.
        const isInset = insetRef.current;
        map = new maplibre.Map({
          container: containerRef.current,
          style: BASEMAP_STYLE,
          center: DEFAULT_CENTER,
          zoom: DEFAULT_ZOOM,
          attributionControl: { compact: true },
          interactive: !isInset,
          dragPan: !isInset,
          scrollZoom: !isInset,
          boxZoom: !isInset,
          dragRotate: !isInset,
          doubleClickZoom: !isInset,
          touchZoomRotate: !isInset,
          keyboard: !isInset,
        });
        // No zoom/nav chrome in the compact inset — it is context, not a
        // primary interaction surface there.
        if (!isInset) {
          map.addControl(
            new maplibre.NavigationControl({ showCompass: false }),
            "top-right",
          );
        }
        // The container is absolutely positioned inside nested `flex-1`/`min-h-0`
        // panes, so at the moment MapLibre reads its size it can measure 0×0 and
        // initialize to a zero-size (blank) canvas that never re-reads its bounds.
        // A ResizeObserver forces a `resize()` once the pane has real dimensions,
        // so the basemap and markers actually paint (fix: blank map).
        const resizeObserver = new ResizeObserver(() => map?.resize());
        resizeObserver.observe(containerRef.current);
        resizeObserverRef.current = resizeObserver;
        map.on("load", () => {
          if (!cancelled) {
            map?.resize();
            setMapReady(true);
          }
        });
        map.on("error", (event) => {
          if (!cancelled && !("tile" in (event as object))) setMapError(true);
        });
        mapRef.current = map;
      } catch {
        if (!cancelled) setMapError(true);
      }
    })();

    return () => {
      cancelled = true;
      resizeObserverRef.current?.disconnect();
      resizeObserverRef.current = null;
      markersRef.current.forEach(({ marker, root }) => {
        marker.remove();
        queueMicrotask(() => root.unmount());
      });
      markersRef.current = [];
      map?.remove();
      mapRef.current = null;
    };
  }, []);

  // BUILD markers — only when the plotted set itself changes (clusters, map
  // readiness, inset mode). Visual state (selected/hovered/handled) is NOT a
  // dependency here; a separate effect re-renders it in place so a hover never
  // tears down and recreates the MapLibre markers.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;

    let disposed = false;
    const previous = markersRef.current;
    markersRef.current = [];

    (async () => {
      const maplibre = await import("maplibre-gl");
      if (disposed) return;

      const next: { cluster: MapCluster; marker: MapLibreMarker; root: Root }[] =
        [];
      for (const cluster of clusters) {
        const el = document.createElement("div");
        el.style.cursor = "pointer";

        // Stop mousedown propagation so MapLibre's drag handler doesn't
        // capture the event before the click can fire on the marker.
        el.addEventListener("mousedown", (e) => e.stopPropagation());

        el.addEventListener("click", () => {
          if (cluster.exceptions.length === 1) {
            const id = cluster.exceptions[0].id;
            onSelectRef.current?.(id);
          } else {
            onFilterWarehouseRef.current?.(cluster.warehouseId);
          }
        });

        el.addEventListener("mouseenter", () => {
          // Cancel any pending close so crossing from pin to popover stays open.
          if (popoverCloseTimer.current !== null) {
            clearTimeout(popoverCloseTimer.current);
            popoverCloseTimer.current = null;
          }
          const rect = el.getBoundingClientRect();
          setPopoverRef.current({
            x: rect.left + rect.width / 2,
            y: rect.top,
            exceptions: cluster.exceptions,
            warehouse: cluster.warehouse,
          });
          const firstId = cluster.exceptions[0]?.id;
          if (firstId) onHoverChangeRef.current?.(firstId);
        });

        el.addEventListener("mouseleave", () => {
          popoverCloseTimer.current = setTimeout(() => {
            setPopoverRef.current(null);
            popoverCloseTimer.current = null;
          }, 120);
          onHoverChangeRef.current?.(null);
        });

        const root = createRoot(el);
        renderMarker(cluster, root);
        const marker = new maplibre.Marker({ element: el })
          .setLngLat([cluster.lng, cluster.lat])
          .addTo(map);
        next.push({ cluster, marker, root });
      }
      markersRef.current = next;

      // Frame the plotted exceptions. In the inset the set is already narrowed
      // to the selected exception's single site, so this centers + zooms onto
      // that pin (a tighter zoom than the full map, since it is a locator).
      if (clusters.length === 1) {
        map.easeTo({
          center: [clusters[0].lng, clusters[0].lat],
          zoom: inset ? 8 : 6,
          duration: 400,
        });
      } else if (clusters.length > 1) {
        const bounds = new maplibre.LngLatBounds();
        clusters.forEach((c) => bounds.extend([c.lng, c.lat]));
        map.fitBounds(bounds, {
          padding: inset ? 40 : 64,
          maxZoom: 7,
          duration: 400,
        });
      }
    })();

    return () => {
      disposed = true;
      // Clear any open popover and pending close timer.
      if (popoverCloseTimer.current !== null) {
        clearTimeout(popoverCloseTimer.current);
        popoverCloseTimer.current = null;
      }
      setPopoverRef.current(null);
      previous.forEach(({ marker, root }) => {
        marker.remove();
        queueMicrotask(() => root.unmount());
      });
    };
    // renderMarker is intentionally omitted: it changes on every hover/select,
    // and re-running the build on those would defeat the whole point. The
    // in-place update effect below carries state changes into existing roots.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clusters, mapReady, inset]);

  // UPDATE marker visual state in place — re-render each existing root with the
  // current selected/hovered treatment, without recreating any MapLibre marker.
  useEffect(() => {
    if (!mapReady) return;
    for (const { cluster, root } of markersRef.current) {
      renderMarker(cluster, root);
    }
  }, [mapReady, renderMarker]);

  const offMapCount = offMapExceptions.length;

  return (
    <div
      className={cn(
        "relative flex h-full min-w-0 flex-col overflow-hidden bg-surface-raised border border-border-subtle rounded-lg",
        className,
      )}
    >
      <div className="relative min-h-0 flex-1">
        {/*
          The layout slot (absolute inset-0) lives on this WRAPPER, never on the
          MapLibre container itself: maplibre-gl.css forces `position: relative`
          on `.maplibregl-map`, which collapses an `absolute`/`inset-0` container
          to 0×0. The inner ref div is sized `h-full w-full` so MapLibre always
          gets a definite box (agentic-spar BaseMapCanvas pattern).
        */}
        <div
          className="absolute inset-0"
          role="img"
          aria-label="Map showing geographic clusters of active exceptions. A list equivalent is always available in the feed pane to the left."
        >
          <div ref={containerRef} className="h-full w-full" />
        </div>

        {mapError ? (
          <div className="absolute inset-0 flex items-center justify-center bg-surface-sunken p-6 text-center">
            <p className="text-body-s text-fg-muted">
              The map could not load. Every plotted exception is also in the
              feed list to the left.
            </p>
          </div>
        ) : null}

        {!mapReady && !mapError ? (
          <div className="absolute inset-0 flex items-center justify-center bg-surface-sunken">
            <Spinner label="Loading map" className="size-6" />
          </div>
        ) : null}

        {/* Informational hover popover — portalled to document.body. Stays open
            while the pointer is over either the pin or the popover itself. */}
        {popoverTarget !== null ? (
          <ExceptionHoverPopover
            target={popoverTarget}
            nowMs={nowMsLocal}
            onPointerEnter={() => {
              if (popoverCloseTimer.current !== null) {
                clearTimeout(popoverCloseTimer.current);
                popoverCloseTimer.current = null;
              }
            }}
            onPointerLeave={() => {
              popoverCloseTimer.current = setTimeout(() => {
                setPopoverTarget(null);
                popoverCloseTimer.current = null;
              }, 120);
            }}
          />
        ) : null}

        {/* No-geodata corner indicator (FR-52). Exceptions whose warehouse has
            no coordinates never plot, so they are surfaced here with a link that
            snaps the feed to them, rather than being silently dropped. Hidden in
            the compact inset. */}
        {!inset && offMapCount > 0 && !mapError ? (
          <button
            type="button"
            onClick={onShowOffMap}
            className="absolute bottom-3 left-3 z-10 inline-flex items-center gap-2 rounded-lg border border-border-subtle bg-surface-overlay/95 px-3 py-2 text-left shadow-md backdrop-blur transition-colors hover:bg-option-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
          >
            <MapPinOff className="size-4 shrink-0 text-fg-muted" aria-hidden="true" />
            <span className="text-caption text-fg-secondary">
              <span className="font-semibold text-fg-primary">
                {offMapCount}
              </span>{" "}
              {offMapCount === 1 ? "exception" : "exceptions"} not on map,{" "}
              <span className="font-medium text-link">show in feed</span>
            </span>
          </button>
        ) : null}
      </div>

    </div>
  );
}
