import type { CSSProperties } from "react";

/** Per-dot pulse offset, in ms, so the three dots read as a typing wave. */
const DOT_DELAYS_MS = [0, 200, 400];

/**
 * "Kase is thinking" indicator — left-anchored dots shown between a user send
 * and the scripted reply. `role="status"` plus an sr-only sentence expose the
 * state to assistive tech without motion.
 *
 * Motion (animator gate, loading/indeterminate loop): a low-amplitude opacity
 * pulse (`motion-safe:animate-pulse`) with each dot offset via inline
 * `animationDelay` so the wave is legible without being frantic. Opacity-only,
 * so it is compositor-friendly and not a vestibular trigger. Under reduced
 * motion the dots render static and the sr-only text still announces the state.
 */
export function ThinkingIndicator() {
  return (
    <div className="mr-auto flex items-center gap-1.5 px-1 py-2" role="status">
      <span className="sr-only">Kase is thinking</span>
      {DOT_DELAYS_MS.map((delay, index) => (
        <span
          key={index}
          aria-hidden="true"
          className="size-1.5 rounded-full bg-ai-emphasis opacity-60 motion-safe:animate-pulse"
          style={{ animationDelay: `${delay}ms` } as CSSProperties}
        />
      ))}
    </div>
  );
}
