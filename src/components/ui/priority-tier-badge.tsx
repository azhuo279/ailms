import { AlertCircle, ArrowUpCircle, CircleDot, Circle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PriorityTier } from "@/app/workspace/lib/exception-types";

/**
 * Communicates exception urgency via a tier label only. The AI computes a
 * continuous priority score internally to order the feed, but the score
 * value itself is never rendered anywhere in this component or its callers
 * (explicit product instruction: users cannot audit how the score is
 * computed, so only the coarser tier and a short label are shown).
 *
 * T1/T2 use the reserved `severity-*` ramp (true exception urgency, never
 * mixed with `ai-*`); T3/T4 stay on `warning-*`/neutral so only genuinely
 * high-priority cards read as alarming.
 */

const TIER_CONFIG: Record<
  PriorityTier,
  { label: string; icon: typeof AlertCircle; className: string }
> = {
  T1: {
    label: "Critical",
    icon: AlertCircle,
    className: "bg-severity-surface text-severity-fg",
  },
  T2: {
    label: "High",
    icon: ArrowUpCircle,
    className: "bg-severity-surface/60 text-severity-fg",
  },
  T3: {
    label: "Medium",
    icon: CircleDot,
    className: "bg-warning-surface text-warning-fg",
  },
  T4: {
    label: "Low",
    icon: Circle,
    className: "bg-surface-sunken text-fg-secondary",
  },
};

export interface PriorityTierBadgeProps {
  tier: PriorityTier;
  className?: string;
}

export function PriorityTierBadge({ tier, className }: PriorityTierBadgeProps) {
  const config = TIER_CONFIG[tier];
  const Icon = config.icon;

  return (
    <span
      className={cn(
        "inline-flex h-5 shrink-0 items-center gap-1 whitespace-nowrap rounded-full px-2 text-label-s font-medium",
        config.className,
        className,
      )}
    >
      <Icon className="size-3.5 shrink-0" aria-hidden="true" />
      {config.label}
    </span>
  );
}
