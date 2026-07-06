import { Skeleton } from "@/components/ui/skeleton";

/**
 * Row-as-record loading placeholder (Direction A). Each skeleton row mirrors the
 * live row grid — a leading severity tick, a headline + shipment bar, a muted
 * meta bar, and a small tag-chip cluster — joined by hairline dividers, plus a
 * trailing priority-tag block. The right pane mirrors the map hero at 40/60, so
 * the page never pops from an empty shell into content.
 */
function SkeletonRow() {
  return (
    <div className="grid grid-cols-[3px_minmax(0,1fr)_auto] items-start gap-x-2.5 border-b border-border-subtle px-3.5 py-2.5">
      <Skeleton variant="block" className="h-full self-stretch rounded-sm" />
      <div className="min-w-0">
        <Skeleton variant="line" className="h-4 w-3/4" />
        <Skeleton variant="line" className="mt-1.5 h-3 w-1/2" />
        <div className="mt-2 flex gap-1.5">
          <Skeleton variant="line" className="h-5 w-16 rounded-full" />
          <Skeleton variant="line" className="h-5 w-20 rounded-full" />
        </div>
      </div>
      <Skeleton variant="line" className="h-6 w-16 rounded-md" />
    </div>
  );
}

export function WorkspaceSkeleton() {
  return (
    <div className="flex h-full flex-col gap-4">
      {/* Row 1 — queue tabs + Add Exception CTA. */}
      <div className="flex shrink-0 items-center justify-between">
        <Skeleton variant="line" className="h-9 w-72" />
        <Skeleton variant="line" className="h-9 w-36" />
      </div>

      {/* Row 2 — filter bar. */}
      <Skeleton variant="block" className="h-16 shrink-0" />

      {/* Row 3 — joined 40/60 console: row-grid feed left, map hero right. */}
      <div className="grid min-h-0 flex-1 grid-cols-[2fr_3fr] overflow-hidden rounded-lg border border-border-subtle">
        <div className="flex min-h-0 flex-col border-r border-border-subtle bg-surface-raised">
          <div className="flex shrink-0 items-center justify-between border-b border-border-subtle px-3.5 py-2">
            <Skeleton variant="line" className="h-3.5 w-24" />
            <Skeleton variant="line" className="h-3.5 w-20" />
          </div>
          <div className="min-h-0 flex-1 overflow-hidden">
            <SkeletonRow />
            <SkeletonRow />
            <SkeletonRow />
            <SkeletonRow />
          </div>
        </div>
        <Skeleton variant="block" className="h-full rounded-none" />
      </div>
    </div>
  );
}
