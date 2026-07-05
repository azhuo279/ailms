---
name: inventor
description: Turns UX feedback into sample design directions. Given a feedback source (a design annotation/feedback item from whatever annotation tool the project uses, or an inspector finding from the audit report) that targets a specific page, subpage, or single component, it produces THREE design variants that each address the feedback from a different angle — and renders them as real, interactive component/page/flow mockups embedded in one self-contained, scrollable HTML. Use this skill whenever a designer wants to explore design directions from feedback, see "what could this look like if we fixed it", generate variant mockups, ideate solutions to an annotation or audit finding, or get sample redesigns grounded in the existing design system. Works hand-in-hand with the composer skill: every variant is derived from the same design tokens and component library. Trigger on phrases like "turn this feedback into designs", "show me variants for this annotation", "give me 3 directions for this finding", "invent some redesigns for X", or "what are some ways to address this feedback".
---

# Inventor — Feedback → Design Directions

The inventor closes the loop on the audit + redesign flow. The **inspector** skill and the
project's **design-annotation / feedback tool** (whatever it is) each emit a *feedback item*
— a clear, located actionable for a change to the UI. The inventor takes one piece of that
feedback, scoped to a single target (a
**page**, a **subpage/section**, or a **single component**), and produces **three design
variants** that attack the feedback from different angles. The output is **one
self-contained, scrollable HTML file** in which each variant is rendered as a *real,
interactive mockup* — not a description, not a screenshot — built from the project's own
design tokens and component patterns.

The inventor is an **ideation** tool, not an implementation tool. It does not edit the
app's source. It hands the designer concrete, comparable directions so they can pick one
(or splice the best of several) before anyone touches `src/`.

## The deliverable

The skill produces **one file per invocation**:
`inventor-workspace/<target-slug>-<YYYYMMDD-HHmmss>-directions.html`.

The timestamp (`YYYYMMDD-HHmmss`, e.g. `20260621-143022`) is derived at the start of each
run via `date +%Y%m%d-%H%M%S` and stored in a shell variable (`INVENTOR_STAMP`). Every
output path in the run — the brief and the HTML — is constructed from the same stamp so
that two parallel inventor runs for different feedback items never collide.

That file — rendered, on disk, presented to the user, and auto-opened — is what "done"
means. Variants discussed only in chat do not count. The whole point is something the
designer can open, scroll, scrub through three live mockups side-by-side-ish, and hand to
a stakeholder. If at the end of the run that HTML file doesn't exist, the skill hasn't
shipped.

This is the most common failure mode for skills like this: do excellent design thinking,
describe three great variants in prose, and skip the render. It isn't complete until the
file is written and opened.

## Relationship to the other skills (read this — it defines the contract)

| Skill | Role | Reads | Writes |
| --- | --- | --- | --- |
| **inspector** | audits running app vs PRD + heuristics | the app | the inspector's audit report (findings) |
| **annotation tool** | captures live annotations on the prototype | designer clicks | feedback items (read via whatever the project provides) |
| **composer** | translates intent → UI from the real component library | feedback + intent | (normally `src/`; here, in-memory variant specs) |
| **inventor** | turns one feedback item → 3 sample directions | a feedback file | `inventor-workspace/*.html` (variant mockups) |

**Hand-in-hand with composer (mandatory).** The inventor does not free-hand UI. For every
variant it runs the *composer's discipline* over the target: discover the real components
and tokens already in the codebase, reuse them, and never invent values. The difference
from a normal composer run is the **output target** — instead of writing `.tsx` into
`src/`, the inventor ports those same component patterns and tokens into a self-contained
HTML mockup so the variants render standalone. The design-system contract is identical;
only the destination differs. See `references/variant-recipes.md` for exactly how to port
a real component into inline HTML without drifting off the token system.

## Prerequisites (check before starting)

