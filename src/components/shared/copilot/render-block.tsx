"use client";

import { useState } from "react";
import { Chart, ChartFrame } from "@/components/ui/chart";
import { ImpactProjectionPanel, EpistemicTag } from "@/components/ui/epistemic-status";
import { StatTile } from "@/components/ui/stat-tile";
import { RadioGroup } from "@/components/ui/radio-group";
import { Combobox } from "@/components/ui/combobox";
import { Tag } from "@/components/ui/tag";
import { Button } from "@/components/ui/button";
import { PriorityTierBadge } from "@/components/ui/priority-tier-badge";
import { Check } from "lucide-react";
import type { Block, ChoicesBlock, ChoiceOption, ConfirmBlock } from "./types";

/**
 * The frame migrates INWARD: only widgets that need to read as objects wear a
 * surface. Those objects use `.ai-card` (frosted, a step DIMMER than the human
 * bubble's neutral-0 fill), so the assistant's containers recede beneath the
 * human's words. Plain text and CTAs stay frameless.
 *
 * `Chart` and `StatTile` hard-code their own opaque `bg-surface-raised` box; when
 * they sit inside an `.ai-card` that box is neutralized to transparent (border-0
 * bg-transparent p-0 shadow-none) so the frosted glass shows through — a
 * className override, NOT a forked component, mirroring how
 * `ImpactProjectionPanel` avoids the `Card` primitive.
 *
 * Color (Starling override, item 2): Kase's TEXTUAL responses (the `text` block,
 * an `action` block's prose, and a `choices` prompt) use the reserved AI teal
 * `text-ai-fg`, not neutral `text-fg-primary`. AI-authored prose is a legitimate
 * AI surface, so this HONORS the role reservation (CLAUDE.md). `text-ai-fg`
 * resolves to `ai-700` (oklch L≈0.44) against the near-white `.ai-card` glass
 * (L≈0.98/panel L≈0.95), well past the 4.5:1 AA body-text bar. The human bubble
 * stays neutral (`text-fg-primary`) and is untouched here.
 *
 * Type scale (item 4): the copilot block renderers step DOWN one rung to keep the
 * panel low-density while preserving hierarchy — prose is `body-s` (was `body-m`),
 * so widget headlines/labels (which sit at `heading-*`/`label-*` inside their own
 * components) still out-rank it. Widgets keep their internal hierarchy; only the
 * frameless prose the renderers own directly is stepped here.
 */
const INNER_TRANSPARENT = "border-0 bg-transparent p-0 shadow-none";

/** Kase's frameless prose — reserved AI teal (item 2), stepped-down body (item 4). */
export const AI_PROSE = "text-body-s text-ai-fg";

export interface RenderBlockContext {
  /** Current selection for a choices block, keyed by block id. */
  selections: Record<string, string | string[]>;
  setSelection: (blockId: string, value: string | string[]) => void;
  confirmChoice: (confirmToTurnId: string) => void;
  commitAction: (commitToTurnId: string) => void;
}

export function renderBlock(block: Block, ctx: RenderBlockContext) {
  switch (block.kind) {
    case "text":
      return <div className={AI_PROSE}>{block.content}</div>;

    case "viz":
      return (
        <div className="ai-card-deep p-3">
          <ChartFrame title={block.title} description={block.description}>
            <Chart
              type={block.chartType}
              data={block.data}
              series={block.series}
              xKey={block.xKey}
              height={180}
              hideLegend={block.series.length <= 1}
              className={INNER_TRANSPARENT}
            />
          </ChartFrame>
        </div>
      );

    case "receipt":
      if (block.variant === "projection") {
        return (
          <ImpactProjectionPanel
            compact
            metrics={block.metrics}
            headline={block.headline}
            confidenceLabel={block.confidenceLabel}
            riskCountLabel={block.riskCountLabel}
            reasoningTitle={block.reasoningTitle}
            evidence={block.evidence}
            citations={block.citations}
          />
        );
      }
      return (
        <div className="ai-card flex flex-col gap-2 p-3">
          {block.provenanceTone ? (
            <EpistemicTag
              tone={block.provenanceTone}
              label={block.provenanceLabel}
              basis={block.provenanceBasis}
              className="self-start"
            />
          ) : null}
          <StatTile
            label={block.label}
            value={block.value}
            hint={block.hint}
            trend={block.trend}
            comparisonBar={block.comparisonBar}
            className={INNER_TRANSPARENT}
          />
        </div>
      );

    case "choices":
      return <ChoicesRenderer block={block} ctx={ctx} />;

    case "confirm":
      return <ConfirmRenderer block={block} ctx={ctx} />;

    case "action":
      return (
        <div className="flex flex-col gap-2">
          <div className={AI_PROSE}>{block.text}</div>
          <Button
            variant={block.ctaVariant ?? "primary"}
            size="sm"
            className="self-start"
            onClick={() => ctx.commitAction(block.commitToTurnId)}
          >
            {block.ctaLabel}
          </Button>
        </div>
      );

    default:
      return null;
  }
}

interface ConfirmRendererProps {
  block: ConfirmBlock;
  ctx: RenderBlockContext;
}

