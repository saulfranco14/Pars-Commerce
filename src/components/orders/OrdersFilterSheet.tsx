"use client";

import { useEffect, useMemo, useState } from "react";
import { useBodyScrollLock } from "@/hooks/useBodyScrollLock";
import { createPortal } from "react-dom";
import { Calendar, RotateCcw, X } from "lucide-react";

import { DATE_MIN, clampDate, getTodayStr } from "@/lib/dateValidation";
import { FULFILLMENT_TABS } from "@/features/orders/constants/fulfillmentTabs";
import { STATUS_TABS } from "@/features/orders/constants/statusTabs";
import type { QuickDateRange } from "@/components/ui/DateFilterSheet";

interface OrdersFilterSheetProps {
  isOpen: boolean;
  onClose: () => void;
  status: string;
  fulfillment: string;
  onStatusChange: (value: string) => void;
  onFulfillmentChange: (value: string) => void;
  dateFrom: string;
  dateTo: string;
  onDateFromChange: (value: string) => void;
  onDateToChange: (value: string) => void;
  onQuickDate: (range: QuickDateRange) => void;
  onApply: () => void;
}

export function OrdersFilterSheet({
  isOpen,
  onClose,
  status,
  fulfillment,
  onStatusChange,
  onFulfillmentChange,
  dateFrom,
  dateTo,
  onDateFromChange,
  onDateToChange,
  onQuickDate,
  onApply,
}: OrdersFilterSheetProps) {
  const [mounted, setMounted] = useState(false);
  const activeStage = fulfillment
    ? `fulfillment:${fulfillment}`
    : status
      ? `status:${status}`
      : "all";

  useEffect(() => setMounted(true), []);
  useBodyScrollLock(isOpen);
  useEffect(() => {
    if (!isOpen) return;
    const onEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onEscape);
    return () => {
      document.removeEventListener("keydown", onEscape);
    };
  }, [isOpen, onClose]);

  const quickDates = useMemo(
    () => [
      { value: "hoy" as const, label: "Hoy" },
      { value: "ayer" as const, label: "Ayer" },
      { value: "7dias" as const, label: "7 días" },
    ],
    [],
  );

  if (!isOpen || !mounted) return null;

  function changeStage(value: string) {
    if (value.startsWith("fulfillment:")) {
      onFulfillmentChange(value.replace("fulfillment:", ""));
      onStatusChange("");
      return;
    }
    if (value.startsWith("status:")) {
      onStatusChange(value.replace("status:", ""));
      onFulfillmentChange("");
      return;
    }
    onStatusChange("");
    onFulfillmentChange("");
  }

  function clearAll() {
    onStatusChange("");
    onFulfillmentChange("");
    onDateFromChange("");
    onDateToChange("");
  }

  return createPortal(
    <div className="fixed inset-0 z-100 flex items-end justify-center bg-black/60 md:items-center md:p-6" role="dialog" aria-modal="true" aria-labelledby="orders-filter-title">
      <button type="button" className="absolute inset-0 cursor-default" onClick={onClose} aria-label="Cerrar filtros" />
      <section className="relative z-10 flex max-h-[92dvh] w-full flex-col overflow-hidden rounded-t-[28px] border border-border bg-surface shadow-2xl md:max-w-lg md:rounded-3xl">
        <div className="shrink-0 border-b border-border px-4 pb-4 pt-3 md:px-6 md:pt-5">
          <div className="mx-auto h-1 w-12 rounded-full bg-slate-300 md:hidden" aria-hidden />
          <div className="mt-3 flex items-center justify-between gap-4 md:mt-0">
            <div>
              <h2 id="orders-filter-title" className="text-lg font-bold text-foreground">Filtrar órdenes</h2>
              <p className="mt-0.5 text-sm text-muted-foreground">Elige un estado y, si lo necesitas, un periodo.</p>
            </div>
            <button type="button" onClick={onClose} className="flex h-11 w-11 items-center justify-center rounded-xl border border-border text-muted-foreground" aria-label="Cerrar">
              <X className="h-5 w-5" aria-hidden />
            </button>
          </div>
        </div>

        <div className="min-h-0 flex-1 space-y-6 overflow-y-auto overscroll-contain px-4 py-5 md:px-6">
          <label className="block">
            <span className="text-sm font-semibold text-foreground">Estado del pedido</span>
            <select
              value={activeStage}
              onChange={(event) => changeStage(event.target.value)}
              className="mt-2 min-h-12 w-full rounded-xl border border-border bg-background px-3 text-base text-foreground outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            >
              <option value="all">Todos los pedidos</option>
              <optgroup label="Preparación y entrega">
                {FULFILLMENT_TABS.filter((tab) => tab.value).map((tab) => (
                  <option key={tab.value} value={`fulfillment:${tab.value}`}>{tab.label}</option>
                ))}
              </optgroup>
              <optgroup label="Orden y cobro">
                {STATUS_TABS.filter((tab) => tab.value).map((tab) => (
                  <option key={tab.value} value={`status:${tab.value}`}>{tab.label}</option>
                ))}
              </optgroup>
            </select>
          </label>

          <section>
            <h3 className="text-sm font-semibold text-foreground">Periodo</h3>
            <div className="mt-2 flex flex-wrap gap-2">
              {quickDates.map((option) => (
                <button key={option.value} type="button" onClick={() => onQuickDate(option.value)} className="min-h-11 rounded-xl bg-border-soft/60 px-4 text-sm font-medium text-foreground hover:bg-border-soft">
                  {option.label}
                </button>
              ))}
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {[
                { label: "Desde", value: dateFrom, change: onDateFromChange },
                { label: "Hasta", value: dateTo, change: onDateToChange },
              ].map((input) => (
                <label key={input.label} className="block">
                  <span className="text-xs font-medium text-muted-foreground">{input.label}</span>
                  <span className="mt-1.5 flex min-h-12 items-center gap-2 rounded-xl border border-border bg-background px-3 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100">
                    <Calendar className="h-4 w-4 text-muted-foreground" aria-hidden />
                    <input type="date" value={input.value} min={DATE_MIN} max={getTodayStr()} onChange={(event) => input.change(clampDate(event.target.value))} className="min-w-0 flex-1 bg-transparent text-base text-foreground outline-none" />
                  </span>
                </label>
              ))}
            </div>
          </section>
        </div>

        <div className="grid shrink-0 gap-2 border-t border-border bg-surface px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 sm:grid-cols-[auto_1fr] md:px-6 md:pb-5">
          <button type="button" onClick={clearAll} className="flex min-h-12 items-center justify-center gap-2 rounded-xl border border-border px-4 font-semibold text-muted-foreground">
            <RotateCcw className="h-4 w-4" aria-hidden />
            Limpiar
          </button>
          <button type="button" onClick={onApply} className="min-h-12 rounded-xl bg-blue-600 px-5 font-bold text-white hover:bg-blue-700">
            Ver pedidos
          </button>
        </div>
      </section>
    </div>,
    document.body,
  );
}
