"use client";

import { Fragment, useState } from "react";
import { Sparkles, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { PriorityTierBadge } from "@/components/ui/priority-tier-badge";
import { StatTile } from "@/components/ui/stat-tile";
import type {
  SourceHealth,
  ExceptionRecord,
} from "@/app/workspace/lib/exception-types";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface SituationBriefModalProps {
  open: boolean;
  onClose: () => void;
  brief: string;
  sourceHealth: SourceHealth[];
  exceptionCounts: { T1: number; T2: number; T3: number; T4: number };
  queueCounts: { pending: number; escalated: number; delegated: number };
  exceptions: ExceptionRecord[];
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/** Renders a short body string, bolding **wrapped** phrases. */
function BoldBody({ text }: { text: string }) {
  const parts = text.split(/\*\*(.+?)\*\*/g);
  return (
    <>
      {parts.map((part, i) =>
        i % 2 === 1 ? (
          <strong key={i} className="font-semibold text-fg-primary">
            {part}
          </strong>
        ) : (
          <Fragment key={i}>{part}</Fragment>
        ),
      )}
    </>
  );
}

const STATUS_DOT: Record<SourceHealth["status"], string> = {
  healthy: "bg-success-emphasis",
  degraded: "bg-warning-emphasis",
  down: "bg-severity-emphasis",
};

const STATUS_LABEL: Record<SourceHealth["status"], string> = {
  healthy: "Healthy",
  degraded: "Degraded",
  down: "Down",
};

const SLIDE_TITLES = [
  "Welcome back, Jordan. Here's the latest snapshot:",
  "Highest-priority cluster",
  "Source systems health",
  "Escalated items",
  "Delegated items",
];

// ---------------------------------------------------------------------------
// Slides
// ---------------------------------------------------------------------------

function SlideZoneStatus({
  exceptionCounts,
  queueCounts,
}: Pick<SituationBriefModalProps, "exceptionCounts" | "queueCounts">) {
  const total =
    exceptionCounts.T1 +
    exceptionCounts.T2 +
    exceptionCounts.T3 +
    exceptionCounts.T4;

  return (
    <div className="flex flex-col gap-4">
      {/* AI-authored subtext */}
      <div className="flex items-start gap-2 rounded-lg bg-ai-surface px-3 py-2.5">
        <Sparkles
          className="mt-0.5 size-3.5 shrink-0 text-ai-fg"
          aria-hidden="true"
        />
        <p className="text-body-s text-ai-fg">
          {total} active exceptions, up from 8 at last shift close
        </p>
      </div>

      {/* Tier chips */}
      <div className="py-2">
        <p className="mb-2 text-label-s font-medium text-fg-muted">
          Active exceptions by priority
        </p>
        <div className="flex flex-wrap gap-8">
          {(["T1", "T2", "T3", "T4"] as const).map((tier) => (
            <div key={tier} className="flex items-center gap-1.5">
              <PriorityTierBadge tier={tier} />
              <span className="text-body-s font-semibold tabular-nums text-fg-primary">
                {exceptionCounts[tier]}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Queue counts */}
      <div className="grid grid-cols-3 gap-2">
        <StatTile label="Pending" value={queueCounts.pending} />
        <StatTile label="Escalated" value={queueCounts.escalated} />
        <StatTile label="Delegated" value={queueCounts.delegated} />
      </div>
    </div>
  );
}

function SlidePriorityCluster({
  brief,
}: Pick<SituationBriefModalProps, "brief">) {
  const sentences = brief
    .split(/(?<=\.)\s+/)
    .map((s) => s.trim())
    .filter(Boolean);

  return (
    <div className="flex flex-col gap-3">
      {/* Urgency callout — subordinate surface inside the glass modal */}
      <div className="flex items-start gap-2 rounded-lg bg-ai-surface px-3 py-2.5">
        <Sparkles
          className="mt-0.5 size-3.5 shrink-0 text-ai-fg"
          aria-hidden="true"
        />
        <p className="text-body-s text-ai-fg">
          <strong className="font-semibold">
            3 customs holds at Laredo World Trade Bridge
          </strong>{" "}
          — Gold-tier orders, breach window closing in 3h 40m
        </p>
      </div>

      {/* SLA urgency bar */}
      <div>
        <div className="mb-1.5 flex items-center justify-between">
          <span className="text-caption text-fg-muted">
            SLA window remaining
          </span>
          <span className="text-caption font-medium text-severity-fg">
            3h 40m left
          </span>
        </div>
        <div
          className="h-2 w-full overflow-hidden rounded-full bg-surface-sunken"
          role="progressbar"
          aria-valuenow={7}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="SLA window remaining: 7% of day"
        >
          <div
            className="h-full rounded-full bg-severity-emphasis"
            style={{ width: "7%" }}
          />
        </div>
      </div>

      {/* Brief — one paragraph per sentence for scannability */}
      <div className="flex flex-col gap-1.5">
        {sentences.map((sentence, i) => (
          <p key={i} className="text-body-s text-fg-secondary">
            <BoldBody text={sentence} />
          </p>
        ))}
      </div>
    </div>
  );
}

function SlideDataConfidence({
  sourceHealth,
}: Pick<SituationBriefModalProps, "sourceHealth">) {
  return (
    <div className="flex flex-col gap-4">
      {/* AI-tinted inferred-data warning — subordinate surface inside the glass modal */}
      <div className="flex items-start gap-2 rounded-lg bg-ai-surface px-3 py-2.5">
        <Sparkles
          className="mt-0.5 size-3.5 shrink-0 text-ai-fg"
          aria-hidden="true"
        />
        <p className="text-body-s text-ai-fg">
          Cold-chain status on 2 refrigerated loads is inferred, not confirmed.
          Customer-tier data on newest orders may be lagging.
        </p>
      </div>

      {/* 2-col source system grid */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-4 px-4 py-2">
        {sourceHealth.map((s) => (
          <div key={s.system} className="flex items-start gap-2">
            <span
              aria-hidden="true"
              className={cn(
                "mt-1 size-2 shrink-0 rounded-full",
                STATUS_DOT[s.status],
              )}
            />
            <div className="min-w-0">
              <p className="text-body-s font-medium text-fg-primary">
                {s.system}
              </p>
              <p className="text-caption text-fg-muted">
                <span className="sr-only">{STATUS_LABEL[s.status]}. </span>
                {s.status === "healthy"
                  ? STATUS_LABEL[s.status]
                  : `${STATUS_LABEL[s.status]}${s.detail ? ` · ${s.detail}` : ""}`}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SlideQueueItems({
  queue,
  items,
}: {
  queue: "escalated" | "delegated";
  items: ExceptionRecord[];
}) {
  const callout =
    queue === "escalated"
      ? "Pending compliance or supervisor response — no action needed from you right now."
      : "Handed off — track progress in the Delegated tab.";

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-start gap-2 rounded-lg bg-ai-surface px-3 py-2.5">
        <Sparkles
          className="mt-0.5 size-3.5 shrink-0 text-ai-fg"
          aria-hidden="true"
        />
        <p className="text-body-s text-ai-fg">{callout}</p>
      </div>

      <div className="flex flex-col gap-2">
        {items.length === 0 ? (
          <p className="text-body-s text-fg-muted">
            No {queue} items at this time.
          </p>
        ) : (
          items.map((item) => (
            <div
              key={item.id}
              className="flex items-start gap-8m rounded-lg border border-border-subtle px-3 py-2.5"
            >
              <div className="w-16 shrink-0">
                <PriorityTierBadge tier={item.priorityTier} />
              </div>
              <div className="min-w-0">
                <p className="text-label-s font-medium text-fg-primary">
                  {item.shipmentId}
                </p>
                <p className="line-clamp-1 text-caption text-fg-muted">
                  {item.headline}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

const TOTAL_STEPS = 5;

export function SituationBriefModal({
  open,
  onClose,
  brief,
  sourceHealth,
  exceptionCounts,
  queueCounts,
  exceptions,
}: SituationBriefModalProps) {
  const escalatedItems = exceptions.filter((e) => e.queue === "escalated");
  const delegatedItems = exceptions.filter((e) => e.queue === "delegated");
  const [step, setStep] = useState(0);

  const isFirst = step === 0;
  const isLast = step === TOTAL_STEPS - 1;

  const handlePrev = () => setStep((s) => Math.max(0, s - 1));
  const handleNext = () => {
    if (isLast) {
      onClose();
    } else {
      setStep((s) => Math.min(TOTAL_STEPS - 1, s + 1));
    }
  };

  // Reset to step 0 when the modal closes so it starts fresh on reopen.
  const handleClose = () => {
    setStep(0);
    onClose();
  };

  const actions = (
    <div className="flex w-full items-center justify-between">
      {/* Left: Prev button (hidden on first step for visual balance) */}
      <div className="w-20">
        {!isFirst ? (
          <Button
            variant="ghost"
            size="sm"
            leadingIcon={<ChevronLeft />}
            onClick={handlePrev}
          >
            Back
          </Button>
        ) : null}
      </div>

      {/* Center: step dots */}
      <div className="flex items-center gap-1.5" aria-label="Step indicator">
        {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
          <button
            key={i}
            type="button"
            aria-label={`Go to slide ${i + 1}`}
            aria-current={i === step ? "step" : undefined}
            onClick={() => setStep(i)}
            className={cn(
              "rounded-full transition-all duration-200",
              i === step
                ? "h-2 w-4 bg-[var(--color-primary-600)]"
                : "size-2 bg-fg-muted/40 hover:bg-fg-muted/70",
            )}
          />
        ))}
      </div>

      {/* Right: Next / Start shift */}
      <div className="flex w-20 justify-end">
        <Button
          variant={isLast ? "primary" : "ghost"}
          size="sm"
          trailingIcon={!isLast ? <ChevronRight /> : undefined}
          onClick={handleNext}
        >
          {isLast ? "Start shift" : "Next"}
        </Button>
      </div>
    </div>
  );

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      title={SLIDE_TITLES[step]}
      actions={actions}
      aiSurface
      className="max-w-xl"
    >
      {/* Slide container — cross-fade between steps via opacity transition */}
      <div className="relative overflow-hidden pb-2">
        <div
          key={step}
          className="transition-all duration-200 motion-safe:animate-[empty-state-fade-in_160ms_ease-out_both]"
        >
          {step === 0 && (
            <SlideZoneStatus
              exceptionCounts={exceptionCounts}
              queueCounts={queueCounts}
            />
          )}
          {step === 1 && <SlidePriorityCluster brief={brief} />}
          {step === 2 && <SlideDataConfidence sourceHealth={sourceHealth} />}
          {step === 3 && (
            <SlideQueueItems queue="escalated" items={escalatedItems} />
          )}
          {step === 4 && (
            <SlideQueueItems queue="delegated" items={delegatedItems} />
          )}
        </div>
      </div>
    </Dialog>
  );
}
