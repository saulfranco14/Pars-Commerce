"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import useSWR from "swr";
import { Plus, AlertTriangle, Clock, CheckCircle2, XCircle } from "lucide-react";
import { FAB } from "@/components/ui/FAB";
import { FilterTabs } from "@/components/ui/FilterTabs";
import { LoadingBlock } from "@/components/ui/LoadingBlock";
import { LoansOnboardingOverlay } from "@/components/onboarding/LoansOnboardingOverlay";
import {
  TableWrapper,
  tableHeaderRowClass,
  tableHeaderCellClass,
  tableHeaderCellRightClass,
  tableBodyRowClass,
  tableBodyCellClass,
  tableBodyCellMutedClass,
  tableBodyCellRightClass,
} from "@/components/ui/TableWrapper";
import { useActiveTenant } from "@/stores/useTenantStore";
import { swrFetcher } from "@/lib/swrFetcher";
import {
  LOAN_STATUS_LABEL,
  formatMXN,
  isLoanOverdue,
  calcInterestAccrued,
} from "@/lib/loanUtils";
import type { Loan } from "@/types/loans";

type LoanWithCustomer = Loan & {
  customer: { id: string; name: string; email: string | null; phone: string | null } | null;
};

const STATUS_TABS = [
  { label: "Activos", value: "active" },
  { label: "Pendiente", value: "pending" },
  { label: "Parcial", value: "partial" },
  { label: "Pagados", value: "paid" },
  { label: "Cancelados", value: "cancelled" },
  { label: "Todos", value: "" },
];

function LoanStatusBadge({ loan }: { loan: LoanWithCustomer }) {
  const overdue = isLoanOverdue(loan);
  if (loan.status === "paid") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">
        <CheckCircle2 className="h-3 w-3" />
        Pagado
      </span>
    );
  }
  if (loan.status === "cancelled") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
        <XCircle className="h-3 w-3" />
        Cancelado
      </span>
    );
  }
  if (overdue) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
        <AlertTriangle className="h-3 w-3" />
        Vencido
      </span>
    );
  }
  if (loan.status === "partial") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
        <Clock className="h-3 w-3" />
        Parcial
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-orange-100 px-2 py-0.5 text-xs font-medium text-orange-700">
      <Clock className="h-3 w-3" />
      Pendiente
    </span>
  );
}

