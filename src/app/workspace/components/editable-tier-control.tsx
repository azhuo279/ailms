"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Menu, MenuItem } from "@/components/ui/menu";
import { RadioGroup } from "@/components/ui/radio-group";
import { TextArea } from "@/components/ui/text-area";
import { PriorityTierBadge } from "@/components/ui/priority-tier-badge";
import { PRIORITY_TIER_ORDER } from "@/app/workspace/components/workspace-filter-bar";
import { MODIFICATION_REASONS } from "@/app/workspace/lib/exception-detail";
import type { PriorityTier } from "@/app/workspace/lib/exception-types";

/**
 * EditableTierControl — the editable wrapper around the read-only
 * PriorityTierBadge in the Exception Detail View header (Starling feedback:
 * "make this a modifiable dropdown that allows the user to change and update the
 * status. It will trigger a modal to provide a change reason.").
 *
 * The shared PriorityTierBadge stays a pure read-only primitive (it is reused in
 * the Audit Log). Here it is COMPOSED as the trigger face so the visual language
 * stays identical, with a chevron affordance and a hover/focus surface signalling
 * the badge is now interactive.
 *
 * Flow:
 *   1. Click the trigger -> tier dropdown (Menu, portalled to document.body).
 *   2. Pick the SAME tier -> no-op, dropdown closes.
 *   3. Pick a DIFFERENT tier -> reason-capture modal (Dialog, portalled) opens
 *      with the pending tier held. A change-reason category is REQUIRED
 *      (MODIFICATION_REASONS via RadioGroup); a free-text note is OPTIONAL.
 *   4. Confirm -> commit the new tier via onTierChange. Cancel -> revert, no
 *      tier change.
 *
 * Reserved-ramp discipline: the badge keeps its severity/warning/neutral ramps
 * (true operational urgency). No `ai-*` teal leaks onto this control.
 *
 * Route-local (Step 11a): bound to this one header + use case, so NOT elevated.
 */

export interface TierChange {
  tier: PriorityTier;
  /** The selected MODIFICATION_REASONS category id (required). */
  reasonId: string;
  /** Optional free-text note. */
  note: string;
}

export interface EditableTierControlProps {
  tier: PriorityTier;
  /** Commit a confirmed tier change (parent lifts and re-renders the tier). */
  onTierChange: (change: TierChange) => void;
  className?: string;
}

/** Tier label from the shared order source, e.g. "T2 High". */
function tierLabel(tier: PriorityTier): string {
  return PRIORITY_TIER_ORDER.find((t) => t.id === tier)?.label ?? tier;
}

export function EditableTierControl({
  tier,
  onTierChange,
  className,
}: EditableTierControlProps) {
  // The tier the user picked in the dropdown that differs from the current one,
  // held while the reason modal is open. null = modal closed.
  const [pendingTier, setPendingTier] = useState<PriorityTier | null>(null);
  const [reasonId, setReasonId] = useState("");
  const [note, setNote] = useState("");

  const selectTier = (next: PriorityTier) => {
    // Same tier -> nothing to change, no modal.
    if (next === tier) return;
    setPendingTier(next);
    setReasonId("");
    setNote("");
  };

  const closeModal = () => {
    // Cancel / dismiss reverts: the pending tier is dropped, tier unchanged.
    setPendingTier(null);
  };

  // Reason category is mandatory; confirm stays disabled until one is picked.
  const canConfirm = Boolean(reasonId);

  const handleConfirm = () => {
    if (!pendingTier || !canConfirm) return;
    onTierChange({ tier: pendingTier, reasonId, note });
    setPendingTier(null);
  };

  return (
    <>
      {/* Trigger — the read-only badge composed as the dropdown face, with a
          chevron and an interactive hover/focus surface. Menu portals the panel
          to document.body (overlay rule). */}
      <Menu
        align="start"
        className="w-44"
        trigger={
          <button
            type="button"
            aria-label={`Priority ${tierLabel(tier)}, change priority`}
            className={cn(
              "group inline-flex items-center gap-1 rounded-full pr-1.5 transition-colors",
              "hover:bg-surface-sunken focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring",
              className,
            )}
          >
            <PriorityTierBadge tier={tier} />
            <ChevronDown
              aria-hidden="true"
              className="size-3.5 shrink-0 text-fg-muted transition-transform group-aria-expanded:rotate-180"
            />
          </button>
        }
      >
        <div className="motion-safe:animate-[empty-state-rise-in_200ms_ease-out_both]">
          {PRIORITY_TIER_ORDER.map((option) => (
            <MenuItem
              key={option.id}
              checked={option.id === tier}
              onSelect={() => selectTier(option.id)}
            >
              <span className="flex items-center gap-2">
                <PriorityTierBadge tier={option.id} />
              </span>
            </MenuItem>
          ))}
        </div>
      </Menu>

      {/* Reason-capture modal — required category + optional note. Dialog
          portals to document.body (overlay rule) and traps focus. */}
      <Dialog
        open={pendingTier !== null}
        onClose={closeModal}
        className="max-w-md"
        title="Update priority"
        description={
          pendingTier
            ? `Change priority from ${tierLabel(tier)} to ${tierLabel(pendingTier)}.`
            : undefined
        }
        actions={
          <>
            <Button variant="secondary" onClick={closeModal}>
              Cancel
            </Button>
            <Button
              variant="primary"
              disabled={!canConfirm}
              onClick={handleConfirm}
            >
              Update priority
            </Button>
          </>
        }
      >
        <div className="motion-safe:animate-[empty-state-rise-in_200ms_ease-out_both] flex flex-col gap-4 pb-2">
          {/* Before -> after tier read, so the change is legible in the modal. */}
          {pendingTier ? (
            <div className="flex items-center gap-2">
              <PriorityTierBadge tier={tier} />
              <ChevronDown
                aria-hidden="true"
                className="size-4 shrink-0 -rotate-90 text-fg-muted"
              />
              <PriorityTierBadge tier={pendingTier} />
            </div>
          ) : null}

          {/* Required change-reason category (FR-24 style, MODIFICATION_REASONS). */}
          <RadioGroup
            name="tier-change-reason"
            label="Reason for change"
            value={reasonId}
            onChange={setReasonId}
            options={MODIFICATION_REASONS.map((reason) => ({
              value: reason.id,
              label: reason.label,
            }))}
          />

          {/* Optional free-text note. */}
          <TextArea
            label="Note"
            optional
            rows={3}
            placeholder="Add any context for this priority change."
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </div>
      </Dialog>
    </>
  );
}
