"use client";

import { useEffect } from "react";
import { Sun, Moon } from "lucide-react";
import { useThemeStore, type Theme } from "@/stores/useThemeStore";

/** `row` is the labelled version used inside menus. */
export function ThemeToggle({ variant = "icon" }: { variant?: "icon" | "row" }) {
  const { theme, setTheme, initFromStorage } = useThemeStore();

  useEffect(() => {
    initFromStorage();
  }, [initFromStorage]);

  const nextTheme: Theme = theme === "light" ? "dark" : "light";
  const label =
    theme === "light"
      ? "Cambiar a tema oscuro"
      : "Cambiar a tema claro";

  if (variant === "row") {
    return (
      <button
        type="button"
        onClick={() => setTheme(nextTheme)}
        className="flex min-h-11 w-full cursor-pointer items-center gap-2.5 rounded-lg px-3 text-sm font-medium hover:bg-border-soft focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        style={{ touchAction: "manipulation" }}
      >
        {theme === "light" ? (
          <Moon className="h-4 w-4" aria-hidden />
        ) : (
          <Sun className="h-4 w-4" aria-hidden />
        )}
        {theme === "light" ? "Modo oscuro" : "Modo claro"}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setTheme(nextTheme)}
      className="flex min-h-11 min-w-11 cursor-pointer items-center justify-center rounded-xl text-muted hover:bg-border-soft hover:text-foreground focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2"
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
