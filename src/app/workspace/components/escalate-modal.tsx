"use client";

import { useMemo, useState } from "react";
import { AlertTriangle, MoveUpRight } from "lucide-react";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { ExceptionRecord } from "@/app/workspace/lib/exception-types";
import type { RecommendedAction } from "@/app/workspace/lib/exception-detail";
import {
  buildEscalateBrief,
  getEscalationTrigger,
  getPolicyApprover,
} from "@/app/workspace/lib/exception-handoff";
import {
  AiPackage,
  ContextNote,
  ReasonCategoryField,
  RecipientRow,
} from "./handoff-shared";

/**
 * Escalate modal (Direction C + adjustments). Routes the SELECTED AI-recommended
 * action UP to a Director / Legal-Compliance approver. Same four zones as
 * Delegate, different content:
 *   1. Header — exception/shipment context, an "Escalate" badge, and the
 *      escalation TRIGGER named explicitly on the severity ramp.
 *   2. Approver routing — the recipient is POLICY-DETERMINED (adjustment 1), not
 *      chosen from a free dropdown. Confirm who receives it and their role
 *      (the policy-basis caption and "Similar escalation" precedent chip
 *      were removed per Starling feedback 2026-07-06).
 *   3. AI-assembled escalation brief — decision-memo structure on the `ai-*`
 *      ramp, edit/preview toggle (adjustment 3), derived from the selected
 *      action (adjustment 2). For a T4 Legal-Sanctions route the AI
 *      recommendation is STRIPPED entirely.
 *   4. ZOM context note — a plain optional textarea, skippable.
 * Footer — NO deadline picker, "Submit escalation".
 */

export interface EscalateModalProps {
  open: boolean;
  exception: ExceptionRecord;
  action: RecommendedAction;
  /** True when the routed action differs from the AI recommendation (custom
   * mode, an alternative rec, or an edited instruction). Requires a reason
   * category before the escalation can be submitted (PRD FR-24 / AC-07). */
  isModified: boolean;
  onClose: () => void;
  /** Called on confirm — passes back the user's field-level edits to the brief. */
  onConfirm: (fieldOverrides: Record<string, string>) => void;
}

export function EscalateModal({
  open,
  exception,
  action,
  isModified,
  onClose,
  onConfirm,
}: EscalateModalProps) {
  const [note, setNote] = useState("");
  const [reasonCategory, setReasonCategory] = useState("");
  const [briefValues, setBriefValues] = useState<Record<string, string>>({});

  const approver = useMemo(() => getPolicyApprover(exception), [exception]);
  const trigger = useMemo(
    () => getEscalationTrigger(exception, approver),
    [exception, approver],
  );
  const briefFields = useMemo(
    () => buildEscalateBrief(exception, action, approver.stripsAiRecommendation),
    [exception, action, approver],
  );

  const canSend = !isModified || Boolean(reasonCategory);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      className="max-w-lg"
      title={
        <span className="flex flex-col gap-1.5">
          <span className="flex items-center gap-2">
            <Badge tone="danger">Escalate</Badge>
          </span>
          <span className="text-title font-semibold text-fg-primary">
            {action.name}
          </span>
        </span>
      }
      description={`${exception.shipmentId} · ${exception.headline}`}
      actions={
        <div className="flex w-full flex-col gap-2">
          <Button
            variant="primary"
            leadingIcon={<MoveUpRight />}
            disabled={!canSend}
            onClick={() => onConfirm(briefValues)}
            className="w-full"
          >
            Submit escalation
          </Button>
        </div>
      }
    >
      <div className="flex flex-col gap-4 pb-2">
        {/* Zone 1 (cont.) — the named escalation trigger on the severity ramp. */}
        <div className="flex items-start gap-2 rounded-lg border-l-2 border-severity-border bg-severity-surface px-3 py-2.5 text-body-s text-severity-fg">
          <AlertTriangle
            className="mt-0.5 size-4 shrink-0"
            aria-hidden="true"
          />
          <span>{trigger}</span>
        </div>

        {/* Zone 2 — policy-determined approver (confirmation, not selection).
            The policy-basis/open-escalations caption and the "Similar
            escalation" precedent chip were removed per Starling feedback
            2026-07-06 — the recipient identity/role alone is enough context
            at this step. */}
        <div>
          <p className="mb-1.5 text-label-s font-semibold uppercase tracking-wide text-fg-muted">
            Routed to (policy-determined)
          </p>
          <RecipientRow name={approver.name} role={approver.role} />
        </div>

        {/* Zone 2b — reason category, required only when the routed action is
            modified from the AI recommendation (PRD FR-24 / AC-07). */}
        {isModified ? (
          <ReasonCategoryField
            value={reasonCategory}
            onChange={setReasonCategory}
          />
        ) : null}

        {/* Zone 3 — AI-assembled escalation brief (decision memo, ai-* ramp). */}
        <AiPackage
          title="AI escalation brief (decision memo)"
          fields={briefFields}
          recipientName={approver.name}
          previewTitle="Approval requested"
          values={briefValues}
          onFieldChange={(key, value) =>
            setBriefValues((prev) => ({ ...prev, [key]: value }))
          }
          editNote="Edits are logged"
        />

        {/* Zone 4 — ZOM context note, a plain optional textarea. */}
        <ContextNote
          label="Additional Context (optional)"
          value={note}
          onChange={setNote}
        />
      </div>
    </Dialog>
  );
}
