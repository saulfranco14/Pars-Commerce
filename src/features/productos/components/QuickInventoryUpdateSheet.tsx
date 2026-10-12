"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Boxes,
  CircleDollarSign,
  LoaderCircle,
  PackageCheck,
  SlidersHorizontal,
} from "lucide-react";

import { FormSheet } from "@/components/ui/FormSheet";
import { btnPrimaryFlex, btnSecondary } from "@/components/ui/buttonClasses";
import { quickInventoryUpdate } from "@/services/productsService";
import type { ProductListItem } from "@/types/products";

type Variant = {
  id: string;
  selection_key: string;
  price: number;
  stock: number;
  is_active: boolean;
  archived_at: string | null;
};

type CommerceDetails = {
  product?: { has_variants?: boolean } | null;
  variants?: Variant[];
};

type UpdateMode = "receive" | "set" | "price";

type QuickInventoryUpdateSheetProps = {
  product: ProductListItem | null;
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => Promise<void> | void;
};

const inputClassName =
  "mt-1.5 min-h-12 w-full rounded-xl border border-border bg-surface px-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted focus:border-accent focus:ring-2 focus:ring-accent/15";

/**
 * Intent: a shop owner receiving a box of stock between customers needs one
 * fast, auditable action instead of the full product form.
 * Palette: Tlaco blue signals the selected operational action; calm neutral
 * surfaces separate stock, price and variant context without noisy cards.
 * Depth: borders plus a single quiet raised sheet so the count stays primary.
 * Spacing: 4px base, 44px+ touch controls, one-column form on mobile.
 */
