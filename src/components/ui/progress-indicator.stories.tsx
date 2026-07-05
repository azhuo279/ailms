import type { Meta, StoryObj } from "@storybook/nextjs";
import { ProgressIndicator } from "./progress-indicator";

/**
 * **Progress Indicator** — shows progress of a process or multi-step
 * workflow. Use `determinate` when percent-complete is knowable and
 * `indeterminate` for an ongoing process with an unknown endpoint. Prefer
 * Spinner instead for a short, generic wait with no meaningful label.
 */
const meta: Meta<typeof ProgressIndicator> = {
  title: "UI/ProgressIndicator",
  component: ProgressIndicator,
  args: {
    variant: "determinate",
    value: 62,
    label: "Uploading manifest.pdf",
  },
  argTypes: {
    variant: { control: "select", options: ["determinate", "indeterminate"] },
    value: { control: { type: "range", min: 0, max: 100 } },
  },
};

export default meta;
type Story = StoryObj<typeof ProgressIndicator>;

export const Determinate: Story = { args: { variant: "determinate", value: 62 } };
export const Indeterminate: Story = {
  args: { variant: "indeterminate", label: "Syncing shipment data" },
};
export const NearComplete: Story = { args: { value: 94 } };
export const JustStarted: Story = { args: { value: 5 } };
export const WithoutValueText: Story = { args: { showValueText: false } };
