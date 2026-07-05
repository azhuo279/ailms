import type { Annotation, SnapshotMeta } from "../types";
import { groupBy } from "../util/group";

/** lucide chevron-right — rotates to point down when a day accordion is open. */
const CHEVRON_SVG =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>';

export interface SidebarCallbacks {
  onJump(annId: string): void;
  onDelete(annId: string): void;
  onClose(): void;
  /**
   * Switch the active session. `null` returns to the live current session;
   * a filename selects that past snapshot (read-only).
   */
  onSelectSession(filename: string | null): void;
}

/**
 * Arguments for one render pass. The orchestrator owns all fetching (the list of
 * snapshots, the loaded session) and hands the sidebar a flat view to draw.
 */
export interface SidebarRenderArgs {
  /** The live editable session's annotations (always available). */
  liveAnnotations: Annotation[];
  /** Saved-snapshot metadata from the list endpoint (newest first; may be empty). */
  snapshots: SnapshotMeta[];
  /** Filename of the active past snapshot, or `null` when the live session is active. */
  activeFilename: string | null;
  /** Annotations of the active loaded snapshot, or `null` when live is active. */
  loadedAnnotations: Annotation[] | null;
  currentRoute: string;
  /** Annotation ids that couldn't be re-found on any view (in the ACTIVE session). */
  detachedIds: Set<string>;
}

/**
 * The Rewind list. A "Current session" group sits on top (live, editable), then
 * one collapsible group per saved snapshot in `annotations/`. Selecting a past
 * snapshot swaps it onto the canvas (read-only); detached annotations are flagged
 * here even though they no longer draw on the page.
 */
export class Sidebar {
  readonly el: HTMLDivElement;
  private body: HTMLDivElement;

  /** Day-keys (YYYY-MM-DD) whose accordion is expanded; survives re-renders. */
  private expandedDays = new Set<string>();
  /** Whether the default open-state (current day expanded) has been applied. */
  private daysSeeded = false;

  constructor(private cb: SidebarCallbacks) {
    this.el = document.createElement("div");
    this.el.className = "pp-sidebar";

    const head = document.createElement("div");
    head.className = "pp-sidebar-head";
    const title = document.createElement("span");
    title.textContent = "Annotations";
    const close = document.createElement("button");
    close.className = "pp-sidebar-close";
    close.type = "button";
    close.textContent = "×";
    close.addEventListener("click", () => this.cb.onClose());
    head.append(title, close);

    this.body = document.createElement("div");
    this.body.className = "pp-sidebar-body";

    this.el.append(head, this.body);
  }

  setOpen(open: boolean): void {
    this.el.classList.toggle("pp-open", open);
  }

