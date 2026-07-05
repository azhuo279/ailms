import type { Meta, StoryObj } from "@storybook/nextjs";
import { Plus, ArrowRight, Search, X, Pin } from "lucide-react";
import { Button } from "./button";

/**
 * **Button** — trigger a primary or secondary action in the current view.
 * Use for submit, save, create, assign, confirm, or run actions. Use **Link**
 * instead when the intent is navigation, not action.
 *
 * Set `iconOnly` to render the square, label-less configuration — space-constrained
 * or universally recognizable actions like search, close, refresh, or pin. This
 * replaces what was previously a separate `IconButton` component: same variant/size/
 * state system, just a square footprint and a required `aria-label` in place of
 * visible `children`.
 */
const meta: Meta<typeof Button> = {
  title: "UI/Button",
  component: Button,
  args: {
    children: "Save changes",
    variant: "primary",
    size: "md",
  },
  argTypes: {
    variant: { control: "select", options: ["primary", "secondary", "ghost"] },
    size: { control: "select", options: ["sm", "md", "lg"] },
  },
};

export default meta;
type Story = StoryObj<typeof Button>;

// ---------------------------------------------------------------------------
// Labeled configuration — variant axis
// ---------------------------------------------------------------------------
export const Primary: Story = { args: { variant: "primary" } };
export const Secondary: Story = { args: { variant: "secondary" } };
export const Ghost: Story = { args: { variant: "ghost" } };
export const Destructive: Story = { args: { destructive: true, children: "Delete shipment" } };

// ---------------------------------------------------------------------------
// Labeled configuration — size axis
// ---------------------------------------------------------------------------
export const Small: Story = { args: { size: "sm" } };
export const Medium: Story = { args: { size: "md" } };
export const Large: Story = { args: { size: "lg" } };

// ---------------------------------------------------------------------------
// Labeled configuration — interaction states
// ---------------------------------------------------------------------------
export const Default: Story = { args: {} };
export const Hover: Story = {
  args: {},
  parameters: { pseudo: { hover: true } },
};
export const FocusVisible: Story = {
  args: {},
  parameters: { pseudo: { focusVisible: true } },
};
export const Active: Story = {
  args: {},
  parameters: { pseudo: { active: true } },
};
export const Disabled: Story = { args: { disabled: true } };
export const Loading: Story = { args: { isLoading: true } };
export const Selected: Story = { args: { isSelected: true, children: "Filters" } };

// ---------------------------------------------------------------------------
// Labeled configuration — icon slots
// ---------------------------------------------------------------------------
export const WithLeadingIcon: Story = {
  args: { leadingIcon: <Plus />, children: "Create order" },
};
export const WithTrailingIcon: Story = {
  args: { trailingIcon: <ArrowRight />, children: "Next step" },
};

// ---------------------------------------------------------------------------
// Icon-only configuration (merged from the former standalone Icon Button)
// ---------------------------------------------------------------------------
export const IconOnlyDefault: Story = {
  args: { iconOnly: true, icon: <Search />, "aria-label": "Search", variant: "ghost", children: undefined },
};
export const IconOnlyPrimary: Story = {
  args: { iconOnly: true, icon: <Pin />, "aria-label": "Pin", variant: "primary", children: undefined },
};
export const IconOnlySecondary: Story = {
  args: { iconOnly: true, icon: <Pin />, "aria-label": "Pin", variant: "secondary", children: undefined },
};
export const IconOnlyGhost: Story = {
  args: { iconOnly: true, icon: <X />, "aria-label": "Close", variant: "ghost", children: undefined },
};
export const IconOnlySmall: Story = {
  args: { iconOnly: true, icon: <X />, "aria-label": "Close", size: "sm", children: undefined },
};
export const IconOnlyLarge: Story = {
  args: { iconOnly: true, icon: <X />, "aria-label": "Close", size: "lg", children: undefined },
};
export const IconOnlyHover: Story = {
  args: { iconOnly: true, icon: <Search />, "aria-label": "Search", children: undefined },
  parameters: { pseudo: { hover: true } },
};
export const IconOnlyFocusVisible: Story = {
  args: { iconOnly: true, icon: <Search />, "aria-label": "Search", children: undefined },
  parameters: { pseudo: { focusVisible: true } },
};
export const IconOnlyDisabled: Story = {
  args: { iconOnly: true, icon: <Search />, "aria-label": "Search", disabled: true, children: undefined },
};
export const IconOnlyLoading: Story = {
  args: { iconOnly: true, icon: <Search />, "aria-label": "Search", isLoading: true, children: undefined },
};
export const IconOnlySelected: Story = {
  args: { iconOnly: true, icon: <Pin />, "aria-label": "Pin", isSelected: true, children: undefined },
};
export const IconOnlyDestructive: Story = {
  args: { iconOnly: true, icon: <X />, "aria-label": "Remove", destructive: true, children: undefined },
};
