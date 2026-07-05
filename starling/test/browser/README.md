# Browser tests (run separately)

Anchoring, layout math, and the fiber walk need a **real browser** — jsdom has no
layout engine and no React fiber. These aren't wired into `npm test` (which is
jsdom-only) on purpose; run them against a real app in a browser.

## Source-coverage reality check (Phase 2 verification)

The load-bearing assumption is that on **React 19** the zero-config fiber-source
path returns `null`. To confirm against a real app, mount Starling, open the
console, and run:

```js
// Paste in the devtools console of your running app, then click ~20 elements
// with markup mode ON. The created annotations record how source was resolved.
const s = JSON.parse(localStorage.getItem("starling:session:default"));
const tally = s.annotations.reduce((m, a) => {
  const t = a.source ? a.source.tier : "none";
  m[t] = (m[t] ?? 0) + 1;
  return m;
}, {});
console.table(tally);
```

- **Next 16 / React 19, no plugin:** expect mostly `{ none: N }` — selector-only.
  This is the documented baseline; the tool still works fully.
- **Vite + Tier-1 plugin enabled:** expect `{ attribute: N }` with real
  `relativePath:lineNumber` — the upgrade path.

## Anchoring / lifecycle scenarios (manual or Playwright)

Drive these against a running multi-route app:

1. Markup mode → hover highlights the exact element → click creates a focused
   sticky → type → Enter collapses to a `[1]` badge.
2. Hover badge reveals; click pins; `Alt+S` shows all; `Alt+H` hides everything
   (app pristine) and restores prior state.
3. Navigate between routes — badges filter per route and re-anchor; navigate back
   restores them.
4. Scroll / resize keeps anchors glued; reload re-finds via selectors; notes
   survive HMR.
5. Annotate a transient popover, reload → it shows **detached** with the note
   intact.
6. Sidebar (List) → jump scrolls + pins; delete removes.
7. Compile → one `.md` downloads with preamble + per-route sections + JSON blocks;
   null-source entries read `(no source — use fallback locators)`.
