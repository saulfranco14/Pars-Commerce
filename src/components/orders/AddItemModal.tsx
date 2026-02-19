"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import useSWR from "swr";
import type { ProductListItem } from "@/types/products";
import type { Subcatalog } from "@/types/subcatalogs";
import { create as createOrderItem } from "@/services/orderItemsService";
import { ProductSearchCombobox } from "./ProductSearchCombobox";
import { swrFetcher } from "@/lib/swrFetcher";
import { Plus, X } from "lucide-react";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { TouchStepper } from "@/components/ui/TouchStepper";

const DEBOUNCE_MS = 300;
const SERVER_SEARCH_MIN_CHARS = 2;

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

interface AddItemModalProps {
  tenantId: string;
  orderId: string;
  isOpen: boolean;
  onClose: () => void;
  onAdded: () => void;
}

export function AddItemModal({
  tenantId,
  orderId,
  isOpen,
  onClose,
  onAdded,
}: AddItemModalProps) {
  const [subcatalogId, setSubcatalogId] = useState("");
  const [productId, setProductId] = useState("");
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
    setQuantity(1);
    setSubcatalogId("");
    setDebouncedQuery("");
  }, [isOpen, tenantId]);

  useEffect(() => {
    setProductId("");
  }, [subcatalogId]);

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

  const selected = products.find((p) => p.id === productId);
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

  const selectClass =
    "input-form mt-1 block w-full min-h-(--input-height,44px) rounded-lg px-3 py-2.5 text-base text-foreground focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/30 disabled:opacity-50 appearance-none bg-[url('data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2224%22 height=%2224%22 viewBox=%220 0 24 24%22 fill=%22none%22 stroke=%22%2378716c%22 stroke-width=%222%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22%3E%3Cpath d=%22m6 9 6 6 6-6%22/%3E%3C/svg%3E')] bg-[length:1.25rem] bg-[right_0.5rem_center] bg-no-repeat pr-10";

  const formContent = (
    <form onSubmit={handleSubmit} className="space-y-4">
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
            Subcatalog
          </label>
          <select
            id="add-item-subcatalog"
            value={subcatalogId}
            onChange={(e) => setSubcatalogId(e.target.value)}
            className={selectClass}
            disabled={loading}
            aria-describedby="add-item-subcatalog-hint"
          >
            <option value="">Todos los productos</option>
            {subcatalogs.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
          <p id="add-item-subcatalog-hint" className="mt-1 text-xs text-muted">
            {subcatalogId
              ? `Mostrando solo productos de ${subcatalogs.find((s) => s.id === subcatalogId)?.name ?? ""}`
              : "Selecciona uno para filtrar o escribe para buscar en todos"}
          </p>
        </div>
      )}
      <div>
        <label
          htmlFor="add-item-product"
          className="block text-sm font-medium text-muted-foreground"
        >
          Producto / Servicio
        </label>
        <div className="mt-1" id="add-item-product">
          <ProductSearchCombobox
            products={products}
            value={productId}
            onChange={setProductId}
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
      <div>
        <label
          id="add-item-quantity-label"
          className="block text-sm font-medium text-muted-foreground"
        >
          Cantidad
        </label>
        <div className="mt-2 md:mt-1">
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
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border bg-surface text-foreground transition-colors hover:bg-border-soft disabled:cursor-not-allowed disabled:opacity-50"
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
                const v = e.target.value;
                if (v === "") {
                  setQuantity(0);
                  return;
                }
                const n = parseInt(v, 10);
                if (!Number.isNaN(n) && n >= 0) setQuantity(Math.min(999, n));
              }}
              onBlur={() => {
                if (quantity < 1) setQuantity(1);
              }}
              className="input-form w-20 text-center md:rounded-lg md:px-2 md:py-1.5 md:text-foreground focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/30"
            />
            <button
              type="button"
              onClick={() => setQuantity((q) => Math.min(999, q + 1))}
              disabled={loading || quantity >= 999}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border bg-surface text-foreground transition-colors hover:bg-border-soft disabled:cursor-not-allowed disabled:opacity-50"
              aria-label="Aumentar cantidad"
            >
              +
            </button>
          </div>
        </div>
      </div>
      {selected && (
        <p className="text-sm text-muted-foreground">
          Subtotal: ${subtotal.toFixed(2)}
          {isWholesale && (
            <span className="ml-1.5 inline-block rounded bg-teal-100 px-1.5 py-0.5 text-xs font-medium text-teal-800">
              Mayoreo
            </span>
          )}
        </p>
      )}
      <div className="flex flex-col gap-2 md:flex-row md:gap-2">
        <button
          type="button"
          onClick={onClose}
          disabled={loading}
          className="inline-flex min-h-10 flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg border border-border px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-border-soft/60 hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent/30 disabled:cursor-not-allowed disabled:opacity-50 md:h-9 md:min-h-0"
        >
          <X className="h-4 w-4 shrink-0" aria-hidden />
          Cancelar
        </button>
        <button
          type="submit"
          disabled={loading || !productId}
          className="inline-flex min-h-10 w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-accent px-3 py-1.5 text-sm font-medium text-accent-foreground transition-colors hover:bg-accent/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent/30 disabled:cursor-not-allowed disabled:opacity-70 md:h-9 md:min-h-0 md:flex-1"
        >
          {loading ? (
            "Agregando..."
          ) : (
            <>
              <Plus className="h-4 w-4 shrink-0" aria-hidden />
              Agregar al ticket
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
            Agregar item
          </h3>
          <div className="mt-4">{formContent}</div>
        </div>
      </div>
      <BottomSheet isOpen={isOpen} onClose={onClose} title="Agregar item">
        {formContent}
      </BottomSheet>
    </>
  );
}
