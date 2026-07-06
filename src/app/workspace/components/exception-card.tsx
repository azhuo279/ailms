"use client";

import { useState } from "react";
import { ChevronDown, Clock, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import { Tag, type TagTone } from "@/components/ui/tag";
import { Badge, type BadgeTone } from "@/components/ui/badge";
import { PriorityTierBadge } from "@/components/ui/priority-tier-badge";
import { Tooltip } from "@/components/ui/tooltip";
import { EpistemicTag } from "@/components/ui/epistemic-status";
import {
  buildDelegationStatus,
  buildEscalationStatus,
  type StatusChipTone,
} from "@/app/workspace/lib/exception-handoff";
import type {
  ExceptionRecord,
  PriorityTier,
  SourceSystem,
  Warehouse,
} from "@/app/workspace/lib/exception-types";
import {
  formatRelativeTime,
  getSourceStatus,
  getWarehouse,
  SOURCE_STATUS_LABEL,
  type SourceEpistemicStatus,
} from "@/app/workspace/lib/exception-format";

/**
 * Direction A "Command console" — row-as-record.
 *
 * The exception is no longer a freestanding elevated Card; it is a dense row on
 * a consistent 3-column grid [severity tick | content | trailing priority tag],
 * joined to its neighbors by a single hairline divider with near-zero shadow.
 * Hierarchy is carried by WEIGHT + COLOR, not size jumps or elevation. One
 * concentrated severity accent per row (the leading tick + the shared
 * PriorityTierBadge); metadata stays quiet so severity reads first.
 */

/**
 * Leading severity tick — a ~3px full-row-height bar. T1/T2 read on the
 * reserved `severity` ramp (true exception urgency), T3 on `warning`, T4 on a
 * neutral border-strong so only genuinely high-priority rows carry an alarming
 * accent. Mirrors the map marker/legend fill mapping exactly (severity is
 * twice-encoded: here and on the trailing tag).
 */
const TICK_FILL: Record<PriorityTier, string> = {
  T1: "bg-severity-emphasis",
  T2: "bg-severity-emphasis/80",
  T3: "bg-warning-emphasis",
  T4: "bg-border-strong",
};

/**
 * Source chips stay on one quiet, neutral tone regardless of epistemic status —
 * a source system is an identity, not a status signal, so it should not carry a
 * rainbow of colors that competes with the priority + epistemic tags. The
 * status still surfaces in each chip's tooltip. (Starling: "Let's not give a
 * rainbow colorway to the source systems. Source systems can be ghost badges.")
 */
const SOURCE_STATUS_TONE: Record<SourceEpistemicStatus, TagTone> = {
  verified: "neutral",
  inferred: "neutral",
  stale: "neutral",
};

/**
 * Single quiet source-system chip. Neutral tone regardless of epistemic status
 * (SOURCE_STATUS_TONE) — the status surfaces only in the tooltip. Shared by the
 * inline rendering and the expanded rendering so the two paths stay identical.
 */
function SourceChip({
  system,
  status,
}: {
  system: SourceSystem;
  status: SourceEpistemicStatus;
}) {
  return (
    <Tooltip content={`${system} ${SOURCE_STATUS_LABEL[status]}`}>
      <span
        tabIndex={0}
        className="inline-flex rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-1"
      >
        <Tag tone={SOURCE_STATUS_TONE[status]} size="sm">
          {system}
        </Tag>
      </span>
    </Tooltip>
  );
}

/**
 * Source-system chips for the provenance row. With 2 or fewer systems they
 * render inline as individual quiet chips. With more than 2 they collapse
 * into a single aggregate tag ("N sources") that expands in place to reveal the
 * individual chips, keeping the row low-density when a record touches many
 * systems. The aggregate is a route-local expand/collapse composed from the
 * shared Tag + Tooltip primitives, not a portalled overlay.
 */
function SourceChipGroup({
  systems,
  sourceStatusMap,
}: {
  systems: SourceSystem[];
  sourceStatusMap: Map<SourceSystem, SourceEpistemicStatus>;
}) {
  const [expanded, setExpanded] = useState(false);

  if (systems.length <= 2) {
    return (
      <>
        {systems.map((system) => (
          <SourceChip
            key={system}
            system={system}
            status={getSourceStatus(system, sourceStatusMap)}
          />
        ))}
      </>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setExpanded((prev) => !prev);
        }}
        aria-expanded={expanded}
        className={cn(
          "inline-flex h-5 shrink-0 items-center gap-1 rounded-full bg-surface-sunken pl-1.5 pr-1 text-footnote font-medium text-fg-primary transition-colors",
          "hover:bg-option-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-1",
        )}
      >
        {systems.length} sources
        <ChevronDown
          aria-hidden="true"
          className={cn(
            "size-3 shrink-0 transition-transform motion-reduce:transition-none",
            expanded && "rotate-180",
          )}
        />
      </button>
      {expanded
        ? systems.map((system) => (
            <span
              key={system}
              className="motion-safe:animate-[empty-state-rise-in_200ms_ease-out_both]"
            >
              <SourceChip
                system={system}
                status={getSourceStatus(system, sourceStatusMap)}
              />
            </span>
          ))
        : null}
    </>
  );
}

