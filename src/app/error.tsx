"use client";

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";

/**
 * Route-level error boundary (framework doc §9). Catches render/throw errors
 * for this surface and offers a reset(). Never silently render empty UI.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Wire this to a real logger when observability lands.
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 text-center">
      <AlertTriangle className="size-10 text-status-delayed" aria-hidden />
      <div>
        <h1 className="text-lg font-semibold text-fg-primary">
          Something went wrong
        </h1>
        <p className="mt-1 max-w-sm text-sm text-fg-secondary">
          {error.message || "An unexpected error occurred on this page."}
        </p>
      </div>
      <button
        type="button"
        onClick={reset}
        className="rounded-md border border-border-strong px-4 py-2 text-sm font-medium text-fg-primary transition-colors hover:bg-surface-sunken"
      >
        Try again
      </button>
    </div>
  );
}
