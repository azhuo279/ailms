"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from "react";
import type { ReactNode } from "react";
import { createPortal } from "react-dom";
import { Info, CheckCircle2, AlertTriangle, AlertCircle, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Accordion, AccordionItem } from "./accordion";
import { AvatarGroup } from "./avatar";

export type ToastSeverity = "info" | "success" | "warning" | "error";

const SEVERITY_ICON_CLASSES: Record<ToastSeverity, string> = {
  info: "text-info-fg",
  success: "text-success-fg",
  warning: "text-warning-fg",
  error: "text-danger-fg",
};

const SEVERITY_ICONS: Record<ToastSeverity, ReactNode> = {
  info: <Info className="size-5" aria-hidden="true" />,
  success: <CheckCircle2 className="size-5" aria-hidden="true" />,
  warning: <AlertTriangle className="size-5" aria-hidden="true" />,
  error: <AlertCircle className="size-5" aria-hidden="true" />,
};

/** Smaller icon set reused for the cluster's stacked icon-dots (see `ClusterCard`). */
const SEVERITY_ICONS_SM: Record<ToastSeverity, ReactNode> = {
  info: <Info className="size-3.5" aria-hidden="true" />,
  success: <CheckCircle2 className="size-3.5" aria-hidden="true" />,
  warning: <AlertTriangle className="size-3.5" aria-hidden="true" />,
  error: <AlertCircle className="size-3.5" aria-hidden="true" />,
};

/** Left accent stripe color per severity — `error` intentionally maps to `danger-border`,
 * not a `severity-*` ramp token, consistent with `SEVERITY_ICON_CLASSES` below. */
const SEVERITY_STRIPE_CLASSES: Record<ToastSeverity, string> = {
  info: "before:bg-info-border",
  success: "before:bg-success-border",
  warning: "before:bg-warning-border",
  error: "before:bg-danger-border",
};

/** Cluster-dot surface/fg tint per severity, reusing the same semantic surface tokens as
 * badges/tags elsewhere rather than inventing a new pairing. */
const SEVERITY_DOT_CLASSES: Record<ToastSeverity, string> = {
  info: "bg-info-surface text-info-fg",
  success: "bg-success-surface text-success-fg",
  warning: "bg-warning-surface text-warning-fg",
  error: "bg-danger-surface text-danger-fg",
};

export interface ToastProps {
  severity?: ToastSeverity;
  title: ReactNode;
  description?: ReactNode;
  /** Inline action, e.g. an "Undo" text button. Rendered inline with `countdownLabel` (on
   * the same row) when both are present, or on its own row below the description otherwise. */
  action?: ReactNode;
  /**
   * Plain-text (or short inline node) countdown/meta row rendered below the description,
   * e.g. "27 min left". Presentational only — the caller owns the ticking clock and passes
   * the current label down; this component never runs its own interval. Pair with
   * `isUrgent` to escalate styling in the final couple of minutes. Covers the F-24
   * long-window undo (e.g. a 28-minute "undo available" toast) where a live-updating value
   * needs to live inside a toast without a bespoke rebuild per call site.
   */
  countdownLabel?: ReactNode;
  /** Escalates the countdown row to `text-warning-fg font-semibold` — intended for the
   * final ~2 minutes of an F-24-style undo window. Purely presentational; the caller decides
   * the threshold and re-renders with `isUrgent` flipped. No effect if `countdownLabel` is unset. */
  isUrgent?: boolean;
  onDismiss?: () => void;
  className?: string;
}

/**
 * Canonical Toast (presentational) — a short, timed, non-blocking update
 * such as "Shipment created" or "Export started." Use Message Bar instead
 * for a persistent, task-tied notice. `error` severity uses `danger-*`
 * tokens, not `severity-*` — see message-bar.tsx's doc comment for the same
 * reserved-ramp distinction, which applies identically here. Render via
 * `ToastProvider`/`useToast` rather than mounting directly, so stacking,
 * clustering, and portal-to-body are handled consistently.
 *
 * Carries a slim 3px left accent stripe (severity-tinted) instead of a
 * color-washed card body, so type reads at a glance while the card itself
 * stays neutral (`bg-surface-overlay`).
 */
export function Toast({
  severity = "info",
  title,
  description,
  action,
  countdownLabel,
  isUrgent = false,
  onDismiss,
  className,
}: ToastProps) {
  return (
    <div
      role={severity === "error" ? "alert" : "status"}
      className={cn(
        "relative flex w-80 items-start gap-3 rounded-md border border-border-subtle bg-surface-overlay py-3 pl-4 pr-3 shadow-lg",
        "before:absolute before:inset-y-2 before:left-0 before:w-[3px] before:rounded-full",
        SEVERITY_STRIPE_CLASSES[severity],
        className,
      )}
    >
      <span className={cn("mt-0.5 shrink-0", SEVERITY_ICON_CLASSES[severity])}>{SEVERITY_ICONS[severity]}</span>
      <div className="min-w-0 flex-1">
        <p className="text-label-l font-medium text-fg-primary">{title}</p>
        {description ? <p className="mt-0.5 text-body-s text-fg-secondary">{description}</p> : null}
        {countdownLabel ? (
          <p
            className={cn(
              "mt-1.5 text-caption tabular-nums text-fg-muted",
              isUrgent && "font-semibold text-warning-fg",
            )}
          >
            {countdownLabel}
            {action ? <> · {action}</> : null}
          </p>
        ) : action ? (
          <div className="mt-2">{action}</div>
        ) : null}
      </div>
      {onDismiss ? (
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss"
          className="-m-1 shrink-0 rounded p-1 text-fg-muted transition-colors hover:bg-option-hover hover:text-fg-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
        >
          <X className="size-4" aria-hidden="true" />
        </button>
      ) : null}
    </div>
  );
}

