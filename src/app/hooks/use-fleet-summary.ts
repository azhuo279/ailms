"use client";

// ⚠️ SCAFFOLD EXAMPLE — safe to delete. Reference implementation of the §5 data
// hook shape (query key constant + standalone fetcher + useQuery). Keep it as a
// pattern reference or delete once real feeds exist. See SCAFFOLD.md.
import { useQuery } from "@tanstack/react-query";
import {
  fleetSummarySchema,
  type FleetSummary,
} from "@/app/lib/fleet-summary-types";

// Query key exported as a typed constant — needed for cache invalidation (§5).
export const FLEET_SUMMARY_QUERY_KEY = ["fleet-summary"] as const;
const FLEET_SUMMARY_FIXTURE_PATH = "/mock/fleet-summary.json";

/**
 * Standalone fetcher — testable and swappable. When a real backend lands,
 * change only this function's fetch path/body; hook consumers do not change.
 * The JSON shape is validated at the boundary with Zod (§5).
 */
export async function fetchFleetSummary(): Promise<FleetSummary> {
  const res = await fetch(FLEET_SUMMARY_FIXTURE_PATH);
  if (!res.ok) {
    throw new Error(`Failed to load fleet summary (${res.status})`);
  }
  return fleetSummarySchema.parse(await res.json());
}

export function useFleetSummary(options?: { refetchInterval?: number }) {
  return useQuery({
    queryKey: FLEET_SUMMARY_QUERY_KEY,
    queryFn: fetchFleetSummary,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
    // Overview KPIs move slowly; leave polling opt-in per §6.
    refetchInterval: options?.refetchInterval,
  });
}
