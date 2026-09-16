"use client";

import { useMemo, useState } from "react";
import useSWR, { mutate } from "swr";
import {
  CheckCircle2,
  ClipboardCheck,
  Copy,
  FileText,
  Mail,
  MessageCircle,
  Plus,
  Send,
  ShoppingCart,
  Undo2,
  XCircle,
} from "lucide-react";

import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { FormSheet } from "@/components/ui/FormSheet";
import { LoadingBlock } from "@/components/ui/LoadingBlock";
import { PageHeader } from "@/components/admin/PageHeader";
import { useActiveTenant } from "@/stores/useTenantStore";
import { swrFetcher } from "@/lib/swrFetcher";

type Product = {
  id: string;
  name: string;
  price: number;
  type: "product" | "service";
};
type QuoteItem = {
  id?: string;
  name_snapshot: string;
  quantity: number;
  unit_price?: number | string;
  subtotal: number | string;
};
type Quote = {
  id: string;
  quote_number: string;
  status: string;
  total: number | string;
  subtotal?: number | string;
  valid_until: string;
  customer?: { name?: string; phone?: string | null; email?: string | null } | null;
  items?: QuoteItem[];
};
type ShareQuote = { quote: Quote; url: string };

const STATUS: Record<string, string> = {
  draft: "Borrador",
  internal_review: "Revisión",
  ready_to_send: "Lista para compartir",
  sent: "Compartida",
  viewed: "Vista por cliente",
  changes_requested: "Cambios solicitados",
  accepted: "Aceptada",
  converted: "Convertida en orden",
  conversion_blocked: "Requiere revisión",
  rejected: "Rechazada",
  expired: "Vencida",
  cancelled: "Cancelada",
  superseded: "Reemplazada",
};

const money = (amount: number | string) =>
  new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(Number(amount));

function normalizePhone(phone: string | null | undefined) {
  return (phone ?? "").replace(/\D/g, "").replace(/^00/, "");
}

