import figma from "@figma/code-connect/react";
import { TreeView } from "./tree-view";

/**
 * The Figma mirror ("Tree View Item") models a single node row's states
 * (Collapsed/Expanded/Selected/Disabled) — `TreeView` composes a recursive
 * `nodes` data structure with no static Figma equivalent, so the example
 * wires a representative two-level hierarchy.
 */
figma.connect(
  TreeView,
  "https://www.figma.com/design/TLm314jvknL38gEyMCoB3u?node-id=42-193",
  {
    example: () => (
      <TreeView
        nodes={[
          {
            id: "na",
            label: "North America",
            children: [{ id: "us-east", label: "East Warehouse" }],
          },
        ]}
        selectedId="us-east"
        onSelect={() => {}}
      />
    ),
  },
);
