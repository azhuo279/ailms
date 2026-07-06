import type { ReactNode } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export type TagTone = "neutral" | "success" | "warning" | "danger";
export type TagSize = "sm" | "md";

const TONE_CLASSES: Record<TagTone, string> = {
  neutral: "bg-surface-sunken text-fg-primary",
  success: "bg-success-surface text-success-fg",
  warning: "bg-warning-surface text-warning-fg",
  danger: "bg-danger-surface text-danger-fg",
};

const SELECTED_TONE_CLASSES: Record<TagTone, string> = {
  neutral: "bg-checked text-fg-on-primary",
  success: "bg-success-emphasis text-fg-on-primary",
  warning: "bg-warning-emphasis text-fg-on-primary",
  danger: "bg-danger-border text-fg-on-primary",
};

const SIZE_CLASSES: Record<TagSize, string> = {
  sm: "h-5 gap-1 pl-1.5 pr-1 text-footnote",
  md: "h-6 gap-1 pl-2 pr-1.5 text-footnote",
};

const SIZE_CLASSES_NO_REMOVE: Record<TagSize, string> = {
  sm: "h-5 gap-1 px-1.5 text-footnote",
  md: "h-6 gap-1 px-2 text-footnote",
};

const REMOVE_ICON_SIZE: Record<TagSize, string> = {
  sm: "size-3",
  md: "size-3.5",
};

const REMOVE_BUTTON_SIZE: Record<TagSize, string> = {
  sm: "size-3.5",
  md: "size-4",
};

export interface TagProps {
  children: ReactNode;
  tone?: TagTone;
  size?: TagSize;
  /** Leading icon slot, e.g. a carrier or category glyph. */
  leadingIcon?: ReactNode;
  /** Renders a remove control and calls back when it's activated. */
  onRemove?: () => void;
  /** Toggled/applied appearance — filled emphasis instead of a subtle surface. */
  isSelected?: boolean;
  /** Makes the whole tag clickable (e.g. a toggleable filter token). */
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
}

/**
 * Canonical Tag — labels, categorizes, or represents an applied value,
 * especially filter tokens and selected entities. Unlike Badge (system-owned
 * status/count), a Tag represents a user-picked or removable value. Keep
 * labels concise; expose the full value via `title` if it can truncate.
 */
export function Tag({
  children,
  tone = "neutral",
  size = "md",
  leadingIcon,
  onRemove,
  isSelected = false,
  onClick,
  disabled = false,
  className,
}: TagProps) {
  const isInteractive = Boolean(onClick) && !disabled;
  const Component = onClick ? "button" : "span";

  return (
    <Component
      type={onClick ? "button" : undefined}
      onClick={isInteractive ? onClick : undefined}
      disabled={onClick ? disabled : undefined}
      aria-pressed={onClick ? isSelected : undefined}
      className={cn(
        "inline-flex shrink-0 items-center rounded-full font-medium transition-colors",
        onRemove ? SIZE_CLASSES[size] : SIZE_CLASSES_NO_REMOVE[size],
        isSelected ? SELECTED_TONE_CLASSES[tone] : TONE_CLASSES[tone],
        isInteractive && "cursor-pointer hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2",
        disabled && "cursor-not-allowed bg-surface-disabled text-fg-disabled",
        className,
      )}
    >
      {leadingIcon ? (
        <span className={cn("inline-flex shrink-0", REMOVE_ICON_SIZE[size])} aria-hidden="true">
          {leadingIcon}
        </span>
      ) : null}
      <span className="truncate">{children}</span>
      {onRemove ? (
        <button
          type="button"
          disabled={disabled}
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          aria-label="Remove"
          className={cn(
            "flex shrink-0 items-center justify-center rounded-full transition-colors",
            REMOVE_BUTTON_SIZE[size],
            "hover:bg-option-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring",
          )}
        >
          <X className={REMOVE_ICON_SIZE[size]} aria-hidden="true" />
        </button>
      ) : null}
    </Component>
  );
}
