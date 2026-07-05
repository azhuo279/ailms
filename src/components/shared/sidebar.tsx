"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import NextLink from "next/link";
import {
  LayoutGrid,
  BarChart3,
  ScrollText,
  TrendingUp,
  Settings,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useSidebarStore } from "@/hooks/shared/use-sidebar-store";
import { useUserPersona } from "@/hooks/shared/use-user-persona";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";

/** Mock signed-in user — swap for real session data once auth lands. */
const MOCK_USER_NAME = "Jordan Lee";

const NAV_ITEMS = [
  { href: "/workspace", label: "Workspace", icon: LayoutGrid, directorOnly: false },
  { href: "/performance", label: "Performance", icon: BarChart3, directorOnly: false },
  { href: "/audit-log", label: "Audit Log", icon: ScrollText, directorOnly: false },
  {
    href: "/adoption-tracker",
    label: "Adoption Tracker",
    icon: TrendingUp,
    directorOnly: true,
  },
] as const;

const EXPANDED_WIDTH = "w-60";
const COLLAPSED_WIDTH = "w-[4.5rem]";

/**
 * Persistent left sidebar — the entire app shell's navigation surface.
 * Shares the shell's own raised-surface background so it reads as one
 * continuous chrome rather than a boxed panel; the page canvas inset next
 * to it (see AppShell) is what provides the visual separation, not a
 * border on the sidebar itself. Collapse state persists across reloads.
 */
export function Sidebar() {
  const pathname = usePathname();
  const isCollapsed = useSidebarStore((state) => state.isCollapsed);
  const toggle = useSidebarStore((state) => state.toggle);
  const persona = useUserPersona((state) => state.persona);

  // Avoid a hydration mismatch: render the default (expanded) shape on the
  // server and reconcile to the persisted value only after mount.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const collapsed = mounted && isCollapsed;

  return (
    <aside
      className={cn(
        "flex h-dvh shrink-0 flex-col bg-surface-raised transition-[width] duration-200 ease-out motion-reduce:transition-none",
        collapsed ? COLLAPSED_WIDTH : EXPANDED_WIDTH,
      )}
    >
      <div
        className={cn(
          "flex h-14 shrink-0 items-center px-4",
          collapsed && "justify-center px-0",
        )}
      >
        {!collapsed ? (
          <>
            <span aria-hidden className="size-10 shrink-0" />
            <NextLink
              href="/"
              className="min-w-0 flex-1 truncate text-center font-semibold text-fg-primary"
            >
              AiLMS
            </NextLink>
          </>
        ) : null}

        <Button
          variant="ghost"
          size="md"
          iconOnly
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          icon={collapsed ? <PanelLeftOpen /> : <PanelLeftClose />}
          onClick={toggle}
          className={collapsed ? "" : "shrink-0"}
        />
      </div>

      <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-3 py-2">
        {NAV_ITEMS.map((item) => {
          if (item.directorOnly && persona !== "director") return null;

          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <NextLink
              key={item.href}
              href={item.href}
              aria-current={isActive ? "page" : undefined}
              title={collapsed ? item.label : undefined}
              className={cn(
                "flex h-10 items-center gap-3 rounded-md px-3 text-label-l transition-colors",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-1",
                collapsed && "justify-center px-0",
                isActive
                  ? "bg-nav-active text-fg-on-primary"
                  : "text-fg-secondary hover:bg-option-hover hover:text-fg-primary",
              )}
            >
              <Icon className="size-4 shrink-0" aria-hidden />
              {!collapsed && <span className="truncate">{item.label}</span>}
            </NextLink>
          );
        })}
      </nav>

      <div
        className={cn("flex flex-col gap-1 p-3", collapsed && "items-center")}
      >
        <NextLink
          href="/settings"
          title={collapsed ? "Settings" : undefined}
          className={cn(
            "flex h-10 items-center gap-3 rounded-md px-3 text-label-l text-fg-secondary transition-colors hover:bg-option-hover hover:text-fg-primary",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-1",
            collapsed && "w-10 justify-center px-0",
          )}
        >
          <Settings className="size-4 shrink-0" aria-hidden />
          {!collapsed && <span className="truncate">Settings</span>}
        </NextLink>

        <div
          className={cn(
            "flex h-10 items-center gap-3 rounded-md px-3",
            collapsed && "px-0",
          )}
          title={collapsed ? MOCK_USER_NAME : undefined}
        >
          <Avatar name={MOCK_USER_NAME} size="md" />
          {!collapsed && (
            <span className="truncate text-label-l text-fg-primary">
              {MOCK_USER_NAME}
            </span>
          )}
        </div>
      </div>
    </aside>
  );
}
