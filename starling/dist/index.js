// src/config.ts
var STORAGE_KEY = "starling:session:default";
var HOST_ID = "starling-root";
var GLOBAL_FLAG = "__STARLING__";
var DEFAULT_SHORTCUTS = {
  toggleMarkup: "M",
  toggleVisible: "Alt+H",
  toggleShowAll: "A",
  escapeMarkup: "Escape"
};
var SAVE_DEBOUNCE_MS = 300;
var MAX_OUTER_HTML = 400;
var MAX_TEXT_CONTENT = 120;

// src/util/debounce.ts
function debounce(fn, wait) {
  let timer = null;
  let lastArgs = null;
  const run = () => {
    timer = null;
    if (lastArgs) {
      const args = lastArgs;
      lastArgs = null;
      fn(...args);
    }
  };
  const debounced = ((...args) => {
    lastArgs = args;
    if (timer != null) clearTimeout(timer);
    timer = setTimeout(run, wait);
  });
  debounced.flush = () => {
    if (timer != null) {
      clearTimeout(timer);
      run();
    }
  };
  debounced.cancel = () => {
    if (timer != null) clearTimeout(timer);
    timer = null;
    lastArgs = null;
  };
  return debounced;
}

// src/util/id.ts
function id() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 10) + Math.random().toString(36).slice(2, 6);
}

// src/store/SessionStore.ts
var SessionStore = class {
  constructor(backend) {
    this.backend = backend;
    this.listeners = /* @__PURE__ */ new Set();
    this.save = debounce(() => this.backend.save(this.session), SAVE_DEBOUNCE_MS);
    this.session = backend.load() ?? {
      version: 1,
      sessionId: id(),
      annotations: []
    };
  }
  all() {
    return this.session.annotations;
  }
  byRoute(route) {
    return this.session.annotations.filter((a) => a.session.route === route);
  }
  get(annId) {
    return this.session.annotations.find((a) => a.id === annId);
  }
  /** Snapshot of the full session — used by the compiler. */
  snapshot() {
    return this.session;
  }
  add(a) {
    this.session.annotations.push(a);
    this.commit();
  }
  update(annId, patch) {
    const a = this.session.annotations.find((x) => x.id === annId);
    if (a) {
      Object.assign(a, patch, { updatedAt: (/* @__PURE__ */ new Date()).toISOString() });
      this.commit();
    }
  }
  remove(annId) {
    const before = this.session.annotations.length;
    this.session.annotations = this.session.annotations.filter(
      (x) => x.id !== annId
    );
    if (this.session.annotations.length !== before) this.commit();
  }
  clear() {
    this.session.annotations = [];
    this.commit();
  }
  /**
   * Start a fresh local session: drop all annotations AND rotate the
   * `sessionId`, so work captured after this point is a distinct session.
   * Used after a successful Compile — the prior batch now lives on disk, and
   * the UI returns to an empty, clean slate. Any in-flight `author`/`savedAt`
   * (which only ever appear on loaded snapshots) are cleared too.
   */
  reset() {
    this.session = {
      version: 1,
      sessionId: id(),
      annotations: []
    };
    this.commit();
  }
  /**
   * Drop annotations whose note is blank (empty or whitespace-only) so empty
   * stickies never reach the persisted session or the compiled artifact.
   * Returns true when something was removed.
   */
  pruneEmpty() {
    const before = this.session.annotations.length;
    this.session.annotations = this.session.annotations.filter(
      (a) => a.note.trim() !== ""
    );
    const changed = this.session.annotations.length !== before;
    if (changed) this.commit();
    return changed;
  }
  subscribe(fn) {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }
  /** Force any pending debounced write to disk (call before unload). */
  flush() {
    this.save.flush();
  }
  commit() {
    this.save();
    this.listeners.forEach((fn) => fn());
  }
};

// src/inspector/a11y.ts
function implicitRole(node) {
  const tag = node.tagName.toLowerCase();
  switch (tag) {
    case "a":
      return node.hasAttribute("href") ? "link" : null;
    case "button":
      return "button";
    case "nav":
      return "navigation";
    case "main":
      return "main";
    case "header":
      return "banner";
    case "footer":
      return "contentinfo";
    case "aside":
      return "complementary";
    case "h1":
    case "h2":
    case "h3":
    case "h4":
    case "h5":
    case "h6":
      return "heading";
    case "img":
      return node.getAttribute("alt") === "" ? null : "img";
    case "ul":
    case "ol":
      return "list";
    case "li":
      return "listitem";
    case "table":
      return "table";
    case "select":
      return "combobox";
    case "textarea":
      return "textbox";
    case "input": {
      const type = (node.getAttribute("type") ?? "text").toLowerCase();
      switch (type) {
        case "button":
        case "submit":
        case "reset":
          return "button";
        case "checkbox":
          return "checkbox";
        case "radio":
          return "radio";
        case "range":
          return "slider";
        case "search":
          return "searchbox";
        case "email":
        case "tel":
        case "url":
        case "text":
          return "textbox";
        default:
          return null;
      }
    }
    default:
      return null;
  }
}
function accessibleName(node) {
  const ariaLabel = node.getAttribute("aria-label");
  if (ariaLabel && ariaLabel.trim()) return ariaLabel.trim();
  const labelledBy = node.getAttribute("aria-labelledby");
  if (labelledBy) {
    const text3 = labelledBy.split(/\s+/).map((refId) => node.ownerDocument?.getElementById(refId)?.textContent ?? "").join(" ").trim();
    if (text3) return text3;
  }
  const alt = node.getAttribute("alt");
  if (alt && alt.trim()) return alt.trim();
  if (node instanceof HTMLInputElement && node.value) return node.value.trim();
  const text2 = (node.textContent ?? "").replace(/\s+/g, " ").trim();
  return text2;
}

// src/util/dom.ts
function isInsideHost(node) {
  let n = node;
  while (n) {
    if (n instanceof Element && n.id === HOST_ID) return true;
    n = n.parentNode ?? n.host ?? null;
  }
  return false;
}
function topAppElementAt(x, y) {
  const el = document.elementFromPoint(x, y);
  if (!el) return null;
  if (isInsideHost(el)) return null;
  return el;
}
function isElementInView(el) {
  const rect = el.getBoundingClientRect();
  if (rect.width === 0 && rect.height === 0) return false;
  let top = 0;
  let left = 0;
  let right = window.innerWidth || document.documentElement.clientWidth;
  let bottom = window.innerHeight || document.documentElement.clientHeight;
  let node = el.parentElement;
  while (node && node !== document.body && node !== document.documentElement) {
    const style = getComputedStyle(node);
    const overflow = style.overflow + style.overflowX + style.overflowY;
    if (/(auto|scroll|hidden|clip)/.test(overflow)) {
      const cr = node.getBoundingClientRect();
      top = Math.max(top, cr.top);
      left = Math.max(left, cr.left);
      right = Math.min(right, cr.right);
      bottom = Math.min(bottom, cr.bottom);
    }
    node = node.parentElement;
  }
  return rect.bottom > top && rect.top < bottom && rect.right > left && rect.left < right;
}
function indexAmongSiblings(el) {
  const parent = el.parentElement;
  if (!parent) return 0;
  const tag = el.tagName;
  const sameTag = Array.from(parent.children).filter((c) => c.tagName === tag);
  if (sameTag.length <= 1) return 0;
  return sameTag.indexOf(el) + 1;
}
function snapshotContext(node, componentName = null) {
  const rect = node.getBoundingClientRect();
  const role = node.getAttribute("role") ?? implicitRole(node);
  const html = node.outerHTML ?? "";
  const openTagMatch = html.match(/^<[^>]*>/);
  const outerHTMLTrimmed = (openTagMatch ? openTagMatch[0] : html).slice(
    0,
    MAX_OUTER_HTML
  );
  const textContent = (node.textContent ?? "").replace(/\s+/g, " ").trim().slice(0, MAX_TEXT_CONTENT);
  return {
    outerHTMLTrimmed,
    textContent,
    role: role ?? null,
    tagName: node.tagName.toLowerCase(),
    componentName,
    rect: {
      x: Math.round(rect.x),
      y: Math.round(rect.y),
      width: Math.round(rect.width),
      height: Math.round(rect.height)
    }
  };
}

