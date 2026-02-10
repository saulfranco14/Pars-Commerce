"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
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
import type {
  SalesCommission,
  CommissionSummary,
  CommissionPayment,
} from "@/types/sales";
import { list as listTeam } from "@/services/teamService";
import {
  list as listSalesCommissions,
  update as updateSalesCommission,
} from "@/services/salesCommissionsService";
import {
  list as listCommissionPayments,
  create as createCommissionPayment,
  update as updateCommissionPayment,
} from "@/services/commissionPaymentsService";

type TabView = "resumen" | "por-persona" | "por-orden" | "pagos";

export default function VentasPage() {
  const params = useParams();
  const tenantSlug = params.tenantSlug as string;
  const activeTenant = useTenantStore((s) => s.activeTenant)();

  const [activeTab, setActiveTab] = useState<TabView>("resumen");
  const [commissions, setCommissions] = useState<SalesCommission[]>([]);
  const [payments, setPayments] = useState<CommissionPayment[]>([]);
  const [teamMembers, setTeamMembers] = useState<
    { id: string; display_name: string | null; email: string | null }[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  useEffect(() => {
    if (!activeTenant) return;
    fetchTeamMembers();
  }, [activeTenant?.id]);

  useEffect(() => {
    if (!activeTenant) return;
    if (activeTab === "pagos") {
      setLoading(true);
      setError(null);
      Promise.all([
        fetchPaymentsInternal(),
        fetchPendingCommissionsInternal(),
      ]).finally(() => setLoading(false));
    } else {
      fetchCommissions();
    }
  }, [
    activeTenant?.id,
    userFilter,
    paidFilter,
    dateFrom,
    dateTo,
    activeTab,
    selectedUser,
    paymentStatus,
  ]);

  async function fetchPaymentsInternal() {
    if (!activeTenant) return;
    try {
      const data = await listCommissionPayments({
        tenant_id: activeTenant.id,
        user_id: selectedUser || undefined,
        status: paymentStatus || undefined,
      });
      setPayments(data);
    } catch {
      setPayments([]);
    }
  }

  async function fetchPendingCommissionsInternal() {
    if (!activeTenant) return;
    try {
      const data = await listSalesCommissions({
        tenant_id: activeTenant.id,
        is_paid: "false",
      });
      setCommissions(data);
    } catch {
      setCommissions([]);
    }
  }

  async function fetchTeamMembers() {
    if (!activeTenant) return;
    try {
      const data = await listTeam(activeTenant.id);
      setTeamMembers(
        data.map((m) => ({
          id: m.user_id,
          display_name: m.display_name ?? null,
          email: m.email ?? null,
        }))
      );
    } catch {
      setError("No se pudieron cargar los miembros del equipo");
    }
  }

  async function fetchCommissions() {
    if (!activeTenant) return;
    setLoading(true);
    setError(null);
    try {
      const data = await listSalesCommissions({
        tenant_id: activeTenant.id,
        user_id: userFilter || undefined,
        is_paid: paidFilter || undefined,
        date_from: dateFrom || undefined,
        date_to: dateTo || undefined,
      });
      setCommissions(data);
    } catch {
      setError("No se pudieron cargar las comisiones");
    } finally {
      setLoading(false);
    }
  }

  async function fetchPayments() {
    if (!activeTenant) return;
    setLoading(true);
    setError(null);
    try {
      await fetchPaymentsInternal();
      if (activeTab === "pagos") await fetchPendingCommissionsInternal();
    } catch {
      setError("No se pudieron cargar los pagos");
    } finally {
      setLoading(false);
    }
  }

  async function handleMarkAsPaid() {
    if (!commissionToPay) return;
    setActionLoading(true);
    try {
      await updateSalesCommission(commissionToPay.id, { is_paid: true });
      setCommissionToPay(null);
      fetchCommissions();
    } catch {
      setError("No se pudo marcar la comisión como pagada");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleGeneratePayment(userId: string) {
    if (!activeTenant) return;
    setActionLoading(true);
    setError(null);

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
      fetchPayments();
    } catch {
      setError("No se pudo generar el pago del período");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleMarkPaymentAsPaid() {
    if (!paymentToPay) return;
    setActionLoading(true);
    try {
      await updateCommissionPayment(paymentToPay.id, { payment_status: "paid" });
      setPaymentToPay(null);
      fetchPayments();
    } catch {
      setError("No se pudo marcar el pago como pagado");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleUpdatePaymentAmount() {
    if (!paymentToEdit) return;
    const amount = parseFloat(editAmount);
    if (isNaN(amount) || amount < 0) {
      setError("Monto inválido");
      return;
    }
    setActionLoading(true);
    try {
      await updateCommissionPayment(paymentToEdit.id, {
        commission_amount: amount,
      });
      setPaymentToEdit(null);
      setEditAmount("");
      fetchPayments();
    } catch {
      setError("No se pudo actualizar el monto");
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

      {activeTab !== "pagos" && (
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-border-soft/80 p-4">
          <label className="flex flex-1 min-w-[120px] items-center gap-1.5 text-sm text-muted-foreground sm:flex-none">
            Persona:
            <select
              value={userFilter}
              onChange={(e) => setUserFilter(e.target.value)}
              className="select-custom min-h-[44px] flex-1 rounded-xl border border-border bg-surface-raised px-3 py-2.5 text-sm text-foreground focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 sm:min-h-0 sm:flex-none sm:py-1.5"
            >
              <option value="">Todas</option>
              {teamMembers.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.display_name || m.email}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-1 min-w-[120px] items-center gap-1.5 text-sm text-muted-foreground sm:flex-none">
            Estado:
            <select
              value={paidFilter}
              onChange={(e) => setPaidFilter(e.target.value)}
              className="select-custom min-h-[44px] flex-1 rounded-xl border border-border bg-surface-raised px-3 py-2.5 text-sm text-foreground focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 sm:min-h-0 sm:flex-none sm:py-1.5"
            >
              <option value="">Todas</option>
              <option value="false">Pendientes</option>
              <option value="true">Pagadas</option>
            </select>
          </label>
          <label className="flex flex-1 min-w-[120px] items-center gap-1.5 text-sm text-muted-foreground sm:flex-none">
            Desde:
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="min-h-[44px] flex-1 rounded-xl border border-border bg-surface-raised px-3 py-2.5 text-sm text-foreground focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 sm:min-h-0 sm:flex-none sm:py-1.5"
            />
          </label>
          <label className="flex flex-1 min-w-[120px] items-center gap-1.5 text-sm text-muted-foreground sm:flex-none">
            Hasta:
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="min-h-[44px] flex-1 rounded-xl border border-border bg-surface-raised px-3 py-2.5 text-sm text-foreground focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 sm:min-h-0 sm:flex-none sm:py-1.5"
            />
          </label>
        </div>
      )}

      {activeTab === "pagos" && (
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-border-soft/80 p-4">
          <label className="flex flex-1 min-w-[120px] items-center gap-1.5 text-sm text-muted-foreground sm:flex-none">
            Período:
            <select
              value={periodType}
              onChange={(e) =>
                setPeriodType(e.target.value as "day" | "week" | "month")
              }
              className="select-custom min-h-[44px] flex-1 rounded-xl border border-border bg-surface-raised px-3 py-2.5 text-sm text-foreground focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 sm:min-h-0 sm:flex-none sm:py-1.5"
            >
              <option value="day">Día</option>
              <option value="week">Semana</option>
              <option value="month">Mes</option>
            </select>
          </label>
          <label className="flex flex-1 min-w-[120px] items-center gap-1.5 text-sm text-muted-foreground sm:flex-none">
            Persona:
            <select
              value={selectedUser}
              onChange={(e) => setSelectedUser(e.target.value)}
              className="select-custom min-h-[44px] flex-1 rounded-xl border border-border bg-surface-raised px-3 py-2.5 text-sm text-foreground focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 sm:min-h-0 sm:flex-none sm:py-1.5"
            >
              <option value="">Todas</option>
              {teamMembers.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.display_name || m.email}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-1 min-w-[120px] items-center gap-1.5 text-sm text-muted-foreground sm:flex-none">
            Estado:
            <select
              value={paymentStatus}
              onChange={(e) => setPaymentStatus(e.target.value)}
              className="select-custom min-h-[44px] flex-1 rounded-xl border border-border bg-surface-raised px-3 py-2.5 text-sm text-foreground focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 sm:min-h-0 sm:flex-none sm:py-1.5"
            >
              <option value="">Todos</option>
              <option value="pending">Pendientes</option>
              <option value="paid">Pagados</option>
            </select>
          </label>
        </div>
      )}

      <div className="flex gap-1 border-b border-border-soft">
        <button
          onClick={() => setActiveTab("resumen")}
          className={`px-4 py-2.5 text-sm font-medium transition-colors ${
            activeTab === "resumen"
              ? "border-b-2 border-accent text-foreground"
              : "text-muted hover:text-foreground"
          }`}
        >
          Resumen
        </button>
        <button
          onClick={() => setActiveTab("por-persona")}
          className={`px-4 py-2.5 text-sm font-medium transition-colors ${
            activeTab === "por-persona"
              ? "border-b-2 border-accent text-foreground"
              : "text-muted hover:text-foreground"
          }`}
        >
          Por persona
        </button>
        <button
          onClick={() => setActiveTab("por-orden")}
          className={`px-4 py-2.5 text-sm font-medium transition-colors ${
            activeTab === "por-orden"
              ? "border-b-2 border-accent text-foreground"
              : "text-muted hover:text-foreground"
          }`}
        >
          Por orden
        </button>
        <button
          onClick={() => setActiveTab("pagos")}
          className={`px-4 py-2.5 text-sm font-medium transition-colors ${
            activeTab === "pagos"
              ? "border-b-2 border-accent text-foreground"
              : "text-muted hover:text-foreground"
          }`}
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
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
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
                    <td className={tableBodyCellMutedClass}>{p.products_sold}</td>
                    <td className={tableBodyCellMutedClass}>{p.services_sold}</td>
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
      ) : activeTab === "por-orden" ? (
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
                      className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground hover:opacity-90 disabled:opacity-50"
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
                  className="mt-1 block w-full rounded-lg border border-border px-3 py-2 text-foreground"
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
