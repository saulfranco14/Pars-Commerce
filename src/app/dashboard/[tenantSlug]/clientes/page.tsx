"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import useSWR from "swr";
import { Search, UserPlus, AlertTriangle, Users } from "lucide-react";
import { useActiveTenant } from "@/stores/useTenantStore";
import { swrFetcher } from "@/lib/swrFetcher";
import { formatMXN } from "@/lib/loanUtils";
import { NewCustomerModal } from "@/features/prestamos/components/NewCustomerModal";
import { LoadingBlock } from "@/components/ui/LoadingBlock";
import type { Customer } from "@/types/customers";

type CustomerWithLoans = Customer & {
  loans?: {
    id: string;
    amount: number;
    amount_paid: number;
    amount_pending: number;
    status: string;
    due_date: string | null;
  }[];
};

function computeStats(customer: CustomerWithLoans) {
  const loans = customer.loans ?? [];
  const activeLoans = loans.filter((l) => l.status === "pending" || l.status === "partial");
  const totalPending = activeLoans.reduce((s, l) => s + l.amount_pending, 0);
  const hasOverdue = activeLoans.some(
    (l) => l.due_date && new Date(l.due_date) < new Date()
  );
  return { activeCount: activeLoans.length, totalPending, hasOverdue };
}

export default function ClientesPage() {
  const params = useParams();
  const router = useRouter();
  const tenantSlug = params.tenantSlug as string;
  const activeTenant = useActiveTenant();

  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);

  const customersKey =
    activeTenant?.id
      ? `/api/customers?tenant_id=${activeTenant.id}&with_stats=true${search ? `&search=${encodeURIComponent(search)}` : ""}`
      : null;

  const { data: customersData, isLoading, mutate } = useSWR<CustomerWithLoans[]>(
    customersKey,
    swrFetcher,
    { fallbackData: [] }
  );
  const customers = Array.isArray(customersData) ? customersData : [];

  function handleCustomerCreated(_customer: Customer) {
    setShowModal(false);
    mutate();
  }

  if (!activeTenant) {
    return (
      <div className="text-sm text-muted-foreground">
        Selecciona un negocio para continuar.
      </div>
    );
  }

  const totalPendingAll = customers.reduce((sum, c) => sum + computeStats(c).totalPending, 0);
  const withDebt = customers.filter((c) => computeStats(c).activeCount > 0).length;
  const withOverdue = customers.filter((c) => computeStats(c).hasOverdue).length;

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4">
      {/* Header */}
      <div className="shrink-0 flex flex-col gap-4">
        <div className="flex items-center justify-between gap-2">
          <h1 className="text-xl font-semibold text-foreground sm:text-2xl">Clientes</h1>
          <button
            type="button"
            onClick={() => setShowModal(true)}
            className="inline-flex min-h-[44px] items-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-accent-foreground hover:bg-accent/90 transition-colors"
          >
            <UserPlus className="h-4 w-4" />
            Nuevo cliente
          </button>
        </div>

        {/* Stats */}
        {customers.length > 0 && (
          <div className={`grid gap-3 ${withOverdue > 0 ? "grid-cols-2 sm:grid-cols-4" : "grid-cols-3"}`}>
            <div className="rounded-xl border border-border bg-surface-raised px-4 py-3">
              <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">Clientes</p>
              <p className="mt-0.5 text-lg font-bold text-foreground">{customers.length}</p>
            </div>
            <div className="rounded-xl border border-border bg-surface-raised px-4 py-3">
              <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">Con deuda</p>
              <p className="mt-0.5 text-lg font-bold text-foreground">{withDebt}</p>
            </div>
            <div className="rounded-xl border border-border bg-surface-raised px-4 py-3">
              <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">Por cobrar</p>
              <p className="mt-0.5 text-lg font-bold text-foreground tabular-nums">{formatMXN(totalPendingAll)}</p>
            </div>
            {withOverdue > 0 && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3">
                <p className="text-[11px] font-medium text-red-600 uppercase tracking-wide">Vencidos</p>
                <p className="mt-0.5 text-lg font-bold text-red-700">{withOverdue}</p>
              </div>
            )}
          </div>
        )}

        {/* Búsqueda */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            placeholder="Buscar por nombre, teléfono o email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-form w-full min-h-[44px] rounded-xl border border-border bg-surface pl-9 pr-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
          />
        </div>
      </div>

      {/* Lista */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <LoadingBlock variant="skeleton" message="Cargando clientes" skeletonRows={6} />
        ) : customers.length === 0 ? (
          <div className="rounded-xl border border-border bg-surface-raised p-8 text-center">
            <Users className="mx-auto h-8 w-8 text-muted-foreground/40 mb-3" />
            <p className="text-sm text-muted-foreground">
              {search ? `No se encontraron clientes con "${search}".` : "Aún no tienes clientes registrados."}
            </p>
            {!search && (
              <button
                type="button"
                onClick={() => setShowModal(true)}
                className="mt-4 inline-flex min-h-[44px] items-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-accent-foreground hover:bg-accent/90 transition-colors"
              >
                <UserPlus className="h-4 w-4" />
                Crear primer cliente
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {customers.map((c) => {
              const { activeCount, totalPending, hasOverdue } = computeStats(c);
              const initials = c.name
                .split(" ")
                .slice(0, 2)
                .map((w) => w[0])
                .join("")
                .toUpperCase();
              return (
                <div
                  key={c.id}
                  className={`cursor-pointer rounded-xl border bg-surface-raised p-4 transition-colors hover:bg-surface active:scale-[0.99] ${hasOverdue ? "border-red-200" : "border-border"}`}
                  onClick={() => router.push(`/dashboard/${tenantSlug}/prestamos?customer=${c.id}`)}
                >
                  <div className="flex items-center gap-3">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold shrink-0 ${hasOverdue ? "bg-red-100 text-red-700" : activeCount > 0 ? "bg-orange-100 text-orange-700" : "bg-border-soft text-muted-foreground"}`}>
                      {initials}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground">{c.name}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {[c.phone, c.email].filter(Boolean).join(" · ") || "Sin contacto"}
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      {activeCount > 0 ? (
                        <>
                          <p className={`text-sm font-bold tabular-nums ${hasOverdue ? "text-red-700" : "text-orange-700"}`}>
                            {formatMXN(totalPending)}
                          </p>
                          <p className="text-[11px] text-muted-foreground">
                            {activeCount} préstamo{activeCount !== 1 ? "s" : ""}
                          </p>
                        </>
                      ) : (
                        <span className="inline-flex items-center rounded-full bg-green-50 px-2 py-0.5 text-[11px] font-medium text-green-700">
                          Sin deuda
                        </span>
                      )}
                    </div>
                  </div>
                  {hasOverdue && (
                    <div className="mt-2 ml-[52px] inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
                      <AlertTriangle className="h-3 w-3" />
                      Tiene vencidos
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal: crear cliente */}
      {showModal && (
        <NewCustomerModal
          activeTenantId={activeTenant.id}
          onSuccess={handleCustomerCreated}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  );
}
