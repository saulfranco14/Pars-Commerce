"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useTenantStore } from "@/stores/useTenantStore";
import type { TeamMember } from "@/types/team";
import { list as listTeam } from "@/services/teamService";
import { create as createOrder } from "@/services/ordersService";

export default function NuevaOrdenPage() {
  const params = useParams();
  const router = useRouter();
  const tenantSlug = params.tenantSlug as string;
  const activeTenant = useTenantStore((s) => s.activeTenant)();

  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [assignedTo, setAssignedTo] = useState("");
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!activeTenant?.id) return;
    listTeam(activeTenant.id)
      .then(setTeam)
      .catch(() => setTeam([]));
  }, [activeTenant?.id]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!activeTenant) {
      setError("No hay negocio seleccionado");
      return;
    }
    setLoading(true);
    try {
      const data = (await createOrder({
        tenant_id: activeTenant.id,
        customer_name: customerName.trim() || undefined,
        customer_email: customerEmail.trim() || undefined,
        customer_phone: customerPhone.trim() || undefined,
        assigned_to: assignedTo || undefined,
      })) as { id: string };
      router.push(`/dashboard/${tenantSlug}/ordenes/${data.id}`);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al crear la orden");
    } finally {
      setLoading(false);
    }
  }

  if (!activeTenant) {
    return (
      <div className="text-sm text-muted-foreground">
        Selecciona un negocio para continuar.
      </div>
    );
  }

  const inputClass =
    "mt-1 block w-full rounded-xl border border-border bg-border-soft/80 px-3 py-2.5 text-sm text-foreground placeholder:text-muted focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20";
  const selectClass =
    "select-custom mt-3 block w-full rounded-xl border border-border bg-surface-raised px-3 py-2.5 text-sm text-foreground focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20";

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div className="shrink-0 border-b border-border-soft pb-4">
        <Link
          href={`/dashboard/${tenantSlug}/ordenes`}
          className="text-sm font-medium text-muted hover:text-foreground"
        >
          ← Volver a órdenes
        </Link>
        <h1 className="mt-1 text-xl font-semibold text-foreground sm:text-2xl">
          Nueva orden
        </h1>
        <p className="mt-0.5 text-sm text-muted">
          Crea un ticket en {activeTenant.name}. Podrás agregar productos y
          cliente después.
        </p>
      </div>

      <div className="rounded-xl border border-border bg-surface-raised shadow-card">
        <form onSubmit={handleSubmit} className="p-6 md:p-8">
          {error && (
            <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}
          <section className="rounded-xl border border-border bg-border-soft/60 p-4 md:p-5">
            <h2 className="text-sm font-semibold text-foreground">
              Datos del cliente{" "}
              <span className="font-normal text-muted">(opcional)</span>
            </h2>
            <p className="mt-1 text-xs text-muted">
              Puedes dejarlos vacíos y agregar o editar el cliente después desde
              la orden.
            </p>
            <div className="mt-4 grid grid-cols-1 gap-4">
              <div>
                <label
                  htmlFor="customerName"
                  className="block text-sm font-medium text-muted"
                >
                  Nombre
                </label>
                <input
                  id="customerName"
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className={inputClass}
                  placeholder="Nombre del cliente"
                />
              </div>
              <div>
                <label
                  htmlFor="customerEmail"
                  className="block text-sm font-medium text-muted"
                >
                  Email
                </label>
                <input
                  id="customerEmail"
                  type="email"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  className={inputClass}
                  placeholder="cliente@ejemplo.com"
                />
              </div>
              <div>
                <label
                  htmlFor="customerPhone"
                  className="block text-sm font-medium text-muted"
                >
                  Teléfono
                </label>
                <input
                  id="customerPhone"
                  type="tel"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className={inputClass}
                  placeholder="555 123 4567"
                />
              </div>
            </div>
          </section>

          <section className="mt-4 rounded-xl border border-border bg-border-soft/60 p-4 md:p-5">
            <h2 className="text-sm font-semibold text-foreground">
              Asignar a miembro del equipo{" "}
              <span className="font-normal text-muted">(opcional)</span>
            </h2>
            <p className="mt-1 text-xs text-muted">
              Puedes asignar la orden a alguien de tu equipo ahora o hacerlo
              después.
            </p>
            <select
              value={assignedTo}
              onChange={(e) => setAssignedTo(e.target.value)}
              className={selectClass}
            >
              <option value="">Sin asignar</option>
              {team.map((t) => (
                <option key={t.user_id} value={t.user_id}>
                  {t.display_name || t.email}
                </option>
              ))}
            </select>
          </section>

          <div className="mt-6 flex flex-wrap gap-3 border-t border-border-soft pt-6">
            <button
              type="submit"
              disabled={loading}
              className="rounded-xl bg-accent px-4 py-2.5 text-sm font-medium text-accent-foreground hover:opacity-90 disabled:opacity-50"
            >
              {loading ? "Creando..." : "Crear orden"}
            </button>
            <Link
              href={`/dashboard/${tenantSlug}/ordenes`}
              className="rounded-xl border border-border px-4 py-2.5 text-sm font-medium text-muted hover:bg-border-soft/60"
            >
              Cancelar
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
