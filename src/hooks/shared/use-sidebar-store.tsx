"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

/**
 * Sidebar collapse state (framework doc §7 persistence rule) — a UI
 * preference the user expects to survive a reload, kept in its own store
 * (rather than folded into usePreferencesStore) since it changes far more
 * frequently and has nothing to do with theme/density.
 */
interface SidebarState {
  isCollapsed: boolean;
  toggle: () => void;
}

export const useSidebarStore = create<SidebarState>()(
  persist(
    (set) => ({
      isCollapsed: false,
      toggle: () => set((state) => ({ isCollapsed: !state.isCollapsed })),
    }),
    { name: "ailms.sidebar", version: 1 },
  ),
);
