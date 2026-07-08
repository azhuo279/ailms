"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Tabs, type TabItem } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { MessageBar } from "@/components/ui/message-bar";
// Finding #0 — the situation brief is deferred. Its render is gated behind
// SHOW_SITUATION_BRIEF below; the data plumbing (data.situationBrief /
// data.sourceHealth from useWorkspaceFeed) stays intact so it can return
// without a re-fetch change. Re-enable by flipping the flag.
import { SituationBriefBanner } from "./situation-brief-banner";
import { SituationBriefModal } from "./situation-brief-modal";
import {
  WorkspaceFilterBar,
  EXCEPTION_TYPE_ORDER,
  PRIORITY_TIER_ORDER,
} from "./workspace-filter-bar";
import type { DateRange } from "@/components/ui/date-range-picker";
import { ExceptionFeedList } from "./exception-feed-list";
import { ExceptionMapPanel } from "./exception-map-panel";
import { ExceptionDetailView } from "./exception-detail-view";
import { WorkspaceSkeleton } from "./workspace-skeleton";
import { SourceHealthControl } from "./source-health-control";
import { NotificationBell } from "./notification-bell";
import { useWorkspaceFeed } from "@/app/workspace/hooks/use-workspace-feed";
import { useSimulatedFeedUpdates } from "@/app/workspace/hooks/use-simulated-feed-updates";
import {
  buildWarehouseMap,
  getWarehouse,
} from "@/app/workspace/lib/exception-format";
import {
  sortExceptions,
  type SortMode,
} from "@/app/workspace/lib/exception-sort";
import type {
  ExceptionQueue,
  ExceptionRecord,
  PriorityTier,
  Warehouse,
} from "@/app/workspace/lib/exception-types";
import type { TierChange } from "./editable-tier-control";
import { useAuditSessionStore } from "@/hooks/shared/use-audit-session-store";
import { buildTierChangeAuditEvent } from "@/app/audit-log/lib/audit-session-events";
import { MODIFICATION_REASONS } from "@/app/workspace/lib/exception-detail";

// Representative priorityScore per tier band. When a tier is overridden from the
// detail view the record's tier changes, but the feed's default sort keys on the
// internal priorityScore (never rendered) — so the override also re-scores the
// record into the destination tier's band, landing the card among its new peers
// and triggering the feed's FLIP reorder. Values sit mid-band so re-tiered cards
// order after native members of that band without a score collision.
const TIER_BAND_SCORE: Record<PriorityTier, number> = {
  T1: 82,
  T2: 62,
  T3: 42,
  T4: 22,
};

/** Human tier label from the shared order source, e.g. "T2 High". */
function tierLabelOf(tier: PriorityTier): string {
  return PRIORITY_TIER_ORDER.find((t) => t.id === tier)?.label ?? tier;
}

// Queue tab definitions. Counts are injected per-render from data.exceptions
// (see queueTabs memo) so the badge reflects each queue's total, independent of
// the currently-filtered view.
const QUEUE_TAB_DEFS: Array<{ value: ExceptionQueue; label: string }> = [
  { value: "pending", label: "Pending" },
  { value: "escalated", label: "Escalated" },
  { value: "delegated", label: "Delegated" },
];

// Finding #0 — deferred. The situation brief is surfaced as a first-login-of-day
// modal (SituationBriefModal) rather than this inline banner. The banner flag
// stays false so the banner stays hidden; the modal handles the brief UX.
// Re-enable by flipping to true if the banner should return.
const SHOW_SITUATION_BRIEF = false;

// An exception is "missing origin" when its warehouse FK resolves to no record
// or a record with no coordinates. This is the SAME predicate the map uses to
// decide a pin cannot plot, so the "Missing origin" filter selects exactly the
// off-map set (Starling — map "not on map, show in feed" affordance).
function isMissingOrigin(
  exception: ExceptionRecord,
  warehouseMap: Map<string, Warehouse>,
): boolean {
  const w = getWarehouse(exception, warehouseMap);
  return !w || w.coordinates === null;
}

function matchesSearch(
  exception: ExceptionRecord,
  query: string,
  warehouse: Warehouse | undefined,
): boolean {
  if (!query) return true;
  // Location + site name are now derived from the associated warehouse, so
  // search reads both (PRD v1.6) rather than the removed free-text location.
  const geo = warehouse ? `${warehouse.name} ${warehouse.location}` : "";
  const haystack =
    `${exception.shipmentId} ${exception.carrier} ${geo} ${exception.headline}`.toLowerCase();
  return haystack.includes(query.toLowerCase());
}

