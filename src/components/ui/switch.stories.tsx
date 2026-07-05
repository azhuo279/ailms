import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/nextjs";
import { Switch } from "./switch";

/**
 * **Switch** — a standalone on/off setting or a verbose setting-row toggle.
 * Not for choosing one of several options — use Radio Group for that.
 */
const meta: Meta<typeof Switch> = {
  title: "UI/Switch",
  component: Switch,
  args: {
    label: "Auto-refresh shipment status",
  },
};

export default meta;
type Story = StoryObj<typeof Switch>;

function ControlledSwitch(props: React.ComponentProps<typeof Switch>) {
  const [checked, setChecked] = useState(props.checked ?? false);
  return <Switch {...props} checked={checked} onChange={setChecked} />;
}

export const Off: Story = {
  render: (args) => <ControlledSwitch {...args} />,
};

export const On: Story = {
  render: (args) => <ControlledSwitch {...args} checked />,
};

export const Disabled: Story = {
  args: { disabled: true },
  render: (args) => <ControlledSwitch {...args} />,
};

export const DisabledOn: Story = {
  args: { disabled: true },
  render: (args) => <ControlledSwitch {...args} checked />,
};

export const Loading: Story = {
  args: { isLoading: true },
  render: (args) => <ControlledSwitch {...args} checked />,
};

export const ReadOnly: Story = {
  args: { readOnly: true },
  render: (args) => <ControlledSwitch {...args} checked />,
};

export const Invalid: Story = {
  args: { invalid: true, label: "Auto-dispatch on exception (requires review)" },
  render: (args) => <ControlledSwitch {...args} />,
};

export const Small: Story = {
  args: { size: "sm" },
  render: (args) => <ControlledSwitch {...args} checked />,
};

export const Large: Story = {
  args: { size: "lg" },
  render: (args) => <ControlledSwitch {...args} checked />,
};

export const FocusVisible: Story = {
  render: (args) => <ControlledSwitch {...args} />,
  parameters: { pseudo: { focusVisible: true } },
};
