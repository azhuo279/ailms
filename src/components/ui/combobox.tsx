"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronDown, Loader2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Field, type FieldStatus } from "./field";
import { Button } from "./button";
import { Checkbox } from "./checkbox";

export interface ComboboxOption {
  /**
   * Row content. A plain string renders as text and is also what typeahead
   * filters against. A ReactNode renders richer content (e.g. a name beside a
   * role badge); when used, supply `searchText` so filtering and the selected
   * summary still have a plain-text handle.
   */
  label: React.ReactNode;
  value: string;
  disabled?: boolean;
  /**
   * Plain-text handle used for typeahead filtering and the resting selected
   * summary when `label` is a ReactNode. Falls back to `label` when it is a
   * string.
   */
  searchText?: string;
}

/** Plain-text handle for an option — its `searchText`, or the label if it is a string. */
function optionText(option: ComboboxOption): string {
  if (option.searchText !== undefined) return option.searchText;
  return typeof option.label === "string" ? option.label : "";
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
  /**
   * Whether the trigger is a typeahead text input (default) or a plain button.
   * Set `false` for a multi-select checklist over a short, known option set
   * where typing adds nothing — the trigger becomes a button showing the
   * selection summary, and the listbox rows are checkboxes with no filter.
   */
  searchable?: boolean;
  disabled?: boolean;
  readOnly?: boolean;
  /** Allow committing free text not present in `options`. */
  freeform?: boolean;
  /** Override the default case-insensitive substring filter. */
  filterFn?: (
    options: ComboboxOption[],
    inputValue: string,
  ) => ComboboxOption[];
  label: string;
  /** Opt-in override for the Field label styling (e.g. small-caps filter labels). */
  labelClassName?: string;
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
  return options.filter((o) => optionText(o).toLowerCase().includes(needle));
};

