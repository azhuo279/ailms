"use client";

import { Button } from "@/components/ui/button";

export interface SuggestedPromptsProps {
  /** The prompts to offer for the current step. Nothing renders when empty. */
  prompts: string[];
  /** Sends the tapped prompt as the user's message (same path as typing + send). */
  onSelect: (prompt: string) => void;
}

/**
 * Suggested-prompt chips — a low-density right-aligned COLUMN of tappable
 * sample asks pinned above the footer composer. Each chip hugs the right edge
 * of the panel and is only as wide as its label (Starling: vertical stack,
 * right-aligned via `flex flex-col items-end`), so the asks read as the user's
 * own outgoing options stacking up above the composer.
 * They do two jobs at once (Starling item 1 + 5):
 * they HELP the user by offering a next thing to say, and they GUIDE the demo
 * by driving the turn-by-turn conversation. **Tapping a chip sends it as the
 * user's message on the exact same path as typing and pressing send**, so the
 * scripted exchange advances one focused reply at a time. The available prompts
 * change per step to reflect the natural next ask.
 *
 * Treatment: `secondary` Buttons on the NEUTRAL/primary affordance ramp, never
 * the reserved `ai-*` teal — these are user actions, not AI surfaces (CLAUDE.md
 * role reservation). Kept to a short wrapping row so the panel stays scannable.
 *
 * Motion (animator gate, "small enter" — chip): the stack is re-keyed on the
 * prompt set so React remounts it as the conversation advances, replaying a
 * 200ms opacity+translateY reveal (the shared `empty-state-rise-in` keyframe,
 * decelerate ease-out) staggered a short 40ms per chip so the new asks read as
 * arriving rather than blinking in place. Gated by `motion-safe:`, so under
 * `prefers-reduced-motion` the chips render instantly at their static state and
 * stay fully operable (they are always-present real buttons, so their
 * availability never depends on motion).
 */
export function SuggestedPrompts({ prompts, onSelect }: SuggestedPromptsProps) {
  if (prompts.length === 0) return null;

  return (
    <div
      // Re-key on the set so advancing the script remounts the row and the
      // enter animation replays for the new asks.
      key={prompts.join("|")}
      className="flex flex-col items-end gap-1.5 px-2 pb-2"
      role="list"
      aria-label="Suggested prompts"
    >
      {prompts.map((prompt, index) => (
        <div
          key={prompt}
          role="listitem"
          className="motion-safe:animate-[empty-state-rise-in_200ms_ease-out_both]"
          style={{ animationDelay: `${index * 40}ms` }}
        >
          <Button
            variant="secondary"
            size="sm"
            className="max-w-full"
            onClick={() => onSelect(prompt)}
          >
            <span className="truncate">{prompt}</span>
          </Button>
        </div>
      ))}
    </div>
  );
}
