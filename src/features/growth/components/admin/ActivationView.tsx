"use client";

import Link from "next/link";
import { AlertTriangle, Rocket } from "lucide-react";

import { useActivationBoard } from "@/features/growth/hooks/useActivationBoard";
import { EmptyState } from "@/components/admin/EmptyState";
import { LoadingBlock } from "@/components/ui/LoadingBlock";

import { formatBusinessName } from "@/features/growth/helpers/formatBusinessName";
import { timeAgo } from "@/features/growth/helpers/nextActionReason";
import { ACTIVATION_STAGES, ACTIVE_ORDERS_30D } from "@/features/growth/constants/activation";
import { giroCopy } from "@/features/growth/constants/giroCopy";
import { leadPath } from "@/features/growth/constants/routes";

import type { ActivationViewProps } from "@/features/growth/interfaces/activation";

/** Registered businesses by how far they got, until they sell on their own. */
export function ActivationView({ owner, showOwner }: ActivationViewProps) {
  const { data, error, isLoading } = useActivationBoard(owner);
  const now = new Date();

  if (isLoading && !data) return <LoadingBlock message="Cargando activación…" variant="skeleton" />;
  if (error && !data) return <EmptyState icon={AlertTriangle} title="No pudimos cargar la activación" tone="muted" />;
  if (!data?.some((column) => column.leads.length)) {
    return <EmptyState icon={Rocket} title="Todavía no hay negocios registrados" description="Cuando alguien se registre, aquí lo acompañas hasta su primera venta." tone="muted" />;
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
      {ACTIVATION_STAGES.map(({ stage, label, hint }) => {
        const leads = data.find((column) => column.stage === stage)?.leads ?? [];
        return (
          <section key={stage} className="flex min-w-0 flex-col rounded-2xl border border-border bg-surface-raised/60" aria-label={label}>
            <header className="grid gap-1 border-b border-border-soft px-3 py-2.5">
              <div className="flex items-center justify-between gap-2">
                <h3 className="truncate text-sm font-bold text-foreground">{label}</h3>
                <span className="rounded-full bg-border-soft px-2 py-0.5 text-xs font-bold tabular-nums text-muted-foreground">{leads.length}</span>
              </div>
              <p className="text-xs leading-snug text-muted-foreground">{hint}</p>
            </header>
            <div className="grid content-start gap-2 p-2">
              {leads.map((lead) => (
                <Link key={lead.lead_id} href={leadPath(lead.lead_id)} className="grid gap-1 rounded-xl border border-border bg-surface p-3 transition-colors hover:border-accent/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent">
                  <span className="truncate text-sm font-bold text-foreground">{formatBusinessName(lead.business_name)}</span>
                  <span className="truncate text-xs text-muted-foreground">{giroCopy(lead.giro).label} · {lead.municipio}</span>
                  <span className="text-xs text-muted-foreground">
                    {lead.registered_at ? `Se registró ${timeAgo(lead.registered_at, now)}` : "Registrado"}
                    {stage === "primera_venta" || stage === "activo" ? ` · ${lead.paid_orders_30d} de ${ACTIVE_ORDERS_30D} pedidos en 30 días` : ""}
                  </span>
                  {showOwner ? <span className="truncate text-xs font-semibold text-muted-foreground">{lead.owner_name ? `Lo acompaña ${lead.owner_name}` : "Sin asignar"}</span> : null}
                </Link>
              ))}
              {!leads.length ? <p className="px-1 py-6 text-center text-xs text-muted-foreground">Nadie en esta etapa</p> : null}
            </div>
          </section>
        );
      })}
    </div>
  );
}