export default function CotizacionesPage() {
  const tenant = useActiveTenant();
  const [createOpen, setCreateOpen] = useState(false);
  const [detail, setDetail] = useState<Quote | null>(null);
  const [created, setCreated] = useState<Quote | null>(null);
  const [share, setShare] = useState<ShareQuote | null>(null);
  const [confirm, setConfirm] = useState<{ quote: Quote; action: "accept" | "reject" } | null>(null);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [selected, setSelected] = useState<Record<string, number>>({});
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const quoteKey = tenant ? `/api/quotes?tenant_id=${encodeURIComponent(tenant.id)}` : null;
  const productKey = tenant ? `/api/products?tenant_id=${encodeURIComponent(tenant.id)}` : null;
  const { data: quotes, isLoading } = useSWR<Quote[]>(quoteKey, swrFetcher, { fallbackData: [] });
  const { data: products } = useSWR<Product[]>(productKey, swrFetcher, { fallbackData: [] });
  const chosen = useMemo(
    () => Object.entries(selected)
      .filter(([, quantity]) => quantity > 0)
      .map(([product_id, quantity]) => ({ product_id, quantity })),
    [selected],
  );
  const chosenTotal = useMemo(
    () => chosen.reduce((total, item) => total + (products?.find((product) => product.id === item.product_id)?.price ?? 0) * item.quantity, 0),
    [chosen, products],
  );

  function changeQuantity(productId: string, delta: number) {
    setSelected((current) => {
      const next = Math.max(0, (current[productId] ?? 0) + delta);
      if (next === 0) {
        const rest = { ...current };
        delete rest[productId];
        return rest;
      }
      return { ...current, [productId]: next };
    });
  }

  async function createQuote() {
    if (!tenant || !customerName.trim() || chosen.length === 0) {
      setMessage("Indica el nombre del cliente y al menos un producto o servicio.");
      return;
    }
    setSaving(true);
    setMessage(null);
    try {
      const response = await fetch("/api/quotes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenant_id: tenant.id,
          customer: { name: customerName, phone: customerPhone || undefined },
          items: chosen,
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "No pudimos crear la cotización.");

      const productById = new Map(products?.map((product) => [product.id, product]));
      const createdQuote: Quote = {
        ...result.quote,
        customer: { name: customerName, phone: customerPhone || null },
        items: chosen.map((item) => {
          const product = productById.get(item.product_id);
          const price = Number(product?.price ?? 0);
          return { name_snapshot: product?.name ?? "Artículo", quantity: item.quantity, unit_price: price, subtotal: price * item.quantity };
        }),
      };
      await mutate(quoteKey);
      setCreateOpen(false);
      setCreated(createdQuote);
      setCustomerName("");
      setCustomerPhone("");
      setSelected({});
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "No pudimos crear la cotización.");
    } finally {
      setSaving(false);
    }
  }

  async function updateStatus(id: string, action: string) {
    const response = await fetch(`/api/quotes/${id}/action`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error ?? "No pudimos actualizar la cotización.");
    await mutate(quoteKey);
    return result as { public_url?: string; order_id?: string };
  }

  async function shareQuote(quote: Quote) {
    setSaving(true);
    setMessage(null);
    try {
      const result = await updateStatus(quote.id, "share");
      if (!result.public_url) throw new Error("No se pudo generar la liga privada.");
      setCreated(null);
      setDetail(null);
      setShare({ quote, url: result.public_url });
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "No pudimos preparar la cotización para compartir.");
    } finally {
      setSaving(false);
    }
  }

  async function completeConfirm() {
    if (!confirm) return;
    setSaving(true);
    setMessage(null);
    try {
      const result = await updateStatus(confirm.quote.id, confirm.action);
      setConfirm(null);
      setDetail(null);
      setMessage(
        confirm.action === "accept"
          ? result.order_id
            ? "Cotización convertida en orden. Ya puedes continuar su operación y cobro."
            : "Cotización aceptada."
          : "Cotización marcada como rechazada.",
      );
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "No pudimos actualizar la cotización.");
    } finally {
      setSaving(false);
    }
  }

  async function createRevision(quote: Quote) {
    setSaving(true);
    setMessage(null);
    try {
      const response = await fetch(`/api/quotes/${quote.id}/revision`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "No pudimos crear la nueva versión.");
      await mutate(quoteKey);
      setDetail(null);
      setMessage(`Se creó la versión ${result.version}. Revisa sus precios antes de compartirla.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "No pudimos crear la nueva versión.");
    } finally {
      setSaving(false);
    }
  }

  async function copyShareUrl() {
    if (!share) return;
    try {
      await navigator.clipboard.writeText(share.url);
      setMessage("Liga privada copiada. Puedes pegarla en cualquier conversación.");
    } catch {
      setMessage("No pudimos copiar automáticamente. Mantén presionada la liga para copiarla.");
    }
  }

  function openWhatsApp() {
    if (!share) return;
    const phone = normalizePhone(share.quote.customer?.phone);
    if (!phone) {
      void copyShareUrl();
      setMessage("Este cliente no tiene WhatsApp. Copiamos la liga para que la compartas por el canal que prefieras.");
      return;
    }
    const text = encodeURIComponent(`Hola ${share.quote.customer?.name ?? ""}, te compartimos tu cotización ${share.quote.quote_number}: ${share.url}`);
    window.open(`https://wa.me/${phone}?text=${text}`, "_blank", "noopener,noreferrer");
  }

  function openEmail() {
    if (!share) return;
    const email = share.quote.customer?.email;
    if (!email) {
      void copyShareUrl();
      setMessage("Este cliente no tiene correo. Copiamos la liga para que la compartas por otro canal.");
      return;
    }
    const subject = encodeURIComponent(`Cotización ${share.quote.quote_number}`);
    const body = encodeURIComponent(`Hola ${share.quote.customer?.name ?? ""},\n\nAquí puedes revisar tu cotización: ${share.url}`);
    window.location.href = `mailto:${email}?subject=${subject}&body=${body}`;
  }

  if (!tenant) return <p className="text-sm text-muted-foreground">Selecciona un negocio para continuar.</p>;

  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <PageHeader
        eyebrow="Ventas"
        title="Cotizaciones"
        description="Crea una propuesta, compártela con claridad y conviértela en orden cuando el cliente acepte."
        action={<button type="button" onClick={() => setCreateOpen(true)} className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-accent px-4 text-sm font-bold text-accent-foreground transition-colors hover:bg-accent/90 sm:w-auto"><Plus className="h-4 w-4" />Nueva cotización</button>}
      />

      {message && <p role="status" className="rounded-xl border border-border bg-surface-raised px-4 py-3 text-sm text-muted-foreground">{message}</p>}

      {isLoading ? <LoadingBlock message="Cargando cotizaciones…" variant="skeleton" /> : quotes?.length ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {quotes.map((quote) => (
            <article key={quote.id} className="rounded-2xl border border-border bg-surface p-4 shadow-sm">
              <div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="font-mono text-xs text-muted-foreground">{quote.quote_number}</p><h2 className="mt-1 truncate font-bold text-foreground">{quote.customer?.name ?? "Cliente"}</h2></div><span className="shrink-0 rounded-full bg-accent/10 px-2.5 py-1 text-xs font-bold text-accent">{STATUS[quote.status] ?? quote.status}</span></div>
              <p className="mt-3 text-2xl font-bold tabular-nums text-foreground">{money(quote.total)}</p>
              <p className="mt-1 text-xs text-muted-foreground">Vigente hasta {new Date(quote.valid_until).toLocaleDateString("es-MX")}</p>
              <div className="mt-4 grid grid-cols-2 gap-2">
                <button type="button" onClick={() => setDetail(quote)} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-border bg-surface px-3 text-sm font-semibold text-foreground transition-colors hover:bg-border-soft/60"><FileText className="h-4 w-4" />Ver detalle</button>
                {["ready_to_send", "sent", "viewed"].includes(quote.status) && <button type="button" disabled={saving} onClick={() => void shareQuote(quote)} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-accent px-3 text-sm font-bold text-accent-foreground disabled:opacity-50"><Send className="h-4 w-4" />Compartir</button>}
                {["ready_to_send", "sent", "viewed"].includes(quote.status) && <button type="button" onClick={() => setConfirm({ quote, action: "accept" })} className="col-span-2 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-border bg-surface px-3 text-sm font-semibold text-foreground transition-colors hover:bg-border-soft/60"><ShoppingCart className="h-4 w-4" />Registrar aceptación y crear orden</button>}
                {quote.status === "draft" && <button type="button" disabled={saving} onClick={() => void updateStatus(quote.id, "ready").then(() => setMessage("Cotización lista para compartir.")).catch((error: unknown) => setMessage(error instanceof Error ? error.message : "No pudimos actualizar la cotización."))} className="col-span-2 inline-flex min-h-11 items-center justify-center rounded-xl border border-border bg-surface px-3 text-sm font-semibold text-foreground">Dejar lista para compartir</button>}
                {quote.status === "internal_review" && <button type="button" disabled={saving} onClick={() => void updateStatus(quote.id, "ready").then(() => setMessage("Cotización lista para compartir.")).catch((error: unknown) => setMessage(error instanceof Error ? error.message : "No pudimos actualizar la cotización."))} className="col-span-2 inline-flex min-h-11 items-center justify-center rounded-xl border border-border bg-surface px-3 text-sm font-semibold text-foreground">Dejar lista para compartir</button>}
                {["changes_requested", "conversion_blocked"].includes(quote.status) && <button type="button" disabled={saving} onClick={() => void createRevision(quote)} className="col-span-2 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-border bg-surface px-3 text-sm font-semibold text-foreground"><Undo2 className="h-4 w-4" />Crear nueva versión</button>}
              </div>
            </article>
          ))}
        </div>
      ) : <div className="rounded-2xl border border-dashed border-border bg-surface p-8 text-center"><FileText className="mx-auto h-8 w-8 text-accent" /><h2 className="mt-3 font-bold text-foreground">Aún no hay cotizaciones</h2><p className="mt-1 text-sm text-muted-foreground">Crea una para compartir precios y convertirla en orden cuando el cliente acepte.</p></div>}

      <FormSheet isOpen={createOpen} onClose={() => setCreateOpen(false)} title="Nueva cotización" description="El precio queda guardado aunque cambie tu catálogo." icon={ClipboardCheck} footer={<button type="button" disabled={saving} onClick={() => void createQuote()} className="min-h-12 w-full rounded-xl bg-accent px-4 text-sm font-bold text-accent-foreground disabled:opacity-50">{saving ? "Creando…" : "Crear cotización"}</button>}>
        <div className="space-y-5">
          <label className="block space-y-2 text-sm font-semibold text-foreground"><span>Nombre del cliente</span><input value={customerName} onChange={(event) => setCustomerName(event.target.value)} className="input-form min-h-12 w-full rounded-xl px-3 text-base text-foreground placeholder:text-muted focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20" placeholder="Ej. Selena García" /></label>
          <label className="block space-y-2 text-sm font-semibold text-foreground"><span>WhatsApp <span className="font-normal text-muted-foreground">(opcional)</span></span><input value={customerPhone} onChange={(event) => setCustomerPhone(event.target.value)} inputMode="tel" className="input-form min-h-12 w-full rounded-xl px-3 text-base text-foreground placeholder:text-muted focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20" placeholder="Ej. 55 1234 5678" /><span className="block text-xs font-normal text-muted-foreground">Lo usaremos sólo para abrir el mensaje listo para enviar.</span></label>
          <section><div className="flex items-end justify-between gap-3"><div><h3 className="text-sm font-bold text-foreground">Productos y servicios</h3><p className="mt-1 text-xs text-muted-foreground">Selecciona lo que el cliente está cotizando.</p></div><p className="shrink-0 text-sm font-bold tabular-nums text-accent">{money(chosenTotal)}</p></div><div className="mt-3 max-h-80 space-y-2 overflow-auto pr-1">{products?.map((product) => { const quantity = selected[product.id] ?? 0; return <div key={product.id} className={`flex min-h-16 items-center gap-3 rounded-xl border p-3 transition-colors ${quantity ? "border-accent/50 bg-accent/5" : "border-border bg-surface-raised"}`}><button type="button" aria-label={quantity ? `Quitar ${product.name}` : `Agregar ${product.name}`} onClick={() => changeQuantity(product.id, quantity ? -quantity : 1)} className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md border text-sm font-bold ${quantity ? "border-accent bg-accent text-accent-foreground" : "border-border bg-surface text-muted-foreground"}`}>{quantity ? "✓" : "+"}</button><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold text-foreground">{product.name}</p><p className="mt-0.5 text-xs text-muted-foreground">{product.type === "service" ? "Servicio" : "Producto"} · {money(product.price)}</p></div>{quantity > 0 && <div className="flex min-h-10 items-center rounded-lg border border-border bg-surface"><button type="button" aria-label={`Restar ${product.name}`} onClick={() => changeQuantity(product.id, -1)} className="flex h-10 w-9 items-center justify-center text-lg text-muted-foreground hover:text-foreground">−</button><span className="w-7 text-center text-sm font-bold tabular-nums text-foreground">{quantity}</span><button type="button" aria-label={`Sumar ${product.name}`} onClick={() => changeQuantity(product.id, 1)} className="flex h-10 w-9 items-center justify-center text-lg text-accent hover:bg-accent/5">+</button></div>}</div>; })}</div></section>
        </div>
      </FormSheet>

      <FormSheet isOpen={Boolean(created)} onClose={() => setCreated(null)} title="Cotización creada" description="Ya tiene número, precios congelados y vigencia de 7 días." icon={CheckCircle2} footer={<div className="grid gap-2 sm:grid-cols-2"><button type="button" onClick={() => { if (created) { setDetail(created); setCreated(null); } }} className="min-h-12 rounded-xl border border-border bg-surface text-sm font-semibold text-foreground">Ver detalle</button><button type="button" onClick={() => { if (created) void shareQuote(created); }} className="min-h-12 rounded-xl bg-accent text-sm font-bold text-accent-foreground">Compartir ahora</button></div>}>
        <div className="rounded-2xl border border-border bg-surface-raised p-4"><p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Número de cotización</p><p className="mt-1 font-mono text-sm font-bold text-foreground">{created?.quote_number}</p><p className="mt-4 text-3xl font-bold tabular-nums text-foreground">{money(created?.total ?? 0)}</p><p className="mt-1 text-sm text-muted-foreground">Cliente: {created?.customer?.name}</p></div>
      </FormSheet>

      <FormSheet isOpen={Boolean(detail)} onClose={() => setDetail(null)} title={detail?.quote_number ?? "Detalle de cotización"} description={`${detail?.customer?.name ?? "Cliente"} · ${STATUS[detail?.status ?? ""] ?? ""}`} icon={FileText} footer={detail && ["ready_to_send", "sent", "viewed"].includes(detail.status) ? <div className="grid gap-2 sm:grid-cols-2"><button type="button" disabled={saving} onClick={() => void shareQuote(detail)} className="min-h-12 rounded-xl bg-accent text-sm font-bold text-accent-foreground disabled:opacity-50"><Send className="mr-2 inline h-4 w-4" />Compartir</button><button type="button" onClick={() => setConfirm({ quote: detail, action: "accept" })} className="min-h-12 rounded-xl border border-border bg-surface text-sm font-semibold text-foreground">Registrar aceptación</button></div> : undefined}>
        <div className="space-y-5"><div className="rounded-xl bg-surface-raised p-3 text-sm text-muted-foreground">Vigente hasta {detail && new Date(detail.valid_until).toLocaleDateString("es-MX", { day: "numeric", month: "long", year: "numeric" })}.</div><section className="overflow-hidden rounded-xl border border-border"><div className="border-b border-border-soft px-3 py-3 text-sm font-bold text-foreground">Artículos cotizados</div><div className="divide-y divide-border-soft">{detail?.items?.map((item, index) => <div key={`${item.name_snapshot}-${index}`} className="flex justify-between gap-3 px-3 py-3 text-sm"><span className="min-w-0 text-foreground">{item.quantity} × {item.name_snapshot}</span><strong className="shrink-0 tabular-nums text-foreground">{money(item.subtotal)}</strong></div>)}</div><div className="flex justify-between px-3 py-4 text-base font-bold text-foreground"><span>Total</span><span>{money(detail?.total ?? 0)}</span></div></section>{["sent", "viewed"].includes(detail?.status ?? "") && <div className="grid gap-2 sm:grid-cols-2"><button type="button" onClick={() => setConfirm({ quote: detail as Quote, action: "reject" })} className="min-h-11 rounded-xl border border-red-200 bg-surface text-sm font-semibold text-red-600">Rechazar</button><button type="button" disabled={saving} onClick={() => void updateStatus(detail?.id ?? "", "changes").then(() => { setDetail(null); setMessage("Solicitud de cambio registrada. Crea una nueva versión cuando ajustes la propuesta."); }).catch((error: unknown) => setMessage(error instanceof Error ? error.message : "No pudimos registrar el cambio."))} className="min-h-11 rounded-xl border border-border bg-surface text-sm font-semibold text-foreground">Solicitar cambios</button></div>}{["changes_requested", "conversion_blocked"].includes(detail?.status ?? "") && <button type="button" disabled={saving} onClick={() => void createRevision(detail as Quote)} className="min-h-11 w-full rounded-xl border border-border bg-surface text-sm font-semibold text-foreground"><Undo2 className="mr-2 inline h-4 w-4" />Crear nueva versión</button>}</div>
      </FormSheet>

      <FormSheet isOpen={Boolean(share)} onClose={() => setShare(null)} title="Compartir cotización" description="Elige un canal. La liga es privada, no aparece en buscadores y vence con la cotización." icon={Send} footer={<button type="button" onClick={() => setShare(null)} className="min-h-12 w-full rounded-xl border border-border bg-surface text-sm font-semibold text-foreground">Listo</button>}>
        <div className="space-y-4"><div className="rounded-xl bg-surface-raised p-3"><p className="text-xs font-semibold text-muted-foreground">{share?.quote.quote_number}</p><p className="mt-1 text-sm text-foreground">{share?.quote.customer?.name}</p></div><label className="block space-y-2 text-sm font-semibold text-foreground"><span>Liga privada</span><input readOnly value={share?.url ?? ""} className="input-form min-h-12 w-full rounded-xl px-3 font-mono text-xs text-foreground" /></label><div className="grid gap-2 sm:grid-cols-3"><button type="button" onClick={() => void copyShareUrl()} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-border bg-surface text-sm font-semibold text-foreground"><Copy className="h-4 w-4" />Copiar liga</button><button type="button" onClick={openWhatsApp} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-accent text-sm font-bold text-accent-foreground"><MessageCircle className="h-4 w-4" />WhatsApp</button><button type="button" onClick={openEmail} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-border bg-surface text-sm font-semibold text-foreground"><Mail className="h-4 w-4" />Correo</button></div></div>
      </FormSheet>

      <ConfirmDialog isOpen={Boolean(confirm)} onClose={() => setConfirm(null)} onConfirm={() => completeConfirm()} loading={saving} icon={confirm?.action === "accept" ? ShoppingCart : XCircle} variant={confirm?.action === "reject" ? "danger" : "default"} title={confirm?.action === "accept" ? "¿Registrar aceptación y crear la orden?" : "¿Marcar esta cotización como rechazada?"} description={confirm?.action === "accept" ? "Tlaco verificará inventario y convertirá esta cotización en una orden. Los precios quedan como fueron cotizados." : "Esta acción deja registro del rechazo. Podrás crear una nueva versión si el cliente vuelve a pedir una propuesta."} confirmLabel={confirm?.action === "accept" ? "Crear orden" : "Sí, rechazar"} />
    </div>
  );
}
