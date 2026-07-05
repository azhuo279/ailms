import figma from "@figma/code-connect/react";
import { Menu, MenuItem } from "./menu";

/**
 * The Figma mirror ("Menu Item") models a single row's states
 * (Default/Highlighted/Disabled/Destructive/Checked) — `Menu` itself is a
 * portal + positioning behavior with no static Figma equivalent, so the
 * example composes `MenuItem` instances the way a real menu surface would.
 */
figma.connect(
  MenuItem,
  "https://www.figma.com/design/TLm314jvknL38gEyMCoB3u?node-id=41-150",
  {
    variant: { State: "Default" },
    props: {
      children: figma.string("label"),
    },
    example: ({ children }: { children: string }) => <MenuItem onSelect={() => {}}>{children}</MenuItem>,
  },
);

figma.connect(
  MenuItem,
  "https://www.figma.com/design/TLm314jvknL38gEyMCoB3u?node-id=41-150",
  {
    variant: { State: "Destructive" },
    example: () => (
      <MenuItem destructive onSelect={() => {}}>
        Delete
      </MenuItem>
    ),
  },
);
