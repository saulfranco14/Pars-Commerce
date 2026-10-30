"use client";

import { useState } from "react";
import { MessageSquarePlus } from "lucide-react";

import { FilterTabs } from "@/components/ui/FilterTabs";
import { adminActionButtonSecondary } from "@/components/admin/actionButtonClasses";

import { conversationItems } from "@/features/growth/helpers/conversation";
import { formatDayTime } from "@/features/growth/helpers/leadPipeline";
import { formatVisitSeconds, paraEventDetail } from "@/features/growth/helpers/paraSession";
import { giroCopy } from "@/features/growth/constants/giroCopy";
import { LEAD_EVENT_LABEL } from "@/features/growth/constants/leadStages";

import type { ConversationFilter, ConversationItem } from "@/features/growth/interfaces/conversation";
import type { LeadConversationProps, LeadEvent } from "@/features/growth/interfaces/lead";

const FILTERS: Array<{ value: ConversationFilter; label: string }> = [
  { value: "todo", label: "Todo" },
  { value: "mensajes", label: "Mensajes" },
  { value: "tienda", label: "Su tienda" },
  { value: "notas", label: "Notas y cambios" },
];

function who(event: LeadEvent, viewerId: string | null): string {
  if (event.actor === "prospect") return "El negocio";
  if (event.actor === "system") return "El motor";
  if (event.actor_user_id && event.actor_user_id === viewerId) return "Tú";
  return event.actor_name ?? "El equipo";
}

function detail(event: LeadEvent): string {
  const { payload } = event;
  const parts = [
    event.template_label,
    event.type === "giro_corrected" && typeof payload.giro === "string" ? `${giroCopy(String(payload.previous)).label} → ${giroCopy(payload.giro).label}` : null,
    typeof payload.at === "string" ? formatDayTime(payload.at) : null,
    event.type !== "objection_chosen" && typeof payload.reason === "string" ? payload.reason : null,
    typeof payload.seconds === "number" ? formatVisitSeconds(payload.seconds) : null,
  ].filter(Boolean);
  return `${parts.length ? ` · ${parts.join(" · ")}` : ""}${paraEventDetail(event.type, payload)}`;
}

function Row({ item, viewerId }: { item: ConversationItem; viewerId: string | null }) {
  const { event } = item;
  const meta = `${formatDayTime(event.created_at)} · ${who(event, viewerId)}`;
  if (item.kind === "out" || item.kind === "in") {
    const out = item.kind === "out";
    return (
      <li className={`grid max-w-[92%] gap-1 ${out ? "justify-self-end" : "justify-self-start"}`}>
        <span className={`text-xs text-muted-foreground ${out ? "text-right" : ""}`}>{meta}{event.template_label ? ` · ${event.template_label}` : ""}</span>
        <p className={`whitespace-pre-wrap rounded-2xl px-3 py-2 text-sm leading-relaxed text-foreground ${out ? "rounded-tr-sm bg-accent/10" : "rounded-tl-sm border border-border bg-surface-raised"}`}>
          {item.text ?? (out ? `${LEAD_EVENT_LABEL[event.type] ?? event.type} (el texto no se guardó)` : LEAD_EVENT_LABEL[event.type] ?? event.type)}
        </p>
      </li>
    );
  }
  return (
    <li className="grid gap-0.5 border-l-2 border-border-soft pl-3 text-sm">
      <span className="text-xs text-muted-foreground">{meta}</span>
      <span className="text-foreground">{LEAD_EVENT_LABEL[event.type] ?? event.type}{detail(event)}</span>
      {item.text ? <span className="rounded-lg bg-border-soft/50 px-2 py-1 text-muted-foreground">“{item.text}”</span> : null}
    </li>
  );
}

/** Both sides of the chat plus everything that happened around it, oldest first. */
export function LeadConversation({ events, viewerId, onLogReply }: LeadConversationProps) {
  const [filter, setFilter] = useState<ConversationFilter>("todo");
  const items = conversationItems(events, filter);

  return (
    <section className="grid gap-3 rounded-2xl border border-border bg-surface p-4 sm:p-5" aria-label="Conversación">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-base font-bold text-foreground">Conversación</h3>
        <button type="button" onClick={onLogReply} className={adminActionButtonSecondary}>
          <MessageSquarePlus className="h-4 w-4" aria-hidden />Registrar lo que contestó
        </button>
      </div>
      <FilterTabs tabs={FILTERS} activeValue={filter} onTabChange={(value) => setFilter(value as ConversationFilter)} ariaLabel="Qué ver" />
      {items.length ? (
        <ol className="grid gap-3">{items.map((item) => <Row key={item.event.id} item={item} viewerId={viewerId} />)}</ol>
      ) : (
        <p className="text-sm text-muted-foreground">{filter === "todo" ? "Todavía no hay actividad con este negocio." : "Nada en esta vista todavía."}</p>
      )}
    </section>
  );
}
