import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/nextjs";
import { NumberField } from "./number-field";

/**
 * **Number Field** — precise numeric entry with small controlled increments,
 * such as package count, pallet count, threshold, or dwell-time minutes.
 * Always allows typed entry in addition to the step buttons.
 */
const meta: Meta<typeof NumberField> = {
  title: "UI/NumberField",
  component: NumberField,
  args: {
    label: "Pallet count",
    min: 0,
    max: 20,
    step: 1,
  },
  argTypes: {
    status: {
      control: "select",
      options: ["default", "invalid", "warning", "success"],
    },
  },
};

export default meta;
type Story = StoryObj<typeof NumberField>;

function Controlled(props: React.ComponentProps<typeof NumberField>) {
  const [value, setValue] = useState<number | undefined>(props.value);
  return <NumberField {...props} value={value} onChange={setValue} />;
}

export const Default: Story = { render: (args) => <Controlled {...args} value={4} /> };

export const Hover: Story = {
  render: (args) => <Controlled {...args} value={4} />,
  parameters: { pseudo: { hover: true } },
};

export const FocusVisible: Story = {
  render: (args) => <Controlled {...args} value={4} />,
  parameters: { pseudo: { focusVisible: true } },
};

export const Disabled: Story = {
  render: (args) => <Controlled {...args} disabled value={4} />,
};

export const Invalid: Story = {
  render: (args) => (
    <Controlled {...args} status="invalid" validationText="Pallet count must be greater than 0." value={0} />
  ),
};

export const ReadOnly: Story = {
  render: (args) => <Controlled {...args} readOnly value={4} />,
};

export const Warning: Story = {
  render: (args) => (
    <Controlled
      {...args}
      status="warning"
      validationText="This count is unusually high for this route."
      value={18}
    />
  ),
};

export const Success: Story = {
  render: (args) => (
    <Controlled {...args} status="success" validationText="Count matches the manifest." value={12} />
  ),
};

export const MinReached: Story = {
  render: (args) => <Controlled {...args} value={0} />,
};

export const MaxReached: Story = {
  render: (args) => <Controlled {...args} value={20} />,
};

export const WithUnit: Story = {
  render: (args) => (
    <Controlled {...args} label="Dwell time" min={0} max={180} step={5} unit="min" value={45} />
  ),
};
