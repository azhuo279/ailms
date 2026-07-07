"use client";

import {
  Fragment,
  cloneElement,
  isValidElement,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { ReactElement, ReactNode } from "react";

/**
 * Typewriter reveal for Kase's assistant prose (Starling motion pass). Kase's
 * TEXT blocks type out character-by-character so a reply reads as if the model
 * is composing it live; widgets and the human bubble never type (they are gated
 * by `AiTurn` to appear only AFTER the prose that precedes them settles).
 *
 * Motion (animator gate, "loading / progressive reveal"):
 *   - Cadence: a steady ~45 chars/sec read-along rate (BASE_CPS). This is fast
 *     enough that a short sentence lands in well under a second yet slow enough
 *     to skim as it types. The per-tick rate is derived from elapsed time on a
 *     `requestAnimationFrame` loop (NOT per-character random jitter), so it stays
 *     legible and frame-rate independent.
 *   - Cap: long replies compress to finish by MAX_DURATION_MS so a multi-sentence
 *     answer never drags — the animator's "cap the total time of a staged reveal"
 *     rule. The effective rate is `max(BASE_CPS, total / cap)`.
 *   - No easing curve applies (constant read-along rate is the point, like the
 *     preset table's linear loading class); the caret is steady, not blinking, so
 *     there is zero flash risk (WCAG) and no new keyframe is introduced.
 *   - Reduced motion: under `prefers-reduced-motion: reduce` the full text renders
 *     immediately with no typing and no caret (see `AiTurn`, which passes
 *     `reduced`). No rAF loop is ever scheduled in that path.
 *   - Performance: one rAF loop per actively-typing block, cancelled on
 *     unmount/complete; the walked tree is small prose so per-frame cloning is
 *     cheap; nothing that forces layout is animated.
 *   - a11y: the settled text is rendered once in an `sr-only` layer so the
 *     thread's `aria-live` region announces the final message a single time; the
 *     growing visual reveal is `aria-hidden`, so assistive tech never hears the
 *     keystroke-by-keystroke churn.
 */

/** Read-along cadence floor, in characters per second. */
const BASE_CPS = 45;
/** Cap for the whole reveal so long replies never feel sluggish. */
const MAX_DURATION_MS = 2200;

export interface TypewriterTextProps {
  /** The block's rich content — prose that may contain inline `<strong>`. */
  content: ReactNode;
  /** When true (reduced motion), render the full text at once with no typing. */
  reduced: boolean;
  /**
   * Fired exactly once when the reveal settles (typing finished, or immediately
   * in the non-animated path). `AiTurn` uses it to reveal the next block.
   */
  onDone?: () => void;
  className?: string;
}

export function TypewriterText({
  content,
  reduced,
  onDone,
  className,
}: TypewriterTextProps) {
  // Total revealable characters across the node tree, or null when the tree is
  // too complex to walk safely — in which case we reveal it instantly rather
  // than risk corrupting the markup (requirement 2's fallback).
  const total = useMemo(() => measureNodeChars(content), [content]);
  const walkable = total !== null && total > 0;
  const animate = walkable && !reduced;

  const [revealed, setRevealed] = useState(0);

  // Keep the latest onDone without retriggering the rAF effect when it changes.
  const onDoneRef = useRef(onDone);
  useEffect(() => {
    onDoneRef.current = onDone;
  });

  const firedRef = useRef(false);
  useEffect(() => {
    if (!animate) {
      // Reduced motion, unwalkable, or empty: nothing to type — settle at once.
      if (!firedRef.current) {
        firedRef.current = true;
        onDoneRef.current?.();
      }
      return;
    }

    const totalChars = total as number;
    // Compress long replies so the whole reveal fits inside the duration cap.
    const cps = Math.max(BASE_CPS, totalChars / (MAX_DURATION_MS / 1000));
    const start = performance.now();
    let raf = 0;

    const tick = (now: number) => {
      const elapsed = now - start;
      const next = Math.min(totalChars, Math.floor((elapsed / 1000) * cps));
      setRevealed(next);
      if (next >= totalChars) {
        if (!firedRef.current) {
          firedRef.current = true;
          onDoneRef.current?.();
        }
        return;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => cancelAnimationFrame(raf);
  }, [animate, total]);

  // Non-animated path: render the untouched content once. Assistive tech reads
  // it as a normal live-region addition; no dual layer needed.
  if (!animate) {
    return <div className={className}>{content}</div>;
  }

  const typing = revealed < (total as number);

  return (
    <div className={className}>
      {/* Settled text, announced once by the aria-live thread. */}
      <span className="sr-only">{content}</span>
      {/* Visual reveal, kept out of the accessibility tree so keystrokes are
          never announced one at a time. */}
      <span aria-hidden="true">
        {revealNodes(content, { remaining: revealed })}
        {typing ? <TypewriterCaret /> : null}
      </span>
    </div>
  );
}

/** A steady (non-blinking) caret in the reserved AI ramp — no flash, no keyframe. */
function TypewriterCaret() {
  return (
    <span
      aria-hidden="true"
      className="ml-0.5 inline-block h-3.5 w-0.5 translate-y-0.5 rounded-full bg-ai-emphasis align-baseline"
    />
  );
}

/**
 * Count the revealable characters across a ReactNode tree. Returns `null` when
 * the tree contains a node we cannot safely reveal by slicing — a rendered
 * component element (function/class), whose internals we must not truncate.
 * Strings, numbers, arrays, fragments, and intrinsic (host) elements are safe.
 */
function measureNodeChars(node: ReactNode): number | null {
  if (node === null || node === undefined || typeof node === "boolean") return 0;
  if (typeof node === "string") return node.length;
  if (typeof node === "number") return String(node).length;
  if (Array.isArray(node)) {
    let total = 0;
    for (const child of node) {
      const count = measureNodeChars(child);
      if (count === null) return null;
      total += count;
    }
    return total;
  }
  if (isValidElement(node)) {
    const type = node.type;
    const walkable = typeof type === "string" || type === Fragment;
    if (!walkable) return null;
    const props = node.props as { children?: ReactNode };
    return measureNodeChars(props.children);
  }
  // Unknown node kind — treat as unsafe.
  return null;
}

/**
 * Rebuild the node tree revealing only the first `budget.remaining` characters
 * across its text nodes, preserving all inline markup (a `<strong>` stays bold
 * as its characters appear). `budget` is a mutable cursor drained left-to-right.
 * Only called when `measureNodeChars` confirmed the tree is walkable.
 */
function revealNodes(
  node: ReactNode,
  budget: { remaining: number },
  key?: number,
): ReactNode {
  if (node === null || node === undefined || typeof node === "boolean") {
    return node;
  }
  if (typeof node === "string" || typeof node === "number") {
    const str = String(node);
    if (budget.remaining <= 0) return "";
    const take = Math.min(budget.remaining, str.length);
    budget.remaining -= take;
    return str.slice(0, take);
  }
  if (Array.isArray(node)) {
    return node.map((child, index) => revealNodes(child, budget, index));
  }
  if (isValidElement(node)) {
    const element = node as ReactElement<{ children?: ReactNode }>;
    const revealedChildren = revealNodes(element.props.children, budget);
    return cloneElement(
      element,
      key === undefined ? undefined : { key },
      revealedChildren,
    );
  }
  return node;
}
