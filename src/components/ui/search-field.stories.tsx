import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/nextjs";
import { SearchField } from "./search-field";

/**
 * **Search Field** — dedicated query entry for global search, table search,
 * and entity lookup. Suggestion/result dropdown UI is out of scope; this
 * component owns only the input, clear action, and loading state.
 */
const meta: Meta<typeof SearchField> = {
  title: "UI/SearchField",
  component: SearchField,
  args: {
    placeholder: "Search shipments, orders, carriers…",
  },
};

export default meta;
type Story = StoryObj<typeof SearchField>;

function Controlled(props: React.ComponentProps<typeof SearchField>) {
  const [value, setValue] = useState((props.value as string) ?? "");
  return (
    <SearchField
      {...props}
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onClear={() => setValue("")}
    />
  );
}

export const Default: Story = { render: (args) => <Controlled {...args} /> };

export const FocusVisible: Story = {
  render: (args) => <Controlled {...args} />,
  parameters: { pseudo: { focusVisible: true } },
};

export const Typing: Story = {
  render: (args) => <Controlled {...args} value="SHP-10293" />,
};

export const Clearable: Story = {
  render: (args) => <Controlled {...args} value="SHP-10293" />,
};

export const Disabled: Story = {
  render: (args) => <Controlled {...args} disabled value="" />,
};

export const Loading: Story = {
  render: (args) => <Controlled {...args} isLoading value="SHP-10293" />,
};

export const BareToolbarSearch: Story = {
  render: (args) => <Controlled {...args} aria-label="Search shipments" />,
};

export const LabeledField: Story = {
  render: (args) => (
    <Controlled
      {...args}
      label="Search carriers"
      helperText="Search by carrier name or SCAC code."
    />
  ),
};

export const Invalid: Story = {
  render: (args) => (
    <Controlled
      {...args}
      label="Search carriers"
      status="invalid"
      validationText="No carrier matches that SCAC code."
      value="ZZZZZ"
    />
  ),
};

export const Success: Story = {
  render: (args) => (
    <Controlled
      {...args}
      label="Search carriers"
      status="success"
      validationText="Carrier found."
      value="FXFE"
    />
  ),
};
