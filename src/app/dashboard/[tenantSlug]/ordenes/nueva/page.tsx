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
    <div className="mx-auto max-w-2xl space-y-4">
      <div className="shrink-0 border-b border-zinc-200 pb-4">
        <Link
          href={`/dashboard/${tenantSlug}/ordenes`}
          className="text-sm font-medium text-zinc-600 hover:text-zinc-900"
        >
          ← Volver a órdenes
        </Link>
        <h1 className="mt-1 text-xl font-semibold text-zinc-900 sm:text-2xl">
          Nueva orden
        </h1>
        <p className="mt-0.5 text-sm text-zinc-500">
          Crea un ticket en {activeTenant.name}. Podrás agregar productos y
          cliente después.
        </p>
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white shadow-sm">
        <form onSubmit={handleSubmit} className="p-6 md:p-8">
          {error && (
            <div className="mb-6 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}
          <div className="rounded-lg border border-zinc-200 bg-zinc-50/50 p-4 md:p-5">
            <h2 className="text-sm font-medium text-zinc-900">
              Datos del cliente{" "}
              <span className="font-normal text-zinc-500">(opcional)</span>
            </h2>
            <p className="mt-1 text-xs text-zinc-500">
              Puedes dejarlos vacíos y agregar o editar el cliente después desde
              la orden.
            </p>
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-1">
              <div>
                <label
                  htmlFor="customerName"
                  className="block text-sm font-medium text-zinc-700"
                >
                  Nombre
                </label>
                <input
                  id="customerName"
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-zinc-300 px-3 py-2 text-zinc-900 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
                  placeholder="Nombre del cliente"
                />
              </div>
              <div>
                <label
                  htmlFor="customerEmail"
                  className="block text-sm font-medium text-zinc-700"
                >
                  Email
                </label>
                <input
                  id="customerEmail"
                  type="email"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-zinc-300 px-3 py-2 text-zinc-900 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
                  placeholder="cliente@ejemplo.com"
                />
              </div>
              <div>
                <label
                  htmlFor="customerPhone"
                  className="block text-sm font-medium text-zinc-700"
                >
                  Teléfono
                </label>
                <input
                  id="customerPhone"
                  type="tel"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-zinc-300 px-3 py-2 text-zinc-900 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
                  placeholder="555 123 4567"
                />
              </div>
            </div>
          </div>
          <div className="mt-6 flex flex-wrap gap-3 border-t border-zinc-200 pt-6">
            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50"
            >
              {loading ? "Creando..." : "Crear orden"}
            </button>
            <Link
              href={`/dashboard/${tenantSlug}/ordenes`}
              className="rounded-lg border border-zinc-300 px-4 py-2.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
            >
              Cancelar
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
