"use client";

import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  Clock,
  Send,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge, type BadgeTone } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TextArea } from "@/components/ui/text-area";
import type { ExceptionRecord } from "@/app/workspace/lib/exception-types";
import { buildRecommendedActions } from "@/app/workspace/lib/exception-detail";
import {
  buildDelegatePackage,
  buildDelegationStatus,
  type DelegationState,
  type StatusChipTone,
} from "@/app/workspace/lib/exception-handoff";
import { RichText } from "./handoff-shared";

/**
 * Delegation status panel — replaces the recommended-action block in the
 * Delegated-tab detail view (Direction C). Three parts:
 *   1. Status header — current state, dispatcher name + time sent. A quiet
 *      "Recall delegation" secondary action only while the dispatcher hasn't
 *      responded.
 *   2. What was sent — collapsed, expandable read-only handoff package.
 *   3. Dispatcher response — an owner-attributed status-chip table topped by a
 *      highlighted NEXT STEP card. A blocked state surfaces an inline
 *      clarification reply; a completed state surfaces "Confirm resolution"
 *      (the exception does NOT auto-close, the ZOM verifies).
 *
 * Reserved-ramp discipline: dispatcher (actor) reads neutral; blocked /
 * deadline-passed on severity/danger; completed on success.
 */

const CHIP_TONE: Record<StatusChipTone, BadgeTone> = {
  neutral: "neutral",
  warning: "warning",
  success: "success",
  danger: "danger",
};

// Status-header icon treatment per lifecycle state. Only true-failure states
// (blocked / deadline-passed) reach for the severity ramp.
const STATE_META: Record<
  DelegationState,
  { label: string; icon: typeof Clock; iconClass: string }
> = {
  awaiting: {
    label: "Awaiting dispatcher response",
    icon: Clock,
    iconClass: "bg-warning-surface text-warning-fg",
  },
  "in-progress": {
    label: "In progress",
    icon: Clock,
    iconClass: "bg-warning-surface text-warning-fg",
  },
  blocked: {
    label: "Dispatcher blocked, needs clarification",
    icon: AlertTriangle,
    iconClass: "bg-severity-surface text-severity-fg",
  },
  completed: {
    label: "Completed, awaiting your confirmation",
    icon: CheckCircle2,
    iconClass: "bg-success-surface text-success-fg",
  },
  "deadline-passed": {
    label: "Deadline passed, no response",
    icon: AlertTriangle,
    iconClass: "bg-severity-surface text-severity-fg",
  },
};

export interface DelegationStatusPanelProps {
  exception: ExceptionRecord;
  className?: string;
}

