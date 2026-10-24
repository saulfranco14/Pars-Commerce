"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Download, FileText, ShieldCheck, TriangleAlert } from "lucide-react";

import { Notification } from "@/components/ui/Notification";
import { useActiveTenant } from "@/stores/useTenantStore";

export default function TenantLegalCenterPage() {
  const params = useParams();
  const tenant = useActiveTenant();
  const [acceptance, setAcceptance] = useState<{ id: string; accepted_at: string; document_snapshot?: Array<{ id: string; title: string; version: string }> } | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState<"export" | "closure" | null>(null);
  const tenantSlug = params.tenantSlug as string;

  useEffect(() => {
    if (!tenant?.id) return;
    void fetch(`/api/legal/status?tenant_id=${tenant.id}`, { cache: "no-store" }).then((response) => response.json()).then((data) => setAcceptance(data.states?.[0]?.acceptance ?? null));
  }, [tenant?.id]);
  if (!tenant) return <p className="text-sm text-muted-foreground">Cargando negocio…</p>;
  async function exportData() {
    setBusy("export"); setMessage(null);
    try { const response = await fetch(`/api/tenants/${tenant.id}/data-export`, { method: "POST" }); const data = await response.json(); if (!response.ok) throw new Error(data.error); window.open(data.download_url, "_blank", "noopener,noreferrer"); setMessage("Tu exportación está lista. El enlace de descarga dura 15 minutos."); }
    catch (error) { setMessage(error instanceof Error ? error.message : "No pudimos preparar la exportación."); }
    finally { setBusy(null); }
  }
  async function requestClosure() {
    if (!window.confirm("Se cerrarán los pedidos públicos después de preparar tu exportación. ¿Continuar?")) return;
    setBusy("closure"); setMessage(null);
    try { const response = await fetch(`/api/tenants/${tenant.id}/closure`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({}) }); const data = await response.json(); if (!response.ok) throw new Error(data.error); setMessage("La solicitud quedó registrada y los nuevos pedidos fueron detenidos. Conserva tu exportación antes del cierre definitivo."); }
    catch (error) { setMessage(error instanceof Error ? error.message : "No pudimos solicitar el cierre."); }
    finally { setBusy(null); }
  }
  return <div className="mx-auto max-w-3xl space-y-5 pb-28"><Link href={`/dashboard/${tenantSlug}/configuracion`} className="text-sm font-semibold text-muted-foreground hover:text-foreground">← Configuración</Link><header><p className="text-xs font-bold uppercase tracking-[0.14em] text-accent">Tu negocio</p><h1 className="mt-2 text-2xl font-bold tracking-tight text-foreground">Datos legales y contratos</h1><p className="mt-2 text-sm leading-6 text-muted-foreground">Aquí consultas tu comprobante, recuperas tu información o solicitas el cierre de tu negocio.</p></header>{message ? <Notification tone="info" message={message} /> : null}<section className="rounded-2xl border border-border bg-surface-raised p-5 shadow-soft"><div className="flex gap-3"><ShieldCheck className="h-5 w-5 text-emerald-600"/><div><h2 className="font-bold text-foreground">{acceptance ? "Acuerdo aceptado" : "Acuerdo pendiente"}</h2><p className="mt-1 text-sm text-muted-foreground">{acceptance ? `Registrado el ${new Date(acceptance.accepted_at).toLocaleDateString("es-MX")}.` : "Completa tu ficha de apertura antes de abrir pedidos."}</p>{acceptance ? <><a className="mt-3 inline-flex min-h-11 items-center gap-2 rounded-xl border border-border px-4 text-sm font-bold" href={`/api/legal/receipt/${acceptance.id}`}><FileText className="h-4 w-4"/>Ver comprobante</a><div className="mt-3 flex flex-wrap gap-3">{acceptance.document_snapshot?.map((document) => <a key={document.id} className="text-sm font-bold text-accent underline" href={`/api/legal/documents/${document.id}?tenant_id=${tenant.id}`} target="_blank" rel="noreferrer">{document.title} v{document.version}</a>)}</div></> : <Link className="mt-3 inline-flex min-h-11 items-center rounded-xl bg-accent px-4 text-sm font-bold text-accent-foreground" href={`/dashboard/legal?tenant=${tenant.id}`}>Completar apertura</Link>}</div></div></section><section className="rounded-2xl border border-border bg-surface-raised p-5 shadow-soft"><h2 className="font-bold text-foreground">Recupera tus datos</h2><p className="mt-1 text-sm leading-6 text-muted-foreground">Preparamos un ZIP privado con catálogo, clientes, órdenes y artículos. No incluye contraseñas ni secretos de pago.</p><button type="button" onClick={() => void exportData()} disabled={busy !== null} className="mt-4 inline-flex min-h-12 items-center gap-2 rounded-xl bg-accent px-4 text-sm font-bold text-accent-foreground disabled:opacity-60"><Download className="h-4 w-4"/>{busy === "export" ? "Preparando…" : "Exportar mis datos"}</button></section><section className="rounded-2xl border border-red-200 bg-red-50/50 p-5"><div className="flex gap-3"><TriangleAlert className="h-5 w-5 text-red-600"/><div><h2 className="font-bold text-foreground">Cerrar negocio</h2><p className="mt-1 text-sm leading-6 text-muted-foreground">Primero generamos tu exportación y detenemos pedidos nuevos. La eliminación definitiva requiere la política de retención aprobada.</p><button type="button" onClick={() => void requestClosure()} disabled={busy !== null} className="mt-4 inline-flex min-h-12 items-center rounded-xl border border-red-300 px-4 text-sm font-bold text-red-700 disabled:opacity-60">{busy === "closure" ? "Solicitando…" : "Solicitar cierre"}</button></div></div></section></div>;
}
