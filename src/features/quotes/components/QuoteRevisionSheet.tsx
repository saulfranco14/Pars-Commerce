"use client";

import { useEffect, useMemo, useState } from "react";
import useSWR from "swr";
import { PencilLine } from "lucide-react";

import { FormSheet } from "@/components/ui/FormSheet";
import { swrFetcher } from "@/lib/swrFetcher";

type CatalogItem = { id: string; name: string; price: number; type: "product" | "service" };
export type DraftQuote = {
  id: string;
  quote_number: string;
  version?: number;
  items?: Array<{ product_id?: string; quantity: number }>;
};

type Props = {
  isOpen: boolean;
  onClose: () => void;
  tenantId: string;
  quote: DraftQuote | null;
  onSaved: () => void;
};

const money = (amount: number) => new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(amount);

/** Edit only the copied draft, never the proposal the customer already saw. */
export function QuoteRevisionSheet({ isOpen, onClose, tenantId, quote, onSaved }: Props) {
  const [selected, setSelected] = useState<Record<string, number>>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const productsKey = isOpen ? `/api/products?tenant_id=${encodeURIComponent(tenantId)}` : null;
  const { data: products = [], isLoading } = useSWR<CatalogItem[]>(productsKey, swrFetcher, { fallbackData: [] });

  useEffect(() => {
    if (!isOpen || !quote) return;
    const next: Record<string, number> = {};
    for (const item of quote.items ?? []) {
      if (item.product_id) next[item.product_id] = (next[item.product_id] ?? 0) + Number(item.quantity);
    }
    setSelected(next);
    setError(null);
  }, [isOpen, quote]);

  const chosen = useMemo(() => Object.entries(selected).filter(([, quantity]) => quantity > 0).map(([product_id, quantity]) => ({ product_id, quantity })), [selected]);
  const total = useMemo(() => chosen.reduce((sum, item) => sum + (products.find((product) => product.id === item.product_id)?.price ?? 0) * item.quantity, 0), [chosen, products]);

  function changeQuantity(productId: string, delta: number) {
    setSelected((current) => {
      const quantity = Math.max(0, (current[productId] ?? 0) + delta);
      if (quantity === 0) {
        const next = { ...current };
        delete next[productId];
        return next;
      }
      return { ...current, [productId]: quantity };
    });
  }

  async function save() {
    if (!quote || chosen.length === 0) {
      setError("La nueva versión necesita al menos un producto o servicio.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const response = await fetch(`/api/quotes/${quote.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ items: chosen }) });
      const result = await response.json() as { error?: string };
      if (!response.ok) throw new Error(result.error ?? "No pudimos guardar la nueva versión.");
      onSaved();
      onClose();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "No pudimos guardar la nueva versión.");
    } finally {
      setSaving(false);
    }
  }

  return <FormSheet isOpen={isOpen} onClose={onClose} dismissible={!saving} title="Ajustar nueva versión" description={`${quote?.quote_number ?? "Cotización"}${quote?.version ? ` · versión ${quote.version}` : ""}. La versión anterior queda intacta.`} icon={PencilLine} footer={<button type="button" disabled={saving || isLoading} onClick={() => void save()} className="min-h-12 w-full rounded-xl bg-accent px-4 text-sm font-bold text-accent-foreground disabled:opacity-50">{saving ? "Guardando…" : "Guardar y dejar lista para compartir"}</button>}>
    <div className="space-y-4">
      <div className="rounded-xl border border-accent/20 bg-accent/5 px-3 py-3"><p className="text-sm font-semibold text-foreground">El cliente pidió cambios</p><p className="mt-1 text-xs text-muted-foreground">Edita cantidades, agrega o quita artículos. Al guardar, podrás compartir esta nueva versión.</p></div>
      {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">{error}</p>}
      <section aria-labelledby="revision-items-title"><div className="flex items-end justify-between gap-3"><div><h3 id="revision-items-title" className="text-sm font-bold text-foreground">Productos y servicios</h3><p className="mt-1 text-xs text-muted-foreground">Los precios actuales se congelarán al guardar.</p></div><p className="shrink-0 text-sm font-bold tabular-nums text-accent">{money(total)}</p></div><div className="mt-3 max-h-80 space-y-2 overflow-auto pr-1">{isLoading ? <p className="rounded-xl bg-surface-raised px-3 py-4 text-sm text-muted-foreground">Cargando catálogo…</p> : products.map((product) => { const quantity = selected[product.id] ?? 0; return <div key={product.id} className={`flex min-h-16 items-center gap-3 rounded-xl border p-3 ${quantity ? "border-accent/50 bg-accent/5" : "border-border bg-surface-raised"}`}><button type="button" aria-label={quantity ? `Quitar ${product.name}` : `Agregar ${product.name}`} onClick={() => changeQuantity(product.id, quantity ? -quantity : 1)} className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border text-sm font-bold ${quantity ? "border-accent bg-accent text-accent-foreground" : "border-border bg-surface text-muted-foreground"}`}>{quantity ? "✓" : "+"}</button><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold text-foreground">{product.name}</p><p className="mt-0.5 text-xs text-muted-foreground">{product.type === "service" ? "Servicio" : "Producto"} · {money(product.price)}</p></div>{quantity > 0 && <div className="flex min-h-10 items-center rounded-lg border border-border bg-surface"><button type="button" aria-label={`Restar ${product.name}`} onClick={() => changeQuantity(product.id, -1)} className="flex h-10 w-9 items-center justify-center text-lg text-muted-foreground">−</button><span className="w-7 text-center text-sm font-bold tabular-nums text-foreground">{quantity}</span><button type="button" aria-label={`Sumar ${product.name}`} onClick={() => changeQuantity(product.id, 1)} className="flex h-10 w-9 items-center justify-center text-lg text-accent">+</button></div>}</div>; })}</div></section>
    </div>
  </FormSheet>;
}
