import figma from "@figma/code-connect/react";
import { Button } from "./button";

/**
 * Labeled configuration (iconOnly = false variant in the Figma component set).
 */
figma.connect(
  Button,
  "https://www.figma.com/design/TLm314jvknL38gEyMCoB3u?node-id=22-58",
  {
    variant: { iconOnly: "false" },
    props: {
      label: figma.string("label"),
      variant: figma.enum("Variant", {
        primary: "primary",
        secondary: "secondary",
        ghost: "ghost",
      }),
      size: figma.enum("Size", {
        sm: "sm",
        md: "md",
        lg: "lg",
      }),
      isSelected: figma.boolean("isSelected"),
      destructive: figma.boolean("destructive"),
      isLoading: figma.boolean("isLoading"),
      leadingIcon: figma.instance("leadingIcon"),
      trailingIcon: figma.instance("trailingIcon"),
    },
    example: ({ label, variant, size, isSelected, destructive, isLoading, leadingIcon, trailingIcon }) => (
      <Button
        variant={variant}
        size={size}
        isSelected={isSelected}
        destructive={destructive}
        isLoading={isLoading}
        leadingIcon={leadingIcon}
        trailingIcon={trailingIcon}
      >
        {label}
      </Button>
    ),
  },
);

/**
 * Icon-only configuration (iconOnly = true variant in the Figma component set) —
 * this mirrors what was previously a standalone "Icon Button" Figma page/component.
 * Now a variant of the same Button component set.
 */
figma.connect(
  Button,
  "https://www.figma.com/design/TLm314jvknL38gEyMCoB3u?node-id=22-58",
  {
    variant: { iconOnly: "true" },
    props: {
      icon: figma.instance("icon"),
      variant: figma.enum("Variant", {
        primary: "primary",
        secondary: "secondary",
        ghost: "ghost",
      }),
      size: figma.enum("Size", {
        sm: "sm",
        md: "md",
        lg: "lg",
      }),
      isSelected: figma.boolean("isSelected"),
      destructive: figma.boolean("destructive"),
      isLoading: figma.boolean("isLoading"),
      ariaLabel: figma.string("aria-label"),
    },
    example: ({ icon, variant, size, isSelected, destructive, isLoading, ariaLabel }) => (
      <Button
        iconOnly
        icon={icon}
        variant={variant}
        size={size}
        isSelected={isSelected}
        destructive={destructive}
        isLoading={isLoading}
        aria-label={ariaLabel}
      />
    ),
  },
);
