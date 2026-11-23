"use client";
import type { StudioShareTileProps } from "../../interfaces/ui";

export function StudioShareTile({
  icon: Icon,
  title,
  detail,
  tone = "accent",
  disabled,
  onClick,
}: StudioShareTileProps) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="flex min-h-28 cursor-pointer flex-col items-start gap-2 rounded-2xl border border-border bg-surface p-4 text-left transition-colors hover:border-accent/50 hover:bg-accent/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent active:scale-99 disabled:cursor-not-allowed disabled:opacity-60"
    >
      <span
        className={`flex h-10 w-10 items-center justify-center rounded-xl ${tone === "success" ? "bg-emerald-500/10 text-emerald-600" : "bg-accent/10 text-accent"}`}
      >
        <Icon className="h-5 w-5" aria-hidden />
      </span>
      <span className="text-base font-bold">{title}</span>
      <span className="text-xs leading-snug text-muted-foreground">
        {detail}
      </span>
    </button>
  );
}
