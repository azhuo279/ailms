# Motion pattern library

Code-agnostic pseudo-specs for the most common UI motion patterns. They are written to drop directly into design
specs, tickets, or design tokens. Durations are the synthesized baselines from `SKILL.md`; treat them as starting
points and modulate for distance, surface size, and platform. Every pattern includes a reduced-motion fallback
because that is part of the spec, not an afterthought.

## Table of contents

- [Button / press acknowledgment](#button--press-acknowledgment)
- [Loading and progress](#loading-and-progress)
- [Contextual (same-place) transition](#contextual-same-place-transition)
- [Notification / toast](#notification--toast)
- [Modal / dialog / sheet](#modal--dialog--sheet)
- [Onboarding spotlight / feature discovery](#onboarding-spotlight--feature-discovery)
- [Pull-to-refresh](#pull-to-refresh)
- [List reordering / drag-and-drop](#list-reordering--drag-and-drop)
- [Reusable motion spec template](#reusable-motion-spec-template)

---

## Button / press acknowledgment

```text
Intent:        Confirm contact and readiness to execute.
Trigger:       Pointer down / touch down / keyboard activation.
Motion:        Immediate visual state change within 0–100 ms. Local micro-motion on the
               control only — no whole-screen movement. Prefer subtle depth, opacity, or
               local scale/elevation. Touch can sustain slightly stronger feedback than
               indirect input (trackpad/mouse).
Timing:        Press in 90–120 ms; release to resting/completed 90–150 ms.
Easing:        Ease-out on press; standard or ease-out on release.
Reduced motion: Keep color/border/shadow/contrast state change; drop scale and depth.
Performance:   Motion must never delay command execution.
Done when:     User can tell the control accepted input before the task itself completes.
```

## Loading and progress

```text
Intent:        Show that work has started, continues, and is moving toward completion.
Trigger:       Operation outlasts the instantaneous-response window (~100 ms).
Motion:        Acknowledge the action immediately, then escalate to a loading state only if
               the wait continues. Prefer determinate progress when progress is knowable;
               reserve indeterminate spinners for short, unknowable waits and keep them from
               dominating the screen. Bring the next content in as early as it's
               understandable — that earliness dominates perceived speed more than raw duration.
Timing:        Immediate acknowledgment; loading state appears once the wait exceeds the
               immediate-feedback window.
Easing:        Linear only where a constant rate matches the indicator (rotation). Everything
               else non-linear.
Reduced motion: Allow static or minimally animated indicators; always keep a text status.
Performance:   The indicator itself must be lightweight and must not add jank.
Done when:     User can tell the system is working and whether it's getting closer to done.
```

## Contextual (same-place) transition

```text
Intent:        Show a state change without implying a move to a new place.
Trigger:       Filter, sort, expand/collapse, local panel swap, tab-content change.
Motion:        Preserve one visible anchor or shared element. Transform or fade the affected
               region only — not the whole page. If several elements move, coordinate them as
               one event. Prefer a symbolic transition over literally animating every item to
               its new position when paths would overlap messily.
Timing:        Web/desktop 180–250 ms; mobile 220–300 ms.
Easing:        Standard asymmetric ease-in-out.
Reduced motion: Replace movement with dissolve, highlight fade, or state-color change.
Performance:   Avoid large, slow, overlapping cross-fades.
Done when:     User can say what changed and what stayed the same.
```

## Notification / toast

```text
Intent:        Attract attention in proportion to urgency without stealing focus.
Trigger:       System message, inline confirmation, snackbar, toast.
Motion:        Enter from an edge or near the source if that aids locality. Keep motion
               constrained to the notification; never animate unrelated background. Match
               intensity to urgency.
Timing:        Enter 150–250 ms; exit 120–200 ms. Any auto-dismiss countdown is independent
               of travel time.
Easing:        Decelerate on enter; accelerate on exit.
Reduced motion: Prefer fade/highlight only. Message must be readable without motion AND
               announced semantically (e.g. ARIA live region) when appropriate.
Performance:   Don't stack expressive entries for repeated routine messages.
Done when:     Urgent messages are noticeable; low-priority ones are discoverable without disruption.
```

## Modal / dialog / sheet

```text
Intent:        Establish a focused layer above the current context and a clear way back.
Trigger:       Open dialog, drawer, bottom sheet, popover.
Motion:        Enter the surface with a short decelerate (often from its origin edge or a
               scale-up from the trigger); fade/scrim the backdrop in parallel. On close,
               reverse with a faster accelerate. Keep the backdrop and the surface coordinated
               as one event so the layer reads as a single thing arriving and leaving.
Timing:        Enter 200–300 ms; exit 150–250 ms (exit shorter). Full-screen sheets sit at the
               higher end (up to ~400 ms).
Easing:        Decelerate in; accelerate out.
Reduced motion: Cross-fade or instant-with-scrim instead of slide/scale; keep focus management
               and focus trap unchanged.
Performance:   Animate transform/opacity on the surface and backdrop, not layout.
Done when:     User understands a focused layer opened over (not replaced) the prior context.
```

## Onboarding spotlight / feature discovery

```text
Intent:        Teach a relationship or a new action — not decorate the first run.
Trigger:       First use, major feature introduction, contextual nudge.
Motion:        One focal element at a time. Sequence steps with short stagger rather than
               animating everything at once. Use motion to relate trigger and result or to
               reveal hierarchy.
Timing:        Single-step emphasis 250–400 ms; keep each step's total brief.
Easing:        Standard or emphasized, depending on importance and rarity.
Reduced motion: Replace with a static callout, progressive disclosure, or a stepper.
Performance:   No autoplay loops that keep running after the point is made.
Done when:     User can infer what to do next without replaying the motion.
```

## Pull-to-refresh

```text
Intent:        Make a direct-manipulation gesture legible and predictable.
Trigger:       User drags beyond the refresh threshold.
Motion:        Couple the indicator to gesture progress while dragging. At the threshold,
               transition to an active refresh state. On completion, resolve locally and
               return cleanly to rest.
Timing:        Drag phase is user-controlled. Threshold snap / active 120–200 ms;
               completion 150–250 ms.
Easing:        Gesture phase follows input directly; enter active state with a short decelerate;
               exit with accelerate or standard.
Reduced motion: Keep threshold and status text; minimize travel and elastic flourish.
Performance:   Gesture-linked motion must stay smooth under scroll load.
Done when:     User can predict when a refresh will trigger and when it has completed.
```

## List reordering / drag-and-drop

```text
Intent:        Preserve object constancy while signaling the insertion target.
Trigger:       Drag begins on a draggable item or reorder affordance.
Motion:        The dragged item stays visually continuous with the item picked up. Neighbors
               move only enough to open the insertion gap. Don't animate the whole list when
               only local displacement is needed.
Timing:        Gap open / neighbor displacement 120–200 ms; settle after drop 150–250 ms.
Easing:        Gesture-linked during drag; ease-out or standard on settle.
Reduced motion: Keep an insertion marker and static preview; reduce neighbor-movement amplitude.
Performance:   Large lists: prefer local movement over a whole-list resort animation.
Done when:     User can predict the drop result before releasing.
```

## Reusable motion spec template

Use this when the deliverable is a specification (design doc, ticket, token entry) rather than code. It captures
everything the workflow decides, so the motion can be implemented consistently and reviewed.

```text
Motion spec
- Name:
- UX intent:                 (the one thing the user should understand)
- Trigger:
- Interaction class:         (acknowledgment / state change / enter / exit / contextual /
                              large transition / expressive / loading)
- Scope of motion:           (what moves; what must NOT move)
- Continuity anchor:         (the shared element or fixed point that preserves place)
- Start state -> End state:
- Duration:
- Delay / stagger:
- Easing:
- Reduced-motion fallback:   (essential? if meaningful, the replacement cue)
- Semantic fallback:         (live region / status text / haptic, so meaning survives no-motion)
- Vestibular / photosensitive risk:  (scale, pan, parallax, depth, multi-axis, flashing?)
- Performance constraints:   (properties animated; frame-budget / fallback if it can't hold)
- Failure / interruption behavior:  (what happens if reversed mid-flight or the op fails)
- Success criteria:
```

Expressing motion as reusable presets and tokens like this — rather than ad-hoc one-off animations — is how
mature design systems keep motion coherent, and it's the antidote to the inconsistency the research literature
repeatedly flags in UI animation.
