"use client";

import { CheckCircle2, SearchX } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { ExceptionCard } from "./exception-card";
import type { ExceptionRecord } from "@/app/workspace/lib/exception-types";

export interface ExceptionFeedListProps {
  exceptions: ExceptionRecord[];
  /** Whether any filter/search narrowing is currently active. */
  isFiltered: boolean;
  onClearFilters: () => void;
  selectedId: string | null;
  onSelect: (id: string) => void;
  nowMs: number;
  className?: string;
}

/**
 * Left pane of the Row 3 split view, the "Dynamic Exception Feed". Exceptions
 * arrive pre-sorted by the AI's internal priority score (highest first); the
 * score itself is never passed to or rendered by `ExceptionCard`.
 *
 * Two distinct empty states:
 * - Zero exceptions in this queue with no filters active: reads as
 *   "verified clear" per Flow 4.1b's explicit note, a positive confirmation,
 *   not a failure or blank screen.
 * - Zero results because of active filters/search: a normal no-results
 *   empty state with a clear-filters action.
 */
export function ExceptionFeedList({
  exceptions,
  isFiltered,
  onClearFilters,
  selectedId,
  onSelect,
  nowMs,
  className,
}: ExceptionFeedListProps) {
  if (exceptions.length === 0) {
    return (
      <div className={className}>
        {isFiltered ? (
          <EmptyState
            icon={<SearchX className="size-6" aria-hidden="true" />}
            title="No exceptions match these filters"
            description="Try clearing a filter or broadening your search."
            primaryAction={
              <Button variant="secondary" size="sm" onClick={onClearFilters}>
                Clear filters
              </Button>
            }
          />
        ) : (
          <EmptyState
            icon={<CheckCircle2 className="size-6" aria-hidden="true" />}
            title="Verified clear"
            description="No active exceptions in this queue right now. The feed is live and will update the moment something needs your attention."
          />
        )}
      </div>
    );
  }

  return (
    <ul className={className} role="list" aria-label="Dynamic exception feed, ranked by priority">
      {exceptions.map((exception) => (
        <li key={exception.id} className="pb-3 last:pb-0">
          <ExceptionCard
            exception={exception}
            selected={exception.id === selectedId}
            onSelect={onSelect}
            nowMs={nowMs}
          />
        </li>
      ))}
    </ul>
  );
}
