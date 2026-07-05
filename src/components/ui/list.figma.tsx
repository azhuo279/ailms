import figma from "@figma/code-connect/react";
import { ListItem } from "./list";

figma.connect(
  ListItem,
  "https://www.figma.com/design/TLm314jvknL38gEyMCoB3u?node-id=51-210",
  {
    props: {
      title: figma.string("title"),
      supportingText: figma.string("supportingText"),
      selected: figma.enum("State", {
        default: false,
        hover: false,
        selected: true,
        disabled: false,
      }),
      disabled: figma.enum("State", {
        default: false,
        hover: false,
        selected: false,
        disabled: true,
      }),
    },
    example: ({ title, supportingText, selected, disabled }) => (
      <ListItem title={title} supportingText={supportingText} selected={selected} disabled={disabled} />
    ),
  },
);