export function DelegationStatusPanel({
  exception,
  className,
}: DelegationStatusPanelProps) {
  const status = useMemo(
    () => buildDelegationStatus(exception),
    [exception],
  );
  // The package that was sent = the AI-primary action's package (read-only here).
  const sentPackage = useMemo(() => {
    const actions = buildRecommendedActions(exception);
    const primary = actions.find((a) => a.isAiPrimary) ?? actions[0];
    return buildDelegatePackage(exception, primary);
  }, [exception]);

  const [sentOpen, setSentOpen] = useState(false);
  const [reply, setReply] = useState("");

  const meta = STATE_META[status.state];
  const StateIcon = meta.icon;
  // Recall is available only while the dispatcher has not responded.
  const canRecall = status.state === "awaiting";
  const isBlocked = status.state === "blocked";
  const isCompleted = status.state === "completed";

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      {/* Part 1 — status header. */}
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
            {status.dispatcherName} · sent {status.sentAt} · deadline{" "}
            {status.deadline}
          </p>
        </div>
        {canRecall ? (
          <Button size="sm" variant="ghost" leadingIcon={<Send />}>
            Recall delegation
          </Button>
        ) : null}
      </div>

      {/* Part 2 — what was sent (read-only, collapsed by default). */}
      <SentDisclosure open={sentOpen} onToggle={() => setSentOpen((v) => !v)}>
        {sentPackage.map((field) => (
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

      {/* Part 3 — dispatcher response: NEXT STEP card + status-chip table. */}
      {isCompleted ? (
        <NextStepCard
          kicker="Next step, awaiting you"
          body={
            <>
              {status.dispatcherName} marked this{" "}
              <strong className="font-semibold text-fg-primary">done</strong>.
              Verify the resolution before closing, this exception does not
              auto-close.
            </>
          }
          action={
            <Button variant="primary" leadingIcon={<CheckCircle2 />}>
              Confirm resolution
            </Button>
          }
        />
      ) : null}

      {isBlocked ? (
        <NextStepCard
          tone="severity"
          kicker="Next step, dispatcher needs you"
          body={
            <>
              {status.dispatcherName} is{" "}
              <strong className="font-semibold text-fg-primary">blocked</strong>{" "}
              and needs a clarification to continue.
            </>
          }
          action={
            <div className="flex w-full flex-col gap-2">
              <TextArea
                label={`Reply to ${status.dispatcherName}`}
                containerClassName="[&_label]:sr-only"
                rows={2}
                placeholder={`Send the clarification ${status.dispatcherName} needs.`}
                value={reply}
                onChange={(e) => setReply(e.target.value)}
              />
              <Button
                size="sm"
                variant="primary"
                leadingIcon={<Send />}
                disabled={!reply.trim()}
                className="self-end"
              >
                Send reply
              </Button>
            </div>
          }
        />
      ) : null}

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
    </div>
  );
}

// ---------------------------------------------------------------------------
// Shared status-panel pieces (route-local to the two handoff status panels).
// ---------------------------------------------------------------------------

export function SentDisclosure({
  open,
  onToggle,
  label = "What was sent",
  children,
}: {
  open: boolean;
  onToggle: () => void;
  label?: string;
  children: ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded-lg border border-border-subtle">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-2 px-3 py-2.5 text-left text-body-m font-medium text-fg-primary transition-colors hover:bg-option-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-inset"
      >
        {label}
        <ChevronDown
          aria-hidden="true"
          className={cn(
            "size-4 shrink-0 text-fg-muted transition-transform",
            open && "rotate-180",
          )}
        />
      </button>
      {open ? (
        <div className="border-t border-border-subtle px-3 pb-3 pt-1 motion-safe:animate-[empty-state-rise-in_200ms_ease-out_both]">
          {children}
        </div>
      ) : null}
    </div>
  );
}

export function NextStepCard({
  kicker,
  body,
  action,
  tone = "primary",
}: {
  kicker: string;
  body: ReactNode;
  action: ReactNode;
  tone?: "primary" | "severity";
}) {
  return (
    <div
      className={cn(
        "rounded-lg border p-3.5",
        tone === "severity"
          ? "border-severity-border bg-severity-surface"
          : "border-primary-700 bg-selection-surface",
      )}
    >
      <p
        className={cn(
          "text-label-s font-bold uppercase tracking-wide",
          tone === "severity" ? "text-severity-fg" : "text-primary-700",
        )}
      >
        {kicker}
      </p>
      <p className="mt-1 mb-3 text-body-m text-fg-primary">{body}</p>
      {action}
    </div>
  );
}

export function StatusChipTable({
  rows,
}: {
  rows: { owner: string; update: string; chip: ReactNode; time: string }[];
}) {
  return (
    <div className="overflow-hidden rounded-lg border border-border-subtle">
      <table className="w-full border-collapse text-body-s">
        <thead>
          <tr>
            {["Owner", "Update", "Status", "Time"].map((h) => (
              <th
                key={h}
                scope="col"
                className="border-b border-border-subtle px-3 py-2 text-left text-caption font-semibold uppercase tracking-wide text-fg-muted"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i}>
              <td className="border-b border-border-subtle px-3 py-2 font-semibold text-fg-primary last:border-b-0">
                {row.owner}
              </td>
              <td className="border-b border-border-subtle px-3 py-2 text-fg-secondary">
                {row.update}
              </td>
              <td className="border-b border-border-subtle px-3 py-2">
                {row.chip}
              </td>
              <td className="border-b border-border-subtle px-3 py-2 tabular-nums text-fg-muted">
                {row.time}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
