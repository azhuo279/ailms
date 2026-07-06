"use client";

import { Package } from "lucide-react";
import { cn } from "@/lib/utils";
import { PriorityTierBadge } from "@/components/ui/priority-tier-badge";
import type { DataTableColumn } from "@/components/ui/data-table";
import { formatDateTimeParts } from "@/app/audit-log/lib/audit-log-format";
import type { AuditCluster, AuditEvent } from "@/app/audit-log/lib/audit-log-types";
import { AuditActorIdentity, AuditEventTag, RichText } from "./audit-log-shared";

/**
 * Audit-log clustering, expressed as the shared DataTable's contract
 * (Direction C). Each table ROW is one exception cluster; expanding it reveals
 * the exception's ordered event rows (newest-first). The per-cluster columns
 * live in `auditClusterColumns`; the expanded event rows live in
 * `AuditClusterEventRows`. The clustering itself is derived upstream in
 * `clusterEvents` and passed in as the DataTable's rows.
 */

/** The highest (numerically lowest) tier across a cluster's events. */
function highestTier(cluster: AuditCluster): AuditEvent["tier"] {
  return cluster.events.reduce(
    (min, e) => (e.tier < min ? e.tier : min),
    cluster.events[0].tier,
  );
}

/**
 * Columns for the cluster-level DataTable rows: exception/shipment identity,
 * highest tier, the latest event's action content, and when it was last
 * updated. The expand chevron and the row-reveal are owned by the DataTable
 * itself.
 */
export const auditClusterColumns: DataTableColumn<AuditCluster>[] = [
  {
    id: "exception",
    header: "Shipment / Exception",
    // Cap to the identity cluster's intrinsic width (icon + id stack) so it does
    // not stretch to fill leftover table width and leave the ids stranded far
    // from the tier column (Starling).
    widthClassName: "w-56",
    cell: (cluster) => (
      <span className="flex items-center gap-3">
        <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-surface-sunken text-fg-secondary">
          <Package className="size-4" aria-hidden="true" />
        </span>
        <span className="flex min-w-0 flex-col leading-tight">
          <span className="text-body-m font-semibold text-fg-primary">
            {cluster.shipmentId}
          </span>
          <span className="text-caption text-fg-muted">{cluster.exceptionId}</span>
        </span>
      </span>
    ),
  },
  {
    id: "tier",
    header: "Highest priority",
    // Cap to the badge's intrinsic width so the tier cell does not stretch to
    // fill leftover width, keeping the badge tight against the identity column
    // (Starling).
    widthClassName: "w-44",
    cell: (cluster) => <PriorityTierBadge tier={highestTier(cluster)} />,
  },
  {
    id: "latest",
    header: "Latest activity",
    // Bound the cell to roughly the truncation width so it does not stretch to
    // fill leftover table width and leave empty space (Starling). Matches the
    // cell's own max-w-md truncation cap.
    widthClassName: "w-96 max-w-md",
    // Show the latest event's action content (the same copy as its expanded
    // child row), truncated to one line. RichText renders **bold** markers.
    cell: (cluster) => (
      <span className="block min-w-0 max-w-md truncate text-body-s text-fg-secondary">
        <RichText text={cluster.events[0].content} />
      </span>
    ),
  },
  {
    id: "updated",
    header: "Last updated",
    align: "end",
    widthClassName: "w-40",
    // Newest-first, so events[0] is the latest activity on the cluster.
    cell: (cluster) => {
      const { date, time } = formatDateTimeParts(cluster.events[0].timestamp);
      return (
        <span className="flex flex-col items-end leading-tight">
          <span className="text-body-s text-fg-secondary">{date}</span>
          <span className="text-caption text-fg-muted">{time}</span>
        </span>
      );
    },
  },
];

/**
 * Expanded-row content for a cluster: the exception's ordered event rows
 * (newest-first). Clicking a row opens the copy-only detail drawer.
 */
