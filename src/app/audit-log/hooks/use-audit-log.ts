"use client";

import { useQuery } from "@tanstack/react-query";
import {
  auditLogFeedSchema,
  type AuditLogFeed,
} from "@/app/audit-log/lib/audit-log-types";

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
