import { describe, it, expect, beforeEach } from "vitest";
import { SessionStore } from "../../src/store/SessionStore";
import type { StorageBackend } from "../../src/store/backends/StorageBackend";
import type { Annotation, Session } from "../../src/types";

class MemoryBackend implements StorageBackend {
  saved: Session | null = null;
  constructor(private initial: Session | null = null) {}
  load() {
    return this.initial;
  }
  save(s: Session) {
    this.saved = JSON.parse(JSON.stringify(s));
  }
  clear() {
    this.saved = null;
  }
}

function ann(id: string, note = "note"): Annotation {
  return {
    id,
    note,
    source: null,
    fallbackLocators: [],
    context: {
      outerHTMLTrimmed: "",
      textContent: "",
      role: null,
      tagName: "div",
      componentName: null,
      rect: { x: 0, y: 0, width: 0, height: 0 },
    },
    session: {
      route: "/",
      url: "http://x/",
      viewport: { width: 0, height: 0 },
      capturedAt: "2026-06-10T00:00:00.000Z",
    },
    createdAt: "2026-06-10T00:00:00.000Z",
    updatedAt: "2026-06-10T00:00:00.000Z",
  };
}

describe("SessionStore.reset", () => {
  let backend: MemoryBackend;
  let store: SessionStore;

  beforeEach(() => {
    backend = new MemoryBackend();
    store = new SessionStore(backend);
    store.add(ann("a"));
    store.add(ann("b"));
  });

  it("drops all annotations and rotates the sessionId", () => {
    const before = store.snapshot().sessionId;
    store.reset();
    const after = store.snapshot();
    expect(after.annotations).toEqual([]);
    expect(after.sessionId).not.toBe(before);
  });

  it("clears stale author/savedAt from the live session", () => {
    // Simulate a session that somehow carried saved-snapshot metadata.
    Object.assign(store.snapshot(), { author: "Ada", savedAt: "x" });
    store.reset();
    const after = store.snapshot();
    expect(after.author).toBeUndefined();
    expect(after.savedAt).toBeUndefined();
  });

  it("notifies subscribers and persists the fresh session", () => {
    let fired = 0;
    store.subscribe(() => fired++);
    store.reset();
    store.flush();
    expect(fired).toBe(1);
    expect(backend.saved?.annotations).toEqual([]);
  });
});
