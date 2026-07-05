import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/nextjs";
import { Combobox, type ComboboxOption } from "./combobox";

const cityOptions: ComboboxOption[] = [
  { label: "Chicago, IL", value: "chi" },
  { label: "Columbus, OH", value: "cmh" },
  { label: "Charlotte, NC", value: "clt" },
  { label: "Cincinnati, OH", value: "cvg" },
  { label: "Cleveland, OH", value: "cle" },
  { label: "Dallas, TX", value: "dal", disabled: true },
];

/**
 * **Combobox** — typing plus a suggestion list, optionally multi-select or
 * freeform entry. Use for long option lists or typeahead selection.
 */
const meta: Meta<typeof Combobox> = {
  title: "UI/Combobox",
  component: Combobox,
  args: {
    label: "Destination city",
    options: cityOptions,
    placeholder: "Search cities...",
  },
};

export default meta;
type Story = StoryObj<typeof Combobox>;

function ControlledCombobox(props: React.ComponentProps<typeof Combobox>) {
  const [value, setValue] = useState(props.value);
  const [inputValue, setInputValue] = useState("");
  return (
    <Combobox
      {...props}
      value={value}
      onChange={setValue}
      inputValue={inputValue}
      onInputChange={setInputValue}
    />
  );
}

export const Default: Story = {
  render: (args) => <ControlledCombobox {...args} />,
};

export const Selected: Story = {
  render: (args) => <ControlledCombobox {...args} value="cmh" />,
};

export const Multiselect: Story = {
  args: { multiple: true, label: "Destination cities" },
  render: (args) => <ControlledCombobox {...args} value={["chi", "cle"]} />,
};

export const FreeformEntry: Story = {
  args: { freeform: true, label: "Add a city", helperText: "Type a city and press Enter to add it." },
  render: (args) => <ControlledCombobox {...args} />,
};

export const Loading: Story = {
  args: { isLoading: true },
  render: (args) => <ControlledCombobox {...args} />,
};

export const NoMatches: Story = {
  render: (args) => <ControlledCombobox {...args} inputValue="zzz" />,
};

export const Invalid: Story = {
  args: { status: "invalid", validationText: "Select a valid destination city." },
  render: (args) => <ControlledCombobox {...args} />,
};

export const Disabled: Story = {
  args: { disabled: true },
  render: (args) => <ControlledCombobox {...args} value="chi" />,
};

export const ReadOnly: Story = {
  args: { readOnly: true },
  render: (args) => <ControlledCombobox {...args} value="chi" />,
};

export const Warning: Story = {
  args: { status: "warning", validationText: "This destination has limited carrier coverage." },
  render: (args) => <ControlledCombobox {...args} value="cmh" />,
};

export const Success: Story = {
  args: { status: "success", validationText: "Destination confirmed." },
  render: (args) => <ControlledCombobox {...args} value="cle" />,
};
