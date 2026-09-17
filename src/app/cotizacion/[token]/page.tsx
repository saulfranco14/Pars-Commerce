"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import useSWR from "swr";
import { CheckCircle2, FileText, MessageSquareMore, XCircle } from "lucide-react";

import { swrFetcher } from "@/lib/swrFetcher";

type PublicQuoteItem = {
  product_id: string;
  name_snapshot: string;
  description_snapshot?: string | null;
  image_url_snapshot?: string | null;
  quantity: number;
  unit_price?: number | string;
  subtotal: number | string;
  position: number;
};

type PublicCatalogItem = {
  id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  type: "product" | "service";
  price: number | string;
};

type PublicQuote = {
  tenant: { name: string; logo_url: string | null } | null;
  customer: { name: string } | null;
  quote_number: string;
  status: string;
  valid_until: string;
  items: PublicQuoteItem[] | null;
  total: number | string;
  customer_note: string | null;
  catalog: PublicCatalogItem[];
};

const money = (value: number | string | undefined) => new Intl.NumberFormat("es-MX", {
  style: "currency", currency: "MXN",
}).format(Number(value ?? 0));

export default function CotizacionPublicaPage() {
  const params = useParams<{ token: string }>();
  const token = params.token;
  const { data, error, mutate } = useSWR<PublicQuote>(token ? `/api/public/quotes/${token}` : null, swrFetcher);
  const [sending, setSending] = useState(false);
  const [requestingChanges, setRequestingChanges] = useState(false);
  const [reason, setReason] = useState("");
  const [notice, setNotice] = useState<string | null>(null);
  const [requested, setRequested] = useState<Record<string, number>>({});

  useEffect(() => {
    if (!data || !["sent", "viewed", "ready_to_send"].includes(data.status)) return;
    setRequested(Object.fromEntries((data.items ?? []).map((item) => [item.product_id, item.quantity])));
  }, [data]);

  const requestItems = useMemo(() => Object.entries(requested).filter(([, quantity]) => quantity > 0).map(([product_id, quantity]) => ({ product_id, quantity })), [requested]);
  const requestTotal = useMemo(() => {
    if (!data) return 0;
    const quotedPrices = new Map((data.items ?? []).map((item) => [item.product_id, Number(item.unit_price ?? 0)]));
    const catalogPrices = new Map(data.catalog.map((item) => [item.id, Number(item.price)]));
    return requestItems.reduce((sum, item) => sum + (quotedPrices.get(item.product_id) ?? catalogPrices.get(item.product_id) ?? 0) * item.quantity, 0);
  }, [data, requestItems]);
  const requestedDisplayItems = useMemo(() => {
    if (!data) return [];
    const quoted = new Map((data.items ?? []).map((item) => [item.product_id, item]));
    const catalog = new Map(data.catalog.map((item) => [item.id, item]));
    return requestItems.map((requestedItem) => {
      const original = quoted.get(requestedItem.product_id);
      const catalogItem = catalog.get(requestedItem.product_id);
      return {
        id: requestedItem.product_id,
        quantity: requestedItem.quantity,
        name: original?.name_snapshot ?? catalogItem?.name ?? "Artículo",
        unitPrice: Number(original?.unit_price ?? catalogItem?.price ?? 0),
      };
    });
  }, [data, requestItems]);

  function changeQuantity(productId: string, delta: number) {
    setRequested((current) => {
      const quantity = Math.max(0, (current[productId] ?? 0) + delta);
      if (quantity === 0) {
        const next = { ...current };
        delete next[productId];
        return next;
      }
      return { ...current, [productId]: quantity };
    });
  }

  async function respond(action: "accept" | "reject" | "changes") {
    if (!token) return;
    setSending(true);
    setNotice(null);
    try {
      const response = await fetch(`/api/public/quotes/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, reason: action === "changes" ? reason.trim() || undefined : undefined, requested_items: action === "changes" ? requestItems : undefined }),
      });
      const result = await response.json() as { error?: string; result?: string; order_id?: string };
      if (!response.ok) throw new Error(result.error ?? "No pudimos registrar tu respuesta.");
      setRequestingChanges(false);
      setReason("");
      setNotice(action === "changes" ? "Tu solicitud fue enviada. El negocio preparará una nueva versión para ti." : action === "accept" ? "¡Listo! El negocio recibió tu aceptación y continuará con tu orden." : "Registramos que no deseas continuar con esta cotización.");
      const nextStatus = action === "changes" ? "changes_requested" : action === "reject" ? "rejected" : result.result === "converted" ? "converted" : "conversion_blocked";
      await mutate((current) => current ? { ...current, status: nextStatus } : current, false);
    } catch (caught) {
      setNotice(caught instanceof Error ? caught.message : "No pudimos registrar tu respuesta.");
    } finally {
      setSending(false);
    }
  }

  if (error) return <main className="min-h-screen bg-background px-5 py-12 text-center"><XCircle className="mx-auto h-10 w-10 text-red-500" /><h1 className="mt-3 text-xl font-bold text-foreground">Esta cotización no está disponible</h1><p className="mt-2 text-sm text-muted-foreground">Pide al negocio que te comparta una liga vigente.</p></main>;
  if (!data) return <main className="min-h-screen bg-background px-5 py-12 text-center text-sm text-muted-foreground">Cargando cotización…</main>;

  const actionable = ["sent", "viewed", "ready_to_send"].includes(data.status);
  const isChangesRequested = data.status === "changes_requested";
  const isAccepted = ["accepted", "converted"].includes(data.status);

  return <main className="min-h-screen bg-background px-4 py-6 sm:px-6 sm:py-10">
    <article className="mx-auto max-w-xl overflow-hidden rounded-2xl border border-border bg-surface shadow-sm">
      <header className="border-b border-border-soft px-5 py-5 sm:px-6">
        <div className="flex items-center gap-3">
          {data.tenant?.logo_url ? <img src={data.tenant.logo_url} alt="" className="h-10 w-10 rounded-xl object-cover" /> : <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent/10 text-accent"><FileText className="h-5 w-5" /></span>}
          <div className="min-w-0"><p className="truncate font-bold text-foreground">{data.tenant?.name ?? "Tlaco"}</p><p className="mt-0.5 font-mono text-xs text-muted-foreground">{data.quote_number}</p></div>
        </div>
        <div className="mt-5 flex flex-wrap items-end justify-between gap-3"><div><p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Cotización para</p><h1 className="mt-1 text-xl font-bold tracking-tight text-foreground">{data.customer?.name ?? "Cliente"}</h1></div><p className="rounded-full bg-surface-raised px-3 py-1.5 text-xs font-semibold text-muted-foreground">Vigente hasta {new Date(data.valid_until).toLocaleDateString("es-MX", { day: "numeric", month: "short", year: "numeric" })}</p></div>
      </header>

      <section className="px-5 py-5 sm:px-6" aria-labelledby="quote-lines-title">
        <h2 id="quote-lines-title" className="text-sm font-bold text-foreground">Incluye</h2>
        <div className="mt-3 divide-y divide-border-soft rounded-xl border border-border">
          {data.items?.sort((a, b) => a.position - b.position).map((item, index) => <div key={`${item.name_snapshot}-${index}`} className="flex items-center justify-between gap-3 px-3 py-3"><div className="min-w-0"><p className="text-sm font-semibold text-foreground">{item.quantity} × {item.name_snapshot}</p>{item.description_snapshot && <p className="mt-0.5 truncate text-xs text-muted-foreground">{item.description_snapshot}</p>}</div><strong className="shrink-0 tabular-nums text-sm text-foreground">{money(item.subtotal)}</strong></div>)}
        </div>
        <div className="mt-4 flex items-end justify-between border-t border-border-soft pt-4"><span className="text-base font-bold text-foreground">Total</span><span className="text-2xl font-bold tabular-nums text-foreground">{money(data.total)}</span></div>
        {data.customer_note && <p className="mt-4 rounded-xl bg-surface-raised px-3 py-3 text-sm text-muted-foreground">{data.customer_note}</p>}
      </section>

      <section className="border-t border-border-soft bg-surface-raised px-5 py-5 sm:px-6" aria-live="polite">
        {notice && <p className="mb-3 rounded-xl border border-accent/20 bg-accent/5 px-3 py-2.5 text-sm text-foreground">{notice}</p>}
        {actionable && !requestingChanges && <div className="space-y-2"><p className="text-sm font-semibold text-foreground">¿La cotización está correcta?</p><button disabled={sending} onClick={() => void respond("accept")} className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-accent px-4 text-sm font-bold text-accent-foreground transition-colors hover:bg-accent/90 disabled:opacity-50"><CheckCircle2 className="h-4 w-4" />Aceptar cotización</button><button disabled={sending} onClick={() => setRequestingChanges(true)} className="min-h-12 w-full rounded-xl border border-border bg-surface px-4 text-sm font-semibold text-foreground transition-colors hover:bg-border-soft/50">Solicitar cambios</button><button disabled={sending} onClick={() => void respond("reject")} className="min-h-11 w-full text-sm font-semibold text-muted-foreground hover:text-foreground">No aceptar</button></div>}
        {actionable && requestingChanges && <div className="space-y-4"><div className="flex gap-2"><MessageSquareMore className="mt-0.5 h-5 w-5 shrink-0 text-accent" /><div><h2 className="font-bold text-foreground">Ajusta tu cotización</h2><p className="mt-1 text-sm text-muted-foreground">Agrega, quita o cambia cantidades. El negocio recibirá esta selección exacta; la nota sólo aclara algo adicional.</p></div></div><div className="rounded-xl border border-border bg-surface p-3"><div className="flex items-center justify-between gap-3"><p className="text-sm font-bold text-foreground">Artículos solicitados</p><p className="text-sm font-bold tabular-nums text-accent">{money(requestTotal)}</p></div><div className="mt-3 space-y-2">{requestedDisplayItems.map((item) => <div key={item.id} className="flex min-h-14 items-center gap-2 rounded-lg bg-surface-raised px-2 py-2"><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold text-foreground">{item.name}</p><p className="text-xs text-muted-foreground">{money(item.unitPrice)} c/u</p></div><div className="flex min-h-10 items-center rounded-lg border border-border bg-surface"><button type="button" aria-label={`Quitar uno de ${item.name}`} onClick={() => changeQuantity(item.id, -1)} className="flex h-10 w-9 items-center justify-center text-lg text-muted-foreground">−</button><span className="w-7 text-center text-sm font-bold tabular-nums text-foreground">{item.quantity}</span><button type="button" aria-label={`Agregar uno de ${item.name}`} onClick={() => changeQuantity(item.id, 1)} className="flex h-10 w-9 items-center justify-center text-lg text-accent">+</button></div></div>)}</div></div><details className="rounded-xl border border-border bg-surface"><summary className="cursor-pointer list-none px-3 py-3 text-sm font-semibold text-foreground">Agregar productos o servicios <span className="float-right text-accent">+</span></summary><div className="border-t border-border-soft p-3"><p className="mb-2 text-xs text-muted-foreground">Sólo eliges artículos; el negocio confirmará la nueva versión antes de cobrar.</p><div className="max-h-56 space-y-2 overflow-auto pr-1">{data.catalog.filter((item) => !requested[item.id]).map((item) => <button type="button" key={item.id} onClick={() => changeQuantity(item.id, 1)} className="flex min-h-12 w-full items-center gap-3 rounded-lg border border-border bg-surface-raised px-3 text-left hover:border-accent/40"><span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-border bg-surface font-bold text-accent">+</span><span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold text-foreground">{item.name}</span><span className="text-xs text-muted-foreground">{item.type === "service" ? "Servicio" : "Producto"} · {money(item.price)}</span></span></button>)}</div></div></details><label className="block space-y-2 text-sm font-semibold text-foreground"><span>Nota para el negocio <span className="font-normal text-muted-foreground">(opcional)</span></span><textarea value={reason} onChange={(event) => setReason(event.target.value)} maxLength={500} rows={3} className="input-form w-full resize-none rounded-xl px-3 py-3 text-base text-foreground placeholder:text-muted focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20" placeholder="Ej. Si hay alguna alternativa, prefiero que me contacten." /></label><div className="space-y-2"><button disabled={sending || requestItems.length === 0} onClick={() => void respond("changes")} className="min-h-12 w-full rounded-xl bg-accent text-sm font-bold text-accent-foreground disabled:opacity-50">{sending ? "Enviando…" : "Enviar cambios al negocio"}</button><button disabled={sending} onClick={() => setRequestingChanges(false)} className="min-h-11 w-full text-sm font-semibold text-muted-foreground hover:text-foreground">Cancelar</button></div></div>}
        {isChangesRequested && <div className="flex gap-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-3 text-amber-900"><MessageSquareMore className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" /><div><p className="font-semibold">Cambios solicitados</p><p className="mt-1 text-sm text-amber-800">El negocio está preparando una nueva versión. Recibirás una nueva liga cuando esté lista.</p></div></div>}
        {isAccepted && <div className="flex gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-3 text-emerald-900"><CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-700" /><div><p className="font-semibold">Cotización aceptada</p><p className="mt-1 text-sm text-emerald-800">El negocio continuará con tu pedido y te indicará los siguientes pasos.</p></div></div>}
      </section>
    </article>
  </main>;
}
