"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ShoppingCart, Minus, Plus, Trash2, ArrowLeft, CreditCard, Package } from "lucide-react";
import {
  getCart,
  updateItemQuantity,
  removeItem,
  type PublicCartItem,
} from "@/services/publicCartService";

function getFingerprint(): string {
  if (typeof window === "undefined") return "server";
  let fp = localStorage.getItem("pars_fingerprint");
  if (!fp) {
    fp = `fp_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
    localStorage.setItem("pars_fingerprint", fp);
  }
  return fp;
}

export default function CarritoPage() {
  const params = useParams();
  const slug = params.slug as string;
  const [tenantId, setTenantId] = useState<string | null>(null);
  const [cart, setCart] = useState<{ id: string } | null>(null);
  const [items, setItems] = useState<PublicCartItem[]>([]);
  const [subtotal, setSubtotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const res = await fetch(`/api/sitio-tenant?slug=${encodeURIComponent(slug)}`);
      if (!res.ok) {
        setError("Sitio no encontrado");
        setLoading(false);
        return;
      }
      const data = await res.json();
      setTenantId(data.tenant_id);
      if (data.tenant_id) {
        try {
          const cartData = await getCart(data.tenant_id, getFingerprint());
          setCart(cartData.cart);
          setItems(cartData.items);
          setSubtotal(cartData.subtotal);
        } catch {
          setItems([]);
          setSubtotal(0);
        }
      }
      setLoading(false);
    }
    load();
  }, [slug]);

  async function handleQuantityChange(item: PublicCartItem, newQty: number) {
    if (!cart || !tenantId) return;
    try {
      await updateItemQuantity(
        cart.id,
        item.product_id,
        newQty,
        getFingerprint()
      );
      if (newQty < 1) {
        setItems((prev) => prev.filter((i) => i.id !== item.id));
      } else {
        setItems((prev) =>
          prev.map((i) =>
            i.id === item.id ? { ...i, quantity: newQty } : i
          )
        );
      }
      const cartData = await getCart(tenantId, getFingerprint());
      setSubtotal(cartData.subtotal);
    } catch {
      setError("Error al actualizar");
    }
  }

  async function handleRemove(item: PublicCartItem) {
    if (!cart) return;
    try {
      await removeItem(cart.id, item.product_id, getFingerprint());
      setItems((prev) => prev.filter((i) => i.id !== item.id));
      const cartData = await getCart(tenantId!, getFingerprint());
      setSubtotal(cartData.subtotal);
    } catch {
      setError("Error al eliminar");
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-gray-600" />
        <p className="mt-4 text-sm text-gray-500">Cargando carrito...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl bg-white p-8 text-center shadow-sm">
        <p className="text-sm text-red-600">{error}</p>
        <Link
          href={`/sitio/${slug}/productos`}
          className="mt-4 inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver a productos
        </Link>
      </div>
    );
  }

  if (!tenantId) {
    return (
      <div className="rounded-2xl bg-white py-16 text-center shadow-sm">
        <p className="text-gray-500">Sitio no encontrado</p>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="space-y-8">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-100">
            <ShoppingCart className="h-5 w-5 text-gray-400" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Carrito</h1>
        </div>
        <div className="rounded-2xl bg-white py-16 text-center shadow-sm">
          <ShoppingCart className="mx-auto h-16 w-16 text-gray-300" />
          <p className="mt-4 text-lg font-medium text-gray-600">
            Tu carrito está vacío
          </p>
          <p className="mt-1 text-sm text-gray-400">
            Agrega productos para comenzar
          </p>
          <Link
            href={`/sitio/${slug}/productos`}
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-gray-900 px-6 py-3 text-sm font-semibold text-white transition-all hover:bg-gray-800"
          >
            <Package className="h-4 w-4" />
            Ver productos
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-100">
          <ShoppingCart className="h-5 w-5 text-gray-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Carrito</h1>
          <p className="text-sm text-gray-500">
            {items.length} artículo{items.length !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Items list */}
        <div className="space-y-3 lg:col-span-2">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex items-center gap-4 rounded-xl bg-white p-4 shadow-sm transition-all hover:shadow-md"
            >
              {item.product?.image_url ? (
                <img
                  src={item.product.image_url}
                  alt={item.product?.name ?? ""}
                  className="h-20 w-20 shrink-0 rounded-lg object-cover"
                />
              ) : (
                <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-lg bg-gray-100">
                  <Package className="h-8 w-8 text-gray-300" />
                </div>
              )}

              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 truncate">
                  {item.product?.name ?? "Producto"}
                </p>
                <p className="text-sm text-gray-500">
                  ${Number(item.price_snapshot).toFixed(2)} c/u
                </p>
              </div>

              {/* Quantity controls */}
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() =>
                    handleQuantityChange(item, Math.max(0, item.quantity - 1))
                  }
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-500 transition-colors hover:bg-gray-100"
                >
                  <Minus className="h-3 w-3" />
                </button>
                <span className="w-10 text-center text-sm font-semibold text-gray-900">
                  {item.quantity}
                </span>
                <button
                  type="button"
                  onClick={() => handleQuantityChange(item, item.quantity + 1)}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-500 transition-colors hover:bg-gray-100"
                >
                  <Plus className="h-3 w-3" />
                </button>
              </div>

              {/* Price + Remove */}
              <div className="flex flex-col items-end gap-1">
                <p className="font-semibold text-gray-900">
                  ${(Number(item.price_snapshot) * item.quantity).toFixed(2)}
                </p>
                <button
                  type="button"
                  onClick={() => handleRemove(item)}
                  className="flex items-center gap-1 text-xs text-red-500 transition-colors hover:text-red-700"
                  aria-label="Eliminar"
                >
                  <Trash2 className="h-3 w-3" />
                  Quitar
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Summary */}
        <div className="lg:col-span-1">
          <div className="sticky top-24 rounded-xl bg-white p-6 shadow-sm">
            <h3 className="font-semibold text-gray-900">Resumen</h3>
            <div className="mt-4 space-y-2">
              <div className="flex justify-between text-sm text-gray-500">
                <span>Subtotal</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm text-gray-500">
                <span>Envío</span>
                <span className="text-green-600">Por calcular</span>
              </div>
            </div>
            <div className="mt-4 border-t border-gray-100 pt-4">
              <div className="flex justify-between text-lg font-bold text-gray-900">
                <span>Total</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
            </div>
            <Link
              href={`/sitio/${slug}/checkout`}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-gray-900 px-4 py-3 text-sm font-semibold text-white transition-all hover:bg-gray-800 hover:shadow-md"
            >
              <CreditCard className="h-4 w-4" />
              Ir al checkout
            </Link>
            <Link
              href={`/sitio/${slug}/productos`}
              className="mt-3 flex w-full items-center justify-center gap-2 text-sm text-gray-500 transition-colors hover:text-gray-700"
            >
              <ArrowLeft className="h-4 w-4" />
              Seguir comprando
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
