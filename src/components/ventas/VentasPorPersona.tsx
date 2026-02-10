"use client";

import {
  TableWrapper,
  tableHeaderRowClass,
  tableHeaderCellClass,
  tableBodyRowClass,
  tableBodyCellClass,
  tableBodyCellMutedClass,
} from "@/components/ui/TableWrapper";
import type { CommissionSummary } from "@/types/sales";

interface VentasPorPersonaProps {
  byPerson: CommissionSummary[];
}

export function VentasPorPersona({ byPerson }: VentasPorPersonaProps) {
  return (
    <>
      <div className="space-y-4 md:hidden">
        {byPerson.length === 0 ? (
          <div className="rounded-xl border border-border bg-surface-raised p-6 text-center">
            <p className="text-sm text-muted-foreground">No hay datos de ventas</p>
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
                <span className="text-muted-foreground">Productos</span>
                <span className="text-right font-medium tabular-nums">
                  {p.products_sold}
                </span>
                <span className="text-muted-foreground">Servicios</span>
                <span className="text-right font-medium tabular-nums">
                  {p.services_sold}
                </span>
                <span className="text-muted-foreground">Total vendido</span>
                <span className="text-right font-medium tabular-nums">
                  ${p.total_revenue.toFixed(2)}
                </span>
                <span className="text-muted-foreground">Ganancia bruta</span>
                <span className="text-right font-medium tabular-nums text-accent">
                  ${p.gross_profit.toFixed(2)}
                </span>
                <span className="text-muted-foreground">Comisión</span>
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
                    className="px-4 py-8 text-center text-sm text-muted-foreground"
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
  );
}
