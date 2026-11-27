"use client";
import { useEffect } from "react";
import { createPortal } from "react-dom";
import { RotateCw, SkipForward, TriangleAlert } from "lucide-react";
import {
  actionStack,
  adminActionButtonPrimary,
} from "@/components/admin/actionButtonClasses";
import { STUDIO_AD_AI_TEXT } from "../../constants/studio";
import type { StudioGeneratingScreenProps } from "../../interfaces/ui";

/**
 * The whole screen while the AI makes the image: the designs to browse in the
 * meantime, a way out after a long wait, and a plain message if it fails.
 */
export function StudioGeneratingScreen({
  ad,
  title,
  carousel,
  goOnLabel,
}: StudioGeneratingScreenProps) {
  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, []);
  const kind = ad.running?.kind ?? ad.failed ?? "photo";
  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={STUDIO_AD_AI_TEXT[kind]}
      className="fixed inset-0 z-70 flex flex-col gap-4 overflow-y-auto bg-[radial-gradient(120%_70%_at_50%_30%,#1d2a48_0%,#0b1020_70%)] pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1rem,env(safe-area-inset-bottom))] text-white"
    >
      <p className="truncate px-5 text-sm font-bold text-white/80">{title}</p>
      {ad.failed ? (
        <div className="mx-auto flex w-full max-w-sm flex-1 flex-col items-center justify-center gap-3 px-5 text-center">
          <TriangleAlert className="h-8 w-8 text-amber-300" aria-hidden />
          <p className="text-xl font-bold">No salió la imagen</p>
          <p className="text-sm text-white/75">
            {ad.failText} Tu anuncio sigue listo.
          </p>
          <div className={`${actionStack} w-full`}>
            <button
              type="button"
              className={`${adminActionButtonPrimary} w-full sm:w-auto`}
              onClick={ad.goOn}
            >
              <SkipForward className="h-4 w-4" />
              {goOnLabel}
            </button>
            <button
              type="button"
              className="inline-flex min-h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-lg border border-white/25 px-4 text-sm font-bold text-white transition-colors hover:bg-white/10 sm:w-auto"
              disabled={!ad.affordable}
              onClick={ad.retry}
            >
              <RotateCw className="h-4 w-4" />
              Reintentar
            </button>
          </div>
          <p className="text-xs text-white/60">Reintentar cuesta 1 Tlaco.</p>
        </div>
      ) : (
        <>
          <div className="flex flex-1 flex-col justify-center gap-4">
            <p
              className="studio-ai-text px-5 text-center text-xl font-bold"
              role="status"
            >
              {STUDIO_AD_AI_TEXT[kind]}…
            </p>
            {carousel}
            <p className="px-6 text-center text-sm text-white/65">
              Mientras tanto, desliza y elige tu diseño.
            </p>
          </div>
          <div className="flex flex-col gap-2 px-5">
            {ad.slow && (
              <>
                <p className="text-center text-sm text-white/75">
                  Está tardando más de lo normal.
                </p>
                <button
                  type="button"
                  className="inline-flex min-h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-lg border border-white/25 bg-white/10 px-4 text-sm font-bold text-white transition-colors hover:bg-white/15 sm:mx-auto sm:w-auto"
                  onClick={ad.goOn}
                >
                  <SkipForward className="h-4 w-4" />
                  {goOnLabel}
                </button>
              </>
            )}
          </div>
        </>
      )}
    </div>,
    document.body,
  );
}
