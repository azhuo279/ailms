import figma from "@figma/code-connect/react";
import { FilterBar, FilterField } from "./filter-bar";
import { Select } from "./select";

// Note: FilterBar's active-filter tokens render via the canonical Tag
// component internally (Phase 3) instead of the earlier inline stand-in
// pill. The FilterBar prop API (`activeFilters`) is unchanged, so this
// mapping needs no update — see tag.figma.tsx for Tag's own Code Connect.

figma.connect(
  FilterBar,
  "https://www.figma.com/design/TLm314jvknL38gEyMCoB3u?node-id=44-184",
  {
    variant: { State: "Default" },
    example: () => (
      <FilterBar>
        <FilterField>
          <Select label="Status" placeholder="Any status" options={[]} />
        </FilterField>
        <FilterField>
          <Select label="Carrier" placeholder="Any carrier" options={[]} />
        </FilterField>
      </FilterBar>
    ),
  },
);

figma.connect(
  FilterBar,
  "https://www.figma.com/design/TLm314jvknL38gEyMCoB3u?node-id=44-184",
  {
    variant: { State: "Filters-applied" },
    example: () => (
      <FilterBar
        activeFilters={[
          { id: "status", label: "Status: Delayed", onRemove: () => {} },
          { id: "carrier", label: "Carrier: FedEx", onRemove: () => {} },
        ]}
        onClearAll={() => {}}
      >
        <FilterField>
          <Select label="Status" placeholder="Any status" options={[]} value="delayed" />
        </FilterField>
        <FilterField>
          <Select label="Carrier" placeholder="Any carrier" options={[]} value="fedex" />
        </FilterField>
      </FilterBar>
    ),
  },
);
