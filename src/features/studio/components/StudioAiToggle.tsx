"use client";
import Link from "next/link";
import { Sparkles } from "lucide-react";
import type { StudioAiToggleProps } from "../interfaces/ui";

const DETAIL = {
  ready: "1 Tlaco por anuncio. Si no sale, no se cobra.",
  inactive: "La IA de imágenes todavía no está activa en tu cuenta.",
  empty: "Te quedaste sin Tlacos. Todo lo demás sigue gratis.",
} as const;

/** The cost is said before Crear is tapped; off, creating costs nothing. */
export function StudioAiToggle({
  on,
  onChange,
  reason,
  rechargeHref,
}: StudioAiToggleProps) {
  const ready = reason === "ready";
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-border bg-surface p-3">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent/10 text-accent">
        <Sparkles className="h-5 w-5" aria-hidden />
      </span>
      <div className="min-w-0 flex-1">
        <p id="studio-ai-label" className="text-sm font-bold">
          Imagen nueva con IA
        </p>
        <p className="text-xs leading-snug text-muted-foreground">
          {DETAIL[reason]}
          {reason === "empty" && (
            <>
              {" "}
              <Link
                href={rechargeHref}
                className="font-semibold text-accent underline"
              >
                Recargar
              </Link>
            </>
          )}
        </p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={ready && on}
        aria-labelledby="studio-ai-label"
        disabled={!ready}
        onClick={() => onChange(!on)}
        className={`relative h-8 w-13 shrink-0 cursor-pointer rounded-full transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:cursor-not-allowed disabled:opacity-50 ${ready && on ? "bg-accent" : "bg-border"}`}
      >
        <span
          className={`absolute top-1 left-1 h-6 w-6 rounded-full bg-white shadow-sm transition-transform motion-reduce:transition-none ${ready && on ? "translate-x-5" : ""}`}
        />
      </button>
    </div>
  );
}
