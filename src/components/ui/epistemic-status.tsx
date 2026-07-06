import type { ReactNode } from "react";
import { Check, Sparkles, HelpCircle, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardHeader, CardBody, CardFooter } from "./card";
import { Accordion, AccordionItem } from "./accordion";
import { Tag } from "./tag";
import { Tooltip } from "./tooltip";

/**
 * Epistemic-status component family — the shared visual vocabulary for
 * saying "how sure are we, and why" across the product (PRD P-02, spanning
 * FR-03 / FR-10 / FR-11 / FR-13 / FR-17 / FR-18). Three scales of the same
 * language: an inline tag (`EpistemicTag`), a persistent-disclosure card for
 * an AI projection (`ImpactProjectionPanel`), and a side-by-side comparison
 * for disagreeing sources (`ConflictingSignalComparisonPanel`).
 *
 * All three share one tone-token mapping and one icon set:
 * - `confirmed` → success ramp, `Check`
 * - `ai` → the reserved `ai-*` teal ramp, `Sparkles` — AI-authored or
 *   AI-inferred content only, never decorative (CLAUDE.md role reservation)
 * - `unknown` → neutral/sunken ramp, `HelpCircle`
 *
 * Deliberately excludes any raw `warning`/`danger` reuse for AI content —
 * disagreement/caution surfaces (the conflict banner) use `warning-*`
 * because a source conflict is a caution state, not an AI-authored one.
 */

// ---------------------------------------------------------------------------
// EpistemicTag — Direction A, "Standing Tag System"
// ---------------------------------------------------------------------------

export type EpistemicTone = "confirmed" | "ai" | "unknown";

/**
 * ONE filled treatment per tone — a solid toned surface with toned text + icon.
 * The `ai` tone is the reserved teal ramp: a lighter teal fill (`ai-surface`)
 * with dark-teal text and icon (`ai-fg`). Feedback (Starling): every epistemic
 * tag renders this single filled style so two tags never disagree visually —
 * there is deliberately no outline/ghost variant. Tones stay on their semantic
 * ramps (confirmed → success, ai → reserved teal, unknown → neutral sunken).
 */
const EPISTEMIC_TONE_CLASSES: Record<EpistemicTone, string> = {
  confirmed: "bg-success-surface text-success-fg",
  ai: "bg-ai-surface text-ai-fg",
  unknown: "bg-surface-sunken text-fg-secondary",
};

const EPISTEMIC_TONE_LABEL: Record<EpistemicTone, string> = {
  confirmed: "Verified",
  ai: "Inferred",
  unknown: "Not available",
};

const EPISTEMIC_TONE_ICON: Record<EpistemicTone, ReactNode> = {
  confirmed: <Check aria-hidden="true" />,
  ai: <Sparkles aria-hidden="true" />,
  unknown: <HelpCircle aria-hidden="true" />,
};

/**
 * What each epistemic state MEANS to the reader (Starling feedback). Shown in
 * the hover tooltip so a user understands the state itself, not just the
 * per-instance basis. Kept scannable, no em-dashes.
 */
const EPISTEMIC_TONE_MEANING: Record<EpistemicTone, string> = {
  confirmed: "Confirmed by a source system reading.",
  ai: "Estimated by AI from available signals, not directly confirmed.",
  unknown: "No reading available for this value yet.",
};

export interface EpistemicTagProps {
  tone: EpistemicTone;
  /** Overrides the tone's default label (e.g. "Confirmed" instead of "Verified"). */
  label?: ReactNode;
  /**
   * Source or basis for this value, e.g. "TMS event 14:02 CT" or "Based on
   * lane history and current transit speed." Shown in the hover tooltip
   * beneath the tone's plain-language meaning, when provided.
   */
  basis?: string;
  className?: string;
}

/**
 * Inline epistemic-state tag — marks a single value as Confirmed, an AI
 * estimate, or Not available. The smallest unit of the epistemic-status
 * language; sits beside a value the way a unit or a footnote marker would.
 * On hover/focus it discloses a tooltip that explains what the state MEANS
 * (Starling feedback) plus the per-instance `basis` when one is passed. For a
 * full reasoning surface use `ImpactProjectionPanel` or
 * `ConflictingSignalComparisonPanel` instead.
 */
