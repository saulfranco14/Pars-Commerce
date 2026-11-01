"use client";

import { Eye, MessageCircle, MessageSquareReply, MousePointerClick } from "lucide-react";

import { formatVisitSeconds } from "@/features/growth/helpers/paraSession";
import { timeAgo } from "@/features/growth/helpers/nextActionReason";
import { visitDayLong } from "@/features/growth/helpers/paraVisit";
import { PARA_OBJECTION_LABEL, PARA_VISIT_SLOT_LABEL } from "@/features/growth/constants/para";

import type { LeadSummaryCardProps } from "@/features/growth/interfaces/lead";
import type { ParaObjection, ParaVisitSlot } from "@/features/growth/interfaces/para";

function Tile({ icon: Icon, label, value, detail, hot }: { icon: typeof Eye; label: string; value: string; detail: string | null; hot: boolean }) {
  return (
    <div className={`grid min-w-0 content-start gap-0.5 rounded-xl border px-3 py-2.5 ${hot ? "border-amber-300 bg-amber-50 dark:border-amber-500/40 dark:bg-amber-950/30" : "border-border bg-surface"}`}>
      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground"><Icon className="h-3.5 w-3.5 shrink-0" aria-hidden />{label}</span>
      <span className="text-sm font-bold text-foreground wrap-break-word">{value}</span>
      {detail ? <span className="line-clamp-2 text-xs text-muted-foreground wrap-break-word">{detail}</span> : null}
    </div>
  );
}

/** Four facts read from the history; the freshest sign of interest is highlighted. */
export function LeadSummaryCard({ summary }: LeadSummaryCardProps) {
  const now = new Date();
  const tapped = [
    summary.objection ? `«${PARA_OBJECTION_LABEL[summary.objection as ParaObjection] ?? summary.objection}»` : null,
    summary.visitRequest ? `Pidió visita${summary.visitRequest.day ? ` el ${visitDayLong(summary.visitRequest.day)}` : ""}${summary.visitRequest.slot ? ` ${PARA_VISIT_SLOT_LABEL[summary.visitRequest.slot as ParaVisitSlot] ?? ""}` : ""}` : null,
    summary.claimClicked ? "«Activar mi tienda»" : null,
  ].filter(Boolean);
  const hot = summary.repliedAt ? "reply" : tapped.length ? "tapped" : summary.views ? "views" : null;

  return (
    <section className="grid gap-2" aria-label="De un vistazo">
      <h3 className="text-base font-bold text-foreground">De un vistazo</h3>
      <div className="grid grid-cols-2 gap-2 2xl:grid-cols-4">
        <Tile
          icon={MessageCircle}
          label="Mensajes"
          value={summary.sent ? `${summary.sent} ${summary.sent === 1 ? "enviado" : "enviados"}` : "Ninguno todavía"}
          detail={summary.lastSentAt ? `El último ${timeAgo(summary.lastSentAt, now)}` : null}
          hot={false}
        />
        <Tile
          icon={Eye}
          label="Su tienda"
          value={summary.views ? `La abrió ${summary.views === 1 ? "1 vez" : `${summary.views} veces`}` : "No la ha abierto"}
          detail={summary.lastViewAt ? `${timeAgo(summary.lastViewAt, now)}${summary.averageSeconds ? ` · ${formatVisitSeconds(summary.averageSeconds)}` : ""}` : null}
          hot={hot === "views"}
        />
        <Tile icon={MousePointerClick} label="Qué tocó" value={tapped.length ? tapped.join(" · ") : "Nada todavía"} detail={null} hot={hot === "tapped"} />
        <Tile
          icon={MessageSquareReply}
          label="Respuesta"
          value={summary.repliedAt ? `Respondió ${timeAgo(summary.repliedAt, now)}` : "No ha respondido"}
          detail={summary.lastReply ? `«${summary.lastReply}»` : null}
          hot={hot === "reply"}
        />
      </div>
    </section>
  );
}
