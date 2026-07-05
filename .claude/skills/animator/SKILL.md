---
name: animator
description: >-
  Apply grounded, research-backed motion design when building or specifying any UI animation. Use whenever the
  work involves how an interface moves over time: transitions, page/route changes, modal/drawer/sheet open and
  close, toasts, tooltips, menus, hover/focus/press states, loading spinners and progress, skeleton screens, list
  reordering, drag-and-drop, expand/collapse, pull-to-refresh, onboarding, celebration moments, micro-interactions,
  and choosing durations, delays, easing, or stagger. Also trigger on "animation", "transition", "motion", "easing",
  "spring", "make it feel polished", "framer-motion", or "prefers-reduced-motion" — and when none of
  those words appear but the task requires deciding how something animates. Prefer this over recalling timing from
  memory: it supplies durations, easing curves, accessibility fallbacks, and performance constraints synthesized
  from Material, Apple HIG, Fluent, Carbon, WCAG, and HCI research. Not for static design (color, type, spacing,
  layout) with no time dimension.
---

# Animator

Motion in a UI is **communication, not decoration**. Every animation should earn its place by doing one of a
small number of jobs: confirming an action, showing system state, directing attention, revealing structure,
or preserving continuity across a change. If a motion does none of these, the research says to cut it — added
motion has a real cost (attention, time, comfort, performance) and only a conditional benefit.

This is the single most important idea in the skill. The default answer to "should this move?" is _only if the
movement tells the user something true and useful._ Hold every animation to that bar.

The timing and easing values here are **synthesized baselines** drawn from official design systems (Google
Material / Material 3, Apple Human Interface Guidelines, Microsoft Fluent and Windows, IBM Carbon), the
accessibility standards (W3C WCAG, MDN), web performance guidance (web.dev RAIL, Chrome), and peer-reviewed HCI
research. They are strong defaults, not laws — adapt them to travel distance, surface size, input type, and the
specific product. When you state a value, you should be able to say where it comes from; `references/research-basis.md`
maps every recommendation back to its source so you can cite it.

## Workflow

Follow this procedure whenever you are deciding how something animates. Work top-down — intent first, numbers
last — because picking a duration before you know the job is how arbitrary motion happens.

1. **Name the communicative intent.** What should this motion make the user understand? (e.g. "the control
   accepted my press", "this panel came from that button", "the list re-sorted but these are the same items",
   "work is in progress and getting closer to done".) If you can't name a job, don't animate.

2. **Classify the interaction.** Map it to an archetype: _immediate acknowledgment, small state change, small
   enter, small exit, contextual (same-place) transition, large/full-screen transition, expressive moment,_
   or _loading/indeterminate loop._ This determines the preset.

3. **Pick duration and easing from the preset table** (below). Then modulate: longer for greater travel
   distance or larger surfaces, shorter on desktop/web than mobile, and make **exits faster than enters.**

4. **Choose a continuity anchor.** What stays visibly the same across the change so the user keeps their place?
   A shared element, a fixed focal point, or a coordinated group that reads as one event. Motion that preserves
   object constancy helps users keep their mental map; motion that teleports everything destroys it.

5. **Specify the reduced-motion fallback and the semantic fallback.** These are not optional polish — see
   "Non-negotiables." Decide whether the motion is _essential_; if not, it must be suppressible. If it carries
   meaning, replace it (dissolve, highlight fade, color shift) rather than deleting the meaning. Anything the
   motion announces (a new toast, a status change) must also be available without motion, e.g. via a live region.

6. **Check performance.** Animate only compositor-friendly properties (transform and opacity) wherever possible;
   avoid animating properties that force layout or paint. Confirm the motion can hold frame rate on target
   hardware. If it can't, the answer is to shorten, simplify, or replace it — never to ship jank.

7. **Output.** Produce either a **motion spec** (use the template in `references/patterns.md`) when the task is
   design/specification, or **implementation** (CSS, framer-motion, etc.) when the task is to build it. In both
   cases include the reduced-motion fallback. For implementation you can lift ready-made tokens from
   `assets/motion-tokens.css` or `assets/motion-tokens.json` instead of inventing values.

