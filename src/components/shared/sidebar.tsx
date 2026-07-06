"use client";

import { Fragment, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import NextLink from "next/link";
import {
  LayoutGrid,
  BarChart3,
  ScrollText,
  Settings,
  MoreVertical,
  LogOut,
  ShieldCheck,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useSidebarStore } from "@/hooks/shared/use-sidebar-store";
import { useUserPersona } from "@/hooks/shared/use-user-persona";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { Menu, MenuItem, MenuSeparator } from "@/components/ui/menu";

/** Mock signed-in user — swap for real session data once auth lands. */
const MOCK_USER_NAME = "Jordan Lee";

/**
 * Finding #9 — nav is grouped into labeled sections for a clearer hierarchy
 * (day-to-day triage vs. oversight/analytics) instead of one flat list.
 */
const NAV_SECTIONS = [
  {
    label: "Operations",
    items: [
      {
        href: "/workspace",
        label: "Workspace",
        icon: LayoutGrid,
        directorOnly: false,
      },
      {
        href: "/audit-log",
        label: "Audit Log",
        icon: ScrollText,
        directorOnly: false,
      },
    ],
  },
  {
    label: "Insights",
    items: [
      // Adoption Tracker folded into /performance as its director-only "AI
      // Adoption" tab, so a single Performance entry now covers both surfaces.
      {
        href: "/performance",
        label: "Performance",
        icon: BarChart3,
        directorOnly: false,
      },
    ],
  },
] as const;

const EXPANDED_WIDTH = "w-64";
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
  const router = useRouter();
  const isCollapsed = useSidebarStore((state) => state.isCollapsed);
  const toggle = useSidebarStore((state) => state.toggle);
  const persona = useUserPersona((state) => state.persona);
  const setPersona = useUserPersona((state) => state.setPersona);
  const isDirector = persona === "director";

  // Avoid a hydration mismatch: render the default (expanded) shape on the
  // server and reconcile to the persisted value only after mount.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const collapsed = mounted && isCollapsed;

  return (
    <aside
      className={cn(
        "flex h-dvh pt-3 shrink-0 flex-col transition-[width] duration-200 ease-out motion-reduce:transition-none",
        collapsed ? COLLAPSED_WIDTH : EXPANDED_WIDTH,
      )}
    >
      <div
        className={cn(
          "flex flex-row h-14 shrink-0 items-center gap-2 px-3",
          collapsed && "justify-center px-0",
        )}
      >
        {!collapsed ? (
          <NextLink
            href="/"
            className="flex min-w-0 flex-1 items-center gap-2 rounded-md px-2 py-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
          >
            <span
              aria-hidden
              className="flex size-8 shrink-0 items-center justify-center rounded-md bg-nav-active text-label-l font-bold text-fg-on-primary"
            >
              A
            </span>
            <span className="min-w-0 truncate text-title font-bold tracking-tight text-fg-primary">
              AiLMS
            </span>
          </NextLink>
        ) : null}

        <Button
          variant="ghost"
          size="sm"
          iconOnly
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          icon={collapsed ? <PanelLeftOpen /> : <PanelLeftClose />}
          onClick={toggle}
          className="shrink-0"
        />
      </div>

      <nav
        className={cn(
          "flex flex-1 flex-col overflow-y-auto px-4 py-6",
          // Expanded keeps generous section spacing; collapsed uses a tighter,
          // uniform gap since dividers (not labels) separate the icon groups.
          collapsed ? "gap-1" : "gap-8",
        )}
      >
        {(() => {
          // A single decorative NextLink for one nav item, shared by both
          // layouts so the item chrome stays identical.
          const renderItem = (item: (typeof NAV_SECTIONS)[number]["items"][number]) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;

            return (
              <NextLink
                key={item.href}
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                title={collapsed ? item.label : undefined}
                className={cn(
                  "group relative flex h-10 items-center gap-3 rounded-md px-3 text-label-l font-medium transition-colors",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-1",
                  collapsed && "justify-center px-0",
                  isActive
                    ? "bg-nav-active text-fg-on-primary shadow-sm"
                    : "text-fg-secondary hover:bg-option-hover hover:text-fg-primary",
                )}
              >
                {/* Active accent rail (finding #9) — a clear "you are here"
                    marker beyond the fill alone. */}
                {isActive && !collapsed ? (
                  <span
                    aria-hidden
                    className="absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full bg-fg-on-primary/80"
                  />
                ) : null}
                <Icon
                  className={cn(
                    "size-5 shrink-0 transition-transform",
                    !isActive && "group-hover:scale-105",
                  )}
                  aria-hidden
                />
                {!collapsed && <span className="truncate">{item.label}</span>}
              </NextLink>
            );
          };

          // Collapsed: flat list of icon items, each in its own visual group,
          // separated by a full-width divider (spanning the nav's inner width,
          // respecting its px-4 padding). A divider sits before every item
          // except the first, giving two dividers across three items.
          if (collapsed) {
            const flatItems = NAV_SECTIONS.flatMap((section) =>
              section.items.filter(
                (item) => !item.directorOnly || persona === "director",
              ),
            );

            return flatItems.map((item, index) => (
              <Fragment key={item.href}>
                {index > 0 ? (
                  <span aria-hidden className="h-px w-full bg-border-subtle" />
                ) : null}
                {renderItem(item)}
              </Fragment>
            ));
          }

          // Expanded: unchanged section-labeled grouping.
          return NAV_SECTIONS.map((section) => {
            const visibleItems = section.items.filter(
              (item) => !item.directorOnly || persona === "director",
            );
            if (visibleItems.length === 0) return null;

            return (
              <div key={section.label} className="flex flex-col gap-1">
                <p className="px-3 pb-1 text-label-s font-semibold uppercase tracking-wide text-fg-muted">
                  {section.label}
                </p>
                {visibleItems.map(renderItem)}
              </div>
            );
          });
        })()}
      </nav>

      <div
        className={cn(
          "mt-auto flex flex-col gap-1 p-3",
          collapsed && "items-center",
        )}
      >
        <div
          className={cn(
            "flex h-12 items-center gap-2 rounded-md pl-3",
            collapsed && "h-10 flex-col gap-1 px-0",
          )}
          title={collapsed ? MOCK_USER_NAME : undefined}
        >
          <Avatar name={MOCK_USER_NAME} size="md" />
          {!collapsed && (
            <div className="flex min-w-0 flex-1 flex-col">
              <span className="truncate text-label-l font-medium text-fg-primary">
                {MOCK_USER_NAME}
              </span>
              <span className="truncate text-caption text-fg-muted">
                {isDirector ? "Director" : "Zone Ops Manager"}
              </span>
            </div>
          )}

          {/* Overflow menu — houses Settings (moved out of the main nav) and
              other account actions. Portals to document.body via the shared
              Menu component so it escapes the sidebar's stacking context. */}
          {!collapsed ? (
            <Menu
              align="end"
              trigger={
                <Button
                  variant="ghost"
                  size="sm"
                  iconOnly
                  aria-label="Account options"
                  icon={<MoreVertical />}
                  className="shrink-0"
                />
              }
            >
              {/* Persona toggle — switches to the Director-level user (admin
                  privileges), surfacing the director-only Performance "AI
                  Adoption" tab and any directorOnly nav. Moved here from the
                  Performance page per Starling feedback. `checked` shows a
                  trailing mark while acting as the director. */}
              <MenuItem
                icon={<ShieldCheck />}
                checked={isDirector}
                onSelect={() => setPersona(isDirector ? "zom" : "director")}
              >
                {isDirector ? "Acting as Director" : "Switch to Director"}
              </MenuItem>
              <MenuSeparator />
              <MenuItem
                icon={<Settings />}
                onSelect={() => router.push("/settings")}
              >
                Settings
              </MenuItem>
              <MenuSeparator />
              <MenuItem
                icon={<LogOut />}
                onSelect={() => router.push("/sign-out")}
              >
                Sign out
              </MenuItem>
            </Menu>
          ) : null}
        </div>
      </div>
    </aside>
  );
}
