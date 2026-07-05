import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/nextjs";
import { DataTable, DataTableToolbar } from "./data-table";
import type { DataTableColumn } from "./data-table";
import { Badge } from "./badge";
import { Button } from "./button";

interface Shipment {
  id: string;
  reference: string;
  carrier: string;
  destination: string;
  status: "intransit" | "delivered" | "delayed" | "pending";
  eta: string;
}

const ROWS: Shipment[] = [
  { id: "1", reference: "AIX-4471829", carrier: "Swift Line", destination: "Denver, CO", status: "intransit", eta: "Tomorrow, 2:00 PM" },
  { id: "2", reference: "AIX-4471830", carrier: "Pacific Freight", destination: "Austin, TX", status: "delivered", eta: "Delivered 9:14 AM" },
  { id: "3", reference: "AIX-4471831", carrier: "Redline Carriers", destination: "Atlanta, GA", status: "delayed", eta: "Delayed — customs hold" },
  { id: "4", reference: "AIX-4471832", carrier: "Swift Line", destination: "Chicago, IL", status: "pending", eta: "Awaiting pickup" },
];

const columns: DataTableColumn<Shipment>[] = [
  { id: "reference", header: "Reference", cell: (row) => row.reference, sortable: true },
  { id: "carrier", header: "Carrier", cell: (row) => row.carrier, sortable: true },
  { id: "destination", header: "Destination", cell: (row) => row.destination },
  {
    id: "status",
    header: "Status",
    cell: (row) => <Badge tone={row.status}>{row.status}</Badge>,
  },
  { id: "eta", header: "ETA", cell: (row) => row.eta, align: "end" },
];

/**
 * **Data Table** — the single highest-value enterprise component for
 * organizing, sorting, filtering, selecting, expanding, and acting on
 * row-based data (shipments, orders, invoices, loads, exceptions). Prefer
 * native table semantics; reach for grid semantics only when in-cell
 * arrow-key navigation is genuinely required.
 *
 * **Visual treatment — Selective Frozen-Column Hairline.** No horizontal row
 * dividers are drawn anywhere in the body; whitespace and consistent row
 * height do the separating. The only line in the table is a low-contrast
 * vertical hairline (`border-border-subtle`) isolating the identity cluster
 * (expand chevron + selection checkbox) from the scrolling data columns.
 * That cluster is elevated with `shadow-sm` — reading as a raised strip
 * riding above the row data — rather than a darker fill, per DESIGN.md's
 * "Structured Depth" elevation-over-darkness principle. See `SelectableRows`,
 * `ExpandableRows`, and `FrozenClusterCombined` below to see the strip at
 * different widths.
 */
const meta: Meta<typeof DataTable> = {
  title: "UI/DataTable",
  component: DataTable,
};

export default meta;
type Story = StoryObj<typeof DataTable>;

export const Default: Story = {
  render: () => <DataTable columns={columns} rows={ROWS} getRowId={(row) => row.id} />,
};

export const Loading: Story = {
  render: () => <DataTable columns={columns} rows={[]} getRowId={(row: Shipment) => row.id} isLoading />,
};

export const Empty: Story = {
  render: () => <DataTable columns={columns} rows={[]} getRowId={(row: Shipment) => row.id} />,
};

export const Sortable: Story = {
  render: function SortableStory() {
    const [sortColumnId, setSortColumnId] = useState("reference");
    const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
    return (
      <DataTable
        columns={columns}
        rows={ROWS}
        getRowId={(row) => row.id}
        sortColumnId={sortColumnId}
        sortDirection={sortDirection}
        onSortChange={(id, dir) => {
          setSortColumnId(id);
          setSortDirection(dir);
        }}
      />
    );
  },
};

export const SelectableRows: Story = {
  render: function SelectableStory() {
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    return (
      <div className="flex flex-col gap-0">
        <DataTableToolbar selectionCount={selectedIds.size} onClearSelection={() => setSelectedIds(new Set())}>
          <Button size="sm" variant="secondary">Export</Button>
          <Button size="sm">Assign carrier</Button>
        </DataTableToolbar>
        <DataTable
          columns={columns}
          rows={ROWS}
          getRowId={(row) => row.id}
          selectedIds={selectedIds}
          onSelectedIdsChange={setSelectedIds}
          className={selectedIds.size > 0 ? "rounded-t-none" : undefined}
        />
      </div>
    );
  },
};

export const ExpandableRows: Story = {
  render: function ExpandableStory() {
    const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
    return (
      <DataTable
        columns={columns}
        rows={ROWS}
        getRowId={(row) => row.id}
        expandedIds={expandedIds}
        onExpandedIdsChange={setExpandedIds}
        renderExpandedRow={(row) => (
          <div className="text-body-s text-fg-secondary">
            Full manifest for <span className="font-medium text-fg-primary">{row.reference}</span> — 12 line items, last scan 20 minutes ago.
          </div>
        )}
      />
    );
  },
};

export const RowClickable: Story = {
  render: () => <DataTable columns={columns} rows={ROWS} getRowId={(row) => row.id} onRowClick={() => {}} />,
};

export const CompactDensity: Story = {
  render: () => <DataTable columns={columns} rows={ROWS} getRowId={(row) => row.id} density="compact" />,
};

const MANY_ROWS: Shipment[] = Array.from({ length: 12 }, (_, i) => ({
  ...ROWS[i % ROWS.length],
  id: `${ROWS[i % ROWS.length].id}-${i}`,
}));

export const StickyHeader: Story = {
  render: () => (
    <div className="h-48 overflow-auto">
      <DataTable columns={columns} rows={MANY_ROWS} getRowId={(row) => row.id} stickyHeader />
    </div>
  ),
};

/**
 * Selection + expansion together widen the frozen identity cluster to two
 * columns (checkbox + chevron), showing the vertical hairline and elevation
 * shadow spanning both — the widest form the frozen strip takes.
 */
export const FrozenClusterCombined: Story = {
  render: function FrozenClusterCombinedStory() {
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
    return (
      <DataTable
        columns={columns}
        rows={ROWS}
        getRowId={(row) => row.id}
        selectedIds={selectedIds}
        onSelectedIdsChange={setSelectedIds}
        expandedIds={expandedIds}
        onExpandedIdsChange={setExpandedIds}
        renderExpandedRow={(row) => (
          <div className="text-body-s text-fg-secondary">
            Full manifest for <span className="font-medium text-fg-primary">{row.reference}</span> — 12 line items, last scan 20 minutes ago.
          </div>
        )}
        onRowClick={() => {}}
      />
    );
  },
};
