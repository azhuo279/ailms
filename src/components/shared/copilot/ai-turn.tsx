"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import type { Block } from "./types";
import { AI_PROSE, renderBlock, type RenderBlockContext } from "./render-block";
import { TypewriterText } from "./typewriter-text";
import { useReducedMotion } from "./use-copilot-chat";

/**
 * Beat between one settled block and the next non-typed block appearing, in ms
 * (animator-grounded: short-and-capped stagger). Kept small so a turn reads as
 * one event rather than a slow sequence.
 */
const REVEAL_STAGGER_MS = 70;

export interface AiTurnProps {
  blocks: Block[];
  ctx: RenderBlockContext;
  className?: string;
}

/**
 * The AI turn — a frameless, borderless, left-anchored max-width wrapper with NO
 * fill and NO border of its own. It is an ordered stack of typed blocks rendered
 * inline; the frame migrates INWARD onto only the widgets that need to be objects
 * (viz / receipt / choices), which `renderBlock` gives an `.ai-card` a step
 * dimmer than the human bubble. Text and CTAs stay frameless.
 *
 * Motion (animator gate) — blocks reveal SEQUENTIALLY, in order, so a turn reads
 * "Kase types its sentence, then the widget appears":
 *   - A `text` block TYPES OUT character-by-character via `TypewriterText`
 *     (~45 chars/sec, capped so long replies stay brisk; see that file for the
 *     grounded spec). When it settles it advances the reveal cursor.
 *   - Every other block (viz / receipt / choices / action / confirm) does NOT
 *     type — it reveals only once the block before it has settled, using the
 *     existing `empty-state-rise-in` keyframe (opacity 0→1, translateY 3px→0) at
 *     200ms ease-out, gated by `motion-safe:`. It then advances the cursor after
 *     a short beat.
 *   - Under reduced motion (`useReducedMotion`) the cursor jumps to the end so
 *     every block renders at once, no typing and no rise-in; the aria-live log
 *     still announces the reply. No rAF/timer motion path runs in that case.
 */
export function AiTurn({ blocks, ctx, className }: AiTurnProps) {
  const reduced = useReducedMotion();

  // How many blocks are currently revealed. The tail (highest revealed index) is
  // the one actively typing / rising in; when it settles the cursor advances.
  const [revealed, setRevealed] = useState(1);

  // Reduced motion (or a mid-turn switch to it) reveals everything immediately.
  useEffect(() => {
    if (reduced) setRevealed(blocks.length);
  }, [reduced, blocks.length]);

  const advance = useCallback(
    () => setRevealed((n) => Math.min(n + 1, blocks.length)),
    [blocks.length],
  );

  const count = reduced ? blocks.length : revealed;

  return (
    <div className={cn("mr-auto flex max-w-[92%] flex-col gap-3", className)}>
      {blocks.slice(0, count).map((block, index) => {
        // The last block in the turn has nothing to reveal after it.
        const isLast = index === blocks.length - 1;
        const onDone = isLast ? undefined : advance;

        if (block.kind === "text") {
          return (
            <TypewriterText
              key={index}
              content={block.content}
              reduced={reduced}
              onDone={onDone}
              className={AI_PROSE}
            />
          );
        }

        return (
          <WidgetReveal key={index} reduced={reduced} onDone={onDone}>
            {renderBlock(block, ctx)}
          </WidgetReveal>
        );
      })}
    </div>
  );
}

interface WidgetRevealProps {
  reduced: boolean;
  onDone?: () => void;
  children: ReactNode;
}

/**
 * A non-text block's reveal: the `empty-state-rise-in` entrance (self-gated by
 * `motion-safe:`, so reduced motion renders it statically), plus a one-shot
 * cursor advance so the block AFTER it appears only once this one has landed.
 */
function WidgetReveal({ reduced, onDone, children }: WidgetRevealProps) {
  const firedRef = useRef(false);

  useEffect(() => {
    if (firedRef.current) return;
    firedRef.current = true;
    if (!onDone) return;
    if (reduced) {
      onDone();
      return;
    }
    const timer = setTimeout(onDone, REVEAL_STAGGER_MS);
    return () => clearTimeout(timer);
    // Runs once on mount; onDone/reduced are stable for the block's lifetime.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="motion-safe:animate-[empty-state-rise-in_200ms_ease-out_both]">
      {children}
    </div>
  );
}
