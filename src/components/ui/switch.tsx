import { forwardRef } from "react";
import type { InputHTMLAttributes } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export type SwitchSize = "sm" | "md" | "lg";

export interface SwitchProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "checked" | "onChange" | "size"> {
  checked?: boolean;
  onChange?: (checked: boolean) => void;
  label?: string;
  size?: SwitchSize;
  disabled?: boolean;
  isLoading?: boolean;
  readOnly?: boolean;
  invalid?: boolean;
}

const TRACK_SIZE_CLASSES: Record<SwitchSize, string> = {
  sm: "h-5 w-9",
  md: "h-6 w-11",
  lg: "h-7 w-[3.25rem]",
};

const THUMB_SIZE_CLASSES: Record<SwitchSize, string> = {
  sm: "size-4",
  md: "size-5",
  lg: "size-6",
};

const THUMB_TRANSLATE_CLASSES: Record<SwitchSize, string> = {
  sm: "translate-x-4",
  md: "translate-x-5",
  lg: "translate-x-6",
};

const SPINNER_SIZE_CLASSES: Record<SwitchSize, string> = {
  sm: "size-2.5",
  md: "size-3",
  lg: "size-3.5",
};

/**
 * Canonical Switch — a standalone on/off setting or a verbose setting-row
 * toggle. Not for choosing one of several options — use Radio Group for
 * that. Built on a real, visually-hidden checkbox input (role="switch") so
 * it stays fully keyboard-operable and accessible.
 */
export const Switch = forwardRef<HTMLInputElement, SwitchProps>(function Switch(
  {
    checked = false,
    onChange,
    label,
    size = "md",
    disabled = false,
    isLoading = false,
    readOnly = false,
    invalid = false,
    id,
    className,
    ...props
  },
  ref,
) {
  const isDisabled = disabled || isLoading;

  return (
    <label
      className={cn(
        "inline-flex items-center gap-2",
        isDisabled ? "cursor-not-allowed" : readOnly ? "cursor-default" : "cursor-pointer",
        className,
      )}
    >
      <span className={cn("relative inline-flex shrink-0 items-center", TRACK_SIZE_CLASSES[size])}>
        <input
          ref={ref}
          id={id}
          type="checkbox"
          role="switch"
          checked={checked}
          aria-checked={checked}
          aria-invalid={invalid || undefined}
          aria-readonly={readOnly || undefined}
          disabled={isDisabled}
          readOnly={readOnly}
          onChange={(e) => {
            if (!readOnly) onChange?.(e.target.checked);
          }}
          className="peer sr-only"
          {...props}
        />
        <span
          aria-hidden="true"
          className={cn(
            "flex shrink-0 items-center rounded-full border border-transparent px-0.5 transition-colors",
            TRACK_SIZE_CLASSES[size],
            "peer-focus-visible:ring-2 peer-focus-visible:ring-focus-ring peer-focus-visible:ring-offset-2",
            checked ? "bg-checked" : "bg-surface-sunken",
            invalid && !isDisabled && "ring-1 ring-danger-border",
            readOnly && !isDisabled && "opacity-70",
            isDisabled && "bg-surface-disabled",
          )}
        >
          <span
            className={cn(
              "flex shrink-0 items-center justify-center rounded-full bg-surface-raised shadow-sm transition-transform",
              THUMB_SIZE_CLASSES[size],
              checked && THUMB_TRANSLATE_CLASSES[size],
            )}
          >
            {isLoading ? (
              <Loader2 className={cn("animate-spin text-fg-muted", SPINNER_SIZE_CLASSES[size])} aria-hidden="true" />
            ) : null}
          </span>
        </span>
      </span>
      {label ? (
        <span className={cn("text-body-m text-fg-primary", isDisabled && "text-fg-disabled")}>{label}</span>
      ) : null}
    </label>
  );
});
