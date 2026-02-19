import { create } from "zustand";

const STORAGE_KEY = "theme";

export type Theme = "light" | "dark";

function getStoredTheme(): Theme {
  if (typeof window === "undefined") return "light";
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "dark" || stored === "light") return stored;
  } catch {
    /* incognito, quota, disabled */
  }
  return "light";
}

function applyTheme(theme: Theme) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  if (theme === "dark") {
    root.classList.add("dark");
  } else {
    root.classList.remove("dark");
  }
  try {
    localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    /* incognito, quota, disabled */
  }
}

interface ThemeState {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  initFromStorage: () => void;
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  theme: "light",
  setTheme: (theme) => {
    applyTheme(theme);
    set({ theme });
  },
  initFromStorage: () => {
    const theme = getStoredTheme();
    applyTheme(theme);
    set({ theme });
  },
}));
