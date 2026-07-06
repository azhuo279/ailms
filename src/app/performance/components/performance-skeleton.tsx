import { Skeleton } from "@/components/ui/skeleton";

/** Loading placeholder for /performance — mirrors the header → tabs → AI band
 *  → KPI row → table rhythm of the loaded Zone Performance tab. */
export function PerformanceSkeleton() {
  return (
    <div className="flex flex-col gap-4" aria-hidden="true">
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-7 w-40" />
          <Skeleton className="h-4 w-56" />
        </div>
        <Skeleton className="h-4 w-24" />
      </div>

      <div className="flex gap-4 border-b border-border-subtle pb-2">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-5 w-24" />
      </div>

      <Skeleton className="h-24 w-full rounded-xl" />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-28 w-full rounded-lg" />
        ))}
      </div>

      <Skeleton className="h-64 w-full rounded-lg" />
    </div>
  );
}
