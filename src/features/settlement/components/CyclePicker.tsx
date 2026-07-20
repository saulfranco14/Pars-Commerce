"use client";

import { Check } from "lucide-react";

import { formatMXN } from "@/lib/loanUtils";
import { CYCLE_LABEL } from "@/features/settlement/constants/labels";
import type {
  CyclePreviewRow,
  SettlementCycle,
} from "@/types/settlement";

interface CyclePickerProps {
  preview: CyclePreviewRow[];
  previewBasis: number;
  selected: SettlementCycle;
  onSelect: (cycle: SettlementCycle) => void;
  saving?: boolean;
}

/**
 * The business picks its settlement cycle and sees, on a sample net amount,
 * what each cycle would pay out — so "less frequent = you keep more" is
 * visible before choosing.
 */
export function CyclePicker({
  preview,
  previewBasis,
  selected,
  onSelect,
  saving,
}: CyclePickerProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-start gap-2 rounded-lg bg-surface-raised px-3 py-2">
        <span className="mt-0.5 shrink-0 rounded-full bg-accent/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-accent">
          Ejemplo
        </span>
        <p className="text-xs text-muted-foreground">
          Simulación sobre {formatMXN(previewBasis)} netos de Mercado Pago (no
          es tu saldo). Así se vería tu comisión según la frecuencia: menos
          seguido = menor comisión.
        </p>
      </div>
      <div className="grid gap-2">
        {preview.map((row) => {
          const isSelected = row.cycle === selected;
          const pct =
            row.commissionPercent != null
              ? `${(row.commissionPercent * 100).toFixed(1)}%`
              : "por contrato";
          return (
            <button
              key={row.cycle}
              type="button"
              disabled={saving || row.cycle === "custom"}
              onClick={() => onSelect(row.cycle)}
              className={`flex items-center justify-between rounded-xl border-2 px-4 py-3 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
                isSelected
                  ? "border-accent bg-accent/5"
                  : "border-border bg-surface hover:bg-border-soft/40"
              }`}
            >
              <div>
                <p className="font-semibold text-foreground">
                  {CYCLE_LABEL[row.cycle]}
                </p>
                <p className="text-xs text-muted-foreground">
                  Comisión {pct}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {row.amountToTransfer != null && (
                  <span className="text-sm font-bold text-foreground">
                    {formatMXN(row.amountToTransfer)}
                  </span>
                )}
                {isSelected && <Check className="h-4 w-4 text-accent" />}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
