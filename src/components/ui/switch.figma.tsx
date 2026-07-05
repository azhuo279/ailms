import figma from "@figma/code-connect/react";
import { Switch } from "./switch";

figma.connect(
  Switch,
  "https://www.figma.com/design/TLm314jvknL38gEyMCoB3u?node-id=28-35",
  {
    props: {
      label: figma.string("label"),
      size: figma.enum("Size", {
        sm: "sm",
        md: "md",
        lg: "lg",
      }),
      checked: figma.boolean("checked"),
      isLoading: figma.boolean("isLoading"),
      disabled: figma.boolean("disabled"),
      readOnly: figma.boolean("readOnly"),
      invalid: figma.boolean("invalid"),
    },
    example: ({ label, size, checked, isLoading, disabled, readOnly, invalid }) => (
      <Switch
        label={label}
        size={size}
        checked={checked}
        isLoading={isLoading}
        disabled={disabled}
        readOnly={readOnly}
        invalid={invalid}
      />
    ),
  },
);
