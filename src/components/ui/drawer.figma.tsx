import figma from "@figma/code-connect/react";
import { Drawer } from "./drawer";
import { Button } from "./button";

figma.connect(
  Drawer,
  "https://www.figma.com/design/TLm314jvknL38gEyMCoB3u?node-id=70-37",
  {
    variant: { Side: "right" },
    props: {
      title: figma.string("Title"),
    },
    example: ({ title }) => (
      <Drawer
        open
        onClose={() => {}}
        side="right"
        title={title}
        actions={
          <>
            <Button variant="secondary" onClick={() => {}}>
              Cancel
            </Button>
            <Button onClick={() => {}}>Save</Button>
          </>
        }
      >
        Supplemental detail for the current record.
      </Drawer>
    ),
  },
);

figma.connect(
  Drawer,
  "https://www.figma.com/design/TLm314jvknL38gEyMCoB3u?node-id=70-37",
  {
    variant: { Side: "left" },
    props: {
      title: figma.string("Title"),
    },
    example: ({ title }) => (
      <Drawer
        open
        onClose={() => {}}
        side="left"
        title={title}
        actions={
          <>
            <Button variant="secondary" onClick={() => {}}>
              Cancel
            </Button>
            <Button onClick={() => {}}>Save</Button>
          </>
        }
      >
        Supplemental detail for the current record.
      </Drawer>
    ),
  },
);
