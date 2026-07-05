import { forwardRef, useId } from "react";
import type { InputHTMLAttributes } from "react";
import { Loader2, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Field, type FieldStatus } from "./field";
import { Button } from "./button";

export interface SearchFieldProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "size"> {
  /**
   * Visible label. When provided, composes the full Field wrapper (label +
   * helper text). Omit for a bare toolbar/table search bar and rely on
   * `aria-label` instead.
   */
  label?: string;
  helperText?: string;
  /** Overrides helperText when status is invalid/warning/success. Only rendered in labeled mode. */
  validationText?: string;
  status?: FieldStatus;
  /** Accessible name used when no visible `label` is rendered. Defaults to "Search". */
  "aria-label"?: string;
  /** Swaps the leading search icon for a spinner while results are loading. */
  isLoading?: boolean;
  /** Called when the clear button is pressed. Receives a synthetic empty value. */
  onClear?: () => void;
  containerClassName?: string;
}

/**
 * Canonical Search Field — dedicated query entry for global search, table
 * search, and entity lookup. Label-less by default (bare bar with a leading
 * search icon and `aria-label`); pass `label` to compose the full Field
 * wrapper for a form/filter context. Suggestion/result dropdown UI is out of
 * scope — this component owns only the input, clear action, and loading state.
 */
export const SearchField = forwardRef<HTMLInputElement, SearchFieldProps>(function SearchField(
  {
    label,
    helperText,
    validationText,
    status = "default",
    "aria-label": ariaLabel = "Search",
    isLoading = false,
    disabled = false,
    value,
    onClear,
    onChange,
    id,
    className,
    containerClassName,
    ...props
  },
  ref,
) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const hasValue = typeof value === "string" ? value.length > 0 : Boolean(value);

  const renderInput = (fieldInputId: string, describedBy?: string) => (
    <div
      className={cn(
        "flex h-10 items-center gap-2 rounded-md border border-border-subtle bg-surface-raised px-3 text-body-m text-fg-primary transition-colors",
        "has-[input:hover]:border-border-strong",
        "has-[input:focus-visible]:border-border-strong has-[input:focus-visible]:ring-2 has-[input:focus-visible]:ring-focus-ring",
        status === "invalid" && "border-danger-border",
        status === "warning" && "border-warning-border",
        status === "success" && "border-success-border",
        disabled && "border-border-disabled bg-surface-disabled text-fg-disabled",
      )}
    >
      <span className={cn("flex shrink-0 items-center text-fg-muted", disabled && "text-fg-disabled")} aria-hidden="true">
        {isLoading ? <Loader2 className="size-4 animate-spin" /> : <Search className="size-4" />}
      </span>
      <input
        ref={ref}
        id={fieldInputId}
        type="search"
        disabled={disabled}
        value={value}
        onChange={onChange}
        aria-describedby={describedBy}
        aria-label={label ? undefined : ariaLabel}
        aria-invalid={status === "invalid" || undefined}
        className={cn(
          "h-full min-w-0 flex-1 bg-transparent text-body-m text-fg-primary outline-none placeholder:text-fg-muted",
          "disabled:cursor-not-allowed disabled:text-fg-disabled",
          "[&::-webkit-search-cancel-button]:appearance-none",
          className,
        )}
        {...props}
      />
      {hasValue && !disabled ? (
        <Button
          type="button"
          iconOnly
          variant="ghost"
          size="sm"
          className="shrink-0"
          icon={<X />}
          aria-label="Clear search"
          onClick={onClear}
        />
      ) : null}
    </div>
  );

  if (label) {
    return (
      <Field
        label={label}
        htmlFor={inputId}
        helperText={helperText}
        validationText={validationText}
        status={status}
        disabled={disabled}
        className={containerClassName}
      >
        {({ inputId: fieldInputId, describedBy }) => renderInput(fieldInputId, describedBy)}
      </Field>
    );
  }

  return <div className={containerClassName}>{renderInput(inputId)}</div>;
});
