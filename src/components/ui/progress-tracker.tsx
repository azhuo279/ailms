"use client";

import { useId, useState } from "react";
import type { CSSProperties } from "react";
import type { LucideIcon } from "lucide-react";
import { AlertCircle, Check } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * @deprecated Superseded by `density` ("compact" | "rich"), which is the
 * primary axis Direction A ("Ledger Stream") introduces — compact is
 * inherently horizontal and rich is inherently vertical, so the two
 * orientations are fully subsumed. `orientation` is kept only for backward
 * compatibility with any external callers and is mapped internally
 * (horizontal → compact, vertical → rich). No call sites in this codebase
 * use it as of this rewrite; prefer `density` going forward.
 */
export type ProgressTrackerOrientation = "horizontal" | "vertical";

export type ProgressTrackerDensity = "compact" | "rich";

/**
 * `error` was renamed to `blocked`. The prior "error" treatment (severity
 * border/bg/fg with an X glyph) and Direction A's "blocked" treatment
 * (identical severity border/bg/fg, with an AlertCircle glyph) are the same
 * semantic state — a step that cannot proceed without intervention — so
 * this extends the existing state in place rather than introducing two
 * parallel duplicate statuses. `error` is kept as a deprecated alias so any
 * existing data continues to render correctly.
 */
export type ProgressStepStatus = "complete" | "current" | "upcoming" | "blocked" | "error";

/** Typed source-system/actor indicator stamped on a step's node (rich + compact). */
export interface ProgressStepSource {
  icon: LucideIcon;
  /** Accessible label for the source, e.g. "SignalTrack" or "R. Kwan". */
  label: string;
}

export interface ProgressStep {
  id: string;
  label: string;
  description?: string;
  status: ProgressStepStatus;
  /** Marks a step the user may skip; rendered with an "Optional" caption. */
  optional?: boolean;
  /** Source system or actor that produced this step, shown as a corner badge. */
  source?: ProgressStepSource;
  /** ISO or display timestamp, shown at the row's trailing edge in rich mode. */
  timestamp?: string;
  /** Attribution line (e.g. a person's name and role), shown in rich mode. */
  actor?: string;
  /** Additional rationale/detail revealed when a rich-mode row is expanded. */
  detail?: string;
  /** Rendered as an inline detour panel below the row, rich mode + status "blocked" only. */
  detour?: { message: string; timestamp: string };
}

export interface ProgressTrackerProps {
  steps: ProgressStep[];
  /** @deprecated Use `density` instead; mapped internally when `density` is not set. */
  orientation?: ProgressTrackerOrientation;
  /** "compact" renders the horizontal stepper; "rich" renders the expandable timeline. */
  density?: ProgressTrackerDensity;
  /** Uncontrolled initial density when `density` is not provided. Defaults to "compact". */
  defaultDensity?: ProgressTrackerDensity;
  /** Notified on density change; required for controlled usage, optional otherwise. */
  onDensityChange?: (density: ProgressTrackerDensity) => void;
  /** Shows the built-in Compact/Rich timeline segmented toggle. Defaults to true. */
  showDensityToggle?: boolean;
  /** Allows clicking completed steps to navigate back to them. */
  onStepClick?: (step: ProgressStep) => void;
  className?: string;
}

const CONNECTOR_BASE = "bg-border-subtle";

function isBlocked(status: ProgressStepStatus) {
  return status === "blocked" || status === "error";
}

function connectorFillClasses(status: ProgressStepStatus, orientation: "horizontal" | "vertical") {
  if (status === "complete") return "bg-primary-700";
  if (isBlocked(status)) return null; // handled via inline dashed pattern below
  void orientation;
  return CONNECTOR_BASE;
}

function connectorBlockedStyle(orientation: "horizontal" | "vertical"): CSSProperties {
  // Tailwind has no utility for a repeating dashed gradient; this is the only
  // permitted inline style, per the design-system rules (a stroke pattern,
  // not a hardcoded spacing/dimension value).
  const angle = orientation === "horizontal" ? "90deg" : "180deg";
  return {
    backgroundImage: `repeating-linear-gradient(${angle}, var(--color-severity-600) 0 4px, transparent 4px 8px)`,
  };
}

function nodeClasses(status: ProgressStepStatus) {
  switch (status) {
    case "complete":
      return "border-primary-700 bg-primary-700 text-fg-on-primary";
    case "current":
      return "border-primary-700 bg-surface-raised text-primary-700";
    case "blocked":
    case "error":
      return "border-severity-600 bg-danger-surface text-danger-fg";
    default:
      return "border-border-strong bg-surface-raised text-fg-muted";
  }
}