// src/inspector/locators.ts
var ANCHOR_KEY_ATTR = "data-starling-anchor";
function queryUnique(sel) {
  try {
    const hits = document.querySelectorAll(sel);
    return hits.length === 1 ? hits[0] : null;
  } catch {
    return null;
  }
}
function stampAnchorKey(el, key) {
  const cur = el.getAttribute(ANCHOR_KEY_ATTR);
  const tokens = cur ? cur.split(/\s+/).filter(Boolean) : [];
  if (tokens.includes(key)) return;
  tokens.push(key);
  el.setAttribute(ANCHOR_KEY_ATTR, tokens.join(" "));
}
function clearAnchorKey(el, key) {
  const cur = el.getAttribute(ANCHOR_KEY_ATTR);
  if (!cur) return;
  const tokens = cur.split(/\s+/).filter((t) => t && t !== key);
  if (tokens.length) el.setAttribute(ANCHOR_KEY_ATTR, tokens.join(" "));
  else el.removeAttribute(ANCHOR_KEY_ATTR);
}
function findByAnchorKey(key) {
  return queryUnique(`[${ANCHOR_KEY_ATTR}~="${cssAttrEscape(key)}"]`);
}
function buildFallbackLocators(node) {
  const out = [];
  const q = (v) => JSON.stringify(v);
  const testid = node.getAttribute("data-testid") ?? node.getAttribute("data-test");
  if (testid) {
    out.push({
      strategy: "testid",
      value: testid,
      playwright: `page.getByTestId(${q(testid)})`
    });
  }
  if (node.id && !isGeneratedId(node.id)) {
    const sel = `#${cssEscape(node.id)}`;
    out.push({ strategy: "id", value: sel, playwright: `page.locator(${q(sel)})` });
  }
  const role = node.getAttribute("role") ?? implicitRole(node);
  const name = accessibleName(node).slice(0, 80);
  if (role && name) {
    out.push({
      strategy: "role",
      value: `${role}:${name}`,
      playwright: `page.getByRole(${q(role)}, { name: ${q(name)} })`
    });
  }
  const text2 = (node.textContent ?? "").replace(/\s+/g, " ").trim().slice(0, 60);
  if (text2) {
    out.push({
      strategy: "text",
      value: text2,
      playwright: `page.getByText(${q(text2)}, { exact: false })`
    });
  }
  const css = cssPath(node);
  out.push({ strategy: "css", value: css, playwright: `page.locator(${q(css)})` });
  return out;
}
function isGeneratedId(elId) {
  return /^:r/i.test(elId) || /^[0-9a-f]{8,}$/i.test(elId) || elId.includes(":");
}
function cssPath(node) {
  const parts = [];
  let el = node;
  while (el && el !== document.body && el.nodeType === 1 && parts.length < 6) {
    if (el.id && !isGeneratedId(el.id)) {
      parts.unshift(`#${cssEscape(el.id)}`);
      break;
    }
    const tid = el.getAttribute("data-testid");
    if (tid) {
      parts.unshift(`[data-testid="${cssAttrEscape(tid)}"]`);
      break;
    }
    const tag = el.tagName.toLowerCase();
    const idx = indexAmongSiblings(el);
    parts.unshift(idx ? `${tag}:nth-of-type(${idx})` : tag);
    el = el.parentElement;
  }
  return parts.join(" > ");
}
function tryLocator(loc) {
  try {
    switch (loc.strategy) {
      case "id":
      case "css":
        return queryUnique(loc.value);
      case "testid":
        return queryUnique(
          `[data-testid="${cssAttrEscape(loc.value)}"], [data-test="${cssAttrEscape(loc.value)}"]`
        );
      case "role": {
        const sep2 = loc.value.indexOf(":");
        const role = loc.value.slice(0, sep2);
        const name = loc.value.slice(sep2 + 1);
        return scanByRoleName(role, name);
      }
      case "text":
        return scanByText(loc.value);
      default:
        return null;
    }
  } catch {
    return null;
  }
}
function scanByRoleName(role, name) {
  const target = name.trim().toLowerCase();
  const candidates = document.querySelectorAll(
    `[role="${role}"], a, button, input, select, textarea, h1, h2, h3, h4, h5, h6, img, nav, main`
  );
  const matches = [];
  for (const el of Array.from(candidates)) {
    const elRole = el.getAttribute("role") ?? implicitRole(el);
    if (elRole !== role) continue;
    if (accessibleName(el).trim().toLowerCase() === target) matches.push(el);
  }
  return matches.length === 1 ? matches[0] : null;
}
function scanByText(text2) {
  const target = text2.trim().toLowerCase();
  if (!target) return null;
  const all = Array.from(document.body.querySelectorAll("*"));
  const exact = all.filter((el) => ownText(el) === target);
  if (exact.length === 1) return exact[0] ?? null;
  if (exact.length > 1) return null;
  const fullEq = all.filter(
    (el) => normalizeText(el.textContent) === target
  );
  if (fullEq.length === 1) return fullEq[0] ?? null;
  if (fullEq.length > 1) {
    const deepest = fullEq.reduce((a, b) => depth(b) > depth(a) ? b : a);
    const tiesAtDepth = fullEq.filter((el) => depth(el) === depth(deepest));
    return tiesAtDepth.length === 1 ? deepest : null;
  }
  return null;
}
function ownText(el) {
  let s = "";
  for (const node of Array.from(el.childNodes)) {
    if (node.nodeType === 3) s += node.textContent ?? "";
  }
  return normalizeText(s);
}
function normalizeText(s) {
  return (s ?? "").replace(/\s+/g, " ").trim().toLowerCase();
}
function depth(el) {
  let d = 0;
  let n = el;
  while (n) {
    d++;
    n = n.parentElement;
  }
  return d;
}
function cssEscape(s) {
  if (typeof CSS !== "undefined" && typeof CSS.escape === "function") {
    return CSS.escape(s);
  }
  return s.replace(/[^a-zA-Z0-9_-]/g, (ch) => `\\${ch}`);
}
function cssAttrEscape(s) {
  return s.replace(/["\\]/g, (ch) => `\\${ch}`);
}

// src/anchoring/Anchorer.ts
var Anchorer = class {
  constructor(getRuntime, onUpdated) {
    this.getRuntime = getRuntime;
    this.onUpdated = onUpdated;
    this.rafId = null;
    this.teardown = [];
    this.running = false;
  }
  start() {
    if (this.running) return;
    this.running = true;
    const schedule = () => {
      if (this.rafId == null) {
        this.rafId = requestAnimationFrame(() => {
          this.rafId = null;
          this.reanchorAll();
        });
      }
    };
    window.addEventListener("scroll", schedule, true);
    window.addEventListener("resize", schedule);
    const mo = new MutationObserver(schedule);
    mo.observe(document.body, { childList: true, subtree: true });
    this.teardown.push(
      () => window.removeEventListener("scroll", schedule, true),
      () => window.removeEventListener("resize", schedule),
      () => mo.disconnect()
    );
    schedule();
  }
  /** Force a re-anchor pass now (e.g. right after a route change). */
  refresh() {
    this.reanchorAll();
  }
  reanchorAll() {
    for (const r of this.getRuntime()) {
      let el = r.el && r.el.isConnected ? r.el : null;
      if (!el) el = this.refind(r);
      if (el) {
        r.el = el;
        r.rect = el.getBoundingClientRect();
        r.detached = false;
        stampAnchorKey(el, r.data.id);
        r.liveLocators = buildFallbackLocators(el);
      } else {
        r.el = null;
        r.rect = null;
        r.detached = true;
      }
    }
    this.onUpdated();
  }
  /**
   * Re-find priority: unique key → source attribute → freshest locators →
   * creation-time chain. Every tier resolves only when it identifies a SINGLE
   * element; an ambiguous match yields null so the marker stays honestly
   * detached instead of binding to a same-type sibling. `liveLocators`
   * (re-derived on the last successful anchor) track the element's current DOM
   * shape, so they recover same-route remounts the frozen creation-time
   * locators no longer match.
   */
  refind(r) {
    const keyed = findByAnchorKey(r.data.id);
    if (keyed) return keyed;
    const s = r.data.source;
    if (s?.tier === "attribute") {
      const sel = `[data-inspector-relative-path="${cssAttr(s.relativePath)}"][data-inspector-line="${s.lineNumber}"]`;
      const hit = queryUnique(sel);
      if (hit) return hit;
    }
    if (r.liveLocators) {
      for (const loc of r.liveLocators) {
        const el = tryLocator(loc);
        if (el) return el;
      }
    }
    for (const loc of r.data.fallbackLocators) {
      const el = tryLocator(loc);
      if (el) return el;
    }
    return null;
  }
  stop() {
    this.teardown.forEach((fn) => fn());
    this.teardown = [];
    if (this.rafId != null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    this.running = false;
  }
};
function cssAttr(s) {
  return s.replace(/["\\]/g, (ch) => `\\${ch}`);
}

// src/anchoring/position.ts
var BADGE = 18;
var CORNER_OFFSET = 4;
function badgePosition(rect) {
  const left = Math.min(
    rect.right - BADGE + CORNER_OFFSET,
    window.innerWidth - BADGE - 2
  );
  const top = Math.max(rect.top - CORNER_OFFSET, 2);
  return { left: Math.max(left, 2), top };
}
function fanOut(points) {
  const placed = [];
  const STEP = BADGE + 2;
  return points.map((p) => {
    let { left } = p;
    const { top } = p;
    let guard = 0;
    while (guard++ < 50 && placed.some((q) => Math.abs(q.left - left) < BADGE && Math.abs(q.top - top) < BADGE)) {
      left = Math.min(left + STEP, window.innerWidth - BADGE - 2);
    }
    const out = { left, top };
    placed.push(out);
    return out;
  });
}
function stickyPosition(rect, stickyWidth = 220) {
  const left = Math.min(
    Math.max(rect.right - stickyWidth, 8),
    window.innerWidth - stickyWidth - 8
  );
  const top = Math.min(Math.max(rect.top + 16, 8), window.innerHeight - 120);
  return { left, top };
}

// src/ui/styles.css.ts
var STYLES = (
  /* css */
  `
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
/* Expanded \u2192 chevron points down. */
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
`
);

// src/ui/ShadowRoot.ts
function createOverlay() {
  const host = document.createElement("div");
  host.id = HOST_ID;
  host.style.cssText = "all: initial; position: fixed; inset: 0; pointer-events: none; z-index: 2147483600;";
  host.setAttribute("data-starling", "host");
  const root = host.attachShadow({ mode: "open" });
  const style = document.createElement("style");
  style.textContent = STYLES;
  root.appendChild(style);
  document.body.appendChild(host);
  return { host, root };
}

// src/ui/Highlight.ts
var Highlight = class {
  constructor() {
    /**
     * When pinned (an annotation is being written), the box stays on the pinned
     * element and hover-driven `show`/`hide` are ignored — so the highlight
     * persists until the note is saved or deleted.
     */
    this.pinned = false;
    this.el = document.createElement("div");
    this.el.className = "pp-highlight";
    this.label = document.createElement("div");
    this.label.className = "pp-highlight-label";
    this.el.appendChild(this.label);
  }
  /**
   * Show the box around `rect` with a confirm label. The label leads with the
   * most useful info available:
   *  - with source:            `div · Dashboard.tsx:58 (in <Dashboard>)`
   *  - no source, component:   `div in <Dashboard>`
   *  - no source, no component: `div`
   *
   * (On React 19 source is usually null, but the enclosing component name still
   * resolves from the fiber — so we lead with that rather than "(no source)".)
   *
   * No-op while pinned.
   */
  show(rect, parts) {
    if (this.pinned) return;
    this.place(rect);
    this.label.style.display = "";
    this.label.replaceChildren();
    this.label.appendChild(span("pp-tag", parts.tag));
    if (parts.source) {
      this.label.appendChild(text(" \xB7 "));
      this.label.appendChild(span("pp-src", parts.source));
      if (parts.component) {
        this.label.appendChild(text(" "));
        this.label.appendChild(span("pp-comp", `(in <${parts.component}>)`));
      }
    } else if (parts.component) {
      this.label.appendChild(text(" "));
      this.label.appendChild(span("pp-comp", `in <${parts.component}>`));
    }
  }
  /** No-op while pinned. */
  hide() {
    if (this.pinned) return;
    this.el.classList.remove("pp-visible");
  }
  /**
   * Pin the box onto a specific element while its note is being written. The
   * label is dropped (it's a confirm aid for hovering, not needed once chosen).
   * Re-call each anchor pass with the live rect so it tracks scroll/resize.
   */
  pin(rect) {
    this.pinned = true;
    this.label.style.display = "none";
    this.place(rect);
  }
  unpin() {
    this.pinned = false;
    this.el.classList.remove("pp-visible");
  }
  isPinned() {
    return this.pinned;
  }
  place(rect) {
    this.el.style.left = `${rect.left}px`;
    this.el.style.top = `${rect.top}px`;
    this.el.style.width = `${rect.width}px`;
    this.el.style.height = `${rect.height}px`;
    this.el.classList.add("pp-visible");
    this.label.classList.toggle("pp-below", rect.top < 24);
  }
};
function span(cls, t) {
  const s = document.createElement("span");
  s.className = cls;
  s.textContent = t;
  return s;
}
function text(t) {
  return document.createTextNode(t);
}

// src/ui/Toolbar.ts
var ICONS = {
  // lucide "chevrons-right" — the collapse affordance.
  chevronsRight: ["m6 17 5-5-5-5", "m13 17 5-5-5-5"],
  // lucide "mouse-pointer-click" — the markup glyph shown when collapsed.
  mousePointerClick: [
    "M14 4.1 12 6",
    "m5.1 8-2.9-.8",
    "m6 12-1.9 2",
    "M7.2 2.2 8 5.1",
    "M9.037 9.69a.498.498 0 0 1 .653-.653l11 4.5a.5.5 0 0 1-.074.949l-4.349 1.041a1 1 0 0 0-.74.739l-1.04 4.35a.5.5 0 0 1-.95.074z"
  ]
};
var Toolbar = class {
  constructor(cb) {
    // Compile is disabled when there's nothing to compile, a save is mid-flight,
    // OR a past snapshot is being viewed (read-only). Tracked separately because
    // the conditions are set from different calls (setCount / setCompiling /
    // setReadOnly) and must compose, not clobber each other.
    this.compileEmpty = true;
    this.compileBusy = false;
    this.compileReadOnly = false;
    this.collapsed = false;
    /** Suppresses the size transition until the first measured size is applied. */
    this.sized = false;
    this.el = document.createElement("div");
    this.el.className = "pp-toolbar";
    this.fullEl = document.createElement("div");
    this.fullEl.className = "pp-toolbar-full";
    const collapseBtn = iconButton(
      ICONS.chevronsRight,
      () => this.setCollapsed(true),
      "Collapse toolbar"
    );
    collapseBtn.classList.add("pp-tool-collapse");
    this.markupBtn = button("Markup", () => cb.onToggleMarkup(), true);
    this.showAllBtn = button("Show all", () => cb.onToggleShowAll(), true);
    this.sidebarBtn = button("List", () => cb.onToggleSidebar(), false);
    this.countEl = document.createElement("span");
    this.countEl.className = "pp-tool-count";
    this.countEl.textContent = "0";
    this.sidebarBtn.appendChild(this.countEl);
    this.compileBtn = document.createElement("button");
    this.compileBtn.type = "button";
    this.compileBtn.className = "pp-tool-btn pp-primary";
    const spinner = document.createElement("span");
    spinner.className = "pp-tool-spinner";
    spinner.setAttribute("aria-hidden", "true");
    this.compileLabel = document.createElement("span");
    this.compileLabel.textContent = "Compile";
    this.compileBtn.append(spinner, this.compileLabel);
    this.compileBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      if (this.compileBtn.disabled) return;
      cb.onCompile();
    });
    this.clearBtn = button("Clear all", () => cb.onClearAll(), false);
    this.clearBtn.classList.add("pp-danger");
    this.clearBtn.title = "Delete all annotations across all routes";
    const hideBtn = button("Hide", () => cb.onToggleVisible(), false);
    hideBtn.title = "Hide all tool UI (demo mode)";
    this.fullEl.append(
      collapseBtn,
      this.markupBtn,
      this.showAllBtn,
      sep(),
      this.sidebarBtn,
      this.compileBtn,
      this.clearBtn,
      sep(),
      hideBtn
    );
    this.collapsedBtn = iconButton(
      ICONS.mousePointerClick,
      () => this.setCollapsed(false),
      "Expand toolbar"
    );
    this.collapsedBtn.classList.add("pp-tool-expand");
    this.el.append(this.fullEl, this.collapsedBtn);
    this.applyCollapsed();
    this.syncCompileDisabled();
  }
  setState(s) {
    this.markupBtn.classList.toggle("pp-active", s.markupMode);
    this.showAllBtn.classList.toggle("pp-active", s.showAllMarkup);
    this.collapsedBtn.classList.toggle("pp-active", s.markupMode);
    this.syncBox();
  }
  /**
   * Drive the compile button's loading state: swap the label to "Compiling",
   * reveal the spinner, and disable the button so no second save can be queued
   * while the database write is in flight.
   */
  setCompiling(compiling) {
    this.compileBusy = compiling;
    this.compileBtn.classList.toggle("pp-loading", compiling);
    this.compileLabel.textContent = compiling ? "Compiling" : "Compile";
    this.syncCompileDisabled();
    this.syncBox();
  }
  setCount(n) {
    this.countEl.textContent = String(n);
    this.clearBtn.disabled = n === 0;
    this.compileEmpty = n === 0;
    this.syncCompileDisabled();
    this.syncBox();
  }
  /**
   * Viewing a past snapshot (Rewind) is read-only — Compile saves the live
   * session only, so disable it while a historical session is on screen.
   */
  setReadOnly(readOnly) {
    this.compileReadOnly = readOnly;
    this.syncCompileDisabled();
  }
  /**
   * Compile is disabled while a save is in flight, when there's nothing to save,
   * or when a read-only past snapshot is being viewed.
   */
  syncCompileDisabled() {
    this.compileBtn.disabled = this.compileBusy || this.compileEmpty || this.compileReadOnly;
    this.compileBtn.title = this.compileReadOnly ? "Switch to the current session to compile" : this.compileEmpty && !this.compileBusy ? "Add an annotation before compiling" : "";
  }
  setCollapsed(collapsed) {
    this.collapsed = collapsed;
    this.applyCollapsed();
  }
  applyCollapsed() {
    this.el.classList.toggle("pp-collapsed", this.collapsed);
    this.syncBox();
  }
  /**
   * Drive the container's explicit width/height so the box animates between the
   * full row and the collapsed square (both views are absolutely positioned, so
   * the container has no intrinsic size). Measured on the next frame because the
   * element may not be laid out yet on first mount.
   */
  syncBox() {
    requestAnimationFrame(() => {
      let w;
      let h;
      if (this.collapsed) {
        w = 34;
        h = 34;
      } else {
        w = this.fullEl.offsetWidth;
        h = this.fullEl.offsetHeight;
        if (w <= 0 || h <= 0) return;
      }
      if (!this.sized) {
        this.el.classList.add("pp-no-anim");
        this.el.style.width = `${w}px`;
        this.el.style.height = `${h}px`;
        void this.el.offsetWidth;
        requestAnimationFrame(() => this.el.classList.remove("pp-no-anim"));
        this.sized = true;
        return;
      }
      this.el.style.width = `${w}px`;
      this.el.style.height = `${h}px`;
    });
  }
};
function button(label, onClick, withDot) {
  const b = document.createElement("button");
  b.type = "button";
  b.className = "pp-tool-btn";
  if (withDot) {
    const dot = document.createElement("span");
    dot.className = "pp-tool-dot";
    b.appendChild(dot);
  }
  b.appendChild(document.createTextNode(label));
  b.addEventListener("click", (e) => {
    e.stopPropagation();
    onClick();
  });
  return b;
}
function iconButton(paths, onClick, label) {
  const b = document.createElement("button");
  b.type = "button";
  b.className = "pp-tool-btn pp-tool-icon";
  b.title = label;
  b.setAttribute("aria-label", label);
  b.appendChild(svgIcon(paths));
  b.addEventListener("click", (e) => {
    e.stopPropagation();
    onClick();
  });
  return b;
}
function svgIcon(paths) {
  const NS = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(NS, "svg");
  svg.setAttribute("viewBox", "0 0 24 24");
  svg.setAttribute("width", "16");
  svg.setAttribute("height", "16");
  svg.setAttribute("fill", "none");
  svg.setAttribute("stroke", "currentColor");
  svg.setAttribute("stroke-width", "2");
  svg.setAttribute("stroke-linecap", "round");
  svg.setAttribute("stroke-linejoin", "round");
  svg.setAttribute("aria-hidden", "true");
  svg.classList.add("pp-tool-svg");
  for (const d of paths) {
    const p = document.createElementNS(NS, "path");
    p.setAttribute("d", d);
    svg.appendChild(p);
  }
  return svg;
}
function sep() {
  const s = document.createElement("div");
  s.className = "pp-tool-sep";
  return s;
}

// src/util/group.ts
function groupBy(items, keyOf) {
  const out = {};
  for (const item of items) {
    const key = keyOf(item);
    (out[key] ?? (out[key] = [])).push(item);
  }
  return out;
}

// src/ui/Sidebar.ts
var CHEVRON_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>';
var Sidebar = class {
  constructor(cb) {
    this.cb = cb;
    /** Day-keys (YYYY-MM-DD) whose accordion is expanded; survives re-renders. */
    this.expandedDays = /* @__PURE__ */ new Set();
    /** Whether the default open-state (current day expanded) has been applied. */
    this.daysSeeded = false;
    this.el = document.createElement("div");
    this.el.className = "pp-sidebar";
    const head = document.createElement("div");
    head.className = "pp-sidebar-head";
    const title = document.createElement("span");
    title.textContent = "Annotations";
    const close = document.createElement("button");
    close.className = "pp-sidebar-close";
    close.type = "button";
    close.textContent = "\xD7";
    close.addEventListener("click", () => this.cb.onClose());
    head.append(title, close);
    this.body = document.createElement("div");
    this.body.className = "pp-sidebar-body";
    this.el.append(head, this.body);
  }
  setOpen(open) {
    this.el.classList.toggle("pp-open", open);
  }
  render(args) {
    this.body.replaceChildren();
    const liveActive = args.activeFilename === null;
    this.body.appendChild(
      this.renderSessionGroup({
        title: "Current session",
        meta: liveActive ? "live \xB7 editable" : "live",
        count: args.liveAnnotations.length,
        active: liveActive,
        onSelect: () => this.cb.onSelectSession(null),
        // Only the active group renders its annotation body.
        annotations: liveActive ? args.liveAnnotations : null,
        currentRoute: args.currentRoute,
        detachedIds: args.detachedIds,
        readOnly: false
      })
    );
    if (!this.daysSeeded) {
      this.expandedDays.add(dayKeyOf(/* @__PURE__ */ new Date()));
      this.daysSeeded = true;
    }
    if (args.activeFilename) {
      const active = args.snapshots.find((s) => s.filename === args.activeFilename);
      if (active) this.expandedDays.add(dayKey(active.savedAt));
    }
    const byDay = groupBy(args.snapshots, (s) => dayKey(s.savedAt));
    for (const [key, snaps] of Object.entries(byDay)) {
      this.body.appendChild(this.renderDayGroup(key, snaps, args));
    }
    if (args.liveAnnotations.length === 0 && args.snapshots.length === 0) {
      const empty = document.createElement("div");
      empty.className = "pp-sidebar-empty";
      empty.textContent = "No annotations yet. Enter markup mode and click an element.";
      this.body.appendChild(empty);
    }
  }
  // ---- Day accordion + group + item rendering ------------------------------
  /**
   * One collapsible accordion per save-day. The header carries the date and a
   * count tag (total annotations across that day's snapshots); the body holds
   * that day's snapshot session-groups. Collapsing only hides the body — the
   * expanded-state lives in `expandedDays` so it survives the next full render.
   */
  renderDayGroup(key, snaps, args) {
    const group = document.createElement("div");
    group.className = "pp-day-group";
    group.classList.toggle("pp-day-collapsed", !this.expandedDays.has(key));
    const head = document.createElement("div");
    head.className = "pp-day-head";
    head.addEventListener("click", () => this.toggleDay(key, group));
    const chevron = document.createElement("span");
    chevron.className = "pp-day-chevron";
    chevron.innerHTML = CHEVRON_SVG;
    const label = document.createElement("span");
    label.className = "pp-day-label";
    label.textContent = formatDayLabel(key, snaps[0]?.savedAt ?? key);
    const total = snaps.reduce((n, s) => n + s.annotationCount, 0);
    const count = document.createElement("span");
    count.className = "pp-day-count";
    count.textContent = String(total);
    count.title = `${total} ${total === 1 ? "annotation" : "annotations"}`;
    head.append(chevron, label, count);
    group.appendChild(head);
    const dayBody = document.createElement("div");
    dayBody.className = "pp-day-body";
    for (const snap of snaps) {
      const isActive = args.activeFilename === snap.filename;
      dayBody.appendChild(
        this.renderSessionGroup({
          // The day header carries the date, so each snapshot row shows its time.
          title: formatTime(snap.savedAt),
          meta: metaLine(snap),
          count: snap.annotationCount,
          active: isActive,
          onSelect: () => this.cb.onSelectSession(snap.filename),
          annotations: isActive ? args.loadedAnnotations : null,
          currentRoute: args.currentRoute,
          detachedIds: args.detachedIds,
          readOnly: true
        })
      );
    }
    group.appendChild(dayBody);
    return group;
  }
  /** Flip one day accordion open/closed, persisting the choice for re-renders. */
  toggleDay(key, group) {
    const expand = !this.expandedDays.has(key);
    if (expand) this.expandedDays.add(key);
    else this.expandedDays.delete(key);
    group.classList.toggle("pp-day-collapsed", !expand);
  }
  renderSessionGroup(opts) {
    const group = document.createElement("div");
    group.className = "pp-session-group";
    group.classList.toggle("pp-active", opts.active);
    const headRow = document.createElement("div");
    headRow.className = "pp-session-head";
    headRow.addEventListener("click", () => opts.onSelect());
    const dot = document.createElement("span");
    dot.className = "pp-session-dot";
    const main = document.createElement("div");
    main.className = "pp-session-main";
    const title = document.createElement("div");
    title.className = "pp-session-title";
    title.textContent = opts.title;
    const meta = document.createElement("div");
    meta.className = "pp-session-meta";
    meta.textContent = opts.meta;
    main.append(title, meta);
    const count = document.createElement("span");
    count.className = "pp-session-count";
    count.textContent = String(opts.count);
    headRow.append(dot, main, count);
    group.appendChild(headRow);
    if (opts.annotations !== null) {
      const sessionBody = document.createElement("div");
      sessionBody.className = "pp-session-body";
      if (opts.readOnly) {
        const hint = document.createElement("div");
        hint.className = "pp-readonly-hint";
        hint.textContent = "Read-only \u2014 switch to current session to edit.";
        sessionBody.appendChild(hint);
      }
      if (opts.annotations.length === 0) {
        const empty = document.createElement("div");
        empty.className = "pp-sidebar-empty";
        empty.textContent = "No annotations in this session.";
        sessionBody.appendChild(empty);
      } else {
        const byRoute = groupBy(opts.annotations, (a) => a.session.route);
        for (const [route, anns] of Object.entries(byRoute)) {
          sessionBody.appendChild(
            this.renderRouteGroup(
              route,
              anns,
              opts.currentRoute,
              opts.detachedIds,
              opts.readOnly
            )
          );
        }
      }
      group.appendChild(sessionBody);
    }
    return group;
  }
  renderRouteGroup(route, anns, currentRoute2, detachedIds, readOnly) {
    const group = document.createElement("div");
    group.className = "pp-route-group";
    const rhead = document.createElement("div");
    rhead.className = "pp-route-head";
    const rname = document.createElement("span");
    rname.textContent = route === currentRoute2 ? `${route} (current)` : route;
    const rcount = document.createElement("span");
    rcount.className = "pp-route-count";
    rcount.textContent = String(anns.length);
    rhead.append(rname, rcount);
    group.appendChild(rhead);
    for (const a of anns) {
      group.appendChild(this.renderItem(a, detachedIds.has(a.id), readOnly));
    }
    return group;
  }
  renderItem(a, detached, readOnly) {
    const item = document.createElement("div");
    item.className = "pp-ann-item";
    item.addEventListener("click", () => this.cb.onJump(a.id));
    const main = document.createElement("div");
    main.className = "pp-ann-main";
    const note = document.createElement("div");
    note.className = "pp-ann-note";
    const noteText = a.note.trim();
    if (noteText) {
      note.textContent = noteText;
    } else {
      note.textContent = "(empty note)";
      note.classList.add("pp-empty");
    }
    const where = document.createElement("div");
    where.className = "pp-ann-where";
    const loc = a.source ? `${a.source.relativePath}:${a.source.lineNumber}` : a.context.componentName ? `${a.context.tagName} \xB7 <${a.context.componentName}>` : a.context.tagName;
    where.textContent = detached ? `\u26A0 deleted \xB7 ${loc}` : loc;
    if (detached) where.classList.add("pp-ann-detached");
    main.append(note, where);
    item.append(main);
    if (!readOnly) {
      const del = document.createElement("button");
      del.className = "pp-ann-del";
      del.type = "button";
      del.textContent = "\xD7";
      del.title = "Delete";
      del.addEventListener("click", (e) => {
        e.stopPropagation();
        this.cb.onDelete(a.id);
      });
      item.append(del);
    }
    return item;
  }
};
function metaLine(snap) {
  const noun = snap.annotationCount === 1 ? "annotation" : "annotations";
  const parts = [`${snap.annotationCount} ${noun}`];
  if (snap.author) parts.push(`by ${snap.author}`);
  return parts.join(" \xB7 ");
}
function dayKey(iso) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return dayKeyOf(d);
}
function dayKeyOf(d) {
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
function formatDayLabel(key, sampleIso) {
  const d = new Date(sampleIso);
  if (Number.isNaN(d.getTime())) return key;
  const now = /* @__PURE__ */ new Date();
  const yest = new Date(now);
  yest.setDate(now.getDate() - 1);
  const monthDay = d.toLocaleDateString(void 0, {
    month: "short",
    day: "numeric"
  });
  if (key === dayKeyOf(now)) return `Today \xB7 ${monthDay}`;
  if (key === dayKeyOf(yest)) return `Yesterday \xB7 ${monthDay}`;
  return d.getFullYear() === now.getFullYear() ? monthDay : `${monthDay}, ${d.getFullYear()}`;
}
function formatTime(iso) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleTimeString(void 0, { hour: "numeric", minute: "2-digit" });
}

// src/ui/Toast.ts
var DEFAULT_DURATION_MS = 2400;
var FADE_MS = 180;
var Toast = class {
  constructor() {
    this.hideTimer = null;
    this.removeTimer = null;
    this.el = document.createElement("div");
    this.el.className = "pp-toast-host";
    this.el.setAttribute("aria-live", "polite");
    this.el.setAttribute("role", "status");
  }
  show(message, variant = "success", duration = DEFAULT_DURATION_MS) {
    this.clearTimers();
    const toast = document.createElement("div");
    toast.className = `pp-toast pp-toast-${variant}`;
    toast.textContent = message;
    this.el.replaceChildren(toast);
    requestAnimationFrame(() => toast.classList.add("pp-toast-in"));
    this.hideTimer = window.setTimeout(() => {
      toast.classList.remove("pp-toast-in");
      this.removeTimer = window.setTimeout(() => {
        if (toast.parentNode === this.el) this.el.replaceChildren();
      }, FADE_MS);
    }, duration);
  }
  clearTimers() {
    if (this.hideTimer != null) window.clearTimeout(this.hideTimer);
    if (this.removeTimer != null) window.clearTimeout(this.removeTimer);
    this.hideTimer = null;
    this.removeTimer = null;
  }
  destroy() {
    this.clearTimers();
    this.el.replaceChildren();
  }
};

// src/ui/Overlay.ts
var Overlay = class {
  constructor(toolbarCb, sidebarCb) {
    this.shadow = createOverlay();
    this.layer = document.createElement("div");
    this.layer.className = "pp-layer";
    this.highlight = new Highlight();
    this.markersLayer = document.createElement("div");
    this.markersLayer.className = "pp-markers";
    this.toolbar = new Toolbar(toolbarCb);
    this.sidebar = new Sidebar(sidebarCb);
    this.toast = new Toast();
    this.layer.append(
      this.highlight.el,
      this.markersLayer,
      this.toolbar.el,
      this.toast.el,
      this.sidebar.el
    );
    this.shadow.root.appendChild(this.layer);
  }
  get markersRoot() {
    return this.markersLayer;
  }
  /** Toggle the entire tool UI (demo mode). */
  setVisible(visible) {
    this.shadow.host.style.display = visible ? "" : "none";
  }
  /** The active element within our shadow root, if any (for blur logic). */
  activeElement() {
    return this.shadow.root.activeElement;
  }
  destroy() {
    this.toast.destroy();
    this.shadow.host.remove();
  }
};

// src/ui/Badge.ts
var Badge = class {
  constructor(cb) {
    this.el = document.createElement("div");
    this.el.className = "pp-badge";
    this.el.addEventListener("mouseenter", () => cb.onEnter());
    this.el.addEventListener("mouseleave", () => cb.onLeave());
    this.el.addEventListener("click", (e) => {
      e.stopPropagation();
      cb.onClick();
    });
  }
  setCount(n) {
    this.el.textContent = String(n);
  }
  setDetached(detached) {
    this.el.classList.toggle("pp-detached", detached);
    this.el.title = detached ? "Annotation target not found on this view" : "";
  }
};

// src/ui/Sticky.ts
var Sticky = class {
  constructor(cb) {
    this.cb = cb;
    this.el = document.createElement("div");
    this.el.className = "pp-sticky";
    const head = document.createElement("div");
    head.className = "pp-sticky-head";
    this.detachedFlag = document.createElement("span");
    this.detachedFlag.className = "pp-sticky-detached-flag";
    this.detachedFlag.textContent = "\u26A0 detached";
    this.detachedFlag.style.display = "none";
    this.whereEl = document.createElement("div");
    this.whereEl.className = "pp-sticky-where";
    this.reopenBtn = document.createElement("button");
    this.reopenBtn.className = "pp-sticky-reopen";
    this.reopenBtn.type = "button";
    this.reopenBtn.textContent = "Reopen";
    this.reopenBtn.style.display = "none";
    this.reopenBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      this.cb.onReopen();
    });
    this.closeBtn = document.createElement("button");
    this.closeBtn.className = "pp-sticky-close";
    this.closeBtn.type = "button";
    this.closeBtn.title = "Delete annotation";
    this.closeBtn.textContent = "\xD7";
    this.closeBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      this.cb.onDelete();
    });
    head.append(this.detachedFlag, this.whereEl, this.reopenBtn, this.closeBtn);
    this.textarea = document.createElement("textarea");
    this.textarea.placeholder = "Add a note\u2026";
    this.textarea.addEventListener("input", () => {
      this.autoGrow();
      this.cb.onInput(this.textarea.value);
    });
    this.textarea.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        this.cb.onSave();
      }
    });
    this.textarea.addEventListener("blur", () => this.cb.onBlur());
    this.el.append(head, this.textarea);
  }
  setNote(note) {
    if (this.textarea.value !== note) this.textarea.value = note;
    this.autoGrow();
  }
  /**
   * Grow the textarea to fit its content so the sticky pushes downward as text
   * wraps. CSS `min-height` still acts as the floor; `box-sizing: border-box`
   * means scrollHeight already includes padding, so the height is self-consistent.
   */
  autoGrow() {
    this.textarea.style.height = "auto";
    this.textarea.style.height = `${this.textarea.scrollHeight}px`;
  }
  /**
   * Re-measure after the sticky becomes visible. scrollHeight reads 0 while the
   * sticky is display:none, so callers that set the note while hidden must call
   * this once the sticky is shown.
   */
  refreshHeight() {
    this.autoGrow();
  }
  setWhere(where) {
    this.whereEl.textContent = where;
    this.whereEl.title = where;
  }
  setDetached(detached) {
    this.el.classList.toggle("pp-detached", detached);
    this.detachedFlag.style.display = detached ? "" : "none";
  }
  /**
   * Show/hide the reopen affordance. `label` is the trigger's accessible name
   * (e.g. the avatar button); null hides the button. Only meaningful while
   * detached — the caller passes null otherwise.
   */
  setTrigger(label) {
    if (label) {
      this.reopenBtn.style.display = "";
      this.reopenBtn.title = `Reopen via "${label}" to re-anchor`;
    } else {
      this.reopenBtn.style.display = "none";
    }
  }
  /**
   * Read-only mode (viewing a past snapshot): the note can't be edited and the
   * delete affordance is hidden. The textarea still shows the note for reading.
   */
  setReadOnly(ro) {
    this.textarea.readOnly = ro;
    this.closeBtn.style.display = ro ? "none" : "";
    this.el.classList.toggle("pp-readonly", ro);
  }
  focus() {
    this.textarea.focus();
    const len = this.textarea.value.length;
    this.textarea.setSelectionRange(len, len);
  }
  /** True if the editing focus is inside this sticky. */
  containsFocus(active) {
    return active === this.textarea || this.el.contains(active);
  }
};

