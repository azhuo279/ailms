/**
 * The editable sticky note body. One per annotation. Auto-saves on input
 * (debounced by the store), Enter saves+collapses (Shift+Enter = newline),
 * × deletes.
 */
export interface StickyCallbacks {
  onInput(note: string): void;
  onSave(): void;
  onDelete(): void;
  /** Defocus → collapse (clicked elsewhere). */
  onBlur(): void;
  /** Re-summon the overlay this (detached) annotation lives in. */
  onReopen(): void;
}

export class Sticky {
  readonly el: HTMLDivElement;
  private textarea: HTMLTextAreaElement;
  private whereEl: HTMLDivElement;
  private detachedFlag: HTMLSpanElement;
  private reopenBtn: HTMLButtonElement;
  private closeBtn: HTMLButtonElement;

  constructor(private cb: StickyCallbacks) {
    this.el = document.createElement("div");
    this.el.className = "pp-sticky";

    const head = document.createElement("div");
    head.className = "pp-sticky-head";

    this.detachedFlag = document.createElement("span");
    this.detachedFlag.className = "pp-sticky-detached-flag";
    this.detachedFlag.textContent = "⚠ detached";
    this.detachedFlag.style.display = "none";

    this.whereEl = document.createElement("div");
    this.whereEl.className = "pp-sticky-where";

    // Shown only while detached and a trigger is known (setTrigger). Clicking it
    // re-summons the overlay so the marker can re-anchor.
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
    this.closeBtn.textContent = "×";
    this.closeBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      this.cb.onDelete();
    });

    head.append(this.detachedFlag, this.whereEl, this.reopenBtn, this.closeBtn);

    this.textarea = document.createElement("textarea");
    this.textarea.placeholder = "Add a note…";
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

  setNote(note: string): void {
    if (this.textarea.value !== note) this.textarea.value = note;
    this.autoGrow();
  }

  /**
   * Grow the textarea to fit its content so the sticky pushes downward as text
   * wraps. CSS `min-height` still acts as the floor; `box-sizing: border-box`
   * means scrollHeight already includes padding, so the height is self-consistent.
   */
  private autoGrow(): void {
    this.textarea.style.height = "auto";
    this.textarea.style.height = `${this.textarea.scrollHeight}px`;
  }

  /**
   * Re-measure after the sticky becomes visible. scrollHeight reads 0 while the
   * sticky is display:none, so callers that set the note while hidden must call
   * this once the sticky is shown.
   */
  refreshHeight(): void {
    this.autoGrow();
  }

  setWhere(where: string): void {
    this.whereEl.textContent = where;
    this.whereEl.title = where;
  }

  setDetached(detached: boolean): void {
    this.el.classList.toggle("pp-detached", detached);
    this.detachedFlag.style.display = detached ? "" : "none";
  }

  /**
   * Show/hide the reopen affordance. `label` is the trigger's accessible name
   * (e.g. the avatar button); null hides the button. Only meaningful while
   * detached — the caller passes null otherwise.
   */
  setTrigger(label: string | null): void {
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
  setReadOnly(ro: boolean): void {
    this.textarea.readOnly = ro;
    this.closeBtn.style.display = ro ? "none" : "";
    this.el.classList.toggle("pp-readonly", ro);
  }

  focus(): void {
    this.textarea.focus();
    const len = this.textarea.value.length;
    this.textarea.setSelectionRange(len, len);
  }

  /** True if the editing focus is inside this sticky. */
  containsFocus(active: Element | null): boolean {
    return active === this.textarea || this.el.contains(active);
  }
}
