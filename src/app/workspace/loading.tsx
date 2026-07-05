import { WorkspaceSkeleton } from "./components/workspace-skeleton";

/**
 * Route-level loading fallback (framework doc §9). Mirrors the locked 3-row
 * layout shape so the page never pops from an empty shell into content.
 */
export default function Loading() {
  return (
    <div className="h-full w-full">
      <WorkspaceSkeleton />
    </div>
  );
}
