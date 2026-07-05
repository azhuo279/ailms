import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/nextjs";
import { Dialog } from "./dialog";
import { Button } from "./button";

/**
 * **Dialog** — an important decision, confirmation, or focused task that
 * should interrupt the current workflow. Use `variant="alert"` for urgent,
 * destructive confirmations — this replaces what other systems call a
 * separate "Alert Dialog" component; here it's one prop on the same
 * component, since both share the same surface, focus-trap, and portal
 * machinery. Avoid nesting dialogs.
 */
const meta: Meta<typeof Dialog> = {
  title: "UI/Dialog",
  component: Dialog,
  args: {
    title: "Discard changes?",
    description: "You have unsaved changes that will be lost.",
  },
};

export default meta;
type Story = StoryObj<typeof Dialog>;

function DialogHarness(props: React.ComponentProps<typeof Dialog>) {
  const [open, setOpen] = useState(true);
  return (
    <div>
      <Button onClick={() => setOpen(true)}>Open dialog</Button>
      <Dialog {...props} open={open} onClose={() => setOpen(false)} />
    </div>
  );
}

export const Default: Story = {
  render: (args) => (
    <DialogHarness
      {...args}
      actions={
        <>
          <Button variant="secondary" onClick={() => {}}>
            Cancel
          </Button>
          <Button onClick={() => {}}>Discard</Button>
        </>
      }
    />
  ),
};

export const AlertVariant: Story = {
  args: {
    variant: "alert",
    title: "Delete shipment?",
    description: "This action cannot be undone. Order #4021 and all its documents will be permanently removed.",
  },
  render: (args) => (
    <DialogHarness
      {...args}
      actions={
        <>
          <Button variant="secondary" onClick={() => {}}>
            Cancel
          </Button>
          <Button destructive onClick={() => {}}>
            Delete
          </Button>
        </>
      }
    />
  ),
};

export const FormDialog: Story = {
  args: { title: "Assign carrier", description: undefined },
  render: (args) => (
    <DialogHarness
      {...args}
      actions={
        <>
          <Button variant="secondary" onClick={() => {}}>
            Cancel
          </Button>
          <Button onClick={() => {}}>Assign</Button>
        </>
      }
    >
      <p>Form fields for selecting a carrier would render here.</p>
    </DialogHarness>
  ),
};

export const WithoutCloseButton: Story = {
  args: { hideCloseButton: true },
  render: (args) => (
    <DialogHarness
      {...args}
      actions={<Button onClick={() => {}}>Got it</Button>}
    />
  ),
};

export const Closed: Story = {
  render: (args) => <Dialog {...args} open={false} onClose={() => {}} />,
};
