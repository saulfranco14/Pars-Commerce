"use client";

import { useState, useEffect } from "react";
import type { ProductListItem } from "@/types/products";
import { listByTenant } from "@/services/productsService";
import { create as createOrderItem } from "@/services/orderItemsService";

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
  const [products, setProducts] = useState<ProductListItem[]>([]);
  const [productId, setProductId] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !tenantId) return;
    setError(null);
    listByTenant(tenantId)
      .then(setProducts)
      .catch(() => setProducts([]));
    setProductId("");
    setQuantity(1);
  }, [isOpen, tenantId]);

  const selected = products.find((p) => p.id === productId);
  const unitPrice = selected ? Number(selected.price) : 0;
  const subtotal = unitPrice * quantity;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!productId || quantity < 1) return;
    setError(null);
    setLoading(true);
    try {
      await createOrderItem({ order_id: orderId, product_id: productId, quantity });
      onAdded();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al agregar");
    } finally {
      setLoading(false);
    }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-10 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-sm rounded-lg bg-white p-4 shadow-lg">
        <h3 className="text-lg font-semibold text-zinc-900">Agregar item</h3>
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {error && (
            <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-zinc-700">
              Producto / Servicio
            </label>
            <select
              value={productId}
              onChange={(e) => setProductId(e.target.value)}
              required
              className="mt-1 block w-full rounded-md border border-zinc-300 px-3 py-2 text-zinc-900"
            >
              <option value="">Seleccionar</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} — ${Number(p.price).toFixed(2)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700">
              Cantidad
            </label>
            <input
              type="number"
              min={1}
              value={quantity}
              onChange={(e) => setQuantity(parseInt(e.target.value, 10) || 1)}
              className="mt-1 block w-full rounded-md border border-zinc-300 px-3 py-2 text-zinc-900"
            />
          </div>
          {selected && (
            <p className="text-sm text-zinc-600">
              Subtotal: ${subtotal.toFixed(2)}
            </p>
          )}
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={loading || !productId}
              className="rounded-md bg-zinc-900 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50"
            >
              {loading ? "Agregando..." : "Agregar"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