/**
 * Canonical Combobox — the single primitive for picking from an option list,
 * single- or multi-select. Three shapes:
 *
 * - **Single-select typeahead** (`searchable`, default) — type to filter, pick one.
 * - **Multi-select typeahead** (`multiple` + `searchable`) — type to filter,
 *   toggle several via checkbox rows; the resting trigger shows a selection
 *   summary ("Any" / one label / "N selected").
 * - **Multi-select checklist** (`multiple`, `searchable={false}`) — no typing;
 *   a button trigger shows the summary and the listbox is a checkbox checklist,
 *   for short known sets like priority tiers.
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
  searchable = true,
  disabled = false,
  readOnly = false,
  freeform = false,
  filterFn = defaultFilterFn,
  label,
  labelClassName,
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
  const [rect, setRect] = useState<{
    top: number;
    left: number;
    width: number;
  } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const listboxRef = useRef<HTMLUListElement>(null);

  // A non-searchable trigger is a plain button; only searchable modes carry a
  // text input for typeahead filtering.
  const isSearchable = searchable;

  const inputValue = controlledInputValue ?? internalInputValue;
  const selectedValues = useMemo<string[]>(
    () => (multiple ? (Array.isArray(value) ? value : []) : []),
    [multiple, value],
  );
  const singleSelected = useMemo(
    () =>
      !multiple && typeof value === "string"
        ? options.find((o) => o.value === value)
        : undefined,
    [multiple, options, value],
  );

  // Resting selection summary shown in the trigger for multi-select (C2):
  // 0 → placeholder, 1 → that option's label, 2+ → "N selected".
  const summaryLabel = useMemo(() => {
    if (!multiple) return placeholder;
    if (selectedValues.length === 0) return placeholder;
    if (selectedValues.length === 1) {
      const only = options.find((o) => o.value === selectedValues[0]);
      return only ? optionText(only) : placeholder;
    }
    return `${selectedValues.length} selected`;
  }, [multiple, options, placeholder, selectedValues]);

  const hasSelection = multiple
    ? selectedValues.length > 0
    : Boolean(singleSelected);

  // Non-searchable mode never filters; searchable modes apply the filter fn.
  const filteredOptions = useMemo(
    () => (isSearchable ? filterFn(options, inputValue) : options),
    [isSearchable, filterFn, options, inputValue],
  );

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

  const toggleListbox = () => {
    if (disabled || readOnly) return;
    if (open) closeListbox();
    else openListbox();
  };

  const commitOption = (option: ComboboxOption) => {
    if (option.disabled) return;
    if (multiple) {
      const next = selectedValues.includes(option.value)
        ? selectedValues.filter((v) => v !== option.value)
        : [...selectedValues, option.value];
      onChange?.(next);
      setInputValue("");
      // Multi-select keeps the listbox open across toggles.
    } else {
      onChange?.(option.value);
      setInputValue(optionText(option));
      closeListbox();
    }
  };

  const commitFreeform = () => {
    if (!freeform || !inputValue.trim()) return;
    if (multiple) {
      const next = selectedValues.includes(inputValue)
        ? selectedValues
        : [...selectedValues, inputValue];
      onChange?.(next);
      setInputValue("");
    } else {
      onChange?.(inputValue);
      closeListbox();
    }
  };

  const moveHighlight = (direction: 1 | -1) => {
    setHighlightedIndex((prev) => {
      if (filteredOptions.length === 0) return -1;
      let next = prev;
      for (let i = 0; i < filteredOptions.length; i += 1) {
        next =
          (next + direction + filteredOptions.length) % filteredOptions.length;
        if (!filteredOptions[next].disabled) return next;
      }
      return prev;
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLElement>) => {
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
        if (
          open &&
          highlightedIndex >= 0 &&
          filteredOptions[highlightedIndex]
        ) {
          commitOption(filteredOptions[highlightedIndex]);
        } else if (freeform) {
          commitFreeform();
        }
        break;
      case " ":
        // Button trigger: space selects the highlighted row (multi checklist).
        if (!isSearchable) {
          e.preventDefault();
          if (
            open &&
            highlightedIndex >= 0 &&
            filteredOptions[highlightedIndex]
          ) {
            commitOption(filteredOptions[highlightedIndex]);
          } else {
            openListbox();
          }
        }
        break;
      case "Escape":
        e.preventDefault();
        closeListbox();
        break;
      case "Backspace":
        if (
          isSearchable &&
          multiple &&
          inputValue === "" &&
          selectedValues.length > 0
        ) {
          onChange?.(selectedValues.slice(0, -1));
        }
        break;
      default:
        break;
    }
  };

  const showClear =
    isSearchable &&
    !multiple &&
    (inputValue.length > 0 || Boolean(singleSelected)) &&
    !disabled &&
    !readOnly;

  const triggerFrameClasses = cn(
    "flex min-h-10 w-full items-center gap-1.5 rounded-md border bg-surface-raised px-2 py-1 text-body-m transition-colors",
    status === "invalid" ? "border-danger-border" : "border-border-subtle",
    status === "warning" && "border-warning-border",
    status === "success" && "border-success-border",
    disabled && "cursor-not-allowed border-border-disabled bg-surface-disabled",
    readOnly && !disabled && "cursor-default bg-surface-sunken",
  );

  return (
    <Field
      label={label}
      labelClassName={labelClassName}
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
          {isSearchable ? (
            <div
              className={cn(
                triggerFrameClasses,
                "focus-within:ring-2 focus-within:ring-focus-ring",
              )}
            >
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
                placeholder={multiple ? summaryLabel : placeholder}
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
                  // In multi mode the placeholder carries the selection summary,
                  // so render it darker when something is selected.
                  multiple && hasSelection && "placeholder:text-fg-primary",
                  disabled && "cursor-not-allowed text-fg-disabled",
                )}
              />
              {isLoading ? (
                <Loader2
                  className="size-4 shrink-0 animate-spin text-fg-muted"
                  aria-hidden="true"
                />
              ) : null}
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
              <button
                type="button"
                tabIndex={-1}
                aria-label={open ? "Close options" : "Open options"}
                aria-expanded={open}
                aria-controls={open ? `${inputId}-listbox` : undefined}
                disabled={disabled}
                onClick={() => {
                  toggleListbox();
                  if (!open) inputRef.current?.focus();
                }}
                className="flex shrink-0 items-center justify-center rounded-sm text-fg-muted transition-colors hover:text-fg-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
              >
                <ChevronDown
                  aria-hidden="true"
                  className={cn(
                    "size-4 transition-transform",
                    open && "rotate-180",
                  )}
                />
              </button>
            </div>
          ) : (
            <button
              ref={triggerRef}
              id={inputId}
              type="button"
              role="combobox"
              aria-expanded={open}
              aria-haspopup="listbox"
              aria-controls={open ? `${inputId}-listbox` : undefined}
              aria-describedby={describedBy}
              disabled={disabled}
              onClick={toggleListbox}
              onKeyDown={handleKeyDown}
              className={cn(
                triggerFrameClasses,
                "text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring",
                !disabled && "cursor-pointer",
              )}
            >
              <span
                className={cn(
                  "min-w-0 flex-1 truncate",
                  hasSelection ? "text-fg-primary" : "text-fg-muted",
                )}
              >
                {summaryLabel}
              </span>
              {isLoading ? (
                <Loader2
                  className="size-4 shrink-0 animate-spin text-fg-muted"
                  aria-hidden="true"
                />
              ) : null}
              <ChevronDown
                aria-hidden="true"
                className={cn(
                  "size-4 shrink-0 text-fg-muted transition-transform",
                  open && "rotate-180",
                )}
              />
            </button>
          )}
          {open && rect
            ? createPortal(
                <ul
                  ref={listboxRef}
                  id={`${inputId}-listbox`}
                  role="listbox"
                  aria-labelledby={inputId}
                  aria-multiselectable={multiple || undefined}
                  style={{
                    position: "fixed",
                    top: rect.top,
                    left: rect.left,
                    width: rect.width,
                  }}
                  className="z-50 mt-1 max-h-64 overflow-auto rounded-md border border-border-subtle bg-surface-overlay py-1 shadow-lg"
                >
                  {isLoading ? (
                    <li className="flex items-center gap-2 px-4 py-2 text-body-s text-fg-muted">
                      <Loader2
                        className="size-4 animate-spin"
                        aria-hidden="true"
                      />
                      Loading...
                    </li>
                  ) : filteredOptions.length === 0 ? (
                    <li className="px-4 py-2 text-body-s text-fg-muted">
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
                            "flex cursor-pointer items-center gap-3 px-4 py-2 text-body-m text-fg-primary",
                            isHighlighted && "bg-option-hover",
                            // Checkbox rows carry their own selected affordance;
                            // single-select keeps the link-colored selected row.
                            !multiple && isSelected && "font-medium text-link",
                            option.disabled &&
                              "cursor-not-allowed text-fg-disabled",
                          )}
                        >
                          {multiple ? (
                            <>
                              <Checkbox
                                checked={isSelected}
                                disabled={option.disabled}
                                tabIndex={-1}
                                aria-hidden="true"
                                className="pointer-events-none"
                              />
                              <span className="min-w-0 flex-1 truncate">
                                {option.label}
                              </span>
                            </>
                          ) : (
                            option.label
                          )}
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