- [ ] **A feedback source** — a design annotation/feedback item or an inspector finding
      (from the inspector's audit report, or a finding object). The feedback can arrive two
      ways:
      - **From an annotation/feedback tool** — if the host project ships one (an in-browser
        annotation tool, a feedback store, a CLI/API that lists and fetches annotations),
        use it to list candidates and fetch one item's content. The prompter describes the
        item by metadata, not id; list, then narrow by author/date/latest as the tool allows.
      - **Pasted or described directly** — if the project has no such tool, accept the
        feedback item the user pastes or describes (the note plus what it targets).
      If the user didn't name one, list whatever the project exposes and ask which to use,
      plus check for an inspector audit report. Don't invent feedback.
- [ ] **Design tokens** are accessible — locate the project's token source (e.g. a global
      CSS file's `@theme {}` / `:root` / theme blocks, a tokens file, or a design-system doc
      that mirrors them in prose). This is the live source of truth. If you can't find one,
      stop and request it.
- [ ] **Component library** is accessible — locate the project's component library
      (primitives + any domain/shared components). If you can't find it, stop and request
      access.
- [ ] **The target is identified** — which page / subpage / component the feedback marks.
      The feedback file's locator bundle (or finding) points at it; confirm you can find
      the source so your variants stay faithful to the real thing.

---

## Workflow

The run is two phases. Phase 1 is *invention* (where the thinking goes); Phase 2 is
*delivery* (the part that gets skipped — don't).

### Phase 1 — Invent

#### Step 1 — Parse the feedback

From the fetched (or pasted) feedback item — or the inspector finding — extract, into a
small structured note:

- **The note / recommendation** — what the designer or auditor asked for, verbatim.
- **The target** — component name, route, and locator bundle. For an annotation, that's
  whatever the tool records: a component name, the route/URL, and any fallback locators or
  source reference (file:line) it captures. For an inspector finding,
  it's the finding's title, what-the-app-does description, and any screenshot. Classify the
  target's
  **scope**: `component` · `subpage/section` · `page` · `flow`. Scope drives how much you
  render per variant (a single component → render just it; a page → render its key regions).
- **The underlying problem** — restate it as a design problem, not a literal instruction.
  *"Make this scrollable"* → the problem is *"the ranked list overflows its container and
  truncates entries the user needs to compare."* Naming the problem is what unlocks three
  genuinely different angles instead of three flavors of the same literal fix.
- **Tag** (carry it through if present) — `PRD` / `UI` / `UX` for inspector findings (the
  inspector picks a single primary type, so a mixed finding carries its primary type — there
  is no combined tag); annotation notes are change requests by default.

Derive the run stamp at this point if not already set. The stamp includes a 6-character
random suffix so two parallel inventor runs that start within the same second still
produce unique filenames:
```bash
INVENTOR_STAMP=$(date +%Y%m%d-%H%M%S)-$(LC_ALL=C tr -dc 'a-z0-9' </dev/urandom | head -c 6)
# e.g. 20260621-143022-k7x9mq
```
Save the brief as `inventor-workspace/brief-<target-slug>-${INVENTOR_STAMP}.md`. The HTML
report links back to the original feedback file, so record its relative path.

#### Step 1.5 — Triage: is this worth inventing for? (gate)

The inventor earns its keep on feedback that needs **creative probing** — feedback where
the *right* answer isn't obvious and exploring three angles genuinely helps the designer
decide. Before investing effort, judge whether the feedback clears that bar.

**Stop and get confirmation when the feedback is a trivial, single-answer change** — the
kind a developer would just *do* in seconds, where there's no real design space to explore
and three variants would be three near-identical mockups. Tell-tale signs:

- A specific value swap with one obvious result — *"change this color to a different shade
  of white,"* *"make this text larger,"* *"add 8px of padding,"* *"bold this label,"*
  *"round the corners a bit more."*
- The instruction already names the exact fix, leaving nothing to invent — there's no
  underlying *problem* to reframe, just a token to nudge.
- Any three "angles" you could generate would differ only in degree (one shade lighter vs.
  two), not in kind.

When the feedback is trivial like this, **do not silently churn out three variants.** Say
so plainly and ask the user to confirm before proceeding, e.g.:

> This reads as a small, single-answer tweak (*"<the feedback>"*) — likely a one-line code
> change rather than something that benefits from exploring three directions. Want me to
> generate variants anyway, or would you rather hand it straight to implementation?

Proceed only on explicit confirmation. **Generate the three directions without asking** when
the feedback opens a real design question — a layout that overflows, a flow that confuses, a
hierarchy that buries the primary action, an interaction that doesn't scale, an ambiguous
`PRD`/`UX` finding. Those reward probing; that's exactly what the inventor is for.

When in doubt, lean toward asking on the trivial end and proceeding on the substantive end —
a wasted confirmation is cheap; three throwaway mockups of a color swap are not.

#### Step 2 — Locate and read the real target

Find the target in the source tree using the locator bundle (prefer an exact source
reference when present; else the fallback locators, most-stable first; else search by
component name). **Read the actual component.** You are redesigning a real thing — your
variants must start from its real structure, props, data shape, and the tokens/classes it
already uses. Note:

- The component's current Tailwind classes and which design tokens they resolve to.
- Its data/props (so mockups show realistic content, not lorem ipsum).
- Sibling/parent components it composes with (relevant for subpage/page scope).

If you genuinely cannot locate the target, say so and ask — do not redesign a guess.

#### Step 3 — Discover reusable components & tokens (composer discipline)

Run the composer's component-and-token discovery over the target. Catalogue:

- **Primitives** in the project's component library you can reuse (Button, Card, Tag, Chip,
  Table, Tabs, ContentSwitcher, ProgressBar, Tooltip, Modal/Drawer, etc.).
