"use client";

import { Fragment, useState } from "react";
import { Bell, Megaphone, Radio } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Menu } from "@/components/ui/menu";
import {
  MOCK_NOTIFICATIONS,
  type NotificationKind,
  type WorkspaceNotification,
} from "@/app/workspace/lib/notifications";

/**
 * Notification bell (Row 1) — an icon-only Button that opens a portaled panel
 * (via the canonical Menu, which portals to document.body) listing mock
 * notifications. UI shell only: clicking an item marks it read in local state,
 * no real persistence. Two kinds are visually distinguished by a quiet leading
 * icon: "feed" (exception updates) and "brief" (AI shift summaries).
 */

/** Leading icon + short kind label per notification kind. */
const KIND_META: Record<NotificationKind, { icon: typeof Bell; label: string }> = {
  feed: { icon: Radio, label: "Feed update" },
  brief: { icon: Megaphone, label: "AI brief" },
};

/**
 * Renders a short body string, bolding **wrapped** phrases. Splitting on the
 * `**` markers keeps the mock copy scannable per CLAUDE.md without pulling in a
 * markdown dependency for one field.
 */
function BoldBody({ text }: { text: string }) {
  const parts = text.split(/\*\*(.+?)\*\*/g);
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

export function NotificationBell({ className }: { className?: string }) {
  const [items, setItems] = useState<WorkspaceNotification[]>(MOCK_NOTIFICATIONS);

  const unreadCount = items.filter((n) => !n.read).length;
  const hasUnread = unreadCount > 0;

  const markRead = (id: string) => {
    setItems((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
    );
  };

  return (
    <div className={cn("relative", className)}>
      <Menu
        align="end"
        className="w-80 max-w-[calc(100vw-2rem)]"
        trigger={
          <Button
            iconOnly
            variant="ghost"
            size="md"
            icon={<Bell aria-hidden="true" />}
            aria-label={
              hasUnread
                ? `Notifications, ${unreadCount} unread`
                : "Notifications"
            }
          />
        }
      >
        <div
          className="motion-safe:animate-[empty-state-fade-in_140ms_ease-out_both]"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between gap-2 border-b border-border-subtle px-3 py-2">
            <span className="text-label-l font-medium text-fg-primary">
              Notifications
            </span>
            {hasUnread ? (
              // Notification emphasis uses the project's brand ramp (primary),
              // not the danger/severity ramp — unread is not an error state.
              <Badge size="sm" tone="brand">
                {unreadCount} new
              </Badge>
            ) : null}
          </div>

          {items.length === 0 ? (
            <p className="px-3 py-6 text-center text-body-s text-fg-muted">
              You are all caught up. No notifications right now.
            </p>
          ) : (
            <ul className="max-h-96 overflow-y-auto py-1">
              {items.map((n) => {
                const meta = KIND_META[n.kind];
                const KindIcon = meta.icon;
                // AI briefs are accented with the reserved AI palette so an
                // AI-authored notification reads distinctly from a feed update.
                const isAi = n.kind === "brief";
                return (
                  <li key={n.id}>
                    <button
                      type="button"
                      onClick={() => markRead(n.id)}
                      className={cn(
                        "flex w-full items-start gap-3 px-3.5 py-3 text-left transition-colors",
                        "hover:bg-option-hover focus-visible:outline-none focus-visible:bg-option-hover",
                        // Subtle AI-tinted lead-in stripe for AI briefs.
                        isAi && "bg-ai-surface/40 hover:bg-ai-surface/60",
                      )}
                    >
                      {/* Icon now sits inside a rounded badge/container. AI
                          briefs tint the badge with the reserved AI ramp; feed
                          updates stay quiet on a neutral sunken surface. */}
                      <span
                        aria-hidden="true"
                        className={cn(
                          "inline-flex size-7 shrink-0 items-center justify-center rounded-full",
                          isAi
                            ? "bg-ai-surface text-ai-fg"
                            : "bg-surface-shell text-fg-muted",
                        )}
                      >
                        <KindIcon className="size-4" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center gap-1.5">
                          <span
                            className={cn(
                              "min-w-0 flex-1 truncate text-body-s font-medium",
                              isAi ? "text-ai-fg" : "text-fg-primary",
                            )}
                          >
                            {n.title}
                          </span>
                          {!n.read ? (
                            <span
                              aria-hidden="true"
                              className={cn(
                                "size-1.5 shrink-0 rounded-full",
                                isAi ? "bg-ai-emphasis" : "bg-info-emphasis",
                              )}
                            />
                          ) : null}
                          <span className="shrink-0 text-caption text-fg-muted">
                            {n.timeAgo}
                          </span>
                        </span>
                        <span className="mt-1.5 block text-caption text-fg-secondary">
                          <span className="sr-only">{meta.label}. </span>
                          <BoldBody text={n.body} />
                        </span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </Menu>

      {/* Unread count overlay on the bell. Decorative — the count is already in
          the button's aria-label — so it is aria-hidden. */}
      {hasUnread ? (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute -right-0.5 -top-0.5"
        >
          <Badge size="sm" tone="brand" solid count={unreadCount} />
        </span>
      ) : null}
    </div>
  );
}
