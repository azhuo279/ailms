import { forwardRef, useId } from "react";
import type { InputHTMLAttributes } from "react";
import { Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Field, type FieldStatus } from "./field";
import { Button } from "./button";

export interface NumberFieldProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "onChange" | "value" | "type" | "size" | "min" | "max" | "step"> {
  /** Visible label — never rely on placeholder text alone. */
  label: string;
  helperText?: string;
  /** Overrides helperText when status is invalid/warning/success. */
  validationText?: string;
  status?: FieldStatus;
  optional?: boolean;
  value: number | undefined;
  onChange: (value: number | undefined) => void;
  min?: number;
  max?: number;
  step?: number;
  /** Suffix label shown after the value, e.g. "min", "pallets". */
  unit?: string;
  containerClassName?: string;
}

/**
 * Canonical Number Field — precise numeric entry with small controlled
 * increments, such as package count, pallet count, threshold, or dwell-time
 * minutes. Always allows typed entry in addition to the step buttons.
 */
export const NumberField = forwardRef<HTMLInputElement, NumberFieldProps>(function NumberField(
  {
    label,
    helperText,
    validationText,
    status = "default",
    optional = false,
    required = false,
    disabled = false,
    readOnly = false,
    value,
    onChange,
    min,
    max,
    step = 1,
    unit,
    id,
    className,
    containerClassName,
    ...props
  },
  ref,
) {
  const generatedId = useId();
  const inputId = id ?? generatedId;

  const isAtMin = value !== undefined && min !== undefined && value <= min;
  const isAtMax = value !== undefined && max !== undefined && value >= max;

  const clamp = (next: number) => {
    let clamped = next;
    if (min !== undefined) clamped = Math.max(min, clamped);
    if (max !== undefined) clamped = Math.min(max, clamped);
    return clamped;
  };

  const handleStep = (direction: 1 | -1) => {
    const base = value ?? min ?? 0;
    onChange(clamp(base + direction * step));
  };

  const handleInputChange = (raw: string) => {
    if (raw === "") {
      onChange(undefined);
      return;
    }
    const parsed = Number(raw);
    if (!Number.isNaN(parsed)) {
      onChange(parsed);
    }
  };

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
        <div
          className={cn(
            "flex h-10 items-center gap-1 rounded-md border border-border-subtle bg-surface-raised pl-1 pr-3 transition-colors",
            "has-[input:hover]:border-border-strong",
            "has-[input:focus-visible]:border-border-strong has-[input:focus-visible]:ring-2 has-[input:focus-visible]:ring-focus-ring",
            status === "invalid" && "border-danger-border",
            status === "warning" && "border-warning-border",
            status === "success" && "border-success-border",
            disabled && "border-border-disabled bg-surface-disabled",
            readOnly && !disabled && "bg-surface-sunken",
          )}
        >
          <Button
            type="button"
            iconOnly
            variant="ghost"
            size="sm"
            icon={<Minus />}
            aria-label="Decrease value"
            disabled={disabled || readOnly || isAtMin}
            onClick={() => handleStep(-1)}
          />
          <input
            ref={ref}
            id={fieldInputId}
            type="number"
            inputMode="numeric"
            disabled={disabled}
            readOnly={readOnly}
            required={required}
            min={min}
            max={max}
            step={step}
            value={value ?? ""}
            aria-describedby={describedBy}
            aria-invalid={status === "invalid" || undefined}
            onChange={(event) => handleInputChange(event.target.value)}
            className={cn(
              "h-full min-w-0 flex-1 appearance-none bg-transparent text-center text-body-m text-fg-primary outline-none placeholder:text-fg-muted",
              "disabled:cursor-not-allowed disabled:text-fg-disabled",
              "[appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none",
              className,
            )}
            {...props}
          />
          {unit ? (
            <span className={cn("shrink-0 text-body-s text-fg-muted", disabled && "text-fg-disabled")}>{unit}</span>
          ) : null}
          <Button
            type="button"
            iconOnly
            variant="ghost"
            size="sm"
            icon={<Plus />}
            aria-label="Increase value"
            disabled={disabled || readOnly || isAtMax}
            onClick={() => handleStep(1)}
          />
        </div>
      )}
    </Field>
  );
});
