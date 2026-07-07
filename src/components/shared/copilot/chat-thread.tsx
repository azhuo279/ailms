"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import type { ChatTurn } from "./types";
import type { RenderBlockContext } from "./render-block";
import { MessageTurn } from "./message-turn";
import { ThinkingIndicator } from "./thinking-indicator";
import { useReducedMotion } from "./use-copilot-chat";

export interface ChatThreadProps {
  turns: ChatTurn[];
  isThinking: boolean;
  ctx: RenderBlockContext;
  className?: string;
}

/** Distance (px) from the bottom within which the user counts as "following". */
const NEAR_BOTTOM_PX = 48;

/** Nearest scrollable ancestor, so growth-driven auto-scroll can respect the
 *  user's own scroll position instead of yanking them down. */
function findScrollParent(el: HTMLElement | null): HTMLElement | null {
  let node = el?.parentElement ?? null;
  while (node) {
    const overflowY = getComputedStyle(node).overflowY;
    if (overflowY === "auto" || overflowY === "scroll") return node;
    node = node.parentElement;
  }
  return null;
}

/**
 * Scrolling conversation column. An aria-live `log` so appended turns are
 * announced to assistive tech without stealing focus mid-typing; a bottom
 * sentinel is scrolled into view on each new turn or thinking flip so the newest
 * message stays in frame.
 *
 * Auto-scroll honors reduced motion: `behavior: "smooth"` normally,
 * `behavior: "auto"` (instant) under `prefers-reduced-motion: reduce`, since
 * smooth programmatic scrolling is itself spatial motion.
 *
 * A second, growth-driven pass keeps the newest content in view AS a turn's
 * height grows — Kase's prose types out character-by-character (see
 * `TypewriterText`), which does not change `turns`, so a `ResizeObserver` tracks
 * the expanding column and pins the sentinel with an INSTANT scroll (smooth would
 * lag/stack every frame). It only nudges when the user is already near the
 * bottom, so scrolling up to re-read is never fought.
 */
export function ChatThread({ turns, isThinking, ctx, className }: ChatThreadProps) {
  const logRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    bottomRef.current?.scrollIntoView({
      behavior: reducedMotion ? "auto" : "smooth",
      block: "end",
    });
  }, [turns, isThinking, reducedMotion]);

  useEffect(() => {
    const log = logRef.current;
    const bottom = bottomRef.current;
    if (!log || !bottom || typeof ResizeObserver === "undefined") return;

    const scroller = findScrollParent(log);
    const observer = new ResizeObserver(() => {
      if (!scroller) return;
      const distanceFromBottom =
        scroller.scrollHeight - scroller.scrollTop - scroller.clientHeight;
      if (distanceFromBottom <= NEAR_BOTTOM_PX) {
        bottom.scrollIntoView({ behavior: "auto", block: "end" });
      }
    });
    observer.observe(log);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={logRef}
      role="log"
      aria-live="polite"
      aria-relevant="additions"
      aria-label="Conversation with Kase"
      className={cn("flex flex-col gap-4 py-4", className)}
    >
      {turns.map((turn) => (
        <MessageTurn key={turn.id} turn={turn} ctx={ctx} />
      ))}
      {isThinking ? <ThinkingIndicator /> : null}
      <div ref={bottomRef} aria-hidden="true" />
    </div>
  );
}
