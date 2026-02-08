import { create } from "zustand";
import type { Profile } from "@/types/database";

interface SessionState {
  profile: Profile | null;
  setProfile: (profile: Profile | null) => void;
  clear: () => void;
}

export const useSessionStore = create<SessionState>((set) => ({
  profile: null,
  setProfile: (profile) => set({ profile }),
  clear: () => set({ profile: null }),
}));
