"use client";

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface TrendPoint {
  date: string;
  label: string;
  total_revenue: number;
}

interface SalesTrendChartProps {
  data: TrendPoint[];
  loading?: boolean;
}

export function SalesTrendChart({ data, loading }: SalesTrendChartProps) {
  if (loading) {
    return (
      <div className="h-[220px] rounded-xl border border-border bg-surface-raised p-4 flex items-center justify-center">
        <p className="text-sm text-muted-foreground">Cargando...</p>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-surface-raised p-3 sm:p-4">
        <h3 className="text-sm font-medium text-foreground">Tendencia de ventas</h3>
        <div className="mt-4 h-[180px] flex items-center justify-center">
          <p className="text-sm text-muted-foreground">Sin datos en el período</p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-surface-raised p-4">
      <h3 className="text-sm font-medium text-foreground">Tendencia de ventas</h3>
      <div className="mt-2 h-[200px] w-full sm:h-[220px]" style={{ minHeight: 200 }}>
        <ResponsiveContainer
          width="100%"
          height="100%"
          initialDimension={{ width: 400, height: 200 }}
        >
          <LineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border-soft" />
            <XAxis dataKey="label" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `$${v}`} />
            <Tooltip formatter={(v: number) => [`$${v.toFixed(2)}`, "Ventas"]} />
            <Line
              type="monotone"
              dataKey="total_revenue"
              stroke="#ec4899"
              strokeWidth={2}
              dot={{ r: 3 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
