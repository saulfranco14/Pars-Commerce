"use client";

import Link from "next/link";
import {
  TableWrapper,
  tableHeaderRowClass,
  tableHeaderCellClass,
  tableBodyRowClass,
  tableBodyCellClass,
  tableBodyCellMutedClass,
} from "@/components/ui/TableWrapper";
import type { SalesCommission } from "@/types/sales";

interface VentasPorOrdenProps {
  commissions: SalesCommission[];
  tenantSlug: string;
  onMarkAsPaid: (c: SalesCommission) => void;
}

export function VentasPorOrden({
  commissions,
  tenantSlug,
  onMarkAsPaid,
}: VentasPorOrdenProps) {
  return (
    <>
      <div className="space-y-4 md:hidden">
        {commissions.length === 0 ? (
          <div className="rounded-xl border border-border bg-surface-raised p-6 text-center">
            <p className="text-sm text-muted-foreground">
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
                  className="font-medium text-foreground hover:text-muted-foreground"
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
              <p className="mt-1 text-sm text-muted-foreground">
                {new Date(c.created_at).toLocaleDateString()} ·{" "}
                {c.profiles?.display_name || c.profiles?.email}
              </p>
              <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                <span className="text-muted-foreground">Productos / Servicios</span>
                <span className="text-right font-medium tabular-nums">
                  {c.products_count} / {c.services_count}
                </span>
                <span className="text-muted-foreground">Total</span>
                <span className="text-right font-medium tabular-nums">
                  ${Number(c.total_revenue).toFixed(2)}
                </span>
                <span className="text-muted-foreground">Ganancia</span>
                <span className="text-right font-medium tabular-nums text-accent">
                  ${Number(c.gross_profit).toFixed(2)}
                </span>
                <span className="text-muted-foreground">Comisión</span>
                <span className="text-right font-medium tabular-nums">
                  ${Number(c.commission_amount).toFixed(2)}
                </span>
              </div>
              {!c.is_paid && (
                <div className="mt-3 border-t border-border-soft pt-3">
                  <button
                    onClick={() => onMarkAsPaid(c)}
                    className="min-h-[44px] w-full rounded-xl border border-border px-4 text-sm font-medium text-muted-foreground hover:bg-border-soft/60"
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
                    className="px-4 py-8 text-center text-sm text-muted-foreground"
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
                        className="text-foreground hover:text-muted-foreground"
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
                          onClick={() => onMarkAsPaid(c)}
                          className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-border-soft/60"
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
  );
}