const CHIP_TONE: Record<StatusChipTone, BadgeTone> = {
  neutral: "neutral",
  warning: "warning",
  success: "success",
  danger: "danger",
};

/**
 * Tab-level handoff status row for a Delegated/Escalated feed card. Shows the
 * owner (dispatcher/approver) name, the send time, a delegated deadline, and a
 * live status chip carrying the latest lifecycle state. Derived from the same
 * handoff status source the detail panels use, so the card and the detail read
 * consistently. The dispatcher/approver stays on the neutral actor treatment;
 * only the status chip carries lifecycle color.
 */
function HandoffStatusRow({ exception }: { exception: ExceptionRecord }) {
  if (exception.queue === "delegated") {
    const status = buildDelegationStatus(exception);
    const latest = status.updates[status.updates.length - 1];
    return (
      <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-caption text-fg-muted">
        <span className="font-medium text-fg-secondary">
          {status.dispatcherName}
        </span>
        <span aria-hidden="true">·</span>
        <span>delegated {status.sentAt}</span>
        <span aria-hidden="true">·</span>
        <span className="inline-flex items-center gap-1">
          <Clock className="size-3 shrink-0" aria-hidden="true" />
          due {status.deadline}
        </span>
        {latest ? (
          <Badge size="sm" tone={CHIP_TONE[latest.tone]} dot>
            {latest.statusLabel}
          </Badge>
        ) : null}
      </div>
    );
  }

  if (exception.queue === "escalated") {
    const status = buildEscalationStatus(exception);
    const latest = status.updates[status.updates.length - 1];
    return (
      <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-caption text-fg-muted">
        <span className="font-medium text-fg-secondary">
          {status.approverName}
        </span>
        <span aria-hidden="true">·</span>
        <span>submitted {status.submittedAt}</span>
        {latest ? (
          <Badge size="sm" tone={CHIP_TONE[latest.tone]} dot>
            {latest.statusLabel}
          </Badge>
        ) : null}
      </div>
    );
  }

  return null;
}

export interface ExceptionCardProps {
  exception: ExceptionRecord;
  selected?: boolean;
  /**
   * True when this row is symmetrically highlighted from the map (its pin, or
   * its site's cluster, is being hovered). Distinct from `selected`: a left
   * primary-accent border + a slight surface shift, never the selection fill.
   */
  highlighted?: boolean;
  onSelect: (id: string) => void;
  /** Pointer enter/leave — drives the feed→map hover link (highlights the pin). */
  onHoverChange?: (id: string | null) => void;
  /** Frozen render timestamp for freshness math, avoids re-render drift. */
  nowMs: number;
  /** Source-system name → epistemic status, for tinting the source chips. */
  sourceStatusMap: Map<SourceSystem, SourceEpistemicStatus>;
  /** Warehouse registry — the source of this row's location + site name. */
  warehouseMap: Map<string, Warehouse>;
  /**
   * True only for a card just revealed by the most recent "View updates" apply.
   * Gates the pulsing AI priority dot so it fires only on those freshly-applied
   * rows for the one-shot window, never on steady-state / initial-load cards.
   */
  showPriorityUpdatePing?: boolean;
  className?: string;
}

/**
 * Single exception row in the Dynamic Exception Feed (Flow 4.1b). Never renders
 * `exception.priorityScore` — only the coarser priority tier communicates
 * urgency, per explicit product instruction.
 *
 * Layout — 3-column grid:
 *   [tick 3px] [content block, min-w-0] [trailing soft priority tag, auto]
 * Content block:
 *   line 1 → optional pulsing AI dot + headline (bold, single-line ellipsis)
 *   line 2 → single muted meta line, dot-separated (carrier · location)
 *   line 3 → merged provenance row: "Detected at <time>" + AI provenance
 *            (EpistemicTag) + quiet source chips (collapsing to an expandable
 *            "N sources" aggregate above 2 systems), all on one wrapping row
 */
