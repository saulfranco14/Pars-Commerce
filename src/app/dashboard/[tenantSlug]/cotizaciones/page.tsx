"use client";

import { useMemo, useState } from "react";
import { useParams } from "next/navigation";
import useSWR, { mutate } from "swr";
import { ClipboardCheck, FileText, Plus, Send, ShoppingCart, Undo2 } from "lucide-react";

import { FormSheet } from "@/components/ui/FormSheet";
import { LoadingBlock } from "@/components/ui/LoadingBlock";
import { PageHeader } from "@/components/admin/PageHeader";
import { useActiveTenant } from "@/stores/useTenantStore";
import { swrFetcher } from "@/lib/swrFetcher";

type Product = { id: string; name: string; price: number; image_url?: string | null; type: "product" | "service" };
type Quote = { id: string; quote_number: string; status: string; total: number; valid_until: string; customer?: { name?: string }; items?: Array<{ id: string; name_snapshot: string; quantity: number; subtotal: number }> };

const STATUS: Record<string, string> = { draft: "Borrador", internal_review: "Revisión", ready_to_send: "Lista para enviar", sent: "Enviada", viewed: "Vista", changes_requested: "Cambios solicitados", accepted: "Aceptada", converted: "Convertida", conversion_blocked: "Requiere revisión", rejected: "Rechazada", expired: "Vencida", cancelled: "Cancelada", superseded: "Reemplazada" };

