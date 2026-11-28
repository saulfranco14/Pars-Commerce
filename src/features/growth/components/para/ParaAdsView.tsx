"use client";

import { useState } from "react";
import { Download, MapPin, MessageCircle, Share2, ShieldCheck } from "lucide-react";

import { useParaAds } from "@/features/growth/hooks/useParaAds";
import { useParaSession } from "@/features/growth/hooks/useParaSession";
import { TlacoLogo } from "@/components/brand/TlacoLogo";
import { actionPair, adminActionButtonPrimary, adminActionButtonSecondary } from "@/components/admin/actionButtonClasses";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { FormInput } from "@/components/ui/FormInput";
import { Notification } from "@/components/ui/Notification";
import { AdPosterFrame } from "@/features/growth/components/ads/AdPosterFrame";
import { ParaSignupSheet } from "@/features/growth/components/para/ParaSignupSheet";

import { AD_FIELDS, AD_KIND_LABEL } from "@/features/growth/constants/prospectAds";
import { STUDIO_GIFT_TLACOS } from "@/features/studio/constants/studio";
import { sendParaEvent } from "@/features/growth/services/paraClient";

import type { ParaAdsViewProps } from "@/features/growth/interfaces/paraAds";

/** «Sus anuncios están listos»: four gift ads the owner edits, downloads and shares without an account. */
export function ParaAdsView({ token, data }: ParaAdsViewProps) {
  useParaSession(token);
  const page = useParaAds(token, data);
  const [signupOpen, setSignupOpen] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState(false);
  const fields = AD_FIELDS[page.selected];

  if (page.removed) {
    return (
      <main className="mx-auto grid min-h-dvh max-w-md content-center gap-4 px-5 py-10 text-center">
        <TlacoLogo size="md" className="mx-auto" />
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Listo, quitamos sus datos</h1>
        <p className="text-base text-muted-foreground">No le volveremos a escribir. Gracias por avisarnos.</p>
      </main>
    );
  }

  function openSignup() {
    setSignupOpen(true);
  }

  return (
    <main className="min-h-dvh bg-background text-foreground">
      <header className="border-b border-border-soft bg-surface">
        <div className="mx-auto flex min-h-16 max-w-5xl items-center justify-between gap-3 px-4 sm:px-6">
          <TlacoLogo size="sm" />
          <span className="min-w-0 truncate rounded-full bg-accent/10 px-3 py-1 text-xs font-semibold text-accent">
            Hecho para {data.displayName ?? `su ${data.giroLabel.toLowerCase()}`}
          </span>
        </div>
      </header>

      <div className="mx-auto grid max-w-5xl gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[minmax(0,420px)_minmax(0,1fr)] lg:items-start lg:gap-10 lg:py-10">
        <section data-para-section="anuncios" className="grid gap-3">
          <h1 className="text-3xl font-bold tracking-tight text-balance sm:text-4xl lg:hidden">Sus 4 anuncios están listos</h1>
          <AdPosterFrame ad={page.selectedAd} mark className="rounded-3xl shadow-xl shadow-foreground/10" />
          <div className="grid grid-cols-4 gap-2" role="group" aria-label="Elegir anuncio">
            {page.ads.map((ad) => (
              <button
                key={ad.kind}
                type="button"
                aria-pressed={page.selected === ad.kind}
                aria-label={AD_KIND_LABEL[ad.kind]}
                data-para-item={AD_KIND_LABEL[ad.kind]}
                onClick={() => page.select(ad.kind)}
                className={`cursor-pointer overflow-hidden rounded-xl border-2 p-0 transition-colors ${page.selected === ad.kind ? "border-accent" : "border-transparent"}`}
              >
                <AdPosterFrame ad={ad} mark={false} />
              </button>
            ))}
          </div>
        </section>

        <div className="grid gap-5">
          <div className="hidden gap-2 lg:grid">
            <h1 className="text-4xl font-bold tracking-tight text-balance">Sus 4 anuncios están listos</h1>
            <p className="text-base text-muted-foreground">Para su Estado de WhatsApp. Cámbieles el texto y el precio: el anuncio cambia al momento.</p>
          </div>
          <p className="text-sm text-muted-foreground lg:hidden">Para su Estado de WhatsApp. Toque un anuncio y cámbiele el texto o el precio.</p>

          <div className={`grid gap-3 ${fields[1].numeric ? "grid-cols-[minmax(0,1fr)_7.5rem]" : "grid-cols-1"}`}>
            {fields.map((spec) => (
              <FormInput
                key={`${page.selected}-${spec.field}`}
                label={spec.label}
                value={page.values[spec.field]}
                maxLength={spec.maxLength}
                inputMode={spec.numeric ? "numeric" : "text"}
                onChange={(event) => page.setField(spec.field, event.target.value)}
              />
            ))}
          </div>

          <div className={actionPair}>
            <button type="button" disabled={Boolean(page.busy)} onClick={() => void page.share()} className={adminActionButtonSecondary}>
              <Share2 className="h-4 w-4" aria-hidden />
              {page.busy === "share" ? "Abriendo…" : "Compartir"}
            </button>
            <button type="button" disabled={Boolean(page.busy)} onClick={() => void page.download()} className={adminActionButtonPrimary}>
              <Download className="h-4 w-4" aria-hidden />
              {page.busy === "download" ? "Descargando…" : "Descargar"}
            </button>
          </div>

          {page.notice ? <Notification tone={page.notice.tone} message={page.notice.message} onDismiss={page.clearNotice} /> : null}

          {page.downloaded ? (
            <div className="grid gap-3 rounded-2xl border border-accent/25 bg-accent/5 p-4">
              <p className="text-base font-bold text-foreground">¿Hacemos uno con la foto de su producto?</p>
              <p className="text-sm text-muted-foreground">Guarde sus anuncios y le regalamos {STUDIO_GIFT_TLACOS} Tlacos para hacer más, sin la marca de muestra.</p>
              <button type="button" data-para-action="claim:final" onClick={openSignup} className={`${adminActionButtonPrimary} w-full sm:w-auto`}>Guardar</button>
            </div>
          ) : null}

          {data.zone ? (
            <section data-para-section="zona" className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-4 rounded-2xl border border-border bg-surface p-4">
              <span className="text-5xl font-bold tracking-tight text-accent tabular-nums">{data.zone.within500}</span>
              <div className="grid gap-2">
                <p className="text-sm text-foreground">
                  {data.zone.plural} a 500 m de usted. <span className="font-semibold">Vea su reporte de zona gratis</span> al guardar sus anuncios.
                </p>
                <button
                  type="button"
                  data-para-action="claim:intro"
                  onClick={() => {
                    sendParaEvent(token, "zone_opened");
                    openSignup();
                  }}
                  className={`${adminActionButtonSecondary} w-full sm:w-auto`}
                >
                  <MapPin className="h-4 w-4" aria-hidden />
                  Ver reporte
                </button>
              </div>
            </section>
          ) : null}

          <div className="grid gap-2 border-t border-border-soft pt-4 text-sm text-muted-foreground">
            <p className="flex items-start gap-2">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" aria-hidden />
              <span>
                No usamos fotos de su negocio.{" "}
                <button type="button" onClick={() => setConfirmRemove(true)} className="cursor-pointer font-semibold text-foreground underline underline-offset-2">
                  ¿No es suyo? Quitar mis datos
                </button>
              </span>
            </p>
            {data.helpUrl ? (
              <a href={data.helpUrl} target="_blank" rel="noopener noreferrer" data-para-action="help:final" className="inline-flex min-h-11 items-center gap-2 font-semibold text-foreground">
                <MessageCircle className="h-4 w-4" aria-hidden />
                {data.sender ? `¿Dudas? Escríbale a ${data.sender.firstName}` : "¿Dudas? Escríbanos"}
              </a>
            ) : null}
          </div>
        </div>
      </div>

      <ParaSignupSheet token={token} data={data} isOpen={signupOpen} onClose={() => setSignupOpen(false)} />
      <ConfirmDialog
        isOpen={confirmRemove}
        onClose={() => setConfirmRemove(false)}
        onConfirm={async () => {
          await page.removeData();
          setConfirmRemove(false);
        }}
        title="¿Quitamos sus datos?"
        description="Borramos esta página y lo que cambió, y no le volvemos a escribir por ningún medio."
        confirmLabel="Quitar"
        variant="danger"
        loading={page.busy === "remove"}
      />
    </main>
  );
}
