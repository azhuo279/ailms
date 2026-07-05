/** The hover-highlight box + confirm label shown during markup mode. */
export class Highlight {
  readonly el: HTMLDivElement;
  private label: HTMLDivElement;
  /**
   * When pinned (an annotation is being written), the box stays on the pinned
   * element and hover-driven `show`/`hide` are ignored — so the highlight
   * persists until the note is saved or deleted.
   */
  private pinned = false;

  constructor() {
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
  show(
    rect: DOMRect,
    parts: { tag: string; source: string | null; component: string | null },
  ): void {
    if (this.pinned) return;
    this.place(rect);

    this.label.style.display = "";
    this.label.replaceChildren();
    this.label.appendChild(span("pp-tag", parts.tag));

    if (parts.source) {
      this.label.appendChild(text(" · "));
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
  hide(): void {
    if (this.pinned) return;
    this.el.classList.remove("pp-visible");
  }

  /**
   * Pin the box onto a specific element while its note is being written. The
   * label is dropped (it's a confirm aid for hovering, not needed once chosen).
   * Re-call each anchor pass with the live rect so it tracks scroll/resize.
   */
  pin(rect: DOMRect): void {
    this.pinned = true;
    this.label.style.display = "none";
    this.place(rect);
  }

  unpin(): void {
    this.pinned = false;
    this.el.classList.remove("pp-visible");
  }

  isPinned(): boolean {
    return this.pinned;
  }

  private place(rect: DOMRect): void {
    this.el.style.left = `${rect.left}px`;
    this.el.style.top = `${rect.top}px`;
    this.el.style.width = `${rect.width}px`;
    this.el.style.height = `${rect.height}px`;
    this.el.classList.add("pp-visible");
    // Flip the label below the box when there's no room above.
    this.label.classList.toggle("pp-below", rect.top < 24);
  }
}

function span(cls: string, t: string): HTMLSpanElement {
  const s = document.createElement("span");
  s.className = cls;
  s.textContent = t;
  return s;
}

function text(t: string): Text {
  return document.createTextNode(t);
}
