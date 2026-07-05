"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Field, type FieldStatus } from "./field";

export interface SelectOption {
  label: string;
  value: string;
  disabled?: boolean;
}

export interface SelectProps {
  options: SelectOption[];
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  label: string;
  helperText?: string;
  status?: FieldStatus;
  validationText?: string;
  required?: boolean;
  optional?: boolean;
  readOnly?: boolean;
  className?: string;
}

/**
 * Canonical Select — single-choice form control from a known option set,
 * especially appropriate when the user is submitting a value and
 * mobile-friendly native-style interaction is beneficial. Prefer Radio Group
 * when there are very few options and comparison matters; use Combobox
 * instead if users need to type or filter.
 */
export function Select({
  options,
  value,
  onChange,
  placeholder = "Select an option",
  disabled = false,
  label,
  helperText,
  status = "default",
  validationText,
  required,
  optional,
  readOnly = false,
  className,
}: SelectProps) {
  const [open, setOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [rect, setRect] = useState<{ top: number; left: number; width: number } | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const listboxRef = useRef<HTMLUListElement>(null);

  const selectedOption = useMemo(() => options.find((o) => o.value === value), [options, value]);

  const updateRect = () => {
    const el = triggerRef.current;
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
      if (triggerRef.current?.contains(target)) return;
      if (listboxRef.current?.contains(target)) return;
      setOpen(false);
    };
    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [open]);

  const openListbox = () => {
    if (disabled || readOnly) return;
    const idx = options.findIndex((o) => o.value === value);
    setHighlightedIndex(idx >= 0 ? idx : options.findIndex((o) => !o.disabled));
    setOpen(true);
  };

  const closeListbox = () => setOpen(false);

  const commitSelection = (option: SelectOption) => {
    if (option.disabled) return;
    onChange?.(option.value);
    closeListbox();
    triggerRef.current?.focus();
  };

  const moveHighlight = (direction: 1 | -1) => {
    setHighlightedIndex((prev) => {
      let next = prev;
      for (let i = 0; i < options.length; i += 1) {
        next = (next + direction + options.length) % options.length;
        if (!options[next].disabled) return next;
      }
      return prev;
    });
  };

  const handleTriggerKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (disabled || readOnly) return;
    if (!open) {
      if (["Enter", " ", "ArrowDown", "ArrowUp"].includes(e.key)) {
        e.preventDefault();
        openListbox();
      }
      return;
    }
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        moveHighlight(1);
        break;
      case "ArrowUp":
        e.preventDefault();
        moveHighlight(-1);
        break;
      case "Enter":
      case " ":
        e.preventDefault();
        if (highlightedIndex >= 0) commitSelection(options[highlightedIndex]);
        break;
      case "Escape":
        e.preventDefault();
        closeListbox();
        break;
      case "Tab":
        closeListbox();
        break;
      default:
        break;
    }
  };

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
        <div className="relative">
          <button
            ref={triggerRef}
            id={inputId}
            type="button"
            role="combobox"
            aria-haspopup="listbox"
            aria-expanded={open}
            aria-describedby={describedBy}
            aria-readonly={readOnly || undefined}
            disabled={disabled}
            onClick={() => (open ? closeListbox() : openListbox())}
            onKeyDown={handleTriggerKeyDown}
            className={cn(
              "flex h-10 w-full items-center justify-between gap-2 rounded-md border bg-surface-raised px-3 text-left text-body-m text-fg-primary outline-none transition-colors",
              "focus-visible:ring-2 focus-visible:ring-focus-ring",
              status === "invalid" ? "border-danger-border" : "border-border-subtle",
              status === "warning" && "border-warning-border",
              status === "success" && "border-success-border",
              disabled && "cursor-not-allowed border-border-disabled bg-surface-disabled text-fg-disabled",
              readOnly && !disabled && "cursor-default bg-surface-sunken",
            )}
          >
            <span className={cn("truncate", !selectedOption && "text-fg-muted")}>
              {selectedOption ? selectedOption.label : placeholder}
            </span>
            <ChevronDown
              aria-hidden="true"
              className={cn(
                "size-4 shrink-0 text-fg-muted transition-transform",
                open && "rotate-180",
              )}
            />
          </button>
          {open && rect
            ? createPortal(
                <ul
                  ref={listboxRef}
                  role="listbox"
                  aria-labelledby={inputId}
                  style={{ position: "fixed", top: rect.top, left: rect.left, width: rect.width }}
                  className="z-50 mt-1 max-h-64 overflow-auto rounded-md border border-border-subtle bg-surface-overlay py-1 shadow-lg"
                >
                  {options.length === 0 ? (
                    <li className="px-3 py-2 text-body-s text-fg-muted">No options</li>
                  ) : (
                    options.map((option, index) => {
                      const isSelected = option.value === value;
                      const isHighlighted = index === highlightedIndex;
                      return (
                        <li
                          key={option.value}
                          role="option"
                          aria-selected={isSelected}
                          aria-disabled={option.disabled || undefined}
                          onMouseEnter={() => setHighlightedIndex(index)}
                          onClick={() => commitSelection(option)}
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
