import type { Meta, StoryObj } from "@storybook/nextjs";
import { Link } from "./link";

/**
 * **Link** — use for navigation to another page, route, section, or external
 * resource. Do not style a Button as a Link (or vice versa) without matching
 * semantics — assistive tech treats them differently.
 */
const meta: Meta<typeof Link> = {
  title: "UI/Link",
  component: Link,
  args: {
    href: "/shipments",
    children: "View all shipments",
  },
};

export default meta;
type Story = StoryObj<typeof Link>;

export const Default: Story = {};
export const External: Story = {
  args: { href: "https://example.com/tracking", external: true, children: "Track on carrier site" },
};
export const Inline: Story = {
  args: {
    inline: true,
    children: "contact support",
  },
  decorators: [
    (Story) => (
      <p className="text-body-m text-fg-secondary">
        If this shipment is delayed, please <Story /> for assistance.
      </p>
    ),
  ],
};
export const Visited: Story = { args: { visited: true } };
export const Disabled: Story = { args: { disabled: true, children: "Archived route (unavailable)" } };