- **Domain / shared components** (e.g. a status badge, a category tag).
- **The exact tokens** the surface uses — colors (`--color-*`, semantic `--bg-*`/`--fg-*`),
  spacing, radius (`--radius-card`), shadows, type scale. You will copy the *used subset*
  into the report's inline `<style>` so the mockups render with real values.

**Reuse is mandatory, not aspirational.** Once you've picked the three angles (Step 4),
build a **per-variant component manifest**: every primitive each angle renders maps to an
existing library component, and the mockup *ports that real component* (its real classes
resolved to tokens, including the interaction state you depict) — never a hand-rolled
look-alike. A variant that invents its own `<button>` instead of porting `Button`, or its
own pill instead of `Tag`/`Chip`, has failed the design-system contract even if it looks
close. Read the component's source before porting; do not eyeball its sizing. See
`references/variant-recipes.md` Step 2.0 for the manifest format and the porting recipe.

Apply the project's standing design rules while you catalogue. Check the host project's
conventions (its design-system doc, contributor guide, or equivalent) and honor any
non-negotiable rules it defines. Common ones worth confirming against the project:

- **Token-only colors** — reference design tokens; never hard-code hex when a token exists.
  If the project reserves a specific ramp for a role (e.g. a dedicated palette for
  AI-generated surfaces), respect that mapping rather than picking colors freely.
- **No inline px** — map any pixel value to the nearest spacing/text token.
- **Watch for broken or special-cased tokens** the project documents (e.g. a utility that
  resolves to transparent, or a translucent surface that needs a paired backdrop-blur).
- Keep it **simple / low-density** — drop non-load-bearing chips and meta-tags.

#### Step 4 — Define three angles (the heart of the skill)

The three variants must address the **same underlying problem** from **genuinely different
design angles** — not three sizes of the same fix. Pick three distinct lenses. See
`references/variant-recipes.md` for the full menu and per-angle guidance; common axes:

- **Conservative / in-place** — smallest change that resolves the feedback within the
  existing layout (e.g. add inner scroll + sticky header). Lowest risk, ships fastest.
- **Restructure / re-layout** — rethink the container or information hierarchy (e.g. split
  into tabs, collapse to a summary + expand, two-column → stacked). Medium effort.
- **Reconceive / different interaction model** — change *how* the user accomplishes the
  goal (e.g. ranked list → searchable/filterable table, static chart → toggleable view,
  modal → inline drawer). Highest effort, often best long-term.

Each angle must (a) actually resolve the feedback, (b) be buildable from the existing
component library, and (c) carry a clear, *honest* tradeoff. If an angle has no real
tradeoff you're not being honest — every direction costs something.

Write the three angles into `brief.md` as one-liners before you render anything.

