import type { StoreTheme } from "@/features/sitio/interfaces/storefront";

const SANS = "var(--font-store-sans), ui-sans-serif, -apple-system, \"Segoe UI\", sans-serif";
const SERIF = "ui-serif, \"New York\", Georgia, \"Times New Roman\", serif";

const LIGHT: StoreTheme = {
  canvas: "#f5f5f7",
  surface: "#ffffff",
  well: "#f5f5f7",
  ink: "#1d1d1f",
  ink2: "#6e6e73",
  hairline: "rgb(0 0 0 / 0.08)",
  radius: "1.25rem",
  display: SANS,
  dark: false,
};

const DARK: StoreTheme = {
  canvas: "#000000",
  surface: "#1c1c1e",
  well: "#2c2c2e",
  ink: "#f5f5f7",
  ink2: "#a1a1a6",
  hairline: "rgb(255 255 255 / 0.12)",
  radius: "1.25rem",
  display: SANS,
  dark: true,
};

// Keyed by `site_templates.layout_variant`; a new template is a new entry here.
export const STORE_THEMES: Record<string, StoreTheme> = {
  classic: LIGHT,
  minimal: { ...LIGHT, canvas: "#ffffff", well: "#f5f5f7", radius: "1rem" },
  clean: { ...LIGHT, canvas: "#ffffff", well: "#f2f4f7", radius: "0.875rem" },
  bento: { ...LIGHT, canvas: "#ececf0", radius: "1.75rem" },
  dark: DARK,
  elegant: {
    ...LIGHT,
    canvas: "#faf9f7",
    well: "#f1eee9",
    ink: "#292524",
    ink2: "#78716c",
    radius: "0.75rem",
    display: SERIF,
  },
  bold: { ...LIGHT, canvas: "#ffffff", radius: "1.5rem" },
  organic: {
    ...LIGHT,
    canvas: "#fbf8f1",
    well: "#f3eee2",
    ink: "#292524",
    ink2: "#78716c",
    radius: "1.75rem",
  },
  industrial: {
    ...DARK,
    canvas: "#111418",
    surface: "#1b2027",
    well: "#262c35",
    ink: "#e8ecf1",
    ink2: "#9aa4b2",
    radius: "0.5rem",
  },
  vibrant: { ...LIGHT, canvas: "#f4f4f8", radius: "1.5rem" },
};

export const DEFAULT_STORE_THEME = LIGHT;
