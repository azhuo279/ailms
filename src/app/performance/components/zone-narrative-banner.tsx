"use client";

import { useState } from "react";
import { Layers, Sparkles, ThumbsUp, ThumbsDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { renderBoldMarkdown } from "../lib/performance-format";

export interface ZoneNarrativeBannerProps {
  /** Body sentence for the single top insight, with `**bold**` load-bearing phrases. */
  body: string;
  /**
   * Total count of active insights. When > 1, a "View all N insights" trigger
   * is rendered in the header actions row alongside the feedback control.
   */
  insightCount?: number;
  /** Opens the "View all active AI insights" drawer. */
  onViewAllInsights?: () => void;
  className?: string;
}

/**
 * AI-authored zone narrative band for the Zone Performance tab. Compact by
 * design: surfaces only the single top/latest insight, self-contained, with no
 * multi-insight breakdown. Wears the reserved `.ai-card` glass material and is
 * AI-signaled by its teal Sparkles heading and glass surface (the redundant
 * "AI summary" tag was removed per Starling). Helpful / Not helpful is a local
 * acknowledgment control (no backend yet).
 *
 * Structured so a future "View all insights" drawer trigger can slot into the
 * header actions row without reworking the body — that drawer is handled by a
 * separate exploration and is deliberately not built here.
 */
export function ZoneNarrativeBanner({
  body,
  insightCount,
  onViewAllInsights,
  className,
}: ZoneNarrativeBannerProps) {
  const [feedback, setFeedback] = useState<"up" | "down" | null>(null);
  const showViewAll = Boolean(onViewAllInsights) && (insightCount ?? 0) > 1;

  return (
    <section aria-label="AI zone narrative" className={cn("ai-card p-4", className)}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <Sparkles className="size-4 shrink-0 text-ai-fg" aria-hidden="true" />
          <h2 className="text-label-l font-semibold text-ai-fg">
            Which warehouse needs attention
          </h2>
        </div>

        {/* Header actions row — the "View all insights" drawer trigger joins
            the feedback control here (count-bearing when there is more than the
            single lead insight). */}
        <div className="flex shrink-0 items-center gap-2">
          {showViewAll ? (
            <Button
              variant="ghost"
              size="sm"
              leadingIcon={<Layers />}
              onClick={onViewAllInsights}
              className="text-ai-fg hover:bg-ai-surface"
            >
              View all {insightCount} insights
            </Button>
          ) : null}
          <div
            className="flex items-center gap-1"
            role="group"
            aria-label="Was this summary helpful?"
          >
            <Button
              iconOnly
              variant="ghost"
              size="sm"
              icon={<ThumbsUp />}
              aria-label="Helpful"
              isSelected={feedback === "up"}
              onClick={() => setFeedback((f) => (f === "up" ? null : "up"))}
            />
            <Button
              iconOnly
              variant="ghost"
              size="sm"
              icon={<ThumbsDown />}
              aria-label="Not helpful"
              isSelected={feedback === "down"}
              onClick={() => setFeedback((f) => (f === "down" ? null : "down"))}
            />
          </div>
        </div>
      </div>

      <p className="mt-2 text-body-m text-fg-secondary">{renderBoldMarkdown(body)}</p>
    </section>
  );
}
