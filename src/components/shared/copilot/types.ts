import type { ReactNode } from "react";
import type { ChartType, ChartSeries } from "@/components/ui/chart";
import type { EpistemicTone } from "@/components/ui/epistemic-status";
import type { ButtonVariant } from "@/components/ui/button";
import type {
  ImpactProjectionEvidenceItem,
  ImpactProjectionMetric,
} from "@/components/ui/epistemic-status";
import type {
  StatTileTrend,
  StatTileComparisonBar,
} from "@/components/ui/stat-tile";
import type { PriorityTier } from "@/app/workspace/lib/exception-types";

/**
 * Copilot conversation data model (feature-local — copilot-bound, not shared UI).
 *
 * The whole surface rests on one asymmetry: the human COMMITS, the AI AMBIENTS.
 * A user turn is a single, contained, bright bordered bubble. An AI turn is a
 * frameless left-anchored wrapper — an ordered stack of typed BLOCKS, where the
 * frame migrates inward onto only the individual widgets that need to read as
 * objects (viz / receipt / choices), and those objects render a step dimmer
 * than the human bubble so the assistant's containers recede beneath the
 * human's words. Plain text and CTAs stay frameless.
 */

export type ChatRole = "user" | "assistant";

/** Plain typographic paragraph — frameless, no surface, no border. */
export interface TextBlock {
  kind: "text";
  content: ReactNode;
}

/**
 * An inline chart. Rendered via the canonical `Chart` inside an `.ai-card`, with
 * `Chart` neutralized to transparent so the frosted glass shows through (the
 * frame migrates to the ai-card, not the chart's own box).
 */
export interface VizBlock {
  kind: "viz";
  title: string;
  description?: string;
  chartType: ChartType;
  data: Record<string, unknown>[];
  series: ChartSeries[];
  /** Data key for the category/time axis. */
  xKey: string;
}

/**
 * A "receipt" — an AI reading rendered through the epistemic-status family. Two
 * shapes:
 *  - "projection" → `ImpactProjectionPanel` (already an `.ai-card`), for a
 *    downstream-impact forecast.
 *  - "stat" → a `StatTile` wrapped in an `.ai-card`, for a single headline
 *    reading; an optional `provenanceTone` renders an `EpistemicTag` above it.
 */
export type ReceiptBlock = ReceiptProjectionBlock | ReceiptStatBlock;

export interface ReceiptProjectionBlock {
  kind: "receipt";
  variant: "projection";
  headline: ReactNode;
  /** Optional at-a-glance metric row (Direction A). When present, the numbers
   * lift out of the headline into a metric grid and the headline reads as a
   * caption. When omitted, the panel uses the headline-as-description fallback. */
  metrics?: ImpactProjectionMetric[];
  confidenceLabel: string;
  riskCountLabel: string;
  reasoningTitle?: string;
  evidence: ImpactProjectionEvidenceItem[];
  citations: string[];
}

export interface ReceiptStatBlock {
  kind: "receipt";
  variant: "stat";
  label: string;
  value: ReactNode;
  hint?: string;
  trend?: StatTileTrend;
  comparisonBar?: StatTileComparisonBar;
  /** Optional epistemic provenance chip rendered above the tile. */
  provenanceTone?: EpistemicTone;
  provenanceLabel?: ReactNode;
  provenanceBasis?: string;
}

export type ChoiceControl = "radio" | "tags" | "combobox";

export interface ChoiceOption {
  label: string;
  value: string;
}

/**
 * A selectable proposal — Kase asks the operator to pick. Rendered inside an
 * `.ai-card` with the chosen control, followed by a confirm Button that is
 * disabled until a selection exists. Confirming appends the follow-up turn keyed
 * by `confirmToTurnId`.
 */
export interface ChoicesBlock {
  kind: "choices";
  /** Block id — the key selections are written under. Must be unique per turn. */
  id: string;
  prompt?: ReactNode;
  control: ChoiceControl;
  options: ChoiceOption[];
  /** Radio/tags allow multiple only for "tags"; combobox uses `multiple`. */
  multiple?: boolean;
  confirmLabel: string;
  /** Key into FOLLOW_UP_TURNS appended when this choice is confirmed. */
  confirmToTurnId: string;
}

/**
 * An actionable tail — a proposal with an accept button as part of it. Committing
 * appends the follow-up turn keyed by `commitToTurnId`.
 */
export interface ActionBlock {
  kind: "action";
  text: ReactNode;
  ctaLabel: string;
  ctaVariant?: ButtonVariant;
  /** Key into FOLLOW_UP_TURNS appended when this action is committed. */
  commitToTurnId: string;
}

/**
 * A structured pre-execution confirmation card (FR-CONV-03) — the "execute a
 * workflow in chat" affordance shown BEFORE anything happens. Kase names the
 * action, the target, and the projected consequence, then offers a Confirm /
 * Cancel pair. Confirming runs the existing commit path (`commitToTurnId`);
 * cancelling settles the card in place with a "standing by" line so the card can
 * never be re-fired. Rendered as an `.ai-card` object-block (an AI surface, so it
 * wears the reserved AI treatment). This is a Tier B execute-with-confirm (or a
 * single-exception Tier C route); chat never batch-executes a cluster.
 */
export interface ConfirmBlock {
  kind: "confirm";
  /** Short verb label for the workflow, e.g. "Delegate", "Export", "Draft". */
  actionType: string;
  /** The target entity, e.g. "SHP-48213 · Laredo customs hold". */
  targetLabel: ReactNode;
  /** Optional priority tier, rendered via the reused `PriorityTierBadge`. Omit
   * cleanly for non-tiered actions (audit-log export, performance draft). */
  tier?: PriorityTier;
  /** The projected consequence line (bold key phrases). */
  consequence: ReactNode;
  confirmLabel: string;
  cancelLabel: string;
  /** Key into FOLLOW_UP_TURNS appended when the card is confirmed (reuses the
   * existing `commitAction` path). */
  commitToTurnId: string;
}

export type Block =
  | TextBlock
  | VizBlock
  | ReceiptBlock
  | ChoicesBlock
  | ActionBlock
  | ConfirmBlock;

/**
 * One conversation turn. Uniform block array for both roles — a user turn is a
 * single text block; an assistant turn mixes kinds.
 */
export interface ChatTurn {
  id: string;
  role: ChatRole;
  blocks: Block[];
}
