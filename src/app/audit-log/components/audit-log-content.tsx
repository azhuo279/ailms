"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ScrollText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tag } from "@/components/ui/tag";
import { MessageBar } from "@/components/ui/message-bar";
import { EmptyState } from "@/components/ui/empty-state";
import { DataTable } from "@/components/ui/data-table";
import { Pagination } from "@/components/ui/pagination";
import { useAuditLog } from "@/app/audit-log/hooks/use-audit-log";
import {
  EMPTY_FILTERS,
  EVENT_TYPE_CONFIG,
  clusterEvents,
  filterEvents,
  isFiltered as computeIsFiltered,
  type AuditFilters,
} from "@/app/audit-log/lib/audit-log-format";
import type { AuditCluster, AuditEvent } from "@/app/audit-log/lib/audit-log-types";
import { AuditFilterRail } from "./audit-filter-rail";
import { auditClusterColumns, AuditClusterEventRows } from "./audit-cluster";
import { AuditEventDrawer } from "./audit-event-drawer";
import { AuditExportMenu } from "./audit-export-menu";
import { AuditLogSkeleton } from "./audit-log-skeleton";

// Mock role flag — a real build reads this from the session/auth context. Admin
// and Director roles may export (FR-42); flip to false to see the gated state.
const IS_ADMIN = true;

// Clustered log is chunked into pages of clusters (each cluster expands to its
// own event rows). 15 collapsed clusters fills the viewport without crowding.
const CLUSTERS_PER_PAGE = 15;