/**
 * Canonical Progress Tracker — for a user moving through a multi-step
 * journey such as onboarding, shipment creation, or claims submission, or
 * for showing the audit trail of how an exception was handled. Good for
 * linear, named stages; do not substitute for generic pagination or
 * arbitrary tabbed navigation.
 *
 * Two density modes share one `steps` data model ("Ledger Stream"):
 * - `compact` — a horizontal stepper for lower-density contexts.
 * - `rich` — an expandable vertical timeline carrying source attribution,
 *   timestamps, per-row disclosure detail, and an inline "blocked" detour
 *   panel.
 */
export function ProgressTracker({
  steps,
  orientation,
  density,
  defaultDensity = "compact",
  onDensityChange,
  showDensityToggle = true,
  onStepClick,
  className,
}: ProgressTrackerProps) {
  const orientationDefault: ProgressTrackerDensity | undefined =
    orientation === "horizontal" ? "compact" : orientation === "vertical" ? "rich" : undefined;

  const [uncontrolledDensity, setUncontrolledDensity] = useState<ProgressTrackerDensity>(
    orientationDefault ?? defaultDensity,
  );
  const isControlled = density !== undefined;
  const resolvedDensity = isControlled ? density : uncontrolledDensity;

  const setDensity = (next: ProgressTrackerDensity) => {
    if (!isControlled) setUncontrolledDensity(next);
    onDensityChange?.(next);
  };

  return (
    <div className={className}>
      {showDensityToggle ? (
        <DensityToggle density={resolvedDensity} onChange={setDensity} />
      ) : null}
      {resolvedDensity === "rich" ? (
        <RichTimeline steps={steps} onStepClick={onStepClick} />
      ) : (
        <CompactStepper steps={steps} onStepClick={onStepClick} />
      )}
    </div>
  );
}

