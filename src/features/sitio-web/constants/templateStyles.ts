export const VARIANT_STYLES: Record<
  string,
  {
    bg: string;
    headerBg: string;
    heroBg: string;
    cardBg: string;
    dark?: boolean;
  }
> = {
  classic: {
    bg: "#F9FAFB",
    headerBg: "#FFFFFF",
    heroBg: "accent",
    cardBg: "#FFFFFF",
  },
  minimal: {
    bg: "#FFFFFF",
    headerBg: "#FFFFFF",
    heroBg: "#F3F4F6",
    cardBg: "#FFFFFF",
  },
  bento: {
    bg: "#F3F4F6",
    headerBg: "#FFFFFF",
    heroBg: "accent",
    cardBg: "#FFFFFF",
  },
  dark: {
    bg: "#111827",
    headerBg: "#0D1117",
    heroBg: "#1F2937",
    cardBg: "#1F2937",
    dark: true,
  },
  elegant: {
    bg: "#FAFAF9",
    headerBg: "#FAFAF9",
    heroBg: "#F5F5F4",
    cardBg: "#FFFFFF",
  },
  bold: {
    bg: "#FFFFFF",
    headerBg: "accent",
    heroBg: "#F9FAFB",
    cardBg: "#FFFFFF",
  },
  organic: {
    bg: "#FFFBEB",
    headerBg: "#FFFBEB",
    heroBg: "#FEF3C7",
    cardBg: "#FFFFFF",
  },
  industrial: {
    bg: "#F1F5F9",
    headerBg: "#1E293B",
    heroBg: "#334155",
    cardBg: "#E2E8F0",
    dark: true,
  },
  vibrant: {
    bg: "#F3F4F6",
    headerBg: "accent",
    heroBg: "accent",
    cardBg: "#FFFFFF",
  },
  clean: {
    bg: "#FFFFFF",
    headerBg: "#FFFFFF",
    heroBg: "#FFFFFF",
    cardBg: "#F9FAFB",
  },
};

export const COLOR_PRESETS = [
  "#c20fbc",
  "#6366f1",
  "#0ea5e9",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#ec4899",
  "#14b8a6",
  "#8b5cf6",
  "#f97316",
];
