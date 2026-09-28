"use client";

import { useMemo, useState } from "react";
import { ClipboardCheck, PackagePlus } from "lucide-react";

import { FormSheet } from "@/components/ui/FormSheet";
import { LineItemComposer, type LineItemDraft } from "@/features/line-item-composer/LineItemComposer";

export type CreatedQuote = {
  id: string;
  quote_number: string;
  total: number | string;
  valid_until: string;
  status: string;
  customer: { name: string; phone: string | null };
  items: Array<{ name_snapshot: string; quantity: number; unit_price: number; subtotal: number }>;
};

type Props = { isOpen: boolean; onClose: () => void; tenantId: string; onCreated: (quote: CreatedQuote) => void };

/** Creates quote details first, then uses the same Ticket vivo as an order. */
export function NewQuoteSheet({ isOpen, onClose, tenantId, onCreated }: Props) {
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [items, setItems] = useState<LineItemDraft[]>([]);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const itemCount = useMemo(() => items.reduce((sum, item) => sum + item.quantity, 0), [items]);

  function close() {
    if (saving) return;
    setError(null);
    onClose();
  }

  async function createQuote() {
    if (!customerName.trim() || items.length === 0) {
      setError("Indica el nombre del cliente y agrega al menos un producto o servicio.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const response = await fetch("/api/quotes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenant_id: tenantId, customer: { name: customerName, phone: customerPhone || undefined }, items }),
      });
      const result = await response.json() as { error?: string; quote?: Omit<CreatedQuote, "customer" | "items"> };
      if (!response.ok || !result.quote) throw new Error(result.error ?? "No pudimos crear la cotización.");
      onCreated({
        ...result.quote,
        customer: { name: customerName.trim(), phone: customerPhone || null },
        // The list is refreshed by the screen after creation; keeping the
        // callback compact prevents a second catalogue request here.
        items: [],
      });
      setCustomerName("");
      setCustomerPhone("");
      setItems([]);
      onClose();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "No pudimos crear la cotización.");
    } finally {
      setSaving(false);
    }
  }

  return <>
    <FormSheet
      isOpen={isOpen && !pickerOpen}
      onClose={close}
      dismissible={!saving}
      title="Nueva cotización"
      description="El precio queda guardado aunque cambie tu catálogo."
      icon={ClipboardCheck}
      footer={<button type="button" disabled={saving} onClick={() => void createQuote()} className="min-h-12 w-full rounded-xl bg-accent px-4 text-sm font-bold text-accent-foreground disabled:opacity-50">{saving ? "Creando…" : "Crear cotización"}</button>}
    >
      <div className="space-y-5">
        {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">{error}</p>}
        <label className="block space-y-2 text-sm font-semibold text-foreground"><span>Nombre del cliente</span><input value={customerName} onChange={(event) => setCustomerName(event.target.value)} className="input-form min-h-12 w-full rounded-xl px-3 text-base text-foreground placeholder:text-muted focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20" placeholder="Ej. Selena García" /></label>
        <label className="block space-y-2 text-sm font-semibold text-foreground"><span>WhatsApp <span className="font-normal text-muted-foreground">(opcional)</span></span><input value={customerPhone} onChange={(event) => setCustomerPhone(event.target.value)} inputMode="tel" className="input-form min-h-12 w-full rounded-xl px-3 text-base text-foreground placeholder:text-muted focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20" placeholder="Ej. 55 1234 5678" /><span className="block text-xs font-normal text-muted-foreground">Lo usaremos sólo para abrir el mensaje listo para enviar.</span></label>
        <section className="rounded-xl border border-border bg-surface-raised p-4"><div className="flex items-start gap-3"><span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent/10 text-accent"><PackagePlus className="h-5 w-5" /></span><div className="min-w-0 flex-1"><h3 className="text-sm font-bold text-foreground">Productos y servicios</h3><p className="mt-1 text-xs text-muted-foreground">{itemCount ? `${itemCount} artículos listos para cotizar.` : "Arma la cotización completa antes de guardarla."}</p></div></div><button type="button" onClick={() => setPickerOpen(true)} className="mt-4 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border border-accent/30 bg-accent/5 px-4 text-sm font-bold text-accent hover:bg-accent hover:text-accent-foreground">{itemCount ? "Editar artículos" : "Seleccionar artículos"}</button></section>
      </div>
    </FormSheet>
    <LineItemComposer tenantId={tenantId} documentKey="quote:new" isOpen={pickerOpen} onClose={() => setPickerOpen(false)} initialItems={items} title="Armar cotización" commitLabel="Usar esta selección" onCommit={async (selection) => { setItems(selection); setPickerOpen(false); }} />
  </>;
}
