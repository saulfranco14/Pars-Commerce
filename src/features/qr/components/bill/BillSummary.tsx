"use client";

import { useMemo } from "react";
import { CheckCircle2, ChevronDown, Clock, ShoppingBag, User, Users } from "lucide-react";

import { StatusBadge } from "@/components/admin/StatusBadge";
import { getFulfillmentStatusMeta } from "@/features/qr/constants/fulfillmentStatusMeta";
import { formatCurrency } from "@/features/qr/helpers/format";
import {
  groupItemsByPerson,
  isMergedBill,
} from "@/features/qr/helpers/groupItemsByPerson";
import {
  isSplitBill,
  resolveGroupPayability,
} from "@/features/qr/helpers/resolveGroupPayability";

import type {
  BillDevice,
  BillItem,
} from "@/features/qr/interfaces/billSummary";
import type { SplitGroup } from "@/features/qr/interfaces/splitBill";

interface BillSummaryProps {
  items: BillItem[];
  devices: BillDevice[];
  groups: SplitGroup[];
  currentDeviceId: string | null;
  onPayGroup?: (group: SplitGroup) => void;
  /** When false, per-group pay buttons are hidden (order not ready yet). */
  canPay?: boolean;
  /** A split bill is private by default: show only this device's detail. */
  scope?: "table" | "personal";
  /** The account owner may cover another diner's still-open split. */
  canPayForOthers?: boolean;
}

/**
 * Presentational bill summary: items grouped by person, plus the split-group
 * breakdown. All grouping/label/payability logic lives in feature helpers
 * (groupItemsByPerson, resolveGroupPayability) — this component only renders.
 */
