import { useId } from "react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type FieldStatus = "default" | "invalid" | "warning" | "success";

export interface FieldProps {
  /** Visible label — never rely on placeholder text alone. */
  label: string;
  /** Rendered instead of the label when true, useful for visually-hidden labels handled by consumer. */
  htmlFor?: string;
  helperText?: string;
  /** Overrides helperText when status is invalid/warning/success. */
  validationText?: string;
  status?: FieldStatus;
  required?: boolean;
  optional?: boolean;
  disabled?: boolean;
  readOnly?: boolean;
  children: (ids: { inputId: string; describedBy: string | undefined }) => ReactNode;
  className?: string;
}

const STATUS_TEXT_CLASSES: Record<FieldStatus, string> = {
  default: "text-fg-muted",
  invalid: "text-danger-fg",
  warning: "text-warning-fg",
  success: "text-success-fg",
};

/**
 * Canonical Field — wrapper for any form control that needs a label, helper
 * text, validation, and required/optional treatment. Compose Text Field,
 * Text Area, Select, etc. inside the render-prop `children` so every control
 * gets consistent label/helper/validation wiring for free.
 */
export function Field({
  label,
  htmlFor,
  helperText,
  validationText,
  status = "default",
  required = false,
  optional = false,
  disabled = false,
  readOnly = false,
  children,
  className,
}: FieldProps) {
  const generatedId = useId();
  const inputId = htmlFor ?? generatedId;
  const helperId = `${inputId}-helper`;
  const message = status !== "default" && validationText ? validationText : helperText;
  const describedBy = message ? helperId : undefined;

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <div className="flex items-baseline justify-between gap-2">
        <label
          htmlFor={inputId}
          className={cn(
            "text-label-l font-medium text-fg-primary",
            disabled && "text-fg-disabled",
          )}
        >
          {label}
          {required ? <span className="ml-0.5 text-danger-fg">*</span> : null}
        </label>
        {optional ? <span className="text-caption text-fg-muted">Optional</span> : null}
      </div>
      {children({ inputId, describedBy })}
      {message ? (
        <p
          id={helperId}
          className={cn("text-body-s", STATUS_TEXT_CLASSES[status])}
          role={status === "invalid" ? "alert" : undefined}
        >
          {message}
        </p>
      ) : null}
      {readOnly ? <span className="sr-only">Read-only field</span> : null}
    </div>
  );
}
