import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/nextjs";
import { DatePicker, type DatePickerProps } from "./date-picker";

function Controlled(props: DatePickerProps) {
  const [value, setValue] = useState<Date | null>(props.value);
  return <DatePicker {...props} value={value} onChange={setValue} />;
}

const meta: Meta<typeof DatePicker> = {
  title: "UI/DatePicker",
  component: DatePicker,
  render: (args) => <Controlled {...args} />,
  args: {
    label: "Delivery date",
    value: null,
  },
};

export default meta;
type Story = StoryObj<typeof DatePicker>;

export const Default: Story = {};

export const Selected: Story = {
  args: { value: new Date(2026, 6, 15) },
};

export const FocusVisible: Story = {
  args: { value: null },
  parameters: { pseudo: { focusVisible: true } },
};

export const Open: Story = {
  render: (args) => {
    function OpenExample() {
      const [value, setValue] = useState<Date | null>(new Date(2026, 6, 15));
      return (
        <div>
          <DatePicker {...args} value={value} onChange={setValue} />
          <p className="pt-2 text-caption text-fg-muted">
            Click the field above to open the calendar popover.
          </p>
        </div>
      );
    }
    return <OpenExample />;
  },
};

export const Disabled: Story = {
  args: { value: new Date(2026, 6, 15), disabled: true },
};

export const Invalid: Story = {
  args: {
    value: null,
    status: "invalid",
    validationText: "Delivery date is required.",
  },
};

export const ReadOnly: Story = {
  args: { value: new Date(2026, 6, 15), readOnly: true },
};

export const Warning: Story = {
  args: {
    value: new Date(2026, 6, 15),
    status: "warning",
    validationText: "This date falls on a weekend.",
  },
};

export const AiSuggested: Story = {
  args: {
    label: "Promised-by date",
    value: null,
    suggestedDate: new Date(2026, 6, 22),
    helperText: "Format: MM/DD/YYYY. AI suggests a date based on route history.",
  },
};

export const MinMaxRange: Story = {
  args: {
    label: "Pickup window date",
    value: null,
    minDate: new Date(2026, 6, 1),
    maxDate: new Date(2026, 6, 20),
    helperText: "Format: MM/DD/YYYY. Must fall within the active pickup window.",
  },
};

export const Success: Story = {
  args: {
    value: new Date(2026, 6, 15),
    status: "success",
    validationText: "Delivery date confirmed with the carrier.",
  },
};
