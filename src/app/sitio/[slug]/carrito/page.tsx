"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
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
  const router = useRouter();
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
      <div className="py-8 text-center text-muted-foreground">
        Cargando carrito...
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-red-600">{error}</p>
        <Link href={`/sitio/${slug}/productos`} className="text-sm underline">
          Volver a productos
        </Link>
      </div>
    );
  }

  if (!tenantId) {
    return (
      <div className="py-8 text-center text-muted-foreground">
        Sitio no encontrado
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-foreground">Carrito</h2>
        <p className="text-sm text-muted-foreground">
          Tu carrito está vacío.
        </p>
        <Link
          href={`/sitio/${slug}/productos`}
          className="inline-block rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-foreground hover:opacity-90"
        >
          Ver productos
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-foreground">Carrito</h2>

      <ul className="space-y-4">
        {items.map((item) => (
          <li
            key={item.id}
            className="flex items-center gap-4 rounded-lg border border-border p-4"
          >
            {item.product?.image_url && (
              <img
                src={item.product.image_url}
                alt=""
                className="h-16 w-16 rounded object-cover"
              />
            )}
            <div className="flex-1 min-w-0">
              <p className="font-medium text-foreground truncate">
                {item.product?.name ?? "Producto"}
              </p>
              <p className="text-sm text-muted-foreground">
                ${Number(item.price_snapshot).toFixed(2)} × {item.quantity}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() =>
                  handleQuantityChange(item, Math.max(0, item.quantity - 1))
                }
                className="h-8 w-8 rounded border border-border text-sm hover:bg-border-soft"
              >
                −
              </button>
              <span className="w-8 text-center text-sm">{item.quantity}</span>
              <button
                type="button"
                onClick={() => handleQuantityChange(item, item.quantity + 1)}
                className="h-8 w-8 rounded border border-border text-sm hover:bg-border-soft"
              >
                +
              </button>
            </div>
            <p className="w-20 text-right text-sm font-medium">
              ${(Number(item.price_snapshot) * item.quantity).toFixed(2)}
            </p>
            <button
              type="button"
              onClick={() => handleRemove(item)}
              className="text-sm text-red-600 hover:underline"
              aria-label="Eliminar"
            >
              Eliminar
            </button>
          </li>
        ))}
      </ul>

      <div className="flex items-center justify-between border-t border-border pt-4">
        <p className="font-semibold text-foreground">
          Total: ${subtotal.toFixed(2)}
        </p>
        <Link
          href={`/sitio/${slug}/checkout`}
          className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-foreground hover:opacity-90"
        >
          Ir a checkout
        </Link>
      </div>
    </div>
  );
}
