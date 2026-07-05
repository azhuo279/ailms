import type { Meta, StoryObj } from "@storybook/nextjs";
import { MoreVertical, Package } from "lucide-react";
import { Card, CardBody, CardFooter, CardHeader } from "./card";
import { Button } from "./button";
import { Badge } from "./badge";

/**
 * **Card** — container for a single concept or object: summaries, KPI
 * modules, quick actions, or grouped detail blocks. Elevation reads via
 * shadow, not a darker fill. Keep content brief and action-oriented.
 */
const meta: Meta<typeof Card> = {
  title: "UI/Card",
  component: Card,
};

export default meta;
type Story = StoryObj<typeof Card>;

export const Default: Story = {
  render: () => (
    <Card className="w-80">
      <CardHeader title="Shipment #4471829" description="Ground freight — Seattle to Denver" />
      <CardBody>Picked up 2 hours ago. On schedule for tomorrow's delivery window.</CardBody>
    </Card>
  ),
};

export const WithMediaAndActions: Story = {
  render: () => (
    <Card className="w-80">
      <CardHeader
        media={<Package className="size-5" />}
        title="Order #4471829"
        description="12 pallets — refrigerated"
        actions={<Button iconOnly variant="ghost" size="sm" icon={<MoreVertical />} aria-label="More actions" />}
      />
      <CardBody>
        <Badge tone="intransit">In transit</Badge>
      </CardBody>
    </Card>
  ),
};

export const WithFooterActions: Story = {
  render: () => (
    <Card className="w-80">
      <CardHeader title="Approve exception" description="Customs hold requires dispatcher sign-off" />
      <CardFooter>
        <Button variant="ghost" size="sm">
          Dismiss
        </Button>
        <Button variant="primary" size="sm">
          Approve
        </Button>
      </CardFooter>
    </Card>
  ),
};

export const Hover: Story = {
  render: () => (
    <Card className="w-80" onClick={() => {}}>
      <CardHeader title="Shipment #4471829" description="Tap to view details" />
    </Card>
  ),
  parameters: { pseudo: { hover: true } },
};

export const FocusVisible: Story = {
  render: () => (
    <Card className="w-80" onClick={() => {}}>
      <CardHeader title="Shipment #4471829" description="Tap to view details" />
    </Card>
  ),
  parameters: { pseudo: { focusVisible: true } },
};

export const Selected: Story = {
  render: () => (
    <Card className="w-80" onClick={() => {}} selected>
      <CardHeader title="Shipment #4471829" description="Currently selected" />
    </Card>
  ),
};

export const Loading: Story = {
  render: () => (
    <Card className="w-80" isLoading>
      <CardHeader title="Shipment #4471829" description="Ground freight — Seattle to Denver" />
    </Card>
  ),
};

export const Compact: Story = {
  render: () => (
    <Card className="w-80" padding="compact">
      <CardHeader title="Compact card" description="Tighter padding for dense layouts" />
    </Card>
  ),
};
