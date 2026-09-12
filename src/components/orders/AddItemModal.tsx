"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import useSWR from "swr";
import type { ProductListItem } from "@/types/products";
import type { Subcatalog } from "@/types/subcatalogs";
import { create as createOrderItem } from "@/services/orderItemsService";
import { ProductSearchCombobox } from "./ProductSearchCombobox";
import { swrFetcher } from "@/lib/swrFetcher";
import { Package, Plus, Wrench, X } from "lucide-react";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { btnPrimaryFlex, btnSecondaryFlex } from "@/components/ui/buttonClasses";
import { TouchStepper } from "@/components/ui/TouchStepper";
import {
  DEBOUNCE_MS,
  SERVER_SEARCH_MIN_CHARS,
} from "@/features/orders/constants/search";
import type { AddItemModalProps } from "@/features/orders/interfaces/addItemModal";

const subcatalogsKey = (tid: string) =>
  `/api/subcatalogs?tenant_id=${encodeURIComponent(tid)}`;
const productsKey = (
  tid: string,
  subcatalogId?: string,
  q?: string,
): string | null => {
  if (!tid) return null;
  const params = new URLSearchParams({ tenant_id: tid });
  if (subcatalogId) params.set("subcatalog_id", subcatalogId);
  if (q && q.trim().length >= SERVER_SEARCH_MIN_CHARS)
    params.set("q", q.trim());
  return `/api/products?${params}`;
};

