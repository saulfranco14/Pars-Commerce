"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import type { SalesByPaymentMethod } from "@/app/api/sales-analytics/route";
import { formatPaymentMethod } from "@/lib/formatPaymentMethod";

const COLORS = [
  "hsl(142 71% 45%)",
  "hsl(263 70% 50%)",
  "hsl(217 91% 60%)",
  "hsl(199 89% 48%)",
  "hsl(25 95% 53%)",
];

interface SalesByPaymentMethodChartProps {
  data: SalesByPaymentMethod;
  loading?: boolean;
}

export function SalesByPaymentMethodChart({ data, loading }: SalesByPaymentMethodChartProps) {
  const entries = [
    { name: formatPaymentMethod("efectivo") || "Efectivo", value: data.efectivo },
    { name: formatPaymentMethod("transferencia") || "Transferencia", value: data.transferencia },
    { name: formatPaymentMethod("tarjeta") || "Tarjeta", value: data.tarjeta },
    { name: formatPaymentMethod("mercadopago") || "Mercado Pago", value: data.mercadopago },
    { name: "Otro", value: data.other },
  ].filter((d) => d.value > 0);

  if (loading) {
    return (
      <div className="h-[220px] rounded-xl border border-border bg-surface-raised p-4 flex items-center justify-center">
        <p className="text-sm text-muted-foreground">Cargando...</p>
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-surface-raised p-4">
        <h3 className="text-sm font-medium text-foreground">Ventas por método de pago</h3>
        <div className="mt-4 h-[180px] flex items-center justify-center">
          <p className="text-sm text-muted-foreground">Sin datos en el período</p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-surface-raised p-3 sm:p-4">
      <h3 className="text-sm font-medium text-foreground">Ventas por método de pago</h3>
      <div className="mt-2 h-[200px] w-full sm:h-[220px]">
        <ResponsiveContainer width="100%" height="100%">
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
            <Tooltip formatter={(v: number) => `$${v.toFixed(2)}`} />
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
