import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/nextjs";
import { RadioGroup, type RadioOption } from "./radio-group";

const priorityOptions: RadioOption[] = [
  { label: "Standard", value: "standard" },
  { label: "Expedited", value: "expedited" },
  { label: "Same-day", value: "same-day", disabled: true },
];

/**
 * **Radio Group** — exactly one option from a short, mutually exclusive set.
 * Prefers a vertical layout for scanability and localization.
 */
const meta: Meta<typeof RadioGroup> = {
  title: "UI/RadioGroup",
  component: RadioGroup,
  args: {
    name: "priority",
    label: "Shipment priority",
    options: priorityOptions,
  },
};

export default meta;
type Story = StoryObj<typeof RadioGroup>;

function ControlledRadioGroup(props: React.ComponentProps<typeof RadioGroup>) {
  const [value, setValue] = useState(props.value ?? "standard");
  return <RadioGroup {...props} value={value} onChange={setValue} />;
}

export const Default: Story = {
  render: (args) => <ControlledRadioGroup {...args} />,
};

export const Checked: Story = {
  render: (args) => <ControlledRadioGroup {...args} value="expedited" />,
};

export const Disabled: Story = {
  args: { disabled: true },
  render: (args) => <ControlledRadioGroup {...args} />,
};

export const Invalid: Story = {
  args: { invalid: true, helperText: "Select a priority to continue." },
  render: (args) => <ControlledRadioGroup {...args} value={undefined} />,
};

export const ReadOnly: Story = {
  args: { readOnly: true },
  render: (args) => <ControlledRadioGroup {...args} value="standard" />,
};

export const FocusVisible: Story = {
  render: (args) => <ControlledRadioGroup {...args} />,
  parameters: { pseudo: { focusVisible: true } },
};
