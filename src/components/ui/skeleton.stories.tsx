import type { Meta, StoryObj } from "@storybook/nextjs";
import { Skeleton } from "./skeleton";

/**
 * **Skeleton** — a content-shape placeholder shown while data loads, used on
 * container/data surfaces (cards, tables, lists) rather than on toasts,
 * dropdown options, or a modal's own shell.
 */
const meta: Meta<typeof Skeleton> = {
  title: "UI/Skeleton",
  component: Skeleton,
  args: {
    variant: "line",
  },
  argTypes: {
    variant: { control: "select", options: ["line", "block", "avatar", "card", "table-row"] },
  },
};

export default meta;
type Story = StoryObj<typeof Skeleton>;

export const Line: Story = { args: { variant: "line" } };
export const Block: Story = { args: { variant: "block" } };
export const Avatar: Story = { args: { variant: "avatar" } };
export const Card: Story = { args: { variant: "card" } };
export const TableRow: Story = { args: { variant: "table-row" } };

export const CardShellComposition: Story = {
  render: () => (
    <div className="w-80 rounded-lg border border-border-subtle bg-surface-raised p-4 shadow-sm">
      <div className="flex items-center gap-3">
        <Skeleton variant="avatar" />
        <div className="flex-1 space-y-2">
          <Skeleton variant="line" className="w-1/2" />
          <Skeleton variant="line" className="w-1/3" />
        </div>
      </div>
      <div className="mt-4 space-y-2">
        <Skeleton variant="line" />
        <Skeleton variant="line" className="w-5/6" />
        <Skeleton variant="line" className="w-2/3" />
      </div>
    </div>
  ),
};

export const TableRowsComposition: Story = {
  render: () => (
    <div className="w-96 space-y-2 rounded-lg border border-border-subtle bg-surface-raised p-3">
      <Skeleton variant="table-row" />
      <Skeleton variant="table-row" />
      <Skeleton variant="table-row" />
    </div>
  ),
};