// ---------------------------------------------------------------------------
// ToastProvider / useToast — infrastructure for imperatively queuing toasts
// and rendering the portaled, stacked container. This is separate
// infrastructure from the visual Toast above (a context provider + hook +
// container), not a variant of it.
// ---------------------------------------------------------------------------

export interface ToastOptions {
  severity?: ToastSeverity;
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  /** See `ToastProps.countdownLabel` — presentational, caller-driven. */
  countdownLabel?: ReactNode;
  /** See `ToastProps.isUrgent`. */
  isUrgent?: boolean;
  /** Auto-dismiss after this many ms. Pass `null` to require manual dismissal. */
  durationMs?: number | null;
  /**
   * Whether this toast may be folded into the collapsed cluster card when 2+
   * clusterable toasts are active simultaneously. Defaults to `true` for
   * `info`/`success` (routine, low-stakes confirmations) and `false` for
   * `warning`/`error` (potentially urgent/action-required) — pass an explicit
   * value to override the default in either direction. A toast carrying a
   * `countdownLabel` is always treated as non-clusterable regardless of this
   * flag, since a live countdown (F-24) must never be hidden inside a
   * collapsed cluster.
   */
  clusterable?: boolean;
}

interface ActiveToast extends ToastOptions {
  id: string;
}

