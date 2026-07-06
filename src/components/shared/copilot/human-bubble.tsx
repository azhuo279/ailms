import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface HumanBubbleProps {
  children: ReactNode;
  className?: string;
}

/**
 * The human turn — a discrete, contained, BORDERED + FILLED bubble, right
 * anchored, that reads BRIGHTER and more forward than the AI side. This is the
 * bright end of the core asymmetry: the operator COMMITS, so their words sit in
 * a solid object; Kase AMBIENTS in frameless, dimmer containers beside them.
 *
 * Surface is deliberately the neutral/primary glass — `bg-surface-raised`
 * (neutral-0, the lightest step) + a `border-border-subtle` hairline + `shadow-sm`
 * — NEVER the reserved `ai-*` teal ramp, which is reserved for AI surfaces only
 * (CLAUDE.md role reservation). `max-w-[85%]` keeps the bubble from spanning the
 * full column so it reads as a contained utterance; the arbitrary width is a
 * sanctioned exception (a bubble max-width has no spacing-scale token).
 */
export function HumanBubble({ children, className }: HumanBubbleProps) {
  return (
    <div
      className={cn(
        "ml-auto max-w-[85%] rounded-xl border border-border-subtle bg-surface-raised px-3 py-2 text-body-m text-fg-primary shadow-sm",
        className,
      )}
    >
      {children}
    </div>
  );
}
