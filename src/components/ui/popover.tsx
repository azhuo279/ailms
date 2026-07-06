"use client";

import {
  cloneElement,
  isValidElement,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import type { ReactElement, ReactNode } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";

export type PopoverAlign = "start" | "end";

export interface PopoverProps {
  /** Trigger element — must accept `onClick` and forward a ref (e.g. Button). */
  trigger: ReactElement;
  children: ReactNode;
  align?: PopoverAlign;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  className?: string;
}

interface PopoverPosition {
  top: number;
  left: number;
}

/**
 * Canonical Popover — a small, non-blocking contextual surface for brief
 * information or lightweight controls, anchored to a trigger. Keep content
 * brief; if it's essential and interruptive, use Dialog instead. Portals to
 * `document.body` so it escapes stacking/overflow traps. Closes on outside
 * click or Escape, and returns focus to the trigger.
 */
export function Popover({ trigger, children, align = "start", open: controlledOpen, onOpenChange, className }: PopoverProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : uncontrolledOpen;
  const [position, setPosition] = useState<PopoverPosition | null>(null);
  const triggerRef = useRef<HTMLElement | null>(null);
  const surfaceRef = useRef<HTMLDivElement>(null);

  const setOpen = (next: boolean) => {
    if (!isControlled) setUncontrolledOpen(next);
    onOpenChange?.(next);
  };

  const updatePosition = () => {
    const el = triggerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    setPosition({
      top: rect.bottom + 8,
      left: align === "end" ? rect.right : rect.left,
    });
  };

  useLayoutEffect(() => {
    if (open) updatePosition();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const reposition = () => updatePosition();
    window.addEventListener("resize", reposition);
    window.addEventListener("scroll", reposition, true);
    return () => {
      window.removeEventListener("resize", reposition);
      window.removeEventListener("scroll", reposition, true);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handlePointerDown = (e: PointerEvent) => {
      const target = e.target as Node;
      if (triggerRef.current?.contains(target)) return;
      if (surfaceRef.current?.contains(target)) return;
      // A nested overlay (Combobox listbox, DateRangePicker calendar, a menu,
      // etc.) opened from inside this popover portals to document.body, so its
      // surface is NOT a DOM descendant of `surfaceRef`. Treat a click landing
      // inside any such portalled overlay as inside the popover — otherwise
      // picking an option would be read as an outside click and close us.
      if (
        target instanceof Element &&
        target.closest('[role="listbox"],[role="dialog"],[role="menu"],[role="grid"],[role="tree"]')
      ) {
        return;
      }
      setOpen(false);
    };
    const handleEscape = (e: globalThis.KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
    };
    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  type TriggerProps = {
    onClick?: () => void;
    "aria-haspopup"?: string;
    "aria-expanded"?: boolean;
    ref?: (node: HTMLElement | null) => void;
  };

  const triggerElement = isValidElement(trigger)
    ? cloneElement(trigger as ReactElement<TriggerProps>, {
        onClick: () => setOpen(!open),
        "aria-haspopup": "dialog",
        "aria-expanded": open,
        ref: (node: HTMLElement | null) => {
          triggerRef.current = node;
        },
      } as Partial<TriggerProps>)
    : trigger;

  return (
    <>
      {triggerElement}
      {open && position
        ? createPortal(
            <div
              ref={surfaceRef}
              role="dialog"
              style={{
                position: "fixed",
                top: position.top,
                left: align === "end" ? undefined : position.left,
                right: align === "end" ? window.innerWidth - position.left : undefined,
              }}
              className={cn(
                "z-50 w-72 rounded-lg border border-border-subtle bg-surface-overlay p-4 text-body-m text-fg-primary shadow-lg",
                className,
              )}
            >
              {children}
            </div>,
            document.body,
          )
        : null}
    </>
  );
}

export interface PopoverTitleProps {
  children: ReactNode;
  className?: string;
}

export function PopoverTitle({ children, className }: PopoverTitleProps) {
  return <p className={cn("text-title font-semibold text-fg-primary", className)}>{children}</p>;
}

export interface PopoverBodyProps {
  children: ReactNode;
  className?: string;
}

export function PopoverBody({ children, className }: PopoverBodyProps) {
  return <div className={cn("mt-1.5 text-body-s text-fg-secondary", className)}>{children}</div>;
}
