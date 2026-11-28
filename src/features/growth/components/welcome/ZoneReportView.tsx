"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { MapPin, Megaphone } from "lucide-react";

import { useZoneReport } from "@/features/growth/hooks/useZoneReport";
import { EmptyState } from "@/components/admin/EmptyState";
import { MetricsStrip } from "@/components/admin/MetricsStrip";
import { pageSecondaryAction } from "@/components/admin/actionButtonClasses";
import { LoadingBlock } from "@/components/ui/LoadingBlock";
import { Notification } from "@/components/ui/Notification";

const ZoneMap = dynamic(() => import("@/features/growth/components/welcome/ZoneMap"), {
  ssr: false,
  loading: () => <div className="h-72 w-full animate-pulse bg-border-soft sm:h-96" aria-label="Cargando mapa" />,
});

// DENUE often places a market's stalls on the same point.
function nearestLabel(meters: number | null): string {
  if (meters == null) return "—";
  return meters < 20 ? "Junto a usted" : `${meters} m`;
}

/** «Su zona»: same-giro businesses around this one, from INEGI's directory, with two ideas written as tests. */
export function ZoneReportView() {
  const { tenant, report, error, isLoading } = useZoneReport();
  if (isLoading) return <LoadingBlock message="Cargando su zona…" variant="skeleton" />;
  if (error || !report || !tenant) {
    return <EmptyState icon={MapPin} title="Todavía no tenemos su zona" description="El reporte sale para los negocios que llegaron con sus anuncios de regalo y tienen ubicación." tone="muted" />;
  }

  return (
    <div className="grid grid-cols-1 gap-5">
      <section className="grid gap-1 rounded-3xl border border-border bg-surface p-5 sm:p-6">
        <span className="text-sm font-semibold text-muted-foreground">{report.plural} a 500 m de usted</span>
        <span className="text-6xl font-bold tracking-tight text-foreground tabular-nums">{report.within500}</span>
        <span className="text-sm text-muted-foreground">{report.place}</span>
      </section>

      <div className="overflow-hidden rounded-3xl border border-border">
        <ZoneMap report={report} />
      </div>

      <MetricsStrip
        metrics={[
          { label: "A 1 km", value: String(report.within1000) },
          { label: "El más cercano", value: nearestLabel(report.nearestM) },
          { label: "Fuente", value: "INEGI" },
        ]}
      />

      <section className="grid gap-3">
        <h2 className="text-lg font-bold text-foreground">Dos ideas para que lo elijan a usted</h2>
        <ul className="grid gap-3 sm:grid-cols-2">
          {report.ideas.map((idea) => (
            <li key={idea.title} className="grid gap-1 rounded-2xl border border-border bg-surface p-4">
              <p className="text-base font-bold text-foreground">{idea.title}</p>
              <p className="text-sm text-foreground">{idea.action}</p>
              <p className="text-sm text-muted-foreground">{idea.test}</p>
            </li>
          ))}
        </ul>
        <Link href={`/dashboard/${encodeURIComponent(tenant.slug)}/studio`} className={pageSecondaryAction}>
          <Megaphone className="h-4 w-4" aria-hidden />
          Hacer anuncio
        </Link>
      </section>

      <Notification
        tone="info"
        message="Contamos los negocios de su giro registrados en el directorio de INEGI (DENUE), en línea recta. No dice cuánto venden y no incluye a los que no están registrados."
      />
    </div>
  );
}
