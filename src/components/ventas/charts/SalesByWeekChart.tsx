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
import type {
  SalesByWeekItem,
  SalesByDayItem,
} from "@/app/api/sales-analytics/route";

interface SalesByWeekChartProps {
  byWeek: SalesByWeekItem[];
  byDay: SalesByDayItem[];
  dateFrom: string | null;
  dateTo: string | null;
  loading?: boolean;
}

function formatWeekLabel(weekStart: string): string {
  const d = new Date(weekStart + "T12:00:00");
  return d.toLocaleDateString("es-MX", { day: "2-digit", month: "short" });
}

function formatDayLabel(dateStr: string): string {
  const d = new Date(dateStr + "T12:00:00");
  return d.toLocaleDateString("es-MX", { day: "2-digit", month: "short" });
}

export function SalesByWeekChart({
  byWeek,
  byDay,
  dateFrom,
  dateTo,
  loading,
}: SalesByWeekChartProps) {
  const useDaily = byDay.length > 0 && byDay.length <= 14;
  const chartData = useDaily
    ? byDay.map((d) => ({
        label: formatDayLabel(d.date),
        total_revenue: d.total_revenue,
        date: d.date,
      }))
    : byWeek.map((d) => ({
        label: formatWeekLabel(d.week_start),
        total_revenue: d.total_revenue,
        date: d.week_start,
      }));

  const description = useDaily
    ? "Comparativa de ventas por día del período seleccionado."
    : "Comparativa de ventas por semana.";

  if (loading) {
    return (
      <div className="min-h-[260px] rounded-xl border border-border bg-surface-raised p-3 sm:p-4 flex flex-col justify-center">
        <ChartHeader
          title="Ventas por período"
          description={description}
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
          title="Ventas por período"
          description={description}
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
        title="Ventas por período"
        description={description}
        dateFrom={dateFrom}
        dateTo={dateTo}
      />
      <div className="h-[200px] w-full min-w-[120px] sm:h-[220px] min-h-[180px]">
        <ResponsiveContainer width="100%" height="100%" initialDimension={{ width: 400, height: 200 }}>
          <BarChart
            data={chartData}
            margin={{ top: 8, right: 4, left: -8, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" className="stroke-border-soft" />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 10 }}
              interval={chartData.length > 10 ? Math.floor(chartData.length / 7) : 0}
              minTickGap={16}
            />
            <YAxis
              tick={{ fontSize: 10 }}
              tickFormatter={(v) => `$${v >= 1000 ? (v / 1000) + "k" : v}`}
              width={36}
            />
            <Tooltip
              formatter={(v) => [`$${Number(v ?? 0).toFixed(2)}`, "Ventas"]}
              labelFormatter={(_, payload) => payload[0]?.payload?.label ?? ""}
              contentStyle={{ fontSize: 12, minWidth: 120 }}
            />
            <Bar
              dataKey="total_revenue"
              fill="#ec4899"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
