/**
 * All Starling styles, scoped to the shadow root. Because they live inside a
 * shadow tree they never leak into — or inherit from — the host app. We still
 * namespace everything under `.pp-*` for clarity.
 *
 * Color note: this is the tool's *own* chrome, not host-app AI surfaces, so it
 * uses a self-contained indigo accent and is not bound to the host's design
 * tokens (the tool must be host-agnostic).
 */
export const STYLES = /* css */ `
:host {
  all: initial;
}

.pp-layer {
  position: fixed;
  inset: 0;
  z-index: 2147483600;
  font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  font-size: 12px;
  line-height: 1.4;
  color: #0f172a;
}

/* ---- Highlight (hover box) ---- */
.pp-highlight {
  position: fixed;
  pointer-events: none;
  border: 2px solid #6366f1;
  background: rgba(99, 102, 241, 0.08);
  border-radius: 3px;
  z-index: 2147483601;
  display: none;
  box-sizing: border-box;
  transition: none;
}
.pp-highlight.pp-visible { display: block; }

.pp-highlight-label {
  position: absolute;
  bottom: 100%;
  left: -2px;
  margin-bottom: 4px;
  white-space: nowrap;
  background: #4f46e5;
  color: #fff;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 500;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.25);
}
.pp-highlight-label.pp-below {
  bottom: auto;
  top: 100%;
  margin-bottom: 0;
  margin-top: 4px;
}
.pp-highlight-label .pp-tag { opacity: 0.85; }
.pp-highlight-label .pp-src { font-weight: 600; }
.pp-highlight-label .pp-comp { opacity: 0.75; font-style: italic; }

/* ---- Markers layer (badges + stickies) ---- */
.pp-markers {
  position: fixed;
  inset: 0;
  pointer-events: none;
}

/* ---- Badge ---- */
.pp-badge {
  position: fixed;
  pointer-events: auto;
  min-width: 18px;
  height: 18px;
  padding: 0 4px;
  border-radius: 9px;
  background: #4f46e5;
  color: #fff;
  font-size: 11px;
  font-weight: 700;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
  user-select: none;
  z-index: 2147483602;
}
.pp-badge.pp-detached {
  background: #b45309;
}
.pp-badge:hover { filter: brightness(1.1); }

/* ---- Sticky ---- */
.pp-sticky {
  position: fixed;
  pointer-events: auto;
  width: 220px;
  background: #fffbeb;
  border: 1px solid #fcd34d;
  border-radius: 6px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.18);
  z-index: 2147483603;
  overflow: hidden;
}
.pp-sticky.pp-detached {
  border-color: #f59e0b;
  background: #fff7ed;
}
.pp-sticky-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
  padding: 4px 6px;
  background: rgba(252, 211, 77, 0.35);
  font-size: 10px;
}
.pp-sticky-where {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: #78350f;
  font-weight: 600;
}
.pp-sticky-detached-flag {
  color: #b45309;
  font-weight: 700;
  margin-right: auto;
}
.pp-sticky-reopen {
  flex: none;
  border: 1px solid #f59e0b;
  border-radius: 4px;
  background: #fffbeb;
  color: #92400e;
  cursor: pointer;
  font: inherit;
  font-weight: 600;
  font-size: 10px;
  line-height: 1;
  padding: 3px 6px;
}
.pp-sticky-reopen:hover {
  background: #fde68a;
  color: #7f1d1d;
}
.pp-sticky-close {
  flex: none;
  border: none;
  background: transparent;
  color: #92400e;
  cursor: pointer;
  font-size: 14px;
  line-height: 1;
  padding: 0 2px;
}
.pp-sticky-close:hover { color: #7f1d1d; }
.pp-sticky textarea {
  display: block;
  width: 100%;
  min-height: 56px;
  /* Height is driven by JS auto-grow (Sticky.autoGrow); disable manual resize so
     a drag handle can't fight it, and hide the scrollbar so it never flickers
     during the measurement pass nor steals wrap width. */
  resize: none;
  overflow-y: hidden;
  border: none;
  outline: none;
  background: transparent;
  padding: 6px 8px;
  font: inherit;
  color: #1c1917;
  box-sizing: border-box;
}
.pp-sticky textarea::placeholder { color: #a8a29e; }
/* Read-only sticky (viewing a past snapshot): muted, no caret, no edit. */
.pp-sticky.pp-readonly {
  background: #f8fafc;
  border-color: #cbd5e1;
}
.pp-sticky.pp-readonly .pp-sticky-head {
  background: rgba(148, 163, 184, 0.18);
}
.pp-sticky.pp-readonly .pp-sticky-where { color: #475569; }
.pp-sticky.pp-readonly textarea {
  color: #475569;
  caret-color: transparent;
  cursor: default;
}

/* ---- Toolbar ---- */
.pp-toolbar {
  position: fixed;
  bottom: 16px;
  right: 16px;
  background: #1e1b4b;
  border-radius: 10px;
  box-shadow: 0 6px 24px rgba(0, 0, 0, 0.35);
  pointer-events: auto;
  z-index: 2147483604;
  /* Box size is set explicitly in JS (measured per view) so it can animate
     between the full row and the collapsed square; see Collapse/expand below. */
  overflow: hidden;
  transition: width 0.22s ease, height 0.22s ease;
}
.pp-toolbar-full {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px;
}
.pp-tool-btn {
  border: none;
  background: transparent;
  color: #c7d2fe;
  font: inherit;
  font-weight: 600;
  padding: 6px 9px;
  border-radius: 7px;
  cursor: pointer;
  white-space: nowrap;
  display: inline-flex;
  align-items: center;
  gap: 5px;
}
.pp-tool-btn:hover { background: rgba(255, 255, 255, 0.1); }
.pp-tool-btn.pp-active {
  background: #6366f1;
  color: #fff;
}
.pp-tool-btn.pp-primary {
  background: #22c55e;
  color: #052e16;
}
.pp-tool-btn.pp-primary:hover { background: #16a34a; color: #fff; }
/* Compile loading state: keep the button fully opaque and on-brand (not dimmed
   or blanked like a plain disabled button) so "Compiling" + spinner read clearly
   while clicks are blocked. */
.pp-tool-btn.pp-loading {
  cursor: default;
}
.pp-tool-btn.pp-primary.pp-loading:disabled,
.pp-tool-btn.pp-primary.pp-loading:disabled:hover {
  opacity: 1;
  background: #22c55e;
  color: #052e16;
}
.pp-tool-spinner {
  display: none;
  flex: none;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  border: 2px solid currentColor;
  border-top-color: transparent;
  animation: pp-spin 0.6s linear infinite;
}
.pp-tool-btn.pp-loading .pp-tool-spinner { display: inline-block; }
@keyframes pp-spin { to { transform: rotate(360deg); } }
.pp-tool-btn.pp-danger { color: #fca5a5; }
.pp-tool-btn.pp-danger:hover { background: #ef4444; color: #fff; }
.pp-tool-btn:disabled {
  opacity: 0.4;
  cursor: default;
}
.pp-tool-btn:disabled:hover { background: transparent; }
.pp-tool-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: currentColor;
  opacity: 0.5;
}
.pp-tool-btn.pp-active .pp-tool-dot { opacity: 1; }
.pp-tool-icon {
  padding: 6px;
  gap: 0;
  justify-content: center;
}
.pp-tool-svg {
  display: block;
  width: 16px;
  height: 16px;
}
/* The collapse chevrons read as a quiet affordance until hovered. */
.pp-tool-collapse { color: #a5b4fc; }

/* ---- Collapse / expand ----
   The toolbar swaps between the full row and a single square markup pill, and
   animates the resize between them. The container box (rounded bg) gets an
   explicit width/height set in JS so CSS can transition it; both views are
   absolutely positioned so neither dictates the box size and the pill overlays
   the row rather than stacking below it. The two views crossfade. */
.pp-toolbar-full,
.pp-tool-expand {
  position: absolute;
  top: 0;
  left: 0;
  transition: opacity 0.16s ease, transform 0.16s ease;
}
/* The full row is anchored top-left; the pill centers in the square box. */
.pp-tool-expand {
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%) scale(0.8);
  width: 34px;
  height: 34px;
  padding: 0;
  opacity: 0;
  pointer-events: none;
}
.pp-toolbar.pp-collapsed .pp-toolbar-full {
  opacity: 0;
  transform: scale(0.9);
  pointer-events: none;
}
.pp-toolbar.pp-collapsed .pp-tool-expand {
  opacity: 1;
  transform: translate(-50%, -50%) scale(1);
  pointer-events: auto;
}
/* Applied for one frame during initial sizing so the box doesn't animate open
   from a zero-size container on mount. */
.pp-toolbar.pp-no-anim,
.pp-toolbar.pp-no-anim .pp-toolbar-full,
.pp-toolbar.pp-no-anim .pp-tool-expand {
  transition: none;
}

.pp-tool-sep {
  width: 1px;
  align-self: stretch;
  margin: 2px;
  background: rgba(255, 255, 255, 0.15);
}
.pp-tool-count {
  font-size: 10px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  padding: 0 5px;
  min-width: 14px;
  text-align: center;
}

/* ---- Toast (transient, above the toolbar) ---- */
.pp-toast-host {
  position: fixed;
  bottom: 64px;
  right: 16px;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  pointer-events: none;
  z-index: 2147483604;
}
.pp-toast {
  max-width: 280px;
  padding: 8px 12px;
  border-radius: 8px;
  font-weight: 600;
  font-size: 12px;
  color: #fff;
  box-shadow: 0 6px 24px rgba(0, 0, 0, 0.35);
  opacity: 0;
  transform: translateY(6px);
  transition: opacity 0.18s ease, transform 0.18s ease;
}
.pp-toast.pp-toast-in {
  opacity: 1;
  transform: translateY(0);
}
.pp-toast-success { background: #16a34a; }
.pp-toast-error { background: #dc2626; }

/* ---- Sidebar ---- */
.pp-sidebar {
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  width: 320px;
  background: #ffffff;
  border-left: 1px solid #e2e8f0;
  box-shadow: -8px 0 24px rgba(0, 0, 0, 0.12);
  pointer-events: auto;
  z-index: 2147483605;
  display: flex;
  flex-direction: column;
  transform: translateX(100%);
  transition: transform 0.18s ease;
}
.pp-sidebar.pp-open { transform: translateX(0); }
.pp-sidebar-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 14px;
  border-bottom: 1px solid #e2e8f0;
  font-weight: 700;
  font-size: 13px;
  color: #1e1b4b;
}
.pp-sidebar-close {
  border: none;
  background: transparent;
  font-size: 18px;
  line-height: 1;
  cursor: pointer;
  color: #64748b;
}
.pp-sidebar-body {
  flex: 1;
  overflow-y: auto;
  padding: 8px 0;
}
.pp-sidebar-empty {
  padding: 24px 16px;
  color: #94a3b8;
  text-align: center;
}
.pp-route-group { margin-bottom: 4px; }
.pp-route-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 14px;
  background: #f8fafc;
  color: #475569;
  font-weight: 600;
  font-size: 11px;
  position: sticky;
  top: 0;
}
.pp-route-count {
  background: #e0e7ff;
  color: #3730a3;
  border-radius: 8px;
  padding: 0 6px;
  font-size: 10px;
}
.pp-ann-item {
  display: flex;
  gap: 8px;
  padding: 8px 14px;
  border-bottom: 1px solid #f1f5f9;
  cursor: pointer;
}
.pp-ann-item:hover { background: #f8fafc; }
.pp-ann-main { flex: 1; min-width: 0; }
.pp-ann-note {
  color: #0f172a;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.pp-ann-note.pp-empty { color: #cbd5e1; font-style: italic; }
.pp-ann-where {
  font-size: 10px;
  color: #94a3b8;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-top: 2px;
}
.pp-ann-detached { color: #b45309; }
.pp-ann-del {
  flex: none;
  border: none;
  background: transparent;
  color: #cbd5e1;
  cursor: pointer;
  font-size: 14px;
  align-self: center;
}
.pp-ann-del:hover { color: #ef4444; }

/* ---- Rewind: session groups (Current session + past snapshots) ---- */
.pp-session-group { border-bottom: 1px solid #eef2f7; }
.pp-session-head {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  cursor: pointer;
  user-select: none;
}
.pp-session-head:hover { background: #f8fafc; }
.pp-session-group.pp-active > .pp-session-head { background: #eef2ff; }
.pp-session-dot {
  flex: none;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #cbd5e1;
}
.pp-session-group.pp-active > .pp-session-head .pp-session-dot { background: #4f46e5; }
.pp-session-main { flex: 1; min-width: 0; }
.pp-session-title {
  font-weight: 700;
  font-size: 12px;
  color: #1e1b4b;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.pp-session-meta {
  font-size: 10px;
  color: #94a3b8;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-top: 1px;
}
.pp-session-count {
  flex: none;
  background: #e0e7ff;
  color: #3730a3;
  border-radius: 8px;
  padding: 0 6px;
  font-size: 10px;
  font-weight: 600;
}
.pp-session-body { padding-bottom: 4px; }
.pp-readonly-hint {
  padding: 4px 14px 8px;
  font-size: 10px;
  color: #94a3b8;
  font-style: italic;
}

/* ---- Rewind: day accordions (snapshots grouped by save-day) ---- */
.pp-day-group { border-bottom: 1px solid #eef2f7; }
.pp-day-head {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 9px 12px;
  background: #f8fafc;
  cursor: pointer;
  user-select: none;
}
.pp-day-head:hover { background: #eef2f7; }
.pp-day-chevron {
  flex: none;
  display: inline-flex;
  color: #64748b;
  transition: transform 0.16s ease;
}
.pp-day-chevron svg { display: block; width: 14px; height: 14px; }
/* Expanded → chevron points down. */
.pp-day-group:not(.pp-day-collapsed) > .pp-day-head .pp-day-chevron {
  transform: rotate(90deg);
}
.pp-day-label {
  flex: 1;
  min-width: 0;
  font-weight: 700;
  font-size: 12px;
  color: #1e1b4b;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
/* Section total: a filled tag, distinct from the lighter per-session/route pills. */
.pp-day-count {
  flex: none;
  background: #4f46e5;
  color: #fff;
  border-radius: 9px;
  padding: 0 7px;
  min-width: 18px;
  line-height: 18px;
  text-align: center;
  font-size: 10px;
  font-weight: 700;
}
.pp-day-group.pp-day-collapsed > .pp-day-body { display: none; }
/* Snapshots nested in a day read as a sub-list, indented under the day head. */
.pp-day-body .pp-session-group { border-bottom: 1px solid #f5f7fa; }
.pp-day-body .pp-session-group:last-child { border-bottom: none; }
.pp-day-body .pp-session-head { padding-left: 28px; }
`;
