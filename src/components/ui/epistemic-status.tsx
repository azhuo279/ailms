import type { ReactNode } from "react";
import { Check, Sparkles, HelpCircle, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardHeader, CardBody, CardFooter } from "./card";
import { Accordion, AccordionItem } from "./accordion";
import { Tag } from "./tag";

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

export interface EpistemicTagProps {
  tone: EpistemicTone;
  /** Overrides the tone's default label (e.g. "Confirmed" instead of "Verified"). */
  label?: ReactNode;
  /**
   * Source or basis for this value, e.g. "TMS event 14:02 CT" or "Based on
   * lane history and current transit speed." Rendered via the native
   * `title` attribute only — no hover-card, no persistent disclosure.
   */
  basis?: string;
  className?: string;
}

/**
 * Inline epistemic-state tag — marks a single value as Confirmed, an AI
 * estimate, or Not available. The smallest unit of the epistemic-status
 * language; sits beside a value the way a unit or a footnote marker would.
 * For a full reasoning surface use `ImpactProjectionPanel` or
 * `ConflictingSignalComparisonPanel` instead — this component never
 * discloses more than its `title` tooltip.
 */
export function EpistemicTag({ tone, label, basis, className }: EpistemicTagProps) {
  return (
    <span
      title={basis}
      className={cn(
        "inline-flex h-5 shrink-0 items-center gap-1 whitespace-nowrap rounded-full px-2 text-label-s font-medium",
        EPISTEMIC_TONE_CLASSES[tone],
        className,
      )}
    >
      <span className="size-3.5 shrink-0 [&>svg]:size-full">{EPISTEMIC_TONE_ICON[tone]}</span>
      {label ?? EPISTEMIC_TONE_LABEL[tone]}
    </span>
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

export interface ImpactProjectionPanelProps {
  /**
   * Headline sentence, e.g. "If not resolved within the **4-hour breach
   * window**, **3 orders** tied to **2 Gold-tier customers** are projected
   * to miss SLA." Pass as ReactNode with key phrases already bolded.
   */
  headline: ReactNode;
  /** e.g. "Medium confidence · 68%" */
  confidenceLabel: string;
  /** Plain-text risk count label beside the confidence badge, e.g. "3 orders at risk". */
  riskCountLabel: string;
  /** Title for the collapsed-by-default reasoning accordion. Defaults to "Why this projection". */
  reasoningTitle?: string;
  /** Evidence bullets revealed when the reasoning accordion expands. */
  evidence: ImpactProjectionEvidenceItem[];
  /** Source system names cited as small neutral pills, e.g. ["TMS", "Order Management"]. */
  citations: string[];
  /** Persistent disclaimer text, always visible. Defaults to the standard AI-projection disclaimer. */
  disclaimer?: ReactNode;
  className?: string;
}

/**
 * Downstream-impact projection card — an AI-authored forecast of what
 * happens if an exception goes unresolved. Confidence and risk count are
 * always visible; supporting evidence is progressively disclosed via a
 * collapsed-by-default Accordion so the card stays scannable. The
 * disclaimer footer is persistent (never hover-gated) per CLAUDE.md's
 * data-transparency requirement.
 */
export function ImpactProjectionPanel({
  headline,
  confidenceLabel,
  riskCountLabel,
  reasoningTitle = "Why this projection",
  evidence,
  citations,
  disclaimer = "AI can make mistakes. This is a projection, not a confirmed outcome.",
  className,
}: ImpactProjectionPanelProps) {
  return (
    <Card className={className}>
      <CardHeader
        media={<Sparkles className="size-5" aria-hidden="true" />}
        title="Downstream impact if unresolved"
        description={headline}
      />
      <CardBody>
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex h-6 shrink-0 items-center gap-1 rounded-full bg-ai-surface px-2.5 text-label-s font-semibold text-ai-fg">
            <Sparkles className="size-3.5 shrink-0" aria-hidden="true" />
            {confidenceLabel}
          </span>
          <span className="text-body-s text-fg-muted">{riskCountLabel}</span>
        </div>

        <Accordion className="mt-3">
          <AccordionItem id="reasoning" title={reasoningTitle}>
            <ul className="list-disc space-y-1 pl-4">
              {evidence.map((item) => (
                <li key={item.id}>{item.content}</li>
              ))}
            </ul>
          </AccordionItem>
        </Accordion>

        {citations.length > 0 ? (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {citations.map((source) => (
              <Tag key={source} tone="neutral" size="sm">
                {source}
              </Tag>
            ))}
          </div>
        ) : null}
      </CardBody>
      <CardFooter className="justify-start">
        <p role="status" className="text-footnote text-fg-muted">
          {disclaimer}
        </p>
      </CardFooter>
    </Card>
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
          <div key={column.id} className="rounded-md border border-border-subtle p-3">
            <div className="mb-2 flex items-center gap-1.5 text-label-s font-semibold uppercase tracking-wide text-fg-muted">
              {column.source}
              <EpistemicTag tone={column.tone} basis={column.basis} />
            </div>
            <div className="text-heading-m font-semibold text-fg-primary">{column.value}</div>
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
