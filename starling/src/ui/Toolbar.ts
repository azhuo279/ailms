import type { ToolState } from "../types";

export interface ToolbarCallbacks {
  onToggleMarkup(): void;
  onToggleShowAll(): void;
  onToggleVisible(): void;
  onToggleSidebar(): void;
  onCompile(): void;
  onClearAll(): void;
}

/**
 * Inline lucide icon paths (https://lucide.dev, ISC license). The tool is
 * dependency-light (PRD §8), so rather than pull in the `lucide` package we
 * inline the exact path data and build the SVG by hand. 24×24 viewBox, stroked.
 */
const ICONS = {
  // lucide "chevrons-right" — the collapse affordance.
  chevronsRight: ['m6 17 5-5-5-5', 'm13 17 5-5-5-5'],
  // lucide "mouse-pointer-click" — the markup glyph shown when collapsed.
  mousePointerClick: [
    'M14 4.1 12 6',
    'm5.1 8-2.9-.8',
    'm6 12-1.9 2',
    'M7.2 2.2 8 5.1',
    'M9.037 9.69a.498.498 0 0 1 .653-.653l11 4.5a.5.5 0 0 1-.074.949l-4.349 1.041a1 1 0 0 0-.74.739l-1.04 4.35a.5.5 0 0 1-.95.074z',
  ],
} as const;

/**
 * The floating toolbar. Exposes the three visibility controls plus sidebar and
 * compile. `onToggleVisible` (demo hide) is wired here too so the button can be
 * the re-show affordance — but in practice demo-hide is driven by the shortcut,
 * since hiding also hides this button. See Starling.ts.
 *
 * The toolbar can be **collapsed** into a single markup-icon button (a quieter
 * footprint that stays out of the way) and expanded again. Collapse state is
 * local UI chrome, not part of the shared ToolState.
 */
export class Toolbar {
  readonly el: HTMLDivElement;
  private fullEl: HTMLDivElement;
  private collapsedBtn: HTMLButtonElement;
  private markupBtn: HTMLButtonElement;
  private showAllBtn: HTMLButtonElement;
  private sidebarBtn: HTMLButtonElement;
  private compileBtn: HTMLButtonElement;
  private compileLabel: HTMLSpanElement;
  private clearBtn: HTMLButtonElement;
  private countEl: HTMLSpanElement;
  // Compile is disabled when there's nothing to compile, a save is mid-flight,
  // OR a past snapshot is being viewed (read-only). Tracked separately because
  // the conditions are set from different calls (setCount / setCompiling /
  // setReadOnly) and must compose, not clobber each other.
  private compileEmpty = true;
  private compileBusy = false;
  private compileReadOnly = false;
  private collapsed = false;
  /** Suppresses the size transition until the first measured size is applied. */
  private sized = false;

  constructor(cb: ToolbarCallbacks) {
    this.el = document.createElement("div");
    this.el.className = "pp-toolbar";

    // ---- Expanded row -------------------------------------------------------
    this.fullEl = document.createElement("div");
    this.fullEl.className = "pp-toolbar-full";

    // Collapse affordance: two chevrons right, left of everything else.
    const collapseBtn = iconButton(
      ICONS.chevronsRight,
      () => this.setCollapsed(true),
      "Collapse toolbar",
    );
    collapseBtn.classList.add("pp-tool-collapse");

    this.markupBtn = button("Markup", () => cb.onToggleMarkup(), true);
    this.showAllBtn = button("Show all", () => cb.onToggleShowAll(), true);
    this.sidebarBtn = button("List", () => cb.onToggleSidebar(), false);

    this.countEl = document.createElement("span");
    this.countEl.className = "pp-tool-count";
    this.countEl.textContent = "0";
    this.sidebarBtn.appendChild(this.countEl);

    // Compile carries a loading state: while a save is in flight the label
    // reads "Compiling", a spinner shows on the left, and clicks are blocked
    // (see setCompiling). Built by hand so the label can be swapped in place.
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
      // The button is also disabled while compiling, but guard anyway.
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
      hideBtn,
    );

    // ---- Collapsed pill -----------------------------------------------------
    // A single markup-icon button; clicking it expands the toolbar again.
    this.collapsedBtn = iconButton(
      ICONS.mousePointerClick,
      () => this.setCollapsed(false),
      "Expand toolbar",
    );
    this.collapsedBtn.classList.add("pp-tool-expand");