export function EpistemicTag({
  tone,
  label,
  basis,
  className,
}: EpistemicTagProps) {
  const meaning = EPISTEMIC_TONE_MEANING[tone];
  const toneLabel = label ?? EPISTEMIC_TONE_LABEL[tone];

  return (
    <Tooltip
      content={
        <span className="flex flex-col gap-0.5">
          <span className="font-semibold">{meaning}</span>
          {basis ? <span className="text-fg-on-primary/80">{basis}</span> : null}
        </span>
      }
    >
      <span
        tabIndex={0}
        className={cn(
          "inline-flex h-5 shrink-0 cursor-default items-center gap-1 whitespace-nowrap rounded-full px-2 text-label-s font-medium outline-none focus-visible:ring-2 focus-visible:ring-focus-ring",
          EPISTEMIC_TONE_CLASSES[tone],
          className,
        )}
      >
        <span className="size-3.5 shrink-0 [&>svg]:size-full">
          {EPISTEMIC_TONE_ICON[tone]}
        </span>
        {toneLabel}
      </span>
    </Tooltip>
  );
}

// ---------------------------------------------------------------------------
// ImpactProjectionPanel — Direction B, "Disclosure Card System"
// ---------------------------------------------------------------------------

export interface ImpactProjectionEvidenceItem {
  id: string;
  /** Evidence line, e.g. bolded order/customer references via ReactNode. */
  content: ReactNode;
}

export interface ImpactProjectionMetric {
  /** Big at-a-glance value, e.g. "3", "2", "4h". Heading-l weight. */
  value: ReactNode;
  /** Small uppercase supporting label, e.g. "Orders at risk". */
  label: string;
}

export interface ImpactProjectionPanelProps {
  /**
   * Headline sentence, e.g. "If not resolved within the **4-hour breach
   * window**, **3 orders** tied to **2 Gold-tier customers** are projected
   * to miss SLA." Pass as ReactNode with key phrases already bolded.
   *
   * When `metrics` is provided (Direction A), the load-bearing numbers move
   * into the at-a-glance metric row and this becomes a short supporting
   * caption below it — so pass the shortened caption form there. When
   * `metrics` is omitted, this renders as the panel's description as before.
   */
  headline: ReactNode;
  /**
   * Optional at-a-glance metric row (Direction A). Intended 2 to 4 metrics,
   * each a big value + small uppercase label, rendered as a grid directly
   * under the title so "how bad" lands in one glance. When omitted, the panel
   * falls back to the headline-as-description layout (backward compatible).
   */
  metrics?: ImpactProjectionMetric[];
  /** e.g. "Medium confidence · 68%" */
  confidenceLabel: string;
  /** Plain-text risk count label beside the confidence badge, e.g. "3 orders at risk". */
  riskCountLabel: string;
  /** Small inline label shown above the always-visible reasoning list. Defaults to "Why this projection". */
  reasoningTitle?: string;
  /** Evidence bullets shown inline, always visible, under the reasoning label. */
  evidence: ImpactProjectionEvidenceItem[];
  /** Source system names cited as small neutral pills, e.g. ["TMS", "Order Management"]. */
  citations: string[];
  /** Persistent disclaimer text, always visible. Defaults to the standard AI-projection disclaimer. */
  disclaimer?: ReactNode;
  /**
   * Opt-in dense variant (Starling item 3). Default (`false`) is the roomier
   * reasoning surface: `heading-l` metric values, `body-s` supporting copy, and
   * the standard Card slot spacing + footer divider. `true` dials the panel down
   * one rung across the board (smaller type, tighter spacing, no footer border)
   * so it stays scannable at chat width — this is the density the copilot chat
   * uses. The metric row scales with it: `heading-m` values and tighter gaps.
   */
  compact?: boolean;
  className?: string;
}

/**
 * Downstream-impact projection card — an AI-authored forecast of what
 * happens if an exception goes unresolved. Confidence and risk count are
 * always visible; supporting evidence and the cited sources are shown inline
 * and always visible (Starling: no accordion), under a small reasoning label
 * and a "Sources" label respectively. The disclaimer footer is persistent
 * (never hover-gated) per CLAUDE.md's data-transparency requirement.
 */
