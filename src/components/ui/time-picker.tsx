"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Clock, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Field, type FieldStatus } from "./field";
import { Button } from "./button";

export interface TimePickerProps {
  /** 24-hour "HH:mm" string, or null when empty. */
  value: string | null;
  onChange?: (value: string | null) => void;
  disabled?: boolean;
  readOnly?: boolean;
  label: string;
  helperText?: string;
  status?: FieldStatus;
  validationText?: string;
  required?: boolean;
  optional?: boolean;
  /** Minute interval between generated options. Defaults to 30. */
  minuteStep?: number;
  /** Start of the generated day range, "HH:mm". Defaults to "00:00". */
  startTime?: string;
  /** End of the generated day range, "HH:mm". Defaults to "23:30". */
  endTime?: string;
  className?: string;
}

/**
 * Note: this component displays and edits a plain "HH:mm" wall-clock value
 * with no timezone attached — timezone context/labeling is the consuming
 * screen's responsibility.
 */

function parseTime(hhmm: string): { hours: number; minutes: number } {
  const [h, m] = hhmm.split(":").map(Number);
  return { hours: h, minutes: m };
}

function formatTimeLabel(hhmm: string): string {
  const { hours, minutes } = parseTime(hhmm);
  const period = hours >= 12 ? "PM" : "AM";
  const displayHour = hours % 12 === 0 ? 12 : hours % 12;
  return `${displayHour}:${String(minutes).padStart(2, "0")} ${period}`;
}

function buildTimeOptions(startTime: string, endTime: string, minuteStep: number): string[] {
  const start = parseTime(startTime);
  const end = parseTime(endTime);
  const startMinutes = start.hours * 60 + start.minutes;
  const endMinutes = end.hours * 60 + end.minutes;
  const options: string[] = [];
  for (let total = startMinutes; total <= endMinutes; total += minuteStep) {
    const h = Math.floor(total / 60);
    const m = total % 60;
    options.push(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
  }
  return options;
}

/**
 * Canonical Time Picker — use when scheduling requires time precision, such
 * as dock appointments, dispatch cutoffs, or driver handoff windows. Pair
 * with Date Picker for one coherent scheduling pattern.
 */
export function TimePicker({
  value,
  onChange,
  disabled = false,
  readOnly = false,
  label,
  helperText,
  status = "default",
  validationText,
  required,
  optional,
  minuteStep = 30,
  startTime = "00:00",
  endTime = "23:30",
  className,
}: TimePickerProps) {
  const [open, setOpen] = useState(false);
  const [rect, setRect] = useState<{ top: number; left: number; width: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLUListElement>(null);
  const optionRefs = useRef<Map<string, HTMLLIElement>>(new Map());

  const options = useMemo(() => buildTimeOptions(startTime, endTime, minuteStep), [startTime, endTime, minuteStep]);

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
      if (panelRef.current?.contains(target)) return;
      setOpen(false);
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
    };
    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  useEffect(() => {
    if (!open || !value) return;
    const el = optionRefs.current.get(value);
    el?.scrollIntoView({ block: "nearest" });
  }, [open, value]);

  const openList = () => {
    if (disabled || readOnly) return;
    setOpen(true);
  };

  const commitTime = (t: string) => {
    onChange?.(t);
    setOpen(false);
    triggerRef.current?.focus();
  };

  const clearTime = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange?.(null);
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
          <div
            ref={containerRef}
            className={cn(
              "flex h-10 w-full items-center justify-between gap-2 rounded-md border bg-surface-raised pl-3 pr-1.5 text-left text-body-m text-fg-primary transition-colors",
              "has-[button:focus-visible]:ring-2 has-[button:focus-visible]:ring-focus-ring",
              status === "invalid" ? "border-danger-border" : "border-border-subtle",
              status === "warning" && "border-warning-border",
              status === "success" && "border-success-border",
              disabled && "cursor-not-allowed border-border-disabled bg-surface-disabled text-fg-disabled",
              readOnly && !disabled && "cursor-default bg-surface-sunken",
            )}
          >
            <button
              ref={triggerRef}
              id={inputId}
              type="button"
              aria-haspopup="listbox"
              aria-expanded={open}
              aria-describedby={describedBy}
              disabled={disabled}
              onClick={() => (open ? setOpen(false) : openList())}
              className="flex h-full min-w-0 flex-1 items-center bg-transparent text-left outline-none disabled:cursor-not-allowed"
            >
              <span className={cn("truncate", !value && "text-fg-muted")}>
                {value ? formatTimeLabel(value) : "Select a time"}
              </span>
            </button>
            <span className="flex shrink-0 items-center gap-1">
              {value && !disabled && !readOnly ? (
                <Button
                  iconOnly
                  aria-label="Clear time"
                  icon={<X />}
                  size="sm"
                  variant="ghost"
                  className="size-6"
                  onClick={clearTime}
                />
              ) : null}
              <Clock aria-hidden="true" className="size-4 text-fg-muted" />
            </span>
          </div>
          {open && rect
            ? createPortal(
                <ul
                  ref={panelRef}
                  role="listbox"
                  aria-label={label}
                  style={{ position: "fixed", top: rect.top, left: rect.left, width: rect.width }}
                  className="z-50 mt-1 max-h-64 overflow-auto rounded-md border border-border-subtle bg-surface-overlay py-1 shadow-lg"
                >
                  {options.map((t) => {
                    const isSelected = t === value;
                    return (
                      <li
                        key={t}
                        ref={(el) => {
                          if (el) optionRefs.current.set(t, el);
                          else optionRefs.current.delete(t);
                        }}
                        role="option"
                        aria-selected={isSelected}
                        onClick={() => commitTime(t)}
                        className={cn(
                          "cursor-pointer px-3 py-2 text-body-m text-fg-primary",
                          isSelected ? "bg-option-hover font-medium text-link" : "hover:bg-option-hover",
                        )}
                      >
                        {formatTimeLabel(t)}
                      </li>
                    );
                  })}
                </ul>,
                document.body,
              )
            : null}
        </div>
      )}
    </Field>
  );
}
