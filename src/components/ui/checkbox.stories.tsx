import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/nextjs";
import { Checkbox } from "./checkbox";

/**
 * **Checkbox** — multiple selection in a group, or a single yes/no
 * consent-style control.
 */
const meta: Meta<typeof Checkbox> = {
  title: "UI/Checkbox",
  component: Checkbox,
  args: {
    label: "Include archived shipments",
  },
};

export default meta;
type Story = StoryObj<typeof Checkbox>;

function ControlledCheckbox(props: React.ComponentProps<typeof Checkbox>) {
  const [checked, setChecked] = useState(props.checked ?? false);
  return <Checkbox {...props} checked={checked} onChange={setChecked} />;
}

export const Unchecked: Story = {
  render: (args) => <ControlledCheckbox {...args} />,
};

export const Checked: Story = {
  render: (args) => <ControlledCheckbox {...args} checked />,
};

export const Indeterminate: Story = {
  args: { label: "Select all stops" },
  render: (args) => <Checkbox {...args} indeterminate />,
};

export const Disabled: Story = {
  args: { disabled: true },
  render: (args) => <ControlledCheckbox {...args} />,
};

export const DisabledChecked: Story = {
  args: { disabled: true },
  render: (args) => <ControlledCheckbox {...args} checked />,
};

export const Invalid: Story = {
  args: { invalid: true, label: "I agree to the carrier terms" },
  render: (args) => <ControlledCheckbox {...args} />,
};

export const Small: Story = {
  args: { size: "sm" },
  render: (args) => <ControlledCheckbox {...args} />,
};

export const Large: Story = {
  args: { size: "lg" },
  render: (args) => <ControlledCheckbox {...args} />,
};

export const FocusVisible: Story = {
  render: (args) => <ControlledCheckbox {...args} />,
  parameters: { pseudo: { focusVisible: true } },
};
