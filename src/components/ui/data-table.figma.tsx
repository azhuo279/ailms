import figma from "@figma/code-connect/react";
import { DataTable } from "./data-table";
import type { DataTableColumn } from "./data-table";

/**
 * Composite mapping — the Figma mirror shows four representative table
 * states (default, with-selection, loading, empty) composing the published
 * Checkbox primitive for its selection column. The `columns`/`rows` shape
 * is data-driven in code, so the example wires a representative shipments
 * dataset matching the mirror's mock content.
 */
interface Shipment {
  id: string;
  reference: string;
  carrier: string;
  destination: string;
  status: string;
}

const columns: DataTableColumn<Shipment>[] = [
  { id: "reference", header: "Reference", cell: (row) => row.reference, sortable: true },
  { id: "carrier", header: "Carrier", cell: (row) => row.carrier, sortable: true },
  { id: "destination", header: "Destination", cell: (row) => row.destination },
  { id: "status", header: "Status", cell: (row) => row.status },
];

const rows: Shipment[] = [
  { id: "1", reference: "AIX-4471829", carrier: "Swift Line", destination: "Denver, CO", status: "In transit" },
  { id: "2", reference: "AIX-4471830", carrier: "Pacific Freight", destination: "Austin, TX", status: "Delivered" },
  { id: "3", reference: "AIX-4471831", carrier: "Redline Carriers", destination: "Atlanta, GA", status: "Delayed" },
];

figma.connect(
  DataTable,
  "https://www.figma.com/design/TLm314jvknL38gEyMCoB3u?node-id=54-323",
  {
    variant: { State: "default" },
    example: () => <DataTable columns={columns} rows={rows} getRowId={(row) => row.id} />,
  },
);

figma.connect(
  DataTable,
  "https://www.figma.com/design/TLm314jvknL38gEyMCoB3u?node-id=54-323",
  {
    variant: { State: "with-selection" },
    example: () => (
      <DataTable
        columns={columns}
        rows={rows}
        getRowId={(row) => row.id}
        selectedIds={new Set(["1"])}
        onSelectedIdsChange={() => {}}
      />
    ),
  },
);

figma.connect(
  DataTable,
  "https://www.figma.com/design/TLm314jvknL38gEyMCoB3u?node-id=54-323",
  {
    variant: { State: "loading" },
    example: () => <DataTable columns={columns} rows={[]} getRowId={(row: Shipment) => row.id} isLoading />,
  },
);

figma.connect(
  DataTable,
  "https://www.figma.com/design/TLm314jvknL38gEyMCoB3u?node-id=54-323",
  {
    variant: { State: "empty" },
    example: () => <DataTable columns={columns} rows={[]} getRowId={(row: Shipment) => row.id} />,
  },
);