function DensityToggle({
  density,
  onChange,
}: {
  density: ProgressTrackerDensity;
  onChange: (density: ProgressTrackerDensity) => void;
}) {
  return (
    <div
      role="tablist"
      aria-label="Density"
      className="mb-5 inline-flex gap-0.5 rounded-md bg-surface-sunken p-0.5"
    >
      {(
        [
          { value: "compact", label: "Compact" },
          { value: "rich", label: "Rich timeline" },
        ] as const
      ).map((option) => {
        const isActive = density === option.value;
        return (
          <button
            key={option.value}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(option.value)}
            className={cn(
              "rounded-[calc(var(--radius-md)-2px)] px-3 py-1.5 text-label-m font-medium motion-safe:transition-colors",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-1",
              isActive ? "bg-surface-raised text-fg-primary shadow-sm" : "text-fg-secondary hover:text-fg-primary",
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

/** Compact horizontal stepper — one row of nodes joined by fill connectors. */
function CompactStepper({
  steps,
  onStepClick,
}: {
  steps: ProgressStep[];
  onStepClick?: (step: ProgressStep) => void;
}) {
  return (
    <ol className="flex items-start">
      {steps.map((step, index) => {
        const isLast = index === steps.length - 1;
        const isClickable = step.status === "complete" && Boolean(onStepClick);
        const fillClasses = connectorFillClasses(step.status, "horizontal");

        return (
          <li key={step.id} className={cn("flex items-center", !isLast && "flex-1")}>
            <div className="flex flex-col items-center gap-1.5">
              <StepNode step={step} isClickable={isClickable} onClick={() => onStepClick?.(step)} />
              <div className="flex flex-col items-center text-center">
                <span
                  className={cn(
                    "whitespace-nowrap text-label-m font-medium",
                    step.status === "upcoming" ? "text-fg-muted" : "text-fg-primary",
                  )}
                >
                  {step.label}
                </span>
                {step.optional ? <span className="text-caption text-fg-muted">Optional</span> : null}
              </div>
            </div>
            {!isLast ? (
              <div
                className={cn("mx-2 mt-4 h-0.5 flex-1 self-start", fillClasses ?? CONNECTOR_BASE)}
                style={fillClasses ? undefined : isBlocked(step.status) ? connectorBlockedStyle("horizontal") : undefined}
              />
            ) : null}
          </li>
        );
      })}
    </ol>
  );
}

/** Rich expandable vertical timeline — attribution, timestamps, per-row disclosure, detour panels. */
function RichTimeline({
  steps,
  onStepClick,
}: {
  steps: ProgressStep[];
  onStepClick?: (step: ProgressStep) => void;
}) {
  const [openRows, setOpenRows] = useState<Record<string, boolean>>({});
  const baseId = useId();

  const toggleRow = (id: string) => {
    setOpenRows((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <ol className="flex flex-col">
      {steps.map((step, index) => {
        const isLast = index === steps.length - 1;
        const isClickable = step.status === "complete" && Boolean(onStepClick);
        const fillClasses = connectorFillClasses(step.status, "vertical");
        const isOpen = Boolean(openRows[step.id]);
        const hasDetail = Boolean(step.detail);
        const panelId = `${baseId}-detail-${step.id}`;
        const showDetour = step.status === "blocked" || step.status === "error";

        return (
          <li key={step.id} className="flex gap-3">
            <div className="flex flex-col items-center">
              <StepNode step={step} isClickable={isClickable} onClick={() => onStepClick?.(step)} />
              {!isLast ? (
                <div
                  className={cn("my-1 min-h-5 w-0.5 flex-1", fillClasses ?? CONNECTOR_BASE)}
                  style={fillClasses ? undefined : isBlocked(step.status) ? connectorBlockedStyle("vertical") : undefined}
                />
              ) : null}
            </div>
            <div className={cn("min-w-0 flex-1 pb-5", isLast && "pb-0")}>
              <button
                type="button"
                disabled={!hasDetail}
                aria-expanded={hasDetail ? isOpen : undefined}
                aria-controls={hasDetail ? panelId : undefined}
                onClick={() => hasDetail && toggleRow(step.id)}
                className={cn(
                  "flex w-full items-baseline justify-between gap-3 text-left",
                  hasDetail
                    ? "cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-1"
                    : "cursor-default",
                )}
              >
                <span
                  className={cn(
                    "text-body-m font-semibold",
                    step.status === "upcoming" ? "text-fg-muted" : "text-fg-primary",
                  )}
                >
                  {step.label}
                  {step.optional ? <span className="ml-1.5 text-caption font-normal text-fg-muted">Optional</span> : null}
                </span>
                {step.timestamp ? (
                  <span className="shrink-0 whitespace-nowrap text-caption text-fg-muted">{step.timestamp}</span>
                ) : null}
              </button>
              {step.description ? <p className="mt-0.5 text-body-s text-fg-muted">{step.description}</p> : null}
              {step.actor ? (
                <div className="mt-0.5 flex items-center gap-1.5">
                  <span className="text-body-s text-fg-secondary">{step.actor}</span>
                </div>
              ) : null}
              {hasDetail ? (
                <div
                  id={panelId}
                  role="region"
                  aria-hidden={!isOpen}
                  inert={!isOpen ? true : undefined}
                  className={cn(
                    "grid overflow-hidden motion-safe:transition-[grid-template-rows] motion-safe:duration-[220ms] motion-safe:ease-in-out",
                    isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr] motion-reduce:hidden",
                  )}
                >
                  <div className="min-h-0">
                    <div className="mt-2 rounded-md bg-surface px-3 py-2.5 text-body-s text-fg-secondary">
                      {step.detail}
                    </div>
                  </div>
                </div>
              ) : null}
              {showDetour && step.detour ? (
                <div className="mt-2 rounded-md border-l-2 border-severity-border bg-danger-surface px-3 py-2.5 text-body-s text-danger-fg">
                  <p>
                    <strong className="font-semibold">Detour.</strong> {step.detour.message}
                  </p>
                  <p className="mt-1 text-caption text-fg-muted">{step.detour.timestamp}</p>
                </div>
              ) : null}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

function StepNode({
  step,
  isClickable,
  onClick,
}: {
  step: ProgressStep;
  isClickable: boolean;
  onClick: () => void;
}) {
  const content =
    step.status === "complete" ? (
      <Check className="size-4" aria-hidden="true" />
    ) : isBlocked(step.status) ? (
      <AlertCircle className="size-4" aria-hidden="true" />
    ) : (
      <span className="text-label-m font-semibold">{step.id}</span>
    );

  const sharedClasses = cn(
    "flex size-8 shrink-0 items-center justify-center rounded-full border-2 motion-safe:transition-colors",
    nodeClasses(step.status),
  );

  const SourceBadge = step.source ? (
    <span
      className="absolute -right-0.5 -bottom-0.5 flex size-4 items-center justify-center rounded-full border-2 border-surface-raised bg-surface-raised shadow-sm"
      aria-hidden="true"
    >
      <step.source.icon className="size-2.5 text-fg-muted" aria-hidden="true" />
    </span>
  ) : null;

  if (isClickable) {
    return (
      <button
        type="button"
        onClick={onClick}
        aria-current={step.status === "current" ? "step" : undefined}
        aria-label={
          step.source
            ? `${step.label} (completed, ${step.source.label}, click to revisit)`
            : `${step.label} (completed, click to revisit)`
        }
        className={cn(
          "relative",
          sharedClasses,
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-1 hover:bg-primary-800",
        )}
      >
        {content}
        {SourceBadge}
      </button>
    );
  }

  return (
    <div className={cn("relative", sharedClasses)} aria-current={step.status === "current" ? "step" : undefined}>
      {content}
      {SourceBadge}
    </div>
  );
}
