"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { getCart, type PublicCartItem } from "@/services/publicCartService";

function getFingerprint(): string {
  if (typeof window === "undefined") return "server";
  let fp = localStorage.getItem("pars_fingerprint");
  if (!fp) {
    fp = `fp_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
    localStorage.setItem("pars_fingerprint", fp);
  }
  return fp;
}

export default function CheckoutPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  const [tenantId, setTenantId] = useState<string | null>(null);
  const [cart, setCart] = useState<{ id: string } | null>(null);
  const [items, setItems] = useState<PublicCartItem[]>([]);
  const [subtotal, setSubtotal] = useState(0);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadCart, setLoadCart] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const res = await fetch(
        `/api/sitio-tenant?slug=${encodeURIComponent(slug)}`
      );
      if (!res.ok) {
        setError("Sitio no encontrado");
        setLoadCart(false);
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
      setLoadCart(false);
    }
    load();
  }, [slug]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!cart || !tenantId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/public-checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-fingerprint-id": getFingerprint(),
        },
        body: JSON.stringify({
          tenant_id: tenantId,
          cart_id: cart.id,
          customer_name: name.trim(),
          customer_email: email.trim(),
          customer_phone: phone.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error ?? "Error al procesar");
      }
      window.location.href = data.payment_link;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al procesar");
    } finally {
      setLoading(false);
    }
  }

  if (loadCart) {
    return (
      <div className="py-8 text-center text-muted-foreground">
        Cargando...
      </div>
    );
  }

  if (!tenantId || !cart || items.length === 0) {
    return (
      <div className="space-y-4">
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
    <div className="mx-auto max-w-md space-y-6">
      <h2 className="text-lg font-semibold text-foreground">Checkout</h2>

      <div className="rounded-lg border border-border p-4">
        <p className="text-sm font-medium text-foreground">
          Total: ${subtotal.toFixed(2)}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          {items.length} producto(s) en tu pedido
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}
        <div>
          <label className="block text-sm font-medium text-muted-foreground">
            Nombre *
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="input-form mt-1 block w-full min-h-[44px] rounded-lg border px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-muted-foreground">
            Email *
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="input-form mt-1 block w-full min-h-[44px] rounded-lg border px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-muted-foreground">
            Teléfono (opcional)
          </label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="input-form mt-1 block w-full min-h-[44px] rounded-lg border px-3 py-2"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-md bg-accent px-4 py-3 text-sm font-medium text-accent-foreground hover:opacity-90 disabled:opacity-50"
        >
          {loading ? "Procesando..." : "Pagar con MercadoPago"}
        </button>
      </form>

      <Link
        href={`/sitio/${slug}/carrito`}
        className="block text-center text-sm text-muted-foreground underline"
      >
        Volver al carrito
      </Link>
    </div>
  );
}
