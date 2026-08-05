"use client";

import { useState } from "react";
import useSWR from "swr";
import { Check, CreditCard, Download, RotateCcw, Sparkles, X } from "lucide-react";

import { FormSheet } from "@/components/ui/FormSheet";
import { swrFetcher } from "@/lib/swrFetcher";
import type { BillingAccount, BillingPlan, BillingPlanCode } from "@/features/billing/entitlements";
import { PortfolioDashboard } from "@/features/billing/components/PortfolioDashboard";
import { ScheduledReports } from "@/features/billing/components/ScheduledReports";

const PLAN_COPY: Record<BillingPlanCode, { summary: string; bullets: string[] }> = {
  free: { summary: "Empieza a vender sin costo fijo.", bullets: ["5 mesas activas", "Catálogo, QR, órdenes y equipo ilimitado", "Clientes y préstamos manuales"] },
  operation: { summary: "Para atender más en el piso.", bullets: ["20 mesas activas", "1 kiosko", "Recomendación para prestar"] },
  growth: { summary: "Para controlar varias operaciones.", bullets: ["50 mesas y 3 kioskos", "Reportes y exportación", "Vista de hasta 3 negocios"] },
  scale: { summary: "Para una operación que ya escala.", bullets: ["100 mesas y 10 kioskos", "Hasta 10 negocios juntos", "Reglas de crédito y reportes programados"] },
};

function money(value: number) {
  return value === 0 ? "$0" : `$${value.toLocaleString("es-MX")}`;
}

