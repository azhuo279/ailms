"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  auditLogFeedSchema,
  type AuditEvent,
  type AuditLogFeed,
} from "@/app/audit-log/lib/audit-log-types";
import { useAuditSessionStore } from "@/hooks/shared/use-audit-session-store";

// Query key exported for cache invalidation, mirroring the workspace hook.
export const AUDIT_LOG_QUERY_KEY = ["audit-log"] as const;
const AUDIT_LOG_FIXTURE_PATH = "/mock/audit-log.json";

/**
 * Standalone fetcher, testable and swappable. When a real backend lands, change
 * only this function's fetch path; hook consumers do not change. Validated at
 * the boundary with Zod (framework doc §5).
 */
export async function fetchAuditLog(): Promise<AuditLogFeed> {
  const res = await fetch(AUDIT_LOG_FIXTURE_PATH);
  if (!res.ok) {
    throw new Error(`Failed to load audit log (${res.status})`);
  }
  return auditLogFeedSchema.parse(await res.json());
}

/**
 * Audit-log feed (PRD §5.10). The log is append-only history, not a live
 * triage surface, so it does not poll on an interval the way the workspace feed
 * does — it fetches once and stays cached until explicitly refetched.
 */
export function useAuditLog() {
  return useQuery({
    queryKey: AUDIT_LOG_QUERY_KEY,
    queryFn: fetchAuditLog,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });
}

/**
 * Merges the fetched log with the session overlay (useAuditSessionStore): the
 * React Query fetch stays the base of truth, session events (e.g. a priority
 * change made this session on /workspace) are layered on top so they appear in
 * the log until refresh, matching the workspace's optimistic `queueOverrides`
 * pattern.
 *
 * The merge is a plain event list, deduped by id (a session id can never collide
 * with a fetched `aud-*` id, so this only guards double-adds) and sorted
 * newest-first. It stays a FLAT list so the audit-log content pipeline
 * (filterEvents -> clusterEvents) runs over it unchanged — the session events
 * cluster and filter exactly like fetched ones with no special-casing.
 */
export function useMergedAuditEvents(fetched: AuditEvent[]): AuditEvent[] {
  const sessionEvents = useAuditSessionStore((s) => s.events);
  return useMemo(() => {
    if (sessionEvents.length === 0) return fetched;
    const byId = new Map<string, AuditEvent>();
    for (const event of fetched) byId.set(event.id, event);
    for (const event of sessionEvents) byId.set(event.id, event);
    return Array.from(byId.values()).sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
    );
  }, [fetched, sessionEvents]);
}