/**
 * A structured pre-execution confirmation card (FR-CONV-03) in an `.ai-card`
 * object-block — the "execute a workflow in chat" affordance. It names the action
 * (eyebrow + reused `PriorityTierBadge` when tiered), the target, and the
 * projected consequence, then offers a primary Confirm and a ghost Cancel.
 *
 * Confirming runs the existing `commitAction` path; cancelling settles locally
 * (no follow-up turn, so the card dismisses gracefully). Once settled the button
 * row is REPLACED by a spent status line so a committed card can never be
 * re-fired — mirroring how `ChoicesRenderer` locks after confirm.
 */
function ConfirmRenderer({ block, ctx }: ConfirmRendererProps) {
  const [settled, setSettled] = useState<"confirmed" | "cancelled" | null>(null);

  return (
    <div
      className="ai-card flex flex-col gap-3 p-3"
      role="group"
      aria-label={`Confirm ${block.actionType}`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-label-s font-semibold uppercase tracking-wide text-ai-fg">
          {block.actionType}
        </span>
        {block.tier ? <PriorityTierBadge tier={block.tier} /> : null}
      </div>

      <p className="text-body-s font-semibold text-fg-primary">
        {block.targetLabel}
      </p>

      <p className={AI_PROSE}>{block.consequence}</p>

      {settled === null ? (
        <div className="flex flex-wrap gap-2">
          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              setSettled("confirmed");
              ctx.commitAction(block.commitToTurnId);
            }}
          >
            {block.confirmLabel}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSettled("cancelled")}
          >
            {block.cancelLabel}
          </Button>
        </div>
      ) : (
        <p
          className="inline-flex items-center gap-1.5 text-body-s font-medium text-fg-secondary"
          role="status"
        >
          {settled === "confirmed" ? (
            <>
              <Check className="size-3.5 shrink-0" aria-hidden="true" />
              {block.actionType} confirmed
            </>
          ) : (
            "Cancelled, standing by"
          )}
        </p>
      )}
    </div>
  );
}

function selectionIsEmpty(value: string | string[] | undefined): boolean {
  if (value === undefined) return true;
  if (Array.isArray(value)) return value.length === 0;
  return value.length === 0;
}

interface ChoicesRendererProps {
  block: ChoicesBlock;
  ctx: RenderBlockContext;
}

/**
 * A selectable proposal in an `.ai-card`. The confirm Button is disabled until a
 * selection exists; confirming appends the follow-up turn. `confirmed` locks the
 * control once committed so the choice reads as spent rather than re-armable.
 */
function ChoicesRenderer({ block, ctx }: ChoicesRendererProps) {
  const [confirmed, setConfirmed] = useState(false);
  const value = ctx.selections[block.id];
  const disabled = selectionIsEmpty(value) || confirmed;

  return (
    <div className="ai-card flex flex-col gap-3 p-3">
      {block.prompt ? (
        <p className="text-body-s font-medium text-ai-fg">{block.prompt}</p>
      ) : null}

      {block.control === "radio" ? (
        <RadioGroup
          name={block.id}
          label={typeof block.prompt === "string" ? block.prompt : "Choose an option"}
          options={block.options}
          value={typeof value === "string" ? value : undefined}
          onChange={(next) => ctx.setSelection(block.id, next)}
          className="[&>span:first-child]:sr-only"
        />
      ) : block.control === "tags" ? (
        <div className="flex flex-wrap gap-1.5" role="group" aria-label="Choose one or more">
          {block.options.map((option) => (
            <TagToggle
              key={option.value}
              option={option}
              value={value}
              multiple={block.multiple}
              onToggle={(next) => ctx.setSelection(block.id, next)}
            />
          ))}
        </div>
      ) : (
        <Combobox
          label={typeof block.prompt === "string" ? block.prompt : "Choose options"}
          labelClassName="sr-only"
          multiple={block.multiple}
          options={block.options}
          value={value ?? (block.multiple ? [] : "")}
          onChange={(next) => ctx.setSelection(block.id, next)}
          placeholder="Select"
        />
      )}

      <Button
        variant="primary"
        size="sm"
        className="self-start"
        disabled={disabled}
        onClick={() => {
          setConfirmed(true);
          ctx.confirmChoice(block.confirmToTurnId);
        }}
      >
        {block.confirmLabel}
      </Button>
    </div>
  );
}

interface TagToggleProps {
  option: ChoiceOption;
  value: string | string[] | undefined;
  multiple?: boolean;
  onToggle: (next: string | string[]) => void;
}

/** A toggleable Tag (aria-pressed) — single or multi select over a short set. */
function TagToggle({ option, value, multiple, onToggle }: TagToggleProps) {
  const selected = Array.isArray(value)
    ? value.includes(option.value)
    : value === option.value;

  function handleClick() {
    if (multiple) {
      const current = Array.isArray(value) ? value : [];
      onToggle(
        selected
          ? current.filter((v) => v !== option.value)
          : [...current, option.value],
      );
    } else {
      onToggle(selected ? "" : option.value);
    }
  }

  return (
    <Tag isSelected={selected} onClick={handleClick}>
      {option.label}
    </Tag>
  );
}