export function AuditClusterEventRows({
  cluster,
  onSelectEvent,
  activeEventId,
}: {
  cluster: AuditCluster;
  onSelectEvent: (event: AuditEvent) => void;
  activeEventId: string | null;
}) {
  return (
    <ul className="overflow-hidden rounded-md border border-border-subtle bg-surface-raised">
      {cluster.events.map((event, i) => (
        <li
          key={event.id}
          className={cn(i > 0 && "border-t border-border-subtle")}
        >
          <AuditEventRow
            event={event}
            onSelect={() => onSelectEvent(event)}
            active={event.id === activeEventId}
          />
        </li>
      ))}
    </ul>
  );
}

/**
 * A single event row within a cluster. Its grid is aligned to the parent
 * cluster columns so each child column sits under its parent counterpart
 * (Starling): the actor identity aligns under "Shipment / Exception", the
 * event tag + action content spans the "Highest priority" + "Latest activity"
 * columns, and the timestamp aligns right under "Last updated". The child has
 * no expand chevron, so a left inset stands in for the parent chevron cell's
 * footprint. The per-event tier column was removed — the highest tier is shown
 * once on the cluster row, so repeating it per event is redundant. AI-authored
 * rows carry a subtle `ai-surface` tint and a left accent stripe (FR-41) — NOT
 * the frosted `.ai-card` glass, which is reserved for containerized AI cards
 * (DESIGN.md). The whole row opens the detail drawer.
 */
function AuditEventRow({
  event,
  onSelect,
  active,
}: {
  event: AuditEvent;
  onSelect: () => void;
  active: boolean;
}) {
  const isAi = event.actor.kind === "ai";
  const { date, time } = formatDateTimeParts(event.timestamp);

  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={active}
      className={cn(
        // Grid columns mirror the parent cluster columns so each child column
        // lines up under its parent (Starling): col 1 = actor identity under
        // "Shipment / Exception" (w-56 = 14rem); col 2 = event tag + content
        // spanning "Highest priority" (w-44) + "Latest activity" (w-96) as a
        // flexible middle span; col 3 = timestamp under "Last updated"
        // (w-40 = 10rem), right-aligned. gap-8 (2rem) reproduces the parent's
        // inter-column padding (each parent cell has px-4, so adjacent cells
        // are separated by 2rem). pl-20 (5rem) stands in for the missing expand
        // chevron: 4rem chevron-cell footprint (w-8 + px-4 both sides) + 1rem
        // for the "Shipment / Exception" cell's own left px-4, so the actor's
        // left edge lands exactly under the parent identity content. pr-4 (1rem)
        // matches the "Last updated" cell's right px-4 so the timestamp's right
        // edge aligns with the parent's.
        "grid w-full grid-cols-[14rem_minmax(0,1fr)_10rem] items-center gap-8 border-l-2 py-2.5 pl-20 pr-4 text-left transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-inset",
        // AI-vs-human row treatment (FR-41): subtle teal tint + teal left
        // accent for AI; neutral transparent edge for humans.
        isAi
          ? "border-l-ai-border bg-ai-surface/50 hover:bg-ai-surface"
          : "border-l-transparent hover:bg-option-hover",
        active && (isAi ? "bg-ai-surface" : "bg-option-hover"),
      )}
    >
      {/* Actor identity + label — aligned under the parent "Shipment /
          Exception" column. */}
      <AuditActorIdentity actor={event.actor} />

      {/* Event type tag + truncated action content — spans the parent
          "Highest priority" + "Latest activity" columns. */}
      <span className="flex min-w-0 flex-col gap-1">
        <AuditEventTag type={event.type} className="self-start" />
        <span className="min-w-0 truncate text-body-s text-fg-secondary">
          <RichText text={event.content} />
        </span>
      </span>

      {/* Timestamp — date over precise time (to the second, with tz). DM Sans,
          no mono (DESIGN.md §4): caption/body-s in the shared family.
          Right-aligned under the parent "Last updated" column. */}
      <span className="flex flex-col items-end text-right leading-tight">
        <span className="text-body-s text-fg-secondary">{date}</span>
        <span className="text-caption text-fg-muted">{time}</span>
      </span>
    </button>
  );
}