// src/ui/Marker.ts
var Marker = class {
  constructor(runtime, cb) {
    /** When true, both nodes stay hidden regardless of view (detached + read-only). */
    this.hidden = false;
    /** When true, the anchored element is scrolled out of view / clipped — hide. */
    this.offscreen = false;
    /** View-derived intent from the last update(), re-applied when un-suppressed. */
    this.showSticky = false;
    this.showBadge = false;
    this.annId = runtime.data.id;
    this.badge = new Badge({
      onEnter: () => cb.onBadgeEnter(this.annId),
      onLeave: () => cb.onBadgeLeave(this.annId),
      onClick: () => cb.onBadgeClick(this.annId)
    });
    this.sticky = new Sticky({
      onInput: (note) => cb.onNoteInput(this.annId, note),
      onSave: () => cb.onSave(this.annId),
      onDelete: () => cb.onDelete(this.annId),
      onBlur: () => cb.onStickyBlur(this.annId),
      onReopen: () => cb.onReopen(this.annId)
    });
  }
  /** Render the marker for the given runtime state + resolved view. */
  update(runtime, resolvedView, badgeCount, readOnly = false) {
    const detached = runtime.detached;
    this.badge.setDetached(detached);
    this.sticky.setDetached(detached);
    this.sticky.setTrigger(
      detached ? runtime.data.trigger?.label ?? null : null
    );
    this.sticky.setNote(runtime.data.note);
    this.sticky.setWhere(whereLabel(runtime));
    this.sticky.setReadOnly(readOnly);
    this.badge.setCount(badgeCount);
    this.showSticky = resolvedView !== "collapsed";
    this.showBadge = resolvedView === "collapsed" || resolvedView === "hover";
    this.applyVisibility();
  }
  /**
   * Suppress both nodes entirely. Used for annotations whose element was deleted
   * while viewing a past snapshot — they're flagged in the list, not the canvas.
   */
  setHidden(hidden) {
    if (this.hidden === hidden) return;
    this.hidden = hidden;
    this.applyVisibility();
  }
  /**
   * Toggle off-screen suppression: the anchored element is scrolled out of view
   * or clipped by a scroll container. Both nodes hide (no data is touched) and
   * re-appear at their view-derived state once the element returns to view.
   */
  setOffscreen(offscreen) {
    if (this.offscreen === offscreen) return;
    this.offscreen = offscreen;
    this.applyVisibility();
  }
  /** Paint final display = view intent gated by hard-hidden / off-screen. */
  applyVisibility() {
    const suppressed = this.hidden || this.offscreen;
    const showSticky = !suppressed && this.showSticky;
    const showBadge = !suppressed && this.showBadge;
    this.sticky.el.style.display = showSticky ? "" : "none";
    this.badge.el.style.display = showBadge ? "" : "none";
    if (showSticky) this.sticky.refreshHeight();
  }
  position(rect, fallback) {
    if (rect) {
      const bp = badgePosition(rect);
      this.badge.el.style.left = `${bp.left}px`;
      this.badge.el.style.top = `${bp.top}px`;
      const sp = stickyPosition(rect);
      this.sticky.el.style.left = `${sp.left}px`;
      this.sticky.el.style.top = `${sp.top}px`;
    } else if (fallback) {
      this.badge.el.style.left = `${fallback.left}px`;
      this.badge.el.style.top = `${fallback.top}px`;
      this.sticky.el.style.left = `${fallback.left}px`;
      this.sticky.el.style.top = `${fallback.top + 22}px`;
    }
  }
  /** Move the badge to an explicit (fanned-out) point. */
  setBadgePoint(p) {
    this.badge.el.style.left = `${p.left}px`;
    this.badge.el.style.top = `${p.top}px`;
  }
  focusSticky() {
    this.sticky.focus();
  }
  stickyContainsFocus(active) {
    return this.sticky.containsFocus(active);
  }
  remove() {
    this.badge.el.remove();
    this.sticky.el.remove();
  }
};
function whereLabel(r) {
  const s = r.data.source;
  if (s) {
    return `${baseName(s.relativePath)}:${s.lineNumber}${s.componentName ? ` \xB7 <${s.componentName}>` : ""}`;
  }
  const comp = r.data.context.componentName;
  return comp ? `${r.data.context.tagName} \xB7 <${comp}>` : r.data.context.tagName;
}
function baseName(path) {
  const i = Math.max(path.lastIndexOf("/"), path.lastIndexOf("\\"));
  return i >= 0 ? path.slice(i + 1) : path;
}