#### Step 5 — Compose each variant as real, self-contained UI

For each of the three angles, build the variant as a **live HTML/CSS mockup** that ports
the real component patterns and tokens. This is the composer's Step 6/8/9, retargeted to
inline HTML. The non-negotiables (full details in `references/variant-recipes.md`):

- **It must look and behave like real code, not a wireframe.** Use the real type scale,
  real spacing, real radii (`--radius-card`), real band/semantic colors, real component
  shapes (a Card looks like the project's Card; a Tag looks like the project's Tag).
- **Use realistic content** pulled from the component's real data shape / the feedback's
  context text — the same entity names, metric values, record fields, etc.
- **Make it interactive where the angle implies interaction** — if a variant introduces
  tabs, a toggle, a filter, or a scroll region, wire it with a tiny bit of inline vanilla
  JS / native controls so the reviewer can actually try it. No frameworks, no CDNs — the
  file must open offline.
- **Tokens become inline CSS variables.** Copy the *used* token subset into the report's
  `:root` (see template). Reference them with `var(--color-...)`. Never paste raw hex when
  a token exists; never introduce a value that isn't in the token set.
- **Respect scope.** Component scope → render the component in a realistic frame. Subpage
  scope → render the section with enough surrounding context to read. Page scope → render
  the key regions (don't rebuild the whole app shell pixel-for-pixel; frame it).
- **Each variant carries a comment block**: *How the feedback was addressed* (1–3
  sentences mapping the angle to the problem), then a compact two-column **Advantages /
  Disadvantages** pair of bulleted lists (not prose). Keep each bullet to a short phrase
  (≈3–8 words) — what it wins on (effort, fit, clarity) vs. what it costs (added density,
  learnability, deviation from current patterns). Every variant must list at least one of
  each; a column with no entries means you haven't looked hard enough.

If a token or component is genuinely missing, **flag the gap** in the variant's comment and
use the closest token — do not invent a value silently.

### Phase 2 — Deliver

#### Step 6 — Render the single scrollable HTML

This is non-optional. The output path is:
```
inventor-workspace/<target-slug>-${INVENTOR_STAMP}-directions.html
```
Read `references/report-template.html`, copy it whole, and fill every placeholder. The
structure (one vertical scroll):

1. **Header** — target name, scope, route, date.
2. **Linked feedback** — the original note/recommendation quoted, with a clickable link to
   the source feedback file (relative path) and the located source file.
3. **The underlying problem** — your one-paragraph restatement.
4. **Three variant sections**, each containing:
   - a variant title + angle label (Conservative / Restructure / Reconceive, or your own),
   - the **live mockup** embedded directly in the flow (real, interactive component/page),
   - a **comment** panel: *How the feedback was addressed* + a two-column
     *Advantages / Disadvantages* bullet pair.
5. **Footer** — note that this is ideation; next step is composer → `src/`.

All CSS inline in one `<style>` block. All JS inline. No external assets, no network. The
mockups are real DOM, styled with the ported tokens, scoped so the three variants don't
leak styles into each other (scope each variant's CSS under its section id/class).

#### Step 7 — Verify and present

Run the definition-of-done checklist below. Then present the file and auto-open it.

#### Step 8 — Clean up

Leave `inventor-workspace/` on disk (the brief + the HTML are the artifacts). Add it to
`.gitignore` if the user wants it kept locally; don't commit it unless asked.

---

## Definition of done

Before declaring the skill complete, run through this explicitly. If any item fails, fix it
before finishing.

1. **The file exists.** `ls -la "inventor-workspace/<target-slug>-${INVENTOR_STAMP}-directions.html"` shows a non-zero file. A real report with three live mockups is typically ≥ 40KB; if it's tiny, a section didn't render — investigate.
2. **No placeholders remain.** Grep the file for `<!-- ` followed by an uppercase
   placeholder name. Any left means the template wasn't fully populated.
3. **Exactly three variants rendered.** Three variant sections, three comment panels, three
   distinct angles. Not two, not "and a bonus fourth."
4. **The feedback is linked.** The original feedback file's relative path appears as a real
   `<a href>`, and the note/recommendation is quoted verbatim.
5. **Mockups are real, token-grounded UI.** Spot-check: classes/styles reference the ported
   `var(--...)` tokens, not stray hex; content is realistic; interactive angles actually
   respond.
5a. **Every primitive is a port, not a look-alike.** For each variant, confirm every
   button / tag / chip / toggle / input it renders is a faithful port of the matching
   library component (`Button`, `Tag`, `Chip`, `ContentSwitcher`, …) — its real radius,
   size scale, typography, and state tokens — and that the per-variant "Reuses" line names
   them. A hand-rolled control that merely resembles a real one is a fail; go back to the
   manifest (recipe Step 2.0) and port it.
6. **It opens offline.** No `<script src=...>` / `<link href=...>` to a CDN; no external
   images. Self-contained.
7. **Presented and auto-opened** (see below).

Only after all seven pass is the run done. Don't post a chat description of the three
variants *instead of* writing the file — that's the failure this gate prevents. A one-line
"directions rendered" is fine; the variants live in the HTML.

### Auto-opening the report

Use the exact path derived from `INVENTOR_STAMP` — do not glob or use `head -1`, since
multiple reports may exist in the workspace from parallel runs.

```bash
REPORT_PATH="$(pwd)/inventor-workspace/<target-slug>-${INVENTOR_STAMP}-directions.html"
case "$(uname -s)" in
  Darwin) open "$REPORT_PATH" ;;
  Linux)
    if grep -qi microsoft /proc/version 2>/dev/null; then
      explorer.exe "$(wslpath -w "$REPORT_PATH")"
    else
      xdg-open "$REPORT_PATH" 2>/dev/null || true
    fi ;;
  MINGW*|MSYS*|CYGWIN*) start "" "$REPORT_PATH" ;;
  *) : ;;
esac
```

The silent fallback matters — if open fails (headless), the run shouldn't fail with it. If
the user said "don't open it," skip this.

---

## What to avoid

- **Don't end without writing the HTML.** The on-disk file is the deliverable; a chat
  summary is not a substitute. If you're about to wrap up with "here are three ideas" in
  prose, that's the signal to render instead.
- **Don't produce three flavors of the same fix.** The value is *different angles* on the
  same problem. If all three are "smaller / bigger / a touch different," go back to Step 4.
- **Don't free-hand off the design system.** Every variant ports real components and real
  tokens. No invented hex, no arbitrary px; honor any role-reserved palette the project
  defines (e.g. a dedicated ramp for AI surfaces) instead of picking colors freely.
- **Don't render wireframes.** Each variant must read as a real component/page/flow in
  code, with real content and working interaction where implied — not gray boxes.
- **Don't edit `src/`.** The inventor ideates. Implementation is a separate composer run
  the designer triggers after picking a direction.
- **Don't skip the tradeoff.** A variant with no stated cost is dishonest. Name what each
  direction sacrifices.
- **Don't invent the feedback.** If no feedback file is provided or found, ask — don't
  manufacture an annotation to have something to redesign.
- **Don't burn effort on trivial feedback.** A single-answer tweak (a color shade, a font
  size, a padding bump) has no design space to explore — stop and confirm before generating
  variants (see Step 1.5). Three mockups of a one-line change waste everyone's time.
- **Don't bloat with CDNs.** Inline everything. The file must open offline.

## Workspace layout

Each invocation stamps its outputs with `YYYYMMDD-HHmmss-<6-char-random>`, so parallel
runs that start at the same wall-clock second still produce unique filenames.

```
inventor-workspace/
├── brief-<target-slug>-<YYYYMMDD-HHmmss-xxxxxx>.md           # parsed feedback + problem + 3 angles
└── <target-slug>-<YYYYMMDD-HHmmss-xxxxxx>-directions.html    # the deliverable: 3 live variant mockups
```

## Reference files

- `references/variant-recipes.md` — the menu of design angles, and the recipe for porting a
  real component/page into a self-contained, token-grounded, interactive HTML mockup.
- `references/report-template.html` — the single-scroll HTML skeleton: linked feedback +
  three variant sections (mockup + comment) + footer. Copy and fill.
