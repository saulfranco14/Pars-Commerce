"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { ChartHeader } from "./ChartHeader";
import type { SalesByDayItem } from "@/app/api/sales-analytics/route";

interface SalesTrendChartProps {
  data: SalesByDayItem[];
  dateFrom: string | null;
  dateTo: string | null;
  loading?: boolean;
}

function formatDayLabel(dateStr: string): string {
  const d = new Date(dateStr + "T12:00:00");
  return d.toLocaleDateString("es-MX", { day: "2-digit", month: "short" });
}

export function SalesTrendChart({
  data,
  dateFrom,
  dateTo,
  loading,
}: SalesTrendChartProps) {
  const chartData = data.map((d) => ({
    ...d,
    label: formatDayLabel(d.date),
    total_revenue: d.total_revenue,
  }));

  if (loading) {
    return (
      <div className="min-h-[260px] rounded-xl border border-border bg-surface-raised p-3 sm:p-4 flex flex-col justify-center">
        <ChartHeader
          title="Tendencia de ventas"
          description="Ventas por día. Los picos muestran días con ventas, los valles días sin actividad."
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
          title="Tendencia de ventas"
          description="Ventas por día. Los picos muestran días con ventas, los valles días sin actividad."
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
        title="Tendencia de ventas"
        description="Ventas por día. Los picos muestran días con ventas, los valles días sin actividad."
        dateFrom={dateFrom}
        dateTo={dateTo}
      />
      <div className="h-[200px] w-full min-w-[120px] sm:h-[220px] min-h-[180px]">
        <ResponsiveContainer width="100%" height="100%" initialDimension={{ width: 400, height: 200 }}>
          <LineChart
            data={chartData}
            margin={{ top: 8, right: 4, left: -8, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" className="stroke-border-soft" />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 10 }}
              interval="preserveStartEnd"
              minTickGap={20}
            />
            <YAxis
              tick={{ fontSize: 10 }}
              tickFormatter={(v) => `$${v >= 1000 ? (v / 1000) + "k" : v}`}
              width={36}
            />
            <Tooltip
              formatter={(v) => [`$${Number(v ?? 0).toFixed(2)}`, "Ventas"]}
              labelFormatter={(_, payload) =>
                payload[0]?.payload?.date
                  ? formatDayLabel(payload[0].payload.date)
                  : ""
              }
              contentStyle={{
                fontSize: 12,
                minWidth: 120,
              }}
            />
            <Line
              type="monotone"
              dataKey="total_revenue"
              stroke="#ec4899"
              strokeWidth={2}
              dot={{ r: chartData.length <= 14 ? 4 : 2 }}
              connectNulls
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
