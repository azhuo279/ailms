"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

/**
 * Mock signed-in persona — swap for real auth/role data once it lands.
 * Gates persona-specific nav/surfaces (e.g. the Director-only Adoption
 * Tracker) without a real auth system. Defaults to the primary persona
 * (Zone Operations Manager); flip via `setPersona` for testing/demo.
 */
export type PersonaState = "zom" | "director";

interface UserPersonaState {
  persona: PersonaState;
  setPersona: (persona: PersonaState) => void;
}

export const useUserPersona = create<UserPersonaState>()(
  persist(
    (set) => ({
      persona: "zom",
      setPersona: (persona) => set({ persona }),
    }),
    { name: "ailms.persona", version: 1 },
  ),
);