export function WorkspaceContent() {
  const { data, isLoading, isError, refetch } = useWorkspaceFeed();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [queue, setQueue] = useState<ExceptionQueue>("pending");
  const [search, setSearch] = useState("");
  const [activeTypeIds, setActiveTypeIds] = useState<string[]>([]);
  const [activePriorityIds, setActivePriorityIds] = useState<string[]>([]);
  const [activeWarehouseIds, setActiveWarehouseIds] = useState<string[]>([]);
  // "Missing origin" filter (Starling): narrows to exceptions whose origin
  // warehouse has no mappable location, the exact set the map cannot plot.
  const [missingOriginActive, setMissingOriginActive] = useState(false);
  const [dateRange, setDateRange] = useState<DateRange>({
    start: null,
    end: null,
  });
  // Sort state is the single source of truth (Starling #2, FR-51). Default
  // "priority" preserves the AI-ranked ordering so nothing regresses.
  const [sortMode, setSortMode] = useState<SortMode>("priority");
  const selectedId = searchParams.get("exceptionId");

  // Symmetric feed<->map hover link. The single shared piece of hover state:
  // set by hovering a feed card OR a map pin, read by BOTH the feed (highlight
  // + scroll the card) and the map (lift + pulse the pin). No context/store,
  // same local-state pattern as the rest of this container.
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  // Local queue overrides applied on top of the fetched feed. When the ZOM
  // routes an exception from its detail view (Delegate/Escalate), it moves to
  // the matching queue optimistically here so the tabs + feed reflect the move
  // without a refetch. A real build would mutate server-side and invalidate the
  // query; this keeps the feature self-contained over the mock feed.
  const [queueOverrides, setQueueOverrides] = useState<
    Record<string, ExceptionQueue>
  >({});

  // Local priority-tier overrides applied on top of the fetched feed, mirroring
  // the queueOverrides pattern. When the ZOM changes an exception's priority
  // from its detail view, the confirmed tier lands here so the shared working
  // set reflects it: the header badge, the feed card, and the feed's
  // priority-sorted position (via re-scoring into the new band) all update, and
  // the list FLIP-animates the card to its new slot. A real build posts the
  // change and invalidates the query; this keeps it self-contained over the mock.
  const [tierOverrides, setTierOverrides] = useState<
    Record<string, PriorityTier>
  >({});

  // Ids the ZOM just edited directly (e.g. a tier change), so the feed commits
  // them immediately instead of queuing them behind its background-update banner
  // — a direct action must land at once, and the changed card gets the feed's
  // one-shot FLIP entrance treatment. Cleared by the feed after the animation.
  const [userEditedIds, setUserEditedIds] = useState<Set<string>>(
    () => new Set(),
  );

  // Append-only session audit overlay (see useAuditSessionStore) — a confirmed
  // tier change writes a `tier_routing` event here so it surfaces in /audit-log
  // this session.
  const addAuditEvent = useAuditSessionStore((s) => s.addEvent);

  // Frozen per-mount so relative "updated Xm ago" labels don't drift on every
  // React re-render, only on data refetch.
  const [nowMs] = useState(() => Date.now());

  // Situation brief modal — opened manually from the notification bell only.
  const [briefOpen, setBriefOpen] = useState(false);

  // Per-tier and per-queue counts from the raw feed — used by the situation
  // brief modal (shift-start snapshot, not affected by local overrides).
  const briefExceptionCounts = useMemo(() => {
    const counts = { T1: 0, T2: 0, T3: 0, T4: 0 };
    for (const e of data?.exceptions ?? []) {
      counts[e.priorityTier] = (counts[e.priorityTier] ?? 0) + 1;
    }
    return counts;
  }, [data]);

  const briefQueueCounts = useMemo(() => {
    const counts = { pending: 0, escalated: 0, delegated: 0 };
    for (const e of data?.exceptions ?? []) {
      counts[e.queue] = (counts[e.queue] ?? 0) + 1;
    }
    return counts;
  }, [data]);

  const handleBriefClose = () => setBriefOpen(false);

  // Warehouse registry lookup, built once per feed payload — the single source
  // of geographic + name truth, threaded to the feed list, cards, and map like
  // the sourceStatusMap pattern (PRD v1.6 §5.0.1).
  const warehouseMap = useMemo(
    () => buildWarehouseMap(data?.warehouses ?? []),
    [data],
  );

  // Fetched exceptions with local queue overrides applied (see queueOverrides).
  // This is the single working set every downstream region reads from, so a
  // routed exception's queue move propagates to the tabs, feed, and selection
  // lookup consistently.
  const baselineExceptions = useMemo<ExceptionRecord[]>(() => {
    if (!data) return [];
    return data.exceptions.map((e) => {
      const queue = queueOverrides[e.id] ?? e.queue;
      const overrideTier = tierOverrides[e.id];
      if (!overrideTier && queue === e.queue) return e;
      // A tier override also re-scores the record into the destination tier's
      // band so the priority sort places the card among its new peers and the
      // feed FLIP-animates it there; the tier drives the badge + FLIP grouping.
      return {
        ...e,
        queue,
        ...(overrideTier
          ? {
              priorityTier: overrideTier,
              priorityScore: TIER_BAND_SCORE[overrideTier],
            }
          : {}),
      };
    });
  }, [data, queueOverrides, tierOverrides]);

  // Dev-only simulator standing in for the real-time push channel PRD
  // FR-SYS-02 describes (no backend yet). Mutates the baseline underneath the
  // feed on an interval so `ExceptionFeedList`'s pending-update queue/banner/
  // FLIP-apply has real background drift to demonstrate against. Swap for a
  // real subscription when the backend lands; downstream consumers only see
  // `exceptions` change, same as any other refetch.
  const exceptions = useSimulatedFeedUpdates(baselineExceptions);

  // Per-queue totals for the tab badges. Counted from the full exception set
  // (not the filtered view) so the tabs communicate how many sit in each queue.
  const queueTabs = useMemo<TabItem[]>(() => {
    const counts: Record<ExceptionQueue, number> = {
      pending: 0,
      escalated: 0,
      delegated: 0,
    };
    for (const e of exceptions) {
      counts[e.queue] += 1;
    }
    return QUEUE_TAB_DEFS.map((tab) => ({ ...tab, count: counts[tab.value] }));
  }, [exceptions]);

  const queueExceptions = useMemo(() => {
    const inQueue = exceptions.filter((e) => e.queue === queue);
    return sortExceptions(inQueue, sortMode, warehouseMap);
  }, [exceptions, queue, sortMode, warehouseMap]);

  // Exception type options for the searchable multi-select combobox (Combobox
  // uses value/label, not id/label).
  const typeOptions = useMemo(
    () =>
      EXCEPTION_TYPE_ORDER.map((type) => ({
        value: type,
        label: type,
      })),
    [],
  );

  // Priority tier options for the no-search multi-select checklist (Combobox
  // with searchable={false}). Value/label only, matching the other comboboxes.
  const priorityOptions = useMemo(
    () =>
      PRIORITY_TIER_ORDER.map((tier) => ({
        value: tier.id,
        label: tier.label,
      })),
    [],
  );

  // Origin warehouse options for the searchable multi-select combobox, sourced
  // from the warehouse registry that travels with the feed.
  const warehouseOptions = useMemo(
    () =>
      (data?.warehouses ?? [])
        .map((w) => ({ value: w.id, label: `${w.name} (${w.location})` }))
        .sort((a, b) => a.label.localeCompare(b.label)),
    [data],
  );

  const filteredExceptions = useMemo(() => {
    const startMs = dateRange.start ? dateRange.start.getTime() : null;
    // End of the selected end day, so the whole day is inclusive.
    const endMs = dateRange.end
      ? new Date(
          dateRange.end.getFullYear(),
          dateRange.end.getMonth(),
          dateRange.end.getDate(),
          23,
          59,
          59,
          999,
        ).getTime()
      : null;
    return queueExceptions.filter((e) => {
      const matchesType =
        activeTypeIds.length === 0 || activeTypeIds.includes(e.type);
      const matchesPriority =
        activePriorityIds.length === 0 ||
        activePriorityIds.includes(e.priorityTier);
      const matchesWarehouse =
        activeWarehouseIds.length === 0 ||
        activeWarehouseIds.includes(e.warehouseId);
      const matchesMissingOrigin =
        !missingOriginActive || isMissingOrigin(e, warehouseMap);
      const detectedMs = new Date(e.eventTimestamp).getTime();
      const matchesDate =
        (startMs === null || detectedMs >= startMs) &&
        (endMs === null || detectedMs <= endMs);
      return (
        matchesType &&
        matchesPriority &&
        matchesWarehouse &&
        matchesMissingOrigin &&
        matchesDate &&
        matchesSearch(e, search, getWarehouse(e, warehouseMap))
      );
    });
  }, [
    queueExceptions,
    activeTypeIds,
    activePriorityIds,
    activeWarehouseIds,
    missingOriginActive,
    dateRange,
    search,
    warehouseMap,
  ]);

  const isFiltered =
    search.trim().length > 0 ||
    activeTypeIds.length > 0 ||
    activePriorityIds.length > 0 ||
    activeWarehouseIds.length > 0 ||
    missingOriginActive ||
    dateRange.start !== null ||
    dateRange.end !== null;

  const handleSelect = (id: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("exceptionId", id);
    router.push(`/workspace?${params.toString()}`, { scroll: false });
  };

  // Clears the selection so the right pane returns to the map (mirrors
  // handleSelect: same router.push, scroll:false, minus the exceptionId param).
  const handleClearSelection = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("exceptionId");
    const query = params.toString();
    router.push(query ? `/workspace?${query}` : "/workspace", {
      scroll: false,
    });
  };

  // The selected exception is looked up from the full set (not the filtered
  // view) so a still-selected record survives a filter change that would hide
  // it from the feed. Undefined (stale id after refetch) falls back to the map.
  const selectedException = selectedId
    ? (exceptions.find((e) => e.id === selectedId) ?? null)
    : null;

  // A routed exception (Delegate/Escalate confirmed in the detail view) moves to
  // the matching queue and the selection clears, so the ZOM lands back on the
  // feed/map and can switch to the Delegated/Escalated tab to monitor it.
  const handleRouted = (id: string, targetQueue: ExceptionQueue) => {
    setQueueOverrides((prev) => ({ ...prev, [id]: targetQueue }));
    handleClearSelection();
  };

  // A confirmed priority change from an exception's detail view. Lifts the tier
  // into the shared working set (so the feed re-sorts and its card FLIP-animates
  // to the new position, the header badge updates, and the Progress stepper gets
  // an appended step keyed on this exception + tier), and appends a session
  // audit event so the change appears in /audit-log this session. The detail
  // view stays open on the same exception, so no selection change here.
  const handleTierChange = (id: string, change: TierChange) => {
    const exception = exceptions.find((e) => e.id === id);
    if (!exception) return;
    const fromTier = exception.priorityTier;
    // Same tier -> no-op (the control already guards this, but stay defensive).
    if (fromTier === change.tier) return;

    setTierOverrides((prev) => ({ ...prev, [id]: change.tier }));
    // Mark this id as a user edit so the feed applies it immediately (a direct
    // action, not queued background drift) and gives the card the FLIP entrance.
    setUserEditedIds((prev) => new Set(prev).add(id));

    const reasonLabel =
      MODIFICATION_REASONS.find((r) => r.id === change.reasonId)?.label ??
      "Other";
    addAuditEvent(
      buildTierChangeAuditEvent({
        exceptionId: id,
        shipmentId: exception.shipmentId,
        fromTier,
        toTier: change.tier,
        fromTierLabel: tierLabelOf(fromTier),
        toTierLabel: tierLabelOf(change.tier),
        reasonLabel,
        note: change.note,
      }),
    );
  };

  // The feed acknowledges it committed a set of user-edited ids, so we drop them
  // from the pending set (they should only trigger the one-shot entrance once).
  const handleForceApplied = (ids: string[]) => {
    if (ids.length === 0) return;
    setUserEditedIds((prev) => {
      const next = new Set(prev);
      for (const id of ids) next.delete(id);
      return next;
    });
  };

  const handleClearFilters = () => {
    setSearch("");
    setActiveTypeIds([]);
    setActivePriorityIds([]);
    setActiveWarehouseIds([]);
    setMissingOriginActive(false);
    setDateRange({ start: null, end: null });
  };

  // Exceptions whose warehouse has no coordinates never plot (FR-52). Computed
  // from the SAME filtered working set the map plots via the shared
  // isMissingOrigin predicate, so the "N not on map" count always matches what
  // the map is actually showing AND exactly what the "Missing origin" filter
  // selects. Never silently dropped: the map's corner indicator applies that
  // filter so a dispatcher sees precisely these records in the feed.
  const offMapExceptions = useMemo(
    () => filteredExceptions.filter((e) => isMissingOrigin(e, warehouseMap)),
    [filteredExceptions, warehouseMap],
  );

  // The map's "N not on map, show in feed" affordance turns ON the "Missing
  // origin" filter (Starling), so the feed narrows to exactly the off-map
  // exceptions rather than a loose warehouse match. Clears any open detail so
  // the filtered feed is the visible result.
  const handleShowOffMap = () => {
    setMissingOriginActive(true);
    handleClearSelection();
  };

  if (isLoading) {
    return <WorkspaceSkeleton />;
  }

  if (isError || !data) {
    return (
      <MessageBar
        severity="error"
        title="Couldn't load the exception feed"
        action={
          <Button size="sm" variant="secondary" onClick={() => refetch()}>
            Retry
          </Button>
        }
      >
        The workspace feed failed to load. Your queues and filters are
        unaffected once this reconnects.
      </MessageBar>
    );
  }

  return (
    <div className="flex h-full flex-col gap-4">
      {SHOW_SITUATION_BRIEF ? (
        <SituationBriefBanner
          brief={data.situationBrief}
          sourceHealth={data.sourceHealth}
          className="shrink-0"
        />
      ) : null}

      {/* Row 1 — queue tabs left, source-health badge + notification bell right. */}
      <div className="flex shrink-0 items-center gap-4">
        <Tabs
          items={queueTabs}
          value={queue}
          onChange={(v) => setQueue(v as ExceptionQueue)}
          variant="underline"
        />
        <div className="ml-auto flex items-center gap-3">
          <SourceHealthControl sourceHealth={data.sourceHealth} />
          <NotificationBell onBriefOpen={() => setBriefOpen(true)} />
        </div>
      </div>

      {/* Row 2 — full-width filter bar, controls both the feed and the map. */}
      <WorkspaceFilterBar
        searchValue={search}
        onSearchChange={setSearch}
        priorityOptions={priorityOptions}
        activePriorityIds={activePriorityIds}
        onPriorityChange={setActivePriorityIds}
        typeOptions={typeOptions}
        activeTypeIds={activeTypeIds}
        onTypeChange={setActiveTypeIds}
        warehouseOptions={warehouseOptions}
        activeWarehouseIds={activeWarehouseIds}
        onWarehouseChange={setActiveWarehouseIds}
        missingOriginActive={missingOriginActive}
        onMissingOriginChange={setMissingOriginActive}
        dateRange={dateRange}
        onDateRangeChange={setDateRange}
        onClearAll={handleClearFilters}
        className="shrink-0"
      />

      {/* Situation brief modal — first-login-of-day carousel. Portals to body
          via the Dialog primitive. Reopenable from the notification bell. */}
      {data && (
        <SituationBriefModal
          open={briefOpen}
          onClose={handleBriefClose}
          brief={data.situationBrief}
          sourceHealth={data.sourceHealth}
          exceptionCounts={briefExceptionCounts}
          queueCounts={briefQueueCounts}
          exceptions={exceptions}
        />
      )}

      {/* Row 3 — permanent split view, an 40/60 feed:map split so neither
          pane dominates: the feed and map are one linked triage instrument, not
          a hero map with a sidebar. */}
      <div className="grid min-h-0 flex-1 grid-cols-[2fr_3fr] gap-4">
        <ExceptionFeedList
          exceptions={filteredExceptions}
          isFiltered={isFiltered}
          onClearFilters={handleClearFilters}
          selectedId={selectedId}
          onSelect={handleSelect}
          highlightedId={hoveredId}
          onHoverChange={setHoveredId}
          nowMs={nowMs}
          sourceHealth={data.sourceHealth}
          warehouseMap={warehouseMap}
          sortMode={sortMode}
          onSortChange={setSortMode}
          forceApplyIds={userEditedIds}
          onForceApplied={handleForceApplied}
        />
        {/* Right pane. With no selection, the map owns the full pane. When a
            record is selected the detail view takes the FULL pane height
            (Starling: the small inset map above it is removed). Spatial context
            is not lost, it moves into the detail view's Progress tab as a static
            snapshot of the exception's marker. */}
        {selectedException ? (
          <ExceptionDetailView
            exception={selectedException}
            warehouseMap={warehouseMap}
            sourceHealth={data.sourceHealth}
            onBack={handleClearSelection}
            onRouted={handleRouted}
            onTierChange={handleTierChange}
          />
        ) : (
          <ExceptionMapPanel
            exceptions={filteredExceptions}
            warehouseMap={warehouseMap}
            selectedId={selectedId}
            hoveredId={hoveredId}
            offMapExceptions={offMapExceptions}
            onShowOffMap={handleShowOffMap}
            nowMs={nowMs}
          />
        )}
      </div>
    </div>
  );
}
