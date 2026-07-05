import type { Meta, StoryObj } from "@storybook/nextjs";
import { Download, LayoutGrid, List, RotateCcw, SlidersHorizontal } from "lucide-react";
import { Toolbar, ToolbarGroup, ToolbarSeparator } from "./toolbar";
import { Button } from "./button";
import { Menu, MenuItem } from "./menu";

/**
 * **Toolbar** — a compact, task-relevant container for controls such as
 * table actions, view settings, export, density, search, or filters.
 * Compose its slots from `Button` (including `iconOnly` mode) and `Menu`
 * for overflow; Toolbar itself only lays out the groups and separators.
 */
const meta: Meta<typeof Toolbar> = {
  title: "UI/Toolbar",
  component: Toolbar,
};

export default meta;
type Story = StoryObj<typeof Toolbar>;

export const Default: Story = {
  render: () => (
    <Toolbar
      end={
        <Button size="sm" leadingIcon={<Download />}>
          Export
        </Button>
      }
    >
      <ToolbarGroup>
        <Button iconOnly variant="ghost" size="sm" icon={<List />} aria-label="List view" isSelected />
        <Button iconOnly variant="ghost" size="sm" icon={<LayoutGrid />} aria-label="Grid view" />
      </ToolbarGroup>
      <ToolbarSeparator />
      <ToolbarGroup>
        <Button variant="ghost" size="sm" leadingIcon={<SlidersHorizontal />}>
          Filters
        </Button>
      </ToolbarGroup>
    </Toolbar>
  ),
};

export const WithOverflowMenu: Story = {
  render: () => (
    <Toolbar
      end={
        <Menu trigger={<Button iconOnly variant="ghost" size="sm" icon={<RotateCcw />} aria-label="More" />} align="end">
          <MenuItem onSelect={() => {}}>Reset view</MenuItem>
          <MenuItem onSelect={() => {}}>Save as default</MenuItem>
        </Menu>
      }
    >
      <ToolbarGroup>
        <Button variant="ghost" size="sm">
          Group by carrier
        </Button>
      </ToolbarGroup>
    </Toolbar>
  ),
};

export const SelectionMode: Story = {
  name: "Contextual selection mode",
  render: () => (
    <Toolbar
      selectionCount={3}
      onClearSelection={() => {}}
      end={
        <Button size="sm" destructive>
          Delete selected
        </Button>
      }
    >
      <span />
    </Toolbar>
  ),
};

export const Sticky: Story = {
  render: () => (
    <div className="h-40 overflow-y-auto">
      <Toolbar sticky>
        <ToolbarGroup>
          <Button variant="ghost" size="sm">
            Filters
          </Button>
        </ToolbarGroup>
      </Toolbar>
      <div className="flex flex-col gap-2 p-4">
        {Array.from({ length: 10 }, (_, i) => (
          <div key={i} className="h-8 rounded-md bg-surface-sunken" />
        ))}
      </div>
    </div>
  ),
};

export const FocusVisible: Story = {
  render: () => (
    <Toolbar>
      <ToolbarGroup>
        <Button variant="ghost" size="sm">
          Filters
        </Button>
      </ToolbarGroup>
    </Toolbar>
  ),
  parameters: { pseudo: { focusVisible: true } },
};
