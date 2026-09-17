"use client";

import { useMemo, useState } from "react";
import useSWR from "swr";
import { ClipboardCheck } from "lucide-react";

import { FormSheet } from "@/components/ui/FormSheet";
import { swrFetcher } from "@/lib/swrFetcher";

type CatalogItem = {
  id: string;
  name: string;
  price: number;
  type: "product" | "service";
};

export type CreatedQuote = {
  id: string;
  quote_number: string;
  total: number | string;
  valid_until: string;
  status: string;
  customer: { name: string; phone: string | null };
  items: Array<{
    name_snapshot: string;
    quantity: number;
    unit_price: number;
    subtotal: number;
  }>;
};

type Props = {
  isOpen: boolean;
  onClose: () => void;
  tenantId: string;
  onCreated: (quote: CreatedQuote) => void;
};

const money = (amount: number) =>
  new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(amount);

/**
 * The same focused quote composer is used from Inicio and Cotizaciones.  A
 * person can start a proposal without losing their operational context.
 */
export function NewQuoteSheet({ isOpen, onClose, tenantId, onCreated }: Props) {
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [selected, setSelected] = useState<Record<string, number>>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const productsKey = isOpen ? `/api/products?tenant_id=${encodeURIComponent(tenantId)}` : null;
  const { data: products = [], isLoading } = useSWR<CatalogItem[]>(productsKey, swrFetcher, { fallbackData: [] });

  const chosen = useMemo(
    () => Object.entries(selected)
      .filter(([, quantity]) => quantity > 0)
      .map(([product_id, quantity]) => ({ product_id, quantity })),
    [selected],
  );
  const chosenTotal = useMemo(
    () => chosen.reduce((total, item) => total + (products.find((product) => product.id === item.product_id)?.price ?? 0) * item.quantity, 0),
    [chosen, products],
  );

  function close() {
    if (saving) return;
    setError(null);
    onClose();
  }

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
    if (!customerName.trim() || chosen.length === 0) {
      setError("Indica el nombre del cliente y al menos un producto o servicio.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const response = await fetch("/api/quotes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenant_id: tenantId,
          customer: { name: customerName, phone: customerPhone || undefined },
          items: chosen,
        }),
      });
      const result = await response.json() as { error?: string; quote?: Omit<CreatedQuote, "customer" | "items"> };
      if (!response.ok || !result.quote) throw new Error(result.error ?? "No pudimos crear la cotización.");

      const productById = new Map(products.map((product) => [product.id, product]));
      onCreated({
        ...result.quote,
        customer: { name: customerName.trim(), phone: customerPhone || null },
        items: chosen.map((item) => {
          const product = productById.get(item.product_id);
          const price = Number(product?.price ?? 0);
          return { name_snapshot: product?.name ?? "Artículo", quantity: item.quantity, unit_price: price, subtotal: price * item.quantity };
        }),
      });
      setCustomerName("");
      setCustomerPhone("");
      setSelected({});
      onClose();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "No pudimos crear la cotización.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <FormSheet
      isOpen={isOpen}
      onClose={close}
      dismissible={!saving}
      title="Nueva cotización"
      description="El precio queda guardado aunque cambie tu catálogo."
      icon={ClipboardCheck}
      footer={<button type="button" disabled={saving || isLoading} onClick={() => void createQuote()} className="min-h-12 w-full rounded-xl bg-accent px-4 text-sm font-bold text-accent-foreground disabled:opacity-50">{saving ? "Creando…" : "Crear cotización"}</button>}
    >
      <div className="space-y-5">
        {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">{error}</p>}
        <label className="block space-y-2 text-sm font-semibold text-foreground">
          <span>Nombre del cliente</span>
          <input value={customerName} onChange={(event) => setCustomerName(event.target.value)} className="input-form min-h-12 w-full rounded-xl px-3 text-base text-foreground placeholder:text-muted focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20" placeholder="Ej. Selena García" />
        </label>
        <label className="block space-y-2 text-sm font-semibold text-foreground">
          <span>WhatsApp <span className="font-normal text-muted-foreground">(opcional)</span></span>
          <input value={customerPhone} onChange={(event) => setCustomerPhone(event.target.value)} inputMode="tel" className="input-form min-h-12 w-full rounded-xl px-3 text-base text-foreground placeholder:text-muted focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20" placeholder="Ej. 55 1234 5678" />
          <span className="block text-xs font-normal text-muted-foreground">Lo usaremos sólo para abrir el mensaje listo para enviar.</span>
        </label>
        <section aria-labelledby="quote-catalog-title">
          <div className="flex items-end justify-between gap-3">
            <div>
              <h3 id="quote-catalog-title" className="text-sm font-bold text-foreground">Productos y servicios</h3>
              <p className="mt-1 text-xs text-muted-foreground">Selecciona lo que el cliente está cotizando.</p>
            </div>
            <p className="shrink-0 text-sm font-bold tabular-nums text-accent">{money(chosenTotal)}</p>
          </div>
          <div className="mt-3 max-h-80 space-y-2 overflow-auto pr-1">
            {isLoading ? <p className="rounded-xl bg-surface-raised px-3 py-4 text-sm text-muted-foreground">Cargando catálogo…</p> : products.map((product) => {
              const quantity = selected[product.id] ?? 0;
              return <div key={product.id} className={`flex min-h-16 items-center gap-3 rounded-xl border p-3 transition-colors ${quantity ? "border-accent/50 bg-accent/5" : "border-border bg-surface-raised"}`}>
                <button type="button" aria-label={quantity ? `Quitar ${product.name}` : `Agregar ${product.name}`} onClick={() => changeQuantity(product.id, quantity ? -quantity : 1)} className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border text-sm font-bold ${quantity ? "border-accent bg-accent text-accent-foreground" : "border-border bg-surface text-muted-foreground"}`}>{quantity ? "✓" : "+"}</button>
                <div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold text-foreground">{product.name}</p><p className="mt-0.5 text-xs text-muted-foreground">{product.type === "service" ? "Servicio" : "Producto"} · {money(product.price)}</p></div>
                {quantity > 0 && <div className="flex min-h-10 items-center rounded-lg border border-border bg-surface"><button type="button" aria-label={`Restar ${product.name}`} onClick={() => changeQuantity(product.id, -1)} className="flex h-10 w-9 items-center justify-center text-lg text-muted-foreground hover:text-foreground">−</button><span className="w-7 text-center text-sm font-bold tabular-nums text-foreground">{quantity}</span><button type="button" aria-label={`Sumar ${product.name}`} onClick={() => changeQuantity(product.id, 1)} className="flex h-10 w-9 items-center justify-center text-lg text-accent hover:bg-accent/5">+</button></div>}
              </div>;
            })}
          </div>
        </section>
      </div>
    </FormSheet>
  );
}
