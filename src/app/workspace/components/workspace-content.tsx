"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Plus } from "lucide-react";
import { Tabs, type TabItem } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { MessageBar } from "@/components/ui/message-bar";
import { SituationBriefBanner } from "./situation-brief-banner";
import { WorkspaceFilterBar, EXCEPTION_TYPE_ORDER } from "./workspace-filter-bar";
import { ExceptionFeedList } from "./exception-feed-list";
import { ExceptionMapPanel } from "./exception-map-panel";
import { WorkspaceSkeleton } from "./workspace-skeleton";
import { useWorkspaceFeed } from "@/app/workspace/hooks/use-workspace-feed";
import type { ExceptionQueue, ExceptionRecord } from "@/app/workspace/lib/exception-types";

const QUEUE_TABS: TabItem[] = [
  { value: "pending", label: "Pending" },
  { value: "escalated", label: "Escalated" },
  { value: "delegated", label: "Delegated" },
];

function matchesSearch(exception: ExceptionRecord, query: string): boolean {
  if (!query) return true;
  const haystack = `${exception.shipmentId} ${exception.carrier} ${exception.location} ${exception.headline}`.toLowerCase();
  return haystack.includes(query.toLowerCase());
}

export function WorkspaceContent() {
  const { data, isLoading, isError, refetch } = useWorkspaceFeed();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [queue, setQueue] = useState<ExceptionQueue>("pending");
  const [search, setSearch] = useState("");
  const [activeTypeIds, setActiveTypeIds] = useState<string[]>([]);
  const selectedId = searchParams.get("exceptionId");

  // Frozen per-mount so relative "updated Xm ago" labels don't drift on every
  // React re-render, only on data refetch.
  const [nowMs] = useState(() => Date.now());

  const queueExceptions = useMemo(() => {
    if (!data) return [];
    return data.exceptions
      .filter((e) => e.queue === queue)
      .sort((a, b) => b.priorityScore - a.priorityScore);
  }, [data, queue]);

  const typeOptions = useMemo(() => {
    return EXCEPTION_TYPE_ORDER.map((type) => ({
      id: type,
      label: type,
      count: queueExceptions.filter((e) => e.type === type).length,
    }));
  }, [queueExceptions]);

  const filteredExceptions = useMemo(() => {
    return queueExceptions.filter((e) => {
      const matchesType = activeTypeIds.length === 0 || activeTypeIds.includes(e.type);
      return matchesType && matchesSearch(e, search);
    });
  }, [queueExceptions, activeTypeIds, search]);

  const isFiltered = search.trim().length > 0 || activeTypeIds.length > 0;

  const handleSelect = (id: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("exceptionId", id);
    router.push(`/workspace?${params.toString()}`, { scroll: false });
  };

  const handleClearFilters = () => {
    setSearch("");
    setActiveTypeIds([]);
  };

  const handleToggleType = (id: string) => {
    setActiveTypeIds((prev) => (prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]));
  };

  if (isLoading) {
    return <WorkspaceSkeleton />;
  }

  if (isError || !data) {
    return (
      <MessageBar severity="error" title="Couldn't load the exception feed" action={<Button size="sm" variant="secondary" onClick={() => refetch()}>Retry</Button>}>
        The workspace feed failed to load. Your queues and filters are unaffected once this reconnects.
      </MessageBar>
    );
  }

  return (
    <div className="flex h-full flex-col gap-4">
      <SituationBriefBanner brief={data.situationBrief} sourceHealth={data.sourceHealth} className="shrink-0" />

      {/* Row 1 — queue tabs + Add Exception CTA, right-aligned in the same row. */}
      <div className="flex shrink-0 items-center justify-between gap-4">
        <Tabs items={QUEUE_TABS} value={queue} onChange={(v) => setQueue(v as ExceptionQueue)} variant="underline" />
        <Button leadingIcon={<Plus />} onClick={() => { /* out of scope: opens the Add Exception flow */ }}>
          Add Exception
        </Button>
      </div>

      {/* Row 2 — full-width filter bar, controls both the feed and the map. */}
      <WorkspaceFilterBar
        searchValue={search}
        onSearchChange={setSearch}
        typeOptions={typeOptions}
        activeTypeIds={activeTypeIds}
        onToggleType={handleToggleType}
        onClearAll={handleClearFilters}
        className="shrink-0"
      />

      {/* Row 3 — permanent split view, list left, map right. */}
      <div className="grid min-h-0 flex-1 grid-cols-2 gap-4">
        <ExceptionFeedList
          exceptions={filteredExceptions}
          isFiltered={isFiltered}
          onClearFilters={handleClearFilters}
          selectedId={selectedId}
          onSelect={handleSelect}
          nowMs={nowMs}
          className="min-h-0 overflow-y-auto pr-1"
        />
        <ExceptionMapPanel
          exceptions={filteredExceptions}
          selectedId={selectedId}
          onSelect={handleSelect}
        />
      </div>
    </div>
  );
}
