import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/nextjs";
import { FileText, Package, Truck } from "lucide-react";
import { Tabs, TabPanel, type TabItem } from "./tabs";

/**
 * **Tabs** — organizes related categories of content within the same page
 * without changing overall location. Keep labels short and parallel; poor
 * fit for side-by-side comparison of categories.
 */
const meta: Meta<typeof Tabs> = {
  title: "UI/Tabs",
  component: Tabs,
  argTypes: {
    size: { control: "select", options: ["sm", "md", "lg"] },
    variant: { control: "select", options: ["underline", "pill"] },
  },
};

export default meta;
type Story = StoryObj<typeof Tabs>;

const ITEMS: TabItem[] = [
  { value: "details", label: "Details" },
  { value: "documents", label: "Documents" },
  { value: "history", label: "History" },
  { value: "archived", label: "Archived", disabled: true },
];

function Controlled(props: Partial<React.ComponentProps<typeof Tabs>>) {
  const [value, setValue] = useState(props.value ?? "details");
  return (
    <Tabs items={ITEMS} value={value} onChange={setValue} {...props}>
      <TabPanel value="details">Shipment details panel content.</TabPanel>
      <TabPanel value="documents">Documents panel content.</TabPanel>
      <TabPanel value="history">History panel content.</TabPanel>
    </Tabs>
  );
}

export const Underline: Story = { render: () => <Controlled variant="underline" /> };
export const Pill: Story = { render: () => <Controlled variant="pill" /> };

export const Small: Story = { render: () => <Controlled size="sm" /> };
export const Medium: Story = { render: () => <Controlled size="md" /> };
export const Large: Story = { render: () => <Controlled size="lg" /> };

export const WithIcons: Story = {
  render: () => (
    <Controlled
      items={
        [
          { value: "details", label: "Details", icon: <Package /> },
          { value: "documents", label: "Documents", icon: <FileText /> },
          { value: "history", label: "History", icon: <Truck /> },
        ] as TabItem[]
      }
    />
  ),
};

export const DisabledTab: Story = { render: () => <Controlled /> };

export const FocusVisible: Story = {
  render: () => <Controlled />,
  parameters: { pseudo: { focusVisible: true } },
};

export const ManyTabsOverflow: Story = {
  name: "Overflow — wrapping",
  render: () => (
    <div className="max-w-md">
      <Controlled
        items={
          Array.from({ length: 8 }, (_, i) => ({ value: `tab-${i}`, label: `Category ${i + 1}` })) as TabItem[]
        }
      />
    </div>
  ),
};
