"use client";

import { MessageCircle, Sparkles } from "lucide-react";

import { useMiniAppReplies } from "@/features/growth/hooks/useMiniAppReplies";
import { actionPair, adminActionButtonAi, adminActionButtonPrimary, adminActionButtonSecondary } from "@/components/admin/actionButtonClasses";
import { FormTextarea } from "@/components/ui/FormTextarea";
import { Notification } from "@/components/ui/Notification";
import { MiniAppAds } from "@/features/growth/components/miniapp/MiniAppAds";

import { REPLY_INTENT_LABEL } from "@/features/growth/constants/replyIntents";

import type { MiniAppClient } from "@/features/growth/services/miniAppClient";

const SELECT = "min-h-11 w-full rounded-xl border-2 border-border bg-background px-3 text-sm font-medium text-foreground focus:border-accent focus:outline-none";

/** «Respuestas»: whose reply it is, what they said, and the answer the AI leaves ready. Nothing is sent alone. */
export function MiniAppReplies({ client, openExternal }: { client: MiniAppClient; openExternal: (url: string) => void }) {
  const replies = useMiniAppReplies(client);
  const result = replies.result;

  if (result) {
    const rejected = result.intent === "rechazo";
    return (
      <section className="grid gap-3 rounded-2xl border border-border bg-surface p-3">
        <div className="flex items-center justify-between gap-2">
          <h2 className="truncate text-base font-bold text-foreground">{result.businessName}</h2>
          <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-bold ${rejected ? "bg-red-100 text-red-700" : "bg-emerald-100 text-emerald-800"}`}>{REPLY_INTENT_LABEL[result.intent]}</span>
        </div>
        <blockquote className="rounded-xl border-l-4 border-emerald-500 bg-background p-3 text-sm text-foreground">{replies.text}</blockquote>
        {rejected ? (
          <Notification tone="info" message="Quedó de baja en todos los canales. No hay nada más que mandar." />
        ) : (
          <>
            <FormTextarea label="La IA propone" value={replies.reply} onChange={(event) => replies.setReply(event.target.value)} rows={4} />
            {result.price ? (
              <div className="grid gap-1">
                <p className="text-xs font-semibold text-muted-foreground">Su anuncio ya tiene ${result.price}:</p>
                <MiniAppAds token={result.token} version={Number(result.price)} only="prod" />
              </div>
            ) : null}
          </>
        )}
        <div className={rejected ? "grid" : actionPair}>
          <button type="button" onClick={replies.reset} className={adminActionButtonSecondary}>Otra</button>
          {!rejected && replies.sendLink ? (
            <button type="button" onClick={() => openExternal(replies.sendLink as string)} className={adminActionButtonPrimary}>
              <MessageCircle className="h-4 w-4" aria-hidden />
              Enviar
            </button>
          ) : null}
        </div>
      </section>
    );
  }

  return (
    <section className="grid gap-3 rounded-2xl border border-border bg-surface p-3">
      <p className="text-sm text-muted-foreground">Copia lo que te contestó en WhatsApp, pégalo aquí y la IA te deja la respuesta. Si te dice que no, queda de baja.</p>
      <label className="grid gap-1 text-xs font-bold uppercase tracking-wider text-muted-foreground">
        Negocio
        <select value={replies.leadId} onChange={(event) => replies.setLeadId(event.target.value)} className={SELECT} disabled={replies.recentLoading}>
          <option value="">Elige a quién le escribiste</option>
          {replies.recent.map((lead) => <option key={lead.leadId} value={lead.leadId}>{lead.businessName} · {lead.giroLabel}</option>)}
        </select>
      </label>
      <FormTextarea label="Lo que contestó" value={replies.text} onChange={(event) => replies.setText(event.target.value)} rows={4} placeholder="A 20 joven, y el de olla a 25" />
      {replies.error ? <Notification tone="error" message={replies.error} /> : null}
      <button type="button" disabled={replies.busy || !replies.leadId || !replies.text.trim()} onClick={() => void replies.analyze()} className={`${adminActionButtonAi} ${replies.busy ? "ai-busy" : ""}`}>
        <Sparkles className={`h-4 w-4 ${replies.busy ? "motion-safe:animate-spin" : ""}`} aria-hidden />
        {replies.busy ? "Leyendo…" : "Leer con IA"}
      </button>
    </section>
  );
}
