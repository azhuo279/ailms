"use client";

import { Clock, MapPin, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EpistemicTag } from "@/components/ui/epistemic-status";
import { PriorityTierBadge } from "@/components/ui/priority-tier-badge";
import type { ExceptionRecord } from "@/app/workspace/lib/exception-types";

function formatRelativeMinutes(iso: string, nowMs: number): string {
  const diffMs = nowMs - new Date(iso).getTime();
  const minutes = Math.max(0, Math.round(diffMs / 60_000));
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  return remainder > 0 ? `${hours}h ${remainder}m ago` : `${hours}h ago`;
}

export interface ExceptionCardProps {
  exception: ExceptionRecord;
  selected?: boolean;
  onSelect: (id: string) => void;
  /** Frozen render timestamp for freshness math, avoids re-render drift. */
  nowMs: number;
  className?: string;
}

/**
 * Single exception row in the Dynamic Exception Feed (Flow 4.1b). Never
 * renders `exception.priorityScore` — only the coarser `priorityTier` badge
 * communicates urgency, per explicit product instruction. Carries the FR-05
 * stale-data flag, the FR-47 Manually Added badge, the P-02 epistemic tag,
 * and the F-02 live score-pulse micro-label (no numeric delta, a text label
 * only) when `scoreRecentlyUpdated` is true.
 */
export function ExceptionCard({ exception, selected = false, onSelect, nowMs, className }: ExceptionCardProps) {
  const freshness = formatRelativeMinutes(exception.lastUpdatedAt, nowMs);

  return (
    <Card
      onClick={() => onSelect(exception.id)}
      selected={selected}
      className={cn("relative overflow-visible", className)}
    >
      {exception.scoreRecentlyUpdated ? (
        <span
          aria-hidden="true"
          className="absolute -right-1 -top-1 size-3 rounded-full bg-ai-emphasis opacity-40 motion-safe:animate-[cbar-pulse_2.2s_ease-in-out_infinite]"
        />
      ) : null}

      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 flex-wrap items-center gap-1.5">
          <PriorityTierBadge tier={exception.priorityTier} />
          {exception.isManuallyAdded ? (
            <Badge tone="neutral" size="sm">
              Manually added
            </Badge>
          ) : null}
          {exception.isStale ? (
            <span
              className="inline-flex h-5 shrink-0 items-center gap-1 whitespace-nowrap rounded-full bg-warning-surface px-2 text-label-s font-medium text-warning-fg"
              title="Data has not refreshed within the expected window"
            >
              <Clock className="size-3.5 shrink-0" aria-hidden="true" />
              Stale data
            </span>
          ) : null}
        </div>
        <span className="shrink-0 text-caption text-fg-muted">{exception.shipmentId}</span>
      </div>

      <p className="mt-2 text-body-m font-medium leading-snug text-fg-primary">{exception.headline}</p>

      <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-caption text-fg-muted">
        <span>{exception.carrier}</span>
        <span aria-hidden="true" className="text-border-strong">
          &middot;
        </span>
        <span className="inline-flex items-center gap-1">
          <MapPin className="size-3 shrink-0" aria-hidden="true" />
          {exception.location}
        </span>
        <span aria-hidden="true" className="text-border-strong">
          &middot;
        </span>
        <span>Updated {freshness}</span>
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        <EpistemicTag tone={exception.epistemicTone} basis={exception.epistemicBasis} />
        {exception.sourceSystems.map((system) => (
          <Badge key={system} tone="neutral" size="sm">
            {system}
          </Badge>
        ))}
      </div>

      {exception.scoreRecentlyUpdated ? (
        <div className="mt-2 flex items-center gap-1 text-label-s font-medium text-ai-fg">
          <Sparkles className="size-3.5 shrink-0" aria-hidden="true" />
          Priority updated
        </div>
      ) : null}
    </Card>
  );
}
