import { useEffect, useRef } from "react";
import type { Meta, StoryObj } from "@storybook/nextjs";
import { Toast, ToastProvider, useToast } from "./toast";
import type { ToastOptions } from "./toast";
import { Button } from "./button";

/**
 * **Toast** — a short, timed, non-blocking update such as "Shipment created"
 * or "Export started." Use Message Bar instead for a persistent, task-tied
 * notice. Render through `ToastProvider` + `useToast` in the app; the plain
 * `Toast` export below is the presentational shell used for static review.
 */
const meta: Meta<typeof Toast> = {
  title: "UI/Toast",
  component: Toast,
  args: {
    severity: "info",
    title: "Export started",
  },
};

export default meta;
type Story = StoryObj<typeof Toast>;

export const Info: Story = { args: { severity: "info" } };
export const Success: Story = { args: { severity: "success", title: "Shipment created", description: "Order #4021 was created." } };
export const Warning: Story = { args: { severity: "warning", title: "Sync delayed", description: "Retrying in the background." } };
export const Error: Story = { args: { severity: "error", title: "Export failed", description: "Try again in a few minutes." } };

export const WithAction: Story = {
  args: {
    title: "Item removed",
    action: <button type="button" className="text-label-m font-medium text-link hover:text-link-hover">Undo</button>,
  },
};

export const Dismissible: Story = {
  args: { title: "Draft saved", onDismiss: () => {} },
};

export const Stacked: Story = {
  render: () => (
    <div className="flex flex-col gap-2">
      <Toast severity="success" title="Shipment #4021 created" />
      <Toast severity="info" title="Export started" description="You'll be notified when it's ready." />
      <Toast severity="warning" title="2 items need review" />
    </div>
  ),
};

/**
 * F-24 undo-window use case — a long-lived (e.g. 28 minute) countdown rendered inline via
 * `countdownLabel`/`isUrgent`. Never clusterable (a toast with `countdownLabel` is always
 * solo, regardless of severity), so it can't be buried under routine confirmations.
 */
export const UrgentCountdown: Story = {
  args: {
    severity: "warning",
    title: "Action executed — carrier notified",
    description: "Undo available for a limited time.",
    countdownLabel: "27 min left",
    action: <button type="button" className="text-label-m font-medium text-link hover:text-link-hover">Undo</button>,
  },
};

/** Same countdown toast in its final 2 minutes — escalates to `text-warning-fg font-semibold`. */
export const UrgentCountdownExpiring: Story = {
  args: {
    ...UrgentCountdown.args,
    countdownLabel: "2 min left",
    isUrgent: true,
  },
};

/**
 * Direction C — 3+ routine (clusterable) toasts collapsed into a single cluster card:
 * overlapping severity-tinted icon dots, "N updates — tap to review" label, chevron.
 * Static via `render:` since `ToastProvider` only clusters real, simultaneously-active
 * toasts — see `ClusterExpandedDemo` below for the interactive, provider-driven version.
 */
export const ClusterCollapsed: Story = {
  render: () => (
    <ToastProvider>
      <ClusterSeedDemo autoExpand={false} />
    </ToastProvider>
  ),
};

/** Same cluster, pre-expanded to show the accordion-open state (icon + title + muted description per row). */
export const ClusterExpanded: Story = {
  render: () => (
    <ToastProvider>
      <ClusterSeedDemo autoExpand />
    </ToastProvider>
  ),
};

const ROUTINE_TOASTS: ToastOptions[] = [
  { severity: "success", title: "Escalation sent to R. Alvarez", description: "You'll be notified when they respond.", durationMs: null },
  { severity: "info", title: "Director approved — rebooking", description: "Reason: cost within threshold.", durationMs: null },
  { severity: "success", title: "Shipment #4021 created", durationMs: null },
];

/** Queues 3 routine toasts on mount so `ToastProvider` collapses them into a real `ClusterCard`.
 * `autoExpand` clicks the summary row once it mounts, purely for the static `ClusterExpanded`
 * story — interactive expand/collapse still works normally via click either way. */
function ClusterSeedDemo({ autoExpand }: { autoExpand: boolean }) {
  const { showToast } = useToast();
  const seededRef = useRef(false);

  useEffect(() => {
    if (seededRef.current) return;
    seededRef.current = true;
    ROUTINE_TOASTS.forEach((toast) => showToast(toast));

    if (!autoExpand) return;
    // Wait one extra frame past the seeding commit so the portaled ClusterCard has
    // mounted before we click its summary button open.
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const button = document.querySelector('[aria-expanded="false"]');
        if (button instanceof HTMLElement) button.click();
      });
    });
  }, [showToast, autoExpand]);

  return (
    <div className="flex h-64 items-end justify-end">
      <p className="text-body-s text-fg-muted">
        3 routine toasts queued — see the cluster card in the bottom-right{autoExpand ? ", expanded" : ""}.
      </p>
    </div>
  );
}

/** Live demo of the ToastProvider/useToast hook — click to queue a real, timed, portaled toast. */
function ToastDemo() {
  const { showToast } = useToast();
  return (
    <div className="flex flex-wrap gap-2">
      <Button
        onClick={() =>
          showToast({ severity: "success", title: "Shipment created", description: "Order #4021 was created." })
        }
      >
        Trigger routine toast
      </Button>
      <Button
        variant="secondary"
        onClick={() =>
          showToast({
            severity: "warning",
            title: "Action executed — carrier notified",
            description: "Undo available for a limited time.",
            countdownLabel: "27 min left",
            durationMs: null,
            action: <button type="button" className="text-label-m font-medium text-link hover:text-link-hover">Undo</button>,
          })
        }
      >
        Trigger urgent countdown toast
      </Button>
    </div>
  );
}

export const ProviderDemo: Story = {
  render: () => (
    <ToastProvider>
      <ToastDemo />
    </ToastProvider>
  ),
};
