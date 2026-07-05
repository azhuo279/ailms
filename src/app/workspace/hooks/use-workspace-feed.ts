"use client";

import { useQuery } from "@tanstack/react-query";
import {
  workspaceFeedSchema,
  type WorkspaceFeed,
} from "@/app/workspace/lib/exception-types";

// Query key exported as a typed constant, needed for cache invalidation (§5).
export const WORKSPACE_FEED_QUERY_KEY = ["workspace-feed"] as const;
const WORKSPACE_FEED_FIXTURE_PATH = "/mock/workspace-feed.json";

/**
 * Standalone fetcher, testable and swappable. When a real backend lands,
 * change only this function's fetch path/body; hook consumers do not change.
 * Validated at the boundary with Zod (§5).
 */
export async function fetchWorkspaceFeed(): Promise<WorkspaceFeed> {
  const res = await fetch(WORKSPACE_FEED_FIXTURE_PATH);
  if (!res.ok) {
    throw new Error(`Failed to load workspace feed (${res.status})`);
  }
  return workspaceFeedSchema.parse(await res.json());
}

/**
 * Live exception feed for the Workspace screen (Flow 4.1b). Per FR-SYS-02,
 * high-severity exception events should reach the ZOM's feed within 60
 * seconds of origin, so polling is on by default here (unlike the slow-moving
 * fleet-summary KPI hook this pattern was copied from).
 */
export function useWorkspaceFeed(options?: { refetchInterval?: number | false }) {
  return useQuery({
    queryKey: WORKSPACE_FEED_QUERY_KEY,
    queryFn: fetchWorkspaceFeed,
    staleTime: 30_000,
    refetchOnWindowFocus: false,
    refetchInterval: options?.refetchInterval ?? 45_000,
  });
}
