import figma from "@figma/code-connect/react";
import { Pagination } from "./pagination";

/**
 * The Figma mirror ("Pagination Control") models a single page-number
 * control's states — `Pagination` itself composes several instances plus
 * previous/next controls with page-count logic that has no static Figma
 * equivalent, so the example wires a representative multi-page state.
 */
figma.connect(
  Pagination,
  "https://www.figma.com/design/TLm314jvknL38gEyMCoB3u?node-id=41-165",
  {
    example: () => <Pagination currentPage={3} totalPages={12} onPageChange={() => {}} />,
  },
);