// src/inspector/fiber.ts
function getFiberFromNode(node) {
  const key = Object.keys(node).find(
    (k) => k.startsWith("__reactFiber$") || k.startsWith("__reactInternalInstance$")
  );
  return key ? node[key] ?? null : null;
}
function isComponentFiber(f) {
  const t = f?.type;
  return typeof t === "function" || typeof t === "object" && t !== null;
}
function nearestComponentFiber(f) {
  let cur = f;
  while (cur) {
    if (isComponentFiber(cur)) return cur;
    cur = cur.return;
  }
  return null;
}
function getComponentName(f) {
  const t = f?.type;
  if (!t || typeof t === "string") return null;
  return t.displayName || t.name || t.render && (t.render.displayName || t.render.name) || // forwardRef
  t.type && (t.type.displayName || t.type.name) || // memo
  null;
}
function* ancestorComponents(f) {
  let cur = nearestComponentFiber(f);
  while (cur) {
    yield cur;
    cur = nearestComponentFiber(cur.return);
  }
}
function nearestNamedComponentName(f) {
  let steps = 0;
  for (const comp of ancestorComponents(f)) {
    if (steps++ > 30) break;
    const name = getComponentName(comp);
    if (name) return name;
  }
  return null;
}

// src/inspector/source.ts
function resolveSource(node, fiber, root) {
  const attr = fromAttributes(node);
  if (attr) {
    attr.componentName = getComponentName(nearestComponentFiber(fiber)) ?? attr.componentName;
    return attr;
  }
  return fromFiber(fiber, root);
}
function resolveComponentName(fiber) {
  return nearestNamedComponentName(fiber);
}
function fromAttributes(node) {
  const path = node.getAttribute("data-inspector-relative-path") ?? node.getAttribute("data-source-file") ?? node.getAttribute("data-sentry-source-file");
  const line = node.getAttribute("data-inspector-line") ?? node.getAttribute("data-source-line");
  if (!path || !line) return null;
  const colAttr = node.getAttribute("data-inspector-column") ?? node.getAttribute("data-source-column");
  return {
    relativePath: path,
    lineNumber: Number(line),
    columnNumber: colAttr != null ? Number(colAttr) : null,
    componentName: null,
    // filled by caller from the fiber if available
    tier: "attribute"
  };
}
function fromFiber(fiber, root) {
  let f = fiber;
  while (f) {
    const dbg = f._debugSource ?? // React ≤18
    f.memoizedProps?.__source ?? // classic runtime __source prop
    f._debugInfo?.[0];
    if (dbg?.fileName) {
      return {
        relativePath: toRelative(dbg.fileName, root),
        lineNumber: typeof dbg.lineNumber === "number" ? dbg.lineNumber : 0,
        columnNumber: typeof dbg.columnNumber === "number" ? dbg.columnNumber : null,
        componentName: getComponentName(nearestComponentFiber(f)),
        tier: "fiber"
      };
    }
    f = f.return;
  }
  return null;
}
function toRelative(fileName, root) {
  if (root && fileName.startsWith(root)) {
    return fileName.slice(root.length).replace(/^[\\/]/, "");
  }
  const m = fileName.match(/(?:^|[\\/])(src|app|pages|components)[\\/].*/);
  return m ? m[0].replace(/^[\\/]/, "") : fileName;
}

