"use client";

import { useEffect, useState } from "react";
import useSWR from "swr";
import { Mail } from "lucide-react";

import { swrFetcher } from "@/lib/swrFetcher";
import type { TenantEntitlements } from "@/features/billing/entitlements";

type ScheduledResponse = { entitlement: TenantEntitlements["scheduled_report_frequency"]; report: { frequency: "weekly" | "daily"; recipient_email: string; is_active: boolean } | null };

export function ScheduledReports({ tenantId, entitlement }: { tenantId: string; entitlement: TenantEntitlements["scheduled_report_frequency"] }) {
  // A Free/Operation tenant cannot configure scheduled reports. Keeping the
  // SWR key null avoids an otherwise repeated 403 request on every refresh.
  const { data, mutate } = useSWR<ScheduledResponse>(
    entitlement
      ? `/api/billing/scheduled-reports?tenant_id=${encodeURIComponent(tenantId)}`
      : null,
    swrFetcher,
  );
  const [email, setEmail] = useState("");
  const [frequency, setFrequency] = useState<"weekly" | "daily">("weekly");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  useEffect(() => { if (data?.report) { setEmail(data.report.recipient_email); setFrequency(data.report.frequency); } }, [data]);
  if (!entitlement) return null;
  async function save() {
    setSaving(true); setMessage(null);
    try {
      const response = await fetch("/api/billing/scheduled-reports", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ tenant_id: tenantId, recipient_email: email, frequency }) });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error ?? "No pudimos guardar el reporte");
      setMessage("Resumen programado."); await mutate();
    } catch (error) { setMessage(error instanceof Error ? error.message : "No pudimos guardar el reporte"); } finally { setSaving(false); }
  }
  return (
    <section className="mt-3 rounded-xl border border-border bg-surface p-3">
      <div className="flex gap-2"><Mail className="mt-0.5 h-4 w-4 text-accent" /><div><p className="text-sm font-bold text-foreground">Resumen por correo</p><p className="text-xs text-muted-foreground">Recibe ventas pagadas sin entrar al panel.</p></div></div>
      <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_auto_auto]">
        <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="tu@correo.com" className="min-h-11 rounded-lg border border-border bg-surface px-3 text-sm text-foreground" />
        <select value={frequency} onChange={(event) => setFrequency(event.target.value as "weekly" | "daily")} className="min-h-11 rounded-lg border border-border bg-surface px-3 text-sm text-foreground">
          {entitlement === "daily_or_weekly" && <option value="daily">Diario</option>}<option value="weekly">Semanal</option>
        </select>
        <button type="button" onClick={() => void save()} disabled={saving || !email} className="min-h-11 rounded-lg bg-accent px-4 text-sm font-bold text-accent-foreground disabled:opacity-60">{saving ? "Guardando…" : "Activar"}</button>
      </div>
      {message && <p className="mt-2 text-xs text-muted-foreground">{message}</p>}
    </section>
  );
}
