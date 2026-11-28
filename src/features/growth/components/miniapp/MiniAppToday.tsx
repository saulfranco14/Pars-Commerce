"use client";

import { useState } from "react";
import { Images, MessageCircle, Shuffle } from "lucide-react";

import { useMiniAppToday } from "@/features/growth/hooks/useMiniAppToday";
import { EmptyState } from "@/components/admin/EmptyState";
import { actionPair, adminActionButtonPrimary, adminActionButtonSecondary, adminActionButtonText } from "@/components/admin/actionButtonClasses";
import { LoadingBlock } from "@/components/ui/LoadingBlock";
import { Notification } from "@/components/ui/Notification";
import { MiniAppAds } from "@/features/growth/components/miniapp/MiniAppAds";

import type { MiniAppClient } from "@/features/growth/services/miniAppClient";

const SELECT = "min-h-11 w-full rounded-xl border-2 border-border bg-background px-3 text-sm font-medium text-foreground focus:border-accent focus:outline-none";

/** «Hoy»: each card is one prospect with its four ads and its message; two taps send it. */
export function MiniAppToday({ client, native }: { client: MiniAppClient; native: Parameters<typeof useMiniAppToday>[1] }) {
  const today = useMiniAppToday(client, native);
  const [zone, setZone] = useState("");
  const [giro, setGiro] = useState("");

  if (today.isLoading) return <LoadingBlock message="Armando tus tarjetas…" variant="skeleton" />;
  if (today.error || !today.queue) return <Notification tone="error" message={today.error?.message ?? "No pudimos cargar tus tarjetas."} />;
  const { cards, zones, giros } = today.queue;

  return (
    <div className="grid grid-cols-1 gap-4">
      {today.notice ? <Notification tone={today.notice.tone} message={today.notice.message} onDismiss={today.clearNotice} /> : null}

      {cards.length ? (
        cards.map((card) => (
          <article key={card.leadId} className="grid min-w-0 grid-cols-1 gap-3 rounded-2xl border border-border bg-surface p-3">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <h2 className="truncate text-base font-bold text-foreground">{card.businessName}</h2>
                <p className="truncate text-xs text-muted-foreground">{card.giroLabel} · {card.place}</p>
              </div>
              <span className="shrink-0 rounded-full bg-accent/10 px-2 py-0.5 text-xs font-bold text-accent">Mensaje {card.variant}</span>
            </div>
            <MiniAppAds token={card.token} version={today.version(card.leadId)} />
            {card.nearby != null ? <p className="text-xs font-semibold text-muted-foreground">{card.nearby} de su giro a 500 m</p> : null}
            <p className="line-clamp-4 whitespace-pre-wrap wrap-anywhere rounded-xl bg-background p-3 text-sm text-foreground">{card.body}</p>
            <div className={actionPair}>
              <button type="button" onClick={() => native.openExternal(card.waLink)} className={adminActionButtonPrimary}>
                <MessageCircle className="h-4 w-4" aria-hidden />
                Abrir chat
              </button>
              <button type="button" disabled={Boolean(today.busy)} onClick={() => void today.shareImages(card.token)} className={adminActionButtonSecondary}>
                <Images className="h-4 w-4" aria-hidden />
                {today.busy === `share:${card.token}` ? "Preparando…" : "Imágenes"}
              </button>
            </div>
            <div className={actionPair}>
              <button type="button" disabled={Boolean(today.busy)} onClick={() => void today.nextBackground(card.leadId)} className={adminActionButtonSecondary}>
                <Shuffle className="h-4 w-4" aria-hidden />
                Otro
              </button>
              <button type="button" disabled={Boolean(today.busy)} onClick={() => void today.mark(card.leadId, "whatsapp_sent")} className={adminActionButtonPrimary}>Enviado</button>
            </div>
            <div className="flex flex-wrap justify-center gap-1">
              <button type="button" disabled={Boolean(today.busy)} onClick={() => void today.mark(card.leadId, "no_whatsapp")} className={adminActionButtonText}>Sin WhatsApp</button>
              <button type="button" disabled={Boolean(today.busy)} onClick={() => void today.mark(card.leadId, "not_interested")} className={adminActionButtonText}>No le interesa</button>
            </div>
          </article>
        ))
      ) : (
        <section className="grid gap-3 rounded-2xl border border-border bg-surface p-4">
          <EmptyState icon={MessageCircle} title="Sin tarjetas por ahora" description="Elige municipio y giro y te preparo 10 con sus anuncios." tone="muted" />
          <label className="grid gap-1 text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Municipio
            <select value={zone} onChange={(event) => setZone(event.target.value)} className={SELECT}>
              <option value="">Todos</option>
              {zones.map((option) => <option key={option.slug} value={option.slug}>{option.label}</option>)}
            </select>
          </label>
          <label className="grid gap-1 text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Giro
            <select value={giro} onChange={(event) => setGiro(event.target.value)} className={SELECT}>
              <option value="">Todos</option>
              {giros.map((option) => <option key={option.key} value={option.key}>{option.label}</option>)}
            </select>
          </label>
          <button type="button" disabled={today.busy === "reserve"} onClick={() => void today.reserve(zone || null, giro || null)} className={adminActionButtonPrimary}>
            {today.busy === "reserve" ? "Preparando…" : "Preparar 10"}
          </button>
        </section>
      )}
    </div>
  );
}
