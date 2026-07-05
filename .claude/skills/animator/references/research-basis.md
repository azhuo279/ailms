# Research basis and source map

This file is why the skill's recommendations are _grounded_ rather than arbitrary. Use it two ways: (1) to
understand the cognitive mechanisms so you can reason about novel cases the preset table doesn't cover, and
(2) to attribute or cite a recommendation when asked to justify a motion choice.

## Why motion works (the cognitive case)

Motion is powerful because it recruits low-level perception before conscious interpretation. Four well-supported
mechanisms matter for UI:

1. **Motion onset captures attention.** The mere _beginning_ of movement pulls the eye, pre-attentively
   (Smith & Abrams, "Motion onset really does capture attention"). Implication: reserve motion onset for
   high-value changes. A subtle pulse on the primary action works precisely because onset grabs gaze — which is
   also why constant autoplay motion in the periphery is a fast route to distraction. Don't spend the attention
   budget on things that don't deserve it.

2. **Animation preserves mental maps and object constancy.** Bederson & Boltman ("Does Animation Help Users
   Build Mental Maps of Spatial Information?") found that animating viewpoint changes improved users' ability to
   reconstruct an information space, with no time penalty. Heer & Robertson ("Animated Transitions in Statistical
   Data Graphics") showed staged transitions with clear correspondences improve understanding by preserving
   object constancy. Implication: when content is filtered, re-sorted, expanded, or drilled into, keep old and
   new states intelligibly related — this is the research behind the "continuity anchor" step in the workflow.

3. **Motion reinforces affordance and direct manipulation.** A scale/elevation response on press tells the user
   the control accepted contact; a reorder drag works because the moving item stays "the same thing" throughout.
   Apple's HIG notes motion can respond more emphatically to direct touch than to indirect input. The HCI
   literature (Novick, Rhodes & Wert, "The Communicative Functions of Animation in User Interfaces") frames
   animation as signaling change, relation, emphasis, and system response — not liveliness.

4. **Motion shapes perceived performance.** Perceived duration can differ from actual duration. Harrison et al.
   ("Rethinking the Progress Bar" / "Faster Progress Bars") showed non-linear progress behavior can make
   operations feel faster. Huhtala et al. found that in mobile transitions, bringing the next content in _earlier_
   dominates the perception of speed. Oshima et al. found throbber characteristics (e.g. slower rotation during
   short waits) change perceived waiting time. Implication: users forgive waiting when feedback is immediate,
   progress is legible, and they can see the system moving toward completion.

## The honest caveat

The case for motion is strong but **conditional**. A 2021 study on micro-interactions tested whether
micro-animations improve perceived usability with mixed results, and a 2023 HCI review (Almaral Martínez et al.)
concluded UI animation is often applied ad hoc, without standardized methodology — practice has outpaced
empirical validation. The correct reading is cautionary, not anti-motion: motion improves usability _when it
clarifies action, state, or structure._ Decorative motion with no communicative role has no research warrant
strong enough to justify its cost by default. This is the evidence behind the skill's "communication, not
decoration" stance — it is a finding, not an aesthetic opinion.

## Source map: where each recommendation comes from

Use these named sources when attributing a choice. (The original research report cited specific pages; cite the
system or paper by name.)

**Timing**

- Microinteractions ~90–120 ms, ease-out on input — IBM Carbon.
- Common platform durations 83 / 167 / 250 ms — Microsoft Windows motion guidance.
- Mobile transitions ~300 ms; enter ~225 ms; exit ~195 ms; large ~375 ms; desktop 150–200 ms — Google Material.
- Suggested pairs: 200 ms accelerate (exit), 250 ms decelerate (enter), 300 ms standard, 400–500 ms emphasized — Material 3.
- Visible response within ~100 ms; input handling under ~50 ms — web.dev RAIL / Chrome.

**Easing**

- Standard `cubic-bezier(0.4,0,0.2,1)`, decelerate `(0,0,0.2,1)`, accelerate `(0.4,0,1,1)`, sharp `(0.4,0,0.6,1)` — Google Material.
- Strong emphasized enter `(0,0,0,1)` and exit `(1,0,1,1)` — Microsoft Windows motion guidance.
- "Linear mainly for constant-rate motion such as rotation" — Microsoft Fluent. Natural non-linear easing — Carbon and Fluent.

**Principles**

- Fast enough not to wait, slow enough to understand; duration scales with distance/surface — Google Material.
- Functional, natural, consistent, appealing; hierarchy and choreography to direct attention; constrain motion to the focused element; quick fades over moving large surfaces — Microsoft Fluent.
- Productive (subtle, out-of-the-way) vs expressive (rare, important) motion; continuity in large transitions — IBM Carbon.
- Add motion purposefully, not "for the sake of it"; make it optional; stronger for direct touch — Apple HIG.

**Accessibility**

- Suppress non-essential interaction-triggered motion (vestibular risk) — WCAG 2.3.3 "Animation from Interactions".
- Pause / stop / hide for moving or auto-updating content — WCAG 2.2.2.
- No more than three flashes per second above threshold — WCAG 2.3.1 "Three Flashes or Below Threshold".
- `prefers-reduced-motion`, live regions for dynamic updates — MDN.
- Trigger list (scale, spin, peripheral, parallax, depth, multi-axis/multi-speed, vortex, auto-advance) and
  "replace meaning rather than remove it" (dissolve / highlight fade / color shift) — Apple reduced-motion criteria.
- Provide a no-motion setting and alternate channels for animated information — Fluent.

**Performance**

- 60 fps target, ~16.7 ms/frame; prefer transform & opacity; avoid layout/paint-triggering animations — web.dev / MDN.
- Jank = skipped frames from slow rendering — Android.
- High-frame-rate animation offloaded from the CPU — Apple Core Animation.

**Cross-platform**

- Stronger motion for direct touch than trackpad; hover/pointer capability varies by device — Apple HIG, MDN.
- Portable motion assets across platforms (e.g. Lottie) — Airbnb Engineering.
- "Best animations bridge action and reaction… quick, smooth, subtle" — Instagram Engineering.

## The three-layer model (for novel cases)

When the preset table doesn't directly cover something, reason in three layers — this keeps a design language
coherent while adapting per platform:

1. **Semantic intent** — stable across platforms: reveal hierarchy, confirm action, show progress, preserve continuity.
2. **Interaction class** — pick the archetype: enter, exit, transform, reorder, pulse, loading.
3. **Platform modulation** — only now adjust duration, amplitude, and fallback for input type, screen scale, and
   the performance envelope. Touch tolerates slightly stronger direct-manipulation cues; desktop/web favors faster,
   simpler, smaller-distance motion and quick fades over sweeping full-page slides.
