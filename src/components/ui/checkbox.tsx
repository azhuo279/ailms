import { forwardRef, useEffect, useRef } from "react";
import type { InputHTMLAttributes } from "react";
import { Check, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

export type CheckboxSize = "sm" | "md" | "lg";

export interface CheckboxProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "checked" | "onChange" | "size"> {
  checked?: boolean;
  /** Renders the dash mark and sets the native indeterminate property. */
  indeterminate?: boolean;
  onChange?: (checked: boolean) => void;
  label?: string;
  size?: CheckboxSize;
  disabled?: boolean;
  invalid?: boolean;
}

const BOX_SIZE_CLASSES: Record<CheckboxSize, string> = {
  sm: "size-3.5",
  md: "size-4",
  lg: "size-5",
};

// WCAG 2.2 (2.5.8) recommends a 24x24 CSS px minimum touch target. The visible
// box stays at its designed size at every density (14px/16px/20px); this
// expands the invisible hit area around it via negative-margin padding (spacing
// tokens only, rounded up to the nearest step) so every size clears 24px:
// sm 14px + 1.5*2(6*2=12) = 26px, md 16px + 1*2(4*2=8) = 24px, lg 20px + 0.5*2(2*2=4) = 24px.
const HIT_AREA_CLASSES: Record<CheckboxSize, string> = {
  sm: "p-1.5 -m-1.5",
  md: "p-1 -m-1",
  lg: "p-0.5 -m-0.5",
};

const ICON_SIZE_CLASSES: Record<CheckboxSize, string> = {
  sm: "size-2.5",
  md: "size-3",
  lg: "size-3.5",
};

const LABEL_TEXT_CLASSES: Record<CheckboxSize, string> = {
  sm: "text-body-s",
  md: "text-body-m",
  lg: "text-body-l",
};

/**
 * Canonical Checkbox — multiple selection in a group, or a single yes/no
 * consent-style control. Use indeterminate only when true parent-child
 * selection logic exists. Built on a real, visually-hidden input so it stays
 * fully keyboard-operable and accessible.
 */
export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(function Checkbox(
  {
    checked = false,
    indeterminate = false,
    onChange,
    label,
    size = "md",
    disabled = false,
    invalid = false,
    id,
    className,
    ...props
  },
  ref,
) {
  const internalRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    internalRef.current!.indeterminate = indeterminate;
  }, [indeterminate]);

  return (
    <label
      className={cn(
        "inline-flex items-center gap-2",
        disabled ? "cursor-not-allowed" : "cursor-pointer",
        className,
      )}
    >
      <span
        className={cn(
          "relative inline-flex shrink-0 items-center justify-center",
          BOX_SIZE_CLASSES[size],
          HIT_AREA_CLASSES[size],
        )}
      >
        <input
          ref={(node) => {
            internalRef.current = node;
            if (typeof ref === "function") ref(node);
            else if (ref) ref.current = node;
          }}
          id={id}
          type="checkbox"
          role="checkbox"
          checked={checked}
          aria-checked={indeterminate ? "mixed" : checked}
          aria-invalid={invalid || undefined}
          disabled={disabled}
          onChange={(e) => onChange?.(e.target.checked)}
          className="peer sr-only"
          {...props}
        />
        <span
          aria-hidden="true"
          className={cn(
            "flex shrink-0 items-center justify-center rounded border transition-colors",
            BOX_SIZE_CLASSES[size],
            "peer-focus-visible:ring-2 peer-focus-visible:ring-focus-ring peer-focus-visible:ring-offset-2",
            checked || indeterminate
              ? "border-checked bg-checked text-fg-on-primary"
              : "border-border-strong bg-surface-raised",
            invalid && !disabled && "border-danger-border",
            disabled && "border-border-disabled bg-surface-disabled text-fg-disabled",
          )}
        >
          {indeterminate ? (
            <Minus className={ICON_SIZE_CLASSES[size]} strokeWidth={3} />
          ) : checked ? (
            <Check className={ICON_SIZE_CLASSES[size]} strokeWidth={3} />
          ) : null}
        </span>
      </span>
      {label ? (
        <span
          className={cn(
            LABEL_TEXT_CLASSES[size],
            "text-fg-primary",
            disabled && "text-fg-disabled",
            invalid && !disabled && "text-danger-fg",
          )}
        >
          {label}
        </span>
      ) : null}
    </label>
  );
});
