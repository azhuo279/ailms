"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronDown, Loader2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Field, type FieldStatus } from "./field";
import { Button } from "./button";

export interface ComboboxOption {
  label: string;
  value: string;
  disabled?: boolean;
}

export interface ComboboxProps {
  options: ComboboxOption[];
  /** Selected value(s) — a single value string, or an array when `multiple`. */
  value?: string | string[];
  onChange?: (value: string | string[]) => void;
  inputValue?: string;
  onInputChange?: (value: string) => void;
  placeholder?: string;
  isLoading?: boolean;
  multiple?: boolean;
  disabled?: boolean;
  readOnly?: boolean;
  /** Allow committing free text not present in `options`. */
  freeform?: boolean;
  /** Override the default case-insensitive substring filter. */
  filterFn?: (options: ComboboxOption[], inputValue: string) => ComboboxOption[];
  label: string;
  helperText?: string;
  status?: FieldStatus;
  validationText?: string;
  required?: boolean;
  optional?: boolean;
  className?: string;
}

const defaultFilterFn = (options: ComboboxOption[], inputValue: string) => {
  const needle = inputValue.trim().toLowerCase();
  if (!needle) return options;
  return options.filter((o) => o.label.toLowerCase().includes(needle));
};

/**
 * Canonical Combobox — typing plus a suggestion list, optionally multi-select
 * or freeform entry. Use for long option lists or typeahead; use Select
 * instead when the user picks from a short known set without typing.
 */
