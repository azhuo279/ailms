"use client";

import { useQuery } from "@tanstack/react-query";
import {
  performanceFeedSchema,
  type PerformanceFeed,
} from "@/app/performance/lib/performance-types";

// Query key exported as a typed constant, needed for cache invalidation (§5).
export const PERFORMANCE_FEED_QUERY_KEY = ["performance-feed"] as const;
const PERFORMANCE_FEED_FIXTURE_PATH = "/mock/performance-feed.json";

/**
 * Standalone fetcher, testable and swappable — mirrors `fetchWorkspaceFeed`.
 * When a real backend lands, change only this function's fetch path/body; hook
 * consumers do not change. Validated at the boundary with Zod (§5).
 */
export async function fetchPerformanceFeed(): Promise<PerformanceFeed> {
  const res = await fetch(PERFORMANCE_FEED_FIXTURE_PATH);
  if (!res.ok) {
    throw new Error(`Failed to load performance feed (${res.status})`);
  }
  return performanceFeedSchema.parse(await res.json());
}

/**
 * Zone performance + AI adoption feed for the /performance screen. Unlike the
 * workspace exception feed (60s freshness target), these are slow-moving
 * analytics KPIs, so polling is off by default and the data is simply
 * re-fetched on demand.
 */
export function usePerformanceFeed() {
  return useQuery({
    queryKey: PERFORMANCE_FEED_QUERY_KEY,
    queryFn: fetchPerformanceFeed,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });
}
