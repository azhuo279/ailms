"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Field, type FieldStatus } from "./field";
import { Button } from "./button";

export interface DatePickerProps {
  value: Date | null;
  onChange?: (date: Date | null) => void;
  disabled?: boolean;
  readOnly?: boolean;
  label: string;
  helperText?: string;
  status?: FieldStatus;
  validationText?: string;
  required?: boolean;
  optional?: boolean;
  /** Earliest selectable date (inclusive). Days before this are disabled. */
  minDate?: Date;
  /** Latest selectable date (inclusive). Days after this are disabled. */
  maxDate?: Date;
  /** An AI-recommended date, highlighted in the calendar grid with a reserved ai-* accent as a hint. */
  suggestedDate?: Date;
  className?: string;
}

const WEEKDAY_LABELS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

function isSameDay(a: Date | null | undefined, b: Date | null | undefined) {
  if (!a || !b) return false;
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function isBeforeDay(a: Date, b: Date) {
  return startOfDay(a).getTime() < startOfDay(b).getTime();
}

function isAfterDay(a: Date, b: Date) {
  return startOfDay(a).getTime() > startOfDay(b).getTime();
}

/** Builds a standard 6-week (42-day) month grid, starting on Sunday, for the month containing `monthDate`. */
function buildMonthGrid(monthDate: Date): Date[] {
  const year = monthDate.getFullYear();
  const month = monthDate.getMonth();
  const firstOfMonth = new Date(year, month, 1);
  const gridStart = new Date(year, month, 1 - firstOfMonth.getDay());
  return Array.from({ length: 42 }, (_, i) => {
    const d = new Date(gridStart);
    d.setDate(gridStart.getDate() + i);
    return d;
  });
}

function formatDate(d: Date | null): string {
  if (!d) return "";
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${mm}/${dd}/${d.getFullYear()}`;
}

const MONTH_YEAR_FORMATTER = new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric" });

/**
 * Canonical Date Picker — choose a specific date, especially for scheduling,
 * delivery date, booking date, or promised-by date. Shows the expected
 * MM/DD/YYYY format visibly rather than relying on placeholder text alone.
 */
export function DatePicker({
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
  minDate,
  maxDate,
  suggestedDate,
  className,
}: DatePickerProps) {
  const [open, setOpen] = useState(false);
  const [viewMonth, setViewMonth] = useState<Date>(() => startOfDay(value ?? suggestedDate ?? new Date()));
  const [rect, setRect] = useState<{ top: number; left: number; width: number } | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const days = useMemo(() => buildMonthGrid(viewMonth), [viewMonth]);
  const helper = helperText ?? "Format: MM/DD/YYYY";

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

  const openCalendar = () => {
    if (disabled || readOnly) return;
    setViewMonth(startOfDay(value ?? suggestedDate ?? new Date()));
    setOpen(true);
  };

  const isDisabledDay = (d: Date) => {
    if (minDate && isBeforeDay(d, minDate)) return true;
    if (maxDate && isAfterDay(d, maxDate)) return true;
    return false;
  };

  const commitDate = (d: Date) => {
    if (isDisabledDay(d)) return;
    onChange?.(d);
    setOpen(false);
    triggerRef.current?.focus();
  };

  const goToMonth = (delta: number) => {
    setViewMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + delta, 1));
  };

  return (
    <Field
      label={label}
      helperText={helper}
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
            aria-haspopup="dialog"
            aria-expanded={open}
            aria-describedby={describedBy}
            disabled={disabled}
            onClick={() => (open ? setOpen(false) : openCalendar())}
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
            <span className={cn(!value && "text-fg-muted")}>{value ? formatDate(value) : "MM/DD/YYYY"}</span>
            <CalendarIcon aria-hidden="true" className="size-4 shrink-0 text-fg-muted" />
          </button>
          {open && rect
            ? createPortal(
                <div
                  ref={panelRef}
                  role="dialog"
                  aria-label="Choose date"
                  style={{ position: "fixed", top: rect.top, left: rect.left, width: rect.width < 288 ? 288 : rect.width }}
                  className="z-50 mt-1 rounded-md border border-border-subtle bg-surface-overlay p-3 shadow-lg"
                >
                  <div className="flex items-center justify-between gap-2 pb-2">
                    <Button
                      iconOnly
                      aria-label="Previous month"
                      icon={<ChevronLeft />}
                      size="sm"
                      variant="ghost"
                      onClick={() => goToMonth(-1)}
                    />
                    <span className="text-label-l font-medium text-fg-primary">
                      {MONTH_YEAR_FORMATTER.format(viewMonth)}
                    </span>
                    <Button
                      iconOnly
                      aria-label="Next month"
                      icon={<ChevronRight />}
                      size="sm"
                      variant="ghost"
                      onClick={() => goToMonth(1)}
                    />
                  </div>
                  <div className="grid grid-cols-7 gap-1 pb-1">
                    {WEEKDAY_LABELS.map((wd) => (
                      <span
                        key={wd}
                        className="flex h-8 items-center justify-center text-caption text-fg-muted"
                      >
                        {wd}
                      </span>
                    ))}
                  </div>
                  <div className="grid grid-cols-7 gap-1">
                    {days.map((d) => {
                      const outsideMonth = d.getMonth() !== viewMonth.getMonth();
                      const isSelected = isSameDay(d, value);
                      const isSuggested = !isSelected && isSameDay(d, suggestedDate);
                      const isDayDisabled = isDisabledDay(d);
                      return (
                        <button
                          key={d.toISOString()}
                          type="button"
                          disabled={isDayDisabled}
                          onClick={() => commitDate(d)}
                          aria-current={isSameDay(d, new Date()) ? "date" : undefined}
                          aria-pressed={isSelected}
                          className={cn(
                            "flex h-8 items-center justify-center rounded-md text-body-s text-fg-primary transition-colors",
                            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring",
                            outsideMonth && "text-fg-muted",
                            !isDayDisabled && !isSelected && "hover:bg-option-hover",
                            isSelected && "bg-btn-primary text-btn-primary-fg hover:bg-btn-primary-hover",
                            isSuggested && "border border-ai-border ring-1 ring-ai-border",
                            isDayDisabled && "cursor-not-allowed text-fg-disabled hover:bg-transparent",
                          )}
                        >
                          {d.getDate()}
                        </button>
                      );
                    })}
                  </div>
                  {suggestedDate ? (
                    <p className="pt-2 text-caption text-ai-fg">AI-suggested: {formatDate(suggestedDate)}</p>
                  ) : null}
                </div>,
                document.body,
              )
            : null}
        </div>
      )}
    </Field>
  );
}
