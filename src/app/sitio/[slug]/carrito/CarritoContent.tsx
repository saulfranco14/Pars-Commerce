"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ShoppingCart, Package, Trash2, Minus, Plus } from "lucide-react";
import { updateItemQuantity, removeItem, checkoutPickup } from "@/services/publicCartService";
import { dispatchCartUpdated } from "@/lib/cartEvents";
import { useCartContext } from "../CartProvider";
import { useFingerprint } from "@/hooks/useFingerprint";
import * as yup from "yup";
import { checkoutFormSchema } from "@/lib/checkoutValidation";
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
  const { cart, items, subtotal, isLoading, mutate } = useCartContext();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({ customer_name: "", customer_email: "", customer_phone: "" });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const handleQuantityChange = async (productId: string, quantity: number) => {
    if (!cart || !fingerprint || quantity < 1) return;
    const prevData = { items: [...items], subtotal };
    const updatedItems = items.map((it) =>
      it.product_id === productId ? { ...it, quantity } : it
    );
    const item = updatedItems.find((it) => it.product_id === productId);
    const price = item ? Number(item.price_snapshot) : 0;
    const oldQty = prevData.items.find((i) => i.product_id === productId)?.quantity ?? 0;
    const newSubtotal = subtotal + (quantity - oldQty) * price;
    mutate(
      { cart, items: updatedItems, subtotal: newSubtotal, items_count: updatedItems.reduce((s, i) => s + i.quantity, 0) },
      { revalidate: false }
    );
    setError(null);
    try {
      await updateItemQuantity(cart.id, productId, quantity, fingerprint);
      dispatchCartUpdated();
    } catch (e) {
      mutate();
      setError(e instanceof Error ? e.message : "Error al actualizar");
    }
  };

  const handleRemove = async (productId: string) => {
    if (!cart || !fingerprint) return;
    const filtered = items.filter((it) => it.product_id !== productId);
    const removed = items.find((it) => it.product_id === productId);
    const newSubtotal = removed
      ? subtotal - Number(removed.price_snapshot) * removed.quantity
      : subtotal;
    mutate(
      { cart, items: filtered, subtotal: newSubtotal, items_count: filtered.reduce((s, i) => s + i.quantity, 0) },
      { revalidate: false }
    );
    setError(null);
    try {
      await removeItem(cart.id, productId, fingerprint);
      dispatchCartUpdated();
    } catch (e) {
      mutate();
      setError(e instanceof Error ? e.message : "Error al eliminar");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cart || !fingerprint) return;
    setError(null);
    setFieldErrors({});
    try {
      const validated = await checkoutFormSchema.validate(
        {
          customer_name: form.customer_name.trim(),
          customer_email: form.customer_email.trim(),
          customer_phone: form.customer_phone.trim(),
        },
        { abortEarly: false }
      );
      setSubmitting(true);
      const result = await checkoutPickup(
        {
          tenant_id: tenantId,
          cart_id: cart.id,
          customer_name: validated.customer_name,
          customer_email: validated.customer_email,
          customer_phone: validated.customer_phone,
        },
        fingerprint
      );
      router.push(result.redirect_url);
    } catch (e) {
      if (e instanceof yup.ValidationError) {
        const errs: Record<string, string> = {};
        e.inner.forEach((err) => {
          if (err.path) errs[err.path] = err.message;
        });
        setFieldErrors(errs);
      } else {
        setError(e instanceof Error ? e.message : "Error al finalizar pedido");
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-transparent" style={{ borderTopColor: accentColor }} />
      </div>
    );
  }

  if (!cart || items.length === 0) {
    return (
      <div className="rounded-2xl border border-gray-100 bg-white py-16 text-center shadow-sm">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
          <ShoppingCart className="h-8 w-8 text-gray-400" />
        </div>
        <p className="mt-4 text-base font-medium text-gray-700">Tu carrito está vacío</p>
        <p className="mt-1 text-sm text-gray-500">Agrega productos para continuar</p>
        <Link
          href={`/sitio/${sitioSlug}/productos`}
          className="mt-6 inline-flex min-h-[44px] cursor-pointer items-center justify-center gap-2 rounded-xl px-6 py-3 font-semibold text-white transition-opacity hover:opacity-90"
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
          {items.map((item) => {
            const product = Array.isArray(item.product) ? item.product[0] : item.product;
            const name = product?.name ?? "Producto";
            const imageUrl = product?.image_url ?? null;
            const price = Number(item.price_snapshot);
            const qty = item.quantity;
            const itemSubtotal = price * qty;
            return (
              <div
                key={item.id}
                className="flex gap-4 rounded-xl border border-gray-100 bg-white p-4 shadow-sm transition-shadow duration-200 hover:shadow-md"
              >
                <div className="h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-gray-100">
                  {imageUrl ? (
                    <img src={imageUrl} alt={name} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <Package className="h-10 w-10 text-gray-300" />
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold text-gray-900 line-clamp-2">{name}</h3>
                  {item.promotion_id && (
                    <span className="mt-1 inline-block rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
                      Promoción
                    </span>
                  )}
                  <p className="mt-2 text-base font-bold tabular-nums" style={{ color: accentColor }}>
                    ${price.toFixed(2)} × {qty} = ${itemSubtotal.toFixed(2)}
                  </p>
                  <div className="mt-3 flex min-h-[44px] items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleQuantityChange(item.product_id, Math.max(1, qty - 1))}
                      className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg border border-gray-200 bg-gray-50 text-gray-700 transition-colors hover:bg-gray-100 hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-300/30"
                      aria-label="Reducir cantidad"
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <span className="min-w-8 px-2 text-center text-sm font-medium tabular-nums">{qty}</span>
                    <button
                      type="button"
                      onClick={() => handleQuantityChange(item.product_id, qty + 1)}
                      className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg border border-gray-200 bg-gray-50 text-gray-700 transition-colors hover:bg-gray-100 hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-300/30"
                      aria-label="Aumentar cantidad"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRemove(item.product_id)}
                      className="ml-auto flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg text-red-500 transition-colors hover:bg-red-50 hover:text-red-700 focus:outline-none focus:ring-2 focus:ring-red-500/20"
                      aria-label="Eliminar"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">Finalizar pedido</h2>
          <div
            className="mt-4 flex items-center justify-between rounded-xl border-2 px-4 py-4"
            style={{ borderColor: accentColor, backgroundColor: `${accentColor}0c` }}
          >
            <span className="text-sm font-semibold text-gray-700">Total</span>
            <span className="text-xl font-bold" style={{ color: accentColor }}>
              ${subtotal.toFixed(2)}
            </span>
          </div>
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label htmlFor="checkout-name" className="block text-sm font-medium text-gray-700">
                Nombre
              </label>
              <input
                id="checkout-name"
                type="text"
                autoComplete="name"
                value={form.customer_name}
                onChange={(e) => {
                  setForm((f) => ({ ...f, customer_name: e.target.value }));
                  if (fieldErrors.customer_name) setFieldErrors((prev) => ({ ...prev, customer_name: "" }));
                }}
                className={`mt-1 w-full min-h-[44px] rounded-xl border px-3 py-2.5 text-base transition-colors focus:outline-none focus:ring-2 ${
                  fieldErrors.customer_name
                    ? "border-red-500 focus:ring-red-500/20"
                    : "border-gray-300 focus:border-gray-400 focus:ring-gray-400/20"
                }`}
                placeholder="Tu nombre"
              />
              {fieldErrors.customer_name && (
                <p className="mt-1 text-sm text-red-600">{fieldErrors.customer_name}</p>
              )}
            </div>
            <div>
              <label htmlFor="checkout-email" className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                id="checkout-email"
                type="email"
                autoComplete="email"
                value={form.customer_email}
                onChange={(e) => {
                  setForm((f) => ({ ...f, customer_email: e.target.value }));
                  if (fieldErrors.customer_email) setFieldErrors((prev) => ({ ...prev, customer_email: "" }));
                }}
                className={`mt-1 w-full min-h-[44px] rounded-xl border px-3 py-2.5 text-base transition-colors focus:outline-none focus:ring-2 ${
                  fieldErrors.customer_email
                    ? "border-red-500 focus:ring-red-500/20"
                    : "border-gray-300 focus:border-gray-400 focus:ring-gray-400/20"
                }`}
                placeholder="correo@ejemplo.com"
              />
              {fieldErrors.customer_email && (
                <p className="mt-1 text-sm text-red-600">{fieldErrors.customer_email}</p>
              )}
            </div>
            <div>
              <label htmlFor="checkout-phone" className="block text-sm font-medium text-gray-700">
                Teléfono
              </label>
              <input
                id="checkout-phone"
                type="tel"
                autoComplete="tel"
                value={form.customer_phone}
                onChange={(e) => {
                  setForm((f) => ({ ...f, customer_phone: e.target.value }));
                  if (fieldErrors.customer_phone) setFieldErrors((prev) => ({ ...prev, customer_phone: "" }));
                }}
                className={`mt-1 w-full min-h-[44px] rounded-xl border px-3 py-2.5 text-base transition-colors focus:outline-none focus:ring-2 ${
                  fieldErrors.customer_phone
                    ? "border-red-500 focus:ring-red-500/20"
                    : "border-gray-300 focus:border-gray-400 focus:ring-gray-400/20"
                }`}
                placeholder="5512345678"
              />
              {fieldErrors.customer_phone && (
                <p className="mt-1 text-sm text-red-600">{fieldErrors.customer_phone}</p>
              )}
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="w-full min-h-[48px] cursor-pointer rounded-xl px-6 py-4 font-semibold text-white transition-opacity duration-200 hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-offset-2"
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
