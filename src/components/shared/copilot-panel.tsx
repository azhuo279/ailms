"use client";

import { useRef } from "react";
import type { Ref } from "react";
import { ArrowUp, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TextField } from "@/components/ui/text-field";
import { cn } from "@/lib/utils";
import { useCopilotChat } from "@/components/shared/copilot/use-copilot-chat";
import { ChatThread } from "@/components/shared/copilot/chat-thread";
import { SuggestedPrompts } from "@/components/shared/copilot/suggested-prompts";
import type { RenderBlockContext } from "@/components/shared/copilot/render-block";

export interface CopilotPanelProps {
  /** Whether the panel is open. Drives the enter/exit and the docked width. */
  open: boolean;
  /** Fires when the header close button is pressed. */
  onClose: () => void;
  /**
   * Whether the conversation has started — i.e. at least one message has been
   * sent. Lifted to the shell so BOTH this panel (which swaps its empty state)
   * and the shell (which chooses the avatar's anchor slot) read one source of
   * truth. When `false` the body shows the avatar-centered empty state and the
   * shell anchors the avatar to the CENTER slot; when `true` the body shows the
   * conversation and the shell anchors the avatar down to the footer slot.
   */
  conversationStarted: boolean;
  /**
   * Fires the first time a message is sent, so the shell can flip
   * `conversationStarted` (and re-anchor the avatar from center → footer).
   */
  onConversationStart: () => void;
  /**
   * Ref to the footer's avatar slot — an empty reserved box the shell's single
   * persistent AI avatar TRANSLATES onto (it is not a mounted avatar here). The
   * shell measures this box to drive the avatar's active anchor, so the footer
   * still reads [avatar] [field] [send] while keeping exactly one avatar canvas
   * alive across the whole app (see AppShell). This is the active anchor once
   * the conversation has started.
   */
  avatarSlotRef?: Ref<HTMLDivElement>;
  /**
   * Ref to the conversation body's CENTER avatar slot — the second empty
   * reserved box (alongside `avatarSlotRef`). While the panel is open but no
   * message has been sent yet, the shell translates the single persistent
   * avatar onto THIS box, making Kase the centerpiece of the empty state above
   * the greeting. It replaces the generic empty-state icon in that state.
   */
  centerSlotRef?: Ref<HTMLDivElement>;
  /**
   * Ref to the panel's root `<aside>` — the shell uses it to read the panel's
   * settled (open-width) geometry while measuring the avatar's active anchor.
   */
  asideRef?: Ref<HTMLElement>;
  className?: string;
}

/**
 * Copilot conversation panel — a right-docked region of the App Shell that
 * opens when the AI avatar is activated. It is NOT an overlay: it lives in the
 * shell's flex row alongside the main content, so opening it reflows the main
 * canvas leftward rather than covering it.
 *
 * Surface: the frosted-glass AI card treatment (`.ai-card` — the project's
 * canonical frosted material, a semi-transparent `--color-ai-card` fill plus a
 * `backdrop-filter: blur(8px)` and an ai-card-border hairline). Because that
 * fill is deliberately translucent, the shell surface behind it shows through
 * blurred, so the panel reads as a frosted glass card layered over the shell
 * rather than an opaque slab. The docked shape squares off the card's default
 * `rounded-xl` (`rounded-none`) so it sits flush against the shell edge.
 *
 * Layout: a header (title + iconOnly close), an empty conversation body, and a
 * footer composer whose row is [avatar slot] [text field] [iconOnly primary
 * send]. The avatar itself is NOT mounted here — the footer reserves an empty
 * slot (`avatarSlotRef`) that the shell's single persistent AI avatar
 * translates onto, so the agent's presence lands at the point of input while
 * only one avatar canvas ever exists.
 *
 * Input: the composer's TextField takes an AI-glass surface override
 * (`inputContainerClassName`) — a translucent `ai-card` fill + `ai-card-border`
 * + `backdrop-blur` — so it reads as part of the frosted panel rather than the
 * default opaque `bg-surface-raised` box, with ai-tinted hover/focus borders
 * kept legible against the glass.
 *
 * Motion (contextual transition, ~240ms in / ~200ms out): the panel's docked
 * width animates open/closed so the main content reflows smoothly rather than
 * jump-cutting. The whole element is `aria-hidden` and non-interactive while
 * closed. Under `prefers-reduced-motion` the width change is instant
 * (`motion-reduce:transition-none`) — the split still happens, it just does
 * not animate.
 */
