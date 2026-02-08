"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useTenantStore } from "@/stores/useTenantStore";

export default function NuevaOrdenPage() {
  const params = useParams();
  const router = useRouter();
  const tenantSlug = params.tenantSlug as string;
  const activeTenant = useTenantStore((s) => s.activeTenant)();

  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!activeTenant) {
      setError("No hay negocio seleccionado");
      return;
    }
    setLoading(true);
    const res = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tenant_id: activeTenant.id,
        customer_name: customerName.trim() || undefined,
        customer_email: customerEmail.trim() || undefined,
        customer_phone: customerPhone.trim() || undefined,
      }),
    });
    const data = await res.json().catch(() => ({}));
    setLoading(false);
    if (!res.ok) {
      setError(data.error || "Error al crear la orden");
      return;
    }
    router.push(`/dashboard/${tenantSlug}/ordenes`);
    router.refresh();
  }

  if (!activeTenant) {
    return (
      <div className="text-sm text-zinc-600">
        Selecciona un negocio para continuar.
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md">
      <div className="mb-4">
        <Link
          href={`/dashboard/${tenantSlug}/ordenes`}
          className="text-sm text-zinc-600 hover:text-zinc-900"
        >
          ← Volver a órdenes
        </Link>
      </div>
      <h1 className="text-2xl font-semibold text-zinc-900">Nueva orden</h1>
      <p className="mt-1 text-sm text-zinc-500">
        Crea un ticket en {activeTenant.name}. Podrás agregar productos después.
      </p>
      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        {error && (
          <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}
        <div>
          <label
            htmlFor="customerName"
            className="block text-sm font-medium text-zinc-700"
          >
            Cliente (opcional)
          </label>
          <input
            id="customerName"
            type="text"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            className="mt-1 block w-full rounded-md border border-zinc-300 px-3 py-2 text-zinc-900"
            placeholder="Nombre del cliente. Puedes agregarlo después."
          />
        </div>
        <div>
          <label
            htmlFor="customerEmail"
            className="block text-sm font-medium text-zinc-700"
          >
            Email (opcional)
          </label>
          <input
            id="customerEmail"
            type="email"
            value={customerEmail}
            onChange={(e) => setCustomerEmail(e.target.value)}
            className="mt-1 block w-full rounded-md border border-zinc-300 px-3 py-2 text-zinc-900"
            placeholder="cliente@ejemplo.com"
          />
        </div>
        <div>
          <label
            htmlFor="customerPhone"
            className="block text-sm font-medium text-zinc-700"
          >
            Teléfono (opcional)
          </label>
          <input
            id="customerPhone"
            type="tel"
            value={customerPhone}
            onChange={(e) => setCustomerPhone(e.target.value)}
            className="mt-1 block w-full rounded-md border border-zinc-300 px-3 py-2 text-zinc-900"
            placeholder="555 123 4567"
          />
        </div>
        <div className="flex gap-3">
          <button
            type="submit"
            disabled={loading}
            className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50"
          >
            {loading ? "Creando..." : "Crear orden"}
          </button>
          <Link
            href={`/dashboard/${tenantSlug}/ordenes`}
            className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
          >
            Cancelar
          </Link>
        </div>
      </form>
    </div>
  );
}
