import { Skeleton } from "@/components/ui/skeleton";

/**
 * Loading skeleton for the audit log — mirrors the filter-rail + clustered-log
 * layout so the content shape is stable across the load (reuses the canonical
 * Skeleton primitive).
 */
export function AuditLogSkeleton() {
  return (
    <div className="flex min-h-0 flex-1 gap-4" aria-hidden="true">
      {/* Filter rail placeholder. */}
      <div className="flex w-64 shrink-0 flex-col gap-4 rounded-lg border border-border-subtle bg-surface-raised p-4 shadow-sm">
        <Skeleton variant="line" className="w-1/2" />
        <Skeleton variant="block" className="h-9" />
        <Skeleton variant="block" className="h-32" />
        <Skeleton variant="block" className="h-24" />
        <Skeleton variant="block" className="h-9" />
      </div>
      {/* Cluster list placeholder. */}
      <div className="flex min-w-0 flex-1 flex-col gap-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} variant="table-row" className="h-16" />
        ))}
      </div>
    </div>
  );
}
