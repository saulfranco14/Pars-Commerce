"use client";
import { Sparkles } from "lucide-react";

export function StudioGeneratingOverlay() {
  return (
    <div
      role="status"
      aria-live="polite"
      className="absolute inset-0 overflow-hidden rounded-2xl"
    >
      <div className="absolute inset-0 bg-slate-950/35 backdrop-blur-md" />
      <div className="studio-generating absolute inset-0 opacity-70 mix-blend-screen" />
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-5 text-center text-white">
        <span className="studio-pulse flex h-14 w-14 items-center justify-center rounded-full bg-white/15 ring-1 ring-white/40">
          <Sparkles className="h-7 w-7" aria-hidden />
        </span>
        <p className="text-base font-bold drop-shadow">
          Estamos generando tu imagen…
        </p>
        <p className="text-xs text-white/85">
          El tiempo de generación puede variar.
        </p>
      </div>
    </div>
  );
}
