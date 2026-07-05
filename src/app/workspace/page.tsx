import type { Metadata } from "next";
import { Suspense } from "react";
import { WorkspaceContent } from "./components/workspace-content";
import { WorkspaceSkeleton } from "./components/workspace-skeleton";

export const metadata: Metadata = {
  title: "Workspace · AiLMS",
};

/**
 * Workspace — the ZOM's primary/home screen (Flow 4.1b, Triage exception
 * feed). Thin route entry, composes route components directly (framework doc
 * §3). `WorkspaceContent` reads `useSearchParams` for the selected-exception
 * route param, so it needs a Suspense boundary here per Next.js's App Router
 * requirement for that hook.
 */
export default function WorkspacePage() {
  return (
    <div className="flex h-full w-full flex-col">
      <h1 className="sr-only">Workspace</h1>
      <Suspense fallback={<WorkspaceSkeleton />}>
        <WorkspaceContent />
      </Suspense>
    </div>
  );
}
