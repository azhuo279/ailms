import type { Meta, StoryObj } from "@storybook/nextjs";
import { Truck } from "lucide-react";
import { Tag } from "./tag";

/**
 * **Tag** — label, categorize, or represent an applied value, especially
 * filter tokens and selected entities. Unlike Badge (system-owned status/
 * count), a Tag represents a user-picked or removable value — e.g. an active
 * filter, a selected carrier, or an applied category.
 */
const meta: Meta<typeof Tag> = {
  title: "UI/Tag",
  component: Tag,
  args: {
    children: "Ground freight",
    tone: "neutral",
    size: "md",
  },
  argTypes: {
    tone: { control: "select", options: ["neutral", "success", "warning", "danger"] },
    size: { control: "select", options: ["sm", "md"] },
  },
};

export default meta;
type Story = StoryObj<typeof Tag>;

// ---------------------------------------------------------------------------
// Semantic tone axis
// ---------------------------------------------------------------------------
export const Neutral: Story = { args: { tone: "neutral" } };
export const Success: Story = { args: { tone: "success", children: "On schedule" } };
export const Warning: Story = { args: { tone: "warning", children: "At risk" } };
export const Danger: Story = { args: { tone: "danger", children: "Blocked" } };

// ---------------------------------------------------------------------------
// Size axis
// ---------------------------------------------------------------------------
export const Small: Story = { args: { size: "sm" } };
export const Medium: Story = { args: { size: "md" } };

// ---------------------------------------------------------------------------
// States
// ---------------------------------------------------------------------------
export const Default: Story = { args: {} };
export const FocusVisible: Story = {
  args: { onClick: () => {} },
  parameters: { pseudo: { focusVisible: true } },
};
export const Selected: Story = { args: { onClick: () => {}, isSelected: true } };
export const Disabled: Story = { args: { onRemove: () => {}, disabled: true } };

// ---------------------------------------------------------------------------
// Composable slots
// ---------------------------------------------------------------------------
export const WithLeadingIcon: Story = {
  args: { leadingIcon: <Truck />, children: "Carrier: Swift Line" },
};
export const Dismissible: Story = {
  args: { onRemove: () => {}, children: "Status: Delayed" },
};
export const InteractiveToggle: Story = {
  args: { onClick: () => {}, children: "Warehouse: SEA-4" },
};
