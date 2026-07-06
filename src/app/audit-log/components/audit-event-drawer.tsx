"use client";

import { useState } from "react";
import { ChevronDown, Copy, Check as CheckIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Drawer } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Link } from "@/components/ui/link";
import { PriorityTierBadge } from "@/components/ui/priority-tier-badge";
import {
  formatAbsolute,
  stripBold,
  EVENT_TYPE_CONFIG,
} from "@/app/audit-log/lib/audit-log-format";
import type { AuditEvent } from "@/app/audit-log/lib/audit-log-types";
import {
  AuditActorIdentity,
  AuditEventTag,
  DrawerField,
  RichText,
} from "./audit-log-shared";

/**
 * Audit-event detail drawer (FR-41). Opens on row click; portaled to
 * document.body by the Drawer primitive. Read-only by construction — the only
 * affordances are COPY (content / record / all) plus a link to the exception.
 * There is deliberately NO edit or delete control, because audit entries are
 * immutable. For AI-authored entries an expandable reasoning/steps section is
 * shown.
 */
export function AuditEventDrawer({
  event,
  open,
  onClose,
}: {
  event: AuditEvent | null;
  open: boolean;
  onClose: () => void;
}) {
  const [reasoningOpen, setReasoningOpen] = useState(true);

  if (!event) return null;

  const config = EVENT_TYPE_CONFIG[event.type];
  const isAi = event.actor.kind === "ai";
  const ctx = event.context;

  // The full plain-text record, used by "Copy record" / "Copy all".
  const recordLines = [
    `Event type: ${config.label}`,
    `Timestamp: ${formatAbsolute(event.timestamp)}`,
    `Actor: ${event.actor.name} (${event.actor.role})`,
    `Tier: ${event.tier}`,
    `Exception: ${event.exceptionId} (${event.shipmentId})`,
    `Content: ${stripBold(event.content)}`,
  ];
  if (ctx?.routedTo) recordLines.push(`Routed to: ${ctx.routedTo}`);
  if (ctx?.classificationRationale)
    recordLines.push(`Classification rationale: ${stripBold(ctx.classificationRationale)}`);
  if (ctx?.changes?.length)
    recordLines.push(
      ...ctx.changes.map((c) => `${c.label}: ${c.before} -> ${c.after}`),
    );
  if (ctx?.note) recordLines.push(`Note: ${ctx.note}`);
  if (ctx?.reasoning?.length)
    recordLines.push(
      "Reasoning:",
      ...ctx.reasoning.map((r) => `  - ${stripBold(r)}`),
    );
  const fullRecord = recordLines.join("\n");

  return (
    <Drawer
      open={open}
      onClose={onClose}
      width="md"
      title={
        <span className="flex min-w-0 items-center gap-2">
          <AuditEventTag type={event.type} />
        </span>
      }
      actions={
        <div className="flex w-full flex-wrap items-center justify-between gap-2">
          <Link href={`/workspace?exceptionId=${event.exceptionId}`} className="text-label-m">
            View exception {event.shipmentId}
          </Link>
          <div className="flex items-center gap-2">
            <CopyButton label="Copy content" value={stripBold(event.content)} variant="ghost" />
            <CopyButton label="Copy record" value={fullRecord} variant="secondary" />
          </div>
        </div>
      }
    >
      <div className="flex flex-col gap-5">
        {/* Header block — timestamp + actor (FR-41 header). */}
        <div
          className={cn(
            "flex flex-col gap-3 rounded-lg border p-3",
            isAi ? "border-ai-card-border bg-ai-surface" : "border-border-subtle bg-surface",
          )}
        >
          <AuditActorIdentity actor={event.actor} size="md" />
          <div className="flex flex-wrap items-center gap-2 text-caption text-fg-muted">
            <PriorityTierBadge tier={event.tier} />
            <span>{formatAbsolute(event.timestamp)}</span>
          </div>
        </div>

        {/* Full action content. */}
        <DrawerField label="Action content">
          <p className="text-body-m text-fg-secondary">
            <RichText text={event.content} />
          </p>
        </DrawerField>

        {/* Structured context payload — shape varies per event type (FR-41). */}
        {ctx?.changes?.length ? (
          <DrawerField label="What changed">
            <ul className="flex flex-col gap-2">
              {ctx.changes.map((change) => (
                <li
                  key={change.label}
                  className="rounded-md border border-border-subtle bg-surface p-2.5"
                >
                  <span className="text-caption font-medium text-fg-muted">
                    {change.label}
                  </span>
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-body-s">
                    <span className="rounded bg-surface-sunken px-1.5 py-0.5 text-fg-secondary line-through decoration-fg-muted">
                      {change.before}
                    </span>
                    <span aria-hidden="true" className="text-fg-muted">
                      &rarr;
                    </span>
                    <span className="rounded bg-success-surface px-1.5 py-0.5 font-medium text-success-fg">
                      {change.after}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </DrawerField>
        ) : null}

        {ctx?.routedTo ? (
          <DrawerField label="Routed to">
            <span className="font-medium text-fg-primary">{ctx.routedTo}</span>
          </DrawerField>
        ) : null}

        {ctx?.classificationRationale ? (
          <DrawerField label="Classification rationale">
            <p>
              <RichText text={ctx.classificationRationale} />
            </p>
          </DrawerField>
        ) : null}

        {ctx?.note ? (
          <DrawerField label="Note">
            <p className="italic">{ctx.note}</p>
          </DrawerField>
        ) : null}

        {/* AI reasoning / steps — AI entries only, expandable (FR-41). Reserved
            teal ramp, on the AI-surface tint so it reads as AI-authored. */}
        {isAi && ctx?.reasoning?.length ? (
          <div className="rounded-lg border border-ai-card-border bg-ai-surface">
            <button
              type="button"
              onClick={() => setReasoningOpen((v) => !v)}
              aria-expanded={reasoningOpen}
              className="flex w-full items-center justify-between gap-2 px-3 py-2.5 text-left text-label-m font-medium text-ai-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-inset"
            >
              <span className="flex items-center gap-2">
                Reasoning and steps
                {typeof ctx.confidence === "number" ? (
                  <span className="rounded-full bg-ai-emphasis px-2 py-0.5 text-footnote font-semibold text-fg-on-primary">
                    {Math.round(ctx.confidence)}% confidence
                  </span>
                ) : null}
              </span>
              <ChevronDown
                aria-hidden="true"
                className={cn(
                  "size-4 shrink-0 transition-transform",
                  reasoningOpen && "rotate-180",
                )}
              />
            </button>
            {reasoningOpen ? (
              <ol className="flex flex-col gap-2 border-t border-ai-card-border px-3 py-3 motion-safe:animate-[empty-state-rise-in_200ms_ease-out_both]">
                {ctx.reasoning.map((step, i) => (
                  <li key={i} className="flex items-start gap-2 text-body-s text-fg-secondary">
                    <span className="mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full bg-ai-emphasis text-footnote font-semibold text-fg-on-primary">
                      {i + 1}
                    </span>
                    <span className="min-w-0 flex-1">
                      <RichText text={step} />
                    </span>
                  </li>
                ))}
              </ol>
            ) : null}
            <p className="border-t border-ai-card-border px-3 py-2 text-footnote text-fg-muted">
              AI can make mistakes. This is a record of what was recommended, not
              a confirmed outcome.
            </p>
          </div>
        ) : null}

        {/* Copy-everything affordance, kept with the read-only body so the
            immutability of the record is obvious (no edit/delete anywhere). */}
        <div className="border-t border-border-subtle pt-4">
          <CopyButton label="Copy all details" value={fullRecord} variant="secondary" full />
        </div>
      </div>
    </Drawer>
  );
}

/** A copy-to-clipboard button with a transient "Copied" acknowledgment. */
function CopyButton({
  label,
  value,
  variant,
  full = false,
}: {
  label: string;
  value: string;
  variant: "ghost" | "secondary";
  full?: boolean;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      // Clipboard unavailable (permissions / insecure context) — no-op; the
      // record is still fully visible in the drawer.
    }
  };

  return (
    <Button
      size="sm"
      variant={variant}
      leadingIcon={
        copied ? (
          <CheckIcon className="text-success-fg" />
        ) : (
          <Copy />
        )
      }
      onClick={handleCopy}
      className={cn(full && "w-full")}
      aria-live="polite"
    >
      {copied ? "Copied" : label}
    </Button>
  );
}
