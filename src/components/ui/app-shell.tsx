"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import { Sidebar } from "@/components/shared/sidebar";
import { cn } from "@/lib/utils";
import { AiAvatar } from "@/components/shared/ai-avatar";
export interface AppShellProps {
  children: ReactNode;
  /** Rendered at the leading edge of the top bar — page title, breadcrumb, etc. */
  topBarStart?: ReactNode;
  /** Rendered at the trailing edge of the top bar — global search, notifications, user menu. */
  topBarEnd?: ReactNode;
  /** Hides the top bar entirely for routes that render their own header. */
  hideTopBar?: boolean;
  className?: string;
}

/**
 * Canonical App Shell — the reusable product-wide frame containing the
 * persistent left navigation (Sidebar), an optional top bar utility row, and
 * the scrollable content region. Rendered once in the root layout, inside the
 * providers. Keep this thin — page-specific layout belongs in each route's
 * own components.
 *
 * The shell and Sidebar share the raised surface color (one continuous
 * chrome); the page canvas is a distinct rounded surface (`bg-surface`) inset
 * within it, so route content and elevated components (cards, panels, on
 * `bg-surface-raised`) read a step up from the canvas rather than floating
 * directly on the shell.
 *
 * The top bar gains a shadow once the content region scrolls past its top,
 * matching the design system's "elevation via shadow, not darker fill" rule.
 */
export function AppShell({
  children,
  topBarStart,
  topBarEnd,
  hideTopBar = false,
  className,
}: AppShellProps) {
  const [scrolled, setScrolled] = useState(false);

  return (
    <div className="flex h-dvh bg-surface-raised relative">
      {/* Global, layout-level AI avatar — mounted once here (not per-route) so a
          single persistent instance is present across every page and can later
          be extended into a persistent chatbot. Do NOT also mount it in a route
          (e.g. page.tsx): two <Canvas> instances = two stacked WebGL contexts,
          which accelerates context-pool exhaustion and was a driver of the
          "THREE.WebGLRenderer: Context Lost" crash. The avatar owns its own
          context-loss recovery (see ai-avatar.tsx). */}
      <AiAvatar size={96} className="absolute bottom-0 right-0 z-50" />
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col w-full h-full">
        {/* {!hideTopBar ? (
          <header
            className={cn(
              "flex h-14 shrink-0 items-center justify-between gap-4 border-b border-border-subtle bg-surface-raised px-6 transition-shadow",
              scrolled && "shadow-sm",
            )}
          >
            <div className="flex min-w-0 items-center gap-3">{topBarStart}</div>
            <div className="flex shrink-0 items-center gap-2">{topBarEnd}</div>
          </header>
        ) : null} */}
        <main
          className="min-w-0 flex-1 overflow-y-auto pr-2 py-2 w-full h-full"
          onScroll={(e: React.UIEvent<HTMLDivElement>) =>
            setScrolled(e.currentTarget.scrollTop > 0)
          }
        >
          <div
            className={cn(
              "min-h-full rounded-xl bg-surface p-6 w-full h-full",
              className,
            )}
          >
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
