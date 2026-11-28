"use client";

import Link from "next/link";
import { Camera, Download, MapPin, Share2, X } from "lucide-react";

import { useProspectWelcome } from "@/features/growth/hooks/useProspectWelcome";
import { actionPair, adminActionButtonIcon, adminActionButtonPrimary, adminActionButtonSecondary } from "@/components/admin/actionButtonClasses";
import { Notification } from "@/components/ui/Notification";

import { AD_KIND_LABEL } from "@/features/growth/constants/prospectAds";

/** Home card of a business that came from its gift ads: the four ads clean, its own photo next, and its zone. */
export function ProspectWelcomeCard() {
  const { tenant, welcome, imageUrl, close, download, share, busy, notice, clearNotice } = useProspectWelcome();
  if (!tenant || !welcome) return null;
  const base = `/dashboard/${encodeURIComponent(tenant.slug)}`;

  return (
    <section aria-labelledby="prospect-welcome-title" className="relative grid gap-4 rounded-3xl border border-border bg-surface p-4 sm:p-6">
      <button type="button" onClick={close} aria-label="Cerrar sus anuncios de regalo" className={`${adminActionButtonIcon} absolute right-3 top-3 border-transparent`}>
        <X className="h-4 w-4" aria-hidden />
      </button>
      <div className="grid gap-1 pr-12">
        <h2 id="prospect-welcome-title" className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
          {welcome.displayName ? `Listo, ${welcome.displayName}` : "Sus anuncios están listos"}
        </h2>
        <p className="text-sm text-muted-foreground">Sus 4 anuncios ya no llevan la marca de muestra. Súbalos a su Estado cuando quiera.</p>
      </div>

      <ul className="grid grid-cols-4 gap-2">
        {welcome.kinds.map((kind) => (
          <li key={kind} className="overflow-hidden rounded-xl border border-border-soft bg-border-soft/40">
            {/* eslint-disable-next-line @next/next/no-img-element -- server-drawn PNG behind auth, not an optimizable asset. */}
            <img src={imageUrl(kind)} alt={AD_KIND_LABEL[kind]} width={1080} height={1350} loading="lazy" className="aspect-4/5 h-auto w-full object-cover" />
          </li>
        ))}
      </ul>

      <div className={actionPair}>
        <button type="button" disabled={Boolean(busy)} onClick={() => void share()} className={adminActionButtonSecondary}>
          <Share2 className="h-4 w-4" aria-hidden />
          {busy === "share" ? "Abriendo…" : "Compartir"}
        </button>
        <button type="button" disabled={Boolean(busy)} onClick={() => void download()} className={adminActionButtonSecondary}>
          <Download className="h-4 w-4" aria-hidden />
          {busy === "download" ? "Descargando…" : "Descargar"}
        </button>
      </div>
      {notice ? <Notification tone={notice.tone} message={notice.message} onDismiss={clearNotice} /> : null}

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="grid content-between gap-3 rounded-2xl bg-accent/5 p-4">
          <div className="grid gap-1">
            <p className="text-base font-bold text-foreground">Haga el suyo con su foto</p>
            <p className="text-sm text-muted-foreground">Tómele foto a su producto y Studio le arma un anuncio de su negocio de verdad.</p>
          </div>
          <Link href={`${base}/studio`} className={`${adminActionButtonPrimary} w-full sm:w-auto`}>
            <Camera className="h-4 w-4" aria-hidden />
            Tomar foto
          </Link>
        </div>
        {welcome.zone ? (
          <div className="grid content-between gap-3 rounded-2xl border border-border p-4">
            <div className="grid gap-1">
              <p className="text-base font-bold text-foreground">
                <span className="tabular-nums">{welcome.zone.within500}</span> {welcome.zone.plural} a 500 m
              </p>
              <p className="text-sm text-muted-foreground">Su reporte de zona ya está listo, con dos ideas para que lo elijan a usted.</p>
            </div>
            <Link href={`${base}/zona`} className={`${adminActionButtonSecondary} w-full sm:w-auto`}>
              <MapPin className="h-4 w-4" aria-hidden />
              Ver reporte
            </Link>
          </div>
        ) : null}
      </div>
    </section>
  );
}
