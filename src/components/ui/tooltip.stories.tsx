import type { Meta, StoryObj } from "@storybook/nextjs";
import { Info } from "lucide-react";
import { Tooltip } from "./tooltip";
import { Button } from "./button";

/**
 * **Tooltip** — a brief, non-essential label or explanatory text shown near a
 * target on hover/focus, dismissed on blur/leave. Do not place interactive
 * controls inside a tooltip's content — if the content needs interaction
 * (a link, a button), use Popover instead.
 */
const meta: Meta<typeof Tooltip> = {
  title: "UI/Tooltip",
  component: Tooltip,
  args: {
    content: "Export the current view as a CSV file",
    placement: "top",
  },
  argTypes: {
    placement: { control: "select", options: ["top", "bottom", "left", "right"] },
  },
};

export default meta;
type Story = StoryObj<typeof Tooltip>;

export const Top: Story = {
  args: { placement: "top" },
  render: (args) => (
    <div className="flex items-center justify-center p-16">
      <Tooltip {...args}>
        <Button variant="secondary">Export</Button>
      </Tooltip>
    </div>
  ),
};

export const Bottom: Story = {
  args: { placement: "bottom" },
  render: (args) => (
    <div className="flex items-center justify-center p-16">
      <Tooltip {...args}>
        <Button variant="secondary">Export</Button>
      </Tooltip>
    </div>
  ),
};

export const Left: Story = {
  args: { placement: "left" },
  render: (args) => (
    <div className="flex items-center justify-center p-16">
      <Tooltip {...args}>
        <Button variant="secondary">Export</Button>
      </Tooltip>
    </div>
  ),
};

export const Right: Story = {
  args: { placement: "right" },
  render: (args) => (
    <div className="flex items-center justify-center p-16">
      <Tooltip {...args}>
        <Button variant="secondary">Export</Button>
      </Tooltip>
    </div>
  ),
};

export const OnIconButton: Story = {
  args: { content: "Shipment is on schedule" },
  render: (args) => (
    <div className="flex items-center justify-center p-16">
      <Tooltip {...args}>
        <Button iconOnly icon={<Info />} aria-label="Shipment info" variant="ghost" />
      </Tooltip>
    </div>
  ),
};

export const DelayedShow: Story = {
  args: { delayMs: 800 },
  render: (args) => (
    <div className="flex items-center justify-center p-16">
      <Tooltip {...args}>
        <Button variant="secondary">Hover and wait</Button>
      </Tooltip>
    </div>
  ),
};
