"use client";

import { useMemo, useState } from "react";
import {
  AlertTriangle,
  Check,
  CheckCircle2,
  Clock,
  RotateCcw,
  Send,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge, type BadgeTone } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { ExceptionRecord } from "@/app/workspace/lib/exception-types";
import { buildRecommendedActions, type RoutingSubmission } from "@/app/workspace/lib/exception-detail";
import {
  buildEscalateBrief,
  buildEscalationStatus,
  getPolicyApprover,
  type EscalationState,
  type StatusChipTone,
} from "@/app/workspace/lib/exception-handoff";
import { RichText } from "./handoff-shared";
import {
  NextStepCard,
  SentDisclosure,
  StatusChipTable,
} from "./delegation-status-panel";

/**
 * Escalation status panel — replaces the recommended-action block in the
 * Escalated-tab detail view (Direction C). Three parts:
 *   1. Status header — current state, approver name always visible. If no
 *      acknowledgment within the window (30 min default), a "No response yet"
 *      indicator with two recovery actions (send reminder, or re-route / handle
 *      yourself).
 *   2. What was submitted — collapsed, expandable read-only brief.
 *   3. Decision record — once the approver responds, decision
 *      (Approved / Modified / Rejected), rationale, changed parameters,
 *      timestamp. A rejection surfaces the ZOM's next-step path inline
 *      (alternatives within T1/T2 authority, filtered by rejection rationale).
 *
 * Reserved-ramp discipline: approver (actor) reads neutral; no-response /
 * rejection on severity/danger; approved / modified on success.
 */

const CHIP_TONE: Record<StatusChipTone, BadgeTone> = {
  neutral: "neutral",
  warning: "warning",
  success: "success",
  danger: "danger",
};

const STATE_META: Record<
  EscalationState,
  { label: string; icon: typeof Clock; iconClass: string }
> = {
  awaiting: {
    label: "Awaiting Director approval",
    icon: Clock,
    iconClass: "bg-warning-surface text-warning-fg",
  },
  reviewing: {
    label: "Director reviewing",
    icon: Clock,
    iconClass: "bg-warning-surface text-warning-fg",
  },
  decided: {
    label: "Decision received",
    icon: CheckCircle2,
    iconClass: "bg-success-surface text-success-fg",
  },
  returned: {
    label: "Returned, needs your response",
    icon: AlertTriangle,
    iconClass: "bg-severity-surface text-severity-fg",
  },
  "no-response": {
    label: "Awaiting Director approval",
    icon: Clock,
    iconClass: "bg-warning-surface text-warning-fg",
  },
};

export interface EscalationStatusPanelProps {
  exception: ExceptionRecord;
  routingSubmission?: RoutingSubmission;
  className?: string;
}

