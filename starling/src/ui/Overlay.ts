import { createOverlay, type Overlay as ShadowOverlay } from "./ShadowRoot";
import { Highlight } from "./Highlight";
import { Toolbar, type ToolbarCallbacks } from "./Toolbar";
import { Sidebar, type SidebarCallbacks } from "./Sidebar";
import { Toast } from "./Toast";

/**
 * Layer manager for everything inside the shadow root:
 *  - highlight layer (pointer-events:none)
 *  - markers layer (badges + stickies; widgets are pointer-events:auto)
 *  - fixed toolbar
 *  - sidebar
 *
 * Demo-hide flips the shadow host's display so the whole layer vanishes.
 */
export class Overlay {
  private shadow: ShadowOverlay;
  private layer: HTMLDivElement;
  private markersLayer: HTMLDivElement;
  readonly highlight: Highlight;
  readonly toolbar: Toolbar;
  readonly sidebar: Sidebar;
  readonly toast: Toast;

  constructor(toolbarCb: ToolbarCallbacks, sidebarCb: SidebarCallbacks) {
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
      this.sidebar.el,
    );
    this.shadow.root.appendChild(this.layer);
  }

  get markersRoot(): HTMLDivElement {
    return this.markersLayer;
  }

  /** Toggle the entire tool UI (demo mode). */
  setVisible(visible: boolean): void {
    this.shadow.host.style.display = visible ? "" : "none";
  }

  /** The active element within our shadow root, if any (for blur logic). */
  activeElement(): Element | null {
    return this.shadow.root.activeElement;
  }

  destroy(): void {
    this.toast.destroy();
    this.shadow.host.remove();
  }
}