export function Combobox({
  options,
  value,
  onChange,
  inputValue: controlledInputValue,
  onInputChange,
  placeholder = "Search...",
  isLoading = false,
  multiple = false,
  disabled = false,
  readOnly = false,
  freeform = false,
  filterFn = defaultFilterFn,
  label,
  helperText,
  status = "default",
  validationText,
  required,
  optional,
  className,
}: ComboboxProps) {
  const [open, setOpen] = useState(false);
  const [internalInputValue, setInternalInputValue] = useState("");
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [rect, setRect] = useState<{ top: number; left: number; width: number } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const listboxRef = useRef<HTMLUListElement>(null);

  const inputValue = controlledInputValue ?? internalInputValue;
  const selectedValues = useMemo<string[]>(
    () => (multiple ? (Array.isArray(value) ? value : []) : []),
    [multiple, value],
  );
  const singleSelected = useMemo(
    () => (!multiple && typeof value === "string" ? options.find((o) => o.value === value) : undefined),
    [multiple, options, value],
  );

  const filteredOptions = useMemo(() => filterFn(options, inputValue), [filterFn, options, inputValue]);

  const setInputValue = (v: string) => {
    if (onInputChange) onInputChange(v);
    else setInternalInputValue(v);
  };

  const updateRect = () => {
    const el = containerRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    setRect({ top: r.bottom, left: r.left, width: r.width });
  };

  useLayoutEffect(() => {
    if (open) updateRect();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handleReposition = () => updateRect();
    window.addEventListener("resize", handleReposition);
    window.addEventListener("scroll", handleReposition, true);
    return () => {
      window.removeEventListener("resize", handleReposition);
      window.removeEventListener("scroll", handleReposition, true);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handlePointerDown = (e: PointerEvent) => {
      const target = e.target as Node;
      if (containerRef.current?.contains(target)) return;
      if (listboxRef.current?.contains(target)) return;
      setOpen(false);
    };
    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [open]);

  const openListbox = () => {
    if (disabled || readOnly) return;
    setHighlightedIndex(filteredOptions.findIndex((o) => !o.disabled));
    setOpen(true);
  };

  const closeListbox = () => setOpen(false);

  const commitOption = (option: ComboboxOption) => {
    if (option.disabled) return;
    if (multiple) {
      const next = selectedValues.includes(option.value)
        ? selectedValues.filter((v) => v !== option.value)
        : [...selectedValues, option.value];
      onChange?.(next);
      setInputValue("");
    } else {
      onChange?.(option.value);
      setInputValue(option.label);
      closeListbox();
    }
  };

  const commitFreeform = () => {
    if (!freeform || !inputValue.trim()) return;
    if (multiple) {
      const next = selectedValues.includes(inputValue) ? selectedValues : [...selectedValues, inputValue];
      onChange?.(next);
      setInputValue("");
    } else {
      onChange?.(inputValue);
      closeListbox();
    }
  };

  const removePill = (v: string) => {
    onChange?.(selectedValues.filter((sv) => sv !== v));
  };

  const moveHighlight = (direction: 1 | -1) => {
    setHighlightedIndex((prev) => {
      if (filteredOptions.length === 0) return -1;
      let next = prev;
      for (let i = 0; i < filteredOptions.length; i += 1) {
        next = (next + direction + filteredOptions.length) % filteredOptions.length;
        if (!filteredOptions[next].disabled) return next;
      }
      return prev;
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (disabled || readOnly) return;
    if (!open && ["ArrowDown", "ArrowUp"].includes(e.key)) {
      e.preventDefault();
      openListbox();
      return;
    }
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        if (!open) openListbox();
        else moveHighlight(1);
        break;
      case "ArrowUp":
        e.preventDefault();
        moveHighlight(-1);
        break;
      case "Enter":
        e.preventDefault();
        if (open && highlightedIndex >= 0 && filteredOptions[highlightedIndex]) {
          commitOption(filteredOptions[highlightedIndex]);
        } else if (freeform) {
          commitFreeform();
        }
        break;
      case "Escape":
        e.preventDefault();
        closeListbox();
        break;
      case "Backspace":
        if (multiple && inputValue === "" && selectedValues.length > 0) {
          removePill(selectedValues[selectedValues.length - 1]);
        }
        break;
      default:
        break;
    }
  };

  const showClear = !multiple && (inputValue.length > 0 || Boolean(singleSelected)) && !disabled && !readOnly;

  return (
    <Field
      label={label}
      helperText={helperText}
      validationText={validationText}
      status={status}
      required={required}
      optional={optional}
      disabled={disabled}
      readOnly={readOnly}
      className={className}
    >
      {({ inputId, describedBy }) => (
        <div ref={containerRef} className="relative">
          <div
            className={cn(
              "flex min-h-10 w-full flex-wrap items-center gap-1.5 rounded-md border bg-surface-raised px-2 py-1 text-body-m transition-colors",
              "focus-within:ring-2 focus-within:ring-focus-ring",
              status === "invalid" ? "border-danger-border" : "border-border-subtle",
              status === "warning" && "border-warning-border",
              status === "success" && "border-success-border",
              disabled && "cursor-not-allowed border-border-disabled bg-surface-disabled",
              readOnly && !disabled && "cursor-default bg-surface-sunken",
            )}
          >
            {multiple
              ? selectedValues.map((v) => {
                  const opt = options.find((o) => o.value === v);
                  return (
                    <span
                      key={v}
                      className="inline-flex items-center gap-1 rounded-full bg-option-hover px-2 py-0.5 text-label-s text-fg-primary"
                    >
                      {opt?.label ?? v}
                      {!disabled && !readOnly ? (
                        <Button
                          iconOnly
                          aria-label={`Remove ${opt?.label ?? v}`}
                          icon={<X />}
                          size="sm"
                          variant="ghost"
                          className="size-4 rounded-full text-fg-muted hover:text-fg-primary"
                          onClick={() => removePill(v)}
                        />
                      ) : null}
                    </span>
                  );
                })
              : null}
            <input
              ref={inputRef}
              id={inputId}
              role="combobox"
              aria-expanded={open}
              aria-haspopup="listbox"
              aria-autocomplete="list"
              aria-describedby={describedBy}
              disabled={disabled}
              readOnly={readOnly}
              placeholder={multiple && selectedValues.length > 0 ? "" : placeholder}
              value={inputValue}
              onChange={(e) => {
                if (readOnly) return;
                setInputValue(e.target.value);
                if (!open) openListbox();
                else setHighlightedIndex(0);
              }}
              onFocus={openListbox}
              onKeyDown={handleKeyDown}
              className={cn(
                "min-w-16 flex-1 bg-transparent text-fg-primary outline-none placeholder:text-fg-muted",
                disabled && "cursor-not-allowed text-fg-disabled",
              )}
            />
            {isLoading ? <Loader2 className="size-4 shrink-0 animate-spin text-fg-muted" aria-hidden="true" /> : null}
            {showClear ? (
              <Button
                iconOnly
                aria-label="Clear"
                icon={<X />}
                size="sm"
                variant="ghost"
                className="size-6"
                onClick={() => {
                  setInputValue("");
                  onChange?.(multiple ? [] : "");
                  inputRef.current?.focus();
                }}
              />
            ) : null}
            <ChevronDown
              aria-hidden="true"
              className={cn(
                "size-4 shrink-0 text-fg-muted transition-transform",
                open && "rotate-180",
              )}
            />
          </div>
          {open && rect
            ? createPortal(
                <ul
                  ref={listboxRef}
                  role="listbox"
                  aria-labelledby={inputId}
                  style={{ position: "fixed", top: rect.top, left: rect.left, width: rect.width }}
                  className="z-50 mt-1 max-h-64 overflow-auto rounded-md border border-border-subtle bg-surface-overlay py-1 shadow-lg"
                >
                  {isLoading ? (
                    <li className="flex items-center gap-2 px-3 py-2 text-body-s text-fg-muted">
                      <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                      Loading...
                    </li>
                  ) : filteredOptions.length === 0 ? (
                    <li className="px-3 py-2 text-body-s text-fg-muted">
                      {freeform ? "Press Enter to add" : "No matches"}
                    </li>
                  ) : (
                    filteredOptions.map((option, index) => {
                      const isSelected = multiple
                        ? selectedValues.includes(option.value)
                        : option.value === value;
                      const isHighlighted = index === highlightedIndex;
                      return (
                        <li
                          key={option.value}
                          role="option"
                          aria-selected={isSelected}
                          aria-disabled={option.disabled || undefined}
                          onMouseEnter={() => setHighlightedIndex(index)}
                          onClick={() => commitOption(option)}
                          className={cn(
                            "flex cursor-pointer items-center px-3 py-2 text-body-m text-fg-primary",
                            isHighlighted && "bg-option-hover",
                            isSelected && "font-medium text-link",
                            option.disabled && "cursor-not-allowed text-fg-disabled",
                          )}
                        >
                          {option.label}
                        </li>
                      );
                    })
                  )}
                </ul>,
                document.body,
              )
            : null}
        </div>
      )}
    </Field>
  );
}
