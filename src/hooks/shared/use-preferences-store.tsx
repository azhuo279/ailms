"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

/**
 * Cross-route UI preferences (framework doc §7). Only persist state the user
 * expects to survive a reload — preferences, filter selections, UI density.
 * Do NOT persist transient navigation stacks, hover/focus, or fetched data.
 *
 * Persisted schema (bump `version` + add `migrate` when this changes):
 *   { theme: "light" | "dark" | "system", density: "comfortable" | "compact" }
 */
type Theme = "light" | "dark" | "system";
type Density = "comfortable" | "compact";

interface PreferencesState {
  theme: Theme;
  density: Density;
  setTheme: (theme: Theme) => void;
  setDensity: (density: Density) => void;
}

export const usePreferencesStore = create<PreferencesState>()(
  persist(
    (set) => ({
      theme: "system",
      density: "comfortable",
      setTheme: (theme) => set({ theme }),
      setDensity: (density) => set({ density }),
    }),
    { name: "ailms.preferences", version: 1 },
  ),
);
