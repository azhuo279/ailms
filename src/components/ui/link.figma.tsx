import figma from "@figma/code-connect/react";
import { Link } from "./link";

figma.connect(
  Link,
  "https://www.figma.com/design/TLm314jvknL38gEyMCoB3u?node-id=25-17",
  {
    props: {
      label: figma.string("label"),
      external: figma.boolean("external"),
      inline: figma.boolean("inline"),
    },
    example: ({ label, external, inline }) => (
      <Link href="#" external={external} inline={inline}>
        {label}
      </Link>
    ),
  },
);
