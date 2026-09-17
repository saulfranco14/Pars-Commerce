"use client";

import { useMemo, useState } from "react";
import useSWR, { mutate } from "swr";
import {
  CheckCircle2,
  Copy,
  FileText,
  Mail,
  MessageCircle,
  Plus,
  RefreshCw,
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
import { NewQuoteSheet, type CreatedQuote } from "@/features/quotes/components/NewQuoteSheet";
import { QuoteRevisionSheet } from "@/features/quotes/components/QuoteRevisionSheet";

type QuoteItem = {
  id?: string;
  product_id?: string;
  name_snapshot: string;
  quantity: number;
  unit_price?: number | string;
  subtotal: number | string;
};
type Quote = {
  id: string;
  quote_number: string;
  version?: number;
  parent_quote_id?: string | null;
  status: string;
  total: number | string;
  subtotal?: number | string;
  valid_until: string;
  customer_change_note?: string | null;
  customer_requested_items?: Array<{ product_id: string; quantity: number }> | null;
  customer?: { name?: string; phone?: string | null; email?: string | null } | null;
  items?: QuoteItem[];
  events?: Array<{ event_type: string; source?: string | null; reason?: string | null; created_at: string }>;
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

function eventDescription(event: NonNullable<Quote["events"]>[number], version: number) {
  const prefix = `Versión ${version}`;
  switch (event.event_type) {
    case "created": return `${prefix} creada`;
    case "share_opened": return `${prefix} compartida con el cliente`;
    case "viewed": return `El cliente revisó la versión ${version}`;
    case "changes_requested": return `El cliente solicitó ajustes en la versión ${version}`;
    case "revision_created": return `Se preparó la versión ${version}`;
    case "revision_updated": return `Se ajustó la versión ${version}`;
    case "superseded": return `La versión ${version} fue reemplazada`;
    case "converted": return `${prefix} se convirtió en orden`;
    case "rejected": return `El cliente no aceptó la versión ${version}`;
    default: return `${prefix} fue actualizada`;
  }
}

function formatShortDate(value: string) {
  return new Intl.DateTimeFormat("es-MX", { day: "numeric", month: "short" }).format(new Date(value));
}

export default function CotizacionesPage() {
  const tenant = useActiveTenant();
  const [createOpen, setCreateOpen] = useState(false);
  const [detail, setDetail] = useState<Quote | null>(null);
  const [created, setCreated] = useState<Quote | null>(null);
  const [share, setShare] = useState<ShareQuote | null>(null);
  const [revisionQuote, setRevisionQuote] = useState<Quote | null>(null);
  const [confirm, setConfirm] = useState<{ quote: Quote; action: "accept" | "reject" } | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const quoteKey = tenant ? `/api/quotes?tenant_id=${encodeURIComponent(tenant.id)}` : null;
  const { data: quotes, isLoading, isValidating, mutate: refreshQuotes } = useSWR<Quote[]>(quoteKey, swrFetcher, { fallbackData: [] });
  const quoteGroups = useMemo(() => {
    const grouped = new Map<string, Quote[]>();
    for (const quote of quotes ?? []) {
      const current = grouped.get(quote.quote_number) ?? [];
      current.push(quote);
      grouped.set(quote.quote_number, current);
    }
    return [...grouped.values()]
      .map((versions) => {
        const sorted = [...versions].sort((a, b) => (b.version ?? 1) - (a.version ?? 1));
        // The latest non-replaced record is the only proposal that can be acted
        // on. Older versions remain in its history, never as a competing card.
        return { versions: sorted, current: sorted.find((quote) => quote.status !== "superseded") ?? sorted[0] };
      })
      .sort((a, b) => new Date(b.current.valid_until).getTime() - new Date(a.current.valid_until).getTime());
  }, [quotes]);

  function handleCreated(newQuote: CreatedQuote) {
    setCreated(newQuote);
    void mutate(quoteKey);
  }

  async function refreshQuoteList() {
    setMessage(null);
    await refreshQuotes();
    setMessage("Cotizaciones actualizadas con la información más reciente.");
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
      const result = await response.json() as { error?: string; version?: number; quote?: Quote };
      if (!response.ok) throw new Error(result.error ?? "No pudimos crear la nueva versión.");
      await mutate(quoteKey);
      setDetail(null);
      if (!result.quote) throw new Error("No pudimos abrir la nueva versión.");
      setRevisionQuote({
        ...result.quote,
        customer_change_note: quote.customer_change_note,
        customer_requested_items: quote.customer_requested_items,
      });
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
        action={<div className="grid w-full grid-cols-[minmax(0,1fr)_auto] gap-2 sm:flex sm:w-auto"><button type="button" onClick={() => void refreshQuoteList()} disabled={isValidating} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-border bg-surface px-3 text-sm font-semibold text-foreground transition-colors hover:bg-border-soft/60 disabled:opacity-60" aria-label="Actualizar cotizaciones"><RefreshCw className={`h-4 w-4 ${isValidating ? "animate-spin" : ""}`} /><span className="sm:hidden">Actualizar</span></button><button type="button" onClick={() => setCreateOpen(true)} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-accent px-4 text-sm font-bold text-accent-foreground transition-colors hover:bg-accent/90"><Plus className="h-4 w-4" />Nueva cotización</button></div>}
      />

      {message && <p role="status" className="rounded-xl border border-border bg-surface-raised px-4 py-3 text-sm text-muted-foreground">{message}</p>}

      {isLoading ? <LoadingBlock message="Cargando cotizaciones…" variant="skeleton" /> : quotes?.length ? (
        <div className="grid max-w-5xl gap-3 sm:grid-cols-2">
          {quoteGroups.map((group) => {
            const quote = group.current;
            const versionLabel = `Versión actual · V${quote.version ?? 1}`;
            const changeRequest = group.versions.find((version) => version.customer_change_note);
            const activity = group.versions.flatMap((version) => (version.events ?? []).map((event) => ({ ...event, version: version.version ?? 1 }))).sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
            const requestNote = changeRequest?.customer_change_note ?? activity.find((event) => event.event_type === "changes_requested")?.reason;
            const requestIsApplied = Boolean(changeRequest && (quote.version ?? 1) > (changeRequest.version ?? 1));
            return <article key={quote.quote_number} className="rounded-2xl border border-border bg-surface p-4 shadow-sm">
              <div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="font-mono text-xs text-muted-foreground">{quote.quote_number}</p><p className="mt-1 text-xs font-semibold text-accent">{versionLabel}{group.versions.length > 1 ? ` · ${group.versions.length} en total` : ""}</p><h2 className="mt-1 truncate font-bold text-foreground">{quote.customer?.name ?? "Cliente"}</h2></div><span className="shrink-0 rounded-full bg-accent/10 px-2.5 py-1 text-xs font-bold text-accent">{STATUS[quote.status] ?? quote.status}</span></div>
              <p className="mt-3 text-2xl font-bold tabular-nums text-foreground">{money(quote.total)}</p>
              <p className="mt-1 text-xs text-muted-foreground">Vigente hasta {new Date(quote.valid_until).toLocaleDateString("es-MX")}</p>
              {(changeRequest || requestNote) && <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-3 py-3 text-xs text-amber-900"><p className="font-semibold">El cliente pidió ajustes</p><p className="mt-1 text-amber-800">{requestIsApplied ? "La versión actual ya contiene la selección que solicitó." : "Prepara una nueva versión para revisar y aplicar la selección solicitada."}</p>{requestNote && <details className="mt-2 border-t border-amber-200/70 pt-2"><summary className="cursor-pointer font-semibold text-amber-900">Ver nota del cliente</summary><p className="mt-2 max-h-28 overflow-auto whitespace-pre-wrap break-words pr-1 leading-relaxed text-amber-900">{requestNote}</p></details>}</div>}
              {(group.versions.length > 1 || activity.length > 1) && <details className="mt-3 rounded-xl border border-border bg-surface-raised px-3 py-2.5 text-xs text-muted-foreground"><summary className="cursor-pointer font-semibold text-foreground">Ver historial de la cotización ({group.versions.length} {group.versions.length === 1 ? "versión" : "versiones"})</summary><ol className="mt-3 space-y-2 border-l border-border pl-3">{activity.slice(-6).reverse().map((event, index) => <li key={`${event.created_at}-${index}`} className="relative"><span className="absolute -left-[17px] top-1 h-2 w-2 rounded-full bg-accent" /><p className="text-foreground">{eventDescription(event, event.version)}</p><p className="mt-0.5 text-muted-foreground">{formatShortDate(event.created_at)}</p></li>)}</ol></details>}
              <div className="mt-4 space-y-2">
                {["ready_to_send", "sent", "viewed"].includes(quote.status) && <button type="button" disabled={saving} onClick={() => void shareQuote(quote)} className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-accent px-3 text-sm font-bold text-accent-foreground disabled:opacity-50"><Send className="h-4 w-4" />Compartir con cliente</button>}
                {["changes_requested", "conversion_blocked"].includes(quote.status) && <button type="button" disabled={saving} onClick={() => void createRevision(quote)} className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-accent px-3 text-sm font-bold text-accent-foreground disabled:opacity-50"><Undo2 className="h-4 w-4" />Preparar nueva versión</button>}
                {["ready_to_send", "sent", "viewed"].includes(quote.status) ? <div className="grid grid-cols-2 gap-2"><button type="button" onClick={() => setDetail(quote)} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-border bg-surface px-3 text-sm font-semibold text-foreground transition-colors hover:bg-border-soft/60"><FileText className="h-4 w-4" />Detalle</button><button type="button" onClick={() => setConfirm({ quote, action: "accept" })} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-border bg-surface px-3 text-sm font-semibold text-foreground transition-colors hover:bg-border-soft/60"><ShoppingCart className="h-4 w-4" />Aceptar</button></div> : <button type="button" onClick={() => setDetail(quote)} className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-border bg-surface px-3 text-sm font-semibold text-foreground transition-colors hover:bg-border-soft/60"><FileText className="h-4 w-4" />Ver detalle</button>}
                {quote.status === "draft" && <button type="button" disabled={saving} onClick={() => void updateStatus(quote.id, "ready").then(() => setMessage("Cotización lista para compartir.")).catch((error: unknown) => setMessage(error instanceof Error ? error.message : "No pudimos actualizar la cotización."))} className="inline-flex min-h-11 w-full items-center justify-center rounded-xl border border-border bg-surface px-3 text-sm font-semibold text-foreground">Dejar lista para compartir</button>}
                {quote.status === "internal_review" && <button type="button" disabled={saving} onClick={() => void updateStatus(quote.id, "ready").then(() => setMessage("Cotización lista para compartir.")).catch((error: unknown) => setMessage(error instanceof Error ? error.message : "No pudimos actualizar la cotización."))} className="inline-flex min-h-11 w-full items-center justify-center rounded-xl border border-border bg-surface px-3 text-sm font-semibold text-foreground">Dejar lista para compartir</button>}
              </div>
            </article>;
          })}
        </div>
      ) : <div className="rounded-2xl border border-dashed border-border bg-surface p-8 text-center"><FileText className="mx-auto h-8 w-8 text-accent" /><h2 className="mt-3 font-bold text-foreground">Aún no hay cotizaciones</h2><p className="mt-1 text-sm text-muted-foreground">Crea una para compartir precios y convertirla en orden cuando el cliente acepte.</p></div>}

      <NewQuoteSheet isOpen={createOpen} onClose={() => setCreateOpen(false)} tenantId={tenant.id} onCreated={handleCreated} />
      <QuoteRevisionSheet isOpen={Boolean(revisionQuote)} onClose={() => setRevisionQuote(null)} tenantId={tenant.id} quote={revisionQuote} onSaved={() => { void mutate(quoteKey); setMessage("Nueva versión guardada. Ya puedes compartirla con el cliente."); }} />

      <FormSheet isOpen={Boolean(created)} onClose={() => setCreated(null)} title="Cotización creada" description="Ya tiene número, precios congelados y vigencia de 7 días." icon={CheckCircle2} footer={<div className="grid gap-2 sm:grid-cols-2"><button type="button" onClick={() => { if (created) { setDetail(created); setCreated(null); } }} className="min-h-12 rounded-xl border border-border bg-surface text-sm font-semibold text-foreground">Ver detalle</button><button type="button" onClick={() => { if (created) void shareQuote(created); }} className="min-h-12 rounded-xl bg-accent text-sm font-bold text-accent-foreground">Compartir ahora</button></div>}>
        <div className="rounded-2xl border border-border bg-surface-raised p-4"><p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Número de cotización</p><p className="mt-1 font-mono text-sm font-bold text-foreground">{created?.quote_number}</p><p className="mt-4 text-3xl font-bold tabular-nums text-foreground">{money(created?.total ?? 0)}</p><p className="mt-1 text-sm text-muted-foreground">Cliente: {created?.customer?.name}</p></div>
      </FormSheet>

      <FormSheet isOpen={Boolean(detail)} onClose={() => setDetail(null)} title={detail?.quote_number ?? "Detalle de cotización"} description={`${detail?.customer?.name ?? "Cliente"} · ${STATUS[detail?.status ?? ""] ?? ""}`} icon={FileText} footer={detail && ["ready_to_send", "sent", "viewed"].includes(detail.status) ? <div className="grid gap-2 sm:grid-cols-2"><button type="button" disabled={saving} onClick={() => void shareQuote(detail)} className="min-h-12 rounded-xl bg-accent text-sm font-bold text-accent-foreground disabled:opacity-50"><Send className="mr-2 inline h-4 w-4" />Compartir</button><button type="button" onClick={() => setConfirm({ quote: detail, action: "accept" })} className="min-h-12 rounded-xl border border-border bg-surface text-sm font-semibold text-foreground">Registrar aceptación</button></div> : undefined}>
        <div className="space-y-5"><div className="rounded-xl bg-surface-raised p-3 text-sm text-muted-foreground">Vigente hasta {detail && new Date(detail.valid_until).toLocaleDateString("es-MX", { day: "numeric", month: "long", year: "numeric" })}.</div>{detail?.status === "changes_requested" && <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900"><p className="font-semibold">Cambios del cliente</p>{detail.customer_change_note && <p className="mt-1.5 leading-relaxed">“{detail.customer_change_note}”</p>}<p className="mt-1.5 text-xs text-amber-800">Al preparar la nueva versión se cargarán automáticamente los artículos y cantidades solicitados.</p></div>}<section className="overflow-hidden rounded-xl border border-border"><div className="border-b border-border-soft px-3 py-3 text-sm font-bold text-foreground">Artículos cotizados</div><div className="divide-y divide-border-soft">{detail?.items?.map((item, index) => <div key={`${item.name_snapshot}-${index}`} className="flex justify-between gap-3 px-3 py-3 text-sm"><span className="min-w-0 text-foreground">{item.quantity} × {item.name_snapshot}</span><strong className="shrink-0 tabular-nums text-foreground">{money(item.subtotal)}</strong></div>)}</div><div className="flex justify-between px-3 py-4 text-base font-bold text-foreground"><span>Total</span><span>{money(detail?.total ?? 0)}</span></div></section>{["sent", "viewed"].includes(detail?.status ?? "") && <div className="grid gap-2 sm:grid-cols-2"><button type="button" onClick={() => setConfirm({ quote: detail as Quote, action: "reject" })} className="min-h-11 rounded-xl border border-red-200 bg-surface text-sm font-semibold text-red-600">Rechazar</button><button type="button" disabled={saving} onClick={() => void updateStatus(detail?.id ?? "", "changes").then(() => { setDetail(null); setMessage("Solicitud de cambio registrada. Crea una nueva versión cuando ajustes la propuesta."); }).catch((error: unknown) => setMessage(error instanceof Error ? error.message : "No pudimos registrar el cambio."))} className="min-h-11 rounded-xl border border-border bg-surface text-sm font-semibold text-foreground">Solicitar cambios</button></div>}{["changes_requested", "conversion_blocked"].includes(detail?.status ?? "") && <button type="button" disabled={saving} onClick={() => void createRevision(detail as Quote)} className="min-h-11 w-full rounded-xl bg-accent text-sm font-bold text-accent-foreground"><Undo2 className="mr-2 inline h-4 w-4" />Preparar nueva versión</button>}</div>
      </FormSheet>

      <FormSheet isOpen={Boolean(share)} onClose={() => setShare(null)} title="Compartir cotización" description="Elige un canal. La liga es privada, no aparece en buscadores y vence con la cotización." icon={Send} footer={<button type="button" onClick={() => setShare(null)} className="min-h-12 w-full rounded-xl border border-border bg-surface text-sm font-semibold text-foreground">Listo</button>}>
        <div className="space-y-4"><div className="rounded-xl bg-surface-raised p-3"><p className="text-xs font-semibold text-muted-foreground">{share?.quote.quote_number}</p><p className="mt-1 text-sm text-foreground">{share?.quote.customer?.name}</p></div><label className="block space-y-2 text-sm font-semibold text-foreground"><span>Liga privada</span><input readOnly value={share?.url ?? ""} className="input-form min-h-12 w-full rounded-xl px-3 font-mono text-xs text-foreground" /></label><div className="grid gap-2 sm:grid-cols-3"><button type="button" onClick={() => void copyShareUrl()} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-border bg-surface text-sm font-semibold text-foreground"><Copy className="h-4 w-4" />Copiar liga</button><button type="button" onClick={openWhatsApp} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-accent text-sm font-bold text-accent-foreground"><MessageCircle className="h-4 w-4" />WhatsApp</button><button type="button" onClick={openEmail} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-border bg-surface text-sm font-semibold text-foreground"><Mail className="h-4 w-4" />Correo</button></div></div>
      </FormSheet>

      <ConfirmDialog isOpen={Boolean(confirm)} onClose={() => setConfirm(null)} onConfirm={() => completeConfirm()} loading={saving} icon={confirm?.action === "accept" ? ShoppingCart : XCircle} variant={confirm?.action === "reject" ? "danger" : "default"} title={confirm?.action === "accept" ? "¿Registrar aceptación y crear la orden?" : "¿Marcar esta cotización como rechazada?"} description={confirm?.action === "accept" ? "Tlaco verificará inventario y convertirá esta cotización en una orden. Los precios quedan como fueron cotizados." : "Esta acción deja registro del rechazo. Podrás crear una nueva versión si el cliente vuelve a pedir una propuesta."} confirmLabel={confirm?.action === "accept" ? "Crear orden" : "Sí, rechazar"} />
    </div>
  );
}
