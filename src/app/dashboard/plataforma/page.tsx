"use client";

import { useSearchParams } from "next/navigation";
import useSWR from "swr";
import { AlertTriangle, ListChecks, ShieldCheck } from "lucide-react";

import { EmptyState } from "@/components/admin/EmptyState";
import { PageHeader } from "@/components/admin/PageHeader";
import { LoadingBlock } from "@/components/ui/LoadingBlock";
import { PlatformBusinessesView } from "@/features/platform/components/PlatformBusinessesView";
import { PlatformOverviewView } from "@/features/platform/components/PlatformOverviewView";
import { PlatformUsersView } from "@/features/platform/components/PlatformUsersView";
import { SettlementsView } from "@/features/settlement/components/SettlementsView";
import { swrFetcher } from "@/lib/swrFetcher";

type PlatformView = "operation" | "users" | "businesses" | "audit" | "liquidaciones";
type PlatformEvent = {
  id: string;
  action: string;
  entity_type: string;
  entity_id: string | null;
  created_at: string;
};

const VIEW_COPY: Record<PlatformView, { title: string; description: string }> = {
  operation: {
    title: "Operación",
    description: "Registros, tiendas, cobros con Mercado Pago, ventas y visitas de todos los negocios.",
  },
  users: {
    title: "Usuarios",
    description: "Localiza cuentas, revisa su contexto y administra su acceso a la plataforma.",
  },
  businesses: {
    title: "Negocios",
    description: "Entiende la operación, el responsable y los límites de acceso de cada comercio.",
  },
  audit: {
    title: "Auditoría",
    description: "Revisa la trazabilidad de los cambios realizados dentro de la plataforma.",
  },
  liquidaciones: {
    title: "Liquidaciones",
    description: "Esquema anterior: lo que Tlaco cobró y debe transferir. Con Mercado Pago conectado el dinero llega directo al negocio.",
  },
};

export default function PlataformaPage() {
  const searchParams = useSearchParams();
  const requestedView = searchParams.get("view");
  const view: PlatformView =
    requestedView === "users" || requestedView === "businesses" || requestedView === "audit" || requestedView === "liquidaciones"
      ? requestedView
      : "operation";
  const copy = VIEW_COPY[view];

  return (
    <div className="mx-auto max-w-[1440px] space-y-5">
      <PageHeader eyebrow="Plataforma" title={copy.title} description={copy.description} />
      {view === "operation" && <PlatformOverviewView />}
      {view === "liquidaciones" && <SettlementsView />}
      {view === "users" && <PlatformUsersView />}
      {view === "businesses" && <PlatformBusinessesView />}
      {view === "audit" && <AuditModule />}
    </div>
  );
}

function AuditModule() {
  const { data, error, isLoading } = useSWR<{ events: PlatformEvent[] }>(
    "/api/platform/activity",
    swrFetcher,
  );

  if (isLoading) return <LoadingBlock message="Cargando auditoría…" variant="skeleton" />;
  if (error) return <InlineError message="No se pudo cargar la actividad reciente." />;
  if (!data?.events.length) return <EmptyState icon={ListChecks} title="Sin actividad" description="No hay eventos recientes para revisar." />;

  return (
    <section className="overflow-hidden rounded-2xl border border-border bg-surface">
      <div className="flex items-center justify-between border-b border-border-soft px-4 py-3 sm:px-5">
        <h2 className="text-sm font-bold text-foreground">Actividad reciente</h2>
        <span className="text-xs font-semibold tabular-nums text-muted-foreground">{data.events.length} eventos</span>
      </div>
      <ol className="divide-y divide-border-soft">
        {data.events.map((event) => (
          <li key={event.id} className="grid gap-2 px-4 py-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:px-5">
            <div className="flex min-w-0 gap-3">
              <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent/10 text-accent"><ShieldCheck className="h-4 w-4" aria-hidden /></span>
              <div className="min-w-0"><p className="truncate text-sm font-bold text-foreground">{event.action}</p><p className="truncate text-xs text-muted-foreground">{event.entity_type} · {event.entity_id ?? "Sin identificador"}</p></div>
            </div>
            <time dateTime={event.created_at} className="pl-11 text-xs text-muted-foreground sm:pl-0">{new Date(event.created_at).toLocaleString("es-MX")}</time>
          </li>
        ))}
      </ol>
    </section>
  );
}

function InlineError({ message }: { message: string }) {
  return <div className="flex min-h-24 items-center gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700" role="alert"><AlertTriangle className="h-5 w-5 shrink-0" aria-hidden />{message}</div>;
}