  render(args: SidebarRenderArgs): void {
    this.body.replaceChildren();

    const liveActive = args.activeFilename === null;

    // ---- Current session (live, editable) -----------------------------------
    this.body.appendChild(
      this.renderSessionGroup({
        title: "Current session",
        meta: liveActive ? "live · editable" : "live",
        count: args.liveAnnotations.length,
        active: liveActive,
        onSelect: () => this.cb.onSelectSession(null),
        // Only the active group renders its annotation body.
        annotations: liveActive ? args.liveAnnotations : null,
        currentRoute: args.currentRoute,
        detachedIds: args.detachedIds,
        readOnly: false,
      }),
    );

    // ---- Past snapshots, grouped by save-day into accordions -----------------
    // Default open-state (applied once): the current day is expanded, every
    // other day collapsed. User toggles thereafter persist across re-renders.
    if (!this.daysSeeded) {
      this.expandedDays.add(dayKeyOf(new Date()));
      this.daysSeeded = true;
    }
    // Keep the day holding the active (selected) snapshot expanded so its
    // loaded annotations stay visible even if that day was collapsed.
    if (args.activeFilename) {
      const active = args.snapshots.find((s) => s.filename === args.activeFilename);
      if (active) this.expandedDays.add(dayKey(active.savedAt));
    }
    const byDay = groupBy(args.snapshots, (s) => dayKey(s.savedAt));
    for (const [key, snaps] of Object.entries(byDay)) {
      this.body.appendChild(this.renderDayGroup(key, snaps, args));
    }

    // Empty live session and no snapshots → the original empty hint.
    if (args.liveAnnotations.length === 0 && args.snapshots.length === 0) {
      const empty = document.createElement("div");
      empty.className = "pp-sidebar-empty";
      empty.textContent =
        "No annotations yet. Enter markup mode and click an element.";
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
  private renderDayGroup(
    key: string,
    snaps: SnapshotMeta[],
    args: SidebarRenderArgs,
  ): HTMLDivElement {
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
          readOnly: true,
        }),
      );
    }
    group.appendChild(dayBody);

    return group;
  }

  /** Flip one day accordion open/closed, persisting the choice for re-renders. */
  private toggleDay(key: string, group: HTMLDivElement): void {
    const expand = !this.expandedDays.has(key);
    if (expand) this.expandedDays.add(key);
    else this.expandedDays.delete(key);
    group.classList.toggle("pp-day-collapsed", !expand);
  }

  private renderSessionGroup(opts: {
    title: string;
    meta: string;
    count: number;
    active: boolean;
    onSelect: () => void;
    annotations: Annotation[] | null;
    currentRoute: string;
    detachedIds: Set<string>;
    readOnly: boolean;
  }): HTMLDivElement {
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

    // Only the active group expands its annotations.
    if (opts.annotations !== null) {
      const sessionBody = document.createElement("div");
      sessionBody.className = "pp-session-body";

      if (opts.readOnly) {
        const hint = document.createElement("div");
        hint.className = "pp-readonly-hint";
        hint.textContent = "Read-only — switch to current session to edit.";
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
              opts.readOnly,
            ),
          );
        }
      }
      group.appendChild(sessionBody);
    }

    return group;
  }

  private renderRouteGroup(
    route: string,
    anns: Annotation[],
    currentRoute: string,
    detachedIds: Set<string>,
    readOnly: boolean,
  ): HTMLDivElement {
    const group = document.createElement("div");
    group.className = "pp-route-group";

    const rhead = document.createElement("div");
    rhead.className = "pp-route-head";
    const rname = document.createElement("span");
    rname.textContent = route === currentRoute ? `${route} (current)` : route;
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

  private renderItem(
    a: Annotation,
    detached: boolean,
    readOnly: boolean,
  ): HTMLDivElement {
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
    const loc = a.source
      ? `${a.source.relativePath}:${a.source.lineNumber}`
      : a.context.componentName
        ? `${a.context.tagName} · <${a.context.componentName}>`
        : a.context.tagName;
    where.textContent = detached ? `⚠ deleted · ${loc}` : loc;
    if (detached) where.classList.add("pp-ann-detached");

    main.append(note, where);
    item.append(main);

    // Delete is only offered for the editable live session.
    if (!readOnly) {
      const del = document.createElement("button");
      del.className = "pp-ann-del";
      del.type = "button";
      del.textContent = "×";
      del.title = "Delete";
      del.addEventListener("click", (e) => {
        e.stopPropagation();
        this.cb.onDelete(a.id);
      });
      item.append(del);
    }

    return item;
  }
}

/** "12 annotations · by Andy" style metadata for a snapshot header. */
function metaLine(snap: SnapshotMeta): string {
  const noun = snap.annotationCount === 1 ? "annotation" : "annotations";
  const parts = [`${snap.annotationCount} ${noun}`];
  if (snap.author) parts.push(`by ${snap.author}`);
  return parts.join(" · ");
}

/** Local day key, e.g. "2026-06-19" — groups snapshots saved the same day. */
function dayKey(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return dayKeyOf(d);
}

function dayKeyOf(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/**
 * Human label for a day accordion header. Names today/yesterday explicitly (and
 * still shows their date), and drops the year for the current year. Falls back
 * to the raw key when the sample timestamp is unparseable.
 */
function formatDayLabel(key: string, sampleIso: string): string {
  const d = new Date(sampleIso);
  if (Number.isNaN(d.getTime())) return key;
  const now = new Date();
  const yest = new Date(now);
  yest.setDate(now.getDate() - 1);
  const monthDay = d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
  if (key === dayKeyOf(now)) return `Today · ${monthDay}`;
  if (key === dayKeyOf(yest)) return `Yesterday · ${monthDay}`;
  return d.getFullYear() === now.getFullYear()
    ? monthDay
    : `${monthDay}, ${d.getFullYear()}`;
}

/** Compact local time for a snapshot row inside a day, e.g. "2:32 PM". */
function formatTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}
