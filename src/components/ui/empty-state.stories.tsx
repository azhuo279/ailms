import type { Meta, StoryObj } from "@storybook/nextjs";
import { PackageX, SearchX, ShieldAlert, AlertTriangle } from "lucide-react";
import { EmptyState } from "./empty-state";
import { Button } from "./button";

/**
 * **Empty State** — replaces a content area when there is no data, no
 * search results, no access, or no configured setup. Replace the absent
 * component itself (e.g. the whole table), not just its header.
 *
 * `variant="default"` renders a layered, token-colored ring illustration
 * with a staggered entrance (rings → glyph → text → actions). `variant="error"`
 * renders the flattest possible treatment — no rings, no stagger, only a
 * quick fade — because illustration and motion weight should scale down
 * with severity, not stay constant across every "nothing to show" context.
 */
const meta: Meta<typeof EmptyState> = {
  title: "UI/EmptyState",
  component: EmptyState,
  args: {
    title: "No shipments yet",
    description: "Shipments you create will show up here once they're dispatched.",
  },
};

export default meta;
type Story = StoryObj<typeof EmptyState>;

export const NoData: Story = {
  args: {
    primaryAction: <Button size="sm">Create shipment</Button>,
  },
};

export const FilteredEmpty: Story = {
  args: {
    icon: <SearchX className="size-5" />,
    title: "No results match your filters",
    description: "Try widening the date range or clearing a filter.",
    primaryAction: <Button size="sm" variant="secondary">Clear filters</Button>,
  },
};

export const PermissionEmpty: Story = {
  args: {
    icon: <ShieldAlert className="size-5" />,
    title: "You don't have access to this view",
    description: "Ask a workspace admin to grant you the Fleet Ops role.",
    primaryAction: <Button size="sm" variant="secondary">Request access</Button>,
  },
};

export const FirstRunEmpty: Story = {
  args: {
    icon: <PackageX className="size-5" />,
    title: "Set up your first route",
    description: "Routes group stops so dispatch can plan loads efficiently.",
    primaryAction: <Button size="sm">Create route</Button>,
    secondaryAction: <Button size="sm" variant="ghost">Learn more</Button>,
  },
};

/**
 * `variant="error"` — the flattest treatment in the set. No layered rings,
 * no entrance stagger, just a quick fade on a flat danger-toned icon well.
 * Reserve this for genuine failures (a failed request, a load error), never
 * for a merely-empty-but-fine state like an empty exception queue.
 */
export const ErrorState: Story = {
  args: {
    variant: "error",
    icon: <AlertTriangle className="size-5" />,
    title: "Couldn't load shipments",
    description: "Something went wrong on our end. Please try again.",
    primaryAction: <Button size="sm">Retry</Button>,
  },
};

export const NoIcon: Story = {
  args: {
    icon: null,
    title: "Nothing to show",
  },
};

/**
 * Demonstrates the reduced-motion fallback. Every entrance animation in
 * `variant="default"` is gated with Tailwind's `motion-safe:` variant (which
 * maps to `@media (prefers-reduced-motion: no-preference)`), so there is no
 * separate reduced-motion code path to opt into here — the same markup
 * renders instantly with no ring/glyph/text/action stagger once the OS-level
 * "reduce motion" setting is on. To verify: enable "Reduce motion" in your
 * OS accessibility settings (or emulate it via your browser devtools'
 * rendering panel), then reload this story.
 */
export const ReducedMotion: Story = {
  args: {
    icon: <PackageX className="size-5" />,
    title: "Set up your first route",
    description:
      'Routes group stops so dispatch can plan loads efficiently. With the OS-level "reduce motion" setting enabled, this renders instantly with no ring, glyph, or text stagger.',
    primaryAction: <Button size="sm">Create route</Button>,
    secondaryAction: <Button size="sm" variant="ghost">Learn more</Button>,
  },
};
