import type { Meta, StoryObj } from "@storybook/nextjs";
import { AlertCircle, AlertTriangle, CheckCircle2, Clock, MoreVertical, Package, Truck } from "lucide-react";
import { List, ListItem } from "./list";
import { Badge } from "./badge";
import { Button } from "./button";
import { Avatar } from "./avatar";

/**
 * **List** — vertically stacked items that are independent of one another
 * and quick to scan. Good for task queues, alerts, stops, or recent
 * activity. Move to **Data Table** when data needs related columns; move to
 * **Tree View** when hierarchy matters.
 */
const meta: Meta<typeof List> = {
  title: "UI/List",
  component: List,
};

export default meta;
type Story = StoryObj<typeof List>;

export const Default: Story = {
  render: () => (
    <List className="w-96">
      <ListItem
        leadingVisual={<Package className="size-4" />}
        title="Order #4471829"
        supportingText="Picked up 2 hours ago"
      />
      <ListItem
        leadingVisual={<Truck className="size-4" />}
        title="Order #4471830"
        supportingText="In transit — ETA tomorrow"
      />
      <ListItem
        leadingVisual={<AlertTriangle className="size-4" />}
        title="Order #4471831"
        supportingText="Delayed at customs"
      />
    </List>
  ),
};

export const Hover: Story = {
  render: () => (
    <List className="w-96">
      <ListItem
        onClick={() => {}}
        leadingVisual={<Package className="size-4" />}
        title="Order #4471829"
        supportingText="Picked up 2 hours ago"
      />
    </List>
  ),
  parameters: { pseudo: { hover: true } },
};

export const FocusVisible: Story = {
  render: () => (
    <List className="w-96">
      <ListItem
        onClick={() => {}}
        leadingVisual={<Package className="size-4" />}
        title="Order #4471829"
        supportingText="Picked up 2 hours ago"
      />
    </List>
  ),
  parameters: { pseudo: { focusVisible: true } },
};

export const Selected: Story = {
  render: () => (
    <List className="w-96">
      <ListItem
        onClick={() => {}}
        selected
        leadingVisual={<Package className="size-4" />}
        title="Order #4471829"
        supportingText="Picked up 2 hours ago"
      />
    </List>
  ),
};

export const Disabled: Story = {
  render: () => (
    <List className="w-96">
      <ListItem
        onClick={() => {}}
        disabled
        leadingVisual={<Package className="size-4" />}
        title="Order #4471829"
        supportingText="Archived — no longer editable"
      />
    </List>
  ),
};

export const Dense: Story = {
  render: () => (
    <List dense className="w-96">
      <ListItem dense title="Stop 1 — Seattle, WA" />
      <ListItem dense title="Stop 2 — Portland, OR" />
      <ListItem dense title="Stop 3 — Sacramento, CA" />
    </List>
  ),
};

export const Segmented: Story = {
  render: () => (
    <List segmented className="w-96">
      <ListItem title="Stop 1 — Seattle, WA" supportingText="Delivered 9:14 AM" />
      <ListItem title="Stop 2 — Portland, OR" supportingText="Delivered 1:52 PM" />
      <ListItem title="Stop 3 — Sacramento, CA" supportingText="ETA 6:30 PM" />
    </List>
  ),
};

export const WithTrailingAction: Story = {
  render: () => (
    <List className="w-96">
      <ListItem
        leadingVisual={<Avatar name="Priya Natarajan" size="sm" />}
        title="Assigned to Priya Natarajan"
        supportingText="Dispatcher — West region"
        trailingAction={
          <Button iconOnly variant="ghost" size="sm" icon={<MoreVertical />} aria-label="More actions" />
        }
      />
    </List>
  ),
};

export const WithBadge: Story = {
  render: () => (
    <List className="w-96">
      <ListItem
        leadingVisual={<Truck className="size-4" />}
        title="Order #4471831"
        supportingText="Customs hold — carrier notified"
        trailingAction={<Badge tone="delayed">Delayed</Badge>}
      />
    </List>
  ),
};