export function EscalationStatusPanel({
  exception,
  routingSubmission,
  className,
}: EscalationStatusPanelProps) {
  const status = useMemo(
    () => buildEscalationStatus(exception),
    [exception],
  );
  // Build the brief from the action the ZOM actually submitted, with their
  // instruction text and any field-level edits applied on top. Falls back to the
  // AI primary when no submission is recorded (e.g. pre-existing mock data).
  const submittedBrief = useMemo(() => {
    const approver = getPolicyApprover(exception);
    const action = routingSubmission?.action ?? (() => {
      const actions = buildRecommendedActions(exception);
      return actions.find((a) => a.isAiPrimary) ?? actions[0];
    })();
    const base = buildEscalateBrief(exception, action, approver.stripsAiRecommendation);
    if (!routingSubmission) return base;
    return base.map((f) => {
      if (routingSubmission.fieldOverrides[f.key] !== undefined) {
        return { ...f, value: routingSubmission.fieldOverrides[f.key] };
      }
      if (f.key === "Proposed action" && !approver.stripsAiRecommendation) {
        return { ...f, value: routingSubmission.instructionText };
      }
      return f;
    });
  }, [exception, routingSubmission]);

  const [submittedOpen, setSubmittedOpen] = useState(false);

  const meta = STATE_META[status.state];
  const StateIcon = meta.icon;
  const noResponse = status.state === "no-response";
  const decision = status.decision;

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      {/* Part 1 — status header, approver always visible. */}
      <div className="flex items-start gap-3">
        <span
          aria-hidden="true"
          className={cn(
            "flex size-9 shrink-0 items-center justify-center rounded-lg",
            meta.iconClass,
          )}
        >
          <StateIcon className="size-4" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-body-m font-semibold text-fg-primary">
            {meta.label}
          </p>
          <p className="mt-0.5 text-caption text-fg-muted">
            {status.approverName} · {status.approverRole} · submitted{" "}
            {status.submittedAt}
          </p>
        </div>
      </div>

      {/* No-response recovery (over the 30 min window). */}
      {noResponse ? (
        <div className="rounded-lg border-l-2 border-severity-border bg-severity-surface px-3 py-2.5">
          <p className="flex items-center gap-1.5 text-body-s font-medium text-severity-fg">
            <AlertTriangle className="size-4 shrink-0" aria-hidden="true" />
            No response yet, over the 30 min window
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            <Button size="sm" variant="primary" leadingIcon={<Send />}>
              Send reminder
            </Button>
            <Button size="sm" variant="secondary" leadingIcon={<RotateCcw />}>
              Re-route or handle myself
            </Button>
          </div>
        </div>
      ) : null}

      {/* Part 2 — what was submitted (read-only, collapsed by default). */}
      <SentDisclosure
        open={submittedOpen}
        onToggle={() => setSubmittedOpen((v) => !v)}
        label="What was submitted"
      >
        {submittedBrief.map((field) => (
          <div
            key={field.key}
            className="grid grid-cols-[7.5rem_minmax(0,1fr)] gap-2.5 border-b border-dashed border-border-subtle py-2 last:border-b-0"
          >
            <span className="text-caption font-medium text-fg-muted">
              {field.key}
            </span>
            <span className="text-body-s text-fg-secondary">
              <RichText text={field.value} />
            </span>
          </div>
        ))}
      </SentDisclosure>

      {/* Part 3 — decision record + rejection next steps. */}
      {decision ? (
        <div
          className={cn(
            "rounded-lg border p-3.5",
            decision.outcome === "rejected"
              ? "border-severity-border bg-severity-surface"
              : "border-success-border bg-success-surface",
          )}
        >
          <p
            className={cn(
              "flex items-center gap-1.5 text-body-m font-semibold",
              decision.outcome === "rejected"
                ? "text-severity-fg"
                : "text-success-fg",
            )}
          >
            {decision.outcome === "rejected" ? (
              <X className="size-4 shrink-0" aria-hidden="true" />
            ) : (
              <Check className="size-4 shrink-0" aria-hidden="true" />
            )}
            {decision.outcome === "approved"
              ? "Approved"
              : decision.outcome === "modified"
                ? "Approved (modified)"
                : "Rejected"}
          </p>
          <p className="mt-1.5 text-body-s text-fg-secondary">
            <strong className="font-semibold text-fg-primary">
              {decision.approverName}.
            </strong>{" "}
            {decision.rationale}
          </p>
          {decision.changedParameter ? (
            <p className="mt-1 text-body-s text-fg-secondary">
              <span className="text-fg-muted">Changed parameter. </span>
              {decision.changedParameter}
            </p>
          ) : null}
        </div>
      ) : null}

      {/* Rejection next-step path — alternatives within T1/T2 authority. */}
      {decision?.rejectionNextSteps ? (
        <NextStepCard
          kicker="Your next step, within your authority"
          body={
            <>
              These alternatives are{" "}
              <strong className="font-semibold text-fg-primary">
                filtered by the rejection
              </strong>{" "}
              and sit within your T1/T2 authority.
            </>
          }
          action={
            <ul className="flex w-full flex-col gap-2">
              {decision.rejectionNextSteps.map((step) => (
                <li key={step.title}>
                  <button
                    type="button"
                    className="w-full rounded-lg border border-border-subtle bg-surface-raised p-2.5 text-left transition-colors hover:bg-option-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
                  >
                    <span className="block text-body-m font-medium text-fg-primary">
                      {step.title}
                    </span>
                    <span className="block text-caption text-fg-muted">
                      {step.note}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          }
        />
      ) : null}

      {/* Owner-attributed status-chip table. */}
      <StatusChipTable
        rows={status.updates.map((u) => ({
          owner: u.owner,
          update: u.update,
          chip: (
            <Badge tone={CHIP_TONE[u.tone]} dot={u.tone !== "neutral"}>
              {u.statusLabel}
            </Badge>
          ),
          time: u.time,
        }))}
      />

      {/* When a decision needs no action, say so (Direction C). */}
      {decision && !decision.rejectionNextSteps ? (
        <p className="text-caption text-fg-muted">
          No action required, the decision is applied to {exception.shipmentId}.
        </p>
      ) : null}
    </div>
  );
}
