import type {
  AuditCluster,
  AuditEvent,
  AuditEventType,
} from "./audit-log-types";

/**
 * Audit-log formatting + derivation helpers. Kept out of the components so the
 * timestamp convention (to the second, with tz — FR-40), the event-type
 * vocabulary, the clustering (Direction C), the filter predicate, and the CSV
 * serialization live in one testable place and stay consistent across the
 * table, the applied-filter chips, the drawer, and the export.
 */

/**
 * Absolute timestamp to the second with a trailing zone label, e.g.
 * "Jul 5, 2026, 2:28:14 PM CT" (FR-40). Audit records demand a precise,
 * unambiguous time — unlike the workspace feed's coarse relative labels — so
 * this is its own convention. DM Sans throughout (no mono, DESIGN.md §4).
 */
const ABSOLUTE_TO_SECOND: Intl.DateTimeFormatOptions = {
  year: "numeric",
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
  second: "2-digit",
  timeZoneName: "short",
};

const DATE_ONLY: Intl.DateTimeFormatOptions = {
  year: "numeric",
  month: "short",
  day: "numeric",
};

const TIME_TO_SECOND: Intl.DateTimeFormatOptions = {
  hour: "numeric",
  minute: "2-digit",
  second: "2-digit",
  timeZoneName: "short",
};

export function formatAbsolute(iso: string): string {
  return new Intl.DateTimeFormat("en-US", ABSOLUTE_TO_SECOND).format(
    new Date(iso),
  );
}

/** Split date + time for the two-line row treatment (date over time). */
export function formatDateTimeParts(iso: string): { date: string; time: string } {
  const d = new Date(iso);
  return {
    date: new Intl.DateTimeFormat("en-US", DATE_ONLY).format(d),
    time: new Intl.DateTimeFormat("en-US", TIME_TO_SECOND).format(d),
  };
}

/**
 * Per-event-type config: the human label, the stable actor kind, and the
 * semantic token classes for the typed tag (icon + color). AI-authored events
 * use the reserved `ai-*` ramp (ai_recommendation only). Human/system events
 * stay on neutral/status/info ramps so the AI type reads distinctly and the
 * reserved teal is never spent on ordinary types (DESIGN.md §1, CLAUDE.md).
 * `severity-*` is intentionally NOT used here — it is reserved for true alert
 * states; an escalation/override is an action record, not an alert.
 */
export interface EventTypeConfig {
  label: string;
  /** Tailwind classes for the typed tag surface + fg. */
  tagClass: string;
}

export const EVENT_TYPE_CONFIG: Record<AuditEventType, EventTypeConfig> = {
  ai_recommendation: {
    label: "AI recommendation",
    // Reserved AI ramp — the only type on the teal ramp.
    tagClass: "bg-ai-surface text-ai-fg",
  },
  approval: {
    label: "Approval",
    tagClass: "bg-success-surface text-success-fg",
  },
  override: {
    label: "Override",
    tagClass: "bg-warning-surface text-warning-fg",
  },
  escalation: {
    label: "Escalation",
    tagClass: "bg-info-surface text-info-fg",
  },
  delegation: {
    label: "Delegation",
    tagClass: "bg-info-surface text-info-fg",
  },
  customs_hold: {
    label: "Customs hold",
    tagClass: "bg-surface-sunken text-fg-secondary",
  },
  tier_routing: {
    label: "Tier routing",
    tagClass: "bg-surface-sunken text-fg-secondary",
  },
  feedback: {
    label: "Feedback",
    tagClass: "bg-surface-sunken text-fg-secondary",
  },
};

/** Stable order for the action-type filter checklist. */
export const EVENT_TYPE_ORDER: AuditEventType[] = [
  "ai_recommendation",
  "approval",
  "override",
  "escalation",
  "delegation",
  "customs_hold",
  "tier_routing",
  "feedback",
];

export const TIER_ORDER = ["T1", "T2", "T3", "T4"] as const;

/**
 * Groups a flat, filtered event list into per-exception clusters (Direction C),
 * each ordered newest-first internally, and the clusters themselves ordered by
 * their most-recent event (newest activity first — FR row spec). Re-runs on the
 * FILTERED set so clustering always reflects the current filters.
 */
