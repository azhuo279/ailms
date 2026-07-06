import figma from "@figma/code-connect/react";
import { ListItem } from "./list";

/**
 * The Figma page also carries three "icon-forward two-line row" convention
 * examples (Document checklist, Warehouse readiness, Escalation queue) —
 * see list.tsx's ListItem doc comment for the pattern. Those rows are
 * documentation compositions built from ListItem's existing leadingVisual/
 * title/supportingText/trailingAction slots, not a new component or
 * variant, so they have no separate Code Connect mapping of their own.
 */
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
