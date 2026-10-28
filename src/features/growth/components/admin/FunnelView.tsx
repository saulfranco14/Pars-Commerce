"use client";

import { AlertTriangle } from "lucide-react";

import { useGrowthFunnel } from "@/features/growth/hooks/useGrowthFunnel";
import { EmptyState } from "@/components/admin/EmptyState";
import { MetricsStrip } from "@/components/admin/MetricsStrip";
import { FilterTabs } from "@/components/ui/FilterTabs";
import { LoadingBlock } from "@/components/ui/LoadingBlock";

import { giroCopy } from "@/features/growth/constants/giroCopy";
import { zoneByMunicipio } from "@/features/growth/constants/zoneCopy";

const RANGE_TABS = [{ value: "1", label: "Hoy" }, { value: "7", label: "7 días" }, { value: "30", label: "30 días" }] as const;
const DROP_LABEL: Record<string, string> = {
  sin_whatsapp: "Sin WhatsApp",
  equivocado: "Número equivocado",
  rebote: "Correo rebotó",
  no_estaba: "No estaba",
  cerrado: "Cerrado",
  no_le_interesa: "No le interesa",
  ya_usa_otra: "Ya usa otra",
  baja: "Se dio de baja",
  sin_respuesta: "Sin respuesta",
};

function Bar({ label, value, max }: { label: string; value: number; max: number }) {
  const width = max ? Math.max(2, Math.round((value / max) * 100)) : 0;
  return (
    <div className="grid grid-cols-[140px_minmax(0,1fr)_48px] items-center gap-3 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="h-3 overflow-hidden rounded-full bg-border-soft/60"><span className="block h-full rounded-full bg-accent" style={{ width: `${width}%` }} /></span>
      <span className="text-right font-bold tabular-nums text-foreground">{value}</span>
    </div>
  );
}

export function FunnelView() {
  const { report, error, isLoading, days, setDays } = useGrowthFunnel();

  if (isLoading && !report) return <LoadingBlock message="Cargando embudo…" variant="skeleton" />;
  if (error || !report) return <EmptyState icon={AlertTriangle} title="No pudimos cargar el embudo" tone="muted" />;

  const registered = report.registered_engine + report.registered_assisted + report.registered_self;
  const steps = [
    { label: "Contactados", value: report.contacted },
    { label: "Con canal válido", value: Math.max(0, report.valid_channel) },
    { label: "Respondieron", value: report.replied },
    { label: "Abrieron su tienda", value: report.viewed },
    { label: "Tocaron «Reclamar»", value: report.claimed },
    { label: "Registrados (motor)", value: report.registered_engine + report.registered_assisted },
  ];
  const max = Math.max(...steps.map((step) => step.value), 1);
  const drops = Object.entries(report.drop_reasons).filter(([, value]) => value > 0);
  const municipios = Object.entries(report.by_municipio);

  return (
    <div className="grid gap-5">
      <FilterTabs tabs={RANGE_TABS} activeValue={String(days)} onTabChange={(value) => setDays(Number(value))} ariaLabel="Periodo" />
      <MetricsStrip
        metrics={[
          { label: "Registros", value: registered },
          { label: "Por el motor", value: report.registered_engine, tone: "accent" },
          { label: "Asistidos", value: report.registered_assisted, tone: "amber" },
          { label: "Solos", value: report.registered_self },
        ]}
      />

      <section className="grid gap-3 rounded-2xl border border-border bg-surface p-4 sm:p-5">
        <h2 className="text-base font-bold text-foreground">Embudo</h2>
        {steps.map((step) => <Bar key={step.label} label={step.label} value={step.value} max={max} />)}
      </section>

      <div className="grid gap-5 lg:grid-cols-2">
        <section className="grid gap-3 rounded-2xl border border-border bg-surface p-4 sm:p-5">
          <h2 className="text-base font-bold text-foreground">Por qué se caen</h2>
          {drops.length ? (
            <ul className="grid gap-2 text-sm">
              {drops.map(([key, value]) => (
                <li key={key} className="flex justify-between gap-3"><span className="text-muted-foreground">{DROP_LABEL[key] ?? key}</span><span className="font-bold tabular-nums text-foreground">{value}</span></li>
              ))}
            </ul>
          ) : <p className="text-sm text-muted-foreground">Sin caídas registradas en este periodo.</p>}
        </section>
        <section className="grid gap-3 rounded-2xl border border-border bg-surface p-4 sm:p-5">
          <h2 className="text-base font-bold text-foreground">Por municipio</h2>
          {municipios.length ? (
            <ul className="grid gap-2 text-sm">
              {municipios.map(([municipio, value]) => (
                <li key={municipio} className="flex justify-between gap-3">
                  <span className="text-muted-foreground">{zoneByMunicipio(municipio)?.label ?? municipio}</span>
                  <span className="tabular-nums text-foreground">{value.contacted} contactados · <b>{value.registered}</b> registrados</span>
                </li>
              ))}
            </ul>
          ) : <p className="text-sm text-muted-foreground">Todavía no hay contactos en este periodo.</p>}
        </section>
      </div>

      <section className="grid gap-3 rounded-2xl border border-border bg-surface p-4 sm:p-5">
        <h2 className="text-base font-bold text-foreground">Qué versión de mensaje funciona</h2>
        {report.by_template.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                <tr><th className="py-2">Mensaje</th><th>Enviados</th><th>Respondieron</th><th>Rechazos</th><th>Registros</th></tr>
              </thead>
              <tbody className="divide-y divide-border-soft">
                {report.by_template.map((row) => (
                  <tr key={row.template_id}>
                    <td className="py-2 text-foreground">{row.channel === "whatsapp" ? "WhatsApp" : "Correo"} · {row.step} · {row.variant} v{row.version}{row.giro ? ` · ${giroCopy(row.giro).label}` : ""}</td>
                    <td className="tabular-nums">{row.sent}</td>
                    <td className="tabular-nums">{row.replied}</td>
                    <td className="tabular-nums">{row.rejected}</td>
                    <td className="font-bold tabular-nums text-foreground">{row.registered}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <p className="text-sm text-muted-foreground">Cuando salgan mensajes, aquí verás qué versión trae más respuestas y registros.</p>}
      </section>
    </div>
  );
}
