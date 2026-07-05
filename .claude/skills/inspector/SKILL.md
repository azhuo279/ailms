---
name: inspector
description: Audits any running Next.js web application against its PRD and industry UX/UI best practices (Nielsen's heuristics, WCAG 2.1 AA, responsive design) by driving the app turn-by-turn with the Playwright MCP server as a simulated user. Use this skill whenever a user wants to validate that an implemented UI matches the product requirements, find UX issues before launch, run a UX/UI audit, do a "PRD vs implementation" review, simulate a user walking through their app, or decide whether discrepancies should be fixed by updating the PRD or by changing the code. Trigger on phrases like "audit my UI", "does my app match the PRD", "test the UX of this Next.js app", "simulate a user going through my app", "check my web app against best practices", or any request that involves comparing a deployed/running UI to written product requirements. Run this skill from the root of the Next.js repository.
---

# UX/UI ↔ PRD Audit

This skill simulates a user navigating a Next.js web application by driving a real browser through the **Playwright MCP server**, then compares what it observes against (a) the project's PRD and (b) widely accepted UX/UI heuristics. The output is a self-contained HTML report (a scannable, filterable "findings register") where every finding carries **two tags** — a **criticality** (High / Medium / Low) and an **issue type** (PRD / UI / UX) — so the reader can triage by severity and route each finding to the right kind of fix.

## The deliverable

The skill produces **one file per run**, stamped with the run's date and time so reports never overwrite each other: `audit-workspace/reports/audit-report-<YYYYMMDD-HHmmss>.html`. That file — rendered, on disk, presented via `present_files` — is what "done" means. Findings discussed only in the chat don't count as output. The user wants something they can open, share, attach to a ticket, or hand to a designer. If at the end of the run that HTML file doesn't exist, the audit hasn't actually shipped.

Hold onto this throughout. The most common way an audit like this goes wrong is to do excellent analytical work, surface findings in conversation, and then skip the render step because the analysis already feels complete. It isn't complete until the file is written.

## When to use this skill

Invoke whenever there's both a written PRD and a running implementation, and the user wants to know how well they match — or wants a UX review at all. It works best partway through development (after key flows exist) or pre-launch.

If there's no PRD, ask the user where it is or whether they want a pure heuristic audit (skip the PRD comparison sections). If there's no way to start the app, stop and ask.

## The core idea: two tags per finding

Every finding carries **two tags**. Together they let the reader triage (how bad?) and route the fix (what kind of problem?). Tag both on every finding — without them, the user has to redo the analysis themselves, which defeats the purpose.

**1. Criticality** — how much it hurts:

- **`high`** — blocks a core flow, breaks accessibility for a meaningful group, or directly contradicts an explicit PRD requirement.
- **`medium`** — degrades the experience but the flow still works.
- **`low`** — polish, consistency, nice-to-have.

**2. Issue type** — the nature of the problem (pick the single best fit):

- **`PRD`** — a misalignment with the PRD: the implementation diverges from an explicit requirement, or the PRD itself is wrong / stale / self-inconsistent. The fix is to build to spec or correct the PRD.
- **`UI`** — a visual bug or unconventional design pattern: layout breakage, responsive overflow, inconsistent styling, a control that looks/behaves oddly. The fix is a presentational change.
- **`UX`** — a usability problem, **including accessibility**: confusing flow, missing feedback, hidden affordance, poor information scent, WCAG/a11y violations. The fix improves how the user understands or operates the thing.

A finding can touch more than one of these; choose the **primary** nature. When the root issue is the spec, prefer `PRD`; when the app works against the spec but the felt problem is comprehension or operability, prefer `UX`; reserve `UI` for problems that are fundamentally visual/presentational. In a PRD-reconciliation audit it's normal for `PRD` to dominate — that's an honest reflection of a spec-conformance review.

## Why MCP, and why this matters

The audit drives the browser via the Playwright MCP server, not a written `.spec.ts` file. The difference is consequential:

- **Each browser action is a tool call.** You navigate, snapshot, click, type — one at a time — and reason about what you see between actions. This is much closer to how a real user (or a careful manual tester) explores an app.
- **Accessibility snapshots are the primary observation surface.** `browser_snapshot` returns the live accessibility tree. That tree _is_ what assistive tech sees, so unlabeled buttons, missing roles, and broken landmarks surface naturally during the audit rather than requiring a separate WCAG pass.
- **Screenshots are supplementary.** Use them to capture visual issues (contrast, layout, responsive breakage) and to embed in the report as evidence — not as the main thing being analyzed.
- **The audit is adaptive.** When a flow doesn't match the PRD's description (button labelled differently, step missing, extra screen inserted), you notice immediately and capture that as a finding rather than failing a brittle assertion.

## High-level workflow

The audit is two phases. Phase 1 is exploration (where most of the time goes); Phase 2 is delivery (the part that often gets skipped — don't).

**Phase 1: Audit**

1. **Ensure Playwright MCP is available** (see "Setup" below).
2. **Locate the PRD.**
3. **Read the PRD** and extract a checklist of testable claims (flows, features, constraints).
4. **Start the Next.js dev server** and confirm the browser can reach it via MCP.
5. **Walk through the app** by driving the browser with MCP tools: navigate, snapshot, click, type, capture screenshots at key moments, switch viewports.
6. **Compare observations to PRD claims and heuristics**, producing a tagged findings list.

**Phase 2: Deliver**

7. **Render the HTML report** — this is not optional. Read `report-template.html` (in this skill's directory), fill in every placeholder, embed screenshots, write to a stamped file `audit-workspace/reports/audit-report-<YYYYMMDD-HHmmss>.html` (one per run — never overwrite a prior report). A worked generator lives at `audit-workspace/build-report.py` — reuse/adapt it rather than re-deriving the fill step; it already stamps the output filename and prints the path it wrote.
8. **Verify and present.** Check the file exists and is non-trivial in size, then call `present_files` on it.
9. **Clean up** — close the browser, kill the dev server.

Don't rush Phase 1 — the value is in the comparison, not the automation; a fast audit with shallow findings is worse than a slower one that catches real issues. But don't _stop_ before Phase 2 either. Findings only have value when they're written down in a form the user can act on.

## Setup

### Ensuring Playwright MCP is available

Check the available tools for ones prefixed with `playwright` or matching `browser_navigate`, `browser_snapshot`, `browser_click`, etc. If they're present, proceed.

If they're not present, call `search_mcp_registry` with `["playwright", "browser", "automation"]`, then `suggest_connectors` with the result so the user can connect it in one click. Stop and wait for their selection — don't try to substitute another approach.

### Finding the PRD

Look in this order and use the first one that exists:

1. `./PRD.md`
2. `./docs/PRD.md`
3. `./docs/prd.md`

If none of these exist, ask the user for the path. If they say there isn't one, offer a pure heuristic audit and proceed only if they confirm.

### Starting the dev server

Inspect `package.json` to find the dev script. Most Next.js projects use one of `npm run dev`, `pnpm dev`, or `yarn dev` — pick based on the lockfile present (`package-lock.json`, `pnpm-lock.yaml`, `yarn.lock`).

Start the server in the background:

```bash
mkdir -p audit-workspace
nohup npm run dev > audit-workspace/dev-server.log 2>&1 &
echo $! > audit-workspace/dev-server.pid
```

Poll the log file (or curl the port) until the "ready" message appears. The default port is 3000 but check the log in case it landed elsewhere. Then verify the URL is reachable with `browser_navigate` before starting the real audit.

If the project requires environment variables that aren't set, the dev server will usually fail fast — surface the error to the user and stop. Don't guess at secrets.

**Always clean up.** After the audit completes (success or failure), close any MCP browser context and kill the dev server:

```bash
kill $(cat audit-workspace/dev-server.pid) 2>/dev/null
```

## Reading the PRD

Read the PRD end-to-end before touching the app. Extract a structured checklist with three buckets:

- **Flows** — sequences of user actions the app must support (sign up, create a thing, edit a thing, etc.). Each flow should be testable end-to-end in the browser.
- **Features** — discrete capabilities tied to UI elements (a search bar, a filter, a notification badge).
- **Constraints** — copy, tone, branding, accessibility requirements, supported devices.

Save this checklist to `audit-workspace/prd-checklist.md` so it's referenceable later and so the user can see what was extracted (sometimes the PRD is ambiguous, and surfacing the extraction is the first finding).

If the PRD is sparse or vague on a section, note it — that's itself a `PRD`-type finding candidate.

## Driving the app via Playwright MCP

The audit runs as a sequence of MCP tool calls. See `mcp-driving.md` for the full catalogue of tools, snippets for common probes, and pitfalls. The high-level pattern:

1. **`browser_navigate`** to the entry point.
2. **`browser_snapshot`** to get the accessibility tree of the current page.
3. **Reason about the snapshot** — what's on this page? does it match the PRD's description? are there obvious heuristic violations?
4. **Take a screenshot** with `browser_take_screenshot` and save it under `audit-workspace/screenshots/<flow-name>-<step>.png`. Also save the snapshot JSON to `audit-workspace/a11y/<flow-name>-<step>.json` — both are useful evidence.
5. **Act** — `browser_click`, `browser_type`, `browser_press_key` to advance the flow. Refer to elements by the names/refs from the snapshot, not by guessed CSS selectors.
6. **Repeat** for each step of each PRD flow.
7. **Switch viewports** with `browser_resize` (mobile 375×667, desktop 1440×900) and replay critical flows.

### Acting like a real user

Refer to elements by the **accessible name** from the snapshot, not by guessed selectors. This matters for two reasons:

- It's how a screen reader or keyboard user finds the element. If you can't find a button by its visible label, that's likely an accessibility issue worth recording.
- It's resilient. Class names and DOM structure change; "the Sign in button" doesn't.

If the snapshot shows an interactive element with no accessible name (a button with role="button" but no `name`), that's a finding — note it and try a positional fallback to keep moving, but capture the accessibility issue.

### When the PRD's description doesn't match what's on screen

This is the most important pattern in the whole skill. When you expect "Click the 'Continue' button" and the actual button says "Next", or there's an unexpected modal in the way, or a required field isn't present — **don't try to force the script through.** Capture it as a finding, tag its criticality and issue type (`PRD` / `UI` / `UX`), and either work around it (if the workaround is what a real user would do) or stop that flow and move to the next one.

## Heuristic checks

Alongside PRD-driven flows, run a generic heuristic pass. See `heuristics.md` for the full checklist (Nielsen's 10, WCAG 2.1 AA essentials, responsive design, common Next.js-specific issues). Skim it before the audit so the relevant probes are in mind.

Key categories to cover at minimum:

- **Visibility of system status** — loading states, success/error feedback after actions (use `browser_wait_for` against expected indicators; if nothing appears within ~100ms of a click, note it)
- **Error prevention and recovery** — form validation, destructive action confirmations
- **Consistency** — repeated UI patterns behaving the same way
- **Accessibility basics** — `browser_snapshot` exposes most of this directly; also try `browser_press_key("Tab")` repeatedly to verify focus order and visibility
- **Responsive behavior** — `browser_resize` to 375×667 and re-snapshot; look for horizontal overflow, clipped content, and tap targets < 44×44

For each category, run a probe and record what you saw. Even "no issues found in category X" is worth saying explicitly so the user knows it was checked.

## Producing findings

For every observation, build a finding object with this shape (these get rendered into the HTML report):

```
{
  "id": "F1",                          // stable id for ordering/anchors; NOT shown as a tag in the UI
  "title": "short descriptive title",  // the scannable headline (no id prefix)
  "severity": "high" | "medium" | "low",   // criticality tag
  "type": "PRD" | "UI" | "UX",             // issue-type tag (see "two tags per finding")
  "prd": "quote or 'PRD is silent on this'",
  "app": "observed behavior",
  "heuristic": "which principle/standard, if any, this violates (or null)",
  "screenshots": ["path/to/img1.png", "path/to/img2.png"],
  "recommendation": "concrete next step — build to spec, presentational fix, or usability change"
}
```

See "The core idea: two tags per finding" above for the `severity` and `type` rubrics. Be honest about uncertainty: when the issue type is genuinely mixed, pick the primary nature and say why in the recommendation rather than making a confident-but-wrong call.

The report renders each finding as a collapsible **register row**: the collapsed row shows the criticality chip, the issue-type tag, and the title; expanding reveals the recommendation (lead), the PRD/app/heuristic detail, and any evidence screenshots (click-to-load). The finding-block markup is documented inline in `report-template.html` (and built by `audit-workspace/build-report.py`). Emit **up to 10 findings**, sorted High → Medium → Low; the first row opens by default. Ten is a ceiling,
not a quota — if the app is clean, report fewer and say so. If the audit surfaces more than ten real
issues, keep the ten highest-criticality ones (break ties toward issues that block a flow or contradict
the PRD) and note in the summary that additional lower-priority issues were observed but not itemized, so
the report stays focused instead of burying the reader.

## Phase 2: Render and deliver the report

This phase is non-optional. See "The deliverable" at the top of this file for why.

The report is a single self-contained HTML file at `audit-workspace/reports/audit-report-<YYYYMMDD-HHmmss>.html`. "Self-contained" means: screenshots are embedded as base64 data URIs, all CSS is inline in a `<style>` block, no external assets. The user can email it, attach it to a ticket, or open it offline.

Use `report-template.html` (in this skill's directory) as the skeleton. The template has placeholder comments — `<!-- FINDINGS -->` (one register, findings pre-sorted by criticality), the count placeholders (`<!-- TOTAL_COUNT -->`, `<!-- HIGH_COUNT -->`/`MEDIUM`/`LOW`, and `<!-- PRD_COUNT -->`/`UI`/`UX`), `<!-- SUMMARY_PARAGRAPH -->`, `<!-- TOP_ISSUES -->`, `<!-- FLOWS_TABLE_BODY -->`, `<!-- COVERAGE_TABLE_BODY -->` — that you fill with rendered HTML. The template's own doc-comment deliberately contains **no nested comment markers**; never paste an example into it that contains `<!--`/`-->`, or it will terminate the comment early and leak markup into the page (this was a real past bug).

### Embedding screenshots

For each screenshot referenced in a finding, read the PNG bytes and convert to base64, then embed:

```html
<img
  class="screenshot"
  src="data:image/png;base64,<BASE64>"
  alt="<description>"
/>
```

A small inline Python helper (written during the audit, no need to bundle in the skill) can batch this conversion.

If total embedded screenshot size would exceed ~10MB, reference them as relative paths instead (`<img src="screenshots/foo.png">`) and warn the user that the report is no longer fully self-contained. For most audits (up to 10 findings × 1–2 screenshots each, captured at reasonable resolution) embedding
stays well under the threshold.

### Visual conventions

The template is a **neutral, tool-agnostic document** (it deliberately does not use the app's brand tokens). Each finding carries two labeled tags:

- **Criticality** — a filled, **labeled** chip (never color-only): High → red (`--high`), Medium → amber (`--medium`), Low → slate (`--low`). The left border of each register row inherits the criticality color.
- **Issue type** — a labeled outlined tag: `PRD` (indigo), `UI` (cyan), `UX` (violet).

Both filter groups in the sticky toolbar (Level + Type) re-tag the counts so the user can scan and narrow. Color is always paired with a text label (WCAG 1.4.1). This lets the reader see at a glance where the work is concentrated and route each finding to the right fix.

### Definition of done

Before declaring the audit complete, run through this checklist explicitly. If any item fails, fix it before finishing.

1. **The file exists.** Run `ls -la audit-workspace/reports/` and confirm this run's stamped `audit-report-<YYYYMMDD-HHmmss>.html` is present with a non-zero file size. A typical report is at least ~50KB once screenshots are embedded; if it's much smaller, something didn't render and you should investigate.
2. **No placeholders remain.** Grep the file for the literal string `<!-- ` followed by an uppercase placeholder name (e.g. `<!-- FINDINGS -->`). If any of the template's placeholder comments are still present unfilled, the template wasn't fully populated — go back and render those sections.
3. **Counts match findings.** The criticality counts (`TOTAL_COUNT`, `HIGH_COUNT`/`MEDIUM`/`LOW`) and the issue-type counts (`PRD_COUNT`/`UI`/`UX`) should each agree with the finding blocks actually rendered. Mismatches usually mean a finding was tallied but not written into the report body.
4. **Both tags present.** Spot-check that every finding row carries one criticality chip (`sev--*`) and one issue-type tag (`type--*`), and that no finding shows a raw `F#` id as a visible tag.
5. **No leaked example markup.** Grep the output for `Title here` / `Drop the screenshot` / unfilled `<!-- … -->` placeholders — all should be zero. Spot-check one or two screenshot buttons resolve to base64 `data:` URIs (click-to-load).
6. **`present_files` has been called** on this run's stamped report under `audit-workspace/reports/`. The report is the deliverable; the user has to be able to open it from chat.
7. **Auto-open the report in the user's default browser.** See below.

Only after all seven pass is the audit done. Don't post a chat summary of findings _instead of_ writing the file — that's the exact failure mode this gate exists to prevent. A brief sentence acknowledging the report is fine; the findings themselves live in the HTML.

### Auto-opening the report

Once the file exists and `present_files` has been called, also try to open it in the user's default browser. This works when the skill runs in Claude Code (which has shell access to the user's machine) and is a no-op everywhere else — that's fine.

Detect the platform and run the appropriate command:

```bash
# The build step stamps the filename; open the most recent report this run produced.
REPORT_PATH="$(ls -t "$(pwd)"/audit-workspace/reports/audit-report-*.html | head -1)"

case "$(uname -s)" in
  Darwin)
    open "$REPORT_PATH" ;;
  Linux)
    # Check for WSL — Windows browsers handle it via explorer.exe
    if grep -qi microsoft /proc/version 2>/dev/null; then
      explorer.exe "$(wslpath -w "$REPORT_PATH")"
    else
      xdg-open "$REPORT_PATH" 2>/dev/null || true
    fi ;;
  MINGW*|MSYS*|CYGWIN*)
    start "" "$REPORT_PATH" ;;
  *)
    : # unknown platform; skip silently
esac
```

The `|| true` and silent fallback matter — if the open command fails (no display, headless container, missing `xdg-utils`), the audit shouldn't fail with it. The report still exists on disk and was already presented via `present_files`. Auto-open is convenience, not correctness.

If the user explicitly says "don't open it" earlier in the conversation, skip this step. Respect that.

## What to avoid

- **Don't end the audit without writing the HTML file.** This is the single most common way the skill fails: Claude does the analysis, identifies findings, writes them out in chat, and stops — without ever running the rendering step. The report on disk _is_ the deliverable. A chat summary is not a substitute. If you find yourself about to wrap up with "here's what I found" in prose, that's the signal to instead say "rendering the report now" and go do it.
- **Don't fabricate findings to pad the report.** A short, accurate report beats a long, speculative one. If the app is in good shape, say so.
- **Don't auto-fix issues.** This skill diagnoses; it doesn't patch. Even when a fix is obvious, surface it as a recommendation and let the user decide.
- **Don't skip either tag.** Untagged findings make the report unusable. Every finding needs a criticality (High/Medium/Low) and an issue type (PRD/UI/UX). If the issue type is genuinely mixed, pick the primary nature and explain the call in the recommendation.
- **Don't treat the PRD as gospel.** PRDs are often wrong or out of date — that's why this skill exists. Be willing to recommend PRD changes when the implementation's behavior is actually better.
- **Don't run destructive actions on a shared environment.** If the dev server points at a real database, ask before doing anything that writes data (deleting accounts, submitting payments).
- **Don't forget to close the browser and kill the dev server.** A lingering MCP browser session or background `npm run dev` causes "port already in use" pain on the next run.
- **Don't burn turns on huge snapshots.** Default `browser_snapshot` output can be enormous for big pages. If a snapshot is mostly noise, scope it to a region or limit depth — see `mcp-driving.md`.

## Workspace layout

Everything goes under `audit-workspace/` at the repo root:

```
audit-workspace/
├── prd-checklist.md       # extracted from the PRD
├── reports/               # one stamped report per run; never overwritten
│   └── audit-report-<YYYYMMDD-HHmmss>.html   # final report (this is what you present)
├── build-report.py        # the report generator (reuse/adapt per run)
├── screenshots/           # PNGs captured via browser_take_screenshot
├── a11y/                  # browser_snapshot results saved as JSON
├── dev-server.log         # captured server output
└── dev-server.pid         # for cleanup
```

This directory holds **only** inspector outputs. Other skills write elsewhere
(`inventor-workspace/`, `orchestrator-workspace/`); don't let their artifacts accumulate here.

Don't commit this directory — add it to `.gitignore` if the user wants to keep it around, or delete it after presenting the report if they don't.

## Reference files

- `mcp-driving.md` (this skill's directory) — Playwright MCP tool catalogue, probe patterns, and pitfalls
- `heuristics.md` (this skill's directory) — full UX/UI checklist (Nielsen's 10, WCAG 2.1 AA, responsive)
- `report-template.html` (this skill's directory) — HTML template for the final report (the "register" design: two tags per finding, severity-first, filterable, click-to-load screenshots)
