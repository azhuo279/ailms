import type { Metadata } from "next";
import { Suspense } from "react";
import { AuditLogContent } from "./components/audit-log-content";
import { AuditLogSkeleton } from "./components/audit-log-skeleton";

export const metadata: Metadata = {
  title: "Audit Log · AiLMS",
};

/**
 * Audit Log (PRD §5.10, FR-40/FR-41/FR-42) — the immutable, exception-clustered
 * record of AI recommendations and human actions, with a persistent left filter
 * rail. Thin route entry; `AuditLogContent` reads `useSearchParams` for the
 * `?exception=<id>` deep-link, so it needs a Suspense boundary per the App
 * Router requirement for that hook.
 */
export default function AuditLogPage() {
  return (
    <div className="flex h-full min-h-0 w-full flex-col">
      <Suspense fallback={<AuditLogSkeleton />}>
        <AuditLogContent />
      </Suspense>
    </div>
  );
}
