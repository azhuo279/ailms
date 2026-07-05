import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SourceHealth } from "@/app/workspace/lib/exception-types";

const STATUS_DOT_CLASSES: Record<SourceHealth["status"], string> = {
  healthy: "bg-success-emphasis",
  degraded: "bg-warning-emphasis",
  down: "bg-severity-emphasis",
};

const STATUS_LABEL: Record<SourceHealth["status"], string> = {
  healthy: "Healthy",
  degraded: "Degraded",
  down: "Down",
};

export interface SituationBriefBannerProps {
  brief: string;
  sourceHealth: SourceHealth[];
  className?: string;
}

/**
 * F-01 shift-start situation brief plus F-03 data source health rail,
 * combined into a single strip above Row 1. Placement decision: the human's
 * locked 3-row spec (Tabs+CTA / FilterBar / split view) has no dedicated row
 * for either feature, so both live above Row 1 as a lightweight AI-authored
 * banner rather than displacing any of the three mandated rows. The AI
 * authorship of the brief text is signaled via the reserved `ai-*` ramp; the
 * health rail is a status list, not AI-authored, so it stays on neutral/
 * semantic status tokens per the role-reservation rule.
 */
export function SituationBriefBanner({ brief, sourceHealth, className }: SituationBriefBannerProps) {
  const degradedCount = sourceHealth.filter((s) => s.status !== "healthy").length;

  return (
    <div
      className={cn(
        "flex flex-col gap-3 rounded-lg border border-ai-border bg-ai-surface p-4 sm:flex-row sm:items-start sm:justify-between",
        className,
      )}
    >
      <div className="flex min-w-0 flex-1 items-start gap-2.5">
        <Sparkles className="mt-0.5 size-4 shrink-0 text-ai-fg" aria-hidden="true" />
        <p className="text-body-s text-ai-fg">{brief}</p>
      </div>

      <div className="flex shrink-0 flex-wrap items-center gap-x-3 gap-y-1.5 border-t border-ai-border/40 pt-3 sm:w-64 sm:flex-col sm:items-stretch sm:border-l sm:border-t-0 sm:pl-4 sm:pt-0">
        <p className="w-full text-label-s font-medium text-fg-muted">
          Source health {degradedCount > 0 ? `(${degradedCount} attention)` : ""}
        </p>
        <ul className="flex w-full flex-wrap gap-x-3 gap-y-1">
          {sourceHealth.map((source) => (
            <li key={source.system} className="flex items-center gap-1.5" title={source.detail}>
              <span
                aria-hidden="true"
                className={cn("size-1.5 shrink-0 rounded-full", STATUS_DOT_CLASSES[source.status])}
              />
              <span className="text-caption text-fg-secondary">{source.system}</span>
              <span className="sr-only">{STATUS_LABEL[source.status]}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