export function QuickInventoryUpdateSheet({
  product,
  isOpen,
  onClose,
  onSaved,
}: QuickInventoryUpdateSheetProps) {
  const [details, setDetails] = useState<CommerceDetails | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [mode, setMode] = useState<UpdateMode>("receive");
  const [variantId, setVariantId] = useState<string | null>(null);
  const [quantity, setQuantity] = useState("");
  const [price, setPrice] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const variants = useMemo(
    () => (details?.variants ?? []).filter((variant) => variant.is_active && !variant.archived_at),
    [details],
  );
  const hasVariants = details?.product?.has_variants === true;
  const selectedVariant = variants.find((variant) => variant.id === variantId) ?? null;
  const currentStock = selectedVariant ? Number(selectedVariant.stock) : Number(product?.stock ?? 0);
  const currentPrice = selectedVariant ? Number(selectedVariant.price) : Number(product?.price ?? 0);
  const tracksStock = product?.track_stock !== false;

  useEffect(() => {
    if (!isOpen || !product) return;
    const controller = new AbortController();
    setDetails(null);
    setLoadingDetails(true);
    setMode(tracksStock ? "receive" : "price");
    setVariantId(null);
    setQuantity("");
    setPrice("");
    setNote("");
    setError(null);

    void fetch(`/api/products/${encodeURIComponent(product.id)}/commerce-details`, {
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok) throw new Error("No se pudo cargar el detalle del producto.");
        return response.json() as Promise<CommerceDetails>;
      })
      .then((payload) => {
        setDetails(payload);
        const firstVariant = (payload.variants ?? []).find(
          (variant) => variant.is_active && !variant.archived_at,
        );
        setVariantId(firstVariant?.id ?? null);
      })
      .catch((fetchError: unknown) => {
        if (fetchError instanceof DOMException && fetchError.name === "AbortError") return;
        setError(fetchError instanceof Error ? fetchError.message : "No se pudo cargar el producto.");
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoadingDetails(false);
      });

    return () => controller.abort();
  }, [isOpen, product, tracksStock]);

  function selectMode(nextMode: UpdateMode) {
    setMode(nextMode);
    setError(null);
    setPrice(nextMode === "price" ? String(currentPrice) : "");
    setQuantity(nextMode === "set" ? String(currentStock) : "");
  }

  function selectVariant(nextVariantId: string) {
    setVariantId(nextVariantId);
    setError(null);
    const nextVariant = variants.find((variant) => variant.id === nextVariantId);
    if (!nextVariant) return;
    setQuantity(mode === "set" ? String(nextVariant.stock) : "");
    setPrice(mode === "price" ? String(nextVariant.price) : "");
  }

  const previewStock = mode === "receive"
    ? currentStock + Math.max(0, Number.parseInt(quantity || "0", 10) || 0)
    : mode === "set"
      ? Math.max(0, Number.parseInt(quantity || "0", 10) || 0)
      : currentStock;

  async function save() {
    if (!product || saving || loadingDetails) return;
    if (hasVariants && !selectedVariant) {
      setError("Elige la talla o color que quieres actualizar.");
      return;
    }
    const nextQuantity = mode === "price" ? null : Number.parseInt(quantity, 10);
    const hasValidQuantity = typeof nextQuantity === "number"
      && Number.isInteger(nextQuantity)
      && nextQuantity >= 0
      && (mode !== "receive" || nextQuantity > 0);
    if (mode !== "price" && !hasValidQuantity) {
      setError(mode === "receive" ? "Indica cuántas piezas llegaron." : "Indica el conteo físico actual.");
      return;
    }
    const nextPrice = mode === "price" && price.trim() ? Number(price) : null;
    if (mode === "price" && (nextPrice === null || !Number.isFinite(nextPrice) || nextPrice < 0)) {
      setError("Indica un precio válido.");
      return;
    }
    if (mode === "set" && !note.trim()) {
      setError("Describe brevemente por qué ajustas el conteo.");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      await quickInventoryUpdate(product.id, {
        variantId: selectedVariant?.id ?? null,
        stockOperation: mode === "set" ? "set" : "receive",
        stockQuantity: nextQuantity,
        price: nextPrice,
        note,
      });
      await onSaved();
      onClose();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "No se pudo guardar el ajuste.");
    } finally {
      setSaving(false);
    }
  }

  if (!product) return null;

  return (
    <FormSheet
      isOpen={isOpen}
      onClose={saving ? () => undefined : onClose}
      dismissible={!saving}
      icon={Boxes}
      title={`Actualizar ${product.name}`}
      description="Registra una entrada, corrige el conteo o cambia un precio sin abrir la ficha completa."
      maxWidth="max-w-lg"
      footer={
        <div className="flex flex-col gap-2 sm:flex-row-reverse">
          <button type="button" onClick={() => void save()} disabled={saving || loadingDetails} className={`${btnPrimaryFlex} w-full`}>
            {saving ? <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden /> : <PackageCheck className="h-4 w-4" aria-hidden />}
            {saving ? "Guardando…" : mode === "receive" ? "Registrar entrada" : mode === "set" ? "Guardar conteo" : "Guardar precio"}
          </button>
          <button type="button" onClick={onClose} disabled={saving} className={`${btnSecondary} w-full sm:flex-1`}>
            Cancelar
          </button>
        </div>
      }
    >
      {loadingDetails ? (
        <div className="flex min-h-48 items-center justify-center gap-2 text-sm text-muted">
          <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden />
          Preparando inventario…
        </div>
      ) : (
        <div className="space-y-5 pb-1">
          {hasVariants ? (
            <section aria-labelledby="variant-title">
              <div className="mb-2 flex items-baseline justify-between gap-3">
                <div>
                  <h3 id="variant-title" className="text-sm font-bold text-foreground">Elige una combinación</h3>
                  <p className="mt-0.5 text-xs text-muted">Cada talla o color conserva sus propias existencias.</p>
                </div>
              </div>
              <div className="max-h-56 space-y-2 overflow-y-auto pr-1">
                {variants.map((variant) => {
                  const selected = variant.id === selectedVariant?.id;
                  return (
                    <button
                      key={variant.id}
                      type="button"
                      onClick={() => selectVariant(variant.id)}
                      aria-pressed={selected}
                      className={`flex min-h-12 w-full items-center justify-between gap-3 rounded-xl border px-3 text-left transition-colors ${selected ? "border-accent bg-accent/5 ring-1 ring-accent/15" : "border-border bg-surface-raised hover:bg-border-soft/50"}`}
                    >
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-semibold text-foreground">{variant.selection_key.replaceAll("Talla:", "").replaceAll("Color:", "")}</span>
                        <span className="text-xs text-muted">${Number(variant.price).toFixed(2)}</span>
                      </span>
                      <span className={`shrink-0 text-sm font-bold ${Number(variant.stock) > 0 ? "text-emerald-700" : "text-amber-700"}`}>{variant.stock} pzas.</span>
                    </button>
                  );
                })}
              </div>
            </section>
          ) : null}

          <section aria-labelledby="quick-update-title">
            <h3 id="quick-update-title" className="text-sm font-bold text-foreground">¿Qué quieres actualizar?</h3>
            <div className="mt-2 grid gap-2 sm:grid-cols-3">
              {tracksStock ? <ModeButton icon={PackageCheck} selected={mode === "receive"} title="Recibí mercancía" detail="Suma piezas" onClick={() => selectMode("receive")} /> : null}
              {tracksStock ? <ModeButton icon={SlidersHorizontal} selected={mode === "set"} title="Ajustar conteo" detail="Fija existencias" onClick={() => selectMode("set")} /> : null}
              <ModeButton icon={CircleDollarSign} selected={mode === "price"} title="Cambiar precio" detail="Actualiza venta" onClick={() => selectMode("price")} />
            </div>
          </section>

          {mode !== "price" ? (
            <section className="rounded-2xl border border-border bg-surface-raised p-4">
              <div className="flex items-baseline justify-between gap-3">
                <div>
                  <p className="text-sm font-bold text-foreground">{mode === "receive" ? "Piezas que llegaron" : "Conteo físico actual"}</p>
                  <p className="mt-0.5 text-xs text-muted">Ahora hay {currentStock} {currentStock === 1 ? "pieza" : "piezas"}.</p>
                </div>
                <p className="text-sm font-bold text-accent">Quedarán {previewStock}</p>
              </div>
              <input
                type="number"
                min="0"
                step="1"
                value={quantity}
                onChange={(event) => setQuantity(event.target.value)}
                inputMode="numeric"
                autoFocus
                placeholder={mode === "receive" ? "Ej. 12" : "Ej. 25"}
                className={inputClassName}
                aria-label={mode === "receive" ? "Piezas recibidas" : "Conteo físico actual"}
              />
              <p className="mt-2 text-xs text-muted">{mode === "receive" ? "Se sumarán al inventario actual y quedará registrado como entrada." : "Este conteo reemplaza el actual; conserva una nota para que el equipo entienda el cambio."}</p>
              <label className="mt-3 block text-sm font-semibold text-foreground">
                {mode === "set" ? "Motivo del ajuste" : "Nota de recepción (opcional)"}
                <input value={note} onChange={(event) => setNote(event.target.value)} placeholder={mode === "set" ? "Ej. Conteo después de merma" : "Ej. Entrega del proveedor"} className={inputClassName} />
              </label>
            </section>
          ) : (
            <section className="rounded-2xl border border-border bg-surface-raised p-4">
              <p className="text-sm font-bold text-foreground">Nuevo precio de venta</p>
              <p className="mt-0.5 text-xs text-muted">Precio actual: ${currentPrice.toFixed(2)}.</p>
              <input type="number" min="0" step="0.01" value={price} onChange={(event) => setPrice(event.target.value)} inputMode="decimal" autoFocus className={inputClassName} aria-label="Nuevo precio de venta" />
              <label className="mt-3 block text-sm font-semibold text-foreground">
                Nota (opcional)
                <input value={note} onChange={(event) => setNote(event.target.value)} placeholder="Ej. Precio de temporada" className={inputClassName} />
              </label>
            </section>
          )}

          {error ? <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">{error}</p> : null}
        </div>
      )}
    </FormSheet>
  );
}

function ModeButton({
  icon: Icon,
  selected,
  title,
  detail,
  onClick,
}: {
  icon: typeof PackageCheck;
  selected: boolean;
  title: string;
  detail: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={`flex min-h-16 items-center gap-3 rounded-xl border px-3 text-left transition-colors ${selected ? "border-accent bg-accent/5 ring-1 ring-accent/15" : "border-border bg-surface-raised hover:bg-border-soft/50"}`}
    >
      <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${selected ? "bg-accent text-accent-foreground" : "bg-border-soft text-muted"}`}>
        <Icon className="h-4 w-4" aria-hidden />
      </span>
      <span className="min-w-0"><span className="block text-sm font-bold text-foreground">{title}</span><span className="block text-xs text-muted">{detail}</span></span>
    </button>
  );
}
