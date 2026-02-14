"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import type { ProductListItem } from "@/types/products";
import type { Subcatalog } from "@/types/subcatalogs";
import { listByTenant } from "@/services/productsService";
import { listByTenant as listSubcatalogs } from "@/services/subcatalogsService";
import { create as createOrderItem } from "@/services/orderItemsService";
import { ProductSearchCombobox } from "./ProductSearchCombobox";
import { Plus, X } from "lucide-react";

const DEBOUNCE_MS = 300;
const SERVER_SEARCH_MIN_CHARS = 2;

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
  const [subcatalogs, setSubcatalogs] = useState<Subcatalog[]>([]);
  const [subcatalogId, setSubcatalogId] = useState("");
  const [products, setProducts] = useState<ProductListItem[]>([]);
  const [productId, setProductId] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const hasSubcatalogs = subcatalogs.length > 0;
  const useServerSearch = hasSubcatalogs && !subcatalogId;

  const fetchProducts = useCallback(
    (opts?: { subcatalogId?: string; q?: string }) => {
      if (!tenantId) return;
      const q = opts?.q?.trim();
      const shouldSearch = q && q.length >= SERVER_SEARCH_MIN_CHARS;
      if (shouldSearch) setSearching(true);
      listByTenant(tenantId, {
        subcatalogId: opts?.subcatalogId,
        q: shouldSearch ? q : undefined,
      })
        .then(setProducts)
        .catch(() => setProducts([]))
        .finally(() => setSearching(false));
    },
    [tenantId]
  );

  const handleQueryChange = useCallback(
    (query: string) => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      if (!useServerSearch) return;
      debounceRef.current = setTimeout(() => {
        debounceRef.current = null;
        if (query.trim().length >= SERVER_SEARCH_MIN_CHARS) {
          fetchProducts({ subcatalogId: undefined, q: query });
        } else {
          setProducts((prev) => {
            if (productId) {
              const sel = prev.find((p) => p.id === productId);
              if (sel) return [sel];
            }
            return [];
          });
        }
      }, DEBOUNCE_MS);
    },
    [useServerSearch, fetchProducts, productId]
  );

  useEffect(() => {
    if (!isOpen || !tenantId) return;
    setError(null);
    setProductId("");
    setQuantity(1);
    setSubcatalogId("");
    listSubcatalogs(tenantId).then(setSubcatalogs).catch(() => setSubcatalogs([]));
  }, [isOpen, tenantId]);

  useEffect(() => {
    if (!isOpen || !tenantId) return;
    if (useServerSearch) {
      setProducts([]);
    } else {
      fetchProducts({ subcatalogId: subcatalogId || undefined });
    }
  }, [isOpen, tenantId, subcatalogId, useServerSearch, fetchProducts]);

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
    "mt-1 block w-full min-h-[44px] rounded-xl border border-border bg-surface-raised px-3 py-2.5 text-sm text-foreground focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 disabled:opacity-50 appearance-none bg-[url('data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2224%22 height=%2224%22 viewBox=%220 0 24 24%22 fill=%22none%22 stroke=%22%2378716c%22 stroke-width=%222%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22%3E%3Cpath d=%22m6 9 6 6 6-6%22/%3E%3C/svg%3E')] bg-[length:1.25rem] bg-[right_0.5rem_center] bg-no-repeat pr-10";

  return (
    <div className="fixed inset-0 z-10 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-sm rounded-xl border border-border bg-surface-raised p-6 shadow-lg">
        <h3 className="text-lg font-semibold text-foreground">Agregar item</h3>
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
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
              <p
                id="add-item-subcatalog-hint"
                className="mt-1 text-xs text-muted"
              >
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
              htmlFor="add-item-quantity"
              className="block text-sm font-medium text-muted-foreground"
            >
              Cantidad
            </label>
            <input
              id="add-item-quantity"
              type="number"
              min={1}
              value={quantity}
              onChange={(e) => setQuantity(parseInt(e.target.value, 10) || 1)}
              className="mt-1 block w-full min-h-[44px] rounded-xl border border-border px-3 py-2.5 text-foreground focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            />
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
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="inline-flex min-h-[44px] flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl border border-border px-4 py-2.5 text-sm font-medium text-muted-foreground transition-colors duration-200 hover:bg-border-soft/60 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <X className="h-4 w-4 shrink-0" aria-hidden />
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || !productId}
              className="inline-flex min-h-[44px] flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-sm font-medium text-accent-foreground transition-colors duration-200 hover:bg-accent/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loading ? (
                "Agregando..."
              ) : (
                <>
                  <Plus className="h-4 w-4 shrink-0" aria-hidden />
                  Agregar
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
