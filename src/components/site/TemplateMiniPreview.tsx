"use client";

const VARIANT_STYLES: Record<
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

interface TemplateMiniPreviewProps {
  variant: string;
  themeColor: string;
  compact?: boolean;
}

export function TemplateMiniPreview({
  variant,
  themeColor,
  compact = false,
}: TemplateMiniPreviewProps) {
  const s = VARIANT_STYLES[variant] ?? VARIANT_STYLES.classic;
  const resolve = (val: string) => (val === "accent" ? themeColor : val);
  const isDark = s.dark ?? false;
  const textAlpha = isDark ? "rgba(255,255,255,0.7)" : "rgba(0,0,0,0.25)";
  const aspectRatio = compact ? "4/3" : "16/10";

  return (
    <div
      className="w-full overflow-hidden rounded-t-md"
      style={{ background: s.bg, aspectRatio }}
    >
      <div
        className="flex items-center gap-1 px-1.5 py-1"
        style={{
          background: resolve(s.headerBg),
          borderBottom: "1px solid rgba(0,0,0,0.06)",
        }}
      >
        <div
          className="h-1.5 w-1.5 rounded-full shrink-0"
          style={{ background: themeColor }}
        />
        <div
          className="h-0.5 w-8 rounded-full"
          style={{
            background: isDark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.2)",
          }}
        />
      </div>
      <div
        className="flex flex-col gap-0.5 px-1.5 py-1.5"
        style={{ background: resolve(s.heroBg) }}
      >
        <div
          className="h-1 w-14 rounded-full"
          style={{
            background:
              isDark || s.heroBg === "accent"
                ? "rgba(255,255,255,0.85)"
                : textAlpha,
          }}
        />
        <div
          className="h-2 w-10 rounded"
          style={{
            background:
              s.heroBg === "accent" || isDark
                ? "rgba(255,255,255,0.9)"
                : themeColor,
            opacity: 0.95,
          }}
        />
      </div>
      <div className="grid grid-cols-3 gap-0.5 p-1">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="overflow-hidden rounded-sm"
            style={{
              background: s.cardBg,
              boxShadow: "0 1px 1px rgba(0,0,0,0.04)",
            }}
          >
            <div
              className="h-3 w-full"
              style={{ background: `${themeColor}22` }}
            />
            <div className="p-0.5">
              <div
                className="h-0.5 w-5 rounded-full"
                style={{ background: textAlpha }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
