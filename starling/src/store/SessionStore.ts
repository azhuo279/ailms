import type { Annotation, Session } from "../types";
import { SAVE_DEBOUNCE_MS } from "../config";
import { debounce } from "../util/debounce";
import { id } from "../util/id";
import type { StorageBackend } from "./backends/StorageBackend";

/**
 * In-memory session, wrapping a `StorageBackend`. Debounces persistence and
 * emits change events the UI subscribes to.
 */
export class SessionStore {
  private session: Session;
  private listeners = new Set<() => void>();
  private save = debounce(() => this.backend.save(this.session), SAVE_DEBOUNCE_MS);

  constructor(private backend: StorageBackend) {
    this.session = backend.load() ?? {
      version: 1,
      sessionId: id(),
      annotations: [],
    };
  }

  all(): Annotation[] {
    return this.session.annotations;
  }

  byRoute(route: string): Annotation[] {
    return this.session.annotations.filter((a) => a.session.route === route);
  }

  get(annId: string): Annotation | undefined {
    return this.session.annotations.find((a) => a.id === annId);
  }

  /** Snapshot of the full session — used by the compiler. */
  snapshot(): Session {
    return this.session;
  }

  add(a: Annotation): void {
    this.session.annotations.push(a);
    this.commit();
  }

  update(annId: string, patch: Partial<Annotation>): void {
    const a = this.session.annotations.find((x) => x.id === annId);
    if (a) {
      Object.assign(a, patch, { updatedAt: new Date().toISOString() });
      this.commit();
    }
  }

  remove(annId: string): void {
    const before = this.session.annotations.length;
    this.session.annotations = this.session.annotations.filter(
      (x) => x.id !== annId,
    );
    if (this.session.annotations.length !== before) this.commit();
  }

  clear(): void {
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
  reset(): void {
    this.session = {
      version: 1,
      sessionId: id(),
      annotations: [],
    };
    this.commit();
  }

  /**
   * Drop annotations whose note is blank (empty or whitespace-only) so empty
   * stickies never reach the persisted session or the compiled artifact.
   * Returns true when something was removed.
   */
  pruneEmpty(): boolean {
    const before = this.session.annotations.length;
    this.session.annotations = this.session.annotations.filter(
      (a) => a.note.trim() !== "",
    );
    const changed = this.session.annotations.length !== before;
    if (changed) this.commit();
    return changed;
  }

  subscribe(fn: () => void): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  /** Force any pending debounced write to disk (call before unload). */
  flush(): void {
    this.save.flush();
  }

  private commit(): void {
    this.save();
    this.listeners.forEach((fn) => fn());
  }
}
