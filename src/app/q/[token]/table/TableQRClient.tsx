"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

import { TableCartSheet } from "@/features/qr/components/TableCartSheet";
import { TableMenuGrid } from "@/features/qr/components/TableMenuGrid";
import type { TableOrderItem } from "@/features/qr/interfaces/tableOrder";

interface TableQRClientProps {
  token: string;
  tenant: { id: string; name: string; slug: string };
  qrCode: { id: string; label: string };
  order: { id: string; status: string } | null;
  menu: Array<{ id: string; name: string; price: number }>;
}

export function TableQRClient({
  token,
  tenant,
  qrCode,
  order,
  menu,
}: TableQRClientProps) {
  const [items, setItems] = useState<TableOrderItem[]>([]);
  const [showCart, setShowCart] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const total = useMemo(
    () => items.reduce((acc, item) => acc + Number(item.subtotal), 0),
    [items],
  );

  function handleAdd(productId: string) {
    const product = menu.find((entry) => entry.id === productId);
    if (!product) return;
    setItems((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        product_id: product.id,
        quantity: 1,
        unit_price: product.price,
        subtotal: product.price,
      },
    ]);
    setShowCart(true);
  }

  async function handleSendOrder() {
    if (!order) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/qr/table/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          order_id: order.id,
          qr_token: token,
          items: items.map((item) => ({
            product_id: item.product_id,
            quantity: item.quantity,
          })),
        }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error || "No se pudo enviar el pedido");
      setItems([]);
      setShowCart(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error inesperado");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="mx-auto w-full max-w-3xl space-y-4 px-4 py-6">
      <header>
        <p className="text-sm text-muted-foreground">{tenant.name}</p>
        <h1 className="text-2xl font-semibold text-foreground">{qrCode.label}</h1>
      </header>
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}
      <TableMenuGrid products={menu} onAdd={handleAdd} />
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => setShowCart((value) => !value)}
          className="min-h-[44px] rounded-lg border border-border px-4 py-2 text-sm"
        >
          Ver carrito ({items.length})
        </button>
        <button
          type="button"
          onClick={handleSendOrder}
          disabled={saving || items.length === 0}
          className="min-h-[44px] rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground disabled:opacity-60"
        >
          {saving ? "Enviando..." : "Confirmar pedido"}
        </button>
        {order && (
          <Link
            href={`/q/${token}/table/bill?order_id=${order.id}`}
            className="min-h-[44px] rounded-lg border border-border px-4 py-2 text-sm"
          >
            Ver cuenta
          </Link>
        )}
      </div>
      {showCart && <TableCartSheet items={items} onClose={() => setShowCart(false)} />}
      <p className="text-xs text-muted-foreground">
        Total temporal: ${total.toFixed(2)}
      </p>
    </main>
  );
}
