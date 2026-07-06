import { Fragment } from "react";
import type { ReactNode } from "react";
import {
  CheckCircle2,
  FileWarning,
  MoveUpRight,
  Send,
  ShieldAlert,
  Sparkles,
  MessageSquareText,
  Waypoints,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { EVENT_TYPE_CONFIG } from "@/app/audit-log/lib/audit-log-format";
import type { AuditActor, AuditEventType } from "@/app/audit-log/lib/audit-log-types";

/**
 * Presentational primitives shared by the audit-log rows and the detail drawer.
 * Route-local (bound to this screen). The AI-vs-human distinction (FR-41) lives
 * here so the row treatment and the drawer header stay consistent: AI-authored
 * content uses the reserved `ai-*` ramp (Sparkles glyph + ai-fg identity),
 * humans stay on the neutral ramp.
 */

/** Stable icon per event type — never varies per row (FR-40 "stable icon"). */
export const EVENT_TYPE_ICON: Record<AuditEventType, typeof Sparkles> = {
  ai_recommendation: Sparkles,
  approval: CheckCircle2,
  override: FileWarning,
  escalation: MoveUpRight,
  delegation: Send,
  customs_hold: ShieldAlert,
  tier_routing: Waypoints,
  feedback: MessageSquareText,
};

/**
 * Minimal **bold** renderer for mock copy — splits on markdown-style `**...**`
 * markers and wraps the odd segments in a semibold span (scannable-copy
 * convention, mirrors the workspace detail view's RichText).
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

/** The typed event tag — stable icon + color per type (FR-40). */
export function AuditEventTag({
  type,
  className,
}: {
  type: AuditEventType;
  className?: string;
}) {
  const config = EVENT_TYPE_CONFIG[type];
  const Icon = EVENT_TYPE_ICON[type];
  return (
    <span
      className={cn(
        "inline-flex h-5 shrink-0 items-center gap-1 whitespace-nowrap rounded-full px-2 text-label-s font-medium",
        config.tagClass,
        className,
      )}
    >
      <Icon className="size-3.5 shrink-0" aria-hidden="true" />
      {config.label}
    </span>
  );
}

/**
 * Actor identity + role label (FR-40). AI actors read on the reserved teal
 * ramp with a Sparkles identity glyph; humans get a neutral initials avatar.
 * This is the at-a-glance AI-vs-human signal in every row (FR-41), paired at
 * the row level with an `ai-surface` tint + left accent.
 */
export function AuditActorIdentity({
  actor,
  size = "sm",
}: {
  actor: AuditActor;
  size?: "sm" | "md";
}) {
  const isAi = actor.kind === "ai";
  const glyphSize = size === "md" ? "size-7" : "size-6";
  const nameClass = size === "md" ? "text-body-m" : "text-body-s";

  return (
    <span className="flex min-w-0 items-center gap-2">
      <span
        aria-hidden="true"
        className={cn(
          "flex shrink-0 items-center justify-center rounded-full text-label-s font-semibold",
          glyphSize,
          isAi
            ? "bg-ai-surface text-ai-fg"
            : "bg-surface-sunken text-fg-secondary",
        )}
      >
        {isAi ? (
          <Sparkles className={size === "md" ? "size-4" : "size-3.5"} />
        ) : (
          getInitials(actor.name)
        )}
      </span>
      <span className="flex min-w-0 flex-col leading-tight">
        <span
          className={cn(
            "min-w-0 truncate font-medium",
            nameClass,
            isAi ? "text-ai-fg" : "text-fg-primary",
          )}
        >
          {actor.name}
        </span>
        <span className="truncate text-caption text-fg-muted">{actor.role}</span>
      </span>
    </span>
  );
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return (first + last).toUpperCase();
}

/** Small label + value stack used across the drawer's context payload. */
export function DrawerField({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-caption font-medium uppercase tracking-wide text-fg-muted">
        {label}
      </span>
      <div className="text-body-s text-fg-secondary">{children}</div>
    </div>
  );
}
