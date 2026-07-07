"use client";

import { createContext, useContext, useEffect, useLayoutEffect, useRef, useState } from "react";
import type { CSSProperties, ReactNode } from "react";
import { usePathname } from "next/navigation";
import { Sidebar } from "@/components/shared/sidebar";
import { cn } from "@/lib/utils";
import { AiAvatar } from "@/components/shared/ai-avatar";
import { CopilotPanel } from "@/components/shared/copilot-panel";
import { getCopilotPage } from "@/components/shared/copilot/copilot-script";

/** Resting avatar footprint, in px — the shell-corner size the canvas renders at. */
const AVATAR_RESTING_SIZE = 96;

/**
 * Reads whether the Copilot panel is currently open. The open-state itself
 * lives locally in AppShell (see `copilotOpen` below); this context simply
 * exposes it to `children` descendants that must react to the copilot being
 * docked open — e.g. the workspace detail view reflows its AI summary card
 * when the panel narrows its column. This is NOT a global store: it is the
 * shell's own local state, surfaced to its own subtree via React context.
 * Defaults to `false` for any consumer rendered outside the shell.
 */
const CopilotOpenContext = createContext(false);

/** Read whether the docked Copilot panel is open (false outside the shell). */
export function useCopilotOpen(): boolean {
  return useContext(CopilotOpenContext);
}
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
 * The shell and Sidebar share the darker chrome surface (`bg-surface-shell`,
 * one continuous frame); the page canvas is a lighter rounded surface
 * (`bg-surface`) inset within it, and elevated components (cards, panels on
 * `bg-surface-raised`, the lightest step) read up from that canvas. Depth runs
 * darkest chrome → lighter canvas → lightest elevated.
 *
 * The top bar gains a shadow once the content region scrolls past its top,
 * for elevation via shadow rather than an additional darker fill.
 */
