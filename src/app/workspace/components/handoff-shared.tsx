"use client";

import { Fragment, useState } from "react";
import type { ReactNode } from "react";
import { ChevronDown, RefreshCw, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { TextArea } from "@/components/ui/text-area";
import { Select } from "@/components/ui/select";
import type { PackageField } from "@/app/workspace/lib/exception-handoff";

/**
 * Shared building blocks for the Delegate / Escalate handoff surfaces
 * (Direction C). Kept route-local (this feature's use only): the RichText bold
 * renderer, the AI-assembled package/brief with its edit vs. preview toggle
 * (adjustment 3 — one view at a time, not a split), and the ZOM context-note
 * (a plain optional textarea, skippable).
 *
 * Reserved-ramp discipline: package/brief surfaces render on the `ai-*` ramp
 * (via the `.ai-card` utility + `text-ai-*`); everything else uses neutral.
 */

const REVEAL = "motion-safe:animate-[empty-state-rise-in_200ms_ease-out_both]";

/**
 * Minimal **bold** renderer mirroring exception-detail-view's RichText — splits
 * on `**` markers and wraps the odd segments semibold. Shared so package copy
 * bolds key phrases the same way the detail view does.
 */
export function RichText({ text }: { text: string }) {
  const parts = text.split("**");
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

// ---------------------------------------------------------------------------
// AI-assembled package / brief. On the `ai-*` ramp, collapsed by default,
// expandable. Adjustment 3: a toggle (segmented control) flips between
// "Edit package" and "Preview as [recipient]" — one view at a time.
// ---------------------------------------------------------------------------

export interface AiPackageProps {
  /** Section heading, e.g. "AI-assembled handoff package". */
  title: string;
  fields: PackageField[];
  /** Recipient name for the preview view label, e.g. "J. Torres". */
  recipientName: string;
  /** Recipient-facing card title, e.g. "New delegation from Zone Ops". */
  previewTitle: string;
  /** Current field values (edited overlay of the derived defaults). */
  values: Record<string, string>;
  onFieldChange: (key: string, value: string) => void;
  /** Optional badge shown by the mode toggle, e.g. "Edits are logged". */
  editNote?: string;
}

type PackageMode = "edit" | "preview";

/**
 * The AI package/brief surface. Collapsed disclosure by default; expanding
 * reveals a segmented Edit / Preview toggle (adjustment 3) over the same
 * content. Edit shows editable rows; Preview resolves the package as the
 * recipient sees it. The whole surface sits on the reserved `ai-*` ramp.
 */
export function AiPackage({
  title,
  fields,
  recipientName,
  previewTitle,
  values,
  onFieldChange,
  editNote,
}: AiPackageProps) {
  const [expanded, setExpanded] = useState(false);
  const [mode, setMode] = useState<PackageMode>("edit");

  const valueFor = (field: PackageField) => values[field.key] ?? field.value;

  return (
    <div className="ai-card overflow-hidden">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
        className="flex w-full items-center justify-between gap-2 px-3.5 py-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-inset"
      >
        <span className="flex items-center gap-1.5 text-label-s font-semibold uppercase tracking-wide text-ai-fg">
          <Sparkles className="size-4 text-ai-emphasis" aria-hidden="true" />
          {title}
        </span>
        <ChevronDown
          aria-hidden="true"
          className={cn(
            "size-4 shrink-0 text-ai-fg transition-transform",
            expanded && "rotate-180",
          )}
        />
      </button>

      {expanded ? (
        <div className={cn("border-t border-ai-border/30 px-3.5 pb-3.5", REVEAL)}>
          {/* Edit / Preview segmented toggle (adjustment 3). */}
          <div className="flex items-center justify-between gap-2 py-3">
            <div
              role="tablist"
              aria-label="Package view"
              className="inline-flex gap-0.5 rounded-md bg-surface-sunken p-0.5"
            >
              {(
                [
                  { value: "edit" as const, label: "Edit package" },
                  {
                    value: "preview" as const,
                    label: `Preview as ${recipientName}`,
                  },
                ]
              ).map((option) => {
                const isActive = mode === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    onClick={() => setMode(option.value)}
                    className={cn(
                      "rounded-md px-2.5 py-1 text-label-m font-medium transition-colors",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-1",
                      isActive
                        ? "bg-surface-raised text-fg-primary shadow-sm"
                        : "text-fg-secondary hover:text-fg-primary",
                    )}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
            {editNote ? (
              <span className="text-caption text-fg-muted">{editNote}</span>
            ) : null}
          </div>

          {mode === "edit" ? (
            <div className={cn("flex flex-col", REVEAL)}>
              {fields.map((field) => {
                const isModified =
                  values[field.key] !== undefined &&
                  values[field.key] !== field.value;
                return (
                  <div
                    key={field.key}
                    className="grid grid-cols-[7.5rem_minmax(0,1fr)] gap-2.5 border-b border-dashed border-ai-border/30 py-2 last:border-b-0"
                  >
                    <span className="text-caption font-medium text-fg-muted">
                      {field.key}
                    </span>
                    {field.editable ? (
                      <div className="flex flex-col gap-1">
                        <input
                          type="text"
                          value={valueFor(field)}
                          onChange={(e) => onFieldChange(field.key, e.target.value)}
                          aria-label={`Edit ${field.key}`}
                          className={cn(
                            "w-full rounded-md border bg-surface-raised px-2 py-1 text-body-s text-fg-secondary outline-none transition-colors focus-visible:border-solid focus-visible:border-focus-ring focus-visible:ring-2 focus-visible:ring-focus-ring",
                            isModified
                              ? "border-warning-emphasis"
                              : "border-dashed border-border-strong",
                          )}
                        />
                        {isModified && (
                          <span
                            className={cn(
                              "flex items-center gap-1 text-caption text-warning-fg",
                              REVEAL,
                            )}
                          >
                            <RefreshCw
                              className="size-3 shrink-0"
                              aria-hidden="true"
                            />
                            Modified
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-body-s text-fg-secondary">
                        <RichText text={valueFor(field)} />
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div
              className={cn(
                "rounded-lg border border-ai-border/40 bg-surface-raised p-3",
                REVEAL,
              )}
            >
              <p className="text-body-m font-semibold text-fg-primary">
                {previewTitle}
              </p>
              <ul className="mt-2 flex flex-col gap-1.5">
                {fields.map((field) => (
                  <li key={field.key} className="text-body-s text-fg-secondary">
                    <span className="font-medium text-fg-muted">
                      {field.key}.{" "}
                    </span>
                    <RichText text={valueFor(field)} />
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}

// ---------------------------------------------------------------------------
// ZOM context note — a plain optional textarea with a single clean label
// (Starling feedback: the structured prompt chips are removed and the label no
// longer interpolates the recipient name). Skippable. The Field/TextArea
// `optional` badge was dropped per Starling feedback 2026-07-06 — the label
// itself already reads "Additional Context (optional)", so the badge was
// showing the same information twice.
// ---------------------------------------------------------------------------

export interface ContextNoteProps {
  /** Static field label, e.g. "Additional Context (optional)". */
  label: string;
  value: string;
  onChange: (value: string) => void;
}

export function ContextNote({ label, value, onChange }: ContextNoteProps) {
  return (
    <div>
      <p className="mb-1.5 text-label-s font-semibold uppercase tracking-wide text-fg-muted">
        {label}
      </p>
      <TextArea
        label={label}
        containerClassName="[&_label]:sr-only"
        rows={2}
        placeholder="Add anything the recipient should know, or skip."
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Reason category — required when the routed action is MODIFIED (custom mode,
// an alternative rec instead of the AI primary, or an edited instruction).
// Captures WHY the ZOM diverged from the AI recommendation before the handoff
// can be sent (PRD FR-24 / AC-07). Built on the canonical Select so it opens
// as a portalled listbox; no default selection, so the ZOM must choose.
// ---------------------------------------------------------------------------

export const REASON_CATEGORY_OPTIONS = [
  { value: "prior-carrier-arrangement", label: "Prior carrier arrangement" },
  { value: "customer-specific-commitment", label: "Customer-specific commitment" },
  { value: "capacity-timing-constraint", label: "Capacity/timing constraint" },
  { value: "alternative-better-fit", label: "Alternative better fits situation" },
  { value: "other-operational-context", label: "Other operational context" },
];

export interface ReasonCategoryFieldProps {
  value: string;
  onChange: (value: string) => void;
}

/**
 * Shown only when the routed action is modified from the AI recommendation.
 * Required, no default selection — the confirm button stays disabled until a
 * category is chosen (enforced by each modal's own canSend gate).
 */
export function ReasonCategoryField({ value, onChange }: ReasonCategoryFieldProps) {
  return (
    <Select
      label="Reason for change"
      helperText="Required because this route differs from the AI recommendation."
      placeholder="Select a reason category"
      options={REASON_CATEGORY_OPTIONS}
      value={value}
      onChange={onChange}
      required
    />
  );
}

// ---------------------------------------------------------------------------
// Recipient row — the confirmed policy recipient (Escalate) rendered as a quiet,
// non-interactive neutral row with an avatar monogram. Actors stay on neutral.
// ---------------------------------------------------------------------------

export function initials(name: string): string {
  return name
    .replace(/[^A-Za-z. ]/g, "")
    .split(/[.\s]+/)
    .filter(Boolean)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .slice(0, 2)
    .join("");
}

export function RecipientRow({
  name,
  role,
  trailing,
  children,
}: {
  name: string;
  role: string;
  trailing?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <div className="flex items-center gap-2.5 rounded-lg border border-border-subtle bg-surface p-2.5">
      <span
        aria-hidden="true"
        className="flex size-8 shrink-0 items-center justify-center rounded-full bg-surface-sunken text-label-m font-semibold text-fg-secondary"
      >
        {initials(name)}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-body-m font-semibold text-fg-primary">
          {name}
        </span>
        <span className="block text-caption text-fg-muted">{role}</span>
        {children}
      </span>
      {trailing}
    </div>
  );
}
