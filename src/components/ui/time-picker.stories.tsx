import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/nextjs";
import { TimePicker, type TimePickerProps } from "./time-picker";

function Controlled(props: TimePickerProps) {
  const [value, setValue] = useState<string | null>(props.value);
  return <TimePicker {...props} value={value} onChange={setValue} />;
}

const meta: Meta<typeof TimePicker> = {
  title: "UI/TimePicker",
  component: TimePicker,
  render: (args) => <Controlled {...args} />,
  args: {
    label: "Dock appointment time",
    value: null,
  },
};

export default meta;
type Story = StoryObj<typeof TimePicker>;

export const Default: Story = {};

export const Selected: Story = {
  args: { value: "14:30" },
};

export const FocusVisible: Story = {
  args: { value: null },
  parameters: { pseudo: { focusVisible: true } },
};

export const Open: Story = {
  render: (args) => {
    function OpenExample() {
      const [value, setValue] = useState<string | null>("09:00");
      return (
        <div>
          <TimePicker {...args} value={value} onChange={setValue} />
          <p className="pt-2 text-caption text-fg-muted">
            Click the field above to open the time list popover.
          </p>
        </div>
      );
    }
    return <OpenExample />;
  },
};

export const Disabled: Story = {
  args: { value: "14:30", disabled: true },
};

export const Invalid: Story = {
  args: {
    value: null,
    status: "invalid",
    validationText: "Dispatch cutoff time is required.",
  },
};

export const ReadOnly: Story = {
  args: { value: "14:30", readOnly: true },
};

export const Warning: Story = {
  args: {
    value: "23:30",
    status: "warning",
    validationText: "This time is outside standard warehouse hours.",
  },
};

export const FifteenMinuteStep: Story = {
  args: {
    label: "Driver handoff window",
    value: "08:15",
    minuteStep: 15,
    startTime: "06:00",
    endTime: "18:00",
  },
};

export const Success: Story = {
  args: {
    value: "14:30",
    status: "success",
    validationText: "Dock appointment confirmed.",
  },
};
