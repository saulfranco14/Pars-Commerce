"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import useSWR from "swr";
import { useTenantStore } from "@/stores/useTenantStore";
import { ConfirmModal } from "@/components/ConfirmModal";
import { LoadingBlock } from "@/components/ui/LoadingBlock";
import {
  TableWrapper,
  tableHeaderRowClass,
  tableHeaderCellClass,
  tableBodyRowClass,
  tableBodyCellClass,
  tableBodyCellMutedClass,
} from "@/components/ui/TableWrapper";
import { swrFetcher } from "@/lib/swrFetcher";
import type {
  SalesCommission,
  CommissionSummary,
  CommissionPayment,
} from "@/types/sales";
import type { TeamMember } from "@/types/team";
import {
  update as updateSalesCommission,
} from "@/services/salesCommissionsService";
import {
  create as createCommissionPayment,
  update as updateCommissionPayment,
} from "@/services/commissionPaymentsService";

type TabView = "resumen" | "por-persona" | "por-orden" | "pagos";

function buildCommissionsKey(
  tenantId: string,
  userFilter: string,
  paidFilter: string,
  dateFrom: string,
  dateTo: string
): string {
  const search = new URLSearchParams({ tenant_id: tenantId });
  if (userFilter) search.set("user_id", userFilter);
  if (paidFilter) search.set("is_paid", paidFilter);
  if (dateFrom) search.set("date_from", dateFrom);
  if (dateTo) search.set("date_to", dateTo);
  return `/api/sales-commissions?${search}`;
}

function buildPaymentsKey(
  tenantId: string,
  selectedUser: string,
  paymentStatus: string
): string {
  const search = new URLSearchParams({ tenant_id: tenantId });
  if (selectedUser) search.set("user_id", selectedUser);
  if (paymentStatus) search.set("status", paymentStatus);
  return `/api/commission-payments?${search}`;
}

