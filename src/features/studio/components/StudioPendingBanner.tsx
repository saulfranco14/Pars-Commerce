"use client";
import { Loader2 } from "lucide-react";
import { useStudioPendingJobs } from "../hooks/useStudioPendingJobs";
import type { StudioPendingBannerProps } from "../interfaces/ui";

export function StudioPendingBanner({ onFinished }: StudioPendingBannerProps) {
  const { left, done, total } = useStudioPendingJobs(onFinished);
  if (!left) return null;
  return (
    <section
      aria-live="polite"
      className="space-y-2 rounded-2xl border border-accent/30 bg-accent/5 p-4"
    >
      <p className="flex items-center gap-2 text-sm font-bold">
        <Loader2 className="h-4 w-4 animate-spin text-accent" aria-hidden />
        Creando {total} {total === 1 ? "imagen" : "imágenes"}
      </p>
      <div className="h-1.5 overflow-hidden rounded-full bg-surface">
        <div
          className="h-full rounded-full bg-accent transition-all"
          style={{ width: `${total ? Math.round((done / total) * 100) : 0}%` }}
        />
      </div>
      <p className="text-xs text-muted-foreground">
        {done} {done === 1 ? "lista" : "listas"}. Mantén esta pantalla abierta
        para que terminen.
      </p>
    </section>
  );
}
