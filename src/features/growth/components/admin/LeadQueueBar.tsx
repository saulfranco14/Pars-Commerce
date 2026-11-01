"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

import { adminActionButtonIcon, adminActionButtonPrimary, adminActionButtonSecondary, adminActionButtonText } from "@/components/admin/actionButtonClasses";

import { leadPath } from "@/features/growth/constants/routes";
import { endQueue, readQueue } from "@/features/growth/services/leadQueue";
import { backToLeads } from "@/features/growth/services/leadsReturn";

import type { LeadQueue, LeadQueueBarProps } from "@/features/growth/interfaces/leadQueue";

/** «Modo fila»: where this prospect sits in the list being worked and a one-tap «Siguiente». */
export function LeadQueueBar({ leadId, done }: LeadQueueBarProps) {
  const router = useRouter();
  const [queue, setQueue] = useState<LeadQueue | null>(null);

  useEffect(() => {
    setQueue(readQueue());
  }, [leadId]);

  const index = queue ? queue.items.findIndex((item) => item.id === leadId) : -1;
  if (!queue || index < 0) return null;

  const total = queue.items.length;
  const previous = queue.items[index - 1];
  const next = queue.items[index + 1];

  function leave() {
    endQueue();
    setQueue(null);
  }

  return (
    <section className="grid gap-2 rounded-2xl border border-border bg-surface p-3" aria-label="Modo fila">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground"><b className="text-foreground tabular-nums">{index + 1} de {total}</b> · {queue.label}</p>
        <button type="button" onClick={leave} className={`${adminActionButtonText} min-h-9 px-2 text-xs`}><X className="h-3.5 w-3.5" aria-hidden />Salir de la fila</button>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-border-soft" aria-hidden>
        <div className="h-full rounded-full bg-accent" style={{ width: `${((index + 1) / total) * 100}%` }} />
      </div>
      <div className="grid grid-cols-[auto_minmax(0,1fr)] gap-2">
        {previous ? (
          <Link href={leadPath(previous.id)} aria-label="Anterior" className={adminActionButtonIcon}><ChevronLeft className="h-4 w-4" aria-hidden /></Link>
        ) : (
          <button type="button" disabled aria-label="Anterior" className={adminActionButtonIcon}><ChevronLeft className="h-4 w-4" aria-hidden /></button>
        )}
        {next ? (
          <Link href={leadPath(next.id)} className={`${done ? adminActionButtonPrimary : adminActionButtonSecondary} min-w-0`}>
            <span className="truncate">{done ? "Listo. " : ""}Siguiente: {next.name}</span><ChevronRight className="h-4 w-4 shrink-0" aria-hidden />
          </Link>
        ) : (
          <button type="button" onClick={() => { leave(); backToLeads(router); }} className={done ? adminActionButtonPrimary : adminActionButtonSecondary}>
            Terminaste la fila · Volver a la lista
          </button>
        )}
      </div>
    </section>
  );
}
