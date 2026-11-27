"use client";
import { Loader2 } from "lucide-react";
import type { StudioShareTileProps } from "../../interfaces/ui";

export function StudioShareTile({
  icon: Icon,
  title,
  detail,
  tone = "accent",
  disabled,
  waiting = false,
  onClick,
}: StudioShareTileProps) {
  return (
    <button
      type="button"
      disabled={disabled}
      aria-disabled={waiting || undefined}
      aria-busy={waiting || undefined}
      onClick={() => {
        if (!waiting) onClick();
      }}
      className={`flex min-h-28 flex-col items-start gap-2 rounded-2xl border border-border bg-surface p-4 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:cursor-not-allowed disabled:opacity-60 ${waiting ? "cursor-wait" : "cursor-pointer hover:border-accent/50 hover:bg-accent/5 active:scale-99"}`}
    >
      <span
        className={`flex h-10 w-10 items-center justify-center rounded-xl ${tone === "success" ? "bg-emerald-500/10 text-emerald-600" : "bg-accent/10 text-accent"}`}
      >
        {waiting ? (
          <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
        ) : (
          <Icon className="h-5 w-5" aria-hidden />
        )}
      </span>
      <span className="text-base font-bold">{title}</span>
      <span className="text-xs leading-snug text-muted-foreground">
        {waiting ? "Un momento…" : detail}
      </span>
    </button>
  );
}
