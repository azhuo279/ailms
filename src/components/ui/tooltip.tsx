"use client";

import {
  cloneElement,
  isValidElement,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import type { ReactElement, ReactNode } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";

export type TooltipPlacement = "top" | "bottom" | "left" | "right";

export interface TooltipProps {
  /** Trigger element — must accept `onMouseEnter`/`onFocus`/etc and forward a ref. */
  children: ReactElement;
  /** Brief, non-essential label or explanation. Keep this short — no interactive content. */
  content: ReactNode;
  placement?: TooltipPlacement;
  /** Delay (ms) before showing, to avoid flicker on incidental hover. */
  delayMs?: number;
  className?: string;
}

interface TooltipPosition {
  top: number;
  left: number;
}

function computePosition(
  triggerRect: DOMRect,
  bubbleSize: { width: number; height: number },
  placement: TooltipPlacement,
): TooltipPosition {
  const gap = 6;
  switch (placement) {
    case "bottom":
      return { top: triggerRect.bottom + gap, left: triggerRect.left + triggerRect.width / 2 - bubbleSize.width / 2 };
    case "left":
      return { top: triggerRect.top + triggerRect.height / 2 - bubbleSize.height / 2, left: triggerRect.left - bubbleSize.width - gap };
    case "right":
      return { top: triggerRect.top + triggerRect.height / 2 - bubbleSize.height / 2, left: triggerRect.right + gap };
    case "top":
    default:
      return { top: triggerRect.top - bubbleSize.height - gap, left: triggerRect.left + triggerRect.width / 2 - bubbleSize.width / 2 };
  }
}

/**
 * Canonical Tooltip — a brief, non-essential label or explanatory text near a
 * target, shown on hover/focus and dismissed on blur/leave. Never place
 * interactive controls inside a Tooltip's content — if the content needs
 * interaction, use Popover instead. Portals to `document.body` so it escapes
 * stacking/overflow traps.
 */
export function Tooltip({ children, content, placement = "top", delayMs = 300, className }: TooltipProps) {
  const [visible, setVisible] = useState(false);
  const [position, setPosition] = useState<TooltipPosition | null>(null);
  const triggerRef = useRef<HTMLElement | null>(null);
  const bubbleRef = useRef<HTMLDivElement>(null);
  const showTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tooltipId = useId();

  const clearShowTimer = () => {
    if (showTimer.current) {
      clearTimeout(showTimer.current);
      showTimer.current = null;
    }
  };

  const show = () => {
    clearShowTimer();
    showTimer.current = setTimeout(() => setVisible(true), delayMs);
  };

  const hide = () => {
    clearShowTimer();
    setVisible(false);
  };

  useLayoutEffect(() => {
    if (!visible) return;
    const trigger = triggerRef.current;
    const bubble = bubbleRef.current;
    if (!trigger || !bubble) return;
    const triggerRect = trigger.getBoundingClientRect();
    const bubbleRect = bubble.getBoundingClientRect();
    setPosition(computePosition(triggerRect, { width: bubbleRect.width, height: bubbleRect.height }, placement));
  }, [visible, placement, content]);

  useEffect(() => {
    if (!visible) return;
    const reposition = () => {
      const trigger = triggerRef.current;
      const bubble = bubbleRef.current;
      if (!trigger || !bubble) return;
      const triggerRect = trigger.getBoundingClientRect();
      const bubbleRect = bubble.getBoundingClientRect();
      setPosition(computePosition(triggerRect, { width: bubbleRect.width, height: bubbleRect.height }, placement));
    };
    window.addEventListener("resize", reposition);
    window.addEventListener("scroll", reposition, true);
    return () => {
      window.removeEventListener("resize", reposition);
      window.removeEventListener("scroll", reposition, true);
    };
  }, [visible, placement]);

  useEffect(() => () => clearShowTimer(), []);

  if (!isValidElement(children)) return children;

  type TriggerProps = {
    onMouseEnter?: () => void;
    onMouseLeave?: () => void;
    onFocus?: () => void;
    onBlur?: () => void;
    "aria-describedby"?: string;
    ref?: (node: HTMLElement | null) => void;
  };

  const triggerElement = cloneElement(children as ReactElement<TriggerProps>, {
    onMouseEnter: show,
    onMouseLeave: hide,
    onFocus: show,
    onBlur: hide,
    "aria-describedby": visible ? tooltipId : undefined,
    ref: (node: HTMLElement | null) => {
      triggerRef.current = node;
    },
  } as Partial<TriggerProps>);

  return (
    <>
      {triggerElement}
      {visible
        ? createPortal(
            <div
              ref={bubbleRef}
              id={tooltipId}
              role="tooltip"
              style={{ position: "fixed", top: position?.top ?? -9999, left: position?.left ?? -9999 }}
              className={cn(
                "z-50 max-w-xs rounded-md bg-fg-primary px-2.5 py-1.5 text-caption text-fg-on-primary shadow-lg",
                !position && "invisible",
                className,
              )}
            >
              {content}
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
