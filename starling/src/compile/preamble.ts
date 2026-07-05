/**
 * Static prompt preamble prepended to the compiled artifact. Tells Claude what
 * the file is and how to consume it. Deterministic — no LLM call (PRD §3).
 *
 * Emphasis is inverted from the original spec sample to match the React 19
 * reality: `source` (file:line) is frequently null here, so `fallbackLocators`
 * are the PRIMARY anchor and `source` is a bonus when present.
 */
export const PREAMBLE = `<!-- STARLING ANNOTATIONS — read me first -->

You are receiving UX feedback captured on a running React prototype. Each entry has a
human NOTE and a machine-readable locator bundle. There are two ways to use this file:

1. **Update the PRD/FRD** — treat each NOTE as a change request for the marked element.
2. **Apply changes in code** — locate the element, then make the change the NOTE describes.

How to locate each element:

- **\`fallbackLocators\` are the primary anchor.** Each entry lists several strategies
  (testid → id → role+name → text → css), most-stable first, each with a ready-to-paste
  Playwright expression for runtime verification and to disambiguate repeated \`.map()\`
  items. Use these first.
- **\`source\` (\`relativePath:lineNumber\`) is a precise bonus when present** — it points at
  the exact authored JSX line of the element that was marked, openable from the project
  root. On React 19 it is often \`null\` (React removed the fiber source field); when it
  IS present, prefer it. \`source.componentName\` names the ENCLOSING component for
  context, not necessarily the edit target.
- **\`context\`** (tag, role, text, bounding box) helps you confirm you found the right
  element, especially when \`source\` is null.

Treat repo-relative paths as openable. Group your work by route.`;
