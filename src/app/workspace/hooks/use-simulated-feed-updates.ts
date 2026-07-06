"use client";

import { useEffect, useRef, useState } from "react";
import type { ExceptionRecord, PriorityTier } from "@/app/workspace/lib/exception-types";

/**
 * Dev-only simulator standing in for the real-time push channel PRD FR-SYS-02
 * describes (no backend exists yet). On an interval it mutates a local copy
 * of the feed's exceptions — new arrival, resolve-and-remove, or a priority
 * re-tier — so `ExceptionFeedList`'s pending-update queue + banner + FLIP
 * apply step has something real to demonstrate against in development.
 *
 * Not wired to any network call; this is purely a fixture generator. Swap
 * this hook out for a real subscription (SSE/websocket) when the backend
 * lands — `ExceptionFeedList` only cares that `exceptions` changes underneath
 * it, not where the change came from.
 */

const TIERS: PriorityTier[] = ["T1", "T2", "T3", "T4"];
const SIM_INTERVAL_MS = 9_000;

function reprioritize(exception: ExceptionRecord): ExceptionRecord {
  const currentIndex = TIERS.indexOf(exception.priorityTier);
  const nextIndex = Math.max(0, currentIndex - 1); // escalate one tier up
  const nextTier = TIERS[nextIndex];
  return {
    ...exception,
    priorityTier: nextTier,
    priorityScore: Math.min(100, exception.priorityScore + 15),
    scoreRecentlyUpdated: true,
    lastUpdatedAt: new Date().toISOString(),
  };
}

function fabricateArrival(source: ExceptionRecord): ExceptionRecord {
  const now = new Date().toISOString();
  return {
    ...source,
    id: `sim-${Date.now()}-${Math.round(Math.random() * 1000)}`,
    priorityTier: "T2",
    priorityScore: 62,
    headline: `New exception detected near ${source.headline.split(" ").slice(-1)[0] ?? "site"}`,
    eventTimestamp: now,
    lastUpdatedAt: now,
    isStale: false,
    isManuallyAdded: false,
    scoreRecentlyUpdated: true,
  };
}

/**
 * Returns a locally-mutated copy of `baseline`, updated on a timer to
 * simulate background feed activity. Pass `enabled: false` to freeze it
 * (e.g. in tests or storybook).
 */
export function useSimulatedFeedUpdates(
  baseline: ExceptionRecord[],
  enabled: boolean = true,
): ExceptionRecord[] {
  const [live, setLive] = useState(baseline);
  // Tracks the identity of the baseline this `live` value was seeded from, so
  // a fresh baseline (e.g. the initial fetch resolving, or a refetch) can be
  // adopted DURING render rather than one render late via an effect. An
  // effect-based re-seed leaves a one-render window where `live` is still the
  // old (possibly empty) value while callers already see the new baseline
  // reflected elsewhere, which can strand the UI on a stale empty state.
  const seededFromRef = useRef(baseline);
  if (seededFromRef.current !== baseline) {
    seededFromRef.current = baseline;
    setLive(baseline);
  }

  useEffect(() => {
    if (!enabled || baseline.length === 0) return;

    const id = window.setInterval(() => {
      setLive((prev) => {
        if (prev.length === 0) return prev;
        const action = Math.random();
        if (action < 0.34) {
          // New exception arrives.
          const template = prev[Math.floor(Math.random() * prev.length)];
          return [fabricateArrival(template), ...prev];
        }
        if (action < 0.67 && prev.length > 1) {
          // An exception resolves and drops out of the queue.
          const target = prev[Math.floor(Math.random() * prev.length)];
          return prev.filter((e) => e.id !== target.id);
        }
        // Re-prioritize one exception (escalate a tier).
        const idx = Math.floor(Math.random() * prev.length);
        const next = [...prev];
        next[idx] = reprioritize(next[idx]);
        return next;
      });
    }, SIM_INTERVAL_MS);

    return () => window.clearInterval(id);
  }, [enabled, baseline.length]);

  return live;
}
