import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/nextjs";
import {
  FilterBar,
  FilterField,
  FilterPillRail,
  Watchlist,
  type ActiveFilterToken,
  type FilterPillOption,
  type WatchlistItem,
} from "./filter-bar";
import { Select } from "./select";
import { SearchField } from "./search-field";
import { Button } from "./button";

/**
 * **Filter Bar** — high-value enterprise composite for narrowing tables and
 * lists using multiple criteria (status, date range, carrier, route, site,
 * priority). Compose its control row from existing form primitives; active
 * selections render as removable tokens below.
 *
 * Active-filter tokens here are a lightweight inline pill, not the canonical
 * `Tag` component (Phase 3) — swap this rendering for `Tag` once it ships.
 */
const meta: Meta<typeof FilterBar> = {
  title: "UI/Filter Bar",
  component: FilterBar,
};

export default meta;
type Story = StoryObj<typeof FilterBar>;

const STATUS_OPTIONS = [
  { label: "In transit", value: "intransit" },
  { label: "Delivered", value: "delivered" },
  { label: "Delayed", value: "delayed" },
];

export const Default: Story = {
  render: () => (
    <FilterBar>
      <FilterField>
        <Select label="Status" placeholder="Any status" options={STATUS_OPTIONS} />
      </FilterField>
      <FilterField>
        <Select label="Carrier" placeholder="Any carrier" options={[{ label: "FedEx", value: "fedex" }, { label: "UPS", value: "ups" }]} />
      </FilterField>
      <FilterField className="w-64">
        <SearchField label="Search" placeholder="Tracking number" />
      </FilterField>
      <Button variant="secondary" size="md">
        Reset
      </Button>
    </FilterBar>
  ),
};

export const WithActiveFilters: Story = {
  render: () => {
    function Wrapper() {
      const [filters, setFilters] = useState<ActiveFilterToken[]>([
        { id: "status", label: "Status: Delayed", onRemove: () => {} },
        { id: "carrier", label: "Carrier: FedEx", onRemove: () => {} },
      ]);
      return (
        <FilterBar
          activeFilters={filters.map((f) => ({ ...f, onRemove: () => setFilters((prev) => prev.filter((x) => x.id !== f.id)) }))}
          onClearAll={() => setFilters([])}
        >
          <FilterField>
            <Select label="Status" placeholder="Any status" options={STATUS_OPTIONS} value="delayed" />
          </FilterField>
          <FilterField>
            <Select label="Carrier" placeholder="Any carrier" options={[{ label: "FedEx", value: "fedex" }]} value="fedex" />
          </FilterField>
        </FilterBar>
      );
    }
    return <Wrapper />;
  },
};

export const WithAdvancedFilters: Story = {
  name: "Collapsible advanced filters",
  render: () => (
    <FilterBar
      advancedFilters={
        <FilterField>
          <Select label="Priority" placeholder="Any priority" options={[{ label: "High", value: "high" }]} />
        </FilterField>
      }
    >
      <FilterField>
        <Select label="Status" placeholder="Any status" options={STATUS_OPTIONS} />
      </FilterField>
    </FilterBar>
  ),
};

export const Empty: Story = {
  name: "Default (no filters applied)",
  render: () => (
    <FilterBar>
      <FilterField>
        <Select label="Status" placeholder="Any status" options={STATUS_OPTIONS} />
      </FilterField>
    </FilterBar>
  ),
};

export const FocusVisible: Story = {
  render: () => (
    <FilterBar>
      <FilterField>
        <Select label="Status" placeholder="Any status" options={STATUS_OPTIONS} />
      </FilterField>
    </FilterBar>
  ),
  parameters: { pseudo: { focusVisible: true } },
};

const PILL_OPTIONS: FilterPillOption[] = [
  { id: "carrier", label: "Carrier", count: 4 },
  { id: "customs", label: "Customs", count: 2 },
  { id: "dock", label: "Dock", count: 7 },
  { id: "sla", label: "SLA", count: 3 },
  { id: "weather", label: "Weather", count: 0 },
];

export const QuickFilterPillRail: StoryObj<typeof FilterPillRail> = {
  name: "Quick-filter pill rail",
  render: () => {
    function Wrapper() {
      const [activeIds, setActiveIds] = useState<string[]>(["carrier", "sla"]);
      return (
        <FilterPillRail
          options={PILL_OPTIONS}
          activeIds={activeIds}
          onToggle={(id) =>
            setActiveIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
          }
        />
      );
    }
    return <Wrapper />;
  },
};

const WATCHLIST_SEED: WatchlistItem[] = [
  { id: "p1", title: "Weather hold, lane PHX–LAX", meta: "Watching 12m" },
  { id: "p2", title: "Customs recheck, container 88213", meta: "Watching 3m" },
];

export const WatchlistCollapsed: StoryObj<typeof Watchlist> = {
  name: "Watchlist (collapsed)",
  render: () => {
    function Wrapper() {
      const [items, setItems] = useState<WatchlistItem[]>(WATCHLIST_SEED);
      return <Watchlist items={items} onUnpin={(id) => setItems((prev) => prev.filter((p) => p.id !== id))} />;
    }
    return <Wrapper />;
  },
};

export const WatchlistExpanded: StoryObj<typeof Watchlist> = {
  name: "Watchlist (expanded, 2 pinned)",
  render: () => {
    function Wrapper() {
      const [items, setItems] = useState<WatchlistItem[]>(WATCHLIST_SEED);
      return (
        <Watchlist
          items={items}
          onUnpin={(id) => setItems((prev) => prev.filter((p) => p.id !== id))}
          onManage={() => {}}
          defaultExpanded
        />
      );
    }
    return <Wrapper />;
  },
};
