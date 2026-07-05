import type { Meta, StoryObj } from "@storybook/nextjs";
import { Field } from "./field";

/**
 * **Field** — wrapper for any form control that needs a label, helper text,
 * validation, and required/optional treatment. Labels and instructions are
 * always visible, never placeholder-only.
 */
const meta: Meta<typeof Field> = {
  title: "UI/Field",
  component: Field,
  args: {
    label: "Tracking number",
    helperText: "Enter the carrier-issued tracking ID.",
  },
};

export default meta;
type Story = StoryObj<typeof Field>;

const baseInput = (className = "") =>
  ({ inputId, describedBy }: { inputId: string; describedBy?: string }) => (
    <input
      id={inputId}
      aria-describedby={describedBy}
      className={`h-10 rounded-md border border-border-subtle bg-surface-raised px-3 text-body-m text-fg-primary outline-none focus-visible:ring-2 focus-visible:ring-focus-ring ${className}`}
      placeholder="e.g. 1Z999AA10123456784"
    />
  );

export const Default: Story = { args: { children: baseInput() } };
export const Required: Story = { args: { required: true, children: baseInput() } };
export const OptionalField: Story = { args: { optional: true, children: baseInput() } };
export const Disabled: Story = {
  args: { disabled: true, children: baseInput("bg-surface-disabled text-fg-disabled") },
};
export const ReadOnly: Story = { args: { readOnly: true, children: baseInput() } };
export const Invalid: Story = {
  args: {
    status: "invalid",
    validationText: "Tracking number is required.",
    children: baseInput("border-danger-border"),
  },
};
export const Warning: Story = {
  args: {
    status: "warning",
    validationText: "This carrier code looks unusual — double-check it.",
    children: baseInput("border-warning-border"),
  },
};
export const Success: Story = {
  args: {
    status: "success",
    validationText: "Tracking number verified.",
    children: baseInput("border-success-border"),
  },
};
