import { forwardRef, useId } from "react";
import type { TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/utils";
import { Field, type FieldStatus } from "./field";

export type TextAreaResize = "none" | "vertical" | "both";

export interface TextAreaProps
  extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "size"> {
  /** Visible label — never rely on placeholder text alone. */
  label: string;
  helperText?: string;
  /** Overrides helperText when status is invalid/warning/success. */
  validationText?: string;
  status?: FieldStatus;
  optional?: boolean;
  /** Which axes the textarea may be resized along. Defaults to "vertical". */
  resize?: TextAreaResize;
  /** Shows a live character counter against `maxLength`. */
  showCharacterCount?: boolean;
  containerClassName?: string;
}

const RESIZE_CLASSES: Record<TextAreaResize, string> = {
  none: "resize-none",
  vertical: "resize-y",
  both: "resize",
};

/**
 * Canonical Text Area — multi-line freeform input for notes, instructions,
 * issue descriptions, exception handling, and dispatch comments. Follows the
 * same visible label / helper text / accessible validation rules as Text Field.
 */
export const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(function TextArea(
  {
    label,
    helperText,
    validationText,
    status = "default",
    optional = false,
    required = false,
    disabled = false,
    readOnly = false,
    rows = 4,
    resize = "vertical",
    showCharacterCount = false,
    maxLength,
    value,
    id,
    className,
    containerClassName,
    ...props
  },
  ref,
) {
  const generatedId = useId();
  const textareaId = id ?? generatedId;
  const currentLength = typeof value === "string" ? value.length : 0;

  return (
    <Field
      label={label}
      htmlFor={textareaId}
      helperText={helperText}
      validationText={validationText}
      status={status}
      required={required}
      optional={optional}
      disabled={disabled}
      readOnly={readOnly}
      className={containerClassName}
    >
      {({ inputId, describedBy }) => (
        <div className="flex flex-col gap-1">
          <textarea
            ref={ref}
            id={inputId}
            rows={rows}
            disabled={disabled}
            readOnly={readOnly}
            required={required}
            maxLength={maxLength}
            value={value}
            aria-describedby={describedBy}
            aria-invalid={status === "invalid" || undefined}
            className={cn(
              "w-full rounded-md border border-border-subtle bg-surface-raised px-3 py-2 text-body-m text-fg-primary outline-none transition-colors placeholder:text-fg-muted",
              RESIZE_CLASSES[resize],
              "hover:border-border-strong",
              "focus-visible:border-border-strong focus-visible:ring-2 focus-visible:ring-focus-ring",
              status === "invalid" && "border-danger-border",
              status === "warning" && "border-warning-border",
              status === "success" && "border-success-border",
              disabled && "cursor-not-allowed border-border-disabled bg-surface-disabled text-fg-disabled hover:border-border-disabled",
              readOnly && !disabled && "bg-surface-sunken",
              className,
            )}
            {...props}
          />
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
