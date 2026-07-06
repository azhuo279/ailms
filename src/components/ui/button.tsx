import { forwardRef } from "react";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export type ButtonVariant = "primary" | "secondary" | "ghost";
export type ButtonSize = "sm" | "md" | "lg";

interface ButtonBaseProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Shows a spinner and disables interaction. */
  isLoading?: boolean;
  /** Applies destructive (danger) emphasis on top of the chosen variant. */
  destructive?: boolean;
  /** Toggle/pressed state, e.g. for a segmented action. */
  isSelected?: boolean;
}

interface ButtonWithLabelProps extends ButtonBaseProps {
  /** Icon-only configuration — omit `children` and provide `icon` + `aria-label` instead. */
  iconOnly?: false;
  leadingIcon?: ReactNode;
  trailingIcon?: ReactNode;
  icon?: never;
  children: ReactNode;
}

interface ButtonIconOnlyProps extends ButtonBaseProps {
  /** Renders the square, icon-only configuration (was the standalone Icon Button). */
  iconOnly: true;
  icon: ReactNode;
  leadingIcon?: never;
  trailingIcon?: never;
  children?: never;
  /** Required in icon-only mode — Button must always have an accessible name. */
  "aria-label": string;
}

export type ButtonProps = ButtonWithLabelProps | ButtonIconOnlyProps;

const SIZE_CLASSES: Record<ButtonSize, string> = {
  sm: "h-7 gap-1.5 rounded-md px-2.5 text-body-s",
  md: "h-9 gap-1.5 rounded-md px-3.5 text-body-m",
  lg: "h-11 gap-2 rounded-md px-4 text-body-l",
};

const ICON_ONLY_SIZE_CLASSES: Record<ButtonSize, string> = {
  sm: "size-7 rounded-md",
  md: "size-9 rounded-md",
  lg: "size-11 rounded-md",
};

const ICON_SIZE_CLASSES: Record<ButtonSize, string> = {
  sm: "size-4",
  md: "size-4",
  lg: "size-5",
};

const ICON_ONLY_GLYPH_SIZE_CLASSES: Record<ButtonSize, string> = {
  sm: "size-4",
  md: "size-5",
  lg: "size-6",
};

function variantClasses(
  variant: ButtonVariant,
  destructive: boolean,
  isSelected: boolean,
  iconOnly: boolean,
) {
  if (destructive) {
    return iconOnly
      ? "text-danger-fg hover:bg-danger-surface focus-visible:ring-danger-border"
      : "bg-danger-border text-fg-on-primary hover:bg-severity-700 focus-visible:ring-danger-border";
  }
  if (variant === "primary") {
    return cn(
      "bg-btn-primary text-btn-primary-fg hover:bg-btn-primary-hover focus-visible:ring-focus-ring",
      isSelected && "bg-btn-primary-hover",
    );
  }
  if (variant === "secondary") {
    return cn(
      "border border-border-strong bg-btn-secondary text-btn-secondary-fg hover:bg-btn-secondary-hover focus-visible:ring-focus-ring",
      isSelected && "bg-btn-secondary-hover",
    );
  }
  // ghost
  return cn(
    iconOnly
      ? "bg-transparent text-fg-secondary hover:bg-option-hover"
      : "bg-transparent text-btn-secondary-fg hover:bg-option-hover",
    "focus-visible:ring-focus-ring",
    isSelected && "bg-option-hover",
  );
}

/**
 * Canonical Button — triggers an on-page action (submit, save, create, assign,
 * confirm, run). Use Link instead if the intent is navigation.
 *
 * Set `iconOnly` to render the square, label-less configuration (space-constrained
 * or universally-recognizable actions like search/close/refresh/pin) — this replaces
 * what was previously a separate `IconButton` component. Icon-only mode requires
 * `icon` + `aria-label` in place of `children`.
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(props, ref) {
    const {
      variant = "primary",
      size = "md",
      isLoading = false,
      destructive = false,
      isSelected = false,
      disabled,
      className,
      ...rest
    } = props;

    const isDisabled = disabled || isLoading;

    if (props.iconOnly) {
      const {
        icon,
        iconOnly: _iconOnly,
        ...buttonProps
      } = rest as ButtonIconOnlyProps;

      return (
        <button
          ref={ref}
          type="button"
          disabled={isDisabled}
          aria-pressed={isSelected || undefined}
          aria-busy={isLoading || undefined}
          className={cn(
            "inline-flex shrink-0 items-center justify-center transition-colors",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
            ICON_ONLY_SIZE_CLASSES[size],
            variantClasses(variant, destructive, isSelected, true),
            isDisabled && "cursor-not-allowed text-fg-disabled",
            className,
          )}
          {...buttonProps}
        >
          {isLoading ? (
            <Loader2
              className={cn("animate-spin", ICON_ONLY_GLYPH_SIZE_CLASSES[size])}
              aria-hidden="true"
            />
          ) : (
            <span
              className={cn(
                "inline-flex items-center justify-center",
                ICON_ONLY_GLYPH_SIZE_CLASSES[size],
              )}
              aria-hidden="true"
            >
              {icon}
            </span>
          )}
        </button>
      );
    }

    const {
      leadingIcon,
      trailingIcon,
      children,
      iconOnly: _iconOnly2,
      icon: _icon,
      ...buttonProps
    } = rest as ButtonWithLabelProps;

    return (
      <button
        ref={ref}
        type="button"
        disabled={isDisabled}
        aria-pressed={isSelected || undefined}
        aria-busy={isLoading || undefined}
        className={cn(
          "inline-flex shrink-0 items-center justify-center whitespace-nowrap font-medium transition-colors",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
          SIZE_CLASSES[size],
          variantClasses(variant, destructive, isSelected, false),
          isDisabled &&
            "cursor-not-allowed bg-surface-disabled text-fg-disabled hover:bg-surface-disabled",
          className,
        )}
        {...buttonProps}
      >
        {isLoading ? (
          <Loader2
            className={cn("animate-spin", ICON_SIZE_CLASSES[size])}
            aria-hidden="true"
          />
        ) : leadingIcon ? (
          <span
            className={cn(
              "inline-flex shrink-0 items-center justify-center",
              ICON_SIZE_CLASSES[size],
            )}
            aria-hidden="true"
          >
            {leadingIcon}
          </span>
        ) : null}
        <span className="inline-flex items-center">{children}</span>
        {!isLoading && trailingIcon ? (
          <span
            className={cn(
              "inline-flex shrink-0 items-center justify-center",
              ICON_SIZE_CLASSES[size],
            )}
            aria-hidden="true"
          >
            {trailingIcon}
          </span>
        ) : null}
      </button>
    );
  },
);
