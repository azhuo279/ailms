"use client";

import type { CSSProperties } from "react";
import { cn } from "@/lib/utils";
import type { Block } from "./types";
import { renderBlock, type RenderBlockContext } from "./render-block";

/** Per-block reveal stagger, in ms (animator-grounded: short-and-capped). */
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
 * Motion (animator gate): each block reveals with the existing
 * `empty-state-rise-in` keyframe (opacity 0→1, translateY 3px→0) at 200ms
 * ease-out, staggered 70ms per block via an inline `animationDelay` (the
 * sanctioned inline-stagger exception, precedent `stat-tile.tsx`). `both` fill
 * holds each block invisible until its delay elapses, preventing a pre-reveal
 * flash. Gated by `motion-safe:` — under reduced motion blocks render instantly
 * at their static state and the aria-live log still announces the reply.
 */
export function AiTurn({ blocks, ctx, className }: AiTurnProps) {
  return (
    <div className={cn("mr-auto flex max-w-[92%] flex-col gap-3", className)}>
      {blocks.map((block, index) => (
        <div
          key={index}
          className="motion-safe:animate-[empty-state-rise-in_200ms_ease-out_both]"
          style={{ animationDelay: `${index * REVEAL_STAGGER_MS}ms` } as CSSProperties}
        >
          {renderBlock(block, ctx)}
        </div>
      ))}
    </div>
  );
}
