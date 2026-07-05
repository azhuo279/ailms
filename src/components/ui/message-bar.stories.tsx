import type { Meta, StoryObj } from "@storybook/nextjs";
import { MessageBar } from "./message-bar";
import { Button } from "./button";

/**
 * **Message Bar** — a persistent inline or top-of-surface message for
 * informational, success, warning, or error states tied to the current task
 * or form. Use Toast instead for a short, timed, non-blocking update.
 */
const meta: Meta<typeof MessageBar> = {
  title: "UI/MessageBar",
  component: MessageBar,
  args: {
    severity: "info",
    children: "Your changes are saved automatically as you work.",
  },
  argTypes: {
    severity: { control: "select", options: ["info", "success", "warning", "error"] },
  },
};

export default meta;
type Story = StoryObj<typeof MessageBar>;

export const Info: Story = { args: { severity: "info" } };
export const Success: Story = {
  args: { severity: "success", title: "Shipment created", children: "Order #4021 was created and assigned to Northline Freight." },
};
export const Warning: Story = {
  args: { severity: "warning", title: "Approaching capacity", children: "This route is at 92% of its weight limit." },
};
export const Error: Story = {
  args: { severity: "error", title: "Could not save changes", children: "Check the highlighted fields and try again." },
};

export const WithTitle: Story = {
  args: { title: "Heads up", children: "Carrier rates update nightly at 2 AM UTC." },
};

export const WithAction: Story = {
  args: {
    severity: "error",
    title: "Upload failed",
    children: "The manifest file could not be processed.",
    action: <Button size="sm" variant="secondary">Retry</Button>,
  },
};

export const Dismissible: Story = {
  args: {
    severity: "info",
    title: "New feature available",
    children: "Bulk status updates are now available from the table toolbar.",
    onDismiss: () => {},
  },
};

export const BannerVariant: Story = {
  render: (args) => (
    <div className="w-full max-w-2xl">
      <MessageBar {...args} />
    </div>
  ),
  args: {
    severity: "warning",
    title: "Scheduled maintenance",
    children: "The platform will be unavailable Saturday 1-3 AM UTC.",
    className: "rounded-none border-x-0 border-t-0",
  },
};
