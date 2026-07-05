import type { Meta, StoryObj } from "@storybook/nextjs";
import { Spinner } from "./spinner";

/**
 * **Spinner** — indeterminate wait indicator for shorter processing moments
 * where percent-complete is unknown. Use Progress Indicator instead when
 * completion percentage is knowable, and Skeleton instead for content-shape
 * loading on cards/tables. Avoid showing many spinners at once on one surface.
 */
const meta: Meta<typeof Spinner> = {
  title: "UI/Spinner",
  component: Spinner,
  args: {
    size: "md",
    label: "Loading",
  },
  argTypes: {
    size: { control: "select", options: ["sm", "md", "lg"] },
  },
};

export default meta;
type Story = StoryObj<typeof Spinner>;

export const Small: Story = { args: { size: "sm" } };
export const Medium: Story = { args: { size: "md" } };
export const Large: Story = { args: { size: "lg" } };
export const WithAccessibleLabel: Story = { args: { label: "Loading shipment details" } };
export const OverlayMode: Story = {
  render: (args) => (
    <div className="relative flex h-32 w-64 items-center justify-center rounded-lg border border-border-subtle bg-surface-raised/80">
      <Spinner {...args} />
    </div>
  ),
  args: { size: "lg" },
};
