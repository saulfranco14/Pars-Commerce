"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import type { SalesByPaymentMethod } from "@/app/api/sales-analytics/route";
import { formatPaymentMethod } from "@/lib/formatPaymentMethod";
import { ChartHeader } from "./ChartHeader";

const COLORS = [
  "hsl(142 71% 45%)",
  "hsl(263 70% 50%)",
  "hsl(217 91% 60%)",
  "hsl(199 89% 48%)",
  "hsl(25 95% 53%)",
];

interface SalesByPaymentMethodChartProps {
  data: SalesByPaymentMethod;
  dateFrom: string | null;
  dateTo: string | null;
  loading?: boolean;
}

export function SalesByPaymentMethodChart({
  data,
  dateFrom,
  dateTo,
  loading,
}: SalesByPaymentMethodChartProps) {
  const entries = [
    { name: formatPaymentMethod("efectivo") || "Efectivo", value: data.efectivo },
    { name: formatPaymentMethod("transferencia") || "Transferencia", value: data.transferencia },
    { name: formatPaymentMethod("tarjeta") || "Tarjeta", value: data.tarjeta },
    { name: formatPaymentMethod("mercadopago") || "Mercado Pago", value: data.mercadopago },
    { name: "Otro", value: data.other },
  ].filter((d) => d.value > 0);

  if (loading) {
    return (
      <div className="min-h-[260px] rounded-xl border border-border bg-surface-raised p-3 sm:p-4 flex flex-col justify-center">
        <ChartHeader
          title="Ventas por método de pago"
          description="Distribución de ventas por forma de pago."
          dateFrom={dateFrom}
          dateTo={dateTo}
        />
        <div className="flex-1 flex items-center justify-center">
          <p className="text-sm text-muted-foreground">Cargando...</p>
        </div>
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-surface-raised p-3 sm:p-4">
        <ChartHeader
          title="Ventas por método de pago"
          description="Distribución de ventas por forma de pago."
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
    <div className="rounded-xl border border-border bg-surface-raised p-3 sm:p-4">
      <ChartHeader
        title="Ventas por método de pago"
        description="Distribución de ventas por forma de pago."
        dateFrom={dateFrom}
        dateTo={dateTo}
      />
      <div className="mt-2 h-[200px] w-full min-w-[120px] sm:h-[220px]" style={{ minHeight: 200 }}>
        <ResponsiveContainer
          width="100%"
          height="100%"
          initialDimension={{ width: 400, height: 200 }}
        >
          <PieChart>
            <Pie
              data={entries}
              cx="50%"
              cy="45%"
              innerRadius="40%"
              outerRadius="65%"
              paddingAngle={2}
              dataKey="value"
              nameKey="name"
            >
              {entries.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip formatter={(v) => `$${Number(v ?? 0).toFixed(2)}`} />
            <Legend
              layout="horizontal"
              wrapperStyle={{ paddingTop: "8px" }}
              formatter={(value) => <span className="text-xs text-muted-foreground">{value}</span>}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
