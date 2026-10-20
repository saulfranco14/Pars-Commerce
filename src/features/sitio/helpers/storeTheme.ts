import type { CSSProperties } from "react";

import {
  DEFAULT_STORE_THEME,
  STORE_THEMES,
} from "@/features/sitio/constants/storeThemes";

import type { StoreTheme } from "@/features/sitio/interfaces/storefront";

const HEX = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i;

function relativeLuminance(hex: string): number | null {
  const match = HEX.exec(hex.trim());
  if (!match) return null;
  const raw = match[1].length === 3
    ? match[1].split("").map((c) => c + c).join("")
    : match[1];
  const [r, g, b] = [0, 2, 4].map((i) => {
    const channel = parseInt(raw.slice(i, i + 2), 16) / 255;
    return channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

// WCAG large-text minimum: saturated brand colors keep white text, light ones switch to ink.
const WHITE_TEXT_MIN_CONTRAST = 3;

/** White on the tenant's accent unless it is too light to read; then near-black. */
export function readableForeground(accent: string): "#ffffff" | "#111111" {
  const luminance = relativeLuminance(accent);
  if (luminance === null) return "#ffffff";
  return 1.05 / (luminance + 0.05) >= WHITE_TEXT_MIN_CONTRAST ? "#ffffff" : "#111111";
}

export function resolveStoreTheme(layoutVariant: string | null | undefined): StoreTheme {
  return (layoutVariant && STORE_THEMES[layoutVariant]) || DEFAULT_STORE_THEME;
}

export function buildStoreThemeStyle(theme: StoreTheme, accent: string): CSSProperties {
  return {
    ["--store-canvas" as string]: theme.canvas,
    ["--store-surface" as string]: theme.surface,
    ["--store-well" as string]: theme.well,
    ["--store-ink" as string]: theme.ink,
    ["--store-ink-2" as string]: theme.ink2,
    ["--store-hairline" as string]: theme.hairline,
    ["--store-radius" as string]: theme.radius,
    ["--store-display" as string]: theme.display,
    ["--accent" as string]: accent,
    ["--accent-foreground" as string]: readableForeground(accent),
    colorScheme: theme.dark ? "dark" : "light",
  };
}
