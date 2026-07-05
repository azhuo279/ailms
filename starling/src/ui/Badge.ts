/**
 * The collapsed count badge anchored to an element's top-right corner. Hover
 * reveals its sticky transiently; click pins it open (PRD §7).
 */
export interface BadgeCallbacks {
  onEnter(): void;
  onLeave(): void;
  onClick(): void;
}

export class Badge {
  readonly el: HTMLDivElement;

  constructor(cb: BadgeCallbacks) {
    this.el = document.createElement("div");
    this.el.className = "pp-badge";
    this.el.addEventListener("mouseenter", () => cb.onEnter());
    this.el.addEventListener("mouseleave", () => cb.onLeave());
    this.el.addEventListener("click", (e) => {
      e.stopPropagation();
      cb.onClick();
    });
  }

  setCount(n: number): void {
    this.el.textContent = String(n);
  }

  setDetached(detached: boolean): void {
    this.el.classList.toggle("pp-detached", detached);
    this.el.title = detached
      ? "Annotation target not found on this view"
      : "";
  }
}
