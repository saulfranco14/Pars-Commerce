"use client";

interface ConfigFinanzasSectionProps {
  monthlyRent: string;
  onMonthlyRentChange: (v: string) => void;
  monthlySalesObjective: string;
  onMonthlySalesObjectiveChange: (v: string) => void;
}

const inputClass =
  "input-form mt-1 block w-full min-h-(--touch-target,44px) rounded-xl border border-border px-3 py-2.5 text-base text-foreground placeholder:text-muted focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20";
const labelClass = "block text-sm font-medium text-muted-foreground";

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
