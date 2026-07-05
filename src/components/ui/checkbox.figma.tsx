import figma from "@figma/code-connect/react";
import { Checkbox } from "./checkbox";

figma.connect(
  Checkbox,
  "https://www.figma.com/design/TLm314jvknL38gEyMCoB3u?node-id=27-92",
  {
    props: {
      label: figma.string("label"),
      size: figma.enum("Size", {
        sm: "sm",
        md: "md",
        lg: "lg",
      }),
      checked: figma.boolean("checked"),
      indeterminate: figma.boolean("indeterminate"),
      disabled: figma.boolean("disabled"),
      invalid: figma.boolean("invalid"),
    },
    example: ({ label, size, checked, indeterminate, disabled, invalid }) => (
      <Checkbox
        label={label}
        size={size}
        checked={checked}
        indeterminate={indeterminate}
        disabled={disabled}
        invalid={invalid}
      />
    ),
  },
);