// src/interaction/markup.ts
var DOUBLE_CLICK_MS = 250;
var MarkupController = class {
  constructor(host) {
    this.host = host;
    this.hovered = null;
    this.granularity = 0;
    // 0 = exact element; arrow-up widens to parents
    this.baseNode = null;
    // element under cursor pre-widen
    this.rafPending = false;
    this.lastX = 0;
    this.lastY = 0;
    this.active = false;
    // True while we replay a synthetic plain click (Alt-bypass), so our own
    // capture-phase handler lets that event through to the app instead of
    // re-processing it.
    this.replayingClick = false;
    // Pending single-click annotate, deferred so a double-click can cancel it.
    this.pendingAnnotate = null;
    this.teardown = [];
  }
  attach() {
    if (this.active) return;
    this.active = true;
    const move = (e) => this.onPointerMove(e);
    const click = (e) => this.onClick(e);
    const dblclick = (e) => this.onDoubleClick(e);
    const key = (e) => this.onKeyDown(e);
    document.addEventListener("pointermove", move, true);
    document.addEventListener("click", click, true);
    document.addEventListener("dblclick", dblclick, true);
    document.addEventListener("keydown", key, true);
    this.teardown.push(
      () => document.removeEventListener("pointermove", move, true),
      () => document.removeEventListener("click", click, true),
      () => document.removeEventListener("dblclick", dblclick, true),
      () => document.removeEventListener("keydown", key, true)
    );
  }
  detach() {
    this.teardown.forEach((fn) => fn());
    this.teardown = [];
    this.cancelPendingAnnotate();
    this.hovered = null;
    this.baseNode = null;
    this.granularity = 0;
    this.host.highlight.hide();
    this.active = false;
  }
  cancelPendingAnnotate() {
    if (this.pendingAnnotate != null) {
      clearTimeout(this.pendingAnnotate);
      this.pendingAnnotate = null;
    }
  }
  onPointerMove(e) {
    if (!this.host.isMarkupMode()) return;
    this.lastX = e.clientX;
    this.lastY = e.clientY;
    this.granularity = 0;
    if (this.rafPending) return;
    this.rafPending = true;
    requestAnimationFrame(() => {
      this.rafPending = false;
      this.recompute();
    });
  }
  recompute() {
    const base = topAppElementAt(this.lastX, this.lastY);
    if (!base) {
      this.hovered = null;
      this.baseNode = null;
      this.host.highlight.hide();
      return;
    }
    this.baseNode = base;
    this.applyTarget(widen(base, this.granularity));
  }
  applyTarget(node) {
    const fiber = getFiberFromNode(node);
    const source = resolveSource(node, fiber, this.host.projectRoot());
    const component = source?.componentName ?? resolveComponentName(fiber);
    this.host.highlight.show(node.getBoundingClientRect(), {
      tag: node.tagName.toLowerCase(),
      source: source ? `${baseName2(source.relativePath)}:${source.lineNumber}` : null,
      component
    });
    this.hovered = { node, fiber };
  }
  onKeyDown(e) {
    if (!this.host.isMarkupMode() || !this.baseNode) return;
    if (e.key === "ArrowUp") {
      e.preventDefault();
      this.granularity++;
      this.applyTarget(widen(this.baseNode, this.granularity));
    } else if (e.key === "ArrowDown") {
      if (this.granularity === 0) return;
      e.preventDefault();
      this.granularity--;
      this.applyTarget(widen(this.baseNode, this.granularity));
    }
  }
  onClick(e) {
    if (this.replayingClick) return;
    if (!this.host.isMarkupMode() || !this.hovered) return;
    if (e.altKey) {
      e.preventDefault();
      e.stopPropagation();
      this.replayPlainClick(e);
      return;
    }
    e.preventDefault();
    e.stopPropagation();
    const { node, fiber } = this.hovered;
    this.cancelPendingAnnotate();
    this.pendingAnnotate = setTimeout(() => {
      this.pendingAnnotate = null;
      this.host.createAnnotation(node, fiber);
    }, DOUBLE_CLICK_MS);
  }
  onDoubleClick(e) {
    if (this.replayingClick) return;
    if (!this.host.isMarkupMode() || !this.hovered) return;
    if (e.altKey) return;
    e.preventDefault();
    e.stopPropagation();
    this.cancelPendingAnnotate();
    const { node, fiber } = this.hovered;
    const source = resolveSource(node, fiber, this.host.projectRoot());
    this.host.openSource(source);
  }
  /**
   * Dispatch a plain (no-modifier) click on the element actually under the
   * cursor, mirroring the original event's coordinates/button so the app's own
   * handlers react exactly as for a normal user click.
   */
  replayPlainClick(src) {
    const target = document.elementFromPoint(src.clientX, src.clientY) ?? src.target;
    if (!target) return;
    const replay = new MouseEvent("click", {
      bubbles: true,
      cancelable: true,
      clientX: src.clientX,
      clientY: src.clientY,
      button: src.button,
      buttons: src.buttons,
      // Explicitly strip every modifier so this reads as an ordinary click.
      altKey: false,
      ctrlKey: false,
      metaKey: false,
      shiftKey: false
    });
    this.replayingClick = true;
    try {
      target.dispatchEvent(replay);
    } finally {
      this.replayingClick = false;
    }
  }
};
function widen(node, steps) {
  let el = node;
  for (let i = 0; i < steps && el.parentElement; i++) el = el.parentElement;
  return el;
}
function baseName2(path) {
  const i = Math.max(path.lastIndexOf("/"), path.lastIndexOf("\\"));
  return i >= 0 ? path.slice(i + 1) : path;
}

