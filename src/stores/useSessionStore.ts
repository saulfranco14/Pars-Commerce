import { create } from "zustand";
import type { Profile } from "@/types/database";

interface SessionState {
  profile: Profile | null;
  authUserId: string | null;
  /** Logged in with a one-time password a business gave them; must pick their own. */
  mustChangePassword: boolean;
  setProfile: (profile: Profile | null) => void;
  setAuthUserId: (userId: string | null) => void;
  setMustChangePassword: (value: boolean) => void;
  clear: () => void;
}

export const useSessionStore = create<SessionState>((set) => ({
  profile: null,
  authUserId: null,
  mustChangePassword: false,
  setProfile: (profile) => set({ profile }),
  setAuthUserId: (authUserId) => set({ authUserId }),
  setMustChangePassword: (mustChangePassword) => set({ mustChangePassword }),
  clear: () => set({ profile: null, authUserId: null, mustChangePassword: false }),
}));
