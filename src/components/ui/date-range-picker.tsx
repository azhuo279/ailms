"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Field, type FieldStatus } from "./field";
import { Button } from "./button";

export interface DateRange {
  start: Date | null;
  end: Date | null;
}

export interface DateRangePickerProps {
  value: DateRange;
  onChange?: (range: DateRange) => void;
  disabled?: boolean;
  readOnly?: boolean;
  label: string;
  /** Opt-in override for the Field label styling (e.g. small-caps filter labels). */
  labelClassName?: string;
  helperText?: string;
  status?: FieldStatus;
  validationText?: string;
  required?: boolean;
  optional?: boolean;
  /** Show the preset range list ("Last 7 days", etc.) in the popover. Defaults to true. */
  showPresets?: boolean;
  className?: string;
}

const WEEKDAY_LABELS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const MONTH_YEAR_FORMATTER = new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric" });

function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function isSameDay(a: Date | null | undefined, b: Date | null | undefined) {
  if (!a || !b) return false;
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function isWithin(d: Date, start: Date, end: Date) {
  const t = startOfDay(d).getTime();
  return t >= startOfDay(start).getTime() && t <= startOfDay(end).getTime();
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

interface Preset {
  label: string;
  getRange: () => DateRange;
}

function buildPresets(): Preset[] {
  const today = startOfDay(new Date());
  return [
    {
      label: "Last 7 days",
      getRange: () => {
        const start = new Date(today);
        start.setDate(start.getDate() - 6);
        return { start, end: today };
      },
    },
    {
      label: "Last 30 days",
      getRange: () => {
        const start = new Date(today);
        start.setDate(start.getDate() - 29);
        return { start, end: today };
      },
    },
    {
      label: "This month",
      getRange: () => ({
        start: new Date(today.getFullYear(), today.getMonth(), 1),
        end: new Date(today.getFullYear(), today.getMonth() + 1, 0),
      }),
    },
    {
      label: "Last month",
      getRange: () => ({
        start: new Date(today.getFullYear(), today.getMonth() - 1, 1),
        end: new Date(today.getFullYear(), today.getMonth(), 0),
      }),
    },
  ];
}

/**
 * Canonical Date Range Picker — filter or report across pickup windows, ETA
 * ranges, billing periods, or audit windows. Labels start and end explicitly
 * and ships common presets ("Last 7 days", "This month") for fast filtering.
 */
export function DateRangePicker({
  value,
  onChange,
  disabled = false,
  readOnly = false,
  label,
  labelClassName,
  helperText,
  status = "default",
  validationText,
  required,
  optional,
  showPresets = true,
  className,
}: DateRangePickerProps) {
  const [open, setOpen] = useState(false);
  const [viewMonth, setViewMonth] = useState<Date>(() => startOfDay(value.start ?? new Date()));
  const [draftStart, setDraftStart] = useState<Date | null>(value.start);
  const [hoverDate, setHoverDate] = useState<Date | null>(null);
  const [rect, setRect] = useState<{ top: number; right: number } | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const presets = useMemo(() => buildPresets(), []);
  const days = useMemo(() => buildMonthGrid(viewMonth), [viewMonth]);
  const secondMonth = useMemo(() => new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 1), [viewMonth]);
  const secondDays = useMemo(() => buildMonthGrid(secondMonth), [secondMonth]);

  const updateRect = () => {
    const el = triggerRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    setRect({ top: r.bottom, right: window.innerWidth - r.right });
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
    setViewMonth(startOfDay(value.start ?? new Date()));
    setDraftStart(value.start);
    setOpen(true);
  };

  const pickDay = (d: Date) => {
    if (!draftStart || (value.start && value.end)) {
      // starting a fresh selection
      setDraftStart(d);
      onChange?.({ start: d, end: null });
      return;
    }
    if (d.getTime() < draftStart.getTime()) {
      onChange?.({ start: d, end: draftStart });
    } else {
      onChange?.({ start: draftStart, end: d });
    }
    setDraftStart(null);
    setOpen(false);
    triggerRef.current?.focus();
  };

  const applyPreset = (preset: Preset) => {
    const range = preset.getRange();
    onChange?.(range);
    setDraftStart(null);
    setOpen(false);
    triggerRef.current?.focus();
  };

  const clearRange = () => {
    onChange?.({ start: null, end: null });
    setDraftStart(null);
  };

  const goToMonth = (delta: number) => {
    setViewMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + delta, 1));
  };

  const rangeStart = value.start;
  const rangeEnd = value.end ?? (draftStart ? hoverDate : null);

  const renderGrid = (
    monthDate: Date,
    monthDays: Date[],
    navBefore?: React.ReactNode,
    navAfter?: React.ReactNode,
  ) => (
    <div>
      <div className="flex items-center justify-between gap-2 pb-1">
        <div className="flex size-8 shrink-0 items-center justify-center">{navBefore}</div>
        <p className="text-center text-label-l font-medium text-fg-primary">
          {MONTH_YEAR_FORMATTER.format(monthDate)}
        </p>
        <div className="flex size-8 shrink-0 items-center justify-center">{navAfter}</div>
      </div>
      <div className="grid grid-cols-7 gap-1 pb-1">
        {WEEKDAY_LABELS.map((wd) => (
          <span key={wd} className="flex size-8 items-center justify-center text-caption text-fg-muted">
            {wd}
          </span>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {monthDays.map((d) => {
          const outsideMonth = d.getMonth() !== monthDate.getMonth();
          const isStart = isSameDay(d, rangeStart) || (draftStart ? isSameDay(d, draftStart) : false);
          const isEnd = isSameDay(d, value.end);
          const inRange =
            rangeStart && rangeEnd
              ? isWithin(d, rangeStart.getTime() <= rangeEnd.getTime() ? rangeStart : rangeEnd, rangeStart.getTime() <= rangeEnd.getTime() ? rangeEnd : rangeStart)
              : false;
          return (
            <button
              key={d.toISOString()}
              type="button"
              onClick={() => pickDay(d)}
              onMouseEnter={() => setHoverDate(d)}
              className={cn(
                "flex size-8 items-center justify-center rounded-md text-body-s text-fg-primary transition-colors",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring",
                outsideMonth && "text-fg-muted",
                inRange && !isStart && !isEnd && "bg-option-hover",
                (isStart || isEnd) && "bg-btn-primary text-btn-primary-fg hover:bg-btn-primary-hover",
                !isStart && !isEnd && !inRange && "hover:bg-option-hover",
              )}
            >
              {d.getDate()}
            </button>
          );
        })}
      </div>
    </div>
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
        <div className="relative">
          <button
            ref={triggerRef}
            id={inputId}
            type="button"
            aria-haspopup="dialog"
            aria-expanded={open}
            aria-describedby={describedBy}
            aria-readonly={readOnly || undefined}
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
            <span className={cn("flex min-w-0 items-center gap-1.5", !value.start && "text-fg-muted")}>
              <span className="sr-only">Start date</span>
              <span className="truncate">{value.start ? formatDate(value.start) : "MM/DD/YYYY"}</span>
              <span aria-hidden="true">–</span>
              <span className="sr-only">End date</span>
              <span className="truncate">{value.end ? formatDate(value.end) : "MM/DD/YYYY"}</span>
            </span>
            <CalendarIcon aria-hidden="true" className="size-4 shrink-0 text-fg-muted" />
          </button>
          {open && rect
            ? createPortal(
                <div
                  ref={panelRef}
                  role="dialog"
                  aria-label="Choose date range"
                  style={{ position: "fixed", top: rect.top, right: rect.right, width: "max-content" }}
                  className="z-50 mt-1 flex gap-4 rounded-md border border-border-subtle bg-surface-overlay p-3 shadow-lg"
                >
                  {showPresets ? (
                    <div className="flex w-36 shrink-0 flex-col gap-1 border-r border-border-subtle pr-3">
                      <p className="pb-1 text-label-s font-medium text-fg-muted">Presets</p>
                      {presets.map((preset) => (
                        <button
                          key={preset.label}
                          type="button"
                          onClick={() => applyPreset(preset)}
                          className="rounded-md px-2 py-1.5 text-left text-body-s text-fg-primary hover:bg-option-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
                        >
                          {preset.label}
                        </button>
                      ))}
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        leadingIcon={<X className="size-3.5" />}
                        onClick={clearRange}
                        className="mt-2 justify-start px-2 text-fg-muted hover:text-fg-primary"
                      >
                        Clear
                      </Button>
                    </div>
                  ) : null}
                  <div className="flex gap-4">
                    {renderGrid(
                      viewMonth,
                      days,
                      <Button
                        iconOnly
                        aria-label="Previous month"
                        icon={<ChevronLeft />}
                        size="sm"
                        variant="ghost"
                        onClick={() => goToMonth(-1)}
                      />,
                    )}
                    {renderGrid(
                      secondMonth,
                      secondDays,
                      undefined,
                      <Button
                        iconOnly
                        aria-label="Next month"
                        icon={<ChevronRight />}
                        size="sm"
                        variant="ghost"
                        onClick={() => goToMonth(1)}
                      />,
                    )}
                  </div>
                </div>,
                document.body,
              )
            : null}
        </div>
      )}
    </Field>
  );
}
