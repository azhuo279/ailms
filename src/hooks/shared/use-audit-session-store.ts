"use client";

import { create } from "zustand";
import type { AuditEvent } from "@/app/audit-log/lib/audit-log-types";

/**
 * Session-local audit event store — the optimistic overlay that carries audit
 * events authored THIS session (e.g. a priority-tier change made from the
 * Exception Detail View) until a page refresh.
 *
 * Why a store, not React state: the writer (the /workspace detail view) and the
 * reader (the /audit-log page) live on different routes and never share a React
 * tree, so the event a dispatcher creates on /workspace has to survive the
 * client-side navigation to /audit-log. A tiny zustand store is the same
 * shared-client-state pattern the app already uses (useSidebarStore,
 * useUserPersona, usePreferencesStore).
 *
 * Deliberately NOT persisted: unlike the sidebar/persona/preferences stores,
 * these events are an optimistic mirror of what a real backend would record.
 * They mimic the workspace's `queueOverrides` optimistic pattern — live for the
 * session, gone on refresh (when a real fetch would return the server's own copy
 * of the event). The React Query fetch stays the base of truth; this is only an
 * overlay merged on top (see use-audit-log merge).
 *
 * Events are shaped to the audit-log domain (AuditEvent, validated by
 * auditEventSchema at the fetch boundary) so they flow through the exact same
 * clusterEvents / filterEvents pipeline as fetched events with no special-casing.
 */
interface AuditSessionState {
  /** Events authored this session, newest appended last (merge sorts by time). */
  events: AuditEvent[];
  /** Append one session event (called on a confirmed action, e.g. a tier change). */
  addEvent: (event: AuditEvent) => void;
  /** Clears the session overlay (unused in the mock; here for completeness). */
  reset: () => void;
}

export const useAuditSessionStore = create<AuditSessionState>()((set) => ({
  events: [],
  addEvent: (event) =>
    set((state) => ({ events: [...state.events, event] })),
  reset: () => set({ events: [] }),
}));
