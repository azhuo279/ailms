import { cn } from "@/lib/utils";

export type ProgressIndicatorVariant = "determinate" | "indeterminate";

export interface ProgressIndicatorProps {
  variant?: ProgressIndicatorVariant;
  /** 0-100. Ignored (and required to be omitted) when `variant="indeterminate"`. */
  value?: number;
  /** What is progressing — required so the bar states an actual subject, not just animation. */
  label: string;
  /** Show the numeric percentage next to the label (determinate only). */
  showValueText?: boolean;
  className?: string;
}

/**
 * Canonical Progress Indicator — shows progress of a process or multi-step
 * workflow. Use `determinate` when percent-complete is knowable, and
 * `indeterminate` for an ongoing process with an unknown endpoint (prefer
 * Spinner instead for a short, generic wait with no label). Prefer one
 * Progress Indicator per process — do not stack multiple for one operation.
 */
export function ProgressIndicator({
  variant = "determinate",
  value = 0,
  label,
  showValueText = true,
  className,
}: ProgressIndicatorProps) {
  const clamped = Math.min(100, Math.max(0, value));

  return (
    <div className={cn("w-full", className)}>
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <span className="text-label-m font-medium text-fg-primary">{label}</span>
        {variant === "determinate" && showValueText ? (
          <span className="text-caption text-fg-muted">{Math.round(clamped)}%</span>
        ) : null}
      </div>
      <div
        role="progressbar"
        aria-label={label}
        aria-valuenow={variant === "determinate" ? clamped : undefined}
        aria-valuemin={variant === "determinate" ? 0 : undefined}
        aria-valuemax={variant === "determinate" ? 100 : undefined}
        className="h-2 w-full overflow-hidden rounded-full bg-surface-sunken"
      >
        {variant === "determinate" ? (
          <div
            className="h-full rounded-full bg-btn-primary transition-[width] duration-300 ease-out"
            style={{ width: `${clamped}%` }}
          />
        ) : (
          <div className="h-full w-1/3 animate-[progress-indeterminate_1.4s_ease-in-out_infinite] rounded-full bg-btn-primary" />
        )}
      </div>
    </div>
  );
}