## The five principles

These survive comparison across every major design system, so treat them as the backbone:

- **Purposeful** — tie motion to a state change or relationship; never animate "for the sake of it."
- **Brief** — fast enough that the user never feels they are waiting on the animation, slow enough to be read.
- **Legible** — one clear focal point; the user should be able to say afterward what changed and what stayed.
- **Hierarchical** — use motion (and choreography/stagger) to direct attention to what matters most, not to make
  everything compete at once.
- **Continuous** — preserve a visible anchor across the change so old and new states stay intelligibly related.

## Timing and easing presets

Think in layers, from instantaneous feedback up to structural change. Durations are starting points; scale them
to distance and surface, and prefer the faster end on desktop/web.

| Interaction class                  | Examples                                          | Duration                                                       | Easing                          |
| ---------------------------------- | ------------------------------------------------- | -------------------------------------------------------------- | ------------------------------- |
| Immediate acknowledgment           | press, tap, key activation, toggle                | visible response within **100 ms**; micro-motion **90–120 ms** | ease-out / decelerate           |
| Small state change                 | hover, focus, selection, checkbox, icon swap      | **90–150 ms**                                                  | ease-out                        |
| Small enter                        | tooltip, toast, menu, chip, inline validation     | **150–250 ms** (web) / **180–250 ms** (mobile)                 | decelerate / ease-out           |
| Small exit                         | dismiss, close, toast removal, collapse           | **120–200 ms**                                                 | accelerate / ease-in            |
| Contextual transition (same place) | panel swap, card expand, filter/sort, tab content | **180–250 ms** (web) / **220–300 ms** (mobile)                 | standard asymmetric ease-in-out |
| Large / full-screen transition     | drill-in, detail view, major surface change       | **300–400 ms**                                                 | standard or emphasized          |
| Expressive moment (rare)           | onboarding milestone, success celebration, hero   | **350–500 ms**                                                 | emphasized / expressive         |
| Loading / indeterminate loop       | spinner, throbber, progress loop                  | continuous                                                     | linear (only here)              |

**Enter vs exit asymmetry.** Entering elements decelerate (they arrive and settle); exiting elements accelerate
(they leave quickly and get out of the way). Exits are usually a touch shorter than the matching enter. A common
pairing is ~250 ms decelerate in / ~200 ms accelerate out.

### Easing curves (implementation-agnostic, directly usable)

| Name                    | cubic-bezier                   | Use for                                                                      |
| ----------------------- | ------------------------------ | ---------------------------------------------------------------------------- |
| Standard                | `cubic-bezier(0.4, 0, 0.2, 1)` | movement within the same context (in-place changes)                          |
| Decelerate (ease-out)   | `cubic-bezier(0, 0, 0.2, 1)`   | elements entering, and direct feedback                                       |
| Accelerate (ease-in)    | `cubic-bezier(0.4, 0, 1, 1)`   | elements exiting / leaving the screen                                        |
| Sharp                   | `cubic-bezier(0.4, 0, 0.6, 1)` | quick changes that may reverse                                               |
| Emphasized in (strong)  | `cubic-bezier(0, 0, 0, 1)`     | pronounced entrances when emphasis is warranted                              |
| Emphasized out (strong) | `cubic-bezier(1, 0, 1, 1)`     | pronounced exits                                                             |
| Linear                  | `linear`                       | **only** constant-rate motion: spinners, indeterminate loops, some rotations |

Avoid `linear` for anything that enters, exits, or moves between states — real objects accelerate and decelerate,
and linear motion reads as mechanical and unnatural. Linear is correct _only_ when a constant rate is the point.

### Choreography and stagger

Stagger should guide the eye, not build suspense. Use **short offsets** (tens of milliseconds) to soften the
entry of a group or lead the gaze in a direction, and cap the total time for the whole group so the sequence
never feels slow. If staggering makes a group feel sluggish, reduce or remove it. Coordinate parent/child and
list motion so it reads as one event rather than many independent ones. Exact stagger delays are not standardized
across systems — short-and-capped is the transferable rule.

