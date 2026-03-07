"use client";

import { useState } from "react";
import {
  Scissors,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  X,
  CheckCircle,
  CalendarDays,
  TrendingUp,
  User,
  CreditCard,
} from "lucide-react";
import {
  TableWrapper,
  tableHeaderRowClass,
  tableHeaderCellClass,
  tableBodyRowClass,
  tableBodyCellClass,
  tableBodyCellMutedClass,
} from "@/components/ui/TableWrapper";
import type { SalesCutoff, CutoffPersonBreakdown } from "@/types/sales";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("es-MX", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDateShort(iso: string) {
  return new Date(iso).toLocaleDateString("es-MX", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function CutoffDetailModal({
  cutoff,
  onClose,
}: {
  cutoff: SalesCutoff;
  onClose: () => void;
}) {
  const persons: CutoffPersonBreakdown[] = cutoff.breakdown_by_person ?? [];
  const pm = cutoff.breakdown_by_payment_method;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center"
      onClick={onClose}
    >
      <div
        className="flex max-h-[90dvh] w-full max-w-lg flex-col rounded-t-2xl bg-surface-raised shadow-2xl sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header fijo */}
        <div className="flex shrink-0 items-start justify-between gap-2 border-b border-border-soft px-5 py-4">
          <div>
            <h3 className="text-base font-semibold text-foreground">
              Detalle del Corte
            </h3>
            <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
              <CalendarDays className="h-3 w-3 shrink-0" />
              {formatDate(cutoff.period_start)} → {formatDate(cutoff.period_end)}
            </p>
          </div>
          <button
            onClick={onClose}
            className="cursor-pointer rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-border-soft hover:text-foreground"
            aria-label="Cerrar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Scroll body */}
        <div className="flex-1 overflow-y-auto overscroll-contain px-5 py-4">
          {cutoff.notes && (
            <p className="mb-4 rounded-lg bg-border-soft/50 px-3 py-2 text-sm italic text-muted-foreground">
              "{cutoff.notes}"
            </p>
          )}

          {/* Totales */}
          <div className="mb-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {[
              { label: "Órdenes", value: String(cutoff.total_orders) },
              { label: "Total vendido", value: `$${Number(cutoff.total_revenue).toFixed(2)}` },
              { label: "Costo", value: `$${Number(cutoff.total_cost).toFixed(2)}` },
              { label: "Ganancia", value: `$${Number(cutoff.gross_profit).toFixed(2)}`, accent: true },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-xl border border-border bg-background p-3 text-center"
              >
                <p className="text-xs text-muted-foreground">{item.label}</p>
                <p
                  className={`mt-0.5 text-base font-semibold tabular-nums ${item.accent ? "text-accent" : "text-foreground"}`}
                >
                  {item.value}
                </p>
              </div>
            ))}
          </div>

          {/* Por persona */}
          {persons.length > 0 && (
            <div className="mb-5">
              <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <User className="h-3.5 w-3.5" />
                Por persona
              </p>
              <div className="overflow-hidden rounded-xl border border-border">
                {persons.map((p, i) => (
                  <div
                    key={p.user_id}
                    className={`flex items-center justify-between gap-3 px-4 py-3 ${
                      i > 0 ? "border-t border-border-soft" : ""
                    }`}
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-foreground">
                        {p.display_name || p.email}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {p.orders_count} orden{p.orders_count !== 1 ? "es" : ""}
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-sm font-medium tabular-nums text-foreground">
                        ${Number(p.total_revenue).toFixed(2)}
                      </p>
                      <p className="text-xs tabular-nums text-accent">
                        com. ${Number(p.commission_amount).toFixed(2)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Por método de pago */}
          {pm && (
            <div>
              <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <CreditCard className="h-3.5 w-3.5" />
                Por método de pago
              </p>
              <div className="overflow-hidden rounded-xl border border-border">
                {Object.entries(pm)
                  .filter(([, v]) => Number(v) > 0)
                  .map(([method, amount], i, arr) => (
                    <div
                      key={method}
                      className={`flex items-center justify-between px-4 py-3 ${
                        i < arr.length - 1 ? "border-b border-border-soft" : ""
                      }`}
                    >
                      <span className="capitalize text-sm text-muted-foreground">
                        {method}
                      </span>
                      <span className="tabular-nums text-sm font-medium text-foreground">
                        ${Number(amount).toFixed(2)}
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer fijo */}
        <div className="shrink-0 border-t border-border-soft px-5 py-3">
          <button
            onClick={onClose}
            className="w-full min-h-[44px] cursor-pointer rounded-xl bg-border-soft/60 text-sm font-medium text-foreground transition-colors hover:bg-border-soft"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}

interface VentasCortesTabProps {
  cutoffs: SalesCutoff[];
  loading: boolean;
  actionLoading: boolean;
  isAdmin: boolean;
  onGenerateCutoff: (notes: string) => void;
}

export function VentasCortesTab({
  cutoffs,
  loading,
  actionLoading,
  isAdmin,
  onGenerateCutoff,
}: VentasCortesTabProps) {
  const [notes, setNotes] = useState("");
  const [showNotes, setShowNotes] = useState(false);
  const [selectedCutoff, setSelectedCutoff] = useState<SalesCutoff | null>(null);
  const [justGenerated, setJustGenerated] = useState(false);

  const lastCutoff = cutoffs.length > 0 ? cutoffs[0] : null;

  function handleGenerate() {
    onGenerateCutoff(notes);
    setNotes("");
    setShowNotes(false);
    setJustGenerated(true);
  }

  return (
    <div className="space-y-4">
      {/* Banner de éxito post-corte */}
      {justGenerated && (
        <div className="flex items-start gap-3 rounded-xl border border-accent/30 bg-accent/5 px-4 py-3">
          <CheckCircle className="mt-0.5 h-5 w-5 shrink-0 text-accent" />
          <div>
            <p className="text-sm font-medium text-foreground">
              Corte generado correctamente
            </p>
            <p className="text-xs text-muted-foreground">
              El período ha sido cerrado. Desde ahora verás datos desde cero en
              el dashboard y en órdenes.
            </p>
          </div>
          <button
            onClick={() => setJustGenerated(false)}
            className="ml-auto cursor-pointer shrink-0 rounded p-0.5 text-muted-foreground hover:text-foreground"
            aria-label="Cerrar aviso"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Estado del período actual */}
      <div className="rounded-xl border border-border bg-surface-raised p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-border-soft text-muted-foreground">
              <TrendingUp className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-foreground">
                Cortes de Caja
              </h3>
              <p className="mt-0.5 text-sm text-muted-foreground">
                {lastCutoff
                  ? `Período actual desde ${formatDateShort(lastCutoff.period_end)}`
                  : "Sin cortes previos — el período cubre desde el inicio del negocio"}
              </p>
            </div>
          </div>
          {isAdmin && (
            <button
              onClick={() => setShowNotes((v) => !v)}
              disabled={actionLoading}
              className="flex min-h-[44px] shrink-0 cursor-pointer items-center gap-2 rounded-xl bg-accent px-4 py-2 text-sm font-medium text-accent-foreground transition-opacity hover:opacity-90 disabled:opacity-50 sm:self-start"
            >
              <Scissors className="h-4 w-4" />
              Generar Corte
              {showNotes ? (
                <ChevronUp className="h-3 w-3" />
              ) : (
                <ChevronDown className="h-3 w-3" />
              )}
            </button>
          )}
        </div>

        {/* Panel de nota para el corte */}
        {isAdmin && showNotes && (
          <div className="mt-4 space-y-3 border-t border-border-soft pt-4">
            <div>
              <label
                htmlFor="corte-notes"
                className="mb-1 block text-sm font-medium text-foreground"
              >
                Nota del corte{" "}
                <span className="font-normal text-muted-foreground">
                  (opcional)
                </span>
              </label>
              <input
                id="corte-notes"
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                onKeyDown={(e) =>
                  e.key === "Enter" && !actionLoading && handleGenerate()
                }
                placeholder='Ej: "Corte quincenal", "Fin de semana"'
                className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/40"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleGenerate}
                disabled={actionLoading}
                className="min-h-[44px] flex-1 cursor-pointer rounded-xl bg-accent px-4 text-sm font-medium text-accent-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                {actionLoading ? "Generando..." : "Confirmar Corte"}
              </button>
              <button
                onClick={() => setShowNotes(false)}
                className="min-h-[44px] cursor-pointer rounded-xl border border-border px-4 text-sm font-medium text-muted-foreground transition-colors hover:bg-border-soft/60"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Historial de cortes */}
      <div>
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Historial de Cortes
        </h3>

        {/* Mobile */}
        <div className="space-y-3 md:hidden">
          {loading ? (
            <div className="rounded-xl border border-border bg-surface-raised p-6 text-center">
              <p className="text-sm text-muted-foreground">Cargando...</p>
            </div>
          ) : cutoffs.length === 0 ? (
            <div className="rounded-xl border border-border bg-surface-raised p-8 text-center">
              <Scissors className="mx-auto mb-2 h-8 w-8 text-border" />
              <p className="text-sm font-medium text-foreground">
                Sin cortes aún
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Genera tu primer corte de caja para cerrar el período actual.
              </p>
            </div>
          ) : (
            cutoffs.map((c) => (
              <div
                key={c.id}
                className="overflow-hidden rounded-xl border border-border bg-surface-raised"
              >
                <div className="flex items-start justify-between gap-2 px-4 pt-4">
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {formatDateShort(c.period_start)} →{" "}
                      {formatDateShort(c.period_end)}
                    </p>
                    {c.notes && (
                      <p className="mt-0.5 text-xs italic text-muted-foreground">
                        {c.notes}
                      </p>
                    )}
                  </div>
                  {c.commissions_pending > 0 && (
                    <span className="flex shrink-0 items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                      <AlertTriangle className="h-3 w-3" />
                      {c.commissions_pending} pend.
                    </span>
                  )}
                </div>
                <div className="mt-3 grid grid-cols-3 divide-x divide-border-soft border-t border-border-soft">
                  <div className="px-3 py-2.5 text-center">
                    <p className="text-xs text-muted-foreground">Órdenes</p>
                    <p className="mt-0.5 text-sm font-semibold tabular-nums text-foreground">
                      {c.total_orders}
                    </p>
                  </div>
                  <div className="px-3 py-2.5 text-center">
                    <p className="text-xs text-muted-foreground">Vendido</p>
                    <p className="mt-0.5 text-sm font-semibold tabular-nums text-foreground">
                      ${Number(c.total_revenue).toFixed(2)}
                    </p>
                  </div>
                  <div className="px-3 py-2.5 text-center">
                    <p className="text-xs text-muted-foreground">Ganancia</p>
                    <p className="mt-0.5 text-sm font-semibold tabular-nums text-accent">
                      ${Number(c.gross_profit).toFixed(2)}
                    </p>
                  </div>
                </div>
                <div className="border-t border-border-soft px-4 py-3">
                  <button
                    onClick={() => setSelectedCutoff(c)}
                    className="w-full min-h-[40px] cursor-pointer rounded-lg border border-border px-4 text-sm font-medium text-muted-foreground transition-colors hover:bg-border-soft/60"
                  >
                    Ver detalle
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Desktop */}
        <div className="hidden md:block">
          <TableWrapper>
            <table className="w-full">
              <thead>
                <tr className={tableHeaderRowClass}>
                  <th className={tableHeaderCellClass}>Período</th>
                  <th className={tableHeaderCellClass}>Órdenes</th>
                  <th className={tableHeaderCellClass}>Total vendido</th>
                  <th className={tableHeaderCellClass}>Ganancia</th>
                  <th className={tableHeaderCellClass}>Com. pendientes</th>
                  <th className={tableHeaderCellClass}>Generado por</th>
                  <th className={tableHeaderCellClass}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-4 py-8 text-center text-sm text-muted-foreground"
                    >
                      Cargando...
                    </td>
                  </tr>
                ) : cutoffs.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-10 text-center">
                      <Scissors className="mx-auto mb-2 h-7 w-7 text-border" />
                      <p className="text-sm font-medium text-foreground">
                        Sin cortes aún
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        Genera tu primer corte de caja para cerrar el período
                        actual.
                      </p>
                    </td>
                  </tr>
                ) : (
                  cutoffs.map((c) => (
                    <tr key={c.id} className={tableBodyRowClass}>
                      <td className={tableBodyCellClass}>
                        <div className="text-sm font-medium">
                          {formatDateShort(c.period_start)} →{" "}
                          {formatDateShort(c.period_end)}
                        </div>
                        {c.notes && (
                          <div className="mt-0.5 text-xs italic text-muted-foreground">
                            {c.notes}
                          </div>
                        )}
                      </td>
                      <td className={tableBodyCellMutedClass}>
                        {c.total_orders}
                      </td>
                      <td className={tableBodyCellClass}>
                        <span className="tabular-nums">
                          ${Number(c.total_revenue).toFixed(2)}
                        </span>
                      </td>
                      <td className={tableBodyCellClass}>
                        <span className="tabular-nums text-accent">
                          ${Number(c.gross_profit).toFixed(2)}
                        </span>
                      </td>
                      <td className={tableBodyCellMutedClass}>
                        {c.commissions_pending > 0 ? (
                          <span className="flex items-center gap-1 text-amber-600">
                            <AlertTriangle className="h-3.5 w-3.5" />
                            {c.commissions_pending}
                          </span>
                        ) : (
                          <span className="text-accent">—</span>
                        )}
                      </td>
                      <td className={tableBodyCellMutedClass}>
                        {c.created_by_profile?.display_name ||
                          c.created_by_profile?.email ||
                          "—"}
                      </td>
                      <td className={tableBodyCellClass}>
                        <button
                          onClick={() => setSelectedCutoff(c)}
                          className="cursor-pointer rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-border-soft/60"
                        >
                          Ver detalle
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </TableWrapper>
        </div>
      </div>

      {/* Modal de detalle */}
      {selectedCutoff && (
        <CutoffDetailModal
          cutoff={selectedCutoff}
          onClose={() => setSelectedCutoff(null)}
        />
      )}
    </div>
  );
}
