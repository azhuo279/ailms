import type { Meta, StoryObj } from "@storybook/nextjs";
import { Popover, PopoverTitle, PopoverBody } from "./popover";
import { Button } from "./button";

/**
 * **Popover** — a small, non-blocking contextual surface for brief
 * information or lightweight controls, anchored to a trigger. If content is
 * essential and interruptive, use Dialog instead. Portals to `document.body`.
 */
const meta: Meta<typeof Popover> = {
  title: "UI/Popover",
  component: Popover,
  args: {
    align: "start",
  },
  argTypes: {
    align: { control: "select", options: ["start", "end"] },
  },
};

export default meta;
type Story = StoryObj<typeof Popover>;

export const Default: Story = {
  render: (args) => (
    <div className="flex justify-center p-16">
      <Popover
        {...args}
        trigger={<Button variant="secondary">View details</Button>}
      >
        <PopoverTitle>Route ETA</PopoverTitle>
        <PopoverBody>Estimated arrival is 2:45 PM, based on current traffic and driver location.</PopoverBody>
      </Popover>
    </div>
  ),
};

export const AlignEnd: Story = {
  args: { align: "end" },
  render: (args) => (
    <div className="flex justify-end p-16">
      <Popover
        {...args}
        trigger={<Button variant="secondary">Options</Button>}
      >
        <PopoverTitle>Quick filters</PopoverTitle>
        <PopoverBody>Narrow the table to delayed shipments only.</PopoverBody>
      </Popover>
    </div>
  ),
};

export const RichContent: Story = {
  render: (args) => (
    <div className="flex justify-center p-16">
      <Popover
        {...args}
        trigger={<Button variant="secondary">Carrier info</Button>}
      >
        <PopoverTitle>Northline Freight</PopoverTitle>
        <PopoverBody>
          <p>On-time rate this quarter: 94%.</p>
          <a href="#" className="mt-2 inline-block text-body-s text-link hover:text-link-hover">
            View full scorecard
          </a>
        </PopoverBody>
      </Popover>
    </div>
  ),
};

export const Open: Story = {
  args: { open: true },
  render: (args) => (
    <div className="flex justify-center p-16">
      <Popover
        {...args}
        trigger={<Button variant="secondary">Always open</Button>}
      >
        <PopoverTitle>Controlled open state</PopoverTitle>
        <PopoverBody>This story pins `open` to true for visual review.</PopoverBody>
      </Popover>
    </div>
  ),
};
