"use client";

import { CheckCircle2, Clock, ShoppingBag, User, Users } from "lucide-react";

import { formatCurrency } from "@/features/qr/helpers/format";

import type { SplitGroup } from "@/features/qr/interfaces/splitBill";

interface BillItem {
  id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
  added_by_device_id: string | null;
  is_shared: boolean;
}

interface BillDevice {
  id: string;
  display_name: string | null;
  color_hex: string;
}

interface BillSummaryProps {
  items: BillItem[];
  devices: BillDevice[];
  groups: SplitGroup[];
  currentDeviceId: string | null;
  onPayGroup?: (group: SplitGroup) => void;
}

function deviceLabel(
  deviceId: string | null,
  devices: BillDevice[],
  currentDeviceId: string | null,
): { label: string; color: string; isMine: boolean } {
  if (!deviceId) {
    return { label: "Compartido", color: "#94a3b8", isMine: false };
  }
  const device = devices.find((d) => d.id === deviceId);
  const index = devices.findIndex((d) => d.id === deviceId);
  const isMine = currentDeviceId === deviceId;
  const fallback = `Cliente ${index >= 0 ? index + 1 : ""}`.trim();
  return {
    label: device?.display_name?.trim() || fallback,
    color: device?.color_hex ?? "#94a3b8",
    isMine,
  };
}

export function BillSummary({
  items,
  devices,
  groups,
  currentDeviceId,
  onPayGroup,
}: BillSummaryProps) {
  const isSplit =
    groups.length > 1 || (groups.length === 1 && groups[0].device_id !== null);

  return (
    <div className="space-y-3">
      {/* Items detail */}
      {items.length > 0 && (
        <section className="rounded-2xl border border-border bg-surface p-4 shadow-sm">
          <div className="mb-3 flex items-center gap-2">
            <ShoppingBag className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-sm font-bold text-foreground">
              Productos pedidos
            </h3>
            <span className="ml-auto rounded-full bg-border-soft/60 px-2 py-0.5 text-[10px] font-bold text-muted-foreground">
              {items.length}
            </span>
          </div>
          <ul className="space-y-2.5">
            {items.map((item) => {
              const { label, color, isMine } = deviceLabel(
                item.added_by_device_id,
                devices,
                currentDeviceId,
              );
              return (
                <li
                  key={item.id}
                  className="flex items-start justify-between gap-3 border-b border-border-soft/50 pb-2.5 last:border-0 last:pb-0"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-foreground">
                      {item.quantity}× {item.product_name}
                    </p>
                    <div className="mt-1 flex items-center gap-1.5">
                      <span
                        aria-hidden
                        className="h-2 w-2 shrink-0 rounded-full"
                        style={{ backgroundColor: color }}
                      />
                      <span className="text-xs text-muted-foreground">
                        {label}
                        {isMine && (
                          <span className="ml-1 font-semibold text-accent">
                            (tú)
                          </span>
                        )}
                      </span>
                    </div>
                  </div>
                  <span className="shrink-0 text-sm font-bold text-foreground">
                    {formatCurrency(item.subtotal)}
                  </span>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {/* Split groups */}
      {isSplit && (
        <section className="rounded-2xl border border-border bg-surface p-4 shadow-sm">
          <div className="mb-3 flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-sm font-bold text-foreground">
              División de la cuenta
            </h3>
          </div>
          <ul className="space-y-2">
            {groups.map((group) => {
              const isPaidGroup = group.payment_status === "paid";
              const isPendingGroup =
                group.payment_status === "pending_validation";
              const isOwner =
                !!group.device_id && group.device_id === currentDeviceId;
              return (
                <li
                  key={group.id}
                  className={`flex items-center justify-between gap-3 rounded-xl border px-3 py-2.5 transition-colors ${
                    isPaidGroup
                      ? "border-emerald-200 bg-emerald-50/60"
                      : isPendingGroup
                        ? "border-amber-200 bg-amber-50/40"
                        : isOwner
                          ? "border-accent/40 bg-accent/5"
                          : "border-border"
                  }`}
                >
                  <div className="flex min-w-0 items-center gap-2">
                    {isPaidGroup ? (
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                    ) : isPendingGroup ? (
                      <Clock className="h-4 w-4 shrink-0 text-amber-500" />
                    ) : (
                      <User className="h-4 w-4 shrink-0 text-muted-foreground" />
                    )}
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-foreground">
                        {group.label}
                        {isOwner && (
                          <span className="ml-1.5 rounded-full bg-accent/10 px-1.5 py-0.5 text-[10px] font-bold text-accent">
                            tú
                          </span>
                        )}
                      </p>
                      {isPaidGroup && (
                        <p className="text-xs font-medium text-emerald-600">
                          Pagado
                        </p>
                      )}
                      {isPendingGroup && (
                        <p className="text-xs font-medium text-amber-600">
                          Pendiente de validar
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <span className="text-sm font-bold text-foreground">
                      {formatCurrency(group.total)}
                    </span>
                    {!isPaidGroup && !isPendingGroup && onPayGroup && (
                      <button
                        type="button"
                        onClick={() => onPayGroup(group)}
                        className="inline-flex min-h-[36px] cursor-pointer items-center rounded-xl bg-accent px-3 py-1.5 text-xs font-bold text-accent-foreground hover:bg-accent/90 active:scale-95 transition-transform"
                      >
                        Pagar
                      </button>
                    )}
                    {isPendingGroup && (
                      <span className="inline-flex min-h-[36px] items-center rounded-xl bg-amber-100 px-3 py-1.5 text-[11px] font-bold text-amber-800">
                        Por validar
                      </span>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </div>
  );
}
