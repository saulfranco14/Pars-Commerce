"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import type { SalesByWeekItem } from "@/app/api/sales-analytics/route";

interface SalesByWeekChartProps {
  data: SalesByWeekItem[];
  loading?: boolean;
}

function formatWeekLabel(weekStart: string) {
  const d = new Date(weekStart);
  return d.toLocaleDateString("es-MX", { day: "2-digit", month: "short" });
}

export function SalesByWeekChart({ data, loading }: SalesByWeekChartProps) {
  const chartData = data.map((d) => ({
    ...d,
    label: formatWeekLabel(d.week_start),
  }));

  if (loading) {
    return (
      <div className="min-h-[200px] rounded-xl border border-border bg-surface-raised p-4 flex items-center justify-center sm:min-h-[220px]">
        <p className="text-sm text-muted-foreground">Cargando...</p>
      </div>
    );
  }

  if (chartData.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-surface-raised p-3 sm:p-4">
        <h3 className="text-sm font-medium text-foreground">Ventas por semana</h3>
        <div className="mt-4 h-[180px] flex items-center justify-center">
          <p className="text-sm text-muted-foreground">Sin datos en el período</p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-surface-raised p-3 sm:p-4">
      <h3 className="text-sm font-medium text-foreground">Ventas por semana</h3>
      <div className="mt-2 h-[200px] w-full sm:h-[220px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border-soft" />
            <XAxis dataKey="label" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `$${v}`} />
            <Tooltip
              formatter={(v: number) => [`$${v.toFixed(2)}`, "Ventas"]}
              labelFormatter={(_, payload) => payload[0]?.payload?.label ?? ""}
            />
            <Bar dataKey="total_revenue" fill="#ec4899" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
