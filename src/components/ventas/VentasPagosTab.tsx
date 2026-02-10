"use client";

import {
  TableWrapper,
  tableHeaderRowClass,
  tableHeaderCellClass,
  tableBodyRowClass,
  tableBodyCellClass,
  tableBodyCellMutedClass,
} from "@/components/ui/TableWrapper";
import type { SalesCommission, CommissionPayment } from "@/types/sales";

interface TeamMemberOption {
  id: string;
  display_name: string | null;
  email: string | null;
}

interface VentasPagosTabProps {
  teamMembers: TeamMemberOption[];
  pendingCommissions: SalesCommission[];
  payments: CommissionPayment[];
  loading: boolean;
  actionLoading: boolean;
  onGeneratePayment: (userId: string) => void;
  onEditPayment: (p: CommissionPayment) => void;
  onPayPayment: (p: CommissionPayment) => void;
}

function periodLabel(periodType: string): string {
  return periodType === "day" ? "Día" : periodType === "week" ? "Semana" : "Mes";
}

export function VentasPagosTab({
  teamMembers,
  pendingCommissions,
  payments,
  loading,
  actionLoading,
  onGeneratePayment,
  onEditPayment,
  onPayPayment,
}: VentasPagosTabProps) {
  const hasAnyPending = !loading && !teamMembers.every((member) => {
    const total = pendingCommissions
      .filter((c) => c.user_id === member.id && !c.is_paid)
      .reduce((sum, c) => sum + Number(c.commission_amount), 0);
    return total === 0;
  });

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-border bg-surface-raised p-6">
        <h3 className="text-lg font-semibold text-foreground">
          Generar Pago de Período
        </h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Selecciona una persona y genera un pago agrupando todas las comisiones
          pendientes del período actual
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          {teamMembers.map((member) => {
            const pendingForUser = pendingCommissions.filter(
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
                  <p className="text-sm text-muted-foreground">
                    Pendiente: ${totalPending.toFixed(2)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {pendingForUser.length} orden(es)
                  </p>
                </div>
                <button
                  onClick={() => onGeneratePayment(member.id)}
                  disabled={actionLoading}
                  className="min-h-[44px] shrink-0 rounded-xl bg-accent px-4 py-2 text-sm font-medium text-accent-foreground hover:opacity-90 disabled:opacity-50"
                >
                  Generar
                </button>
              </div>
            );
          })}
        </div>
        {!loading && !hasAnyPending && (
          <p className="mt-4 text-sm text-muted-foreground">
            No hay comisiones pendientes para generar pago.
          </p>
        )}
      </div>

      <div>
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Pagos Registrados
        </h3>
        <div className="space-y-4 md:hidden">
          {payments.length === 0 ? (
            <div className="rounded-xl border border-border bg-surface-raised p-6 text-center">
              <p className="text-sm text-muted-foreground">
                No hay pagos registrados
              </p>
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
                <p className="mt-1 text-sm text-muted-foreground">
                  {new Date(p.period_start).toLocaleDateString()} -{" "}
                  {new Date(p.period_end).toLocaleDateString()}{" "}
                  <span className="capitalize">{periodLabel(p.period_type)}</span>
                </p>
                <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                  <span className="text-muted-foreground">Órdenes</span>
                  <span className="text-right font-medium tabular-nums">
                    {p.total_orders}
                  </span>
                  <span className="text-muted-foreground">Total vendido</span>
                  <span className="text-right font-medium tabular-nums">
                    ${Number(p.total_revenue).toFixed(2)}
                  </span>
                  <span className="text-muted-foreground">Ganancia</span>
                  <span className="text-right font-medium tabular-nums text-accent">
                    ${Number(p.gross_profit).toFixed(2)}
                  </span>
                  <span className="text-muted-foreground">Comisión</span>
                  <span className="text-right font-medium tabular-nums">
                    ${Number(p.commission_amount).toFixed(2)}
                  </span>
                </div>
                {p.payment_status === "pending" && (
                  <div className="mt-3 flex gap-2 border-t border-border-soft pt-3">
                    <button
                      onClick={() => onEditPayment(p)}
                      className="min-h-[44px] flex-1 rounded-xl border border-border px-4 text-sm font-medium text-muted-foreground hover:bg-border-soft/60"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => onPayPayment(p)}
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
                      className="px-4 py-8 text-center text-sm text-muted-foreground"
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
                        <div className="text-xs text-muted-foreground capitalize">
                          {periodLabel(p.period_type)}
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
                                onClick={() => onEditPayment(p)}
                                className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-border-soft/60"
                              >
                                Editar
                              </button>
                              <button
                                onClick={() => onPayPayment(p)}
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
  );
}
