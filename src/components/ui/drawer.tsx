"use client";

import { useEffect, useId, useRef, useState } from "react";
import type { ReactNode } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./button";

/**
 * Enter/exit motion (animator skill, small-enter / small-exit presets). The
 * panel slides along its docking axis; the scrim cross-fades. Enter is 250ms
 * decelerate (arrives + settles), exit is a faster 200ms accelerate (gets out
 * of the way) — the standard enter/exit asymmetry. Only transform + opacity
 * animate (compositor-friendly). The reduced-motion fallback (opacity-only,
 * no translate) lives in globals.css keyed off the `.drawer-*-anim` classes.
 */
const DRAWER_EXIT_MS = 200;
// Full literal class strings (Tailwind v4 must see the complete arbitrary-value
// utility in source to generate it — no runtime string concatenation).
const PANEL_ANIM: Record<DrawerSide, { in: string; out: string }> = {
  right: {
    in: "motion-safe:animate-[drawer-panel-in-right_250ms_cubic-bezier(0,0,0.2,1)_both]",
    out: "motion-safe:animate-[drawer-panel-out-right_200ms_cubic-bezier(0.4,0,1,1)_both]",
  },
  left: {
    in: "motion-safe:animate-[drawer-panel-in-left_250ms_cubic-bezier(0,0,0.2,1)_both]",
    out: "motion-safe:animate-[drawer-panel-out-left_200ms_cubic-bezier(0.4,0,1,1)_both]",
  },
};

export type DrawerSide = "right" | "left";
export type DrawerWidth = "sm" | "md" | "lg";

const WIDTH_CLASSES: Record<DrawerWidth, string> = {
  sm: "w-80",
  md: "w-96",
  lg: "w-[32rem]",
};

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

export interface DrawerProps {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  children?: ReactNode;
  /** Footer action row, typically Buttons. */
  actions?: ReactNode;
  side?: DrawerSide;
  width?: DrawerWidth;
  /** Renders without a scrim and without outside-click-to-close, for a docked/always-visible panel. */
  persistent?: boolean;
  className?: string;
}

/**
 * Canonical Drawer — a secondary surface that slides in for supplemental
 * detail or related actions while preserving the current page context. Use
 * a Drawer instead of a Dialog when the task is related but should not fully
 * replace the working context; for tiny snippets, prefer Popover instead.
 * Portals to `document.body`; traps focus while open (non-persistent mode);
 * closes on Escape and outside click.
 */
export function Drawer({
  open,
  onClose,
  title,
  children,
  actions,
  side = "right",
  width = "md",
  persistent = false,
  className,
}: DrawerProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);
  const titleId = useId();

  // Keep the panel mounted through its exit animation: `render` stays true
  // while `open` is false so the closing transition can play, then unmounts.
  const [render, setRender] = useState(open);
  const [closing, setClosing] = useState(false);

  useEffect(() => {
    if (open) {
      setRender(true);
      setClosing(false);
      return;
    }
    if (!render) return;
    // open flipped to false while mounted → play the exit, then unmount.
    setClosing(true);
    const t = window.setTimeout(() => {
      setRender(false);
      setClosing(false);
    }, DRAWER_EXIT_MS);
    return () => window.clearTimeout(t);
  }, [open, render]);

  useEffect(() => {
    if (!open || persistent) return;

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
  }, [open, persistent, onClose]);

  if (!render) return null;

  const panelAnim = PANEL_ANIM[side];

  return createPortal(
    <div className="fixed inset-0 z-50 flex">
      {!persistent ? (
        <div
          className={cn(
            "absolute inset-0 bg-neutral-950/40 motion-safe:will-change-[opacity] drawer-scrim-anim",
            closing
              ? "motion-safe:animate-[drawer-scrim-out_200ms_ease-in_both]"
              : "motion-safe:animate-[drawer-scrim-in_250ms_ease-out_both]",
          )}
          data-state={closing ? "closing" : "open"}
          onClick={onClose}
          aria-hidden="true"
        />
      ) : null}
      <div
        ref={panelRef}
        role="dialog"
        aria-modal={!persistent}
        aria-labelledby={titleId}
        tabIndex={-1}
        data-state={closing ? "closing" : "open"}
        className={cn(
          "relative flex h-full flex-col bg-surface-overlay shadow-lg outline-none",
          "motion-safe:will-change-transform drawer-panel-anim",
          closing ? panelAnim.out : panelAnim.in,
          side === "right" ? "ml-auto" : "mr-auto",
          WIDTH_CLASSES[width],
          className,
        )}
      >
        <div className="flex items-center justify-between gap-3 border-b border-border-subtle p-4">
          <h2 id={titleId} className="min-w-0 flex-1 truncate text-title font-semibold text-fg-primary">
            {title}
          </h2>
          <Button iconOnly icon={<X />} aria-label="Close" variant="ghost" size="sm" onClick={onClose} />
        </div>
        {children ? <div className="min-h-0 flex-1 overflow-auto p-4 text-body-m text-fg-secondary">{children}</div> : null}
        {actions ? (
          <div className="flex items-center justify-end gap-2 border-t border-border-subtle p-4">{actions}</div>
        ) : null}
      </div>
    </div>,
    document.body,
  );
}
