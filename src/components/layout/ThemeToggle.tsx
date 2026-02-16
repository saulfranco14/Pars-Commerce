"use client";

import { useEffect } from "react";
import { Sun, Moon } from "lucide-react";
import { useThemeStore, type Theme } from "@/stores/useThemeStore";

export function ThemeToggle() {
  const { theme, setTheme, initFromStorage } = useThemeStore();

  useEffect(() => {
    initFromStorage();
  }, [initFromStorage]);

  const nextTheme: Theme = theme === "light" ? "dark" : "light";
  const label =
    theme === "light"
      ? "Cambiar a tema oscuro"
      : "Cambiar a tema claro";

  return (
    <button
      type="button"
      onClick={() => setTheme(nextTheme)}
      className="flex min-h-[44px] min-w-[44px] cursor-pointer items-center justify-center rounded-xl text-muted hover:bg-border-soft hover:text-foreground focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2"
      style={{ touchAction: "manipulation" }}
      aria-label={label}
      title={label}
    >
      {theme === "light" ? (
        <Moon className="h-5 w-5" aria-hidden />
      ) : (
        <Sun className="h-5 w-5" aria-hidden />
      )}
    </button>
  );
}
