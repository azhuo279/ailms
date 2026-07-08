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
  // Cached after the one-time async import in the map init effect so the BUILD
  // markers effect can run fully synchronously. Avoids the async gap where
  // `previous` is captured as [] before the import resolves, causing orphaned
  // markers to accumulate (stacked hitboxes → hover loop).
  const maplibreRef = useRef<typeof import("maplibre-gl") | null>(null);
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
  // The exception id currently driving the hover LINK (the pin's first
  // exception). Kept in a ref so the popover's own pointer-enter can RE-ASSERT
  // the pin's hovered state: scale + halo + popover share ONE lifecycle and one
  // close timer, and none of the three is ever torn down while another lives.
  const activeHoverId = useRef<string | null>(null);
  // Two halves of ONE hover group — the pin and the popover surface. The pointer
  // moving between them is still "inside" the group. A deferred close only tears
  // everything down once BOTH are false, so it is immune to native event
  // ORDERING (the popover's pointerenter can fire before OR after the marker's
  // mouseleave; either way the guarded close aborts while a surface is hovered).
  const pinHovered = useRef(false);
  const popoverHovered = useRef(false);

  // Stable refs for callbacks — event listeners read these so they always see
  // the latest handler without requiring the marker build effect to re-run.
  const onSelectRef = useRef(onSelect);
  const onFilterWarehouseRef = useRef(onFilterWarehouse);
  const onHoverChangeRef = useRef(onHoverChange);
  const insetRef = useRef(inset);
  useEffect(() => {
    onSelectRef.current = onSelect;
    onFilterWarehouseRef.current = onFilterWarehouse;
    onHoverChangeRef.current = onHoverChange;
    insetRef.current = inset;
  });

  // ─── Unified hover lifecycle ───────────────────────────────────────────────
  // Scale/halo (driven by onHoverChange -> hoveredId) and the popover are ONE
  // interaction with ONE deferred-close timer. They open together, stay alive
  // together while the pointer is over the pin OR the popover surface, and tear
  // down together — never on split timelines (the old bug dropped the scale on
  // the immediate mouseleave while only deferring the popover close). These are
  // stable (empty/stable deps) so the marker build effect can bind them once.

  const cancelHoverClose = useCallback(() => {
    if (popoverCloseTimer.current !== null) {
      clearTimeout(popoverCloseTimer.current);
      popoverCloseTimer.current = null;
    }
  }, []);

  // Tear down ALL THREE (scale, halo, popover) at once — but ONLY if the pointer
  // is over neither the pin nor the popover. Guarding at fire time (not schedule
  // time) is what kills the flicker: a marker `mouseleave` that fires just after
  // the popover's `pointerenter` still schedules a close, but this guard aborts
  // it because the popover half of the group is now hovered.
  const runHoverClose = useCallback(() => {
    popoverCloseTimer.current = null;
    if (pinHovered.current || popoverHovered.current) return;
    activeHoverId.current = null;
    setPopoverTarget(null);
    onHoverChangeRef.current?.(null);
  }, []);

  // Defer the whole teardown so the pointer can cross the pin↔popover bridge.
  const scheduleHoverClose = useCallback(() => {
    cancelHoverClose();
    popoverCloseTimer.current = setTimeout(runHoverClose, 120);
  }, [cancelHoverClose, runHoverClose]);

  // Open (or refresh) the whole hover for a cluster from a single call, so the
  // scale/halo and popover can never desync. Works from ANY part of the marker
  // hit area (mouseenter fires for the padded container as a whole).
  const openHover = useCallback(
    (cluster: MapCluster, el: HTMLElement) => {
      pinHovered.current = true;
      cancelHoverClose();
      const rect = el.getBoundingClientRect();
      const firstId = cluster.exceptions[0]?.id ?? null;
      activeHoverId.current = firstId;
      setPopoverTarget({
        x: rect.left + rect.width / 2,
        y: rect.top,
        exceptions: cluster.exceptions,
        warehouse: cluster.warehouse,
      });
      if (firstId) onHoverChangeRef.current?.(firstId);
    },
    [cancelHoverClose],
  );

  // Pointer left the pin — mark the pin half not-hovered and defer the guarded
  // close (which aborts if it lands on the popover). Never drops the scale/halo
  // outright; the guarded timer owns the single teardown.
  const leavePin = useCallback(() => {
    pinHovered.current = false;
    scheduleHoverClose();
  }, [scheduleHoverClose]);

  // Pointer over the popover surface (incl. its invisible bridge): keep all
  // three alive — mark the popover half hovered, cancel the deferred close, and
  // re-assert the pin's hovered state so the scale/halo never drop.
  const enterPopover = useCallback(() => {
    popoverHovered.current = true;
    cancelHoverClose();
    if (activeHoverId.current) onHoverChangeRef.current?.(activeHoverId.current);
  }, [cancelHoverClose]);

  const leavePopover = useCallback(() => {
    popoverHovered.current = false;
    scheduleHoverClose();
  }, [scheduleHoverClose]);

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
        maplibreRef.current = maplibre;

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
      // Final unmount: clear any pending hover-close timer (the build effect no
      // longer owns this, so the teardown lives here where it runs exactly once).
      if (popoverCloseTimer.current !== null) {
        clearTimeout(popoverCloseTimer.current);
        popoverCloseTimer.current = null;
      }
      resizeObserverRef.current?.disconnect();
      resizeObserverRef.current = null;
      markersRef.current.forEach(({ marker, root }) => {
        marker.remove();
        queueMicrotask(() => root.unmount());
      });
      markersRef.current = [];
      map?.remove();
      mapRef.current = null;
      maplibreRef.current = null;
    };
  }, []);

  // BUILD markers — only when the plotted set itself changes (clusters, map
  // readiness, inset mode). Visual state (selected/hovered/handled) is NOT a
  // dependency here; a separate effect re-renders it in place so a hover never
  // tears down and recreates the MapLibre markers.
  //
  // This effect is intentionally synchronous: maplibreRef.current is cached by
  // the init effect so we never need to await import() here. The previous async
  // pattern had a race where `previous` was captured as [] before the import
  // resolved, so cleanup removed nothing and the new run created duplicate
  // markers at the same position (stacked hitboxes → hover flicker loop).
  useEffect(() => {
    const map = mapRef.current;
    const maplibre = maplibreRef.current;
    if (!map || !mapReady || !maplibre) return;

    // Tear down the previous set synchronously before building the new one —
    // no async gap means cleanup always has the real markers, never a stale [].
    const previous = markersRef.current;
    markersRef.current = [];
    previous.forEach(({ marker, root }) => {
      marker.remove();
      queueMicrotask(() => root.unmount());
    });

    const next: { cluster: MapCluster; marker: MapLibreMarker; root: Root }[] =
      [];
    for (const cluster of clusters) {
      const el = document.createElement("div");
      el.style.cursor = "pointer";
      // Pad the hit container so the scale-125 hover transform never escapes
      // el's layout box. CSS transforms expand the visual but not the hit area;
      // without padding the pointer leaves el the moment the marker scales up,
      // firing mouseleave → scale collapses → mouseenter → loop.
      // 10px absorbs scale-125 on the largest pin (40px × 1.25 = 50px;
      // 40 + 10×2 = 60px ≥ 50px).
      el.style.padding = "10px";
      el.style.display = "flex";
      el.style.alignItems = "center";
      el.style.justifyContent = "center";

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

      // Scale + halo + popover open together from a SINGLE call, from anywhere
      // on the padded hit area (mouseenter fires for the container as a whole).
      el.addEventListener("mouseenter", () => openHover(cluster, el));
      // Leaving the pin only marks the pin half not-hovered and DEFERS a guarded
      // close — the scale/halo are not dropped ahead of the popover, so crossing
      // onto the popover keeps all three alive.
      el.addEventListener("mouseleave", () => leavePin());

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

    return () => {
      // Remove ONLY the markers this run created — do NOT tear down the hover
      // popover here. The plotted set rebuilds on every background feed tick
      // (~9s), and warehouse-anchored pins keep their positions across it, so
      // nulling the popover on rebuild would make an open preview vanish under a
      // stationary pointer every few seconds. The hover GROUP (pin + popover
      // pointer events + the guarded close) owns the popover's lifecycle
      // exclusively; the marker DOM is recreated beneath it without disturbing
      // it. Because the effect is synchronous, markersRef.current always holds
      // exactly what this run built — no async gap where it could point to
      // someone else's markers.
      markersRef.current.forEach(({ marker, root }) => {
        marker.remove();
        queueMicrotask(() => root.unmount());
      });
      markersRef.current = [];
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
            // Entering the popover (incl. its bridge) keeps ALL THREE alive:
            // marks the popover half hovered, cancels the deferred close, and
            // re-asserts the pin's scale/halo.
            onPointerEnter={enterPopover}
            // Leaving the popover defers the same guarded, unified teardown.
            onPointerLeave={leavePopover}
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
