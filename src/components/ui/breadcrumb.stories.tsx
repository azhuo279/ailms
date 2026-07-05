import type { Meta, StoryObj } from "@storybook/nextjs";
import { Breadcrumb } from "./breadcrumb";

/**
 * **Breadcrumb** — shows hierarchical location and supports upward
 * navigation, especially in nested operational areas such as Orders ›
 * Shipment › Stop › Document. The last item always renders as the current,
 * non-interactive page indicator.
 */
const meta: Meta<typeof Breadcrumb> = {
  title: "UI/Breadcrumb",
  component: Breadcrumb,
  args: {
    items: [
      { label: "Orders", href: "/orders" },
      { label: "Shipment #4471829", href: "/orders/4471829" },
      { label: "Proof of delivery" },
    ],
    size: "md",
  },
  argTypes: {
    size: { control: "select", options: ["sm", "md", "lg"] },
  },
};

export default meta;
type Story = StoryObj<typeof Breadcrumb>;

export const Default: Story = { args: {} };

export const Small: Story = { args: { size: "sm" } };
export const Medium: Story = { args: { size: "md" } };
export const Large: Story = { args: { size: "lg" } };

export const TwoLevels: Story = {
  args: { items: [{ label: "Shipments", href: "/shipments" }, { label: "Overview" }] },
};

export const CurrentItemOnly: Story = {
  name: "Current item (root page)",
  args: { items: [{ label: "Overview" }] },
};

export const LongLabelTruncation: Story = {
  args: {
    items: [
      { label: "Orders", href: "/orders" },
      { label: "This is a very long shipment reference that should truncate cleanly", href: "/orders/x" },
      { label: "Document" },
    ],
  },
};

export const Collapsed: Story = {
  name: "Overflow — collapsed middle",
  args: {
    collapseAfter: 3,
    items: [
      { label: "Home", href: "/" },
      { label: "Orders", href: "/orders" },
      { label: "Shipment #4471829", href: "/orders/4471829" },
      { label: "Stops", href: "/orders/4471829/stops" },
      { label: "Stop 3", href: "/orders/4471829/stops/3" },
      { label: "Proof of delivery" },
    ],
  },
};

export const FocusVisible: Story = {
  args: {},
  parameters: { pseudo: { focusVisible: true } },
};
