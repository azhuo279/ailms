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

/**
 * Scrolling conversation column. An aria-live `log` so appended turns are
 * announced to assistive tech without stealing focus mid-typing; a bottom
 * sentinel is scrolled into view on each new turn or thinking flip so the newest
 * message stays in frame.
 *
 * Auto-scroll honors reduced motion: `behavior: "smooth"` normally,
 * `behavior: "auto"` (instant) under `prefers-reduced-motion: reduce`, since
 * smooth programmatic scrolling is itself spatial motion.
 */
export function ChatThread({ turns, isThinking, ctx, className }: ChatThreadProps) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    bottomRef.current?.scrollIntoView({
      behavior: reducedMotion ? "auto" : "smooth",
      block: "end",
    });
  }, [turns, isThinking, reducedMotion]);

  return (
    <div
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
