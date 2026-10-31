"use client";

import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { COLOR_REVENUE } from "@/features/ventas/constants/chartColors";

import type { OverviewChartProps } from "@/features/platform/interfaces/overview";

function dayLabel(day: string): string {
  return new Date(`${day.slice(0, 10)}T12:00:00`).toLocaleDateString("es-MX", { day: "2-digit", month: "short" });
}

/** One series per day; a single color because there is one measure per chart. */
export function OverviewChart({ title, description, data, kind, valueLabel }: OverviewChartProps) {
  const rows = data.map((point) => ({ ...point, label: dayLabel(point.day) }));
  const empty = rows.every((row) => row.value === 0);

  return (
    <section className="grid gap-2 rounded-2xl border border-border bg-surface p-4" aria-label={title}>
      <div>
        <h2 className="text-sm font-bold text-foreground">{title}</h2>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      {empty ? (
        <p className="flex h-44 items-center justify-center text-sm text-muted-foreground">Sin datos en el periodo</p>
      ) : (
        <div className="h-48 w-full min-w-0">
          <ResponsiveContainer width="100%" height="100%" initialDimension={{ width: 400, height: 192 }}>
            {kind === "line" ? (
              <LineChart data={rows} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border-soft" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 10 }} interval="preserveStartEnd" minTickGap={24} />
                <YAxis tick={{ fontSize: 10 }} allowDecimals={false} width={32} />
                <Tooltip formatter={(value) => [Number(value ?? 0).toLocaleString("es-MX"), valueLabel]} contentStyle={{ fontSize: 12 }} />
                <Line type="monotone" dataKey="value" stroke={COLOR_REVENUE} strokeWidth={2} dot={{ r: rows.length <= 14 ? 3 : 0 }} activeDot={{ r: 5 }} />
              </LineChart>
            ) : (
              <BarChart data={rows} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border-soft" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 10 }} interval="preserveStartEnd" minTickGap={24} />
                <YAxis tick={{ fontSize: 10 }} allowDecimals={false} width={32} />
                <Tooltip formatter={(value) => [Number(value ?? 0).toLocaleString("es-MX"), valueLabel]} contentStyle={{ fontSize: 12 }} cursor={{ fillOpacity: 0.08 }} />
                <Bar dataKey="value" fill={COLOR_REVENUE} radius={[4, 4, 0, 0]} />
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>
      )}
    </section>
  );
}