/**
 * **Icon-forward two-line row, the status-per-row convention.**
 *
 * Status lives in the existing `leadingVisual` slot as a small semantic
 * icon (no new prop). Three real product shapes below, each varying only
 * content choices in `title` / `supportingText` / `trailingAction`:
 *
 * - **Document checklist (F-41)**: trailing status `Badge` is genuinely
 *   useful here since "Present / Incomplete / Missing" is a discrete final
 *   state worth labeling explicitly.
 * - **Warehouse readiness (F-19)**: no trailing badge. The leading icon
 *   and countdown text alone communicate status for a dense, read-only
 *   checklist.
 * - **Escalation queue (F-51)**: no trailing badge. SLA tier, a separator
 *   dot, and a colored countdown span form the metadata line. The leading
 *   icon carries the state.
 */
export const DocumentChecklist: Story = {
  name: "Icon-forward row - Document checklist (F-41)",
  render: () => (
    <List className="w-[28rem]">
      <ListItem
        leadingVisual={<CheckCircle2 className="size-4 text-success-emphasis" />}
        title="Commercial invoice"
        supportingText="Matched to BorderIQ field CI-07"
        trailingAction={<Badge tone="success">Present</Badge>}
      />
      <ListItem
        leadingVisual={<Clock className="size-4 text-warning-emphasis" />}
        title="Certificate of origin"
        supportingText="Signature page missing"
        trailingAction={<Badge tone="warning">Incomplete</Badge>}
      />
      <ListItem
        leadingVisual={<AlertCircle className="size-4 text-severity-emphasis" />}
        title="Packing list"
        supportingText="Not received from shipper"
        trailingAction={<Badge className="bg-severity-surface text-severity-fg">Missing</Badge>}
      />
      <ListItem
        leadingVisual={<AlertCircle className="size-4 text-severity-emphasis" />}
        title="Import permit for restricted goods"
        supportingText="Required for HTS code 8471.30"
        trailingAction={<Badge className="bg-severity-surface text-severity-fg">Missing</Badge>}
      />
      <ListItem
        leadingVisual={<CheckCircle2 className="size-4 text-success-emphasis" />}
        title="Bill of lading"
        supportingText="Matched to BorderIQ field BL-02"
        trailingAction={<Badge tone="success">Present</Badge>}
      />
    </List>
  ),
};

export const WarehouseReadiness: Story = {
  name: "Icon-forward row - Warehouse readiness (F-19)",
  render: () => (
    <List segmented className="w-[28rem]">
      <ListItem
        leadingVisual={<CheckCircle2 className="size-4 text-success-emphasis" />}
        title="Receiving dock scheduled"
        supportingText="Dock 12, confirmed for revised ETA"
      />
      <ListItem
        leadingVisual={<Clock className="size-4 text-warning-emphasis" />}
        title="Labor allocated"
        supportingText={
          <>
            Nexus WMS <span className="text-warning-fg">confirming, breaches in 22m</span>
          </>
        }
      />
      <ListItem
        leadingVisual={<AlertCircle className="size-4 text-severity-emphasis" />}
        title="ASN matched"
        supportingText={<span className="text-severity-fg">Mismatch, overdue 12m</span>}
      />
    </List>
  ),
};

export const EscalationQueue: Story = {
  name: "Icon-forward row - Escalation queue (F-51)",
  render: () => (
    <List className="w-[30rem]">
      <ListItem
        onClick={() => {}}
        leadingVisual={<AlertCircle className="size-4 text-severity-emphasis" />}
        title="Documentation Gap hold, Shipment #88213"
        supportingText={
          <span className="inline-flex items-center gap-1.5">
            <span>Tier 1</span>
            <span className="text-border-strong">·</span>
            <span className="tabular-nums text-severity-fg">overdue 12m</span>
          </span>
        }
      />
      <ListItem
        onClick={() => {}}
        leadingVisual={<Clock className="size-4 text-warning-emphasis" />}
        title="Carrier substitution, Lane SEA-PDX"
        supportingText={
          <span className="inline-flex items-center gap-1.5">
            <span>Tier 2</span>
            <span className="text-border-strong">·</span>
            <span className="tabular-nums text-warning-fg">breaches in 22m</span>
          </span>
        }
      />
      <ListItem
        onClick={() => {}}
        leadingVisual={<Clock className="size-4 text-fg-muted" />}
        title="Policy conflict, carrier master mismatch"
        supportingText={
          <span className="inline-flex items-center gap-1.5">
            <span>Tier 3</span>
            <span className="text-border-strong">·</span>
            <span className="tabular-nums text-fg-muted">3h 10m left</span>
          </span>
        }
      />
    </List>
  ),
};