export default function VentasPage() {
  const params = useParams();
  const tenantSlug = params.tenantSlug as string;
  const activeTenant = useTenantStore((s) => s.activeTenant)();

  const [activeTab, setActiveTab] = useState<TabView>("resumen");
  const [actionError, setActionError] = useState<string | null>(null);

  const [userFilter, setUserFilter] = useState("");
  const [paidFilter, setPaidFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const [periodType, setPeriodType] = useState<"day" | "week" | "month">(
    "week"
  );
  const [selectedUser, setSelectedUser] = useState("");
  const [paymentStatus, setPaymentStatus] = useState("pending");

  const [commissionToPay, setCommissionToPay] =
    useState<SalesCommission | null>(null);
  const [paymentToPay, setPaymentToPay] = useState<CommissionPayment | null>(
    null
  );
  const [paymentToEdit, setPaymentToEdit] = useState<CommissionPayment | null>(
    null
  );
  const [editAmount, setEditAmount] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const teamKey = activeTenant
    ? `/api/team?tenant_id=${encodeURIComponent(activeTenant.id)}`
    : null;
  const { data: teamData, error: teamError } = useSWR<TeamMember[]>(
    teamKey,
    swrFetcher
  );
  const teamMembers = Array.isArray(teamData)
    ? teamData.map((m) => ({
        id: m.user_id,
        display_name: m.display_name ?? null,
        email: m.email ?? null,
      }))
    : [];

  const commissionsKey =
    activeTenant && activeTab !== "pagos"
      ? buildCommissionsKey(
          activeTenant.id,
          userFilter,
          paidFilter,
          dateFrom,
          dateTo
        )
      : null;
  const { data: commissionsData, error: commissionsError, isLoading: commissionsLoading, mutate: mutateCommissions } = useSWR<
    SalesCommission[]
  >(commissionsKey, swrFetcher, { fallbackData: [] });
  const commissionsFromTab =
    Array.isArray(commissionsData) ? commissionsData : [];

  const pendingCommissionsKey =
    activeTenant && activeTab === "pagos"
      ? `/api/sales-commissions?tenant_id=${encodeURIComponent(activeTenant.id)}&is_paid=false`
      : null;
  const { data: pendingData, isLoading: pendingLoading, mutate: mutatePendingCommissions } = useSWR<
    SalesCommission[]
  >(pendingCommissionsKey, swrFetcher, { fallbackData: [] });
  const pendingCommissions = Array.isArray(pendingData) ? pendingData : [];

  const paymentsKey =
    activeTenant && activeTab === "pagos"
      ? buildPaymentsKey(activeTenant.id, selectedUser, paymentStatus)
      : null;
  const { data: paymentsData, error: paymentsError, isLoading: paymentsLoading, mutate: mutatePayments } = useSWR<
    CommissionPayment[]
  >(paymentsKey, swrFetcher, { fallbackData: [] });
  const payments = Array.isArray(paymentsData) ? paymentsData : [];

  const commissions =
    activeTab === "pagos" ? pendingCommissions : commissionsFromTab;
  const loading =
    activeTab !== "pagos"
      ? commissionsLoading
      : pendingLoading || paymentsLoading;
  const error =
    actionError ??
    (teamError ? "No se pudieron cargar los miembros del equipo" : null) ??
    (commissionsError ? "No se pudieron cargar las comisiones" : null) ??
    (paymentsError ? "No se pudieron cargar los pagos" : null);

  async function handleMarkAsPaid() {
    if (!commissionToPay) return;
    setActionLoading(true);
    setActionError(null);
    try {
      await updateSalesCommission(commissionToPay.id, { is_paid: true });
      setCommissionToPay(null);
      await Promise.all([mutateCommissions(), mutatePendingCommissions()]);
    } catch {
      setActionError("No se pudo marcar la comisión como pagada");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleGeneratePayment(userId: string) {
    if (!activeTenant) return;
    setActionLoading(true);
    setActionError(null);

    const now = new Date();
    let periodStart: Date;
    let periodEnd: Date;

    if (periodType === "day") {
      periodStart = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
        0,
        0,
        0
      );
      periodEnd = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
        23,
        59,
        59
      );
    } else if (periodType === "week") {
      const dayOfWeek = now.getDay();
      const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
      periodStart = new Date(now);
      periodStart.setDate(now.getDate() - diff);
      periodStart.setHours(0, 0, 0, 0);
      periodEnd = new Date(periodStart);
      periodEnd.setDate(periodStart.getDate() + 6);
      periodEnd.setHours(23, 59, 59, 999);
    } else {
      periodStart = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);
      periodEnd = new Date(
        now.getFullYear(),
        now.getMonth() + 1,
        0,
        23,
        59,
        59
      );
    }

    try {
      await createCommissionPayment({
        tenant_id: activeTenant.id,
        user_id: userId,
        period_type: periodType,
        period_start: periodStart.toISOString().split("T")[0],
        period_end: periodEnd.toISOString().split("T")[0],
      });
      await Promise.all([mutatePayments(), mutatePendingCommissions()]);
    } catch {
      setActionError("No se pudo generar el pago del período");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleMarkPaymentAsPaid() {
    if (!paymentToPay) return;
    setActionLoading(true);
    setActionError(null);
    try {
      await updateCommissionPayment(paymentToPay.id, { payment_status: "paid" });
      setPaymentToPay(null);
      await Promise.all([mutatePayments(), mutatePendingCommissions()]);
    } catch {
      setActionError("No se pudo marcar el pago como pagado");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleUpdatePaymentAmount() {
    if (!paymentToEdit) return;
    const amount = parseFloat(editAmount);
    if (isNaN(amount) || amount < 0) {
      setActionError("Monto inválido");
      return;
    }
    setActionLoading(true);
    setActionError(null);
    try {
      await updateCommissionPayment(paymentToEdit.id, {
        commission_amount: amount,
      });
      setPaymentToEdit(null);
      setEditAmount("");
      await mutatePayments();
    } catch {
      setActionError("No se pudo actualizar el monto");
    } finally {
      setActionLoading(false);
    }
  }

  const summary = commissions.reduce(
    (acc, c) => ({
      totalRevenue: acc.totalRevenue + Number(c.total_revenue),
      totalCost: acc.totalCost + Number(c.total_cost),
      grossProfit: acc.grossProfit + Number(c.gross_profit),
      pendingCommission:
        acc.pendingCommission + (c.is_paid ? 0 : Number(c.commission_amount)),
      paidCommission:
        acc.paidCommission + (c.is_paid ? Number(c.commission_amount) : 0),
    }),
    {
      totalRevenue: 0,
      totalCost: 0,
      grossProfit: 0,
      pendingCommission: 0,
      paidCommission: 0,
    }
  );

  const byPerson: CommissionSummary[] = [];
  const grouped = commissions.reduce((acc, c) => {
    const uid = c.user_id;
    if (!acc[uid]) {
      acc[uid] = {
        user_id: uid,
        display_name: c.profiles?.display_name ?? null,
        email: c.profiles?.email ?? null,
        total_orders: 0,
        total_items: 0,
        products_sold: 0,
        services_sold: 0,
        total_revenue: 0,
        total_cost: 0,
        gross_profit: 0,
        total_commission: 0,
        paid_commission: 0,
        pending_commission: 0,
      };
    }
    acc[uid].total_orders += 1;
    acc[uid].total_items += c.total_items_sold;
    acc[uid].products_sold += c.products_count;
    acc[uid].services_sold += c.services_count;
    acc[uid].total_revenue += Number(c.total_revenue);
    acc[uid].total_cost += Number(c.total_cost);
    acc[uid].gross_profit += Number(c.gross_profit);
    acc[uid].total_commission += Number(c.commission_amount);
    if (c.is_paid) {
      acc[uid].paid_commission += Number(c.commission_amount);
    } else {
      acc[uid].pending_commission += Number(c.commission_amount);
    }
    return acc;
  }, {} as Record<string, CommissionSummary>);

  for (const uid in grouped) {
    byPerson.push(grouped[uid]);
  }

  if (!activeTenant) {
    return (
      <div className="text-sm text-muted-foreground">
        Selecciona un negocio para continuar.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-xl font-semibold text-foreground sm:text-2xl">
          Ventas y Comisiones
        </h1>
      </div>

      <div className="rounded-xl border border-border bg-border-soft/80 overflow-hidden">
        <button
          type="button"
          onClick={() => setFiltersOpen((o) => !o)}
          className="flex min-h-[44px] w-full items-center justify-between gap-2 px-4 py-3 text-left text-sm font-medium text-foreground hover:bg-border-soft/60"
          aria-expanded={filtersOpen}
          aria-controls="ventas-filters-content"
          id="ventas-filters-trigger"
        >
          <span>Filtros</span>
          <span
            className={`shrink-0 text-muted transition-transform duration-200 ${filtersOpen ? "rotate-180" : ""}`}
            aria-hidden
          >
            ▼
          </span>
        </button>
        {filtersOpen && (
          <div
            id="ventas-filters-content"
            role="region"
            aria-labelledby="ventas-filters-trigger"
            className="border-t border-border px-4 pb-4 pt-3"
          >
            {activeTab !== "pagos" ? (
              <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3">
                <label className="flex w-full flex-col gap-1.5 sm:min-w-[120px] sm:flex-1 sm:flex-row sm:items-center sm:gap-1.5">
                  <span className="text-sm font-medium text-muted-foreground sm:shrink-0">Persona</span>
                  <select
                    value={userFilter}
                    onChange={(e) => setUserFilter(e.target.value)}
                    className="input-form select-custom min-h-[44px] w-full rounded-xl border px-3 py-2.5 text-sm text-foreground focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 sm:min-h-0 sm:flex-1 sm:py-1.5"
                  >
                    <option value="">Todas</option>
                    {teamMembers.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.display_name || m.email}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="flex w-full flex-col gap-1.5 sm:min-w-[120px] sm:flex-1 sm:flex-row sm:items-center sm:gap-1.5">
                  <span className="text-sm font-medium text-muted-foreground sm:shrink-0">Estado</span>
                  <select
                    value={paidFilter}
                    onChange={(e) => setPaidFilter(e.target.value)}
                    className="input-form select-custom min-h-[44px] w-full rounded-xl border px-3 py-2.5 text-sm text-foreground focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 sm:min-h-0 sm:flex-1 sm:py-1.5"
                  >
                    <option value="">Todas</option>
                    <option value="false">Pendientes</option>
                    <option value="true">Pagadas</option>
                  </select>
                </label>
                <label className="flex w-full flex-col gap-1.5 sm:min-w-[120px] sm:flex-1 sm:flex-row sm:items-center sm:gap-1.5">
                  <span className="text-sm font-medium text-muted-foreground sm:shrink-0">Desde</span>
                  <input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    className="input-form min-h-[44px] w-full rounded-xl border px-3 py-2.5 text-sm text-foreground focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 sm:min-h-0 sm:flex-1 sm:py-1.5"
                  />
                </label>
                <label className="flex w-full flex-col gap-1.5 sm:min-w-[120px] sm:flex-1 sm:flex-row sm:items-center sm:gap-1.5">
                  <span className="text-sm font-medium text-muted-foreground sm:shrink-0">Hasta</span>
                  <input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    className="input-form min-h-[44px] w-full rounded-xl border px-3 py-2.5 text-sm text-foreground focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 sm:min-h-0 sm:flex-1 sm:py-1.5"
                  />
                </label>
              </div>
            ) : (
              <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3">
                <label className="flex w-full flex-col gap-1.5 sm:min-w-[120px] sm:flex-1 sm:flex-row sm:items-center sm:gap-1.5">
                  <span className="text-sm font-medium text-muted-foreground sm:shrink-0">Período</span>
                  <select
                    value={periodType}
                    onChange={(e) =>
                      setPeriodType(e.target.value as "day" | "week" | "month")
                    }
                    className="input-form select-custom min-h-[44px] w-full rounded-xl border px-3 py-2.5 text-sm text-foreground focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 sm:min-h-0 sm:flex-1 sm:py-1.5"
                  >
                    <option value="day">Día</option>
                    <option value="week">Semana</option>
                    <option value="month">Mes</option>
                  </select>
                </label>
                <label className="flex w-full flex-col gap-1.5 sm:min-w-[120px] sm:flex-1 sm:flex-row sm:items-center sm:gap-1.5">
                  <span className="text-sm font-medium text-muted-foreground sm:shrink-0">Persona</span>
                  <select
                    value={selectedUser}
                    onChange={(e) => setSelectedUser(e.target.value)}
                    className="input-form select-custom min-h-[44px] w-full rounded-xl border px-3 py-2.5 text-sm text-foreground focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 sm:min-h-0 sm:flex-1 sm:py-1.5"
                  >
                    <option value="">Todas</option>
                    {teamMembers.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.display_name || m.email}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="flex w-full flex-col gap-1.5 sm:min-w-[120px] sm:flex-1 sm:flex-row sm:items-center sm:gap-1.5">
                  <span className="text-sm font-medium text-muted-foreground sm:shrink-0">Estado</span>
                  <select
                    value={paymentStatus}
                    onChange={(e) => setPaymentStatus(e.target.value)}
                    className="input-form select-custom min-h-[44px] w-full rounded-xl border px-3 py-2.5 text-sm text-foreground focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 sm:min-h-0 sm:flex-1 sm:py-1.5"
                  >
                    <option value="">Todos</option>
                    <option value="pending">Pendientes</option>
                    <option value="paid">Pagados</option>
                  </select>
                </label>
              </div>
            )}
          </div>
        )}
        {!filtersOpen && (
          <p className="border-t border-border px-4 py-2 text-xs text-muted" aria-hidden>
            {activeTab !== "pagos"
              ? `${userFilter ? (teamMembers.find((m) => m.id === userFilter)?.display_name || teamMembers.find((m) => m.id === userFilter)?.email || "—") : "Todas"} · ${paidFilter === "true" ? "Pagadas" : paidFilter === "false" ? "Pendientes" : "Todas"}${dateFrom || dateTo ? ` · ${dateFrom || "—"} a ${dateTo || "—"}` : ""}`
              : `Período: ${periodType === "day" ? "Día" : periodType === "week" ? "Semana" : "Mes"} · ${selectedUser ? (teamMembers.find((m) => m.id === selectedUser)?.display_name || teamMembers.find((m) => m.id === selectedUser)?.email || "—") : "Todas"} · ${paymentStatus === "paid" ? "Pagados" : paymentStatus === "pending" ? "Pendientes" : "Todos"}`}
          </p>
        )}
      </div>

      <div className="md:hidden">
        <label className="sr-only" htmlFor="ventas-tab-select">
          Ver sección
        </label>
        <select
          id="ventas-tab-select"
          value={activeTab}
          onChange={(e) => setActiveTab(e.target.value as TabView)}
          className="input-form select-custom min-h-[44px] w-full appearance-none rounded-xl border px-4 py-2.5 text-sm font-medium text-foreground focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
          aria-label="Seleccionar sección de ventas"
        >
          <option value="resumen">Resumen</option>
          <option value="por-persona">Por persona</option>
          <option value="por-orden">Por orden</option>
          <option value="pagos">Pagos</option>
        </select>
      </div>
      <div className="hidden gap-1 border-b border-border-soft md:flex">
        <button
          type="button"
          onClick={() => setActiveTab("resumen")}
          className={`min-h-[44px] shrink-0 px-4 py-2.5 text-sm font-medium transition-colors ${
            activeTab === "resumen"
              ? "border-b-2 border-accent text-foreground"
              : "text-muted hover:text-foreground active:text-foreground"
          }`}
          aria-label="Ver resumen"
          aria-pressed={activeTab === "resumen"}
        >
          Resumen
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("por-persona")}
          className={`min-h-[44px] shrink-0 px-4 py-2.5 text-sm font-medium transition-colors ${
            activeTab === "por-persona"
              ? "border-b-2 border-accent text-foreground"
              : "text-muted hover:text-foreground active:text-foreground"
          }`}
          aria-label="Por persona"
          aria-pressed={activeTab === "por-persona"}
        >
          Por persona
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("por-orden")}
          className={`min-h-[44px] shrink-0 px-4 py-2.5 text-sm font-medium transition-colors ${
            activeTab === "por-orden"
              ? "border-b-2 border-accent text-foreground"
              : "text-muted hover:text-foreground active:text-foreground"
          }`}
          aria-label="Por orden"
          aria-pressed={activeTab === "por-orden"}
        >
          Por orden
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("pagos")}
          className={`min-h-[44px] shrink-0 px-4 py-2.5 text-sm font-medium transition-colors ${
            activeTab === "pagos"
              ? "border-b-2 border-accent text-foreground"
              : "text-muted hover:text-foreground active:text-foreground"
          }`}
          aria-label="Pagos"
          aria-pressed={activeTab === "pagos"}
        >
          Pagos
        </button>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <LoadingBlock message="Cargando ventas…" />
      ) : activeTab === "resumen" ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5 sm:gap-4">
          <div className="rounded-xl border border-border bg-surface-raised p-4">
            <p className="text-xs font-medium text-muted">Total vendido</p>
            <p className="mt-1.5 text-xl font-bold tabular-nums text-foreground">
              ${summary.totalRevenue.toFixed(2)}
            </p>
          </div>
          <div className="rounded-xl border border-border bg-surface-raised p-4">
            <p className="text-xs font-medium text-muted">Costo total</p>
            <p className="mt-1.5 text-xl font-bold tabular-nums text-foreground">
              ${summary.totalCost.toFixed(2)}
            </p>
          </div>
          <div className="rounded-xl border border-border bg-surface-raised p-4">
            <p className="text-xs font-medium text-muted">Ganancia bruta</p>
            <p className="mt-1.5 text-xl font-bold tabular-nums text-accent">
              ${summary.grossProfit.toFixed(2)}
            </p>
          </div>
          <div className="rounded-xl border border-border bg-surface-raised p-4">
            <p className="text-xs font-medium text-muted">
              Comisiones pendientes
            </p>
            <p className="mt-1.5 text-xl font-bold tabular-nums text-amber-700">
              ${summary.pendingCommission.toFixed(2)}
            </p>
          </div>
          <div className="rounded-xl border border-border bg-surface-raised p-4">
            <p className="text-xs font-medium text-muted">
              Comisiones pagadas
            </p>
            <p className="mt-1.5 text-xl font-bold tabular-nums text-foreground">
              ${summary.paidCommission.toFixed(2)}
            </p>
          </div>
        </div>
      ) : activeTab === "por-persona" ? (
        <>
          <div className="space-y-4 md:hidden">
            {byPerson.length === 0 ? (
              <div className="rounded-xl border border-border bg-surface-raised p-6 text-center">
                <p className="text-sm text-muted">No hay datos de ventas</p>
              </div>
            ) : (
              byPerson.map((p) => (
                <div
                  key={p.user_id}
                  className="rounded-xl border border-border bg-surface-raised p-4"
                >
                  <p className="font-medium text-foreground">
                    {p.display_name || p.email}
                  </p>
                  <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                    <span className="text-muted">Productos</span>
                    <span className="text-right font-medium tabular-nums">
                      {p.products_sold}
                    </span>
                    <span className="text-muted">Servicios</span>
                    <span className="text-right font-medium tabular-nums">
                      {p.services_sold}
                    </span>
                    <span className="text-muted">Total vendido</span>
                    <span className="text-right font-medium tabular-nums">
                      ${p.total_revenue.toFixed(2)}
                    </span>
                    <span className="text-muted">Ganancia bruta</span>
                    <span className="text-right font-medium tabular-nums text-accent">
                      ${p.gross_profit.toFixed(2)}
                    </span>
                    <span className="text-muted">Comisión</span>
                    <span className="text-right font-medium tabular-nums">
                      ${p.total_commission.toFixed(2)}
                    </span>
                  </div>
                  <div className="mt-3 border-t border-border-soft pt-3">
                    {p.pending_commission > 0 ? (
                      <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-700">
                        Pendiente: ${p.pending_commission.toFixed(2)}
                      </span>
                    ) : (
                      <span className="rounded-full bg-accent/10 px-2.5 py-1 text-xs font-medium text-accent">
                        Pagada
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
          <div className="hidden md:block">
            <TableWrapper>
              <table className="w-full">
                <thead>
                  <tr className={tableHeaderRowClass}>
                    <th className={tableHeaderCellClass}>Persona</th>
                    <th className={tableHeaderCellClass}>Productos</th>
                    <th className={tableHeaderCellClass}>Servicios</th>
                    <th className={tableHeaderCellClass}>Total vendido</th>
                    <th className={tableHeaderCellClass}>Ganancia bruta</th>
                    <th className={tableHeaderCellClass}>Comisión</th>
                    <th className={tableHeaderCellClass}>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {byPerson.length === 0 ? (
                    <tr>
                      <td
                        colSpan={7}
                        className="px-4 py-8 text-center text-sm text-muted"
                      >
                        No hay datos de ventas
                      </td>
                    </tr>
                  ) : (
                    byPerson.map((p) => (
                      <tr key={p.user_id} className={tableBodyRowClass}>
                        <td className={tableBodyCellClass}>
                          {p.display_name || p.email}
                        </td>
                        <td className={tableBodyCellMutedClass}>
                          {p.products_sold}
                        </td>
                        <td className={tableBodyCellMutedClass}>
                          {p.services_sold}
                        </td>
                        <td className={tableBodyCellClass}>
                          ${p.total_revenue.toFixed(2)}
                        </td>
                        <td className="px-4 py-3 text-sm text-accent">
                          ${p.gross_profit.toFixed(2)}
                        </td>
                        <td className={tableBodyCellClass}>
                          ${p.total_commission.toFixed(2)}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {p.pending_commission > 0 ? (
                            <span className="rounded-full bg-amber-100 px-2 py-1 text-xs font-medium text-amber-700">
                              Pendiente: ${p.pending_commission.toFixed(2)}
                            </span>
                          ) : (
                            <span className="rounded-full bg-accent/10 px-2 py-1 text-xs font-medium text-accent">
                              Pagada
                            </span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </TableWrapper>
          </div>
        </>
      ) : activeTab === "por-orden" ? (
        <>
          <div className="space-y-4 md:hidden">
            {commissions.length === 0 ? (
              <div className="rounded-xl border border-border bg-surface-raised p-6 text-center">
                <p className="text-sm text-muted">
                  No hay comisiones registradas
                </p>
              </div>
            ) : (
              commissions.map((c) => (
                <div
                  key={c.id}
                  className="rounded-xl border border-border bg-surface-raised p-4"
                >
                  <div className="flex items-start justify-between gap-2">
                    <Link
                      href={`/dashboard/${tenantSlug}/ordenes/${c.order_id}`}
                      className="font-medium text-foreground hover:text-muted"
                    >
                      #{c.order_id.slice(0, 8)}
                    </Link>
                    {c.is_paid ? (
                      <span className="rounded-full bg-accent/10 px-2.5 py-1 text-xs font-medium text-accent">
                        Pagada
                      </span>
                    ) : (
                      <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-700">
                        Pendiente
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-muted">
                    {new Date(c.created_at).toLocaleDateString()} ·{" "}
                    {c.profiles?.display_name || c.profiles?.email}
                  </p>
                  <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                    <span className="text-muted">Productos / Servicios</span>
                    <span className="text-right font-medium tabular-nums">
                      {c.products_count} / {c.services_count}
                    </span>
                    <span className="text-muted">Total</span>
                    <span className="text-right font-medium tabular-nums">
                      ${Number(c.total_revenue).toFixed(2)}
                    </span>
                    <span className="text-muted">Ganancia</span>
                    <span className="text-right font-medium tabular-nums text-accent">
                      ${Number(c.gross_profit).toFixed(2)}
                    </span>
                    <span className="text-muted">Comisión</span>
                    <span className="text-right font-medium tabular-nums">
                      ${Number(c.commission_amount).toFixed(2)}
                    </span>
                  </div>
                  {!c.is_paid && (
                    <div className="mt-3 border-t border-border-soft pt-3">
                      <button
                        onClick={() => setCommissionToPay(c)}
                        className="min-h-[44px] w-full rounded-xl border border-border px-4 text-sm font-medium text-muted hover:bg-border-soft/60"
                      >
                        Marcar pagada
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
          <div className="hidden md:block">
            <TableWrapper>
              <table className="w-full">
                <thead>
                  <tr className={tableHeaderRowClass}>
                    <th className={tableHeaderCellClass}>Orden</th>
                    <th className={tableHeaderCellClass}>Fecha</th>
                    <th className={tableHeaderCellClass}>Persona</th>
                    <th className={tableHeaderCellClass}>Productos</th>
                    <th className={tableHeaderCellClass}>Servicios</th>
                    <th className={tableHeaderCellClass}>Total</th>
                    <th className={tableHeaderCellClass}>Ganancia</th>
                    <th className={tableHeaderCellClass}>Comisión</th>
                    <th className={tableHeaderCellClass}>Estado</th>
                    <th className={tableHeaderCellClass}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {commissions.length === 0 ? (
                    <tr>
                      <td
                        colSpan={10}
                        className="px-4 py-8 text-center text-sm text-muted"
                      >
                        No hay comisiones registradas
                      </td>
                    </tr>
                  ) : (
                    commissions.map((c) => (
                      <tr key={c.id} className={tableBodyRowClass}>
                        <td className={tableBodyCellClass}>
                          <Link
                            href={`/dashboard/${tenantSlug}/ordenes/${c.order_id}`}
                            className="text-foreground hover:text-muted"
                          >
                            #{c.order_id.slice(0, 8)}
                          </Link>
                        </td>
                        <td className={tableBodyCellMutedClass}>
                          {new Date(c.created_at).toLocaleDateString()}
                        </td>
                        <td className={tableBodyCellClass}>
                          {c.profiles?.display_name || c.profiles?.email}
                        </td>
                        <td className={tableBodyCellMutedClass}>
                          {c.products_count}
                        </td>
                        <td className={tableBodyCellMutedClass}>
                          {c.services_count}
                        </td>
                        <td className={tableBodyCellClass}>
                          ${Number(c.total_revenue).toFixed(2)}
                        </td>
                        <td className="px-4 py-3 text-sm text-accent">
                          ${Number(c.gross_profit).toFixed(2)}
                        </td>
                        <td className={tableBodyCellClass}>
                          ${Number(c.commission_amount).toFixed(2)}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {c.is_paid ? (
                            <span className="rounded-full bg-accent/10 px-2 py-1 text-xs font-medium text-accent">
                              Pagada
                            </span>
                          ) : (
                            <span className="rounded-full bg-amber-100 px-2 py-1 text-xs font-medium text-amber-700">
                              Pendiente
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {!c.is_paid && (
                            <button
                              onClick={() => setCommissionToPay(c)}
                              className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted hover:bg-border-soft/60"
                            >
                              Marcar pagada
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </TableWrapper>
          </div>
        </>
      ) : (
        <div className="space-y-4">
          <div className="rounded-xl border border-border bg-surface-raised p-6">
            <h3 className="text-lg font-semibold text-foreground">
              Generar Pago de Período
            </h3>
            <p className="mt-1 text-sm text-muted">
              Selecciona una persona y genera un pago agrupando todas las
              comisiones pendientes del período actual
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              {teamMembers.map((member) => {
                const pendingForUser = commissions.filter(
                  (c) => c.user_id === member.id && !c.is_paid
                );
                const totalPending = pendingForUser.reduce(
                  (sum, c) => sum + Number(c.commission_amount),
                  0
                );

                if (totalPending === 0) return null;

                return (
                  <div
                    key={member.id}
                    className="flex min-w-[250px] flex-1 items-center justify-between rounded-xl border border-border bg-border-soft/60 p-4"
                  >
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {member.display_name || member.email}
                      </p>
                      <p className="text-sm text-muted">
                        Pendiente: ${totalPending.toFixed(2)}
                      </p>
                      <p className="text-xs text-muted">
                        {pendingForUser.length} orden(es)
                      </p>
                    </div>
                    <button
                      onClick={() => handleGeneratePayment(member.id)}
                      disabled={actionLoading}
                      className="min-h-[44px] shrink-0 rounded-xl bg-accent px-4 py-2 text-sm font-medium text-accent-foreground hover:opacity-90 disabled:opacity-50"
                    >
                      Generar
                    </button>
                  </div>
                );
              })}
            </div>
            {!loading &&
              teamMembers.every((member) => {
                const total = commissions
                  .filter((c) => c.user_id === member.id && !c.is_paid)
                  .reduce((sum, c) => sum + Number(c.commission_amount), 0);
                return total === 0;
              }) && (
                <p className="mt-4 text-sm text-muted">
                  No hay comisiones pendientes para generar pago.
                </p>
              )}
          </div>

          <div>
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted">
              Pagos Registrados
            </h3>
            <div className="space-y-4 md:hidden">
              {payments.length === 0 ? (
                <div className="rounded-xl border border-border bg-surface-raised p-6 text-center">
                  <p className="text-sm text-muted">No hay pagos registrados</p>
                </div>
              ) : (
                payments.map((p) => (
                  <div
                    key={p.id}
                    className="rounded-xl border border-border bg-surface-raised p-4"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-medium text-foreground">
                        {p.profiles?.display_name || p.profiles?.email}
                      </p>
                      {p.payment_status === "paid" ? (
                        <span className="rounded-full bg-accent/10 px-2.5 py-1 text-xs font-medium text-accent">
                          Pagado
                        </span>
                      ) : (
                        <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-700">
                          Pendiente
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-sm text-muted">
                      {new Date(p.period_start).toLocaleDateString()} -{" "}
                      {new Date(p.period_end).toLocaleDateString()}{" "}
                      <span className="capitalize">
                        {p.period_type === "day"
                          ? "Día"
                          : p.period_type === "week"
                            ? "Semana"
                            : "Mes"}
                      </span>
                    </p>
                    <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                      <span className="text-muted">Órdenes</span>
                      <span className="text-right font-medium tabular-nums">
                        {p.total_orders}
                      </span>
                      <span className="text-muted">Total vendido</span>
                      <span className="text-right font-medium tabular-nums">
                        ${Number(p.total_revenue).toFixed(2)}
                      </span>
                      <span className="text-muted">Ganancia</span>
                      <span className="text-right font-medium tabular-nums text-accent">
                        ${Number(p.gross_profit).toFixed(2)}
                      </span>
                      <span className="text-muted">Comisión</span>
                      <span className="text-right font-medium tabular-nums">
                        ${Number(p.commission_amount).toFixed(2)}
                      </span>
                    </div>
                    {p.payment_status === "pending" && (
                      <div className="mt-3 flex gap-2 border-t border-border-soft pt-3">
                        <button
                          onClick={() => {
                            setPaymentToEdit(p);
                            setEditAmount(String(p.commission_amount));
                          }}
                          className="min-h-[44px] flex-1 rounded-xl border border-border px-4 text-sm font-medium text-muted hover:bg-border-soft/60"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => setPaymentToPay(p)}
                          className="min-h-[44px] flex-1 rounded-xl bg-accent px-4 text-sm font-medium text-accent-foreground hover:opacity-90"
                        >
                          Pagar
                        </button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
            <div className="hidden md:block">
              <TableWrapper>
                <table className="w-full">
                  <thead>
                    <tr className={tableHeaderRowClass}>
                      <th className={tableHeaderCellClass}>Persona</th>
                      <th className={tableHeaderCellClass}>Período</th>
                      <th className={tableHeaderCellClass}>Órdenes</th>
                      <th className={tableHeaderCellClass}>Total vendido</th>
                      <th className={tableHeaderCellClass}>Ganancia</th>
                      <th className={tableHeaderCellClass}>Comisión</th>
                      <th className={tableHeaderCellClass}>Estado</th>
                      <th className={tableHeaderCellClass}>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.length === 0 ? (
                      <tr>
                        <td
                          colSpan={8}
                          className="px-4 py-8 text-center text-sm text-muted"
                        >
                          No hay pagos registrados
                        </td>
                      </tr>
                    ) : (
                      payments.map((p) => (
                        <tr key={p.id} className={tableBodyRowClass}>
                          <td className={tableBodyCellClass}>
                            {p.profiles?.display_name || p.profiles?.email}
                          </td>
                          <td className={tableBodyCellMutedClass}>
                            <div>
                              {new Date(p.period_start).toLocaleDateString()} -{" "}
                              {new Date(p.period_end).toLocaleDateString()}
                            </div>
                            <div className="text-xs text-muted capitalize">
                              {p.period_type === "day"
                                ? "Día"
                                : p.period_type === "week"
                                  ? "Semana"
                                  : "Mes"}
                            </div>
                          </td>
                          <td className={tableBodyCellMutedClass}>
                            {p.total_orders}
                          </td>
                          <td className={tableBodyCellClass}>
                            ${Number(p.total_revenue).toFixed(2)}
                          </td>
                          <td className="px-4 py-3 text-sm text-accent">
                            ${Number(p.gross_profit).toFixed(2)}
                          </td>
                          <td className={tableBodyCellClass}>
                            ${Number(p.commission_amount).toFixed(2)}
                          </td>
                          <td className="px-4 py-3 text-sm">
                            {p.payment_status === "paid" ? (
                              <span className="rounded-full bg-accent/10 px-2 py-1 text-xs font-medium text-accent">
                                Pagado
                              </span>
                            ) : (
                              <span className="rounded-full bg-amber-100 px-2 py-1 text-xs font-medium text-amber-700">
                                Pendiente
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-sm">
                            <div className="flex gap-2">
                              {p.payment_status === "pending" && (
                                <>
                                  <button
                                    onClick={() => {
                                      setPaymentToEdit(p);
                                      setEditAmount(String(p.commission_amount));
                                    }}
                                    className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted hover:bg-border-soft/60"
                                  >
                                    Editar
                                  </button>
                                  <button
                                    onClick={() => setPaymentToPay(p)}
                                    className="rounded-lg bg-accent px-3 py-1.5 text-xs font-medium text-accent-foreground hover:opacity-90"
                                  >
                                    Pagar
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </TableWrapper>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={commissionToPay !== null}
        onClose={() => setCommissionToPay(null)}
        onConfirm={handleMarkAsPaid}
        title="Marcar comisión como pagada"
        message={
          commissionToPay
            ? `¿Confirmar que se pagó la comisión de $${Number(
                commissionToPay.commission_amount
              ).toFixed(2)} a ${
                commissionToPay.profiles?.display_name ||
                commissionToPay.profiles?.email
              }?`
            : ""
        }
        confirmLabel="Marcar como pagada"
        confirmDanger={false}
        loading={actionLoading}
      />

      <ConfirmModal
        isOpen={paymentToPay !== null}
        onClose={() => setPaymentToPay(null)}
        onConfirm={handleMarkPaymentAsPaid}
        title="Marcar pago como realizado"
        message={
          paymentToPay
            ? `¿Confirmar que se realizó el pago de $${Number(
                paymentToPay.commission_amount
              ).toFixed(2)} a ${
                paymentToPay.profiles?.display_name ||
                paymentToPay.profiles?.email
              }? Esto marcará todas las comisiones del período como pagadas.`
            : ""
        }
        confirmLabel="Confirmar pago"
        confirmDanger={false}
        loading={actionLoading}
      />

      <ConfirmModal
        isOpen={paymentToEdit !== null}
        onClose={() => {
          setPaymentToEdit(null);
          setEditAmount("");
        }}
        onConfirm={handleUpdatePaymentAmount}
        title="Editar monto de comisión"
        message={
          paymentToEdit ? (
            <div className="space-y-3">
              <p>Ajusta el monto de la comisión si es necesario:</p>
              <div>
                <label className="block text-sm font-medium text-muted-foreground">
                  Monto
                </label>
                <input
                  type="text"
                  inputMode="decimal"
                  value={editAmount}
                  onChange={(e) => setEditAmount(e.target.value)}
                  className="input-form mt-1 block w-full min-h-[44px] rounded-xl border px-3 py-2.5 text-base text-foreground placeholder:text-muted focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                  placeholder="0.00"
                />
              </div>
            </div>
          ) : (
            ""
          )
        }
        confirmLabel="Guardar"
        confirmDanger={false}
        loading={actionLoading}
      />
    </div>
  );
}
