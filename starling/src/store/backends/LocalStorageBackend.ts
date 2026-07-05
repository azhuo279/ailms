import type { Session } from "../../types";
import { STORAGE_KEY } from "../../config";
import type { StorageBackend } from "./StorageBackend";

/** localStorage-backed session store. Namespaced key, fully guarded. */
export class LocalStorageBackend implements StorageBackend {
  constructor(private readonly key: string = STORAGE_KEY) {}

  load(): Session | null {
    try {
      const raw = localStorage.getItem(this.key);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as Session;
      // Light shape validation — tolerate forward/backward drift gracefully.
      if (!parsed || parsed.version !== 1 || !Array.isArray(parsed.annotations)) {
        return null;
      }
      return parsed;
    } catch {
      return null;
    }
  }

  save(session: Session): void {
    try {
      localStorage.setItem(this.key, JSON.stringify(session));
    } catch {
      /* quota / disabled storage — drop silently, never break the host app */
    }
  }

  clear(): void {
    try {
      localStorage.removeItem(this.key);
    } catch {
      /* ignore */
    }
  }
}
