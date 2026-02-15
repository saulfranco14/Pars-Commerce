"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ShoppingCart, Package, Trash2 } from "lucide-react";
import { getCart, updateItemQuantity, removeItem, checkoutPickup } from "@/services/publicCartService";
import { useFingerprint } from "@/hooks/useFingerprint";
import type { PublicCartItem } from "@/services/publicCartService";

interface CarritoContentProps {
  tenantId: string;
  sitioSlug: string;
  accentColor: string;
}

export default function CarritoContent({
  tenantId,
  sitioSlug,
  accentColor,
}: CarritoContentProps) {
  const router = useRouter();
  const fingerprint = useFingerprint();
  const [cart, setCart] = useState<{ id: string; items: PublicCartItem[]; subtotal: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [ submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({ customer_name: "", customer_email: "", customer_phone: "" });

  const loadCart = async () => {
    if (!fingerprint) return;
    setLoading(true);
    try {
      const res = await getCart(tenantId, fingerprint);
      if (res.cart && res.items) {
        setCart({
          id: res.cart.id,
          items: res.items,
          subtotal: res.subtotal,
        });
      } else {
        setCart(null);
      }
    } catch {
      setCart(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (fingerprint) loadCart();
  }, [fingerprint, tenantId]);

  const handleQuantityChange = async (productId: string, quantity: number) => {
    if (!cart || !fingerprint || quantity < 1) return;
    try {
      await updateItemQuantity(cart.id, productId, quantity, fingerprint);
      await loadCart();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al actualizar");
    }
  };

  const handleRemove = async (productId: string) => {
    if (!cart || !fingerprint) return;
    try {
      await removeItem(cart.id, productId, fingerprint);
      await loadCart();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al eliminar");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cart || !fingerprint) return;
    setError(null);
    setSubmitting(true);
    try {
      const result = await checkoutPickup(
        {
          tenant_id: tenantId,
          cart_id: cart.id,
          customer_name: form.customer_name.trim(),
          customer_email: form.customer_email.trim(),
          customer_phone: form.customer_phone.trim(),
        },
        fingerprint
      );
      router.push(result.redirect_url);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al finalizar pedido");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-transparent" style={{ borderTopColor: accentColor }} />
      </div>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className="rounded-2xl bg-white py-16 text-center shadow-sm">
          <ShoppingCart className="mx-auto h-12 w-12 text-gray-300" />
          <p className="mt-4 text-gray-500">Tu carrito está vacío</p>
          <Link
            href={`/sitio/${sitioSlug}/productos`}
            className="mt-4 inline-flex items-center gap-2 rounded-xl px-6 py-3 font-medium text-white"
            style={{ backgroundColor: accentColor }}
          >
            Ir a productos
          </Link>
      </div>
    );
  }

  return (
    <>
      {error && (
        <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-4">
          {cart.items.map((item) => {
            const product = Array.isArray(item.product) ? item.product[0] : item.product;
            const name = product?.name ?? "Producto";
            const imageUrl = product?.image_url ?? null;
            const price = Number(item.price_snapshot);
            const qty = item.quantity;
            const itemSubtotal = price * qty;
            return (
              <div
                key={item.id}
                className="flex gap-4 rounded-xl bg-white p-4 shadow-sm"
              >
                <div className="h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-gray-100">
                  {imageUrl ? (
                    <img src={imageUrl} alt={name} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <Package className="h-8 w-8 text-gray-300" />
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-medium text-gray-900 truncate">{name}</h3>
                  {item.promotion_id && (
                    <span className="mt-0.5 inline-block rounded bg-amber-100 px-1.5 py-0.5 text-xs text-amber-800">
                      Promoción
                    </span>
                  )}
                  <p className="mt-1 text-sm font-semibold" style={{ color: accentColor }}>
                    ${price.toFixed(2)} × {qty} = ${itemSubtotal.toFixed(2)}
                  </p>
                  <div className="mt-2 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleQuantityChange(item.product_id, Math.max(1, qty - 1))}
                      className="rounded border px-2 py-1 text-sm"
                    >
                      −
                    </button>
                    <span className="text-sm">{qty}</span>
                    <button
                      type="button"
                      onClick={() => handleQuantityChange(item.product_id, qty + 1)}
                      className="rounded border px-2 py-1 text-sm"
                    >
                      +
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRemove(item.product_id)}
                      className="ml-2 text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">Finalizar pedido</h2>
          <div
            className="mt-4 flex items-center justify-between rounded-lg border-2 px-4 py-3"
            style={{ borderColor: accentColor, backgroundColor: `${accentColor}08` }}
          >
            <span className="text-sm font-semibold text-gray-700">Total</span>
            <span className="text-xl font-bold" style={{ color: accentColor }}>
              ${cart.subtotal.toFixed(2)}
            </span>
          </div>
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Nombre
              </label>
              <input
                id="name"
                type="text"
                required
                value={form.customer_name}
                onChange={(e) => setForm((f) => ({ ...f, customer_name: e.target.value }))}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
              />
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                value={form.customer_email}
                onChange={(e) => setForm((f) => ({ ...f, customer_email: e.target.value }))}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
              />
            </div>
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                Teléfono
              </label>
              <input
                id="phone"
                type="tel"
                required
                value={form.customer_phone}
                onChange={(e) => setForm((f) => ({ ...f, customer_phone: e.target.value }))}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
              />
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-xl px-6 py-4 font-semibold text-white disabled:opacity-50"
              style={{ backgroundColor: accentColor }}
            >
              {submitting ? "Procesando…" : "Confirmar pedido"}
            </button>
          </form>
          <p className="mt-3 text-xs text-gray-500">
            Tu ticket será creado. Pasarás a recoger tu pedido en la dirección del negocio.
          </p>
        </div>
      </div>
    </>
  );
}
