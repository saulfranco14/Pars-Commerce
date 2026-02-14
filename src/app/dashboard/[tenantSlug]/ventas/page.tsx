"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import useSWR from "swr";
import { useTenantStore } from "@/stores/useTenantStore";
import { ConfirmModal } from "@/components/ConfirmModal";
import { LoadingBlock } from "@/components/ui/LoadingBlock";
import { VentasFilters } from "@/components/ventas/VentasFilters";
import { VentasResumen } from "@/components/ventas/VentasResumen";
import { VentasPorPersona } from "@/components/ventas/VentasPorPersona";
import { VentasPorOrden } from "@/components/ventas/VentasPorOrden";
import { VentasPagosTab } from "@/components/ventas/VentasPagosTab";
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
    <div className="flex min-h-0 flex-1 flex-col overflow-auto">
      <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-xl font-semibold text-foreground sm:text-2xl">
          Ventas y Comisiones
        </h1>
      </div>

      <VentasFilters
        activeTab={activeTab}
        filtersOpen={filtersOpen}
        setFiltersOpen={setFiltersOpen}
        userFilter={userFilter}
        setUserFilter={setUserFilter}
        paidFilter={paidFilter}
        setPaidFilter={setPaidFilter}
        dateFrom={dateFrom}
        setDateFrom={setDateFrom}
        dateTo={dateTo}
        setDateTo={setDateTo}
        periodType={periodType}
        setPeriodType={setPeriodType}
        selectedUser={selectedUser}
        setSelectedUser={setSelectedUser}
        paymentStatus={paymentStatus}
        setPaymentStatus={setPaymentStatus}
        teamMembers={teamMembers}
      />

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
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 alert-error">
          {error}
        </div>
      )}

      {loading ? (
        <LoadingBlock message="Cargando ventas…" />
      ) : activeTab === "resumen" ? (
        <VentasResumen summary={summary} />
      ) : activeTab === "por-persona" ? (
        <VentasPorPersona byPerson={byPerson} />
      ) : activeTab === "por-orden" ? (
        <VentasPorOrden
          commissions={commissions}
          tenantSlug={tenantSlug}
          onMarkAsPaid={setCommissionToPay}
        />
      ) : (
        <VentasPagosTab
          teamMembers={teamMembers}
          pendingCommissions={commissions}
          payments={payments}
          loading={loading}
          actionLoading={actionLoading}
          onGeneratePayment={handleGeneratePayment}
          onEditPayment={(p) => {
            setPaymentToEdit(p);
            setEditAmount(String(p.commission_amount));
          }}
          onPayPayment={setPaymentToPay}
        />
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
    </div>
  );
}
