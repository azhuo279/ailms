/**
 * Route-level loading fallback (framework doc §9). Full-surface skeleton shown
 * while the route's server work / Suspense boundaries resolve.
 */
export default function Loading() {
  return (
    <div className="flex flex-col gap-8">
      <div className="h-8 w-40 animate-pulse rounded bg-surface-raised" />
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="h-24 animate-pulse rounded-lg border border-border-subtle bg-surface-raised"
          />
        ))}
      </div>
    </div>
  );
}
