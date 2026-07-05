import { cn } from "@/lib/utils";

export interface RadioOption {
  label: string;
  value: string;
  disabled?: boolean;
}

export interface RadioGroupProps {
  name: string;
  options: RadioOption[];
  value?: string;
  onChange?: (value: string) => void;
  label?: string;
  helperText?: string;
  disabled?: boolean;
  invalid?: boolean;
  readOnly?: boolean;
  className?: string;
}

/**
 * Canonical Radio Group — use when exactly one option must be chosen from a
 * short, mutually exclusive set. Prefers a vertical layout for scanability
 * and localization; avoid hiding short option sets inside a Select.
 */
export function RadioGroup({
  name,
  options,
  value,
  onChange,
  label,
  helperText,
  disabled = false,
  invalid = false,
  readOnly = false,
  className,
}: RadioGroupProps) {
  return (
    <div role="radiogroup" aria-label={label} className={cn("flex flex-col gap-2", className)}>
      {label ? (
        <span className={cn("text-label-l font-medium text-fg-primary", disabled && "text-fg-disabled")}>
          {label}
        </span>
      ) : null}
      <div className="flex flex-col gap-2">
        {options.map((option) => {
          const isChecked = option.value === value;
          const isDisabled = disabled || option.disabled;
          return (
            <label
              key={option.value}
              className={cn(
                "inline-flex items-center gap-2",
                isDisabled ? "cursor-not-allowed" : readOnly ? "cursor-default" : "cursor-pointer",
              )}
            >
              <span className="relative inline-flex size-4 shrink-0 items-center justify-center">
                <input
                  type="radio"
                  name={name}
                  value={option.value}
                  checked={isChecked}
                  disabled={isDisabled}
                  aria-invalid={invalid || undefined}
                  readOnly={readOnly}
                  onChange={() => {
                    if (!readOnly) onChange?.(option.value);
                  }}
                  className="peer sr-only"
                />
                <span
                  aria-hidden="true"
                  className={cn(
                    "flex size-4 shrink-0 items-center justify-center rounded-full border transition-colors",
                    "peer-focus-visible:ring-2 peer-focus-visible:ring-focus-ring peer-focus-visible:ring-offset-2",
                    isChecked ? "border-checked bg-surface-raised" : "border-border-strong bg-surface-raised",
                    invalid && !isDisabled && "border-danger-border",
                    readOnly && !isDisabled && "bg-surface-sunken",
                    isDisabled && "border-border-disabled bg-surface-disabled",
                  )}
                >
                  {isChecked ? (
                    <span
                      className={cn(
                        "size-2 shrink-0 rounded-full",
                        isDisabled ? "bg-fg-disabled" : "bg-checked",
                      )}
                    />
                  ) : null}
                </span>
              </span>
              <span
                className={cn(
                  "text-body-m text-fg-primary",
                  isDisabled && "text-fg-disabled",
                  invalid && !isDisabled && "text-danger-fg",
                )}
              >
                {option.label}
              </span>
            </label>
          );
        })}
      </div>
      {helperText ? (
        <p className={cn("text-body-s", invalid ? "text-danger-fg" : "text-fg-muted")}>{helperText}</p>
      ) : null}
    </div>
  );
}