## Non-negotiables

These two areas are not stylistic preferences. Accessibility failures cause real physical harm (vestibular
reactions, seizures); performance failures break the very continuity the motion was meant to provide. Treat the
items below as requirements and the rest of the skill as guidance.

### Accessibility

- **Honor reduced-motion requests.** If motion is not essential, it must be suppressible when the user has asked
  for reduced motion (e.g. `prefers-reduced-motion: reduce` on the web, OS settings on native). Non-essential
  interaction-triggered motion can provoke dizziness, nausea, and migraine — this is WCAG-level.
- **Replace meaning, don't just delete it.** If a motion communicates something (item moved to cart, drilled
  into a subview), the reduced-motion variant should preserve that meaning with a non-spatial cue — dissolve,
  highlight fade, color shift, haptic, or sound — rather than removing the feedback.
- **Expose dynamic changes semantically.** Anything the motion announces must also reach assistive tech without
  motion — e.g. an ARIA live region for a toast, a text status for progress. Never rely on motion alone.
- **Never flash more than three times per second** above the luminance/red threshold. This is a seizure risk
  and is a hard limit, full stop.
- **Watch vestibular triggers.** Large-scale zoom/scale, panning, parallax, depth/3D, multi-axis or multi-speed
  motion, vortex/spin effects, and auto-advancing carousels are known triggers — minimize amplitude/distance/depth
  in the reduced-motion path, or remove them.

The full reduced-motion decision tree, the complete trigger list, and the five-part reduced-motion spec are in
`references/accessibility.md`. Read it whenever a motion is large, looping, peripheral, depth-based, or
attention-grabbing — i.e. whenever there's any chance it could be a trigger.

### Performance

- **Prefer transform and opacity.** These can be handled by the compositor and animate cheaply. Animating
  properties that trigger layout (size, top/left, margins) or paint is the main cause of jank — avoid where
  possible, or animate the cheap proxy (e.g. `transform: translate`/`scale`) instead.
- **Hold the frame budget.** Smooth motion means ~60 fps, i.e. ~16.7 ms per frame for all work. Visible response
  to input should appear within ~100 ms (keep input handling under ~50 ms).
- **Degrade deliberately.** If a motion can't render smoothly on target hardware, shorten, simplify, or replace
  it. A janky animation is worse than a simpler smooth one. Use `will-change` sparingly and only just before the
  animation, since it has its own cost.

## Do / Don't

**Do:** tie motion to a real state change · keep a single visible focal point · make enter and exit asymmetric ·
scale duration to travel distance and complexity · coordinate related elements as one event · prefer local/region
motion and quick fades over moving whole large surfaces · show the next content as early as it's understandable
(it dominates perceived speed) · prefer determinate progress over endless spinners when progress is knowable.

**Don't:** cross-fade large overlapping surfaces slowly · animate every element literally when a symbolic
transition reads more clearly (e.g. re-sort a grid with a quick cross-fade rather than tracing every item's path)
· use expressive/celebratory motion in routine, repeated workflows · let a spinner or peripheral loop dominate the
screen · use `linear` easing for things that enter/exit/move · let any animation delay command execution.

## Reference files

- `references/patterns.md` — full code-agnostic pseudo-specs for common patterns (button press, loading/progress,
  contextual transition, notification/toast, onboarding, pull-to-refresh, list reorder) plus the reusable motion
  spec template. Read this when implementing or specifying any of these patterns.
- `references/accessibility.md` — reduced-motion decision tree, full vestibular/photosensitive trigger list,
  semantic-fallback guidance, and the motion comfort profile. Read before shipping large, looping, or depth-based
  motion.
- `references/research-basis.md` — the cognitive science and the source map: why motion works, where each number
  comes from, and how to cite it. Read when you need to justify a choice or attribute it.

## Assets

- `assets/motion-tokens.css` — duration and easing CSS custom properties matching the preset table, plus a
  `prefers-reduced-motion` block. Drop in instead of hardcoding values.
- `assets/motion-tokens.json` — the same tokens as JSON for non-CSS targets (native, design tools, JS animation
  libraries).
