import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/nextjs";
import { Mail } from "lucide-react";
import { TextField } from "./text-field";

/**
 * **Text Field** — single-line freeform input for references, IDs, names,
 * cities, tracking numbers, license plates, and carrier codes.
 */
const meta: Meta<typeof TextField> = {
  title: "UI/TextField",
  component: TextField,
  args: {
    label: "Tracking number",
    placeholder: "e.g. 1Z999AA10123456784",
  },
  argTypes: {
    status: {
      control: "select",
      options: ["default", "invalid", "warning", "success"],
    },
  },
};

export default meta;
type Story = StoryObj<typeof TextField>;

function Controlled(props: React.ComponentProps<typeof TextField>) {
  const [value, setValue] = useState(props.value ?? "");
  return <TextField {...props} value={value} onChange={(e) => setValue(e.target.value)} />;
}

export const Default: Story = { render: (args) => <Controlled {...args} /> };

export const Hover: Story = {
  render: (args) => <Controlled {...args} />,
  parameters: { pseudo: { hover: true } },
};

export const FocusVisible: Story = {
  render: (args) => <Controlled {...args} />,
  parameters: { pseudo: { focusVisible: true } },
};

export const Filled: Story = {
  render: (args) => <Controlled {...args} value="1Z999AA10123456784" />,
};

export const Empty: Story = {
  render: (args) => <Controlled {...args} value="" />,
};

export const Disabled: Story = {
  render: (args) => <Controlled {...args} disabled value="1Z999AA10123456784" />,
};

export const Invalid: Story = {
  render: (args) => (
    <Controlled
      {...args}
      status="invalid"
      validationText="Tracking number is required."
    />
  ),
};

export const ReadOnly: Story = {
  render: (args) => <Controlled {...args} readOnly value="1Z999AA10123456784" />,
};

export const Success: Story = {
  render: (args) => (
    <Controlled {...args} status="success" validationText="Tracking number verified." value="1Z999AA10123456784" />
  ),
};

export const Warning: Story = {
  render: (args) => (
    <Controlled
      {...args}
      status="warning"
      validationText="This carrier code looks unusual — double-check it."
      value="XZ-000"
    />
  ),
};

export const CharacterCount: Story = {
  render: (args) => (
    <Controlled
      {...args}
      label="Reference note"
      placeholder="Add a short reference"
      showCharacterCount
      maxLength={40}
      value="Dock 4, hold for inspection"
    />
  ),
};

export const PrefixSuffix: Story = {
  render: (args) => (
    <Controlled
      {...args}
      label="Email"
      placeholder="name@company.com"
      prefix={<Mail className="size-4" />}
      suffix={<span className="text-caption">.com</span>}
    />
  ),
};

export const Password: Story = {
  render: (args) => <Controlled {...args} label="Password" type="password" placeholder="Enter password" value="hunter2" />,
};