export function ExceptionCard({
  exception,
  selected = false,
  highlighted = false,
  onSelect,
  onHoverChange,
  nowMs,
  sourceStatusMap,
  warehouseMap,
  showPriorityUpdatePing = false,
  className,
}: ExceptionCardProps) {
  const freshness = formatRelativeTime(exception.lastUpdatedAt, nowMs);
  const warehouse = getWarehouse(exception, warehouseMap);
  // Warehouse name is the primary geographic label (PRD v1.6 sort/group key);
  // the city/state falls back in when the FK can't resolve.
  const warehouseLabel =
    warehouse?.name ?? warehouse?.location ?? "Location unknown";

  return (
    <button
      type="button"
      onClick={() => onSelect(exception.id)}
      onPointerEnter={() => onHoverChange?.(exception.id)}
      onPointerLeave={() => onHoverChange?.(null)}
      onFocus={() => onHoverChange?.(exception.id)}
      onBlur={() => onHoverChange?.(null)}
      aria-pressed={selected}
      className={cn(
        // row-as-record: 3-col grid, hairline divider, flat (near-zero shadow),
        // subtle neutral hover tint, primary selection-surface tint when active.
        "grid w-full grid-cols-[3px_minmax(0,1fr)_auto] items-start gap-x-2.5 gap-y-0 border-b border-border-subtle px-3.5 py-4 text-left transition-colors",
        "hover:bg-option-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-focus-ring",
        // Highlighted-from-map: left primary accent + slight surface shift.
        // Distinct from selection (no full selection-surface fill) so the two
        // states read differently when both feed and map are in play.
        highlighted &&
          !selected &&
          "bg-selection-surface/50 shadow-[inset_3px_0_0_var(--color-primary-500)]",
        selected && "bg-selection-surface",
        className,
      )}
    >
      {/* Leading severity tick — full-row height. On selection it also carries a
          primary accent (inset shadow) as the visible bridge to the map. */}
      <span
        aria-hidden="true"
        className={cn(
          "h-full self-stretch rounded-sm",
          TICK_FILL[exception.priorityTier],
          selected && "shadow-[inset_2px_0_0_var(--color-primary-700)]",
        )}
      />

      {/* Content block. */}
      <span className="min-w-0">
        {/* Line 1 — headline, optionally prefixed by a pulsing AI dot signalling
            an AI-updated priority. */}
        <span className="flex items-center gap-2">
          {showPriorityUpdatePing ? (
            <span className="relative inline-flex size-2 shrink-0">
              <span
                aria-hidden="true"
                className="absolute inline-flex size-2 rounded-full bg-ai-emphasis opacity-50 motion-safe:animate-ping motion-reduce:animate-none"
              />
              <span
                aria-hidden="true"
                className="relative inline-flex size-2 rounded-full bg-ai-emphasis"
              />
              <span className="sr-only">Priority recently updated by AI</span>
            </span>
          ) : null}
          <span className="min-w-0 flex-1 truncate text-body-m font-bold leading-tight text-fg-primary">
            {exception.headline}
          </span>
          {/* Trailing column — the shared priority tier badge. */}
          <span className="flex shrink-0 flex-col items-end">
            <PriorityTierBadge tier={exception.priorityTier} />
          </span>
        </span>

        {/* Line 2 — single muted meta line, warehouse name only. Carrier was
            removed per Starling feedback so the location reads without competing
            with a redundant carrier label. */}
        <div className="mt-1.5 flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-caption text-fg-muted">
          <MapPin className="size-3 shrink-0" aria-hidden="true" />
          <span className="truncate">{warehouseLabel}</span>
        </div>

        {/* Line 3 — merged provenance row: quiet detection timestamp + AI
            provenance (EpistemicTag), one filled style per tone (Starling: all
            epistemic tags read as a single filled treatment, no outline
            variant) + quiet/monochrome source chips, all on one
            gracefully-wrapping row. With more than 2 source systems the chips
            collapse into a single expandable "N sources" aggregate to keep the
            row low-density. No severity color on AI elements. */}
        <span className="mt-1.5 flex flex-wrap items-center justify-between gap-x-1.5 gap-y-1">
          <div className="flex items-center gap-1.5">
            <EpistemicTag
              tone={exception.epistemicTone}
              basis={exception.epistemicBasis}
            />
            <SourceChipGroup
              systems={exception.sourceSystems}
              sourceStatusMap={sourceStatusMap}
            />
          </div>
          <span className="text-caption text-fg-muted">
            Detected {freshness.short}
          </span>
        </span>

        {/* Line 4 — handoff status (Delegated/Escalated tabs only): owner, time,
            deadline, and a live status chip. Absent on the Pending tab. */}
        <HandoffStatusRow exception={exception} />
      </span>
    </button>
  );
}
