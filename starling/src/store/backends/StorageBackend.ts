import type { Session } from "../../types";

/**
 * Storage seam. The MVP dev-package uses `LocalStorageBackend`; the future
 * browser extension (PRD §14) drops in a `chrome.storage` backend without
 * touching the engine.
 */
export interface StorageBackend {
  load(): Session | null;
  save(session: Session): void;
  clear(): void;
}