// src/interaction/routing.ts
function currentRoute() {
  return location.pathname || "/";
}
function onRouteChange(cb) {
  const fire = () => {
    Promise.resolve().then(cb);
  };
  const patched = [];
  for (const m of ["pushState", "replaceState"]) {
    const orig = history[m];
    patched.push([m, orig]);
    history[m] = function(...args) {
      const result = orig.apply(
        this,
        args
      );
      fire();
      return result;
    };
  }
  window.addEventListener("popstate", fire);
  window.addEventListener("hashchange", fire);
  return () => {
    for (const [m, orig] of patched) history[m] = orig;
    window.removeEventListener("popstate", fire);
    window.removeEventListener("hashchange", fire);
  };
}

// src/interaction/shortcuts.ts
function registerShortcuts(shortcuts, run) {
  const map = /* @__PURE__ */ new Map([
    [normalize(shortcuts.toggleMarkup), "toggleMarkup"],
    [normalize(shortcuts.toggleVisible), "toggleVisible"],
    [normalize(shortcuts.toggleShowAll), "toggleShowAll"],
    [normalize(shortcuts.escapeMarkup), "escapeMarkup"]
  ]);
  const handler = (e) => {
    const combo = comboFromEvent(e);
    const action = map.get(combo);
    if (!action) return;
    const target = realTarget(e);
    if (isTypingTarget(target)) {
      if (!isInsideHost(target)) return;
      if (!hasModifier(e)) return;
    }
    if (!run(action)) return;
    e.preventDefault();
    e.stopPropagation();
  };
  document.addEventListener("keydown", handler, true);
  return () => document.removeEventListener("keydown", handler, true);
}
function realTarget(e) {
  const path = e.composedPath?.();
  if (path && path.length > 0) return path[0];
  return e.target;
}
function hasModifier(e) {
  return e.ctrlKey || e.metaKey || e.altKey;
}
function isTypingTarget(node) {
  if (!(node instanceof HTMLElement)) return false;
  const tag = node.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || node.isContentEditable;
}
function comboFromEvent(e) {
  const parts = [];
  if (e.ctrlKey) parts.push("Ctrl");
  if (e.metaKey) parts.push("Meta");
  if (e.altKey) parts.push("Alt");
  if (e.shiftKey) parts.push("Shift");
  const key = keyName(e);
  if (key) parts.push(key);
  return parts.join("+");
}
function keyName(e) {
  if (e.code && /^Key[A-Z]$/.test(e.code)) return e.code.slice(3);
  if (e.key.length === 1) return e.key.toUpperCase();
  return e.key;
}
function normalize(combo) {
  const parts = combo.split("+").map((p) => p.trim()).filter(Boolean);
  const mods = [];
  let key = "";
  for (const p of parts) {
    const lower = p.toLowerCase();
    if (lower === "ctrl" || lower === "control") mods.push("Ctrl");
    else if (lower === "meta" || lower === "cmd" || lower === "command") mods.push("Meta");
    else if (lower === "alt" || lower === "option") mods.push("Alt");
    else if (lower === "shift") mods.push("Shift");
    else key = p.length === 1 ? p.toUpperCase() : p;
  }
  const order = ["Ctrl", "Meta", "Alt", "Shift"];
  mods.sort((a, b) => order.indexOf(a) - order.indexOf(b));
  return [...mods, key].filter(Boolean).join("+");
}

// src/inspector/trigger.ts
function captureTrigger(node) {
  const doc = node.ownerDocument;
  if (!doc) return null;
  const expanded = Array.from(
    doc.querySelectorAll('[aria-expanded="true"]')
  ).filter((el) => !el.contains(node));
  for (const el of expanded) {
    const controls = el.getAttribute("aria-controls");
    if (!controls) continue;
    for (const refId of controls.split(/\s+/)) {
      const target = refId && doc.getElementById(refId);
      if (target && (target === node || target.contains(node))) {
        return describe(el);
      }
    }
  }
  if (isInsideOverlay(node) && expanded.length === 1) {
    return describe(expanded[0]);
  }
  return null;
}
function isInsideOverlay(node) {
  const OVERLAY_ROLES = /* @__PURE__ */ new Set([
    "menu",
    "dialog",
    "alertdialog",
    "listbox",
    "tooltip",
    "grid"
    // combobox popups
  ]);
  let el = node;
  while (el && el !== el.ownerDocument?.body) {
    const role = el.getAttribute("role");
    if (role && OVERLAY_ROLES.has(role)) return true;
    if (el.hasAttribute("aria-modal")) return true;
    el = el.parentElement;
  }
  return false;
}
function describe(trigger) {
  const name = accessibleName(trigger).slice(0, 80);
  return {
    locators: buildFallbackLocators(trigger),
    label: name || trigger.tagName.toLowerCase()
  };
}

// src/compile/preamble.ts
var PREAMBLE = `<!-- STARLING ANNOTATIONS \u2014 read me first -->

You are receiving UX feedback captured on a running React prototype. Each entry has a
human NOTE and a machine-readable locator bundle. There are two ways to use this file:

1. **Update the PRD/FRD** \u2014 treat each NOTE as a change request for the marked element.
2. **Apply changes in code** \u2014 locate the element, then make the change the NOTE describes.

How to locate each element:

- **\`fallbackLocators\` are the primary anchor.** Each entry lists several strategies
  (testid \u2192 id \u2192 role+name \u2192 text \u2192 css), most-stable first, each with a ready-to-paste
  Playwright expression for runtime verification and to disambiguate repeated \`.map()\`
  items. Use these first.
- **\`source\` (\`relativePath:lineNumber\`) is a precise bonus when present** \u2014 it points at
  the exact authored JSX line of the element that was marked, openable from the project
  root. On React 19 it is often \`null\` (React removed the fiber source field); when it
  IS present, prefer it. \`source.componentName\` names the ENCLOSING component for
  context, not necessarily the edit target.
- **\`context\`** (tag, role, text, bounding box) helps you confirm you found the right
  element, especially when \`source\` is null.

Treat repo-relative paths as openable. Group your work by route.`;

// src/compile/compile.ts
function compile(session) {
  const byRoute = groupBy(session.annotations, (a) => a.session.route);
  const sections = Object.entries(byRoute).map(([route, anns]) => {
    const body = anns.map(renderAnnotation).join("\n\n");
    return `## Route: \`${route}\`

${body}`;
  });
  const heading = `# Starling annotations (${session.annotations.length})`;
  if (session.annotations.length === 0) {
    return [PREAMBLE, heading, "_No annotations captured._"].join("\n\n");
  }
  return [PREAMBLE, heading, ...sections].join("\n\n");
}
function renderAnnotation(a) {
  const where = a.source ? `${a.source.relativePath}:${a.source.lineNumber}${a.source.componentName ? ` (in <${a.source.componentName}>)` : ""}` : `${a.context.tagName}${a.context.componentName ? ` in <${a.context.componentName}>` : ""} (no source \u2014 use fallback locators)`;
  const json = JSON.stringify(
    {
      id: a.id,
      note: a.note,
      source: a.source,
      fallbackLocators: a.fallbackLocators,
      trigger: a.trigger ?? null,
      context: a.context,
      session: a.session
    },
    null,
    2
  );
  const lines = [
    `### ${where}`,
    `**Note:** ${a.note.trim() || "_(empty)_"}`
  ];
  if (a.trigger) {
    lines.push(`**Reachable via:** open "${a.trigger.label}" (transient overlay)`);
  }
  lines.push("```json", json, "```");
  return lines.join("\n");
}

// src/compile/download.ts
async function saveSnapshotToEndpoint(endpoint, appId, basename, markdown, sessionJson) {
  const safe = sanitizeBasename(basename);
  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ appId, basename: safe, markdown, sessionJson })
    });
    if (!res.ok) return null;
    const data = await res.json().catch(() => null);
    if (!data || typeof data.id !== "string") return null;
    const author = typeof data.author === "string" ? data.author : null;
    const savedAt = typeof data.savedAt === "string" ? data.savedAt : "";
    return { id: data.id, savedAt, author };
  } catch {
    return null;
  }
}
async function openSourceAtEndpoint(endpoint, location2) {
  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(location2)
    });
    if (!res.ok) return false;
    const data = await res.json().catch(() => null);
    return data?.ok === true;
  } catch {
    return false;
  }
}
function sanitizeBasename(name) {
  const trimmed = (name || "").trim().replace(/\.(md|starling\.json)$/i, "");
  const cleaned = trimmed.replace(/[^a-zA-Z0-9._-]/g, "-");
  return cleaned || "starling-annotations";
}

