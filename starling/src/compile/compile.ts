import type { Annotation, Session } from "../types";
import { groupBy } from "../util/group";
import { PREAMBLE } from "./preamble";

/**
 * Compile a session into one Markdown document with a static preamble, grouped
 * by route, with a fenced JSON block per annotation. Pure & deterministic — no
 * LLM call (PRD §3, §10). Exported standalone so it can be unit-snapshot-tested
 * and reused by the future extension.
 */
export function compile(session: Session): string {
  const byRoute = groupBy(session.annotations, (a) => a.session.route);

  const sections = Object.entries(byRoute).map(([route, anns]) => {
    const body = anns.map(renderAnnotation).join("\n\n");
    return `## Route: \`${route}\`\n\n${body}`;
  });

  const heading = `# Starling annotations (${session.annotations.length})`;

  if (session.annotations.length === 0) {
    return [PREAMBLE, heading, "_No annotations captured._"].join("\n\n");
  }

  return [PREAMBLE, heading, ...sections].join("\n\n");
}

function renderAnnotation(a: Annotation): string {
  const where = a.source
    ? `${a.source.relativePath}:${a.source.lineNumber}${
        a.source.componentName ? ` (in <${a.source.componentName}>)` : ""
      }`
    : `${a.context.tagName}${
        a.context.componentName ? ` in <${a.context.componentName}>` : ""
      } (no source — use fallback locators)`;

  const json = JSON.stringify(
    {
      id: a.id,
      note: a.note,
      source: a.source,
      fallbackLocators: a.fallbackLocators,
      trigger: a.trigger ?? null,
      context: a.context,
      session: a.session,
    },
    null,
    2,
  );

  const lines = [
    `### ${where}`,
    `**Note:** ${a.note.trim() || "_(empty)_"}`,
  ];
  // This element lives in a transient overlay — tell the reader how to reach it
  // (the marker is only visible while the overlay is open).
  if (a.trigger) {
    lines.push(`**Reachable via:** open "${a.trigger.label}" (transient overlay)`);
  }
  lines.push("```json", json, "```");
  return lines.join("\n");
}