export function ImpactProjectionPanel({
  headline,
  metrics,
  confidenceLabel,
  riskCountLabel,
  reasoningTitle = "Why this projection",
  evidence,
  citations,
  disclaimer = "AI can make mistakes. This is a projection, not a confirmed outcome.",
  compact = false,
  className,
}: ImpactProjectionPanelProps) {
  // Direction A ("Metric-first header + calmed body"): when structured metrics
  // are passed, the load-bearing numbers are lifted OUT of the sentence into an
  // at-a-glance metric row read directly under the title, so "how bad" lands in
  // one glance. The prose then reads as a short supporting caption. When metrics
  // are omitted, the panel falls back to the headline-as-description layout
  // (backward compatible for existing callers such as the customs-hold story and
  // the copilot fallback). Column count tracks the metric count, capped at 3 to
  // match the mockup's 3-up grid.
  const hasMetrics = Boolean(metrics && metrics.length > 0);
  const metricColumns = Math.min(metrics?.length ?? 0, 3);

  return (
    // AI glass surface (DESIGN.md §5): a full containerized AI reasoning panel,
    // so it wears the `.ai-card` frosted-glass material rather than the standard
    // operational `Card` (white raised fill + shadow). Built as a plain div with
    // `.ai-card` plus the Card layout (padding) — the Card primitive's baked-in
    // `bg-surface-raised`/`border`/`shadow-sm` would compete with the glass
    // treatment, so it is deliberately not used as the root here. CardHeader/
    // CardBody/CardFooter remain for the internal layout.
    // Density (Starling item 3) is opt-in via `compact`. Default is the roomier
    // reasoning surface (heading-l metric values, body-s copy, standard Card slot
    // spacing + a full-width divider before the reasoning band). `compact` dials
    // the panel down one rung across the board — smaller type and tighter spacing,
    // no footer border — so it stays scannable at chat width, WITHOUT losing
    // hierarchy (the metrics still out-rank the evidence and the disclaimer). All
    // differences ride on className overrides rather than new component variants.
    <div
      className={cn(
        "ai-card relative w-full text-left",
        compact ? "p-3" : "p-4",
        className,
      )}
    >
      <CardHeader
        className={compact ? "gap-2 [&_p]:text-footnote" : "gap-3"}
        // Starling: the projection title should wrap to two lines and read a
        // rung smaller than a standard card title, not truncate. `line-clamp-2
        // whitespace-normal` defeats CardHeader's base `truncate` (which is
        // overflow-hidden + text-ellipsis + whitespace-nowrap); `text-heading-m`
        // steps the type down one rung in both densities.
        titleClassName="line-clamp-2 whitespace-normal text-heading-m"
        media={<Sparkles className="size-4" aria-hidden="true" />}
        title="Downstream impact if unresolved"
        // Direction A: when metrics carry the numbers, the caption drops below
        // the metric row (rendered in CardBody), so it is NOT the header
        // description. In the fallback, the headline stays the description.
        description={hasMetrics ? undefined : headline}
      />
      <CardBody className={compact ? "mt-2" : "mt-3"}>
        {hasMetrics ? (
          <>
            {/* At-a-glance metric row — the load-bearing numbers promoted to the
                top of the body, big value over a small uppercase label. Columns
                track the metric count (capped at 3 per the mockup). */}
            <dl
              className={cn(
                "grid",
                compact ? "gap-2" : "gap-3",
                metricColumns === 1 && "grid-cols-1",
                metricColumns === 2 && "grid-cols-2",
                metricColumns >= 3 && "grid-cols-3",
              )}
            >
              {metrics!.map((metric, index) => (
                <div
                  key={`${metric.label}-${index}`}
                  className="flex flex-col gap-0.5"
                >
                  <dd
                    className={cn(
                      "font-semibold text-fg-primary",
                      compact ? "text-heading-m" : "text-heading-l",
                    )}
                  >
                    {metric.value}
                  </dd>
                  <dt className="text-footnote uppercase tracking-wide text-fg-muted">
                    {metric.label}
                  </dt>
                </div>
              ))}
            </dl>
            {/* Demoted headline — a short supporting caption below the metrics.
                Secondary color, key phrase bolded via the passed ReactNode. */}
            <p
              className={cn(
                "text-fg-secondary [&_b]:font-semibold [&_b]:text-fg-primary [&_strong]:font-semibold [&_strong]:text-fg-primary",
                compact ? "mt-2 text-footnote" : "mt-3.5 text-body-s",
              )}
            >
              {headline}
            </p>
          </>
        ) : null}

        <div
          className={cn(
            "flex flex-wrap items-center gap-1.5",
            hasMetrics && (compact ? "mt-2" : "mt-3.5"),
          )}
        >
          <span
            className={cn(
              "inline-flex shrink-0 items-center gap-1 rounded-full bg-ai-surface px-2 font-semibold text-ai-fg",
              compact ? "h-5 text-footnote" : "h-6 text-label-s",
            )}
          >
            <Sparkles
              className={cn("shrink-0", compact ? "size-3" : "size-3.5")}
              aria-hidden="true"
            />
            {confidenceLabel}
          </span>
          <span
            className={cn(
              "text-fg-muted",
              compact ? "text-footnote" : "text-body-s",
            )}
          >
            {riskCountLabel}
          </span>
        </div>

        {/* Direction A: a full-width divider separates the header band from the
            reasoning band for breathing room. Only shown in the metric layout;
            the fallback keeps its original tighter rhythm. */}
        {hasMetrics ? (
          <hr
            className={cn(
              "h-px border-0 bg-border-subtle",
              compact ? "my-2" : "my-4",
            )}
          />
        ) : null}

        {/* Starling: the reasoning is shown inline, always visible, not hidden
            behind an accordion. The title becomes a small inline label above the
            evidence list. */}
        <div className={hasMetrics ? undefined : compact ? "mt-2" : "mt-3"}>
          <p className="text-label-s font-semibold text-fg-secondary">
            {reasoningTitle}
          </p>
          <ul
            className={cn(
              "mt-1 list-disc pl-4",
              compact ? "space-y-0.5 text-footnote" : "space-y-1 text-body-s",
            )}
          >
            {evidence.map((item) => (
              <li key={item.id}>{item.content}</li>
            ))}
          </ul>
        </div>

        {citations.length > 0 ? (
          <div
            className={cn(
              "flex flex-wrap items-center gap-1.5",
              compact ? "mt-2" : "mt-3",
            )}
          >
            {/* Starling: label the source pills inline so the row reads as sourcing. */}
            <span className="text-label-s text-fg-muted">Sources</span>
            {citations.map((source) => (
              <Tag key={source} tone="neutral" size="sm">
                {source}
              </Tag>
            ))}
          </div>
        ) : null}
      </CardBody>
      <CardFooter
        className={cn(
          "justify-start",
          compact ? "mt-2 border-t-0 pt-0" : "mt-4",
        )}
      >
        <p
          role="status"
          className={cn(
            "text-fg-muted",
            compact ? "text-footnote" : "text-body-s",
          )}
        >
          {disclaimer}
        </p>
      </CardFooter>
    </div>
  );
}

