import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/nextjs";
import { Drawer } from "./drawer";
import { Button } from "./button";

/**
 * **Drawer** — a secondary surface that slides in for supplemental detail or
 * related actions while preserving the current page context. Use instead of
 * Dialog when the task is related but shouldn't fully replace the working
 * context; for tiny snippets, prefer Popover.
 */
const meta: Meta<typeof Drawer> = {
  title: "UI/Drawer",
  component: Drawer,
  args: {
    title: "Shipment #4021",
    side: "right",
    width: "md",
  },
  argTypes: {
    side: { control: "select", options: ["left", "right"] },
    width: { control: "select", options: ["sm", "md", "lg"] },
  },
};

export default meta;
type Story = StoryObj<typeof Drawer>;

function DrawerHarness(props: React.ComponentProps<typeof Drawer>) {
  const [open, setOpen] = useState(true);
  return (
    <div>
      <Button onClick={() => setOpen(true)}>Open drawer</Button>
      <Drawer {...props} open={open} onClose={() => setOpen(false)} />
    </div>
  );
}

export const Default: Story = {
  render: (args) => (
    <DrawerHarness {...args}>
      <p>Carrier: Northline Freight</p>
      <p className="mt-2">Status: In transit</p>
    </DrawerHarness>
  ),
};

export const LeftSide: Story = {
  args: { side: "left" },
  render: (args) => <DrawerHarness {...args}>Supplemental detail panel.</DrawerHarness>,
};

export const Small: Story = {
  args: { width: "sm" },
  render: (args) => <DrawerHarness {...args}>Compact width for brief context.</DrawerHarness>,
};

export const Large: Story = {
  args: { width: "lg" },
  render: (args) => <DrawerHarness {...args}>Wider layout for denser content.</DrawerHarness>,
};

export const WithFooterActions: Story = {
  render: (args) => (
    <DrawerHarness
      {...args}
      actions={
        <>
          <Button variant="secondary" onClick={() => {}}>
            Cancel
          </Button>
          <Button onClick={() => {}}>Save</Button>
        </>
      }
    >
      <p>Edit shipment details.</p>
    </DrawerHarness>
  ),
};

export const PersistentMode: Story = {
  args: { persistent: true },
  render: (args) => <DrawerHarness {...args}>Docked panel — no scrim, no outside-click-to-close.</DrawerHarness>,
};

export const Closed: Story = {
  render: (args) => <Drawer {...args} open={false} onClose={() => {}} />,
};
