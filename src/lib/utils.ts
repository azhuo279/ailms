import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

/**
 * tailwind-merge configured to recognize this project's custom `@theme` type
 * scale (the `--text-*` tokens in globals.css) as font-SIZE utilities.
 *
 * Without this, tailwind-merge's default classifier does not know custom names
 * like `text-footnote` / `text-body-m` exist, so it lumps them into the same
 * conflict group as text-COLOR utilities (`text-fg-primary`, `text-fg-muted`,
 * ...). When a component's class list puts a size token before a color token
 * (the norm across our primitives), the size token was silently dropped as a
 * "conflict" (last-wins). Registering the 14 custom names under the `font-size`
 * class group makes size and color NON-conflicting, while two size tokens still
 * correctly conflict (last-wins). Stock sizes and arbitrary `text-[...]` are
 * unaffected — `extend` appends to the existing font-size group.
 */
const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      "font-size": [
        {
          text: [
            "display-xl",
            "display-l",
            "heading-xl",
            "heading-l",
            "heading-m",
            "title",
            "body-l",
            "body-m",
            "body-s",
            "label-l",
            "label-m",
            "label-s",
            "caption",
            "footnote",
          ],
        },
      ],
    },
  },
});

/**
 * Merge Tailwind class names, resolving conflicts (last-wins) via tailwind-merge.
 * Always use `cn()` instead of string concatenation for conditional classes.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
