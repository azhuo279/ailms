import figma from "@figma/code-connect/react";
import { FileUpload } from "./file-upload";

figma.connect(
  FileUpload,
  "https://www.figma.com/design/TLm314jvknL38gEyMCoB3u?node-id=28-305",
  {
    props: {
      multiple: figma.boolean("multiple"),
    },
    example: ({ multiple }) => (
      <FileUpload label="Proof of delivery" multiple={multiple} files={[]} />
    ),
  },
);