interface ToastContextValue {
  /** Queue a toast; returns its id so callers can dismiss it early if needed. */
  showToast: (options: ToastOptions) => string;
  dismissToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const DEFAULT_DURATION_MS = 5000;

/** Default clusterability by severity when `options.clusterable` is omitted — routine
 * info/success confirmations cluster, warning/error stay solo so they can't be missed. */
const DEFAULT_CLUSTERABLE_BY_SEVERITY: Record<ToastSeverity, boolean> = {
  info: true,
  success: true,
  warning: false,
  error: false,
};

function isClusterable(toast: ActiveToast): boolean {
  // A live countdown must never be buried inside a collapsed cluster.
  if (toast.countdownLabel) return false;
  return toast.clusterable ?? DEFAULT_CLUSTERABLE_BY_SEVERITY[toast.severity ?? "info"];
}

/** Max icon-dots shown before collapsing the rest into a "+N" fallback dot. */
const MAX_CLUSTER_DOTS = 3;

function ClusterCard({ toasts, onDismiss }: { toasts: ActiveToast[]; onDismiss: (id: string) => void }) {
  const visibleDots = toasts.slice(0, MAX_CLUSTER_DOTS);

  const header = (
    <span className="flex flex-1 items-center gap-2.5">
      <span className="shrink-0" aria-hidden="true">
        <AvatarGroup max={MAX_CLUSTER_DOTS}>
          {visibleDots.map((toast) => (
            <span
              key={toast.id}
              className={cn(
                "flex size-6 items-center justify-center rounded-full",
                SEVERITY_DOT_CLASSES[toast.severity ?? "info"],
              )}
            >
              {SEVERITY_ICONS_SM[toast.severity ?? "info"]}
            </span>
          ))}
        </AvatarGroup>
      </span>
      <span className="flex-1 text-label-l font-medium text-fg-primary">
        {toasts.length} updates — tap to review
      </span>
    </span>
  );

  return (
    <Accordion className="w-80 rounded-md border-border-subtle bg-surface-overlay shadow-lg divide-border-subtle">
      <AccordionItem
        id="cluster"
        title={header}
        className="bg-surface-overlay first:rounded-t-md last:rounded-b-md"
      >
        {/* AccordionItem mounts this content only when open (no internal height transition),
         * so the motion-safe max-height transition from the original brief cannot be
         * reproduced here without forking Accordion's conditional-render internals — see
         * the flagged gap in the composer report. `max-h-[220px]` is retained as a scroll
         * cap so a large cluster doesn't grow the card unbounded. */}
        <div className="max-h-[220px] overflow-y-auto -mx-4 -mb-4">
          {toasts.map((toast) => (
            <div key={toast.id} className="flex items-start gap-2 border-t border-border-subtle p-2.5 first:border-t-0">
              <span className={cn("mt-0.5 shrink-0", SEVERITY_ICON_CLASSES[toast.severity ?? "info"])}>
                {SEVERITY_ICONS_SM[toast.severity ?? "info"]}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-body-s font-medium text-fg-primary">{toast.title}</p>
                {toast.description ? <p className="mt-0.5 text-caption text-fg-muted">{toast.description}</p> : null}
              </div>
              <button
                type="button"
                onClick={() => onDismiss(toast.id)}
                aria-label="Dismiss"
                className="-m-1 shrink-0 rounded p-1 text-fg-muted transition-colors hover:bg-option-hover hover:text-fg-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
              >
                <X className="size-3.5" aria-hidden="true" />
              </button>
            </div>
          ))}
        </div>
      </AccordionItem>
    </Accordion>
  );
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ActiveToast[]>([]);
  const timers = useRef(new Map<string, ReturnType<typeof setTimeout>>());

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    const timer = timers.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timers.current.delete(id);
    }
  }, []);

  const showToast = useCallback(
    (options: ToastOptions) => {
      const id = crypto.randomUUID();
      setToasts((prev) => [...prev, { id, ...options }]);
      const duration = options.durationMs === undefined ? DEFAULT_DURATION_MS : options.durationMs;
      if (duration !== null) {
        const timer = setTimeout(() => dismissToast(id), duration);
        timers.current.set(id, timer);
      }
      return id;
    },
    [dismissToast],
  );

  const value = useMemo(() => ({ showToast, dismissToast }), [showToast, dismissToast]);

  // Partition into solo (urgent/timed — always rendered as their own card, never folded
  // into a cluster) vs clusterable (routine info/success confirmations). When 2+
  // clusterable toasts are simultaneously active they collapse into one ClusterCard;
  // a single clusterable toast still renders as its own solo-looking card so a lone
  // confirmation doesn't look like an odd 1-item cluster.
  const soloToasts = toasts.filter((t) => !isClusterable(t));
  const clusterableToasts = toasts.filter(isClusterable);
  const clusterActive = clusterableToasts.length >= 2;

  // `flex-col-reverse` grows the stack upward with the newest item at the bottom, which
  // means DOM order must run *newest-first* (the first DOM child lands at the bottom in a
  // reversed column). Build one ordered list of render items — solo cards in their own
  // recency order, plus the cluster card slotted in at the position of its most recent
  // member — then reverse it once for DOM order. This keeps a just-arrived urgent solo
  // toast and a just-arrived routine toast relatively ordered by recency rather than
  // pinning urgent ones to a fixed slot, since `isClusterable` (not urgency alone) already
  // guarantees the countdown/urgent toast can never be swallowed into the cluster.
  type RenderItem = { key: string; node: ReactNode; latestIndex: number };
  const items: RenderItem[] = soloToasts.map((toast) => ({
    key: toast.id,
    latestIndex: toasts.indexOf(toast),
    node: (
      <Toast
        severity={toast.severity}
        title={toast.title}
        description={toast.description}
        action={toast.action}
        countdownLabel={toast.countdownLabel}
        isUrgent={toast.isUrgent}
        onDismiss={() => dismissToast(toast.id)}
      />
    ),
  }));

  if (clusterableToasts.length > 0) {
    const latestIndex = Math.max(...clusterableToasts.map((t) => toasts.indexOf(t)));
    if (clusterActive) {
      items.push({ key: "cluster", latestIndex, node: <ClusterCard toasts={clusterableToasts} onDismiss={dismissToast} /> });
    } else {
      const toast = clusterableToasts[0];
      items.push({
        key: toast.id,
        latestIndex,
        node: (
          <Toast
            severity={toast.severity}
            title={toast.title}
            description={toast.description}
            action={toast.action}
            countdownLabel={toast.countdownLabel}
            isUrgent={toast.isUrgent}
            onDismiss={() => dismissToast(toast.id)}
          />
        ),
      });
    }
  }

  const orderedItems = items.sort((a, b) => b.latestIndex - a.latestIndex);

  return (
    <ToastContext.Provider value={value}>
      {children}
      {typeof document !== "undefined"
        ? createPortal(
            <div
              aria-live="polite"
              aria-atomic="false"
              // Portaled straight to `document.body`, so `fixed` (viewport-anchored) is
              // correct here — the inventor mockup used `position: absolute` only because
              // it was scoped inside a relatively-positioned demo frame for the report;
              // in the real app there is no such ancestor to anchor to, and `fixed` is what
              // keeps the stack pinned to the viewport corner regardless of page scroll.
              // `flex-col-reverse` makes new toasts enter at the bottom and the stack grow
              // upward, per the approved direction; DOM order is newest-first to achieve
              // that visual order (see `orderedItems` above).
              className="fixed bottom-4 right-4 z-50 flex flex-col-reverse gap-2"
            >
              {orderedItems.map((item) => (
                <div key={item.key}>{item.node}</div>
              ))}
            </div>,
            document.body,
          )
        : null}
    </ToastContext.Provider>
  );
}

/** Access `showToast`/`dismissToast` from within a tree wrapped by `ToastProvider`. */
export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within a ToastProvider");
  return ctx;
}
