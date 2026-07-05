import figma from "@figma/code-connect/react";
import { Toolbar, ToolbarGroup } from "./toolbar";
import { Button } from "./button";

figma.connect(
  Toolbar,
  "https://www.figma.com/design/TLm314jvknL38gEyMCoB3u?node-id=42-164",
  {
    variant: { Mode: "Default" },
    example: () => (
      <Toolbar end={<Button size="sm">Export</Button>}>
        <ToolbarGroup>
          <Button variant="ghost" size="sm">
            Filters
          </Button>
        </ToolbarGroup>
      </Toolbar>
    ),
  },
);

figma.connect(
  Toolbar,
  "https://www.figma.com/design/TLm314jvknL38gEyMCoB3u?node-id=42-164",
  {
    variant: { Mode: "Selection" },
    example: () => (
      <Toolbar selectionCount={3} onClearSelection={() => {}} end={<Button destructive>Delete selected</Button>}>
        <span />
      </Toolbar>
    ),
  },
);
