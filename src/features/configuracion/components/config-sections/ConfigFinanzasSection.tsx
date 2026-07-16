"use client";

import type { ConfigFinanzasSectionProps } from "@/features/configuracion/interfaces/sections";
import {
  inputClass,
  labelClass,
} from "@/features/configuracion/constants/formClasses";

export function ConfigFinanzasSection({
  monthlyRent,
  onMonthlyRentChange,
  monthlySalesObjective,
  onMonthlySalesObjectiveChange,
}: ConfigFinanzasSectionProps) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Renta y objetivo de ventas para el dashboard.
      </p>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="config-monthly-rent" className={labelClass}>
            Renta mensual
          </label>
          <input
            id="config-monthly-rent"
            type="number"
            inputMode="decimal"
            min={0}
            step={0.01}
            value={monthlyRent}
            onChange={(e) => onMonthlyRentChange(e.target.value)}
            className={inputClass}
            placeholder="0.00"
          />
        </div>
        <div>
          <label htmlFor="config-sales-objective" className={labelClass}>
            Objetivo de ventas mensual
          </label>
          <input
            id="config-sales-objective"
            type="number"
            inputMode="decimal"
            min={0}
            step={0.01}
            value={monthlySalesObjective}
            onChange={(e) => onMonthlySalesObjectiveChange(e.target.value)}
            className={inputClass}
            placeholder="0.00"
          />
        </div>
      </div>
    </div>
  );
}