export function AddItemModal({
  tenantId,
  orderId,
  isOpen,
  onClose,
  onAdded,
}: AddItemModalProps) {
  const [subcatalogId, setSubcatalogId] = useState("");
  const [productId, setProductId] = useState("");
  const [selectedProduct, setSelectedProduct] =
    useState<ProductListItem | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(false);
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [error, setError] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const subcatalogsKeyValue = tenantId ? subcatalogsKey(tenantId) : null;
  const { data: subcatalogsData } = useSWR<Subcatalog[]>(
    subcatalogsKeyValue,
    swrFetcher,
    { fallbackData: [] },
  );
  const subcatalogs = Array.isArray(subcatalogsData) ? subcatalogsData : [];
  const hasSubcatalogs = subcatalogs.length > 0;
  const useServerSearch = hasSubcatalogs && !subcatalogId;

  const productsKeyValue =
    tenantId && !useServerSearch
      ? productsKey(tenantId, subcatalogId || undefined)
      : useServerSearch &&
          debouncedQuery.trim().length >= SERVER_SEARCH_MIN_CHARS
        ? productsKey(tenantId, undefined, debouncedQuery)
        : null;

  const { data: productsData, isLoading: searching } = useSWR<
    ProductListItem[]
  >(productsKeyValue, swrFetcher, {
    fallbackData: [],
    revalidateOnFocus: false,
  });

  const products =
    useServerSearch && debouncedQuery.trim().length < SERVER_SEARCH_MIN_CHARS
      ? []
      : Array.isArray(productsData)
        ? productsData
        : [];

  const handleQueryChange = useCallback(
    (query: string) => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      if (!useServerSearch) return;
      debounceRef.current = setTimeout(() => {
        debounceRef.current = null;
        setDebouncedQuery(query);
      }, DEBOUNCE_MS);
    },
    [useServerSearch],
  );

  useEffect(() => {
    if (!isOpen) return;
    setError(null);
    setProductId("");
    setSelectedProduct(null);
    setQuantity(1);
    setSubcatalogId("");
    setDebouncedQuery("");
  }, [isOpen, tenantId]);

  useEffect(() => {
    setProductId("");
    setSelectedProduct(null);
  }, [subcatalogId]);

  useEffect(() => {
    if (!productId) {
      setSelectedProduct(null);
      return;
    }
    const product = products.find((item) => item.id === productId);
    if (product) setSelectedProduct(product);
  }, [productId, products]);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  const selected = selectedProduct ?? products.find((p) => p.id === productId);
  const unitPrice = selected ? Number(selected.price) : 0;
  const effectiveUnitPrice =
    selected?.wholesale_min_quantity != null &&
    selected?.wholesale_price != null &&
    quantity >= selected.wholesale_min_quantity
      ? Number(selected.wholesale_price)
      : unitPrice;
  const isWholesale = selected != null && effectiveUnitPrice !== unitPrice;
  const subtotal = effectiveUnitPrice * quantity;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!productId || quantity < 1) return;
    setError(null);
    setLoading(true);
    try {
      await createOrderItem({
        order_id: orderId,
        product_id: productId,
        quantity,
      });
      onAdded();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al agregar");
    } finally {
      setLoading(false);
    }
  }

  if (!isOpen) return null;

  const inputBase =
    "input-form block w-full min-h-11 rounded-xl border border-border px-3 py-2.5 text-base text-foreground focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 disabled:opacity-50";
  const selectClass =
    inputBase +
    " mt-1 appearance-none bg-[url('data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2224%22 height=%2224%22 viewBox=%220 0 24 24%22 fill=%22none%22 stroke=%22%2378716c%22 stroke-width=%222%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22%3E%3Cpath d=%22m6 9 6 6 6-6%22/%3E%3C/svg%3E')] bg-[length:1.25rem] bg-[right_0.5rem_center] bg-no-repeat pr-10";

  const formContent = (
    <form onSubmit={handleSubmit} className="space-y-3">
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}
      {hasSubcatalogs && (
        <div>
          <label
            htmlFor="add-item-subcatalog"
            className="block text-sm font-medium text-muted-foreground"
          >
            Categoría
          </label>
          <select
            id="add-item-subcatalog"
            value={subcatalogId}
            onChange={(e) => setSubcatalogId(e.target.value)}
            className={selectClass}
            disabled={loading}
            aria-describedby="add-item-subcatalog-hint"
          >
            <option value="">Todas las categorías</option>
            {subcatalogs.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
          <p id="add-item-subcatalog-hint" className="mt-1 text-xs text-muted">
            {subcatalogId
              ? `Mostrando solo productos de ${subcatalogs.find((s) => s.id === subcatalogId)?.name ?? ""}`
              : "Elige una categoría o busca por nombre en todo tu catálogo"}
          </p>
        </div>
      )}
      <div>
        <label
          htmlFor="add-item-product"
          className="block text-sm font-medium text-muted-foreground"
        >
        ¿Qué vas a agregar?
        </label>
        <div className="mt-1" id="add-item-product">
          <ProductSearchCombobox
            products={products}
            value={productId}
            onChange={setProductId}
            selectedProduct={selectedProduct}
            placeholder={
              useServerSearch
                ? "Escribe al menos 2 caracteres para buscar..."
                : "Buscar por nombre..."
            }
            disabled={loading}
            searchMode={useServerSearch ? "server" : "client"}
            onQueryChange={useServerSearch ? handleQueryChange : undefined}
            isSearching={searching}
            emptyHint={
              useServerSearch
                ? "Escribe para buscar en todos los productos"
                : undefined
            }
          />
        </div>
      </div>
      {selected && (
        <div className="rounded-xl border border-border bg-surface-raised p-3">
          <div className="flex items-center gap-3">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border bg-border-soft/50">
              {selected.image_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={selected.image_url}
                  alt=""
                  className="h-full w-full object-cover"
                />
              ) : selected.type === "service" ? (
                <Wrench className="h-5 w-5 text-accent" aria-hidden />
              ) : (
                <Package className="h-5 w-5 text-muted" aria-hidden />
              )}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-foreground">
                {selected.name}
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {selected.type === "service" ? "Servicio" : "Producto"} · ${effectiveUnitPrice.toFixed(2)} c/u
              </p>
            </div>
            {isWholesale && (
              <span className="rounded-full bg-emerald-500/10 px-2 py-1 text-[10px] font-semibold text-emerald-700">
                Mayoreo
              </span>
            )}
          </div>
          <div className="mt-3 border-t border-border pt-3">
            <label
              id="add-item-quantity-label"
              className="block text-sm font-medium text-muted-foreground"
            >
              Cantidad
            </label>
            <div className="mt-2">
              <div className="md:hidden" aria-labelledby="add-item-quantity-label">
                <TouchStepper
                  value={quantity}
                  onChange={setQuantity}
                  min={1}
                  disabled={loading}
                />
              </div>
              <div
                className="hidden md:flex md:items-center md:gap-2"
                aria-labelledby="add-item-quantity-label"
              >
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  disabled={loading || quantity <= 1}
                  className="flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-xl border border-border bg-surface-raised text-foreground transition-colors hover:bg-border-soft disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/20"
                  aria-label="Disminuir cantidad"
                >
                  −
                </button>
                <input
                  id="add-item-quantity"
                  type="number"
                  min={1}
                  max={999}
                  value={quantity}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value === "") {
                      setQuantity(0);
                      return;
                    }
                    const nextQuantity = parseInt(value, 10);
                    if (!Number.isNaN(nextQuantity) && nextQuantity >= 0)
                      setQuantity(Math.min(999, nextQuantity));
                  }}
                  onBlur={() => {
                    if (quantity < 1) setQuantity(1);
                  }}
                  className="input-form min-h-11 w-20 shrink-0 rounded-xl border border-border px-3 py-2.5 text-center text-base text-foreground focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                />
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.min(999, q + 1))}
                  disabled={loading || quantity >= 999}
                  className="flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-xl border border-border bg-surface-raised text-foreground transition-colors hover:bg-border-soft disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/20"
                  aria-label="Aumentar cantidad"
                >
                  +
                </button>
              </div>
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between border-t border-border pt-3 text-sm">
            <span className="text-muted-foreground">Subtotal</span>
            <span className="font-bold tabular-nums text-foreground">
              ${subtotal.toFixed(2)}
            </span>
          </div>
        </div>
      )}
      <div className="flex flex-col gap-3 md:flex-row md:gap-3">
        <button
          type="button"
          onClick={onClose}
          disabled={loading}
          className={`${btnSecondaryFlex} w-full`}
        >
          <X className="h-4 w-4 shrink-0" aria-hidden />
          Cancelar
        </button>
        <button
          type="submit"
          disabled={loading || !productId}
          className={`${btnPrimaryFlex} w-full`}
        >
          {loading ? (
            "Agregando..."
          ) : (
            <>
              <Plus className="h-4 w-4 shrink-0" aria-hidden />
              Agregar a la orden
            </>
          )}
        </button>
      </div>
    </form>
  );

  return (
    <>
      <div
        className="fixed inset-0 z-100 hidden items-center justify-center bg-black/60 p-4 md:flex"
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <div
          className="w-full max-w-sm rounded-xl border border-border bg-surface-raised p-6 shadow-lg"
          onClick={(e) => e.stopPropagation()}
        >
          <h3 className="text-lg font-semibold text-foreground">
            Agregar producto o servicio
          </h3>
          <div className="mt-4">{formContent}</div>
        </div>
      </div>
      <BottomSheet
        isOpen={isOpen}
        onClose={onClose}
        title="Agregar producto o servicio"
      >
        {formContent}
      </BottomSheet>
    </>
  );
}