export function BillSummary({
  items,
  devices,
  groups,
  currentDeviceId,
  onPayGroup,
  canPay = true,
  scope = "table",
  canPayForOthers = false,
}: BillSummaryProps) {
  const isSplit = isSplitBill(groups);
  const isMerged = useMemo(() => isMergedBill(items), [items]);
  const currentGroup = groups.find(
    (group) => group.device_id === currentDeviceId,
  );
  const hasExplicitItemAssignments = items.some((item) => !!item.split_group_id);
  const scopedItems =
    scope === "personal" && currentGroup && hasExplicitItemAssignments
      ? items.filter((item) => item.split_group_id === currentGroup.id)
      : items;
  const itemsByPerson = useMemo(
    () => groupItemsByPerson(scopedItems, devices, currentDeviceId),
    [scopedItems, devices, currentDeviceId],
  );
  const visiblePeople =
    scope === "personal" ? itemsByPerson.filter((person) => person.isMine) : itemsByPerson;
  const visibleItemCount = visiblePeople.reduce(
    (count, person) => count + person.items.length,
    0,
  );
  const showPersonHeaders = visiblePeople.length > 1;
  const settledGroups = groups.filter((group) => group.payment_status === "paid").length;
  const groupsStillOpen = groups.filter((group) => group.payment_status !== "paid");

  return (
    <div className="space-y-3">
      {/* Items — grouped by person; collapses to one flat group when solo. */}
      {visibleItemCount > 0 && (
        <section className="rounded-2xl border border-border bg-surface shadow-sm">
          <details
            open={scope !== "personal"}
            className="group [&>summary::-webkit-details-marker]:hidden"
          >
            <summary className="flex min-h-12 cursor-pointer list-none items-center gap-2 px-4 py-3">
              <ShoppingBag className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-bold text-foreground">
                {scope === "personal" ? "Mis productos" : "Productos pedidos"}
              </span>
              <span className="ml-auto rounded-full bg-border-soft/60 px-2 py-0.5 text-[10px] font-bold text-muted-foreground">
                {visibleItemCount}
              </span>
              <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform group-open:rotate-180" />
            </summary>

            <div className="space-y-4 border-t border-border-soft/60 px-4 pb-4 pt-3">
            {visiblePeople.map((person) => (
              <div key={person.key}>
                {showPersonHeaders && (
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <span className="flex min-w-0 items-center gap-1.5">
                      <span
                        aria-hidden
                        className="h-2 w-2 shrink-0 rounded-full"
                        style={{ backgroundColor: person.color }}
                      />
                      <span className="truncate text-xs font-bold text-foreground">
                        {person.label}
                      </span>
                      {person.isMine && (
                        <span className="font-semibold text-accent">(tú)</span>
                      )}
                    </span>
                    <span className="shrink-0 text-xs font-bold text-muted-foreground">
                      {formatCurrency(person.subtotal)}
                    </span>
                  </div>
                )}
                <ul className="space-y-2.5">
                  {person.items.map((item) => {
                    const itemMeta = getFulfillmentStatusMeta(item.fulfillment_status);
                    return (
                      <li
                        key={item.id}
                        className="flex items-start justify-between gap-3 border-b border-border-soft/50 pb-2.5 last:border-0 last:pb-0"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-foreground">
                            {item.quantity}× {item.product_name}
                          </p>
                          <div className="mt-1 flex flex-wrap items-center gap-1.5">
                            {isMerged && item.origin_table_label && (
                              <span className="inline-block rounded-full bg-border-soft/70 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                                {item.origin_table_label}
                              </span>
                            )}
                            <StatusBadge
                              tone={itemMeta.tone}
                              label={itemMeta.label}
                              compact
                            />
                          </div>
                        </div>
                        <span className="shrink-0 text-sm font-bold text-foreground">
                          {formatCurrency(item.subtotal)}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
            </div>
          </details>
        </section>
      )}

      {/* Split groups */}
      {isSplit && scope === "table" && (
        <section className="rounded-2xl border border-border bg-surface p-4 shadow-sm">
          <div className="mb-3 flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-sm font-bold text-foreground">
              División de la cuenta
            </h3>
          </div>
          <ul className="space-y-2">
            {groups.map((group) => (
              <SplitGroupRow
                key={group.id}
                group={group}
                devices={devices}
                currentDeviceId={currentDeviceId}
                canPay={canPay}
                onPayGroup={onPayGroup}
              />
            ))}
          </ul>
        </section>
      )}

      {isSplit && scope === "personal" && (
        <section className="rounded-2xl border border-border bg-surface shadow-sm">
          <details className="group [&>summary::-webkit-details-marker]:hidden">
            <summary className="flex min-h-12 cursor-pointer list-none items-center gap-2 px-4 py-3">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-bold text-foreground">Estado de la mesa</span>
                <span className="block text-xs text-muted-foreground">
                  {settledGroups} de {groups.length} cuentas pagadas
                </span>
              </span>
              <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform group-open:rotate-180" />
            </summary>
            <div className="border-t border-border-soft/60 px-4 pb-4 pt-3">
              {groupsStillOpen.length > 0 ? (
                <>
                  <p className="mb-2 text-xs font-semibold text-muted-foreground">Faltan por pagar</p>
                  <ul className="space-y-2">
                    {groupsStillOpen.map((group) => {
                      const isMine = group.device_id === currentDeviceId;
                      const waiting = group.payment_status === "pending_validation";
                      return (
                        <li key={group.id} className="flex items-center gap-2 rounded-xl bg-border-soft/40 px-3 py-2.5">
                          {waiting ? (
                            <Clock className="h-4 w-4 shrink-0 text-amber-500" />
                          ) : (
                            <User className="h-4 w-4 shrink-0 text-muted-foreground" />
                          )}
                          <span className="min-w-0 flex-1 truncate text-sm font-semibold text-foreground">
                            {isMine ? "Tú" : group.label}
                          </span>
                          <span className="text-xs font-semibold text-muted-foreground">
                            {waiting ? "Por validar" : "Pendiente"}
                          </span>
                          {canPayForOthers && !isMine && !waiting && onPayGroup && (
                            <button
                              type="button"
                              onClick={() => onPayGroup(group)}
                              className="min-h-9 shrink-0 rounded-xl bg-accent px-3 text-xs font-bold text-accent-foreground"
                            >
                              Pagar
                            </button>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                </>
              ) : (
                <p className="text-sm text-emerald-700">Todas las cuentas están pagadas.</p>
              )}
            </div>
          </details>
        </section>
      )}
    </div>
  );
}

interface SplitGroupRowProps {
  group: SplitGroup;
  devices: BillDevice[];
  currentDeviceId: string | null;
  canPay: boolean;
  onPayGroup?: (group: SplitGroup) => void;
}

/** One split-group row. Payability is resolved by the helper, not inline. */
function SplitGroupRow({
  group,
  devices,
  currentDeviceId,
  canPay,
  onPayGroup,
}: SplitGroupRowProps) {
  const state = resolveGroupPayability(
    group,
    devices,
    currentDeviceId,
    canPay,
    !!onPayGroup,
  );

  return (
    <li
      className={`flex items-center justify-between gap-3 rounded-xl border px-3 py-2.5 transition-colors ${
        state.isPaid
          ? "border-emerald-200 bg-emerald-50/60"
          : state.isPending
            ? "border-amber-200 bg-amber-50/40"
            : state.isMine
              ? "border-accent/40 bg-accent/5"
              : "border-border"
      }`}
    >
      <div className="flex min-w-0 items-center gap-2">
        {state.isPaid ? (
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
        ) : state.isPending ? (
          <Clock className="h-4 w-4 shrink-0 text-amber-500" />
        ) : (
          <User className="h-4 w-4 shrink-0 text-muted-foreground" />
        )}
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-foreground">
            {group.label}
            {state.isMine && (
              <span className="ml-1.5 rounded-full bg-accent/10 px-1.5 py-0.5 text-[10px] font-bold text-accent">
                tú
              </span>
            )}
          </p>
          {state.isPaid && (
            <p className="text-xs font-medium text-emerald-600">Pagado</p>
          )}
          {state.isPending && (
            <p className="text-xs font-medium text-amber-600">
              Pendiente de validar
            </p>
          )}
          {state.showPreparing && (
            <p className="text-xs font-medium text-muted-foreground">
              En preparación
            </p>
          )}
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <span className="text-sm font-bold text-foreground">
          {formatCurrency(group.total)}
        </span>
        {state.showPay && (
          <button
            type="button"
            onClick={() => onPayGroup?.(group)}
            className="inline-flex min-h-9 cursor-pointer items-center rounded-xl bg-accent px-3 py-1.5 text-xs font-bold text-accent-foreground transition-transform hover:bg-accent/90 active:scale-95"
          >
            Pagar
          </button>
        )}
        {state.isPending && (
          <span className="inline-flex min-h-9 items-center rounded-xl bg-amber-100 px-3 py-1.5 text-[11px] font-bold text-amber-800">
            Por validar
          </span>
        )}
      </div>
    </li>
  );
}
