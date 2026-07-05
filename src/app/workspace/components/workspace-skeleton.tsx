import { Skeleton } from "@/components/ui/skeleton";

/**
 * Full-surface loading placeholder mirroring the locked 3-row layout so the
 * page never pops from an empty shell into content.
 */
export function WorkspaceSkeleton() {
  return (
    <div className="flex h-full flex-col gap-4">
      <Skeleton variant="block" className="h-20 shrink-0" />

      <div className="flex shrink-0 items-center justify-between">
        <Skeleton variant="line" className="h-9 w-72" />
        <Skeleton variant="line" className="h-9 w-36" />
      </div>

      <Skeleton variant="block" className="h-16 shrink-0" />

      <div className="grid min-h-0 flex-1 grid-cols-2 gap-4">
        <div className="flex flex-col gap-3">
          <Skeleton variant="card" />
          <Skeleton variant="card" />
          <Skeleton variant="card" />
        </div>
        <Skeleton variant="block" className="h-full" />
      </div>
    </div>
  );
}
