"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";

/**
 * Single TanStack Query client for the app. Created lazily in state so it is
 * stable across re-renders and per-request on the server (avoids leaking cache
 * between requests). Data-fetching hooks live in each route's `hooks/` folder
 * and consume this client — see the framework doc §5.
 */
export function QueryProvider({ children }: { children: ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60_000,
            refetchOnWindowFocus: false,
            // Polling is opt-in per hook via `refetchInterval`; background
            // polling is disabled by default (tab-visibility gated). See §6.
            refetchIntervalInBackground: false,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
}
