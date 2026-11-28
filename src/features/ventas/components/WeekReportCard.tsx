"use client";

import Link from "next/link";
import { CalendarDays, ExternalLink, Megaphone, Sparkles, TrendingDown, TrendingUp } from "lucide-react";

import { useWeekReport } from "@/features/ventas/hooks/useWeekReport";
import { pageSecondaryAction } from "@/components/admin/actionButtonClasses";
import { Notification } from "@/components/ui/Notification";

import { formatCurrency } from "@/features/qr/helpers/format";
import { weekdayOf } from "@/features/ventas/helpers/commercialCalendar";

import type { WeekReport } from "@/features/ventas/interfaces/weekReport";

const WEEKDAY = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

function dayLabel(date: string): string {
  return `${WEEKDAY[weekdayOf(date)]} ${Number(date.slice(8))}`;
}

/** One series, 14 days: last week muted, this week in accent, low days in amber with their label below. */
function WeekBars({ report }: { report: WeekReport }) {
  const max = Math.max(1, ...report.days.map((day) => day.total));
  const low = new Set(report.lowDays.map((day) => day.date));
  return (
    <figure className="grid gap-2">
      <div className="flex h-32 items-end gap-0.5 border-b border-border" aria-hidden>
        {report.days.map((day, index) => (
          <span
            key={day.date}
            title={`${dayLabel(day.date)}: ${formatCurrency(day.total)}`}
            className={`min-h-0.5 flex-1 rounded-t ${low.has(day.date) ? "bg-amber-400" : index >= 7 ? "bg-accent" : "bg-border"}`}
            style={{ height: `${(day.total / max) * 100}%` }}
          />
        ))}
      </div>
      <div className="flex gap-0.5 text-[10px] text-muted-foreground" aria-hidden>
        {report.days.map((day) => (
          <span key={day.date} className="flex-1 text-center tabular-nums">{Number(day.date.slice(8))}</span>
        ))}
      </div>
      <figcaption className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-sm bg-border" />Semana anterior</span>
        <span className="inline-flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-sm bg-accent" />Últimos 7 días</span>
        {report.lowDays.length ? <span className="inline-flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-sm bg-amber-400" />Día bajo</span> : null}
      </figcaption>
      <table className="sr-only">
        <caption>Ventas por día, últimos 14 días</caption>
        <tbody>
          {report.days.map((day) => (
            <tr key={day.date}><th scope="row">{dayLabel(day.date)}</th><td>{formatCurrency(day.total)}</td></tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}

/** «Su semana»: what was sold, which days fell and what they coincided with, what happened outside, and what comes next. */
export function WeekReportCard({ tenantId, tenantSlug }: { tenantId: string; tenantSlug: string }) {
  const { report, reportError, reportLoading, outside, outsideError, outsideLoading } = useWeekReport(tenantId);
  if (reportLoading) return <div className="h-72 animate-pulse rounded-3xl bg-border-soft" aria-label="Cargando su semana" />;
  if (reportError || !report) return null;
  const down = report.change != null && report.change < 0;
  const TrendIcon = down ? TrendingDown : TrendingUp;

  return (
    <section aria-labelledby="week-report-title" className="grid gap-5 rounded-3xl border border-border bg-surface p-4 sm:p-6">
      <div className="grid gap-1">
        <h2 id="week-report-title" className="text-sm font-semibold text-muted-foreground">Su semana · últimos 7 días</h2>
        <p className="text-4xl font-bold tracking-tight text-foreground tabular-nums sm:text-5xl">{formatCurrency(report.total)}</p>
        {report.change != null ? (
          <p className={`inline-flex items-center gap-1.5 text-sm font-semibold ${down ? "text-amber-700" : "text-emerald-700"}`}>
            <TrendIcon className="h-4 w-4" aria-hidden />
            {down ? `${Math.abs(report.change)}% menos` : `${report.change}% más`} que los 7 días anteriores ({formatCurrency(report.previousTotal)})
          </p>
        ) : (
          <p className="text-sm text-muted-foreground">Todavía no hay ventas de la semana anterior para comparar.</p>
        )}
      </div>

      <WeekBars report={report} />

      {report.lowDays.length ? (
        <div className="grid gap-2 rounded-2xl bg-amber-50 p-4 text-sm text-amber-950 dark:bg-amber-500/10 dark:text-amber-100">
          <p className="font-bold">Qué pasó</p>
          <ul className="grid gap-1.5">
            {report.lowDays.map((day) => (
              <li key={day.date}>
                El {dayLabel(day.date)} vendió {formatCurrency(day.total)}, contra {formatCurrency(day.previous)} el mismo día de la semana anterior.
                {day.coincides.length ? ` Coincide con ${day.coincides.join(" y ")}.` : null}
              </li>
            ))}
          </ul>
          <p className="text-xs opacity-80">Coincidir no quiere decir que fue la causa: cuando tenga un año de ventas, lo comparamos con el mismo día del año pasado.</p>
        </div>
      ) : null}

      <div className="grid gap-3 rounded-2xl border border-accent/25 bg-accent/5 p-4">
        <p className="inline-flex items-center gap-2 text-sm font-bold text-accent">
          <Sparkles className={`h-4 w-4 ${outsideLoading ? "motion-safe:animate-spin" : ""}`} aria-hidden />
          {outsideLoading ? "Buscando qué pasa afuera…" : `Lo que pasa afuera${report.place ? ` · ${report.place}` : ""}`}
        </p>
        {outsideLoading ? (
          <div className="grid gap-2" aria-busy="true">
            {["w-11/12", "w-4/5", "w-3/5"].map((width) => <span key={width} className={`ai-line h-3 rounded-md ${width}`} />)}
          </div>
        ) : outside ? (
          <>
            <ul className="grid gap-2 text-sm">
              {outside.items.map((item) => (
                <li key={item.title}><span className="font-semibold text-foreground">{item.title}.</span> <span className="text-muted-foreground">{item.detail}</span></li>
              ))}
            </ul>
            {outside.sources.length ? (
              <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs">
                {outside.sources.map((source) => (
                  <a key={source.url} href={source.url} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-8 items-center gap-1 text-muted-foreground underline underline-offset-2 hover:text-foreground">
                    {source.title}
                    <ExternalLink className="h-3 w-3" aria-hidden />
                  </a>
                ))}
              </div>
            ) : null}
            <p className="text-xs text-muted-foreground">Lo busca la IA en Google. Revise las fuentes: puede equivocarse.</p>
          </>
        ) : outsideError ? (
          <p className="text-sm text-muted-foreground">{outsideError.message}</p>
        ) : null}
      </div>

      {report.upcoming ? (
        <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
          <div className="grid gap-1">
            <p className="inline-flex items-center gap-2 text-sm font-bold text-foreground">
              <CalendarDays className="h-4 w-4 text-accent" aria-hidden />
              Lo que viene: {report.upcoming.label}
            </p>
            <p className="text-sm text-muted-foreground">
              {report.upcoming.start === report.upcoming.end ? `El ${dayLabel(report.upcoming.start)}` : `Del ${dayLabel(report.upcoming.start)} al ${dayLabel(report.upcoming.end)}`}, en {report.upcoming.inDays} día(s). Prepare su promoción y súbala a su Estado unos días antes.
            </p>
          </div>
          <Link href={`/dashboard/${encodeURIComponent(tenantSlug)}/studio`} className={pageSecondaryAction}>
            <Megaphone className="h-4 w-4" aria-hidden />
            Hacer anuncio
          </Link>
        </div>
      ) : null}

      {report.total === 0 && report.previousTotal === 0 ? (
        <Notification tone="info" message="El reporte se arma con las ventas cobradas en Tlaco. Registre cada venta y aquí verá cómo va su semana." />
      ) : null}
    </section>
  );
}
