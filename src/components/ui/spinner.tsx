import { cn } from "@/lib/utils";

export type SpinnerSize = "sm" | "md" | "lg";

const SIZE_CLASSES: Record<SpinnerSize, string> = {
  sm: "size-4 border-2",
  md: "size-5 border-2",
  lg: "size-8 border-[3px]",
};

export interface SpinnerProps {
  size?: SpinnerSize;
  /** Accessible label announced to assistive tech — the "what" that's loading, not just "loading". */
  label?: string;
  className?: string;
}

/**
 * Canonical Spinner — indeterminate wait indicator for shorter processing
 * moments where percent-complete is unknown. Prefer Skeleton for
 * content-shape loading on cards/tables; prefer Progress Indicator
 * (determinate) when percent-complete is knowable. Avoid showing many
 * spinners simultaneously on one surface.
 */
export function Spinner({ size = "md", label = "Loading", className }: SpinnerProps) {
  return (
    <span
      role="status"
      className={cn(
        "inline-block shrink-0 animate-spin rounded-full border-border-subtle border-t-primary-700",
        SIZE_CLASSES[size],
        className,
      )}
    >
      <span className="sr-only">{label}</span>
    </span>
  );
}
