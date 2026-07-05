import type { ReactNode } from "react";
import { Info, CheckCircle2, AlertTriangle, AlertCircle, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./button";

export type MessageBarSeverity = "info" | "success" | "warning" | "error";

const SEVERITY_CLASSES: Record<MessageBarSeverity, string> = {
  info: "border-info-border bg-info-surface text-info-fg",
  success: "border-success-border bg-success-surface text-success-fg",
  warning: "border-warning-border bg-warning-surface text-warning-fg",
  error: "border-danger-border bg-danger-surface text-danger-fg",
};

const SEVERITY_ICONS: Record<MessageBarSeverity, ReactNode> = {
  info: <Info className="size-5" aria-hidden="true" />,
  success: <CheckCircle2 className="size-5" aria-hidden="true" />,
  warning: <AlertTriangle className="size-5" aria-hidden="true" />,
  error: <AlertCircle className="size-5" aria-hidden="true" />,
};

export interface MessageBarProps {
  severity?: MessageBarSeverity;
  title?: ReactNode;
  children: ReactNode;
  /** Inline text/button action, e.g. "Retry" or "View details". */
  action?: ReactNode;
  /** Persistent by default; pass to allow user dismissal. */
  onDismiss?: () => void;
  className?: string;
}

/**
 * Canonical Message Bar — a persistent inline or top-of-surface message for
 * informational, success, warning, or error states tied to the current task
 * or form. Use Toast instead for a short, timed, non-blocking update that
 * doesn't need to persist.
 *
 * `error` severity uses `danger-*` tokens (form/task-level failure), not
 * `severity-*` — `severity-*` stays reserved for a true shipment-level
 * exception per CLAUDE.md's role-reservation rule. If a Message Bar is
 * specifically surfacing a real shipment delay/failure/blocking exception
 * (not a generic task error), pass `severity-*` tokens directly via
 * `className` rather than repurposing the `error` variant.
 *
 * For forms, move focus to the Message Bar when a submission produces one,
 * and reinforce with at-field errors inline (see Field).
 */
export function MessageBar({ severity = "info", title, children, action, onDismiss, className }: MessageBarProps) {
  return (
    <div
      role={severity === "error" ? "alert" : "status"}
      className={cn(
        "flex items-start gap-3 rounded-md border px-4 py-3",
        SEVERITY_CLASSES[severity],
        className,
      )}
    >
      <span className="mt-0.5 shrink-0">{SEVERITY_ICONS[severity]}</span>
      <div className="min-w-0 flex-1">
        {title ? <p className="text-label-l font-medium">{title}</p> : null}
        <div className={cn("text-body-s", title && "mt-0.5")}>{children}</div>
        {action ? <div className="mt-2">{action}</div> : null}
      </div>
      {onDismiss ? (
        <Button
          iconOnly
          icon={<X />}
          aria-label="Dismiss"
          variant="ghost"
          size="sm"
          className="-m-1 shrink-0 text-current hover:bg-black/5"
          onClick={onDismiss}
        />
      ) : null}
    </div>
  );
}