export function AppShell({
  children,
  topBarStart,
  topBarEnd,
  hideTopBar = false,
  className,
}: AppShellProps) {
  const [scrolled, setScrolled] = useState(false);
  // Copilot conversation panel open/close. Also the single source of truth for
  // the avatar's pose: the avatar is dormant when the panel is closed and
  // active while it is open (controlled mode — clicking the avatar toggles this
  // state rather than the avatar's own internal pose).
  const [copilotOpen, setCopilotOpen] = useState(false);
  // Whether the copilot conversation has started (≥1 message sent). Lifted here
  // — rather than kept local to CopilotPanel — because BOTH the panel (to swap
  // its empty state) and this shell (to choose the avatar's anchor) must read
  // it. It is a minimal placeholder flag: there is no message backend yet, so
  // this only records that the send action has fired at least once.
  const [conversationStarted, setConversationStarted] = useState(false);

  // Kase is context-aware: the panel plays the script for the current route, so
  // its content is tied to the dataset on screen. Deriving the page from the
  // pathname here keeps a single source of truth that both the panel (script
  // selection) and this shell (conversation reset) read.
  const pathname = usePathname();
  const copilotPage = getCopilotPage(pathname);

  // On navigation, return the conversation to its empty state so the new page's
  // script starts fresh. The panel's own hook resets its transcript on the same
  // page change; resetting the shell flag in lockstep keeps the empty state and
  // the avatar's center anchor consistent with it.
  useEffect(() => {
    setConversationStarted(false);
  }, [copilotPage]);

  // Single persistent avatar, absolutely positioned over the shell. Rather than
  // swapping between mounted avatars (which would kill the pose morph and risk
  // multiple WebGL contexts), ONE avatar canvas stays mounted and TRANSLATES
  // between THREE anchors, morphing dormant↔active as it moves:
  //   1. panel closed              → resting corner (transform: none)
  //   2. panel open, not started   → the conversation body's CENTER slot
  //                                   (Kase as the empty-state centerpiece)
  //   3. panel open, started       → the footer composer's avatar slot
  // Both open-state anchors are empty reserved boxes exposed by CopilotPanel
  // via refs; the shell measures whichever one is active and sets the transform
  // that moves the avatar's center onto it. `avatarTransform` is that measured
  // transform; the wrapper transitions `transform` between them.
  const avatarSlotRef = useRef<HTMLDivElement>(null);
  const avatarCenterSlotRef = useRef<HTMLDivElement>(null);
  const avatarWrapRef = useRef<HTMLDivElement>(null);
  const copilotAsideRef = useRef<HTMLElement>(null);
  const [avatarTransform, setAvatarTransform] = useState<string>("none");

  // Measure the resting box and the ACTIVE slot (center before the first
  // message, footer after), then set the transform that moves the avatar's
  // center onto the slot's center (plus a scale to the slot's footprint). Runs
  // on open/close, on the conversation-started flip, and on resize while open so
  // the avatar tracks the slot if layout shifts. useLayoutEffect so the
  // transform is set before paint (no one-frame flash at the wrong spot).
  useLayoutEffect(() => {
    if (!copilotOpen) {
      setAvatarTransform("none");
      return;
    }

    function alignToSlot() {
      const wrap = avatarWrapRef.current;
      // The active anchor: footer slot once the conversation has started,
      // otherwise the empty-state center slot.
      const slot = conversationStarted
        ? avatarSlotRef.current
        : avatarCenterSlotRef.current;
      const aside = copilotAsideRef.current;
      if (!wrap || !slot) return;
      // Measure against FINAL, settled geometry, with all relevant transitions
      // suppressed for the read:
      //  - the avatar wrapper is snapped to its untransformed resting box (so a
      //    transform already applied — initial open, or a resize mid-flight —
      //    can't skew the origin), and
      //  - the panel aside is snapped to its open width, so the slot is read at
      //    the position it ENDS at, not its current mid-animation (clipped,
      //    off-screen-right) position. Without this the avatar would aim at
      //    wherever the still-opening panel happens to be at t=0.
      // All originals are restored immediately, before paint, so nothing jumps.
      const prevTransform = wrap.style.transform;
      const prevTransition = wrap.style.transition;
      const prevAsideTransition = aside?.style.transition ?? "";
      wrap.style.transition = "none";
      wrap.style.transform = "none";
      if (aside) aside.style.transition = "none";
      const restRect = wrap.getBoundingClientRect();
      const slotRect = slot.getBoundingClientRect();
      wrap.style.transform = prevTransform;
      wrap.style.transition = prevTransition;
      if (aside) aside.style.transition = prevAsideTransition;

      const scale = slotRect.width / AVATAR_RESTING_SIZE;
      const dx =
        slotRect.left + slotRect.width / 2 - (restRect.left + restRect.width / 2);
      const dy =
        slotRect.top + slotRect.height / 2 - (restRect.top + restRect.height / 2);
      setAvatarTransform(`translate(${dx}px, ${dy}px) scale(${scale})`);
    }

    alignToSlot();
    window.addEventListener("resize", alignToSlot);
    return () => window.removeEventListener("resize", alignToSlot);
    // `conversationStarted` is a dependency so the avatar re-measures and
    // re-anchors (center slot → footer slot) the moment the first message is
    // sent; the wrapper's `transition-transform` animates that reposition.
  }, [copilotOpen, conversationStarted]);

  return (
    <div className="flex h-dvh overflow-hidden bg-surface-shell relative">
      {/* Global, layout-level AI avatar — mounted once here (not per-route) so a
          single persistent instance is present across every page and can later
          be extended into a persistent chatbot. Do NOT also mount it in a route
          (e.g. page.tsx): two <Canvas> instances = two stacked WebGL contexts,
          which accelerates context-pool exhaustion and was a driver of the
          "THREE.WebGLRenderer: Context Lost" crash. The avatar owns its own
          context-loss recovery (see ai-avatar.tsx).

          Clicking it opens the Copilot panel. It is ALWAYS mounted (one canvas,
          never remounted) and instead TRANSLATES between three anchors as the
          conversation state changes, morphing dormant → active en route:
          resting corner (closed) → panel-body CENTER slot (open, no message
          yet — Kase is the empty-state centerpiece) → footer avatar slot (once
          a message is sent), then back to the resting corner on close. Keeping
          the same canvas alive across every move is what makes the morph
          continuous AND satisfies the one-WebGL-context rule. The transform
          lives on this wrapper (a compositor-friendly `transform` transition);
          pointer events are disabled while open so the panel's own close button
          owns dismissal. */}
      <div
        ref={avatarWrapRef}
        className={cn(
          "absolute bottom-0 right-0 z-50 origin-center transition-transform duration-[240ms] motion-reduce:transition-none",
          copilotOpen
            ? "pointer-events-none ease-[cubic-bezier(0,0,0.2,1)]"
            : "ease-[cubic-bezier(0.4,0,1,1)]",
        )}
        style={{ transform: avatarTransform } as CSSProperties}
      >
        <AiAvatar
          size={AVATAR_RESTING_SIZE}
          state={copilotOpen ? "active" : "dormant"}
          onClick={() => setCopilotOpen(true)}
        />
      </div>
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col w-full min-h-0">
        {/* {!hideTopBar ? (
          <header
            className={cn(
              "flex h-14 shrink-0 items-center justify-between gap-4 border-b border-border-subtle bg-surface-shell px-6 transition-shadow",
              scrolled && "shadow-sm",
            )}
          >
            <div className="flex min-w-0 items-center gap-3">{topBarStart}</div>
            <div className="flex shrink-0 items-center gap-2">{topBarEnd}</div>
          </header>
        ) : null} */}
        <main
          className="min-w-0 flex-1 overflow-y-auto pr-4 py-4 w-full min-h-0 h-full"
          onScroll={(e: React.UIEvent<HTMLDivElement>) =>
            setScrolled(e.currentTarget.scrollTop > 0)
          }
        >
          <div
            className={cn(
              "min-h-full rounded-2xl bg-surface p-6 w-full h-full",
              className,
            )}
          >
            <CopilotOpenContext.Provider value={copilotOpen}>
              {children}
            </CopilotOpenContext.Provider>
          </div>
        </main>
      </div>
      {/* Copilot conversation panel — a docked flex sibling of the main
          content column, not an overlay. Its width animates between 0 and its
          open width, so opening it shrinks and reflows the content column
          leftward (side-by-side split) rather than covering it. */}
      <CopilotPanel
        page={copilotPage}
        open={copilotOpen}
        onClose={() => setCopilotOpen(false)}
        conversationStarted={conversationStarted}
        onConversationStart={() => setConversationStarted(true)}
        avatarSlotRef={avatarSlotRef}
        centerSlotRef={avatarCenterSlotRef}
        asideRef={copilotAsideRef}
      />
    </div>
  );
}