export function CopilotPanel({
  open,
  onClose,
  conversationStarted,
  onConversationStart,
  avatarSlotRef,
  centerSlotRef,
  asideRef,
  className,
}: CopilotPanelProps) {
  // Transcript + scripted playback + interaction state live in this hook, LOCAL
  // to the panel. It calls `onConversationStart()` on the first send; the shell's
  // `conversationStarted` flag stays the single source of truth for the avatar
  // re-anchor and is deliberately NOT derived from the transcript length.
  const {
    turns,
    isThinking,
    input,
    setInput,
    suggestions,
    selections,
    setSelection,
    send,
    confirmChoice,
    commitAction,
  } = useCopilotChat({ onConversationStart });

  // Composer input, so we can return focus here after a choice/action commits
  // (rather than stealing focus mid-typing — see the a11y note in the plan).
  const composerRef = useRef<HTMLInputElement>(null);
  const focusComposer = () =>
    requestAnimationFrame(() => composerRef.current?.focus());

  const blockCtx: RenderBlockContext = {
    selections,
    setSelection,
    confirmChoice: (id) => {
      confirmChoice(id);
      focusComposer();
    },
    commitAction: (id) => {
      commitAction(id);
      focusComposer();
    },
  };

  return (
    <aside
      ref={asideRef}
      aria-hidden={!open}
      aria-label="Kase the Logistics Copilot"
      className={cn(
        // Docked flex sibling of <main>: width animates between 0 and the
        // panel width so main reflows. overflow-hidden clips the inner
        // fixed-width content as the region collapses.
        "flex max-h-full my-4 mr-4 shrink-0 flex-col overflow-hidden transition-[width] duration-[240ms] ease-[cubic-bezier(0,0,0.2,1)] motion-reduce:transition-none",
        open ? "w-96" : "w-0",
        className,
      )}
    >
      {/* Inner fixed-width frosted-glass card. `ai-card` supplies the
          semi-transparent fill + backdrop-blur + ai-border hairline; the docked
          overrides square off its default radius so it sits flush. */}
      <div className="ai-card flex h-full w-96 flex-col rounded-none">
        {/* Header — title left, iconOnly close right. */}
        <header className="flex shrink-0 items-center justify-between gap-3 px-4 py-3">
          <h2 className="text-heading-m font-semibold text-ai-fg">Kase</h2>
          <Button
            iconOnly
            variant="ghost"
            size="sm"
            icon={<X />}
            aria-label="Close Copilot"
            onClick={onClose}
          />
        </header>

        {/* Conversation body. Before the first message is sent it is an
            avatar-centered empty state: the shell's single persistent avatar
            translates onto the CENTER SLOT below (replacing the generic chat
            icon) and reads as the centerpiece above the greeting. Once a
            message is sent, the shell re-anchors that same avatar down to the
            footer slot and this body shows the (placeholder) conversation. */}
        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-4">
          {conversationStarted ? (
            // Live conversation transcript — a scripted playback thread. Grows
            // top-aligned and scrolls, with each new turn auto-scrolled into
            // view (ChatThread owns the scroll + aria-live behavior).
            <ChatThread turns={turns} isThinking={isThinking} ctx={blockCtx} />
          ) : (
            // Empty state stays vertically centered via `m-auto` inside the now
            // flex-col scroll column. The centerSlotRef box below MUST stay
            // mounted at size-20 so the shell's avatar re-anchor keeps measuring
            // it (the one-canvas avatar translates onto it).
            <div className="m-auto flex flex-col items-center px-6 py-12 text-center motion-safe:animate-[empty-state-fade-in_200ms_ease-out]">
              {/* Center AVATAR SLOT — an empty reserved box, not a mounted
                  avatar, mirroring the footer slot pattern. The shell's single
                  persistent AiAvatar translates onto this box while the panel
                  is open and empty, so Kase itself is the empty-state glyph.
                  Sized on the spacing scale (size-20), matching the footer
                  slot so the avatar keeps a consistent active footprint as it
                  translates between the two anchors — no inline px. */}
              <div
                ref={centerSlotRef}
                className="size-20 shrink-0"
                aria-hidden
              />
              <p className="text-heading-m font-medium text-ai-fg">
                How may I help you today?
              </p>
            </div>
          )}
        </div>

        {/* Footer — a suggested-prompts chip row pinned ABOVE the composer, then
            the composer row [avatar] [text field] [iconOnly primary send]. The
            chips send on the same path as typing and drive the scripted
            turn-by-turn exchange (Starling items 1 + 5). The avatar rides in its
            `active` pose in the composer row while the panel is open. */}
        <footer className="relative flex shrink-0 flex-col p-2 pt-0">
          {/* Suggested-prompt chips — change per step to the natural next ask;
              suppressed while a reply is streaming (the hook empties them) and
              once the scripted exchange is exhausted. */}
          <SuggestedPrompts prompts={suggestions} onSelect={(prompt) => send(prompt)} />

          <div className="relative flex items-center gap-2">
          {/* Avatar SLOT — an empty reserved box, not a mounted avatar. The
              shell's single persistent AiAvatar (one WebGL canvas, never
              remounted) absolutely positions and TRANSLATES itself onto this
              box when the panel opens, morphing dormant → active as it arrives.
              Keeping it a slot (rather than a second mounted <Canvas>) is what
              satisfies the one-canvas rule while still reading [avatar] [field]
              [send]. size-20 matches the center slot's active footprint. */}
          <div
            ref={avatarSlotRef}
            className="size-20 shrink-0 absolute -left-5 -top-3 -translate-y-1/2"
            aria-hidden
          />
          <TextField
            ref={composerRef}
            label="Message Copilot"
            labelClassName="sr-only"
            placeholder="Message Copilot"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
            containerClassName="flex-1"
            inputContainerClassName=" rounded-xl bg-ai-card border-ai-card-border has-[input:hover]:border-ai-border/60 has-[input:focus-visible]:border-ai-border has-[input:focus-visible]:ring-ai-border/40 backdrop-blur-sm"
          />
          <Button
            iconOnly
            variant="primary"
            size="md"
            icon={<ArrowUp />}
            aria-label="Send message"
            disabled={input.trim().length === 0}
            onClick={() => send()}
          />
          </div>
        </footer>
      </div>
    </aside>
  );
}
