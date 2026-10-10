"use client";

import Link from "next/link";
import { useState } from "react";
import { CheckCircle2, CircleHelp, PackageCheck, PencilLine, ShieldCheck } from "lucide-react";
import { mutate } from "swr";

import { COMPANY } from "@/features/legal/constants/company";

export function CatalogApprovalCard({ tenantId, tenantSlug, businessName, productCount, serviceCount }: { tenantId: string; tenantSlug: string; businessName: string; productCount: number; serviceCount: number }) {
  const [busy, setBusy] = useState(false);
  const [approved, setApproved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function approve() {
    setBusy(true);
    setError(null);
    try {
      const response = await fetch("/api/catalog-approval", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ tenant_id: tenantId, acceptance_source: "dashboard" }) });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "No pudimos aprobar el catálogo");
      setApproved(true);
      await mutate("/api/tenants");
    } catch (value) {
      setError(value instanceof Error ? value.message : "No pudimos aprobar el catálogo");
    } finally {
      setBusy(false);
    }
  }

  if (approved) return <section className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5" role="status"><div className="flex items-start gap-3"><CheckCircle2 className="mt-0.5 h-6 w-6 text-emerald-700" /><div><h2 className="font-bold text-emerald-950">Catálogo aprobado y tienda publicada</h2><p className="mt-1 text-sm leading-6 text-emerald-800">Los pedidos continúan pausados hasta completar contacto, operación y cobros.</p></div></div></section>;

  return (
    <section className="rounded-2xl border-2 border-accent bg-surface p-4 shadow-sm sm:p-5" aria-labelledby="catalog-approval-title">
      <div className="flex items-start gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent/10 text-accent"><PackageCheck className="h-5 w-5" /></span>
        <div><p className="text-xs font-bold uppercase tracking-wider text-accent">Una sola aprobación obligatoria</p><h2 id="catalog-approval-title" className="mt-1 text-lg font-black text-foreground">Éstos serán los precios publicados</h2><p className="mt-1 text-sm leading-6 text-muted-foreground">Preparamos {productCount} productos y {serviceCount} servicios para {businessName}. Aprueba todo o edita sólo las excepciones.</p></div>
      </div>
      <div className="mt-4 rounded-xl bg-border-soft/45 p-3 text-xs leading-5 text-muted-foreground"><ShieldCheck className="mr-1 inline h-4 w-4 text-emerald-700" /> Aprobar publica el catálogo, pero <b className="text-foreground">no activa pedidos ni cobros</b>. Primero completarás los datos operativos.</div>
      {error && <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm font-semibold text-red-700" role="alert">{error}</p>}
      <div className="mt-4 grid gap-2 sm:grid-cols-3">
        <button type="button" onClick={() => void approve()} disabled={busy} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-accent px-4 text-sm font-bold text-accent-foreground hover:bg-accent-hover disabled:opacity-60"><CheckCircle2 className="h-4 w-4" />{busy ? "Aprobando…" : "Aprobar todo"}</button>
        <Link href={`/dashboard/${tenantSlug}/productos`} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-border bg-surface px-4 text-sm font-semibold text-foreground hover:bg-border-soft/40"><PencilLine className="h-4 w-4" />Editar excepciones</Link>
        <a href={`mailto:${COMPANY.supportEmail}?subject=${encodeURIComponent(`Ayuda con catálogo de ${businessName}`)}`} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-border bg-surface px-4 text-sm font-semibold text-foreground hover:bg-border-soft/40"><CircleHelp className="h-4 w-4" />Solicitar ayuda</a>
      </div>
    </section>
  );
}
