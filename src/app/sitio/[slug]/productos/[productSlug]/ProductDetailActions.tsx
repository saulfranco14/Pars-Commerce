"use client";

import { useEffect, useMemo, useState } from "react";
import { MessageCircle, ShoppingCart } from "lucide-react";

import { addItem } from "@/services/publicCartService";
import { dispatchCartUpdated } from "@/lib/cartEvents";
import { useFingerprint } from "@/hooks/useFingerprint";

type OptionGroup = { id: string; name: string; display_order: number };
type OptionValue = { id: string; option_group_id: string; label: string; swatch_hex: string | null; display_order: number };
type Variant = { id: string; price: number | string; stock: number; track_stock: boolean; image_url: string | null; selection_key: string };
type VariantValue = { variant_id: string; option_value_id: string };
type VariantData = { groups: OptionGroup[]; values: OptionValue[]; variants: Variant[]; variantValues: VariantValue[] };

interface ProductDetailActionsProps { productId: string; tenantId: string; accentColor: string; waHref: string | null; }

export default function ProductDetailActions({ productId, tenantId, accentColor, waHref }: ProductDetailActionsProps) {
  const fingerprint = useFingerprint();
  const [loading, setLoading] = useState(false);
  const [variants, setVariants] = useState<VariantData | null>(null);
  const [selected, setSelected] = useState<Record<string, string>>({});
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => { let cancelled = false; void (async () => {
    try {
      const response = await fetch(`/api/public/product-variants?product_id=${encodeURIComponent(productId)}`);
      if (!response.ok) throw new Error("No se pudieron cargar las opciones.");
      const data = await response.json() as VariantData;
      if (!cancelled) setVariants(data);
    } catch (error) { if (!cancelled) setLoadError(error instanceof Error ? error.message : "No se pudieron cargar las opciones."); }
  })(); return () => { cancelled = true; }; }, [productId]);

  const selectedVariant = useMemo(() => {
    if (!variants?.groups.length) return null;
    if (variants.groups.some((group) => !selected[group.id])) return undefined;
    const selectedValues = new Set(Object.values(selected));
    return variants.variants.find((variant) => {
      const values = variants.variantValues.filter((link) => link.variant_id === variant.id).map((link) => link.option_value_id);
      return values.length === selectedValues.size && values.every((value) => selectedValues.has(value));
    });
  }, [selected, variants]);
  const valuesByVariant = useMemo(() => {
    const result = new Map<string, Set<string>>();
    for (const link of variants?.variantValues ?? []) {
      const current = result.get(link.variant_id) ?? new Set<string>();
      current.add(link.option_value_id);
      result.set(link.variant_id, current);
    }
    return result;
  }, [variants]);

  function isValueAvailable(groupId: string, valueId: string) {
    if (!variants) return false;
    const otherSelections = Object.entries(selected)
      .filter(([selectedGroupId]) => selectedGroupId !== groupId)
      .map(([, selectedValueId]) => selectedValueId);
    return variants.variants.some((variant) => {
      const linkedValues = valuesByVariant.get(variant.id);
      if (!linkedValues?.has(valueId)) return false;
      if (!otherSelections.every((selectedValueId) => linkedValues.has(selectedValueId))) return false;
      return !variant.track_stock || variant.stock > 0;
    });
  }
  const loadingOptions = variants === null && !loadError;
  const unavailable = Boolean(selectedVariant && selectedVariant.track_stock && selectedVariant.stock <= 0);
  const needsSelection = loadingOptions || Boolean(variants?.groups.length && !selectedVariant);

  const handleAddToCart = async () => {
    if (!fingerprint || unavailable || needsSelection) return;
    setActionError(null);
    setLoading(true);
    try {
      await addItem(tenantId, productId, 1, fingerprint, selectedVariant?.id);
      dispatchCartUpdated({ label: "Producto agregado al carrito" });
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "No se pudo agregar al carrito.");
    } finally { setLoading(false); }
  };

  return <div className="mt-6 flex flex-col gap-4">
    {variants?.groups.map((group) => {
      const values = variants.values.filter((value) => value.option_group_id === group.id).sort((a, b) => a.display_order - b.display_order);
      return <fieldset key={group.id} className="rounded-2xl border border-gray-100 bg-gray-50/70 p-3 sm:p-4"><legend className="sr-only">{group.name}</legend><div className="flex items-baseline justify-between gap-3"><p className="text-sm font-bold text-gray-900">{group.name}</p><p className="truncate text-xs text-gray-500">{selected[group.id] ? values.find((value) => value.id === selected[group.id])?.label : "Elige una opción"}</p></div><div className="mt-3 flex flex-wrap gap-2">{values.map((value) => { const active = selected[group.id] === value.id; const available = isValueAvailable(group.id, value.id); return <button key={value.id} type="button" disabled={!available} aria-pressed={active} onClick={() => { setActionError(null); setSelected((current) => ({ ...current, [group.id]: value.id })); }} className={`min-h-11 rounded-xl border px-3 text-sm font-semibold transition ${active ? "border-gray-900 bg-white ring-1 ring-gray-900" : available ? "border-gray-200 bg-white hover:border-gray-400" : "cursor-not-allowed border-gray-100 bg-gray-100 text-gray-300 line-through"}`}>{value.swatch_hex ? <span className="mr-2 inline-block h-3 w-3 rounded-full align-[-1px] ring-1 ring-black/10" style={{ backgroundColor: value.swatch_hex }} /> : null}{value.label}</button>; })}</div></fieldset>;
    })}
    {loadError ? <p className="text-xs text-red-600">{loadError}</p> : null}
    {selectedVariant && <div className={`flex items-center justify-between gap-3 rounded-xl px-3 py-3 text-sm font-semibold ${unavailable ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-800"}`}><div><p className="text-[11px] font-medium uppercase tracking-wide opacity-70">Tu combinación</p><p className="mt-0.5">{selectedVariant.selection_key.replaceAll(":", " ")}</p></div><span className="shrink-0 text-right">{unavailable ? "Agotado" : <><span className="block">${Number(selectedVariant.price).toFixed(2)}</span>{selectedVariant.track_stock ? <span className="block text-xs font-medium">{selectedVariant.stock} disponibles</span> : null}</>}</span></div>}
    {needsSelection ? <p className="text-xs text-gray-500">{loadingOptions ? "Cargando opciones disponibles…" : "Elige una opción de cada grupo para continuar."}</p> : null}
    {actionError ? <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">{actionError}</p> : null}
    <button type="button" onClick={handleAddToCart} disabled={loading || !fingerprint || unavailable || needsSelection} className="flex min-h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-xl px-6 text-base font-semibold text-white transition-all hover:opacity-90 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50" style={{ backgroundColor: accentColor }}><ShoppingCart className="h-5 w-5" />{loading ? "Agregando…" : loadingOptions ? "Cargando opciones…" : unavailable ? "Agotado" : needsSelection ? "Elige talla y color" : "Agregar al carrito"}</button>
    {waHref && <a href={waHref} target="_blank" rel="noopener noreferrer" className="flex min-h-12 cursor-pointer items-center justify-center gap-2 rounded-xl border-2 px-6 text-base font-semibold transition-all hover:opacity-90" style={{ borderColor: accentColor, color: accentColor }}><MessageCircle className="h-5 w-5" />Consultar por WhatsApp</a>}
  </div>;
}
