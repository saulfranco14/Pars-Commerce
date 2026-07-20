export type StatusTone =
  | "success"
  | "warning"
  | "danger"
  | "info"
  | "neutral";

interface StatusBadgeProps {
  tone: StatusTone;
  label: string;
  /** Show the leading colored dot. Default true. */
  dot?: boolean;
  /** Compact variant — same height, smaller padding. */
  compact?: boolean;
}

const TONE_CLASSES: Record<
  StatusTone,
  { container: string; dot: string }
> = {
  success: {
    container: "bg-emerald-100 text-emerald-800",
    dot: "bg-emerald-500",
  },
  warning: {
    container: "bg-amber-100 text-amber-800",
    dot: "bg-amber-500",
  },
  danger: {
    container: "bg-red-100 text-red-700",
    dot: "bg-red-500",
  },
  info: {
    container: "bg-accent/10 text-accent",
    dot: "bg-accent",
  },
  neutral: {
    container: "bg-border-soft text-muted-foreground",
    dot: "bg-muted-foreground",
  },
};

export function StatusBadge({
  tone,
  label,
  dot = true,
  compact,
}: StatusBadgeProps) {
  const t = TONE_CLASSES[tone];
  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1 rounded-full font-bold uppercase tracking-wider ${
        compact ? "px-1.5 py-0.5 text-[9px]" : "px-2 py-0.5 text-[10px]"
      } ${t.container}`}
    >
      {dot && (
        <span
          aria-hidden
          className={`h-1.5 w-1.5 shrink-0 rounded-full ${t.dot}`}
        />
      )}
      {label}
    </span>
  );
}