// src/Starling.ts
function resolveView(view, s, readOnly = false) {
  if (!s.toolVisible) return "collapsed";
  if (readOnly) {
    if (s.showAllMarkup) return "pinned";
    return view === "collapsed" ? "collapsed" : "hover";
  }
  if (view === "editing") return "editing";
  if (s.showAllMarkup) return "pinned";
  return view;
}
var Starling = class {
  constructor(backend, opts) {
    this.state = {
      toolVisible: true,
      markupMode: false,
      showAllMarkup: false
    };
    /** Runtime annotations for the CURRENT route only. */
    this.runtime = [];
    this.markers = /* @__PURE__ */ new Map();
    this.sidebarOpen = false;
    /** True while a Compile save is in flight — blocks re-entry. */
    this.compiling = false;
    // ---- Rewind / active-session state ----------------------------------------
    /**
     * The active session driving the UI. `null` = the live editable store;
     * otherwise the filename of a loaded past snapshot (read-only).
     */
    this.currentSessionId = null;
    /** In-memory loaded past Session when `currentSessionId !== null`. */
    this.loadedSession = null;
    /** Snapshot metadata from the list endpoint, for the sidebar picker. */
    this.snapshots = [];
    this.teardown = [];
    this.projectRootValue = opts.projectRoot;
    this.appId = opts.appId;
    this.shortcuts = { ...DEFAULT_SHORTCUTS, ...opts.shortcuts };
    this.compileFilename = opts.compileFilename;
    this.saveEndpoint = opts.saveEndpoint;
    this.listEndpoint = opts.listEndpoint;
    this.loadEndpoint = opts.loadEndpoint;
    this.openEndpoint = opts.openEndpoint;
    this.store = new SessionStore(backend);
    this.overlay = new Overlay(
      {
        onToggleMarkup: () => this.setMarkupMode(!this.state.markupMode),
        onToggleShowAll: () => this.setShowAll(!this.state.showAllMarkup),
        onToggleVisible: () => this.setVisible(!this.state.toolVisible),
        onToggleSidebar: () => this.toggleSidebar(),
        onCompile: () => this.compileAndSave(),
        onClearAll: () => this.clearAll()
      },
      {
        onJump: (annId) => this.jumpTo(annId),
        onDelete: (annId) => this.deleteAnnotation(annId),
        onClose: () => this.toggleSidebar(false),
        onSelectSession: (filename) => this.selectSession(filename)
      }
    );
    this.markup = new MarkupController({
      isMarkupMode: () => this.state.markupMode,
      projectRoot: () => this.projectRootValue,
      highlight: this.overlay.highlight,
      createAnnotation: (node, fiber) => this.createAnnotationFrom(node, fiber),
      openSource: (source) => this.openSourceInEditor(source)
    });
    this.anchorer = new Anchorer(
      () => this.runtime,
      () => this.repositionMarkers()
    );
    const unsubStore = this.store.subscribe(() => this.onStoreChanged());
    const unsubRoute = onRouteChange(() => this.onRouteChanged());
    const unsubKeys = registerShortcuts(this.shortcuts, (a) => this.runShortcut(a));
    const onUnload = () => this.store.flush();
    window.addEventListener("beforeunload", onUnload);
    this.teardown.push(
      unsubStore,
      unsubRoute,
      unsubKeys,
      () => window.removeEventListener("beforeunload", onUnload)
    );
    this.loadRouteRuntime();
    this.anchorer.start();
    this.renderToolbar();
    this.renderMarkers();
    this.renderSidebar();
  }
  // ---- Active session (Rewind) ----------------------------------------------
  /** True when a past snapshot is loaded — the UI is read-only. */
  get readOnly() {
    return this.currentSessionId !== null;
  }
  /** The Session whose annotations currently drive the UI (live or loaded). */
  activeSession() {
    return this.loadedSession ?? this.store.snapshot();
  }
  // ---- Visibility controls --------------------------------------------------
  setMarkupMode(on) {
    this.state.markupMode = on;
    if (on) this.markup.attach();
    else {
      this.markup.detach();
    }
    this.renderToolbar();
  }
  setShowAll(on) {
    this.state.showAllMarkup = on;
    this.renderToolbar();
    this.renderMarkers();
  }
  setVisible(on) {
    this.state.toolVisible = on;
    this.overlay.setVisible(on);
    if (!on && this.state.markupMode) this.markup.detach();
    else if (on && this.state.markupMode) this.markup.attach();
  }
  /**
   * Run a keyboard action. Returns whether it was handled — callers use this to
   * decide whether to swallow the key event. `escapeMarkup` is the only action
   * that can decline (a no-op when markup is already off), so Escape still
   * reaches the host app in that case.
   */
  runShortcut(action) {
    switch (action) {
      case "toggleMarkup":
        if (!this.state.toolVisible) this.setVisible(true);
        this.setMarkupMode(!this.state.markupMode);
        return true;
      case "toggleVisible":
        this.setVisible(!this.state.toolVisible);
        return true;
      case "toggleShowAll":
        if (!this.state.toolVisible) this.setVisible(true);
        this.setShowAll(!this.state.showAllMarkup);
        return true;
      case "escapeMarkup":
        if (!this.state.markupMode) return false;
        this.setMarkupMode(false);
        return true;
    }
  }
  toggleSidebar(force) {
    this.sidebarOpen = force ?? !this.sidebarOpen;
    this.overlay.sidebar.setOpen(this.sidebarOpen);
    if (this.sidebarOpen) {
      this.renderSidebar();
      void this.refreshSnapshots();
    }
  }
  // ---- Rewind: list / select / return ---------------------------------------
  /**
   * Append the host `appId` scope to an endpoint URL so save/list/load all read
   * and write the same app's snapshots. No-op when `appId` is unset.
   */
  appQuery(url) {
    if (!this.appId) return url;
    const sep2 = url.includes("?") ? "&" : "?";
    return `${url}${sep2}app=${encodeURIComponent(this.appId)}`;
  }
  /** Fetch saved-snapshot metadata from the list endpoint. Degrades to []. */
  async refreshSnapshots() {
    if (!this.listEndpoint) {
      this.snapshots = [];
      return;
    }
    try {
      const res = await fetch(this.appQuery(this.listEndpoint));
      if (!res.ok) {
        this.snapshots = [];
      } else {
        const data = await res.json().catch(() => null);
        this.snapshots = Array.isArray(data?.snapshots) ? data.snapshots : [];
      }
    } catch {
      this.snapshots = [];
    }
    this.renderSidebar();
  }
  /**
   * Swap the active session. `null` returns to the live editable store; otherwise
   * loads a past snapshot (read-only) and re-anchors its stickies onto the build.
   * Always restores from the JSON sidecar — Markdown is never parsed.
   */
  async selectSession(filename) {
    if (filename === null) return this.returnToLive();
    if (filename === this.currentSessionId) return;
    if (!this.loadEndpoint) {
      this.overlay.toast.show("Loading snapshots isn't configured", "error");
      return;
    }
    let session = null;
    try {
      const res = await fetch(
        this.appQuery(`${this.loadEndpoint}?file=${encodeURIComponent(filename)}`)
      );
      if (res.ok) session = await res.json().catch(() => null);
    } catch {
    }
    if (!session) {
      this.overlay.toast.show("Couldn't load snapshot", "error");
      return;
    }
    if (session.version !== 1 || !Array.isArray(session.annotations)) {
      this.overlay.toast.show("Snapshot version not supported", "error");
      return;
    }
    this.flushPendingEdit();
    this.currentSessionId = filename;
    this.loadedSession = session;
    this.loadRouteRuntime();
    this.anchorer.refresh();
    this.renderToolbar();
    this.renderMarkers();
    this.renderSidebar();
    this.overlay.toast.show("Rewound \u2014 read-only", "success");
  }
  /** Return to the live, editable current session. */
  returnToLive() {
    if (this.currentSessionId === null) return;
    this.currentSessionId = null;
    this.loadedSession = null;
    this.loadRouteRuntime();
    this.anchorer.refresh();
    this.renderToolbar();
    this.renderMarkers();
    this.renderSidebar();
    this.overlay.toast.show("Back to current session", "success");
  }
  /**
   * Before swapping sessions, settle any sticky that's mid-edit in the live
   * session: discard it if blank, else collapse + flush so the note persists.
   * No-op when already read-only (no editable sticky exists).
   */
  flushPendingEdit() {
    if (this.readOnly) return;
    const editing = this.runtime.find((r) => r.view === "editing");
    if (editing) {
      if (!this.discardIfEmpty(editing.data.id)) {
        editing.view = "collapsed";
      }
    }
    this.store.flush();
  }
  // ---- Annotation lifecycle -------------------------------------------------
  createAnnotationFrom(node, fiber) {
    if (this.readOnly) {
      this.overlay.toast.show("Switch to current session to add annotations", "error");
      return;
    }
    const source = resolveSource(node, fiber, this.projectRootValue);
    const componentName = source?.componentName ?? resolveComponentName(fiber);
    const now = (/* @__PURE__ */ new Date()).toISOString();
    const ann = {
      id: id(),
      note: "",
      source,
      fallbackLocators: buildFallbackLocators(node),
      // Best-effort: if this element lives in a transient overlay, remember the
      // control that opened it so a detached marker can re-summon it.
      trigger: captureTrigger(node),
      context: snapshotContext(node, componentName),
      session: {
        route: currentRoute(),
        url: location.href,
        viewport: { width: window.innerWidth, height: window.innerHeight },
        capturedAt: now
      },
      createdAt: now,
      updatedAt: now
    };
    this.store.add(ann);
    const rt = this.runtime.find((r) => r.data.id === ann.id);
    if (rt) {
      rt.el = node;
      rt.rect = node.getBoundingClientRect();
      rt.view = "editing";
      stampAnchorKey(node, ann.id);
      this.renderMarkers();
      this.markers.get(ann.id)?.focusSticky();
    } else {
      this.overlay.toast.show("Couldn't add annotation", "error");
    }
  }
  /**
   * Open the double-clicked element's source file in the local editor via the
   * dev-server `openEndpoint`. Best-effort and toast-only: a missing source
   * (no Tier-1 stamping — e.g. running under Turbopack instead of
   * `next dev --webpack`), an unconfigured endpoint, or a failed launch each
   * surface a toast rather than throwing. Allowed in read-only (Rewind) sessions
   * since it only reads the live DOM's source location, never mutates anything.
   */
  openSourceInEditor(source) {
    if (!source) {
      this.overlay.toast.show(
        "No source location \u2014 run the app with next dev --webpack",
        "error"
      );
      return;
    }
    if (!this.openEndpoint) {
      this.overlay.toast.show("Opening in editor isn't configured", "error");
      return;
    }
    void openSourceAtEndpoint(this.openEndpoint, {
      relativePath: source.relativePath,
      lineNumber: source.lineNumber,
      columnNumber: source.columnNumber
    }).then((ok) => {
      if (!ok) this.overlay.toast.show("Couldn't open in editor", "error");
    });
  }
  deleteAnnotation(annId) {
    const rt = this.runtime.find((r) => r.data.id === annId);
    if (rt?.el) clearAnchorKey(rt.el, annId);
    this.store.remove(annId);
  }
  // ---- Store / route reactions ----------------------------------------------
  onStoreChanged() {
    if (this.readOnly) {
      this.renderToolbar();
      this.renderSidebar();
      return;
    }
    this.syncRuntimeWithActive();
    this.renderToolbar();
    this.renderMarkers();
    this.renderSidebar();
  }
  onRouteChanged() {
    this.loadRouteRuntime();
    this.anchorer.refresh();
    this.renderMarkers();
    this.renderSidebar();
  }
  /** (Re)build the runtime list for the current route from the active session. */
  loadRouteRuntime() {
    const route = currentRoute();
    const existing = new Map(this.runtime.map((r) => [r.data.id, r]));
    this.runtime = this.annotationsForRoute(route).map((data) => {
      const prev = existing.get(data.id);
      if (prev) {
        prev.data = data;
        return prev;
      }
      return this.toRuntime(data);
    });
  }
  /** Annotations on `route` from whichever session is active (live or loaded). */
  annotationsForRoute(route) {
    return this.activeSession().annotations.filter((a) => a.session.route === route);
  }
  /** Reconcile runtime with the active session after add/update/remove on this route. */
  syncRuntimeWithActive() {
    const route = currentRoute();
    const onRoute = this.annotationsForRoute(route);
    const byId = new Map(this.runtime.map((r) => [r.data.id, r]));
    const next = [];
    for (const data of onRoute) {
      const prev = byId.get(data.id);
      if (prev) {
        prev.data = data;
        next.push(prev);
      } else {
        next.push(this.toRuntime(data));
      }
    }
    this.runtime = next;
  }
  toRuntime(data) {
    return { data, el: null, rect: null, detached: false, view: "collapsed" };
  }
  // ---- Rendering ------------------------------------------------------------
  renderToolbar() {
    this.overlay.toolbar.setState(this.state);
    this.overlay.toolbar.setCount(this.activeSession().annotations.length);
    this.overlay.toolbar.setReadOnly(this.readOnly);
  }
  renderSidebar() {
    if (!this.sidebarOpen) return;
    const detached = new Set(
      this.runtime.filter((r) => r.detached).map((r) => r.data.id)
    );
    this.overlay.sidebar.render({
      liveAnnotations: this.store.all(),
      snapshots: this.snapshots,
      activeFilename: this.currentSessionId,
      loadedAnnotations: this.loadedSession?.annotations ?? null,
      currentRoute: currentRoute(),
      detachedIds: detached
    });
  }
  /** Build/refresh marker DOM to match the current runtime set. */
  renderMarkers() {
    const root = this.overlay.markersRoot;
    const live = new Set(this.runtime.map((r) => r.data.id));
    for (const [annId, marker] of this.markers) {
      if (!live.has(annId)) {
        marker.remove();
        this.markers.delete(annId);
      }
    }
    for (const rt of this.runtime) {
      let marker = this.markers.get(rt.data.id);
      if (!marker) {
        marker = new Marker(rt, {
          onNoteInput: (annId, note) => this.store.update(annId, { note }),
          onSave: (annId) => this.saveAndCollapse(annId),
          onDelete: (annId) => this.deleteAnnotation(annId),
          onBadgeEnter: (annId) => this.setView(annId, "hover"),
          onBadgeLeave: (annId) => this.onBadgeLeave(annId),
          onBadgeClick: (annId) => this.togglePin(annId),
          onStickyBlur: (annId) => this.onStickyBlur(annId),
          onReopen: (annId) => this.reopenTrigger(annId)
        });
        root.append(marker.badge.el, marker.sticky.el);
        this.markers.set(rt.data.id, marker);
      }
      const resolved = resolveView(rt.view, this.state, this.readOnly);
      const count = this.badgeCountFor(rt);
      marker.update(rt, resolved, count, this.readOnly);
      marker.setHidden(rt.detached && this.readOnly);
    }
    this.repositionMarkers();
  }
  /**
   * Multiple stickies can target the same element. The badge shows the count;
   * we render one badge per annotation but label each with the group count.
   */
  badgeCountFor(rt) {
    const key = anchorKey(rt);
    return this.runtime.filter((r) => anchorKey(r) === key).length;
  }
  repositionMarkers() {
    const points = [];
    for (const rt of this.runtime) {
      const marker = this.markers.get(rt.data.id);
      if (!marker) continue;
      marker.position(rt.rect, rt.detached ? lastKnownPoint(rt) : null);
      marker.setOffscreen(!rt.detached && !!rt.el && !isElementInView(rt.el));
      const rect = rt.rect;
      points.push({
        rt,
        marker,
        pt: rect ? badgePosition(rect) : rt.detached ? lastKnownPoint(rt) : null
      });
    }
    const fanned = fanOut(points.map((p) => p.pt ?? { left: -9999, top: -9999 }));
    points.forEach((p, i) => {
      const fp = fanned[i];
      if (p.pt && fp) p.marker.setBadgePoint(fp);
    });
    this.syncEditingHighlight();
  }
  /**
   * Keep the highlight box pinned on the element whose note is being written, so
   * it stays visible until the note is saved or deleted. Tracks scroll/resize
   * because this runs on every anchor pass. Cleared when nothing is editing.
   */
  syncEditingHighlight() {
    const editing = this.runtime.find((r) => r.view === "editing" && r.rect);
    if (editing && editing.rect) {
      this.overlay.highlight.pin(editing.rect);
    } else if (this.overlay.highlight.isPinned()) {
      this.overlay.highlight.unpin();
    }
  }
  // ---- View transitions -----------------------------------------------------
  setView(annId, view) {
    const rt = this.runtime.find((r) => r.data.id === annId);
    if (!rt) return;
    rt.view = view;
    this.renderMarkers();
  }
  /**
   * Explicit save (Enter). Collapses the sticky and confirms with a toast when
   * the note actually persisted; a blank note is silently discarded (no toast)
   * since nothing was added. Distinct from a blur-collapse, which never toasts.
   */
  saveAndCollapse(annId) {
    if (this.discardIfEmpty(annId)) return;
    this.setView(annId, "collapsed");
    this.overlay.toast.show("Annotation added", "success");
  }
  /**
   * Remove an annotation whose note is blank (empty or only whitespace).
   * Returns true when it was discarded, so callers can skip a follow-up
   * collapse. Used when editing ends (save / blur) so empty stickies never
   * reach storage or the compiled artifact.
   */
  discardIfEmpty(annId) {
    const note = this.store.get(annId)?.note ?? "";
    if (note.trim() !== "") return false;
    this.deleteAnnotation(annId);
    return true;
  }
  onBadgeLeave(annId) {
    const rt = this.runtime.find((r) => r.data.id === annId);
    if (!rt) return;
    if (rt.view === "hover") this.setView(annId, "collapsed");
  }
  togglePin(annId) {
    const rt = this.runtime.find((r) => r.data.id === annId);
    if (!rt) return;
    this.setView(annId, rt.view === "pinned" ? "collapsed" : "pinned");
  }
  onStickyBlur(annId) {
    setTimeout(() => {
      const active = this.overlay.activeElement();
      const marker = this.markers.get(annId);
      if (marker && marker.stickyContainsFocus(active)) return;
      const rt = this.runtime.find((r) => r.data.id === annId);
      if (rt && (rt.view === "editing" || rt.view === "hover")) {
        if (this.discardIfEmpty(annId)) return;
        this.setView(annId, "collapsed");
      }
    }, 0);
  }
  /**
   * Re-summon the overlay a detached annotation lives in by clicking its
   * captured trigger (e.g. the avatar button that opens the persona menu). The
   * overlay remounts, the MutationObserver fires, and the Anchorer's existing
   * re-find chain re-attaches the marker — no special-casing needed here beyond
   * a follow-up refresh in case the mount lands between observer batches.
   */
  reopenTrigger(annId) {
    if (!this.state.toolVisible) this.setVisible(true);
    const rt = this.runtime.find((r) => r.data.id === annId);
    const trigger = rt?.data.trigger;
    if (!trigger) return;
    let el = null;
    for (const loc of trigger.locators) {
      el = tryLocator(loc);
      if (el) break;
    }
    if (!el) {
      this.overlay.toast.show("Couldn't find the control that opens this", "error");
      return;
    }
    el.click?.();
    requestAnimationFrame(() => {
      this.anchorer.refresh();
      const after = this.runtime.find((r) => r.data.id === annId);
      if (after && !after.detached) this.setView(annId, "pinned");
    });
  }
  jumpTo(annId) {
    if (!this.state.toolVisible) this.setVisible(true);
    const rt = this.runtime.find((r) => r.data.id === annId);
    if (rt?.el) {
      rt.el.scrollIntoView({ behavior: "smooth", block: "center" });
    }
    this.setView(annId, "pinned");
  }
  // ---- Compile --------------------------------------------------------------
  /**
   * Compile the active session and persist it to the shared remote store (both
   * the Markdown and the canonical Session JSON) via the save endpoint. There is
   * no browser-download path: Compile requires a save endpoint, which also stamps
   * authorship server-side and scopes the snapshot by `appId`. The JSON is the
   * round-trippable source of truth for Rewind, and the save propagates to other
   * users with no git push/pull.
   */
  compileAndSave() {
    if (!this.saveEndpoint) {
      this.overlay.toast.show("Saving isn't configured", "error");
      return;
    }
    if (this.readOnly) {
      this.overlay.toast.show("Switch to the current session to compile", "error");
      return;
    }
    if (this.compiling) return;
    this.compiling = true;
    this.overlay.toolbar.setCompiling(true);
    this.store.pruneEmpty();
    this.store.flush();
    const session = this.activeSession();
    const md = compile(session);
    const sessionJson = JSON.stringify(session);
    const basename = stripExt(this.compileFilename) ?? defaultCompileBasename(session.annotations.length);
    saveSnapshotToEndpoint(
      this.saveEndpoint,
      this.appId ?? "",
      basename,
      md,
      sessionJson
    ).then(
      (result) => {
        if (result == null) {
          this.overlay.toast.show(
            "Couldn't save \u2014 is the dev server running?",
            "error"
          );
          return;
        }
        const by = result.author ? ` by ${result.author}` : "";
        this.overlay.toast.show(`Saved${by}`, "success");
        this.store.reset();
        void this.refreshSnapshots();
      }
    ).finally(() => {
      this.compiling = false;
      this.overlay.toolbar.setCompiling(false);
    });
  }
  /**
   * Wipe every annotation across all routes. Destructive, so it confirms
   * first. The store change cascades through onStoreChanged → re-sync runtime,
   * clearing markers and refreshing the count.
   */
  clearAll() {
    if (this.readOnly) {
      this.overlay.toast.show("Switch to current session to clear", "error");
      return;
    }
    const total = this.store.all().length;
    if (total === 0) return;
    const noun = total === 1 ? "annotation" : "annotations";
    if (!window.confirm(`Delete all ${total} ${noun}? This can't be undone.`)) {
      return;
    }
    this.store.clear();
  }
  // ---- Teardown -------------------------------------------------------------
  destroy() {
    this.store.flush();
    this.markup.detach();
    this.anchorer.stop();
    this.teardown.forEach((fn) => fn());
    this.teardown = [];
    this.markers.forEach((m) => m.remove());
    this.markers.clear();
    this.overlay.destroy();
  }
};
function anchorKey(rt) {
  const s = rt.data.source;
  if (s) return `src:${s.relativePath}:${s.lineNumber}:${s.columnNumber ?? ""}`;
  const first = rt.data.fallbackLocators[0];
  return first ? `loc:${first.strategy}:${first.value}` : `id:${rt.data.id}`;
}
function lastKnownPoint(rt) {
  const r = rt.data.context.rect;
  return { left: Math.max(r.x + r.width - 12, 8), top: Math.max(r.y - 6, 8) };
}
function defaultCompileBasename(count) {
  const d = /* @__PURE__ */ new Date();
  const pad = (n) => String(n).padStart(2, "0");
  const date = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const time = `${pad(d.getHours())}${pad(d.getMinutes())}`;
  const noun = count === 1 ? "annotation" : "annotations";
  return `starling-${count}-${noun}-${date}-${time}`;
}
function stripExt(name) {
  if (!name) return void 0;
  return name.replace(/\.(md|starling\.json)$/i, "");
}