export default function PrestamosPage() {
  const params = useParams();
  const router = useRouter();
  const tenantSlug = params.tenantSlug as string;
  const activeTenant = useActiveTenant();
  const [statusFilter, setStatusFilter] = useState("active");
  const [overdueOnly, setOverdueOnly] = useState(false);

  const loansKey =
    activeTenant?.id
      ? `/api/loans?tenant_id=${activeTenant.id}${statusFilter ? `&status=${statusFilter}` : ""}${overdueOnly ? "&overdue=true" : ""}`
      : null;

  const { data: loansData, isLoading, error: swrError } = useSWR<LoanWithCustomer[]>(
    loansKey,
    swrFetcher,
    { fallbackData: [] }
  );
  const loans = Array.isArray(loansData) ? loansData : [];

  // Resumen rápido
  const totalPending = loans
    .filter((l) => l.status !== "paid" && l.status !== "cancelled")
    .reduce((sum, l) => sum + l.amount_pending, 0);
  const overdueCount = loans.filter(isLoanOverdue).length;

  if (!activeTenant) {
    return (
      <div className="text-sm text-muted-foreground">
        Selecciona un negocio para continuar.
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden gap-4">
      {/* Header */}
      <div className="shrink-0 flex flex-col gap-4">
        <div className="flex items-center justify-between gap-2">
          <h1 className="text-xl font-semibold text-foreground sm:text-2xl">Préstamos</h1>
          <Link
            href={`/dashboard/${tenantSlug}/prestamos/nuevo`}
            className="hidden md:inline-flex min-h-[44px] items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-accent-foreground transition-colors hover:bg-accent/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
          >
            <Plus className="h-4 w-4 shrink-0" />
            Nuevo préstamo
          </Link>
        </div>

        {/* Stats rápidas */}
        {(statusFilter === "active" || statusFilter === "") && loans.length > 0 && (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-border bg-surface-raised px-4 py-3">
              <p className="text-xs text-muted-foreground">Por cobrar</p>
              <p className="mt-0.5 text-lg font-semibold text-foreground">{formatMXN(totalPending)}</p>
            </div>
            <div className="rounded-xl border border-border bg-surface-raised px-4 py-3">
              <p className="text-xs text-muted-foreground">Préstamos activos</p>
              <p className="mt-0.5 text-lg font-semibold text-foreground">
                {loans.filter((l) => l.status !== "paid" && l.status !== "cancelled").length}
              </p>
            </div>
            {overdueCount > 0 && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3">
                <p className="text-xs text-red-600">Vencidos</p>
                <p className="mt-0.5 text-lg font-semibold text-red-700">{overdueCount}</p>
              </div>
            )}
          </div>
        )}

        {/* Filtros */}
        <div className="flex flex-col gap-2">
          <FilterTabs
            tabs={STATUS_TABS}
            activeValue={statusFilter}
            onTabChange={(v) => {
              setStatusFilter(v);
              setOverdueOnly(false);
            }}
            ariaLabel="Filtrar por estado"
          />
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setOverdueOnly((o) => !o)}
              className={`inline-flex min-h-[36px] items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                overdueOnly
                  ? "bg-red-100 text-red-700 hover:bg-red-200"
                  : "bg-border-soft/60 text-muted-foreground hover:bg-border-soft hover:text-foreground"
              }`}
            >
              <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
              Solo vencidos
            </button>
          </div>
        </div>

        {swrError && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            No se pudieron cargar los préstamos.
          </div>
        )}
      </div>

      {/* Tabla */}
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        {isLoading ? (
          <LoadingBlock variant="skeleton" message="Cargando préstamos" skeletonRows={6} />
        ) : loans.length === 0 ? (
          <div className="rounded-xl border border-border bg-surface-raised p-8 text-center">
            <p className="text-sm text-muted">
              {overdueOnly
                ? "No hay préstamos vencidos."
                : statusFilter === "active"
                ? "No hay préstamos activos."
                : `No hay préstamos${LOAN_STATUS_LABEL[statusFilter as keyof typeof LOAN_STATUS_LABEL] ? ` con estado "${LOAN_STATUS_LABEL[statusFilter as keyof typeof LOAN_STATUS_LABEL]}"` : ""}.`}
            </p>
            <Link
              href={`/dashboard/${tenantSlug}/prestamos/nuevo`}
              className="mt-4 inline-flex min-h-[44px] items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-accent-foreground transition-colors hover:bg-accent/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
            >
              <Plus className="h-4 w-4" />
              Registrar préstamo
            </Link>
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden min-h-0 flex-1 flex-col overflow-hidden md:flex">
              <TableWrapper scrollable>
                <table className="min-w-full">
                  <thead>
                    <tr className={tableHeaderRowClass}>
                      <th className={tableHeaderCellClass}>Cliente</th>
                      <th className={tableHeaderCellClass}>Concepto</th>
                      <th className={tableHeaderCellClass}>Estado</th>
                      <th className={tableHeaderCellClass}>Vencimiento</th>
                      <th className={tableHeaderCellRightClass}>Total</th>
                      <th className={tableHeaderCellRightClass}>Pendiente</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loans.map((loan) => {
                      const interest = calcInterestAccrued(loan);
                      const overdue = isLoanOverdue(loan);
                      return (
                        <tr
                          key={loan.id}
                          className={`cursor-pointer ${tableBodyRowClass} ${overdue ? "bg-red-50/40" : ""}`}
                          onClick={() => router.push(`/dashboard/${tenantSlug}/prestamos/${loan.id}`)}
                        >
                          <td className={tableBodyCellClass}>
                            <span className="font-medium text-foreground">
                              {loan.customer?.name ?? "—"}
                            </span>
                            {loan.customer?.phone && (
                              <span className="block text-xs text-muted-foreground">
                                {loan.customer.phone}
                              </span>
                            )}
                          </td>
                          <td className={tableBodyCellClass}>
                            <span className="line-clamp-1">{loan.concept}</span>
                          </td>
                          <td className={tableBodyCellClass}>
                            <LoanStatusBadge loan={loan} />
                          </td>
                          <td className={tableBodyCellMutedClass}>
                            {loan.due_date ? (
                              <span className={overdue ? "font-medium text-red-600" : ""}>
                                {new Date(loan.due_date).toLocaleDateString("es-MX", {
                                  day: "2-digit",
                                  month: "short",
                                  year: "numeric",
                                })}
                              </span>
                            ) : (
                              "—"
                            )}
                          </td>
                          <td className={tableBodyCellRightClass}>
                            {formatMXN(loan.amount)}
                          </td>
                          <td className={`${tableBodyCellRightClass} ${loan.status !== "paid" && loan.status !== "cancelled" ? "font-semibold text-foreground" : ""}`}>
                            {formatMXN(loan.amount_pending + interest)}
                            {interest > 0 && (
                              <span className="block text-xs text-amber-600">
                                +{formatMXN(interest)} interés
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </TableWrapper>
            </div>

            {/* Mobile cards */}
            <div className="flex-1 overflow-y-auto md:hidden">
              <div className="space-y-3">
                {loans.map((loan) => {
                  const interest = calcInterestAccrued(loan);
                  const overdue = isLoanOverdue(loan);
                  return (
                    <div
                      key={loan.id}
                      className={`cursor-pointer rounded-xl border bg-surface-raised p-4 transition-colors hover:bg-surface active:scale-[0.99] ${overdue ? "border-red-200 bg-red-50/40" : "border-border"}`}
                      onClick={() => router.push(`/dashboard/${tenantSlug}/prestamos/${loan.id}`)}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="font-medium text-foreground truncate">
                            {loan.customer?.name ?? "Cliente desconocido"}
                          </p>
                          <p className="text-sm text-muted-foreground truncate">{loan.concept}</p>
                        </div>
                        <LoanStatusBadge loan={loan} />
                      </div>
                      <div className="mt-3 flex items-end justify-between gap-2">
                        <div>
                          {loan.due_date && (
                            <p className={`text-xs ${overdue ? "font-medium text-red-600" : "text-muted-foreground"}`}>
                              Vence:{" "}
                              {new Date(loan.due_date).toLocaleDateString("es-MX", {
                                day: "2-digit",
                                month: "short",
                              })}
                            </p>
                          )}
                        </div>
                        <div className="text-right">
                          {loan.status !== "paid" && loan.status !== "cancelled" && (
                            <p className="text-lg font-bold text-foreground">
                              {formatMXN(loan.amount_pending + interest)}
                            </p>
                          )}
                          <p className="text-xs text-muted-foreground">
                            de {formatMXN(loan.amount)}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </div>

      <FAB href={`/dashboard/${tenantSlug}/prestamos/nuevo`} aria-label="Nuevo préstamo">
        <Plus className="h-6 w-6 shrink-0" />
      </FAB>

      <LoansOnboardingOverlay />
    </div>
  );
}
