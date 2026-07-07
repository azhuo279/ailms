"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ChatTurn } from "./types";
import { getCopilotScript, newId } from "./copilot-script";
import type { CopilotPage } from "./copilot-script";

/** Delay before a scripted reply appears, so the thinking indicator is legible. */
const THINKING_MS = 500;

export interface UseCopilotChatOptions {
  /**
   * The route Kase is opened on. Selects the page-specific script so what plays
   * in the panel is tied to the dataset on screen. Changing it (a navigation)
   * resets the transcript back to that page's empty state.
   */
  page: CopilotPage;
  /** Fires the first time a message is sent (so the shell can flip its flag). */
  onConversationStart: () => void;
}

export interface UseCopilotChat {
  turns: ChatTurn[];
  isThinking: boolean;
  input: string;
  setInput: (value: string) => void;
  /**
   * The suggested prompts for the current step — the natural next asks. Empty
   * once the scripted exchange is exhausted. Tapping one calls `send(prompt)`.
   */
  suggestions: string[];
  /** Selection state keyed by a choices block's id. */
  selections: Record<string, string | string[]>;
  setSelection: (blockId: string, value: string | string[]) => void;
  /**
   * Sends a user turn and plays the next scripted reply. Uses the trimmed
   * `input` by default, or `text` when a suggested-prompt chip supplies it — a
   * chip tap and a typed send take the exact same path.
   */
  send: (text?: string) => void;
  /** Confirms a choices block — appends the follow-up keyed by its id. */
  confirmChoice: (confirmToTurnId: string) => void;
  /** Commits an action block — appends the follow-up keyed by its id. */
  commitAction: (commitToTurnId: string) => void;
}

/**
 * Owns the Copilot transcript, scripted playback, and interaction state. Kept
 * LOCAL to CopilotPanel — the shell's `conversationStarted` flag is deliberately
 * NOT derived from `turns.length` (the avatar re-anchor effect depends on that
 * flag and its timing), so this hook only calls `onConversationStart()` on the
 * first send and never reads the flag back.
 */
export function useCopilotChat({
  page,
  onConversationStart,
}: UseCopilotChatOptions): UseCopilotChat {
  const { steps, followUps } = getCopilotScript(page);

  const [turns, setTurns] = useState<ChatTurn[]>([]);
  const [scriptIndex, setScriptIndex] = useState(0);
  const [isThinking, setIsThinking] = useState(false);
  const [input, setInput] = useState("");
  const [selections, setSelections] = useState<
    Record<string, string | string[]>
  >({});
  const startedRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Clear any pending reply timer on unmount so a scripted append never lands
  // after the panel is gone.
  useEffect(
    () => () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    },
    [],
  );

  // Reset the transcript when the page changes (the panel is mounted once and
  // persists across routes). Navigating to a new page swaps in that page's
  // script and returns Kase to its empty state, so the conversation always
  // matches the dataset on screen. `startedRef` is cleared too so the next send
  // re-fires `onConversationStart` and the shell re-anchors the avatar. The
  // shell independently resets its `conversationStarted` flag on the same
  // navigation, so the empty state renders in lockstep.
  useEffect(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    startedRef.current = false;
    setTurns([]);
    setScriptIndex(0);
    setIsThinking(false);
    setInput("");
    setSelections({});
  }, [page]);

  /** Show the thinking indicator, then append `turn` after THINKING_MS. */
  const replyWith = useCallback((turn: ChatTurn) => {
    setIsThinking(true);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setTurns((prev) => [...prev, turn]);
      setIsThinking(false);
      timerRef.current = null;
    }, THINKING_MS);
  }, []);

  const send = useCallback(
    (text?: string) => {
      // A suggested-prompt chip passes its label; a typed send uses the input.
      const message = (text ?? input).trim();
      if (message.length === 0) return;

      const userTurn: ChatTurn = {
        id: newId(),
        role: "user",
        blocks: [{ kind: "text", content: message }],
      };
      setTurns((prev) => [...prev, userTurn]);
      setInput("");

      if (!startedRef.current) {
        startedRef.current = true;
        onConversationStart();
      }

      // Advance one step through the scripted exchange, guarding past the end.
      // Each send plays exactly ONE focused reply so the thread reads as a real
      // back-and-forth rather than a single dumped turn.
      setScriptIndex((index) => {
        const step = steps[index];
        if (step) {
          replyWith({ ...step.reply, id: newId() });
          return index + 1;
        }
        return index;
      });
    },
    [input, onConversationStart, replyWith, steps],
  );

  const setSelection = useCallback(
    (blockId: string, value: string | string[]) => {
      setSelections((prev) => ({ ...prev, [blockId]: value }));
    },
    [],
  );

  const appendFollowUp = useCallback(
    (key: string) => {
      const followUp = followUps[key];
      if (!followUp) return;
      replyWith({ ...followUp, id: newId() });
    },
    [replyWith, followUps],
  );

  const confirmChoice = useCallback(
    (confirmToTurnId: string) => appendFollowUp(confirmToTurnId),
    [appendFollowUp],
  );
  const commitAction = useCallback(
    (commitToTurnId: string) => appendFollowUp(commitToTurnId),
    [appendFollowUp],
  );

  // Suggestions for the CURRENT step — the natural next asks. Suppressed while a
  // reply is streaming in (isThinking) so a chip can't advance the script before
  // the pending reply has even landed; they reappear the moment it does. Empty
  // once the scripted exchange is exhausted.
  const suggestions =
    isThinking ? [] : (steps[scriptIndex]?.suggestions ?? []);

  return {
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
  };
}

/**
 * Tracks `prefers-reduced-motion: reduce`. The block reveal and thinking dots use
 * CSS `motion-safe:` variants (the codebase convention), but auto-scroll goes
 * through the JS `scrollIntoView` API and so needs this boolean to pick
 * `behavior: "auto"` vs `"smooth"`.
 */
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(query.matches);
    const handler = (event: MediaQueryListEvent) => setReduced(event.matches);
    query.addEventListener("change", handler);
    return () => query.removeEventListener("change", handler);
  }, []);

  return reduced;
}
