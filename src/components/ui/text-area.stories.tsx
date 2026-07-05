import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/nextjs";
import { TextArea } from "./text-area";

/**
 * **Text Area** — multi-line freeform input for notes, instructions, issue
 * descriptions, exception handling, and dispatch comments.
 */
const meta: Meta<typeof TextArea> = {
  title: "UI/TextArea",
  component: TextArea,
  args: {
    label: "Dispatch notes",
    placeholder: "Add any handling instructions or exceptions",
  },
  argTypes: {
    status: {
      control: "select",
      options: ["default", "invalid", "warning", "success"],
    },
    resize: {
      control: "select",
      options: ["none", "vertical", "both"],
    },
  },
};

export default meta;
type Story = StoryObj<typeof TextArea>;

function Controlled(props: React.ComponentProps<typeof TextArea>) {
  const [value, setValue] = useState(props.value ?? "");
  return <TextArea {...props} value={value} onChange={(e) => setValue(e.target.value)} />;
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

export const Disabled: Story = {
  render: (args) => <Controlled {...args} disabled value="Hold at dock 4 pending inspection." />,
};

export const Invalid: Story = {
  render: (args) => (
    <Controlled {...args} status="invalid" validationText="Notes are required for exception holds." />
  ),
};

export const ReadOnly: Story = {
  render: (args) => <Controlled {...args} readOnly value="Hold at dock 4 pending inspection." />,
};

export const Success: Story = {
  render: (args) => (
    <Controlled {...args} status="success" validationText="Notes saved." value="Released after inspection." />
  ),
};

export const Warning: Story = {
  render: (args) => (
    <Controlled
      {...args}
      status="warning"
      validationText="This note references a carrier not on file."
      value="Handed off to ACME Freight, unlisted carrier code."
    />
  ),
};

export const ResizeNone: Story = {
  render: (args) => <Controlled {...args} resize="none" />,
};

export const CharacterCount: Story = {
  render: (args) => (
    <Controlled
      {...args}
      showCharacterCount
      maxLength={200}
      value="Pallet count mismatch on arrival, flagged for warehouse review."
    />
  ),
};
