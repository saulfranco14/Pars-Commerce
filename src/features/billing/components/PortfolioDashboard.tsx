"use client";

import useSWR from "swr";
import { Building2 } from "lucide-react";

import { swrFetcher } from "@/lib/swrFetcher";

type PortfolioResponse = {
  limit: number;
  total_owned: number;
  businesses: Array<{ id: string; name: string; slug: string | null; paid_sales: number }>;
};

export function PortfolioDashboard({ tenantId }: { tenantId: string }) {
  const { data, error } = useSWR<PortfolioResponse>(`/api/portfolio?tenant_id=${encodeURIComponent(tenantId)}`, swrFetcher);
  if (error) return null;
  if (!data) return <div className="mt-3 h-20 animate-pulse rounded-xl bg-border-soft/40" />;
  return (
    <section className="mt-3 rounded-xl border border-border bg-surface p-3" aria-label="Negocios consolidados">
      <div className="flex items-center gap-2"><Building2 className="h-4 w-4 text-accent" /><div><p className="text-sm font-bold text-foreground">Tus negocios</p><p className="text-xs text-muted-foreground">{data.businesses.length} de {data.limit} visibles en tu panel consolidado</p></div></div>
      <div className="mt-3 space-y-2">
        {data.businesses.map((business) => <div key={business.id} className="flex items-center justify-between gap-3 rounded-lg bg-border-soft/35 px-3 py-2"><span className="min-w-0 truncate text-sm font-medium text-foreground">{business.name}</span><span className="shrink-0 text-sm font-bold tabular-nums text-foreground">${business.paid_sales.toLocaleString("es-MX", { minimumFractionDigits: 2 })}</span></div>)}
      </div>
    </section>
  );
}
