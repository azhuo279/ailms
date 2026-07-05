import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/nextjs";
import { Select, type SelectOption } from "./select";

const carrierOptions: SelectOption[] = [
  { label: "FedEx Freight", value: "fedex" },
  { label: "UPS Ground", value: "ups" },
  { label: "DHL Express", value: "dhl" },
  { label: "Old Dominion", value: "odfl", disabled: true },
  { label: "XPO Logistics", value: "xpo" },
];

/**
 * **Select** — single-choice form control from a known option set, especially
 * for form submission and mobile-friendly interaction.
 */
const meta: Meta<typeof Select> = {
  title: "UI/Select",
  component: Select,
  args: {
    label: "Carrier",
    options: carrierOptions,
    placeholder: "Choose a carrier",
  },
};

export default meta;
type Story = StoryObj<typeof Select>;

function ControlledSelect(props: React.ComponentProps<typeof Select>) {
  const [value, setValue] = useState(props.value);
  return <Select {...props} value={value} onChange={setValue} />;
}

export const Default: Story = {
  render: (args) => <ControlledSelect {...args} />,
};

export const Selected: Story = {
  render: (args) => <ControlledSelect {...args} value="ups" />,
};

export const Disabled: Story = {
  args: { disabled: true, value: "fedex" },
  render: (args) => <ControlledSelect {...args} />,
};

export const Invalid: Story = {
  args: { status: "invalid", validationText: "Select a carrier to continue." },
  render: (args) => <ControlledSelect {...args} />,
};

export const ReadOnly: Story = {
  args: { readOnly: true, value: "dhl" },
  render: (args) => <ControlledSelect {...args} />,
};

export const WithHelperText: Story = {
  args: { helperText: "Choose the carrier assigned to this load." },
  render: (args) => <ControlledSelect {...args} />,
};

export const Warning: Story = {
  args: { status: "warning", validationText: "This carrier has limited capacity this week." },
  render: (args) => <ControlledSelect {...args} value="fedex" />,
};

export const Success: Story = {
  args: { status: "success", validationText: "Carrier confirmed for this lane." },
  render: (args) => <ControlledSelect {...args} value="ups" />,
};

export const FocusVisible: Story = {
  render: (args) => <ControlledSelect {...args} />,
  parameters: { pseudo: { focusVisible: true } },
};
