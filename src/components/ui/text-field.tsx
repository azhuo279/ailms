import { forwardRef, useId, useState } from "react";
import type { InputHTMLAttributes, ReactNode } from "react";
import { Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { Field, type FieldStatus } from "./field";
import { Button } from "./button";

export interface TextFieldProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "prefix" | "size"> {
  /** Visible label — never rely on placeholder text alone. */
  label: string;
  helperText?: string;
  /** Overrides helperText when status is invalid/warning/success. */
  validationText?: string;
  status?: FieldStatus;
  optional?: boolean;
  /** Leading slot, e.g. a unit or fixed value like "$" or "https://". */
  prefix?: ReactNode;
  /** Trailing slot, e.g. a unit label. Ignored for type="password" (eye toggle owns that slot). */
  suffix?: ReactNode;
  /** Shows a live character counter against `maxLength`. */
  showCharacterCount?: boolean;
  containerClassName?: string;
}

/**
 * Canonical Text Field — single-line freeform input for references, IDs,
 * names, cities, tracking numbers, license plates, carrier codes, and other
 * short text values. Use Text Area instead for multi-line notes.
 */
export const TextField = forwardRef<HTMLInputElement, TextFieldProps>(function TextField(
  {
    label,
    helperText,
    validationText,
    status = "default",
    optional = false,
    required = false,
    disabled = false,
    readOnly = false,
    prefix,
    suffix,
    showCharacterCount = false,
    maxLength,
    type = "text",
    value,
    id,
    className,
    containerClassName,
    ...props
  },
  ref,
) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const isPassword = type === "password";
  const resolvedType = isPassword ? (isPasswordVisible ? "text" : "password") : type;
  const currentLength = typeof value === "string" ? value.length : 0;

  return (
    <Field
      label={label}
      htmlFor={inputId}
      helperText={helperText}
      validationText={validationText}
      status={status}
      required={required}
      optional={optional}
      disabled={disabled}
      readOnly={readOnly}
      className={containerClassName}
    >
      {({ inputId: fieldInputId, describedBy }) => (
        <div className="flex flex-col gap-1">
          <div
            className={cn(
              "flex h-10 items-center gap-2 rounded-md border border-border-subtle bg-surface-raised px-3 text-body-m text-fg-primary transition-colors",
              "has-[input:hover]:border-border-strong",
              "has-[input:focus-visible]:border-border-strong has-[input:focus-visible]:ring-2 has-[input:focus-visible]:ring-focus-ring",
              status === "invalid" && "border-danger-border",
              status === "warning" && "border-warning-border",
              status === "success" && "border-success-border",
              disabled && "border-border-disabled bg-surface-disabled text-fg-disabled",
              readOnly && !disabled && "bg-surface-sunken",
            )}
          >
            {prefix ? (
              <span className={cn("flex shrink-0 items-center text-fg-muted", disabled && "text-fg-disabled")} aria-hidden="true">
                {prefix}
              </span>
            ) : null}
            <input
              ref={ref}
              id={fieldInputId}
              type={resolvedType}
              disabled={disabled}
              readOnly={readOnly}
              required={required}
              maxLength={maxLength}
              value={value}
              aria-describedby={describedBy}
              aria-invalid={status === "invalid" || undefined}
              className={cn(
                "h-full min-w-0 flex-1 bg-transparent text-body-m text-fg-primary outline-none placeholder:text-fg-muted",
                "disabled:cursor-not-allowed disabled:text-fg-disabled",
                className,
              )}
              {...props}
            />
            {isPassword ? (
              <Button
                type="button"
                iconOnly
                variant="ghost"
                size="sm"
                className="shrink-0"
                disabled={disabled}
                icon={isPasswordVisible ? <EyeOff /> : <Eye />}
                aria-label={isPasswordVisible ? "Hide password" : "Show password"}
                onClick={() => setIsPasswordVisible((prev) => !prev)}
              />
            ) : suffix ? (
              <span className={cn("flex shrink-0 items-center text-fg-muted", disabled && "text-fg-disabled")} aria-hidden="true">
                {suffix}
              </span>
            ) : null}
          </div>
          {showCharacterCount && maxLength ? (
            <span className={cn("self-end text-caption text-fg-muted", disabled && "text-fg-disabled")}>
              {currentLength}/{maxLength}
            </span>
          ) : null}
        </div>
      )}
    </Field>
  );
});