export function clusterEvents(events: AuditEvent[]): AuditCluster[] {
  const byException = new Map<string, AuditEvent[]>();
  for (const event of events) {
    const bucket = byException.get(event.exceptionId);
    if (bucket) bucket.push(event);
    else byException.set(event.exceptionId, [event]);
  }

  const clusters: AuditCluster[] = [];
  for (const [exceptionId, bucket] of byException) {
    const ordered = [...bucket].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
    );
    clusters.push({
      exceptionId,
      shipmentId: ordered[0].shipmentId,
      latestTimestamp: ordered[0].timestamp,
      events: ordered,
    });
  }

  return clusters.sort(
    (a, b) =>
      new Date(b.latestTimestamp).getTime() -
      new Date(a.latestTimestamp).getTime(),
  );
}

export interface AuditFilters {
  /** "all" | "ai" | "human" — actor-type toggle. */
  actorKind: "all" | "ai" | "human";
  /** Selected event types; empty = all. */
  types: string[];
  /** Selected tiers; empty = all. */
  tiers: string[];
  /** Selected exception ids; empty = all. */
  exceptionIds: string[];
  /** Selected user ids; empty = all. */
  userIds: string[];
  /** Inclusive date range on the event timestamp; nulls = unbounded. */
  dateStart: Date | null;
  dateEnd: Date | null;
}

export const EMPTY_FILTERS: AuditFilters = {
  actorKind: "all",
  types: [],
  tiers: [],
  exceptionIds: [],
  userIds: [],
  dateStart: null,
  dateEnd: null,
};

export function isFiltered(f: AuditFilters): boolean {
  return (
    f.actorKind !== "all" ||
    f.types.length > 0 ||
    f.tiers.length > 0 ||
    f.exceptionIds.length > 0 ||
    f.userIds.length > 0 ||
    f.dateStart !== null ||
    f.dateEnd !== null
  );
}

/** Applies all facets to the flat event set (FR-42). */
export function filterEvents(
  events: AuditEvent[],
  f: AuditFilters,
): AuditEvent[] {
  const startMs = f.dateStart ? f.dateStart.getTime() : null;
  const endMs = f.dateEnd
    ? new Date(
        f.dateEnd.getFullYear(),
        f.dateEnd.getMonth(),
        f.dateEnd.getDate(),
        23,
        59,
        59,
        999,
      ).getTime()
    : null;

  return events.filter((e) => {
    const matchesActor = f.actorKind === "all" || e.actor.kind === f.actorKind;
    const matchesType = f.types.length === 0 || f.types.includes(e.type);
    const matchesTier = f.tiers.length === 0 || f.tiers.includes(e.tier);
    const matchesException =
      f.exceptionIds.length === 0 || f.exceptionIds.includes(e.exceptionId);
    const matchesUser =
      f.userIds.length === 0 || f.userIds.includes(e.actor.id);
    const ts = new Date(e.timestamp).getTime();
    const matchesDate =
      (startMs === null || ts >= startMs) && (endMs === null || ts <= endMs);
    return (
      matchesActor &&
      matchesType &&
      matchesTier &&
      matchesException &&
      matchesUser &&
      matchesDate
    );
  });
}

/** Strips the mock **bold** markers for plain-text contexts (drawer copy, CSV). */
export function stripBold(text: string): string {
  return text.replace(/\*\*/g, "");
}

/**
 * Serializes the currently-filtered events to CSV (FR-42 export). Content is
 * de-bolded and RFC-4180 quoted so embedded commas/quotes/newlines survive.
 */
export function eventsToCsv(events: AuditEvent[]): string {
  const header = [
    "Timestamp",
    "Event type",
    "Actor",
    "Actor role",
    "Actor kind",
    "Tier",
    "Exception ID",
    "Shipment ID",
    "Action content",
  ];
  const quote = (v: string) => `"${v.replace(/"/g, '""')}"`;
  const rows = events.map((e) =>
    [
      formatAbsolute(e.timestamp),
      EVENT_TYPE_CONFIG[e.type].label,
      e.actor.name,
      e.actor.role,
      e.actor.kind,
      e.tier,
      e.exceptionId,
      e.shipmentId,
      stripBold(e.content),
    ]
      .map(quote)
      .join(","),
  );
  return [header.map(quote).join(","), ...rows].join("\r\n");
}
