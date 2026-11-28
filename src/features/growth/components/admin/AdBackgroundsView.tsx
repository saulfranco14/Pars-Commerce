"use client";

import { useState } from "react";
import { Check, ImageIcon, Sparkles, Trash2 } from "lucide-react";

import { useAdBackgrounds } from "@/features/growth/hooks/useAdBackgrounds";
import { EmptyState } from "@/components/admin/EmptyState";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { actionPair, adminActionButtonAi, adminActionButtonConfirm, adminActionButtonSecondary } from "@/components/admin/actionButtonClasses";
import { FilterTabs } from "@/components/ui/FilterTabs";
import { LoadingBlock } from "@/components/ui/LoadingBlock";
import { Notification } from "@/components/ui/Notification";
import { AdPosterFrame } from "@/features/growth/components/ads/AdPosterFrame";

import { AD_BACKGROUND_BATCH } from "@/features/growth/constants/prospectAds";
import { GIRO_COPY, GIRO_KEYS } from "@/features/growth/constants/giroCopy";
import { buildLeadAds } from "@/features/growth/helpers/prospectAds";

import type { AdBackground, AdBackgroundKind } from "@/features/growth/interfaces/prospectAds";

const GIRO_TABS = GIRO_KEYS.map((key) => ({ value: key, label: GIRO_COPY[key].label }));
const SECTIONS: Array<{ kind: AdBackgroundKind; title: string; description: string }> = [
  { kind: "giro", title: "Escena del giro", description: "Va en el anuncio 1: el tipo de negocio, sin personas ni letreros." },
  { kind: "producto", title: "Producto", description: "Va en el anuncio 4: el producto estrella del giro, sin marcas." },
];

function previewAd(giro: string, background: AdBackground) {
  const ads = buildLeadAds({
    businessName: "Su negocio",
    giro,
    colonia: "Benito Juárez",
    municipio: "Nezahualcóyotl",
    edits: {},
    backgrounds: { [background.kind]: background.url },
  });
  return background.kind === "giro" ? ads[0] : ads[3];
}

function BackgroundCard({ giro, background, busy, onReview }: { giro: string; background: AdBackground; busy: boolean; onReview: (status: "approved" | "rejected") => void }) {
  const approved = background.status === "approved";
  return (
    <li className="grid content-start gap-3 rounded-2xl border border-border bg-surface p-3">
      <AdPosterFrame ad={previewAd(giro, background)} mark={false} className="rounded-xl" />
      <StatusBadge tone={approved ? "success" : "warning"} label={approved ? "En uso" : "Por revisar"} compact />
      {approved ? (
        <button type="button" disabled={busy} onClick={() => onReview("rejected")} className={adminActionButtonSecondary}>
          <Trash2 className="h-4 w-4" aria-hidden />
          Quitar
        </button>
      ) : (
        <div className={actionPair}>
          <button type="button" disabled={busy} onClick={() => onReview("rejected")} className={adminActionButtonSecondary}>Descartar</button>
          <button type="button" disabled={busy} onClick={() => onReview("approved")} className={adminActionButtonConfirm}>
            <Check className="h-4 w-4" aria-hidden />
            Aprobar
          </button>
        </div>
      )}
    </li>
  );
}

/** Motor → Fondos: the AI backgrounds of the gift ads. Nothing reaches a prospect until it is approved. */
export function AdBackgroundsView() {
  const [giro, setGiro] = useState(GIRO_KEYS[0]);
  const library = useAdBackgrounds(giro);

  return (
    <div className="grid grid-cols-1 gap-5">
      <FilterTabs tabs={GIRO_TABS} activeValue={giro} onTabChange={setGiro} ariaLabel="Giro" />
      {library.notice ? <Notification tone={library.notice.tone} message={library.notice.message} onDismiss={library.clearNotice} /> : null}

      {SECTIONS.map((section) => {
        const rows = library.byKind(section.kind);
        const generating = library.generating === section.kind;
        return (
          <section key={section.kind} className="grid gap-4 rounded-2xl border border-border bg-surface p-4 sm:p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="grid gap-1">
                <h2 className="text-base font-bold text-foreground">{section.title}</h2>
                <p className="text-sm text-muted-foreground">
                  {section.description} En uso: {library.approvedCount(section.kind)}.
                </p>
              </div>
              <button type="button" disabled={Boolean(library.generating)} onClick={() => void library.generate(section.kind)} className={`${adminActionButtonAi} w-full sm:w-auto ${generating ? "ai-busy" : ""}`}>
                <Sparkles className="h-4 w-4" aria-hidden />
                {generating ? "Generando…" : `Generar ${AD_BACKGROUND_BATCH}`}
              </button>
            </div>
            {library.isLoading ? (
              <LoadingBlock message="Cargando imágenes…" variant="skeleton" />
            ) : rows.length ? (
              <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {rows.map((background) => (
                  <BackgroundCard key={background.id} giro={giro} background={background} busy={library.reviewing === background.id} onReview={(status) => void library.review(background.id, status)} />
                ))}
              </ul>
            ) : (
              <EmptyState icon={ImageIcon} title="Sin imágenes todavía" description="Mientras no apruebes ninguna, el anuncio sale con el diseño de color e ícono." tone="muted" />
            )}
          </section>
        );
      })}
    </div>
  );
}
