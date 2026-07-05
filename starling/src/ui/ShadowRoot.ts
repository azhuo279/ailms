import { HOST_ID } from "../config";
import { STYLES } from "./styles.css";

export interface Overlay {
  host: HTMLElement;
  root: ShadowRoot;
}

/**
 * Create the shadow-DOM overlay host. All tool UI lives inside the returned
 * shadow root so the tool's styles never leak into — or get broken by — the
 * host app (PRD §5 UI isolation).
 */
export function createOverlay(): Overlay {
  const host = document.createElement("div");
  host.id = HOST_ID;
  // Isolate from inherited page styles; fixed so it never affects layout.
  host.style.cssText =
    "all: initial; position: fixed; inset: 0; pointer-events: none; z-index: 2147483600;";
  host.setAttribute("data-starling", "host");

  const root = host.attachShadow({ mode: "open" });
  const style = document.createElement("style");
  style.textContent = STYLES;
  root.appendChild(style);

  document.body.appendChild(host);
  return { host, root };
}
