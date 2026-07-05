/**
 * A single transient toast shown just above the toolbar. One message at a time:
 * a new `show()` replaces whatever is on screen and restarts the timer. Auto-
 * dismisses after a short delay with a fade-out. Pointer-events stay off so it
 * never blocks the UI underneath.
 */
export type ToastVariant = "success" | "error";

const DEFAULT_DURATION_MS = 2400;
const FADE_MS = 180;

export class Toast {
  readonly el: HTMLDivElement;
  private hideTimer: number | null = null;
  private removeTimer: number | null = null;

  constructor() {
    this.el = document.createElement("div");
    this.el.className = "pp-toast-host";
    // Announce changes to assistive tech without stealing focus.
    this.el.setAttribute("aria-live", "polite");
    this.el.setAttribute("role", "status");
  }

  show(
    message: string,
    variant: ToastVariant = "success",
    duration = DEFAULT_DURATION_MS,
  ): void {
    this.clearTimers();

    const toast = document.createElement("div");
    toast.className = `pp-toast pp-toast-${variant}`;
    toast.textContent = message;

    // Replace any in-flight toast immediately.
    this.el.replaceChildren(toast);

    // Next frame: add the visible class so the enter transition runs.
    requestAnimationFrame(() => toast.classList.add("pp-toast-in"));

    this.hideTimer = window.setTimeout(() => {
      toast.classList.remove("pp-toast-in");
      this.removeTimer = window.setTimeout(() => {
        if (toast.parentNode === this.el) this.el.replaceChildren();
      }, FADE_MS);
    }, duration);
  }

  private clearTimers(): void {
    if (this.hideTimer != null) window.clearTimeout(this.hideTimer);
    if (this.removeTimer != null) window.clearTimeout(this.removeTimer);
    this.hideTimer = null;
    this.removeTimer = null;
  }

  destroy(): void {
    this.clearTimers();
    this.el.replaceChildren();
  }
}
