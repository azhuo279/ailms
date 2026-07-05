import figma from "@figma/code-connect/react";
import { Dialog } from "./dialog";
import { Button } from "./button";

figma.connect(
  Dialog,
  "https://www.figma.com/design/TLm314jvknL38gEyMCoB3u?node-id=68-43",
  {
    variant: { Variant: "default" },
    props: {
      title: figma.string("Title"),
      description: figma.string("Description"),
    },
    example: ({ title, description }) => (
      <Dialog
        open
        onClose={() => {}}
        title={title}
        description={description}
        actions={
          <>
            <Button variant="secondary" onClick={() => {}}>
              Cancel
            </Button>
            <Button onClick={() => {}}>Confirm</Button>
          </>
        }
      >
        Dialog body content goes here, supporting the decision or task at hand.
      </Dialog>
    ),
  },
);

figma.connect(
  Dialog,
  "https://www.figma.com/design/TLm314jvknL38gEyMCoB3u?node-id=68-43",
  {
    variant: { Variant: "alert" },
    props: {
      title: figma.string("Title"),
      description: figma.string("Description"),
    },
    example: ({ title, description }) => (
      <Dialog
        open
        onClose={() => {}}
        variant="alert"
        title={title}
        description={description}
        actions={
          <>
            <Button variant="secondary" onClick={() => {}}>
              Cancel
            </Button>
            <Button destructive onClick={() => {}}>
              Delete
            </Button>
          </>
        }
      >
        Dialog body content goes here, supporting the decision or task at hand.
      </Dialog>
    ),
  },
);
