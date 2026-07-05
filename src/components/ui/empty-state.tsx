import type { ReactNode } from "react";
import { Inbox } from "lucide-react";
import { cn } from "@/lib/utils";

export type EmptyStateVariant = "default" | "error";

export interface EmptyStateProps {
  /** Icon slot — defaults to a generic inbox glyph. Pass `null` to omit entirely. */
  icon?: ReactNode;
  title: string;
  description?: string;
  primaryAction?: ReactNode;
  secondaryAction?: ReactNode;
  /**
   * Visual register. `default` renders the layered, token-colored ring
   * illustration with a staggered entrance (first-run / no-results / no-access
   * / positive-empty contexts all read as "nothing to build tension about" and
   * can carry more visual weight). `error` renders the flattest possible
   * treatment — a plain icon well, no rings, no stagger, only a quick fade —
   * per the research finding that illustration/motion weight should scale
   * down with severity, not stay constant across contexts.
   */
  variant?: EmptyStateVariant;
  className?: string;
}

/**
 * Canonical Empty State — replaces a content area when there is no data, no
 * search results, no access, or no configured setup. Replace the absent
 * component itself (e.g. the whole table), not just its header, when a
 * surface has nothing to show.
 *
 * `variant="error"` intentionally skips the illustrated ring composition and
 * entrance stagger used by `variant="default"` — error/failure states stay
 * flat and undecorated so visual weight reads as proportional to severity.
 */
export function EmptyState({
  icon,
  title,
  description,
  primaryAction,
  secondaryAction,
  variant = "default",
  className,
}: EmptyStateProps) {
  const showIcon = icon !== null;
  const isError = variant === "error";
  const resolvedIcon = icon ?? <Inbox className={isError ? "size-5" : "size-6"} />;

  return (
    <div className={cn("flex flex-col items-center gap-3 px-6 py-12 text-center", className)}>
      {showIcon ? (
        isError ? (
          <span
            className="flex size-12 items-center justify-center rounded-full bg-danger-surface text-danger-fg motion-safe:animate-[empty-state-fade-in_150ms_ease-out]"
            aria-hidden="true"
          >
            {resolvedIcon}
          </span>
        ) : (
          <span className="relative flex size-16 items-center justify-center" aria-hidden="true">
            <span
              className="absolute inset-0 rounded-full bg-primary-50 motion-safe:animate-[empty-state-ring-in_300ms_ease-out_both]"
            />
            <span
              className="absolute inset-2 rounded-full bg-primary-100 motion-safe:animate-[empty-state-ring-in_300ms_ease-out_40ms_both]"
            />
            <span
              className="relative flex size-12 items-center justify-center rounded-full bg-primary-100 text-primary-700 motion-safe:animate-[empty-state-glyph-in_250ms_ease-out_90ms_both]"
            >
              {resolvedIcon}
            </span>
          </span>
        )
      ) : null}
      <div
        className={cn(
          "flex flex-col gap-1",
          !isError && "motion-safe:animate-[empty-state-rise-in_200ms_ease-out_150ms_both]",
        )}
      >
        <p className="text-heading-m font-semibold text-fg-primary">{title}</p>
        {description ? <p className="max-w-sm text-body-s text-fg-muted">{description}</p> : null}
      </div>
      {primaryAction || secondaryAction ? (
        <div
          className={cn(
            "mt-2 flex items-center gap-2",
            !isError && "motion-safe:animate-[empty-state-rise-in_200ms_ease-out_190ms_both]",
          )}
        >
          {secondaryAction}
          {primaryAction}
        </div>
      ) : null}
    </div>
  );
}
