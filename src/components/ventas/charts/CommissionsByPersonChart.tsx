"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import type { SalesByPersonItem } from "@/app/api/sales-analytics/route";

interface CommissionsByPersonChartProps {
  data: SalesByPersonItem[];
  loading?: boolean;
}

function formatName(item: SalesByPersonItem): string {
  return item.display_name || item.email || "Sin nombre";
}

export function CommissionsByPersonChart({ data, loading }: CommissionsByPersonChartProps) {
  const chartData = data.map((d) => ({
    ...d,
    name: formatName(d),
  }));

  if (loading) {
    return (
      <div className="h-[220px] rounded-xl border border-border bg-surface-raised p-4 flex items-center justify-center">
        <p className="text-sm text-muted-foreground">Cargando...</p>
      </div>
    );
  }

  if (chartData.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-surface-raised p-3 sm:p-4">
        <h3 className="text-sm font-medium text-foreground">Comisiones por persona</h3>
        <div className="mt-4 h-[180px] flex items-center justify-center">
          <p className="text-sm text-muted-foreground">Sin datos en el período</p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-surface-raised p-4">
      <h3 className="text-sm font-medium text-foreground">Comisiones por persona</h3>
      <div className="mt-2 h-[200px] w-full sm:h-[220px]" style={{ minHeight: 200 }}>
        <ResponsiveContainer
          width="100%"
          height="100%"
          initialDimension={{ width: 400, height: 200 }}
        >
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 8, right: 8, left: 8, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" className="stroke-border-soft" />
            <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={(v) => `$${v}`} />
            <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={100} />
            <Tooltip formatter={(v: number) => [`$${v.toFixed(2)}`, "Comisión"]} />
            <Bar dataKey="commission_amount" fill="hsl(25 95% 53%)" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
