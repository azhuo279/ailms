import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/nextjs";
import { DateRangePicker, type DateRange, type DateRangePickerProps } from "./date-range-picker";

function Controlled(props: DateRangePickerProps) {
  const [value, setValue] = useState<DateRange>(props.value);
  return <DateRangePicker {...props} value={value} onChange={setValue} />;
}

const meta: Meta<typeof DateRangePicker> = {
  title: "UI/DateRangePicker",
  component: DateRangePicker,
  render: (args) => <Controlled {...args} />,
  args: {
    label: "Reporting period",
    value: { start: null, end: null },
  },
};

export default meta;
type Story = StoryObj<typeof DateRangePicker>;

export const Default: Story = {};

export const StartSelected: Story = {
  args: { value: { start: new Date(2026, 6, 10), end: null } },
};

export const EndSelected: Story = {
  args: { value: { start: new Date(2026, 6, 1), end: new Date(2026, 6, 10) } },
};

export const Open: Story = {
  render: (args) => {
    function OpenExample() {
      const [value, setValue] = useState<DateRange>({
        start: new Date(2026, 6, 1),
        end: new Date(2026, 6, 10),
      });
      return (
        <div>
          <DateRangePicker {...args} value={value} onChange={setValue} />
          <p className="pt-2 text-caption text-fg-muted">
            Click the field above to open the range calendar popover.
          </p>
        </div>
      );
    }
    return <OpenExample />;
  },
};

export const Disabled: Story = {
  args: {
    value: { start: new Date(2026, 6, 1), end: new Date(2026, 6, 10) },
    disabled: true,
  },
};

export const PresetRanges: Story = {
  args: { value: { start: null, end: null }, showPresets: true },
};

export const PartialSelection: Story = {
  args: { value: { start: new Date(2026, 6, 5), end: null } },
};

export const Invalid: Story = {
  args: {
    value: { start: null, end: null },
    status: "invalid",
    validationText: "Select a start and end date.",
  },
};

export const Warning: Story = {
  args: {
    value: { start: new Date(2026, 6, 1), end: new Date(2026, 6, 10) },
    status: "warning",
    validationText: "This range spans a holiday weekend.",
  },
};

export const Success: Story = {
  args: {
    value: { start: new Date(2026, 6, 1), end: new Date(2026, 6, 10) },
    status: "success",
    validationText: "Reporting period confirmed.",
  },
};

export const ReadOnly: Story = {
  args: {
    value: { start: new Date(2026, 6, 1), end: new Date(2026, 6, 10) },
    readOnly: true,
  },
};