export function AuditLogContent() {
  const { data, isLoading, isError, refetch } = useAuditLog();
  const searchParams = useSearchParams();
  // Deep-link (companion change): /audit-log?exception=<id> pre-applies the
  // Exception filter so the workspace "View full history" bridge lands here
  // scoped to that exception.
  const deepLinkedException = searchParams.get("exception");

  const [filters, setFilters] = useState<AuditFilters>(EMPTY_FILTERS);
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [selectedEvent, setSelectedEvent] = useState<AuditEvent | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  // Once the deep-link has been applied we don't re-apply it (so the user can
  // clear the filter without it snapping back).
  const [deepLinkApplied, setDeepLinkApplied] = useState(false);

  useEffect(() => {
    if (deepLinkApplied || !deepLinkedException || !data) return;
    // Only pre-apply if the exception actually appears in the log.
    const exists = data.events.some((e) => e.exceptionId === deepLinkedException);
    if (exists) {
      setFilters((prev) => ({ ...prev, exceptionIds: [deepLinkedException] }));
      setExpandedIds(new Set([deepLinkedException]));
    }
    setDeepLinkApplied(true);
  }, [deepLinkedException, data, deepLinkApplied]);

  const allEvents = data?.events ?? [];

  const filteredEvents = useMemo(
    () => filterEvents(allEvents, filters),
    [allEvents, filters],
  );
  const clusters = useMemo(
    () => clusterEvents(filteredEvents),
    [filteredEvents],
  );
  const filtered = computeIsFiltered(filters);

  // Client-side pagination over the clusters. Reset to page 1 whenever the
  // filter set changes so the user is never stranded on a now-empty page.
  useEffect(() => {
    setCurrentPage(1);
  }, [filters]);

  const totalPages = Math.max(1, Math.ceil(clusters.length / CLUSTERS_PER_PAGE));
  // Guard against a stale page index (e.g. clusters shrank between renders).
  const safePage = Math.min(currentPage, totalPages);
  const pagedClusters = useMemo(() => {
    const start = (safePage - 1) * CLUSTERS_PER_PAGE;
    return clusters.slice(start, start + CLUSTERS_PER_PAGE);
  }, [clusters, safePage]);

  // Facet option sources, derived from the full event set so the pickers list
  // every real value regardless of the current filter.
  const exceptionOptions = useMemo(() => {
    const seen = new Map<string, string>();
    for (const e of allEvents) {
      if (!seen.has(e.exceptionId)) seen.set(e.exceptionId, e.shipmentId);
    }
    return Array.from(seen.entries())
      .map(([value, shipmentId]) => ({ value, label: `${shipmentId} (${value})` }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [allEvents]);

  const userOptions = useMemo(() => {
    const seen = new Map<string, AuditEvent["actor"]>();
    for (const e of allEvents) {
      if (!seen.has(e.actor.id)) seen.set(e.actor.id, e.actor);
    }
    return Array.from(seen.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [allEvents]);

  const updateFilters = (next: Partial<AuditFilters>) =>
    setFilters((prev) => ({ ...prev, ...next }));

  const clearAll = () => setFilters(EMPTY_FILTERS);

  const openEvent = (event: AuditEvent) => {
    setSelectedEvent(event);
    setDrawerOpen(true);
  };

  if (isLoading) return <AuditLogSkeleton />;

  if (isError || !data) {
    return (
      <MessageBar
        severity="error"
        title="Couldn't load the audit log"
        action={
          <Button size="sm" variant="secondary" onClick={() => refetch()}>
            Retry
          </Button>
        }
      >
        The audit log failed to load. No records were changed.
      </MessageBar>
    );
  }

  const totalEvents = allEvents.length;

  return (
    <div className="flex h-full min-h-0 flex-col gap-4">
      {/* Page header — title + scope + export (top-right, admin-gated). */}
      <header className="flex shrink-0 flex-wrap items-center justify-between gap-3">
        <div className="flex flex-col gap-0.5">
          <h1 className="text-heading-xl font-semibold text-fg-primary">
            Audit Log
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-body-s text-fg-muted">
            {filtered ? (
              <>
                <span className="font-medium text-fg-secondary">
                  {filteredEvents.length}
                </span>{" "}
                of {totalEvents} events
              </>
            ) : (
              <>
                <span className="font-medium text-fg-secondary">
                  {totalEvents}
                </span>{" "}
                events
              </>
            )}
          </span>
          <AuditExportMenu events={filteredEvents} isAdmin={IS_ADMIN} />
        </div>
      </header>

      <div className="flex min-h-0 flex-1 gap-4">
        <AuditFilterRail
          filters={filters}
          onChange={updateFilters}
          exceptionOptions={exceptionOptions}
          userOptions={userOptions}
        />

        {/* Main region — applied-filter chips + clustered log. */}
        <div className="flex min-w-0 flex-1 flex-col gap-3 overflow-y-auto">
          {filtered ? (
            <AppliedFilterChips
              filters={filters}
              exceptionOptions={exceptionOptions}
              userOptions={userOptions}
              onChange={updateFilters}
              onClearAll={clearAll}
            />
          ) : null}

          {/* Clustered log on the shared DataTable — one row per exception
              cluster, expanding to its ordered event rows. Clustering,
              newest-first ordering, and the AI-vs-human row treatment survive
              the migration; the drawer, chips, and export scope are unchanged. */}
          <DataTable<AuditCluster>
            columns={auditClusterColumns}
            rows={pagedClusters}
            getRowId={(cluster) => cluster.exceptionId}
            expandedIds={expandedIds}
            onExpandedIdsChange={setExpandedIds}
            renderExpandedRow={(cluster) => (
              <AuditClusterEventRows
                cluster={cluster}
                onSelectEvent={openEvent}
                activeEventId={drawerOpen ? (selectedEvent?.id ?? null) : null}
              />
            )}
            emptyState={
              filtered ? (
                <EmptyState
                  title="No events match these filters"
                  description="Try widening the date range or clearing a facet."
                  primaryAction={
                    <Button size="sm" variant="secondary" onClick={clearAll}>
                      Clear filters
                    </Button>
                  }
                />
              ) : (
                <EmptyState
                  icon={<ScrollText className="size-6" />}
                  title="No events yet"
                  description="AI recommendations and human actions will appear here as your team works exceptions."
                />
              )
            }
          />

          {/* Pagination over the clusters — hidden when the log is empty. */}
          {clusters.length > 0 ? (
            <Pagination
              currentPage={safePage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              pageSize={CLUSTERS_PER_PAGE}
              totalItems={clusters.length}
              align="center"
              className="shrink-0"
            />
          ) : null}
        </div>
      </div>

      <AuditEventDrawer
        event={selectedEvent}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
      />
    </div>
  );
}

/**
 * Applied-filter chips above the table — one removable Tag per active facet
 * value, plus a Clear all. Removing a chip narrows the filter set back down.
 */
function AppliedFilterChips({
  filters,
  exceptionOptions,
  userOptions,
  onChange,
  onClearAll,
}: {
  filters: AuditFilters;
  exceptionOptions: { value: string; label: string }[];
  userOptions: AuditEvent["actor"][];
  onChange: (next: Partial<AuditFilters>) => void;
  onClearAll: () => void;
}) {
  const chips: { key: string; label: string; onRemove: () => void }[] = [];

  if (filters.actorKind !== "all") {
    chips.push({
      key: "actor",
      label: `Author: ${filters.actorKind === "ai" ? "AI" : "Human"}`,
      onRemove: () => onChange({ actorKind: "all" }),
    });
  }

  for (const type of filters.types) {
    chips.push({
      key: `type-${type}`,
      label: EVENT_TYPE_CONFIG[type as keyof typeof EVENT_TYPE_CONFIG]?.label ?? type,
      onRemove: () =>
        onChange({ types: filters.types.filter((t) => t !== type) }),
    });
  }

  for (const tier of filters.tiers) {
    chips.push({
      key: `tier-${tier}`,
      label: `Tier ${tier}`,
      onRemove: () =>
        onChange({ tiers: filters.tiers.filter((t) => t !== tier) }),
    });
  }

  for (const id of filters.exceptionIds) {
    const label = exceptionOptions.find((o) => o.value === id)?.label ?? id;
    chips.push({
      key: `exc-${id}`,
      label,
      onRemove: () =>
        onChange({
          exceptionIds: filters.exceptionIds.filter((e) => e !== id),
        }),
    });
  }

  for (const id of filters.userIds) {
    const user = userOptions.find((u) => u.id === id);
    chips.push({
      key: `user-${id}`,
      label: user ? user.name : id,
      onRemove: () =>
        onChange({ userIds: filters.userIds.filter((u) => u !== id) }),
    });
  }

  if (filters.dateStart || filters.dateEnd) {
    const fmt = (d: Date | null) =>
      d ? d.toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "…";
    chips.push({
      key: "date",
      label: `${fmt(filters.dateStart)} to ${fmt(filters.dateEnd)}`,
      onRemove: () => onChange({ dateStart: null, dateEnd: null }),
    });
  }

  if (chips.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {chips.map((chip) => (
        <Tag key={chip.key} tone="neutral" onRemove={chip.onRemove}>
          {chip.label}
        </Tag>
      ))}
      <button
        type="button"
        onClick={onClearAll}
        className="text-label-m font-medium text-link transition-colors hover:text-link-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-1"
      >
        Clear all
      </button>
    </div>
  );
}
