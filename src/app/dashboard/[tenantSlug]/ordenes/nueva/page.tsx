"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import useSWR from "swr";
import { useTenantStore } from "@/stores/useTenantStore";
import { ChevronDown } from "lucide-react";
import { MemberPickerSheet } from "@/components/orders/MemberPickerSheet";
import { CreateEditHeader } from "@/components/layout/CreateEditHeader";
import { CreateCancelActions } from "@/components/layout/CreateCancelActions";
import { inputForm, inputFormSelect, inputFormTrigger } from "@/components/ui/inputClasses";
import type { TeamMember } from "@/types/team";
import { create as createOrder } from "@/services/ordersService";
import { swrFetcher } from "@/lib/swrFetcher";

const teamKey = (tenantId: string) =>
  `/api/team?tenant_id=${encodeURIComponent(tenantId)}`;

export default function NuevaOrdenPage() {
  const params = useParams();
  const router = useRouter();
  const tenantSlug = params.tenantSlug as string;
  const activeTenant = useTenantStore((s) => s.activeTenant)();

  const teamKeyValue = activeTenant ? teamKey(activeTenant.id) : null;
  const { data: teamData } = useSWR<TeamMember[]>(teamKeyValue, swrFetcher, {
    fallbackData: [],
  });
  const team = Array.isArray(teamData) ? teamData : [];

  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [assignedTo, setAssignedTo] = useState("");
  const [memberPickerOpen, setMemberPickerOpen] = useState(false);
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

  const assignedLabel =
    assignedTo && team.find((t) => t.user_id === assignedTo)
      ? team.find((t) => t.user_id === assignedTo)?.display_name ||
        team.find((t) => t.user_id === assignedTo)?.email ||
        "Sin asignar"
      : "Sin asignar";

  const ordersHref = `/dashboard/${tenantSlug}/ordenes`;

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-auto">
      <div className="mx-auto w-full max-w-2xl flex-1 flex flex-col px-1 md:px-0">
        <CreateEditHeader
          title="Nueva orden"
          backHref={ordersHref}
        />
        <p className="mb-4 text-sm leading-relaxed text-muted">
          Crea un ticket en {activeTenant.name}. Podrás agregar productos y
          cliente después.
        </p>

        <form
          onSubmit={handleSubmit}
          className="flex min-h-0 flex-1 flex-col gap-0 pb-40 md:pb-0"
        >
          {error && (
            <div className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 alert-error">
              {error}
            </div>
          )}
          <section className="rounded-lg border border-border bg-surface p-4 sm:p-5">
            <h2 className="text-base font-semibold text-foreground">
              Datos del cliente{" "}
              <span className="font-normal text-muted">(opcional)</span>
            </h2>
            <p className="mt-1.5 text-sm text-muted">
              Déjalos vacíos y agrega o edita el cliente después desde la orden.
            </p>
            <div className="mt-5 grid grid-cols-1 gap-4 sm:gap-4 md:grid-cols-2 md:gap-4">
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
                  inputMode="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className={inputForm}
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
                  className={inputForm}
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
                  className={inputForm}
                  placeholder="555 123 4567"
                />
              </div>
            </div>
          </section>

          <section className="mt-4 rounded-xl border border-border bg-surface p-4 sm:p-5">
            <h2 className="text-base font-semibold text-foreground">
              Asignar a miembro{" "}
              <span className="font-normal text-muted">(opcional)</span>
            </h2>
            <p className="mt-1.5 text-sm text-muted">
              Asigna ahora o hazlo después desde la orden.
            </p>
            <button
              type="button"
              onClick={() => setMemberPickerOpen(true)}
              className={`mt-3 w-full md:hidden ${inputFormTrigger}`}
            >
              <span>{assignedLabel}</span>
              <ChevronDown className="h-5 w-5 shrink-0 text-muted-foreground" aria-hidden />
            </button>
            <select
              value={assignedTo}
              onChange={(e) => setAssignedTo(e.target.value)}
              className={`${inputFormSelect} hidden md:block`}
            >
              <option value="">Sin asignar</option>
              {team.map((t) => (
                <option key={t.user_id} value={t.user_id}>
                  {t.display_name || t.email}
                </option>
              ))}
            </select>
            <MemberPickerSheet
              isOpen={memberPickerOpen}
              onClose={() => setMemberPickerOpen(false)}
              value={assignedTo}
              onChange={setAssignedTo}
              team={team}
            />
          </section>

          <div className="mt-6 flex flex-col gap-3 pt-6 md:flex-row md:gap-3">
            <CreateCancelActions
              createLabel="Crear orden"
              cancelHref={ordersHref}
              loading={loading}
              loadingLabel="Creando…"
            />
          </div>
        </form>
      </div>
    </div>
  );
}
