"use client";

import { useMemo, useState } from "react";
import { Send } from "lucide-react";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Combobox } from "@/components/ui/combobox";
import { PriorityTierBadge } from "@/components/ui/priority-tier-badge";
import type { ExceptionRecord } from "@/app/workspace/lib/exception-types";
import type { RecommendedAction } from "@/app/workspace/lib/exception-detail";
import {
  DISPATCHERS,
  DEADLINE_PRESETS,
  buildDelegatePackage,
  getDispatcher,
  isOverCapacity,
} from "@/app/workspace/lib/exception-handoff";
import { AiPackage, ContextNote, ReasonCategoryField } from "./handoff-shared";

/**
 * Delegate modal (Direction C + adjustments). Routes the SELECTED AI-recommended
 * action DOWN to an execution-level dispatcher. Four zones top to bottom:
 *   1. Header — exception title, shipment id, the selected action verbatim,
 *      a "Delegate" badge (distinct from Escalate).
 *   2. Dispatcher selection — a DROPDOWN of users (adjustment 1), each option
 *      showing the name and a small role badge (Starling feedback). A minimal
 *      non-blocking over-capacity flag stays at the 5-task threshold.
 *   3. AI-assembled handoff package — on the `ai-*` ramp, collapsed by default,
 *      edit vs. preview toggle (adjustment 3). Content derived from the selected
 *      action (adjustment 2).
 *   4. ZOM context note — a plain optional textarea, skippable.
 * Footer — deadline preset picker, "Send delegation". On confirm the exception
 * moves to the Delegated tab.
 */

export interface DelegateModalProps {
  open: boolean;
  exception: ExceptionRecord;
  action: RecommendedAction;
  /** True when the routed action differs from the AI recommendation (custom
   * mode, an alternative rec, or an edited instruction). Requires a reason
   * category before the delegation can be sent (PRD FR-24 / AC-07). */
  isModified: boolean;
  onClose: () => void;
  /** Called on confirm — passes back the user's field-level edits to the package. */
  onConfirm: (fieldOverrides: Record<string, string>) => void;
}

export function DelegateModal({
  open,
  exception,
  action,
  isModified,
  onClose,
  onConfirm,
}: DelegateModalProps) {
  const [dispatcherId, setDispatcherId] = useState("");
  const [deadlineId, setDeadlineId] = useState("dl-60");
  const [note, setNote] = useState("");
  const [reasonCategory, setReasonCategory] = useState("");
  const [packageValues, setPackageValues] = useState<Record<string, string>>(
    {},
  );

  const dispatcher = getDispatcher(dispatcherId);

  // Dispatcher dropdown options (Starling feedback: just the name and a small
  // role badge, region + "N active" text dropped). The soft over-capacity
  // signal stays as a minimal non-blocking flag on an at/over-threshold
  // dispatcher (severity ramp), so capacity awareness is not lost.
  const dispatcherOptions = useMemo(
    () =>
      DISPATCHERS.map((d) => ({
        value: d.id,
        // Plain-text handle keeps typeahead filtering by name and role.
        searchText: `${d.name} ${d.role}`,
        label: (
          <span className="flex min-w-0 flex-1 items-center gap-1.5">
            <span className="min-w-0 flex-1 truncate text-fg-primary">
              {d.name}
            </span>
            <Badge tone="neutral" size="sm">
              {d.role}
            </Badge>
            {isOverCapacity(d) ? (
              <Badge tone="danger" size="sm">
                Over capacity
              </Badge>
            ) : null}
          </span>
        ),
      })),
    [],
  );

  const packageFields = useMemo(
    () => buildDelegatePackage(exception, action),
    [exception, action],
  );

  const canSend =
    Boolean(dispatcherId) && (!isModified || Boolean(reasonCategory));

  const handleConfirm = () => {
    if (!canSend) return;
    onConfirm(packageValues);
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      className="max-w-lg"
      title={
        <span className="flex flex-col gap-1.5">
          <span className="flex items-center gap-2">
            <Badge tone="brand">Delegate</Badge>
            <PriorityTierBadge tier={exception.priorityTier} />
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
            leadingIcon={<Send />}
            disabled={!canSend}
            onClick={handleConfirm}
            className="w-full"
          >
            Send delegation
          </Button>
        </div>
      }
    >
      <div className="flex flex-col gap-4 pb-2">
        {/* Zone 2 — dispatcher dropdown. */}
        <Combobox
          label="Send to dispatcher"
          placeholder="Search dispatchers by name or role"
          options={dispatcherOptions}
          value={dispatcherId}
          onChange={(v) => setDispatcherId(Array.isArray(v) ? v[0] : v)}
          required
        />
        {dispatcher && isOverCapacity(dispatcher) ? (
          <p className="-mt-2 text-caption text-severity-fg">
            {dispatcher.name} is over the {`5`}-task soft threshold. You can still
            send this, it just may wait longer.
          </p>
        ) : null}

        {/* Zone 2b — reason category, required only when the routed action is
            modified from the AI recommendation (PRD FR-24 / AC-07). */}
        {isModified ? (
          <ReasonCategoryField
            value={reasonCategory}
            onChange={setReasonCategory}
          />
        ) : null}

        {/* Zone 3 — AI-assembled handoff package (ai-* ramp), edit/preview. */}
        <AiPackage
          title="AI-assembled handoff package"
          fields={packageFields}
          recipientName={dispatcher?.name ?? "dispatcher"}
          previewTitle="New delegation from Zone Ops"
          values={packageValues}
          onFieldChange={(key, value) =>
            setPackageValues((prev) => ({ ...prev, [key]: value }))
          }
        />

        {/* Zone 4 — ZOM context note, a plain optional textarea. */}
        <ContextNote
          label="Additional Context (optional)"
          value={note}
          onChange={setNote}
        />

        {/* Footer-adjacent — deadline preset picker (SLA reference removed). */}
        <div>
          <p className="mb-1.5 text-label-s font-semibold uppercase tracking-wide text-fg-muted">
            Response deadline
          </p>
          <div className="flex flex-wrap items-center gap-1.5">
            {DEADLINE_PRESETS.map((preset) => (
              <Button
                key={preset.id}
                size="sm"
                variant={deadlineId === preset.id ? "primary" : "secondary"}
                isSelected={deadlineId === preset.id}
                onClick={() => setDeadlineId(preset.id)}
              >
                {preset.label}
              </Button>
            ))}
          </div>
        </div>
      </div>
    </Dialog>
  );
}