// ---------------------------------------------------------------------------
// ConflictingSignalComparisonPanel — Direction B, "Disclosure Card System"
// ---------------------------------------------------------------------------

export interface ConflictingSignalColumn {
  id: string;
  /** Source system label, e.g. "TMS" or "GPS". */
  source: string;
  /** Epistemic tag rendered beside the source label, e.g. tone="confirmed". */
  tone: EpistemicTone;
  /** Basis/source detail for that column's tag tooltip. */
  basis?: string;
  /** Large value line, e.g. "On track, ETA 16:40". */
  value: ReactNode;
}

export interface ConflictingSignalComparisonPanelProps {
  /** Warning-toned banner text at top, e.g. "Conflicting signals on vehicle position." */
  bannerText: ReactNode;
  /** Exactly two columns to compare side by side. */
  columns: [ConflictingSignalColumn, ConflictingSignalColumn];
  /** Title for the collapsed tie-break rationale accordion. */
  rationaleTitle: string;
  /** Tie-break rationale content (recency of each source, the rule used). */
  rationale: ReactNode;
  /** Resolution callout stating which source the AI summary used, plus reassurance text. */
  resolutionText: ReactNode;
  className?: string;
}

/**
 * Side-by-side comparison for two disagreeing source systems (e.g. TMS vs
 * GPS on vehicle position). Leads with a warning-toned conflict banner
 * (disagreement/caution, deliberately not the `ai-*` or `danger-*` ramp),
 * shows both readings with their own `EpistemicTag`, discloses tie-break
 * rationale on demand, and closes with an `ai-*` resolution callout that
 * states which source the AI summary actually used. Read-only by design —
 * the AI does not arbitrate silently.
 */
export function ConflictingSignalComparisonPanel({
  bannerText,
  columns,
  rationaleTitle,
  rationale,
  resolutionText,
  className,
}: ConflictingSignalComparisonPanelProps) {
  return (
    <Card className={className}>
      <div className="flex items-center gap-2 rounded-md bg-warning-surface px-3 py-2 text-body-s font-medium text-warning-fg">
        <AlertTriangle className="size-4 shrink-0" aria-hidden="true" />
        {bannerText}
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3">
        {columns.map((column) => (
          <div
            key={column.id}
            className="rounded-md border border-border-subtle p-3"
          >
            <div className="mb-2 flex items-center gap-1.5 text-label-s font-semibold uppercase tracking-wide text-fg-muted">
              {column.source}
              <EpistemicTag tone={column.tone} basis={column.basis} />
            </div>
            <div className="text-heading-m font-semibold text-fg-primary">
              {column.value}
            </div>
          </div>
        ))}
      </div>

      <Accordion className="mt-3">
        <AccordionItem id="rationale" title={rationaleTitle}>
          {rationale}
        </AccordionItem>
      </Accordion>

      <div className="mt-3 flex items-start gap-2 rounded-md bg-ai-surface px-3 py-2 text-body-s text-ai-fg">
        <Sparkles className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
        {resolutionText}
      </div>
    </Card>
  );
}
