"use client";

import { useEffect, useId, useRef } from "react";
import type { ReactNode } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./button";

export type DialogVariant = "default" | "alert";

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

export interface DialogProps {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  /** Supporting text under the title. */
  description?: ReactNode;
  children?: ReactNode;
  /** Primary/secondary action row, typically Buttons. */
  actions?: ReactNode;
  /**
   * `alert` applies urgent-interruption styling (danger-tinted title icon
   * area, no dismiss-on-outside-click) for destructive confirmations —
   * this replaces what other systems call a separate "Alert Dialog"
   * component; here it's a variant, not a second component, since both
   * share the same surface, focus-trap, and Escape/portal machinery.
   */
  variant?: DialogVariant;
  /** Hide the top-right close control (rare — prefer keeping it for discoverability). */
  hideCloseButton?: boolean;
  className?: string;
}

/**
 * Canonical Dialog — an important decision, confirmation, or focused task
 * that should interrupt the current workflow. Use `variant="alert"` for
 * urgent, destructive confirmations that should not be dismissed by an
 * accidental outside click. Avoid nesting dialogs. Portals to
 * `document.body`; traps focus while open; closes on Escape (and on
 * outside click, unless `variant="alert"`).
 */
export function Dialog({
  open,
  onClose,
  title,
  description,
  children,
  actions,
  variant = "default",
  hideCloseButton = false,
  className,
}: DialogProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    if (!open) return;

    previouslyFocused.current = document.activeElement as HTMLElement | null;
    const panel = panelRef.current;
    const focusable = panel?.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR);
    (focusable?.[0] ?? panel)?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key !== "Tab") return;
      const nodes = panel?.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR);
      if (!nodes || nodes.length === 0) return;
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = originalOverflow;
      previouslyFocused.current?.focus();
    };
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-neutral-950/40"
        onClick={variant === "alert" ? undefined : onClose}
        aria-hidden="true"
      />
      <div
        ref={panelRef}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
        tabIndex={-1}
        className={cn(
          "relative flex max-h-[85vh] w-full max-w-md flex-col rounded-lg bg-surface-overlay shadow-lg outline-none",
          className,
        )}
      >
        <div className="flex items-start justify-between gap-3 p-5 pb-3">
          <div className="min-w-0 flex-1">
            <h2 id={titleId} className="text-title font-semibold text-fg-primary">
              {title}
            </h2>
            {description ? (
              <p id={descriptionId} className="mt-1 text-body-s text-fg-secondary">
                {description}
              </p>
            ) : null}
          </div>
          {!hideCloseButton ? (
            <Button iconOnly icon={<X />} aria-label="Close" variant="ghost" size="sm" onClick={onClose} />
          ) : null}
        </div>
        {children ? <div className="min-h-0 flex-1 overflow-auto px-5 text-body-m text-fg-secondary">{children}</div> : null}
        {actions ? <div className="flex items-center justify-end gap-2 p-5 pt-4">{actions}</div> : null}
      </div>
    </div>,
    document.body,
  );
}
