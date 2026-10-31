"use client";

import { Activity, Eye, MessageCircle, MessageSquareReply, MousePointerClick } from "lucide-react";

import { CollapsibleSection } from "@/components/admin/CollapsibleSection";

import { formatVisitSeconds } from "@/features/growth/helpers/paraSession";
import { timeAgo } from "@/features/growth/helpers/nextActionReason";
import { visitDayLong } from "@/features/growth/helpers/paraVisit";
import { PARA_OBJECTION_LABEL, PARA_VISIT_SLOT_LABEL } from "@/features/growth/constants/para";

import type { LeadSummaryCardProps } from "@/features/growth/interfaces/lead";
import type { ParaObjection, ParaVisitSlot } from "@/features/growth/interfaces/para";

function Fact({ icon: Icon, title, detail }: { icon: typeof Eye; title: string; detail: string | null }) {
  return (
    <div className="flex min-w-0 gap-2.5">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
      <div className="min-w-0">
        <p className="text-sm font-bold text-foreground">{title}</p>
        {detail ? <p className="text-xs text-muted-foreground">{detail}</p> : null}
      </div>
    </div>
  );
}

/** Messages, store visits, what they tapped and whether they answered, read from the history. */
export function LeadSummaryCard({ summary }: LeadSummaryCardProps) {
  const now = new Date();
  const tapped = [
    summary.objection ? `Marcó «${PARA_OBJECTION_LABEL[summary.objection as ParaObjection] ?? summary.objection}»` : null,
    summary.visitRequest ? `Pidió visita${summary.visitRequest.day ? ` el ${visitDayLong(summary.visitRequest.day)}` : ""}${summary.visitRequest.slot ? ` ${PARA_VISIT_SLOT_LABEL[summary.visitRequest.slot as ParaVisitSlot] ?? ""}` : ""}` : null,
    summary.claimClicked ? "Tocó «Activar mi tienda»" : null,
  ].filter(Boolean);

  return (
    <CollapsibleSection icon={Activity} title="Resumen" description="Lo que ha pasado con este negocio, de un vistazo.">
      <div className="grid gap-4 sm:grid-cols-2">
        <Fact
          icon={MessageCircle}
          title={summary.sent ? `${summary.sent} ${summary.sent === 1 ? "mensaje enviado" : "mensajes enviados"}` : "Todavía no le escribes"}
          detail={summary.lastSentAt ? `El último ${timeAgo(summary.lastSentAt, now)}` : null}
        />
        <Fact
          icon={Eye}
          title={summary.views ? `Abrió su tienda ${summary.views === 1 ? "1 vez" : `${summary.views} veces`}` : "No ha abierto su tienda"}
          detail={summary.lastViewAt ? `La última ${timeAgo(summary.lastViewAt, now)}${summary.averageSeconds ? ` · ${formatVisitSeconds(summary.averageSeconds)} en promedio` : ""}` : null}
        />
        <Fact icon={MousePointerClick} title={tapped.length ? tapped.join(" · ") : "No ha tocado nada en su tienda"} detail={null} />
        <Fact
          icon={MessageSquareReply}
          title={summary.repliedAt ? `Respondió ${timeAgo(summary.repliedAt, now)}` : "No ha respondido"}
          detail={summary.lastReply ? `«${summary.lastReply}»` : null}
        />
      </div>
    </CollapsibleSection>
  );
}
