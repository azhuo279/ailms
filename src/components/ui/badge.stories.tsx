import type { Meta, StoryObj } from "@storybook/nextjs";
import { Badge } from "./badge";

/**
 * **Badge** — compact, system-owned status or count indicator attached to a
 * component or object, such as unread alerts, delayed loads, or status chips
 * on rows. Use Badge for values the system computes, not user-editable
 * selections — for those, use **Tag** instead.
 */
const meta: Meta<typeof Badge> = {
  title: "UI/Badge",
  component: Badge,
  args: {
    children: "Badge",
    tone: "neutral",
    size: "md",
  },
  argTypes: {
    tone: {
      control: "select",
      options: ["neutral", "success", "warning", "danger", "intransit", "delivered", "delayed", "pending"],
    },
    size: { control: "select", options: ["sm", "md"] },
  },
};

export default meta;
type Story = StoryObj<typeof Badge>;

// ---------------------------------------------------------------------------
// Semantic tone axis
// ---------------------------------------------------------------------------
export const Neutral: Story = { args: { tone: "neutral" } };
export const Success: Story = { args: { tone: "success", children: "Success" } };
export const Warning: Story = { args: { tone: "warning", children: "Warning" } };
export const Danger: Story = { args: { tone: "danger", children: "Danger" } };

// ---------------------------------------------------------------------------
// Shipment-status ramp (reserved role — DESIGN.md §3)
// ---------------------------------------------------------------------------
export const InTransit: Story = { args: { tone: "intransit", children: "In transit" } };
export const Delivered: Story = { args: { tone: "delivered", children: "Delivered" } };
export const Delayed: Story = { args: { tone: "delayed", children: "Delayed" } };
export const Pending: Story = { args: { tone: "pending", children: "Pending" } };

// ---------------------------------------------------------------------------
// Size axis
// ---------------------------------------------------------------------------
export const Small: Story = { args: { size: "sm" } };
export const Medium: Story = { args: { size: "md" } };

// ---------------------------------------------------------------------------
// Dot-only and count variants
// ---------------------------------------------------------------------------
export const WithDot: Story = { args: { dot: true, tone: "delayed", children: "Delayed" } };
export const DotOnly: Story = { args: { dot: true, tone: "success", children: undefined } };
export const Count: Story = { args: { count: 4, tone: "danger" } };
export const CountOverflow: Story = { args: { count: 128, tone: "neutral" } };
