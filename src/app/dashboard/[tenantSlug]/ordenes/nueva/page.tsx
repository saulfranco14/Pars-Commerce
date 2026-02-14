"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useTenantStore } from "@/stores/useTenantStore";
import { ArrowLeft, Plus, X } from "lucide-react";
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
    "input-form mt-1 block w-full min-h-[44px] rounded-xl border border-border px-3 py-2.5 text-base text-foreground placeholder:text-muted transition-colors duration-200 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 focus-visible:border-accent focus-visible:ring-accent/20";
  const selectClass =
    "input-form select-custom mt-3 block w-full min-h-[44px] rounded-xl border border-border px-3 py-2.5 text-sm text-foreground transition-colors duration-200 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 focus-visible:border-accent focus-visible:ring-accent/20";

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-auto">
      <div className="mx-auto max-w-2xl space-y-4">
      <div className="shrink-0 border-b border-border-soft pb-4">
        <Link
          href={`/dashboard/${tenantSlug}/ordenes`}
          className="inline-flex items-center gap-2 rounded-lg text-sm font-medium text-muted-foreground transition-colors duration-200 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
        >
          <ArrowLeft className="h-4 w-4 shrink-0" aria-hidden />
          Volver a órdenes
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
        <form onSubmit={handleSubmit} className="p-4 md:p-8">
          {error && (
            <div className="mb-6 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 alert-error">
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
                  className="block text-sm font-medium text-muted-foreground"
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
                  className="block text-sm font-medium text-muted-foreground"
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
                  className="block text-sm font-medium text-muted-foreground"
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

          <div className="mt-6 flex gap-3 border-t border-border pt-6">
            <Link
              href={`/dashboard/${tenantSlug}/ordenes`}
              className="inline-flex min-h-[44px] flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-muted-foreground transition-colors duration-200 hover:bg-border-soft/60 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:ring-offset-2"
            >
              <X className="h-4 w-4 shrink-0" aria-hidden />
              Cancelar
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex min-h-[44px] flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-accent-foreground transition-colors duration-200 hover:bg-accent/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70"
            >
              <Plus className="h-4 w-4 shrink-0" aria-hidden />
              {loading ? "Creando…" : "Crear orden"}
            </button>
          </div>
        </form>
      </div>
      </div>
    </div>
  );
}
