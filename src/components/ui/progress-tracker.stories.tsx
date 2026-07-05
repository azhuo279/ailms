import type { Meta, StoryObj } from "@storybook/nextjs";
import { Truck, User } from "lucide-react";
import { ProgressTracker, type ProgressStep } from "./progress-tracker";

/**
 * **Progress Tracker** — for a user moving through a multi-step journey
 * such as onboarding, shipment creation, or claims submission, or for
 * showing the audit trail of how an exception was handled. Good for
 * linear, named stages; do not substitute for generic pagination or
 * arbitrary tabbed navigation.
 *
 * Two density modes share one `steps` data model: `compact` (horizontal
 * stepper) and `rich` (expandable vertical timeline with source
 * attribution, timestamps, per-row disclosure, and an inline "blocked"
 * detour panel).
 */
const meta: Meta<typeof ProgressTracker> = {
  title: "UI/Progress Tracker",
  component: ProgressTracker,
  argTypes: {
    density: { control: "select", options: ["compact", "rich"] },
  },
};

export default meta;
type Story = StoryObj<typeof ProgressTracker>;

const STEPS: ProgressStep[] = [
  { id: "1", label: "Shipment details", status: "complete" },
  { id: "2", label: "Carrier & rate", status: "complete" },
  { id: "3", label: "Documents", status: "current" },
  { id: "4", label: "Review", status: "upcoming", optional: true },
];

export const Compact: Story = {
  args: { steps: STEPS, density: "compact", showDensityToggle: false },
};

const RICH_STEPS: ProgressStep[] = [
  {
    id: "1",
    label: "Exception detected · ETA breach threshold",
    status: "complete",
    timestamp: "Jul 5, 08:12",
    source: { icon: Truck, label: "SignalTrack" },
    actor: "SignalTrack · system-generated",
    detail:
      "Predicted ETA drifted 2h14m past the committed delivery window on lane DFW to ATL. Auto-flagged at severity tier 2 based on customer SLA tier (Gold).",
  },
  {
    id: "2",
    label: "Delegated to Dispatcher",
    status: "blocked",
    timestamp: "Jul 5, 08:41",
    source: { icon: User, label: "R. Kwan" },
    actor: "R. Kwan (ZOM)",
    detail: "Handoff package sent to J. Torres with carrier contact and lane performance context pre-loaded. Deadline set for 10:00.",
    detour: {
      message: "J. Torres: \"Need updated pickup window before I can confirm with carrier.\"",
      timestamp: "Logged 09:05",
    },
  },
  {
    id: "3",
    label: "Awaiting outcome confirmation",
    status: "current",
    actor: "Pending · J. Torres",
  },
  {
    id: "4",
    label: "Closed",
    status: "upcoming",
  },
];

export const RichTimeline: Story = {
  args: { steps: RICH_STEPS, density: "rich", showDensityToggle: false },
};

export const DensityToggle: Story = {
  args: { steps: RICH_STEPS, defaultDensity: "compact" },
};

export const AllNodeStates: Story = {
  args: {
    steps: [
      { id: "1", label: "Submitted", status: "complete", source: { icon: User, label: "R. Kwan" } },
      { id: "2", label: "In review", status: "current" },
      { id: "3", label: "Blocked", status: "blocked", source: { icon: Truck, label: "SignalTrack" } },
      { id: "4", label: "Closed", status: "upcoming" },
    ],
    density: "compact",
    showDensityToggle: false,
  },
};

export const BlockedDetourInRichMode: Story = {
  args: {
    steps: [
      { id: "1", label: "Submitted", status: "complete", timestamp: "Jul 5, 08:12", actor: "R. Kwan" },
      {
        id: "2",
        label: "Carrier confirmation",
        status: "blocked",
        timestamp: "Jul 5, 09:05",
        source: { icon: Truck, label: "FleetCommand TMS" },
        actor: "J. Torres · Dispatcher",
        detour: {
          message: "Carrier has not confirmed the updated pickup window; escalation pending.",
          timestamp: "Logged 09:05",
        },
      },
      { id: "3", label: "Outcome confirmed", status: "upcoming" },
    ],
    density: "rich",
    showDensityToggle: false,
  },
};

export const WithBlockedStep: Story = {
  args: {
    steps: [
      { id: "1", label: "Shipment details", status: "complete" },
      { id: "2", label: "Carrier & rate", status: "blocked" },
      { id: "3", label: "Documents", status: "upcoming" },
    ],
    density: "compact",
    showDensityToggle: false,
  },
};

export const AllComplete: Story = {
  args: {
    steps: STEPS.map((s) => ({ ...s, status: "complete" as const })),
    density: "compact",
    showDensityToggle: false,
  },
};

export const ClickableCompletedSteps: Story = {
  args: { steps: STEPS, density: "compact", showDensityToggle: false, onStepClick: () => {} },
};

export const FirstStepCurrent: Story = {
  args: {
    steps: [
      { id: "1", label: "Shipment details", status: "current" },
      { id: "2", label: "Carrier & rate", status: "upcoming" },
      { id: "3", label: "Documents", status: "upcoming" },
    ],
    density: "compact",
    showDensityToggle: false,
  },
};

export const FocusVisible: Story = {
  args: { steps: STEPS, density: "compact", showDensityToggle: false, onStepClick: () => {} },
  parameters: { pseudo: { focusVisible: true } },
};