// src/store/backends/LocalStorageBackend.ts
var LocalStorageBackend = class {
  constructor(key = STORAGE_KEY) {
    this.key = key;
  }
  load() {
    try {
      const raw = localStorage.getItem(this.key);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (!parsed || parsed.version !== 1 || !Array.isArray(parsed.annotations)) {
        return null;
      }
      return parsed;
    } catch {
      return null;
    }
  }
  save(session) {
    try {
      localStorage.setItem(this.key, JSON.stringify(session));
    } catch {
    }
  }
  clear() {
    try {
      localStorage.removeItem(this.key);
    } catch {
    }
  }
};

// src/index.ts
function isDevBuild() {
  try {
    if (typeof import.meta !== "undefined" && import.meta.env?.DEV) return true;
  } catch {
  }
  if (typeof process !== "undefined" && process.env && true) {
    return true;
  }
  return false;
}
function mountStarling(opts = {}) {
  if (typeof window === "undefined") return;
  if (!isDevBuild()) return;
  const w = window;
  if (w[GLOBAL_FLAG]) return;
  w[GLOBAL_FLAG] = new Starling(new LocalStorageBackend(), opts);
}
function unmountStarling() {
  if (typeof window === "undefined") return;
  const w = window;
  const inst = w[GLOBAL_FLAG];
  if (inst) {
    inst.destroy();
    delete w[GLOBAL_FLAG];
  }
}

export { compile, mountStarling, unmountStarling };
//# sourceMappingURL=index.js.map
//# sourceMappingURL=index.js.map