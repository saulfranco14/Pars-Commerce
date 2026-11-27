"use client";
import { useState } from "react";
import Link from "next/link";
import { Sparkles } from "lucide-react";
import type { StudioMoreCardProps } from "../../interfaces/ui";

/** «Otra imagen» at the end of the designs; the first tap shows the cost, the second spends it. */
export function StudioMoreCard({
  disabled,
  blocked,
  rechargeHref,
  onGenerate,
}: StudioMoreCardProps) {
  const [armed, setArmed] = useState(false);
  return (
    <div className="flex aspect-square w-full flex-col items-center justify-center gap-3 rounded-2xl bg-linear-to-br from-slate-800 to-slate-900 p-5 text-center text-white shadow-sm">
      {blocked ? (
        <>
          <p className="text-sm text-white/80">{blocked}</p>
          {blocked.includes("Tlacos") && (
            <Link
              href={rechargeHref}
              className="text-sm font-bold text-sky-300 underline"
            >
              Recargar
            </Link>
          )}
        </>
      ) : (
        <>
          <button
            type="button"
            disabled={disabled}
            onClick={() => {
              if (!armed) {
                setArmed(true);
                return;
              }
              setArmed(false);
              onGenerate();
            }}
            className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-full bg-linear-to-r from-indigo-400 to-cyan-500 px-5 text-sm font-bold text-white shadow-[0_0_18px_rgb(120_160_255/0.45)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white disabled:opacity-60"
          >
            <Sparkles className="h-4 w-4" aria-hidden />
            {armed ? "1 Tlaco · Generar" : "Otra imagen"}
          </button>
          <p className="text-xs leading-5 text-white/75" aria-live="polite">
            {armed
              ? "Toca otra vez para confirmar."
              : "Otra versión con la IA. 1 Tlaco; si no sale, no se cobra."}
          </p>
        </>
      )}
    </div>
  );
}
