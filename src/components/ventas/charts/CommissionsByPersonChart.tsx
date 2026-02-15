"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { ChartHeader } from "./ChartHeader";
import type { SalesByPersonItem } from "@/app/api/sales-analytics/route";

interface CommissionsByPersonChartProps {
  data: SalesByPersonItem[];
  dateFrom: string | null;
  dateTo: string | null;
  loading?: boolean;
}

function formatName(item: SalesByPersonItem): string {
  const name = item.display_name || item.email || "Sin nombre";
  return name.length > 20 ? name.slice(0, 18) + "…" : name;
}

export function CommissionsByPersonChart({
  data,
  dateFrom,
  dateTo,
  loading,
}: CommissionsByPersonChartProps) {
  const chartData = data.map((d) => ({
    ...d,
    name: formatName(d),
  }));

  const barHeight = 28;
  const chartHeight = Math.max(200, Math.min(320, chartData.length * barHeight));

  if (loading) {
    return (
      <div className="min-h-[260px] rounded-xl border border-border bg-surface-raised p-3 sm:p-4 flex flex-col justify-center">
        <ChartHeader
          title="Comisiones por persona"
          description="Comisiones generadas por cada comisionista en el período."
          dateFrom={dateFrom}
          dateTo={dateTo}
        />
        <div className="flex-1 flex items-center justify-center">
          <p className="text-sm text-muted-foreground">Cargando...</p>
        </div>
      </div>
    );
  }

  if (chartData.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-surface-raised p-3 sm:p-4">
        <ChartHeader
          title="Comisiones por persona"
          description="Comisiones generadas por cada comisionista en el período."
          dateFrom={dateFrom}
          dateTo={dateTo}
        />
        <div className="mt-4 h-[180px] flex items-center justify-center">
          <p className="text-sm text-muted-foreground">Sin datos en el período</p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-surface-raised p-3 sm:p-4 overflow-hidden">
      <ChartHeader
        title="Comisiones por persona"
        description="Comisiones generadas por cada comisionista en el período."
        dateFrom={dateFrom}
        dateTo={dateTo}
      />
      <div
        className="w-full overflow-x-auto overflow-y-auto"
        style={{ maxHeight: 320, minHeight: 200 }}
      >
        <div style={{ height: chartHeight, minWidth: 280 }} className="min-h-[150px]">
          <ResponsiveContainer width="100%" height="100%" initialDimension={{ width: 400, height: 200 }}>
            <BarChart
              data={chartData}
              layout="vertical"
              margin={{ top: 4, right: 4, left: 0, bottom: 4 }}
            >
              <CartesianGrid strokeDasharray="3 3" className="stroke-border-soft" />
              <XAxis
                type="number"
                tick={{ fontSize: 10 }}
                tickFormatter={(v) => `$${v >= 1000 ? (v / 1000) + "k" : v}`}
                width={40}
              />
              <YAxis
                type="category"
                dataKey="name"
                tick={{ fontSize: 10 }}
                width={90}
              />
              <Tooltip
                formatter={(v) => [`$${Number(v ?? 0).toFixed(2)}`, "Comisión"]}
                contentStyle={{ fontSize: 12, minWidth: 140 }}
              />
              <Bar
                dataKey="commission_amount"
                fill="hsl(25 95% 53%)"
                radius={[0, 4, 4, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
