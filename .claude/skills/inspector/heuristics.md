# UX/UI Heuristics Checklist

Use this as a menu of probes during the audit. You don't need to run every check on every page — pick the ones relevant to what's on screen, and skip ones that don't apply. The point is breadth of coverage, not bureaucratic completeness.

## Nielsen's 10 Heuristics

### 1. Visibility of system status
The app should always keep users informed about what's going on.

Probes:
- After clicking a submit button, is there a loading indicator within ~100ms?
- After a successful action, is there confirmation (toast, redirect, message)?
- During background work (uploads, saves), is progress visible?
- Are network failures shown to the user, or do they just silently fail?

### 2. Match between system and the real world
Use language users understand. Avoid internal jargon.

Probes:
- Are error messages in plain language, or do they expose stack traces / error codes?
- Do labels match what a user would call the thing (e.g. "Sign out" vs "Deauthenticate session")?
- Do icons mean what users expect (a floppy disk for save, a trash can for delete)?

### 3. User control and freedom
Users need an "emergency exit" — undo, cancel, back.

Probes:
- Can the user cancel out of a multi-step flow without losing data?
- Is there a back button or breadcrumb on deep pages?
- Are destructive actions reversible, or at least confirmed?
- Does the browser back button work, or does the SPA break it?

### 4. Consistency and standards
Same things should look and behave the same way.

Probes:
- Do primary buttons look the same across pages?
- Is the nav in the same place on every page?
- Do similar actions (edit, delete) appear in the same order in lists?
- Does the app follow OS conventions for things like keyboard shortcuts?

### 5. Error prevention
Better than good error messages is a design that prevents errors.

Probes:
- Do destructive actions require confirmation?
- Are form fields validated inline, before submission?
- Are formats (dates, phone numbers) constrained by the input, or left to the user to get right?
- Are duplicate-submission risks mitigated (disabled buttons after click)?

### 6. Recognition rather than recall
Make information visible. Don't make users remember things between screens.

Probes:
- In multi-step forms, are prior steps' values shown or easily revisited?
- Are dropdowns and autocompletes used where appropriate, vs free-text?
- Does the user always know where they are in the app (breadcrumbs, page title, active nav)?

### 7. Flexibility and efficiency of use
Power users should be able to move faster.

Probes:
- Are there keyboard shortcuts for common actions?
- Can frequently-used items be pinned, favorited, or surfaced?
- Are there bulk operations where they'd make sense?

### 8. Aesthetic and minimalist design
Every extra piece of UI competes with the important pieces.

Probes:
- Is anything on screen that isn't being used? Hidden filters that no one touches, decorative widgets?
- Are there too many CTAs competing for attention?
- Is the visual hierarchy clear — can the user spot the primary action in <2 seconds?

### 9. Help users recognize, diagnose, and recover from errors
When errors happen, explain them and offer a path forward.

Probes:
- Do error messages say what's wrong AND how to fix it?
- Are 404s helpful (search box, links to popular pages) or dead-ends?
- When validation fails, is the offending field clearly marked?

### 10. Help and documentation
Even good UI sometimes needs explanation.

Probes:
- Is there contextual help where it's needed (tooltips, "?" icons, empty-state guidance)?
- Is documentation findable from the app?
- For complex features, is there a first-run tour or empty state explaining them?

## WCAG 2.1 AA essentials

A full WCAG audit is huge. These are the highest-leverage checks for a UX audit:

- **Keyboard navigation**: Can every interactive element be reached and activated with Tab and Enter/Space? Try it. Note anything that traps focus or skips elements.
- **Focus visibility**: When tabbing through, is the focused element visibly outlined? Default browser outlines getting removed without a replacement is a common offender.
- **Form labels**: Every input has an associated `<label>` (or `aria-label`/`aria-labelledby`). Inspect via the accessibility tree.
- **Alt text**: Meaningful images have alt text; decorative ones have `alt=""`. Check via `page.accessibility.snapshot()`.
- **Color contrast**: Text against its background hits 4.5:1 (3:1 for large text). Spot-check using browser devtools or by visual inspection if obviously thin.
- **Heading order**: Headings go h1 → h2 → h3 without skipping levels. Inspect the DOM.
- **Landmark regions**: Page has a `<main>`, `<nav>`, `<header>`, `<footer>` structure (or ARIA equivalents).
- **Color not sole indicator**: If something is conveyed by color (e.g. red = error), there's also a non-color cue (icon, text).
- **Motion**: Animations respect `prefers-reduced-motion` where applicable.

## Responsive design

Test at least two viewports. The defaults below are reasonable but can be adjusted to what the PRD specifies.

- **Mobile**: 375×667 (iPhone SE-ish)
- **Desktop**: 1440×900

Probes at each viewport:
- No horizontal scrollbar on any page.
- Tap targets on mobile are at least 44×44 px (Apple HIG) or 48×48 (Material).
- Text remains readable (no fonts under 14px at mobile).
- Nav collapses appropriately (hamburger, drawer, etc.) on mobile.
- Modals and dropdowns don't get clipped by the viewport.
- No content overlaps or gets cut off.
- Forms remain usable — inputs aren't crammed, labels don't overflow.

## Next.js–specific things to watch for

- **Hydration mismatches**: Console warnings about server/client HTML differing. These often indicate visible flicker.
- **Loading state on async pages**: Server components with no `loading.tsx` can leave the user staring at a blank page during fetches.
- **404 / error.tsx**: Are these actually styled and helpful, or default Next.js placeholders?
- **`<Image>` sizing**: Are images using `next/image` with proper `sizes`/`fill` props, or is the layout jumping as they load?
- **Client-side nav broken**: Sometimes `<Link>` is misused and pages do full reloads — a flash should be a clue.

## What good coverage looks like

A well-covered audit typically produces 8–20 findings across categories. Fewer than 5 either means the app is genuinely polished (say so explicitly) or the audit was too shallow. More than 30 usually means findings are over-fragmented — group related ones.