export default function CotizacionesPage() {
  const params = useParams();
  const tenantSlug = params.tenantSlug as string;
  const tenant = useActiveTenant();
  const [open, setOpen] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [selected, setSelected] = useState<Record<string, number>>({});
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const quoteKey = tenant ? `/api/quotes?tenant_id=${tenant.id}` : null;
  const { data: quotes, isLoading } = useSWR<Quote[]>(quoteKey, swrFetcher, { fallbackData: [] });
  const { data: products } = useSWR<Product[]>(tenant ? `/api/products?tenant_id=${tenant.id}` : null, swrFetcher, { fallbackData: [] });
  const chosen = useMemo(() => Object.entries(selected).filter(([, qty]) => qty > 0).map(([product_id, quantity]) => ({ product_id, quantity })), [selected]);

  async function createQuote() {
    if (!tenant || !customerName.trim() || chosen.length === 0) { setMessage("Indica el cliente y al menos un producto o servicio."); return; }
    setSaving(true); setMessage(null);
    try {
      const response = await fetch("/api/quotes", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ tenant_id: tenant.id, customer: { name: customerName, phone: customerPhone || undefined }, items: chosen }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "No pudimos crear la cotización.");
      await mutate(quoteKey); setOpen(false); setCustomerName(""); setCustomerPhone(""); setSelected({}); setMessage("Cotización creada. Ya puedes compartirla.");
    } catch (error) { setMessage(error instanceof Error ? error.message : "No pudimos crear la cotización."); } finally { setSaving(false); }
  }
  async function action(id: string, actionName: string) {
    setMessage(null);
    const response = await fetch(`/api/quotes/${id}/action`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: actionName }) });
    const result = await response.json();
    if (!response.ok) { setMessage(result.error ?? "No pudimos actualizar la cotización."); return; }
    if (result.public_url) { await navigator.clipboard.writeText(result.public_url); setMessage("Liga privada copiada. Compártela por WhatsApp o correo."); }
    if (result.order_id) setMessage("Cotización convertida en orden.");
    await mutate(quoteKey);
  }
  async function createRevision(id: string) {
    setMessage(null);
    const response = await fetch(`/api/quotes/${id}/revision`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({}) });
    const result = await response.json();
    if (!response.ok) { setMessage(result.error ?? "No pudimos crear la nueva versión."); return; }
    setMessage(`Se creó la versión ${result.version}. Revisa precios y compártela cuando esté lista.`);
    await mutate(quoteKey);
  }
  if (!tenant) return <p className="text-sm text-muted-foreground">Selecciona un negocio para continuar.</p>;
  return <div className="mx-auto max-w-5xl space-y-5"><PageHeader eyebrow="Ventas" title="Cotizaciones" description="Ofrece, comparte y convierte una cotización en una orden sin perder el seguimiento." action={<button type="button" onClick={() => setOpen(true)} className="inline-flex min-h-12 items-center gap-2 rounded-xl bg-accent px-4 text-sm font-bold text-accent-foreground"><Plus className="h-4 w-4" />Nueva cotización</button>} />
    {message && <p role="status" className="rounded-xl border border-border bg-surface-raised px-4 py-3 text-sm text-muted-foreground">{message}</p>}
    {isLoading ? <LoadingBlock message="Cargando cotizaciones…" variant="skeleton" /> : quotes?.length ? <div className="grid gap-3 sm:grid-cols-2">{quotes.map((quote) => <article key={quote.id} className="rounded-2xl border border-border bg-surface p-4 shadow-sm"><div className="flex items-start justify-between gap-3"><div><p className="font-mono text-xs text-muted-foreground">{quote.quote_number}</p><h2 className="mt-1 font-bold text-foreground">{quote.customer?.name ?? "Cliente"}</h2></div><span className="rounded-full bg-accent/10 px-2.5 py-1 text-xs font-bold text-accent">{STATUS[quote.status] ?? quote.status}</span></div><p className="mt-3 text-2xl font-bold tabular-nums text-foreground">${Number(quote.total).toFixed(2)}</p><p className="mt-1 text-xs text-muted-foreground">Vigente hasta {new Date(quote.valid_until).toLocaleDateString("es-MX")}</p><div className="mt-4 grid grid-cols-2 gap-2">{["draft", "ready_to_send", "sent", "viewed"].includes(quote.status) && <button type="button" onClick={() => void action(quote.id, "share")} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-accent px-3 text-sm font-bold text-accent-foreground"><Send className="h-4 w-4" />Compartir</button>}{["sent", "viewed", "ready_to_send"].includes(quote.status) && <button type="button" onClick={() => void action(quote.id, "accept")} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-border bg-surface px-3 text-sm font-semibold text-foreground"><ShoppingCart className="h-4 w-4" />Convertir</button>}{["changes_requested", "conversion_blocked"].includes(quote.status) && <button type="button" onClick={() => void createRevision(quote.id)} className="col-span-2 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-border bg-surface px-3 text-sm font-semibold text-foreground"><Undo2 className="h-4 w-4" />Crear nueva versión</button>}</div></article>)}</div> : <div className="rounded-2xl border border-dashed border-border bg-surface p-8 text-center"><FileText className="mx-auto h-8 w-8 text-accent" /><h2 className="mt-3 font-bold text-foreground">Aún no hay cotizaciones</h2><p className="mt-1 text-sm text-muted-foreground">Crea una para compartir precios y convertirla en orden cuando el cliente acepte.</p></div>}
    <FormSheet isOpen={open} onClose={() => setOpen(false)} title="Nueva cotización" description="El precio queda guardado aunque cambie el catálogo." icon={ClipboardCheck} footer={<button type="button" disabled={saving} onClick={() => void createQuote()} className="min-h-12 w-full rounded-xl bg-accent px-4 text-sm font-bold text-accent-foreground disabled:opacity-50">{saving ? "Creando…" : "Crear cotización"}</button>}><div className="space-y-4"><label className="block text-sm font-semibold text-foreground">Nombre del cliente<input value={customerName} onChange={(event) => setCustomerName(event.target.value)} className="input-form mt-1 min-h-12 w-full rounded-xl" placeholder="Nombre completo" /></label><label className="block text-sm font-semibold text-foreground">WhatsApp <span className="font-normal text-muted-foreground">(opcional)</span><input value={customerPhone} onChange={(event) => setCustomerPhone(event.target.value)} className="input-form mt-1 min-h-12 w-full rounded-xl" placeholder="+5215512345678" /></label><section><h3 className="text-sm font-bold text-foreground">Productos y servicios</h3><div className="mt-2 max-h-72 space-y-2 overflow-auto">{products?.map((product) => <label key={product.id} className="flex min-h-14 items-center gap-3 rounded-xl border border-border bg-surface-raised p-3"><input type="checkbox" checked={Boolean(selected[product.id])} onChange={(event) => setSelected((current) => ({ ...current, [product.id]: event.target.checked ? 1 : 0 }))} /><span className="min-w-0 flex-1 truncate text-sm font-semibold text-foreground">{product.name}</span><span className="text-sm font-bold tabular-nums text-accent">${Number(product.price).toFixed(2)}</span>{selected[product.id] ? <input aria-label={`Cantidad ${product.name}`} type="number" min="1" value={selected[product.id]} onChange={(event) => setSelected((current) => ({ ...current, [product.id]: Math.max(1, Number(event.target.value)) }))} className="h-10 w-14 rounded-lg border border-border bg-surface px-2 text-center" /> : null}</label>)}</div></section></div></FormSheet></div>;
}
