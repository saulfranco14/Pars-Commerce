"use client";

import { useState } from "react";
import useSWR from "swr";
import { Building2, CheckCircle2, ExternalLink, RefreshCw, ShieldCheck, Unplug } from "lucide-react";

import { btnDangerSmall, btnPrimary, btnSecondarySmall } from "@/components/ui/buttonClasses";
import { swrFetcher } from "@/lib/swrFetcher";
import type { SafeProviderConnection } from "@/features/payment-providers/types";

const DISCLOSURE_VERSION = "merchant-payments-v1";

function statusCopy(connection: SafeProviderConnection | undefined) {
  if (!connection) return { label: "Sin conectar", className: "bg-border-soft text-muted-foreground", detail: "Conecta la cuenta del negocio para que sus ventas lleguen directamente a ella." };
  if (connection.status === "connected") return { label: "Conectada", className: "bg-emerald-100 text-emerald-700", detail: "Los cobros web se acreditan en la cuenta Mercado Pago de este negocio." };
  if (connection.status === "expired") return { label: "Requiere reconexión", className: "bg-amber-100 text-amber-800", detail: "No se iniciarán cobros digitales hasta renovar la autorización." };
  if (connection.status === "pending") return { label: "Pendiente", className: "bg-blue-100 text-blue-700", detail: "Termina la autorización en Mercado Pago para activar cobros." };
  return { label: "Desconectada", className: "bg-border-soft text-muted-foreground", detail: "Efectivo y transferencia siguen disponibles." };
}

export function MercadoPagoConnectionCard({ tenantId, canManage }: { tenantId: string; canManage: boolean }) {
  const key = `/api/payment-providers/connections?tenant_id=${encodeURIComponent(tenantId)}`;
  const { data, error, isLoading, mutate } = useSWR<SafeProviderConnection[]>(key, swrFetcher);
  const [accepted, setAccepted] = useState(false);
  const [busy, setBusy] = useState<"connect" | "refresh" | "disconnect" | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const connection = data?.find((item) => item.provider === "mercadopago");
  const status = statusCopy(connection);

  async function run(path: string, action: "connect" | "refresh" | "disconnect") {
    setActionError(null);
    setBusy(action);
    try {
      const response = await fetch(path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(action === "connect"
          ? { tenant_id: tenantId, terms_version: DISCLOSURE_VERSION }
          : { tenant_id: tenantId }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "No pudimos actualizar Mercado Pago");
      if (action === "connect") {
        window.location.assign(result.authorization_url);
        return;
      }
      await mutate();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "No pudimos actualizar Mercado Pago");
    } finally {
      setBusy(null);
    }
  }

  if (isLoading) {
    return <section className="h-44 animate-pulse rounded-xl border border-border bg-surface" aria-label="Cargando configuración de cobros" />;
  }

  return (
    <section className="rounded-xl border border-border bg-surface p-4 shadow-sm sm:p-5">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent/10 text-accent">
          <Building2 className="h-5 w-5" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-base font-semibold text-foreground">Cobros del negocio</h3>
            <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${status.className}`}>{status.label}</span>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">{status.detail}</p>
        </div>
      </div>

      {connection?.status === "connected" ? (
        <div className="mt-4 rounded-lg border border-border-soft bg-background px-3 py-3">
          <div className="flex items-center gap-2 text-sm font-medium text-foreground">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" aria-hidden />
            {connection.merchant_display_name ?? "Cuenta Mercado Pago"}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Checkout web disponible. Point se activa después de validar una terminal PDV de esta misma cuenta.
          </p>
        </div>
      ) : null}

      {error || actionError ? <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{actionError ?? "No pudimos cargar la conexión."}</p> : null}

      {canManage && !connection?.status.includes("connected") ? (
        <label className="mt-4 flex min-h-11 cursor-pointer items-start gap-2 rounded-lg border border-border-soft bg-background px-3 py-2.5 text-xs text-muted-foreground">
          <input type="checkbox" checked={accepted} onChange={(event) => setAccepted(event.target.checked)} className="mt-0.5 h-4 w-4 rounded border-border text-accent focus:ring-accent" />
          <span>Acepto el anexo de cobros: este negocio recibe sus fondos, es responsable de ventas y devoluciones; Tlaco sólo administra la operación y factura sus servicios o comisiones autorizadas.</span>
        </label>
      ) : null}

      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-end">
        {canManage && connection?.status === "connected" ? (
          <>
            <button type="button" className={btnSecondarySmall} disabled={busy !== null} onClick={() => run("/api/payment-providers/mercadopago/refresh", "refresh")}>
              <RefreshCw className="h-4 w-4" aria-hidden /> Actualizar
            </button>
            <button type="button" className={btnDangerSmall} disabled={busy !== null} onClick={() => run("/api/payment-providers/mercadopago/disconnect", "disconnect")}>
              <Unplug className="h-4 w-4" aria-hidden /> Desconectar
            </button>
          </>
        ) : null}
        {canManage && connection?.status !== "connected" ? (
          <button type="button" className={btnPrimary} disabled={!accepted || busy !== null} onClick={() => run("/api/payment-providers/mercadopago/connect", "connect")}>
            <ExternalLink className="h-4 w-4" aria-hidden />
            {busy === "connect" ? "Abriendo Mercado Pago…" : "Conectar Mercado Pago"}
          </button>
        ) : null}
      </div>
      <div className="mt-3 flex items-start gap-2 text-xs text-muted-foreground">
        <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent" aria-hidden />
        Tlaco no solicita contraseñas ni muestra los tokens del negocio.
      </div>
    </section>
  );
}
