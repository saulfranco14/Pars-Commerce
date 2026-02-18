"use client";

import { Calendar } from "lucide-react";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { DATE_MIN, getTodayStr, clampDate } from "@/lib/dateValidation";

function getYesterdayStr(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
}

function getSevenDaysAgoStr(): string {
  const d = new Date();
  d.setDate(d.getDate() - 6);
  return d.toISOString().slice(0, 10);
}

interface OrdersFilterSheetProps {
  isOpen: boolean;
  onClose: () => void;
  dateFrom: string;
  dateTo: string;
  onDateFromChange: (value: string) => void;
  onDateToChange: (value: string) => void;
  onQuickDate: (range: "hoy" | "ayer" | "7dias") => void;
  onApply: () => void;
}

export function OrdersFilterSheet({
  isOpen,
  onClose,
  dateFrom,
  dateTo,
  onDateFromChange,
  onDateToChange,
  onQuickDate,
  onApply,
}: OrdersFilterSheetProps) {
  const todayStr = getTodayStr();
  const ayerStr = getYesterdayStr();
  const sevenDaysStr = getSevenDaysAgoStr();
  const isHoyActive = dateFrom === todayStr && dateTo === todayStr;
  const isAyerActive = dateFrom === ayerStr && dateTo === ayerStr;
  const is7diasActive = dateFrom === sevenDaysStr && dateTo === todayStr;

  const quickBtnClass = (active: boolean) =>
    `min-h-(--touch-target,44px) rounded-xl px-4 py-2.5 text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
      active
        ? "bg-accent/15 text-accent ring-1 ring-accent/30"
        : "bg-border-soft/60 text-muted-foreground hover:bg-border-soft hover:text-foreground"
    }`;

  const dateInputWrapperClass =
    "flex items-center gap-3 rounded-xl border border-border bg-background px-3 transition-[border-color,box-shadow] focus-within:border-accent focus-within:ring-2 focus-within:ring-accent/20";

  const dateInputClass =
    "min-h-(--input-height,44px) w-full bg-transparent py-2.5 text-base text-foreground outline-none [color-scheme:light]";

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title="Filtrar por fecha">
      <div className="space-y-6">
        <section>
          <h3 className="mb-3 text-sm font-semibold text-foreground">
            Fechas
          </h3>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => onQuickDate("hoy")}
              className={quickBtnClass(isHoyActive)}
            >
              Hoy
            </button>
            <button
              type="button"
              onClick={() => onQuickDate("ayer")}
              className={quickBtnClass(isAyerActive)}
            >
              Ayer
            </button>
            <button
              type="button"
              onClick={() => onQuickDate("7dias")}
              className={quickBtnClass(is7diasActive)}
            >
              7 días
            </button>
          </div>
          <div className="mt-4 flex flex-col gap-4">
            <label className="flex flex-1 flex-col gap-1.5">
              <span className="text-xs font-medium text-muted-foreground">
                Desde
              </span>
              <div className={dateInputWrapperClass}>
                <Calendar
                  className="h-4 w-4 shrink-0 text-muted-foreground"
                  aria-hidden
                />
                <input
                  type="date"
                  value={dateFrom}
                  min={DATE_MIN}
                  max={getTodayStr()}
                  onChange={(e) => onDateFromChange(clampDate(e.target.value))}
                  className={dateInputClass}
                />
              </div>
            </label>
            <label className="flex flex-1 flex-col gap-1.5">
              <span className="text-xs font-medium text-muted-foreground">
                Hasta
              </span>
              <div className={dateInputWrapperClass}>
                <Calendar
                  className="h-4 w-4 shrink-0 text-muted-foreground"
                  aria-hidden
                />
                <input
                  type="date"
                  value={dateTo}
                  min={DATE_MIN}
                  max={getTodayStr()}
                  onChange={(e) => onDateToChange(clampDate(e.target.value))}
                  className={dateInputClass}
                />
              </div>
            </label>
          </div>
        </section>

        <button
          type="button"
          onClick={() => {
            onApply();
            onClose();
          }}
          className="w-full min-h-(--touch-target,44px) rounded-lg bg-accent px-4 py-3 text-base font-medium text-accent-foreground transition-colors hover:bg-accent/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          Aplicar
        </button>
      </div>
    </BottomSheet>
  );
}