export function BillingPlanCard({ tenantId, canManage }: { tenantId: string; canManage: boolean }) {
  const { data: account, mutate, isLoading, error: accountError } = useSWR<BillingAccount>(
    `/api/billing/account?tenant_id=${encodeURIComponent(tenantId)}`,
    swrFetcher,
  );
  const [plans, setPlans] = useState<BillingPlan[] | null>(null);
  const [sheet, setSheet] = useState<"plans" | "manage" | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function openPlans() {
    setError(null);
    setSheet("plans");
    if (plans) return;
    try {
      const response = await fetch("/api/billing/plans");
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "No pudimos cargar los planes");
      setPlans(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No pudimos cargar los planes");
    }
  }

  async function upgrade(plan: BillingPlanCode) {
    setBusy(plan);
    setError(null);
    try {
      const response = await fetch("/api/billing/checkout", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenant_id: tenantId, plan_code: plan }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "No pudimos abrir el cobro");
      window.location.assign(data.checkout_url);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No pudimos abrir el cobro");
      setBusy(null);
    }
  }

  async function cancel() {
    setBusy("cancel");
    setError(null);
    try {
      const response = await fetch("/api/billing/cancel", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenant_id: tenantId }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "No pudimos cancelar el plan");
      await mutate(data);
      setSheet(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No pudimos cancelar el plan");
    } finally {
      setBusy(null);
    }
  }

  async function reactivate() {
    setBusy("reactivate"); setError(null);
    try {
      const response = await fetch("/api/billing/reactivate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ tenant_id: tenantId }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "No pudimos reactivar el plan");
      if (!data.checkout_url) throw new Error("No pudimos abrir Mercado Pago");
      window.location.assign(data.checkout_url);
    } catch (e) { setError(e instanceof Error ? e.message : "No pudimos reactivar el plan"); } finally { setBusy(null); }
  }

  async function exportReport() {
    setBusy("export"); setError(null);
    try {
      const response = await fetch("/api/reports/export", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ tenant_id: tenantId }) });
      if (!response.ok) { const data = await response.json(); throw new Error(data.error ?? "No pudimos exportar"); }
      const url = URL.createObjectURL(await response.blob());
      const link = document.createElement("a"); link.href = url; link.download = "ventas-tlaco.csv"; link.click(); URL.revokeObjectURL(url);
    } catch (e) { setError(e instanceof Error ? e.message : "No pudimos exportar"); } finally { setBusy(null); }
  }

  if (isLoading) {
    return <div className="h-36 animate-pulse rounded-2xl border border-border bg-surface-raised" aria-label="Cargando membresía" />;
  }
  if (!account) return <p className="rounded-xl border border-border bg-surface-raised px-4 py-3 text-sm text-muted-foreground">{accountError?.message ?? "No pudimos cargar la membresía."}</p>;
  const currentCopy = PLAN_COPY[account.plan_code] ?? PLAN_COPY.free;
  const period = account.current_period_end
    ? new Intl.DateTimeFormat("es-MX", { day: "numeric", month: "short", year: "numeric" }).format(new Date(account.current_period_end))
    : null;

  return (
    <section className="rounded-2xl border border-border bg-surface-raised p-4 shadow-sm sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-accent">
            <Sparkles className="h-4 w-4" aria-hidden /> Tu plan
          </div>
          <h2 className="mt-1 text-lg font-bold text-foreground">{account.plan.name}</h2>
          <p className="mt-0.5 text-sm text-muted-foreground">{currentCopy.summary}</p>
        </div>
        <span className="rounded-full bg-accent/10 px-2.5 py-1 text-xs font-bold text-accent">
          {money(account.plan.amount_mxn)}/mes
        </span>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2 rounded-xl bg-border-soft/40 p-2">
        <div className="rounded-lg bg-surface px-3 py-2">
          <p className="text-xs text-muted-foreground">Mesas activas</p>
          <p className="mt-0.5 font-bold tabular-nums text-foreground">{account.usage.active_tables} de {account.plan.entitlements.active_table_limit}</p>
        </div>
        <div className="rounded-lg bg-surface px-3 py-2">
          <p className="text-xs text-muted-foreground">Kioskos activos</p>
          <p className="mt-0.5 font-bold tabular-nums text-foreground">{account.usage.active_kiosks} de {account.plan.entitlements.active_kiosk_limit}</p>
        </div>
      </div>

      {account.cancel_at_period_end && period && (
        <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-900">Tu plan seguirá activo hasta el {period}. Después volverás a Gratis.</p>
      )}
      {canManage ? <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        <button type="button" onClick={() => void openPlans()} className="flex min-h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-accent px-4 text-sm font-bold text-accent-foreground transition-colors hover:bg-accent-hover active:scale-[0.99]">
          <Sparkles className="h-4 w-4" /> Ver planes
        </button>
        {account.plan_code !== "free" && (
          <button type="button" onClick={() => { setError(null); setSheet("manage"); }} className="flex min-h-12 flex-1 items-center justify-center gap-2 rounded-xl border border-border bg-surface px-4 text-sm font-semibold text-foreground transition-colors hover:bg-border-soft/40">
            <CreditCard className="h-4 w-4" /> Administrar
          </button>
        )}
      </div> : <p className="mt-4 text-xs text-muted-foreground">El propietario del negocio administra la membresía y sus cobros.</p>}
      {error && !sheet && <p className="mt-3 text-sm text-destructive">{error}</p>}
      {canManage && account.plan.entitlements.export_reports && <button type="button" disabled={busy !== null} onClick={() => void exportReport()} className="mt-3 flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-border bg-surface px-4 text-sm font-semibold text-foreground hover:bg-border-soft/40 disabled:opacity-60"><Download className="h-4 w-4" />{busy === "export" ? "Preparando…" : "Exportar ventas"}</button>}
      {account.plan.entitlements.portfolio_dashboard_limit > 0 && <PortfolioDashboard tenantId={tenantId} />}
      {canManage && <ScheduledReports tenantId={tenantId} entitlement={account.plan.entitlements.scheduled_report_frequency} />}

      <FormSheet isOpen={sheet === "plans"} onClose={() => setSheet(null)} title="Elige cómo crece tu negocio" description="Empiezas gratis. Cambias o cancelas desde aquí, sin hablar con soporte." icon={Sparkles} footer={<button type="button" onClick={() => setSheet(null)} className="min-h-12 w-full rounded-xl border border-border bg-surface px-4 text-sm font-semibold text-foreground">Cerrar</button>}>
        <div className="space-y-3">
          {error && <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
          {(plans ?? []).map((plan) => {
            const copy = PLAN_COPY[plan.code];
            const current = plan.code === account.plan_code;
            return (
              <article key={plan.code} className={`rounded-2xl border p-4 ${plan.code === "operation" ? "border-accent bg-accent/5" : "border-border bg-surface"}`}>
                <div className="flex items-start justify-between gap-3">
                  <div><h3 className="font-bold text-foreground">{plan.name}</h3><p className="text-xs text-muted-foreground">{copy.summary}</p></div>
                  <p className="shrink-0 text-lg font-bold tabular-nums text-foreground">{money(plan.amount_mxn)}<span className="text-xs font-medium text-muted-foreground">/mes</span></p>
                </div>
                <ul className="mt-3 space-y-1.5">{copy.bullets.map((item) => <li key={item} className="flex gap-2 text-sm text-foreground"><Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />{item}</li>)}</ul>
                {current ? <p className="mt-3 text-sm font-bold text-accent">Plan actual</p> : plan.code !== "free" ? <button type="button" disabled={busy !== null} onClick={() => void upgrade(plan.code)} className="mt-3 min-h-12 w-full rounded-xl bg-accent px-4 text-sm font-bold text-accent-foreground disabled:opacity-60">{busy === plan.code ? "Abriendo Mercado Pago…" : `Activar ${plan.name}`}</button> : null}
              </article>
            );
          })}
        </div>
      </FormSheet>

      <FormSheet isOpen={sheet === "manage"} onClose={() => setSheet(null)} title={account.cancel_at_period_end ? "Reactivar membresía" : "Cancelar membresía"} description="No perderás pedidos, clientes ni historial." icon={account.cancel_at_period_end ? RotateCcw : X} footer={<div className="space-y-2">{account.cancel_at_period_end ? <button type="button" disabled={busy !== null} onClick={() => void reactivate()} className="min-h-12 w-full rounded-xl bg-accent px-4 text-sm font-bold text-accent-foreground disabled:opacity-60">{busy === "reactivate" ? "Reactivando…" : "Conservar mi plan"}</button> : <button type="button" disabled={busy !== null} onClick={() => void cancel()} className="min-h-12 w-full rounded-xl bg-destructive px-4 text-sm font-bold text-white disabled:opacity-60">{busy === "cancel" ? "Cancelando…" : "Cancelar plan"}</button>}<button type="button" onClick={() => setSheet(null)} className="min-h-12 w-full rounded-xl border border-border bg-surface px-4 text-sm font-semibold text-foreground">Cerrar</button></div>}>
        <div className="rounded-xl bg-border-soft/45 p-4 text-sm text-muted-foreground">
          {account.cancel_at_period_end ? `Tu plan seguirá activo hasta el ${period ?? "fin del periodo"}. Puedes reactivarlo antes de esa fecha.` : period ? `Conservarás ${account.plan.name} hasta el ${period}.` : "La cancelación detendrá la autorización pendiente y volverás a Gratis."} Después aplicarán los límites del plan Gratis.
        </div>
        {error && <p className="mt-3 text-sm text-destructive">{error}</p>}
      </FormSheet>
    </section>
  );
}
