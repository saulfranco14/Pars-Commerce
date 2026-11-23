"use client";
import Link from "next/link";
import { Sparkles } from "lucide-react";
import { adminActionButtonAi } from "@/components/admin/actionButtonClasses";
import type { StudioAiCardProps } from "../../interfaces/ui";

export function StudioAiCard({
  balance,
  enabled,
  hasImage,
  disabled,
  rechargeHref,
  onImprove,
}: StudioAiCardProps) {
  if (!enabled) return null;
  const hint = !hasImage
    ? "Sube una foto en Foto y logo para usar la IA."
    : !balance
      ? null
      : `Desde 1 Tlaco. Tienes ${balance}. Ves el costo antes de confirmar.`;
  return (
    <section className="space-y-3 rounded-2xl border border-accent/25 bg-linear-to-b from-accent/10 to-surface p-4">
      <h2 className="flex items-center gap-2 text-sm font-bold text-accent">
        <Sparkles className="h-4 w-4" aria-hidden />
        Que la IA lo mejore
      </h2>
      <p className="text-sm leading-6 text-muted-foreground">
        Ilumina tu foto, prueba otro estilo o crea una variante. Comparas antes
        y después; si no te gusta, te quedas con la original.
      </p>
      {hint ? (
        <p className="text-xs text-muted-foreground">{hint}</p>
      ) : (
        <p className="text-xs text-muted-foreground">
          No tienes Tlacos.{" "}
          <Link
            href={rechargeHref}
            className="font-semibold text-accent underline"
          >
            Recargar
          </Link>
        </p>
      )}
      <button
        type="button"
        className={`${adminActionButtonAi} w-full`}
        disabled={disabled || !hasImage || !balance}
        onClick={onImprove}
      >
        <Sparkles className="h-4 w-4" />
        Mejorar
      </button>
    </section>
  );
}
