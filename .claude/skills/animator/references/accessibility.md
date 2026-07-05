# Accessibility and motion reduction

Motion accessibility is not an add-on layer — it is part of the motion spec. The failures here are not cosmetic:
non-essential motion can provoke vestibular reactions (dizziness, nausea, migraine, headache), and flashing can
trigger seizures. The guidance below comes from W3C WCAG, MDN, Apple's reduced-motion evaluation criteria, and
Fluent's accessibility notes.

## The baseline rule

If motion is **not essential**, the user must be able to reduce or suppress it when they request reduced motion
(on the web, `prefers-reduced-motion: reduce`; on native platforms, the OS reduce-motion setting). "Essential"
is a high bar — it means the information or function genuinely cannot be conveyed without the motion.

The most important nuance, from Apple: **removing all motion indiscriminately can hurt usability.** If a motion
carries meaning (something moved to cart, the user drilled into a subview, a value changed), don't just delete it
— replace it with a less provocative cue that preserves the meaning.

## Reduced-motion decision tree

```text
Is the motion essential to understanding state or hierarchy?
│
├─ NO  ─► Disable or greatly reduce it.
│        └─ Then verify nothing else slips through: no autoplay, no parallax,
│           no peripheral looping motion, no lingering emphasis.
│
└─ YES ─► Can the meaning be preserved with a NON-SPATIAL cue?
         │
         ├─ YES ─► Replace with dissolve, highlight fade, color shift, haptic, or sound.
         │
         └─ NO  ─► Keep the motion but reduce amplitude, travel distance, depth, and duration.
         │
         └─ In both YES/NO cases: expose the change semantically (live region / status text),
            then TEST with the reduced-motion setting on AND on low-performance hardware.
```

## Vestibular trigger list

Treat these as high-risk. In the reduced-motion path, minimize their amplitude/distance/depth or remove them:

- Scaling / zooming large objects or the whole view
- Panning large surfaces
- Parallax (background and foreground moving at different rates)
- Depth or 3D simulation; blur and depth-of-field shifts
- Multi-axis motion (moving on several axes at once)
- Multi-speed motion (elements moving at different speeds)
- Spinning / vortex effects
- Auto-advancing carousels and other autoplay motion

A subtle local fade or a short same-axis slide is low-risk; a full-screen zoom or a parallax hero is high-risk.
The bigger the surface and the more it simulates moving _through_ space, the more likely it is to trigger.

## Photosensitivity (hard limit)

Content must **not flash more than three times per second** above the general-flash and red-flash thresholds.
This is a seizure risk and is non-negotiable regardless of design intent. If an effect approaches rapid
high-contrast flashing, it does not ship.

## Semantic fallbacks

Motion that announces something must also reach users who can't perceive the motion:

- A toast or snackbar that slides in should be announced via an ARIA live region (or platform equivalent) when
  appropriate, and must be readable without the motion.
- Progress/loading must carry a text status, not just an animated spinner.
- A state change signaled by motion (selected, moved, expanded) must also be expressed in the accessibility tree
  (aria-expanded, aria-selected, role/state changes, etc.).

The rule of thumb: if you removed all motion, could a screen-reader user still learn everything the motion was
telling sighted users? If not, add the semantic channel.

## Motion comfort is broader than one switch

Reduced-motion is the floor, not the ceiling. Mature platforms expose a _comfort profile_ of related controls —
pausing animated images, disabling video previews/autoplay, dimming bright or flashing effects, and limiting
frame rate in some contexts. WCAG separately requires a pause / stop / hide mechanism for content that moves,
blinks, scrolls, or auto-updates beyond a few seconds when it runs in parallel with other content. When designing
a motion-heavy surface, think in terms of this whole profile rather than a single reduced-motion checkbox.

## Web implementation note

`prefers-reduced-motion` is the signal to honor on the web. The `assets/motion-tokens.css` file includes a
`@media (prefers-reduced-motion: reduce)` block that collapses durations toward zero; pair it with meaningful
replacements (opacity cross-fades, instant state changes with a color/highlight cue) rather than leaving meaning
on the floor. Note also that not all devices have hover or precise pointers — don't make essential feedback
hover-only.
