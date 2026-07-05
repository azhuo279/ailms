import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/nextjs";
import { Folder, Warehouse } from "lucide-react";
import { TreeView, type TreeNode } from "./tree-view";

/**
 * **Tree View** — hierarchical navigation for nested categories such as
 * region › country › warehouse, order document folders, or asset
 * hierarchies. Use only when hierarchy genuinely matters; prefer List or
 * Data Table for flatter information.
 */
const meta: Meta<typeof TreeView> = {
  title: "UI/Tree View",
  component: TreeView,
};

export default meta;
type Story = StoryObj<typeof TreeView>;

const NODES: TreeNode[] = [
  {
    id: "na",
    label: "North America",
    icon: <Folder />,
    children: [
      {
        id: "us",
        label: "United States",
        icon: <Folder />,
        children: [
          { id: "us-east", label: "East Warehouse", icon: <Warehouse /> },
          { id: "us-west", label: "West Warehouse", icon: <Warehouse /> },
        ],
      },
      { id: "ca", label: "Canada", icon: <Folder />, children: [{ id: "ca-1", label: "Toronto Hub", icon: <Warehouse /> }] },
    ],
  },
  {
    id: "eu",
    label: "Europe",
    icon: <Folder />,
    children: [{ id: "de", label: "Germany", icon: <Folder />, children: [{ id: "de-1", label: "Berlin Hub", icon: <Warehouse /> }] }],
  },
  { id: "apac", label: "Asia Pacific", icon: <Folder />, disabled: true },
];

function Controlled(props: Partial<React.ComponentProps<typeof TreeView>>) {
  const [selectedId, setSelectedId] = useState<string | undefined>(props.selectedId);
  return (
    <TreeView
      nodes={NODES}
      selectedId={selectedId}
      onSelect={(node) => setSelectedId(node.id)}
      {...props}
    />
  );
}

export const Default: Story = { render: () => <Controlled /> };

export const Expanded: Story = {
  render: () => <Controlled expandedIds={new Set(["na", "us"])} />,
};

export const Selected: Story = {
  render: () => <Controlled expandedIds={new Set(["na", "us"])} selectedId="us-east" />,
};

export const WithDisabledNode: Story = { render: () => <Controlled /> };

export const LazyLoading: Story = {
  name: "Lazy load on expand",
  render: () => {
    function Wrapper() {
      const [nodes, setNodes] = useState<TreeNode[]>([
        { id: "region", label: "APAC (lazy)", icon: <Folder />, lazy: true, children: [] },
      ]);
      const [loadingIds, setLoadingIds] = useState<Set<string>>(new Set());
      const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

      const handleLoadChildren = (node: TreeNode) => {
        setLoadingIds((prev) => new Set(prev).add(node.id));
        setTimeout(() => {
          setNodes((prev) =>
            prev.map((n) =>
              n.id === node.id
                ? { ...n, children: [{ id: "apac-1", label: "Singapore Hub", icon: <Warehouse /> }] }
                : n,
            ),
          );
          setLoadingIds((prev) => {
            const next = new Set(prev);
            next.delete(node.id);
            return next;
          });
        }, 800);
      };

      return (
        <TreeView
          nodes={nodes}
          expandedIds={expandedIds}
          onExpandedChange={setExpandedIds}
          loadingIds={loadingIds}
          onLoadChildren={handleLoadChildren}
        />
      );
    }
    return <Wrapper />;
  },
};

export const FocusVisible: Story = {
  render: () => <Controlled />,
  parameters: { pseudo: { focusVisible: true } },
};