    this.el.append(this.fullEl, this.collapsedBtn);
    this.applyCollapsed();
    // A fresh session has no annotations — Compile starts disabled until
    // setCount reports otherwise.
    this.syncCompileDisabled();
  }

  setState(s: ToolState): void {
    this.markupBtn.classList.toggle("pp-active", s.markupMode);
    this.showAllBtn.classList.toggle("pp-active", s.showAllMarkup);
    // Surface active markup on the collapsed pill too, so its state reads even
    // when the row is hidden.
    this.collapsedBtn.classList.toggle("pp-active", s.markupMode);
    // Active pills can change the row's width — re-sync the box when expanded.
    this.syncBox();
  }

  /**
   * Drive the compile button's loading state: swap the label to "Compiling",
   * reveal the spinner, and disable the button so no second save can be queued
   * while the database write is in flight.
   */
  setCompiling(compiling: boolean): void {
    this.compileBusy = compiling;
    this.compileBtn.classList.toggle("pp-loading", compiling);
    this.compileLabel.textContent = compiling ? "Compiling" : "Compile";
    this.syncCompileDisabled();
    // The label width changes — re-sync the box when expanded.
    this.syncBox();
  }

  setCount(n: number): void {
    this.countEl.textContent = String(n);
    // Nothing to clear, and nothing to compile, when there are no annotations.
    this.clearBtn.disabled = n === 0;
    this.compileEmpty = n === 0;
    this.syncCompileDisabled();
    // The count text can change the row's width — re-sync the box when expanded.
    this.syncBox();
  }

  /**
   * Viewing a past snapshot (Rewind) is read-only — Compile saves the live
   * session only, so disable it while a historical session is on screen.
   */
  setReadOnly(readOnly: boolean): void {
    this.compileReadOnly = readOnly;
    this.syncCompileDisabled();
  }

  /**
   * Compile is disabled while a save is in flight, when there's nothing to save,
   * or when a read-only past snapshot is being viewed.
   */
  private syncCompileDisabled(): void {
    this.compileBtn.disabled =
      this.compileBusy || this.compileEmpty || this.compileReadOnly;
    this.compileBtn.title = this.compileReadOnly
      ? "Switch to the current session to compile"
      : this.compileEmpty && !this.compileBusy
        ? "Add an annotation before compiling"
        : "";
  }

  private setCollapsed(collapsed: boolean): void {
    this.collapsed = collapsed;
    this.applyCollapsed();
  }

  private applyCollapsed(): void {
    this.el.classList.toggle("pp-collapsed", this.collapsed);
    this.syncBox();
  }

  /**
   * Drive the container's explicit width/height so the box animates between the
   * full row and the collapsed square (both views are absolutely positioned, so
   * the container has no intrinsic size). Measured on the next frame because the
   * element may not be laid out yet on first mount.
   */
  private syncBox(): void {
    requestAnimationFrame(() => {
      let w: number;
      let h: number;
      if (this.collapsed) {
        // Matches the .pp-tool-expand square in the stylesheet.
        w = 34;
        h = 34;
      } else {
        // Absolute children size to content; offset* gives the full row's box.
        w = this.fullEl.offsetWidth;
        h = this.fullEl.offsetHeight;
        if (w <= 0 || h <= 0) return; // not laid out yet — retry on next call
      }

      // Apply the very first size without a transition so the toolbar doesn't
      // animate "open" from a zero box on initial mount.
      if (!this.sized) {
        this.el.classList.add("pp-no-anim");
        this.el.style.width = `${w}px`;
        this.el.style.height = `${h}px`;
        // Force a reflow, then re-enable transitions on the next frame.
        void this.el.offsetWidth;
        requestAnimationFrame(() => this.el.classList.remove("pp-no-anim"));
        this.sized = true;
        return;
      }

      this.el.style.width = `${w}px`;
      this.el.style.height = `${h}px`;
    });
  }
}

function button(label: string, onClick: () => void, withDot: boolean): HTMLButtonElement {
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

/** An icon-only tool button. `paths` are SVG `d` strings for a 24×24 stroked icon. */
function iconButton(
  paths: readonly string[],
  onClick: () => void,
  label: string,
): HTMLButtonElement {
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

/** Build an inline 24×24 stroked SVG (lucide style) from path `d` strings. */
function svgIcon(paths: readonly string[]): SVGSVGElement {
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

function sep(): HTMLDivElement {
  const s = document.createElement("div");
  s.className = "pp-tool-sep";
  return s;
}
