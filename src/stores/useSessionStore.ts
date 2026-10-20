import { create } from "zustand";
import type { Profile } from "@/types/database";

interface SessionState {
  profile: Profile | null;
  authUserId: string | null;
  setProfile: (profile: Profile | null) => void;
  setAuthUserId: (userId: string | null) => void;
  clear: () => void;
}

export const useSessionStore = create<SessionState>((set) => ({
  profile: null,
  authUserId: null,
  setProfile: (profile) => set({ profile }),
  setAuthUserId: (authUserId) => set({ authUserId }),
  clear: () => set({ profile: null, authUserId: null }),
}));
