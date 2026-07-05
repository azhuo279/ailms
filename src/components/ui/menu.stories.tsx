import type { Meta, StoryObj } from "@storybook/nextjs";
import { Archive, Copy, Download, MoreVertical, Pencil, Trash2 } from "lucide-react";
import { Menu, MenuItem, MenuGroup, MenuSeparator } from "./menu";
import { Button } from "./button";

/**
 * **Menu** — a temporary surface of actions or options opened from a
 * trigger. Compose with `MenuItem`, `MenuGroup`, and `MenuSeparator`. Keep
 * labels concise and lists manageable; for constrained spaces, pair with an
 * overflow trigger (see the `MoreVertical` example).
 */
const meta: Meta<typeof Menu> = {
  title: "UI/Menu",
  component: Menu,
};

export default meta;
type Story = StoryObj<typeof Menu>;

export const Default: Story = {
  render: () => (
    <Menu trigger={<Button variant="secondary">Actions</Button>}>
      <MenuItem icon={<Pencil />} onSelect={() => {}}>
        Edit
      </MenuItem>
      <MenuItem icon={<Copy />} onSelect={() => {}}>
        Duplicate
      </MenuItem>
      <MenuItem icon={<Download />} onSelect={() => {}}>
        Export
      </MenuItem>
      <MenuSeparator />
      <MenuItem icon={<Trash2 />} destructive onSelect={() => {}}>
        Delete
      </MenuItem>
    </Menu>
  ),
};

export const IconOnlyTrigger: Story = {
  name: "Overflow trigger (icon-only Button)",
  render: () => (
    <Menu
      trigger={<Button iconOnly variant="ghost" icon={<MoreVertical />} aria-label="More actions" />}
      align="end"
    >
      <MenuItem onSelect={() => {}}>View details</MenuItem>
      <MenuItem onSelect={() => {}}>Reassign carrier</MenuItem>
      <MenuItem destructive onSelect={() => {}}>
        Cancel shipment
      </MenuItem>
    </Menu>
  ),
};

export const WithGroups: Story = {
  render: () => (
    <Menu trigger={<Button variant="secondary">Sort by</Button>}>
      <MenuGroup label="Date">
        <MenuItem checked onSelect={() => {}}>
          Newest first
        </MenuItem>
        <MenuItem onSelect={() => {}}>Oldest first</MenuItem>
      </MenuGroup>
      <MenuSeparator />
      <MenuGroup label="Status">
        <MenuItem onSelect={() => {}}>In transit</MenuItem>
        <MenuItem onSelect={() => {}}>Delivered</MenuItem>
      </MenuGroup>
    </Menu>
  ),
};

export const WithDisabledItem: Story = {
  render: () => (
    <Menu trigger={<Button variant="secondary">Actions</Button>}>
      <MenuItem icon={<Pencil />} onSelect={() => {}}>
        Edit
      </MenuItem>
      <MenuItem icon={<Archive />} disabled onSelect={() => {}}>
        Archive (unavailable)
      </MenuItem>
    </Menu>
  ),
};

export const AlignEnd: Story = {
  render: () => (
    <div className="flex justify-end">
      <Menu trigger={<Button variant="secondary">Actions</Button>} align="end">
        <MenuItem onSelect={() => {}}>Edit</MenuItem>
        <MenuItem onSelect={() => {}}>Duplicate</MenuItem>
      </Menu>
    </div>
  ),
};

export const Open: Story = {
  name: "Open (documentation only — interact with trigger to see live state)",
  render: () => (
    <Menu trigger={<Button variant="secondary">Actions</Button>}>
      <MenuItem onSelect={() => {}}>Edit</MenuItem>
      <MenuItem onSelect={() => {}}>Duplicate</MenuItem>
    </Menu>
  ),
};
