"use client";

import { useParams } from "next/navigation";
import useSWR from "swr";
import { ReceiptText } from "lucide-react";

type DocumentLine = {
  subtotal: number | string;
  quantity: number | string;
  product?: { name?: string | null } | null;
  name_snapshot?: string | null;
};

type DocumentPayload = {
  kind: "order" | "quote" | "loan_payment" | "credit_account";
  order?: { total?: number | string; status?: string; tenant?: { name?: string | null }; items?: DocumentLine[] } | null;
  quote?: { total?: number | string; status?: string; tenant?: { name?: string | null }; items?: DocumentLine[] } | null;
  payment?: { amount?: number | string; loan?: { tenant?: { name?: string | null } | null } | null } | null;
  account?: { debt_balance?: number | string; stored_balance?: number | string; tenant?: { name?: string | null } | null } | null;
};

const fetcher = async (url: string): Promise<DocumentPayload> => {
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) throw new Error("DOCUMENT_UNAVAILABLE");
  return response.json() as Promise<DocumentPayload>;
};

export default function ComprobantePage() {
  const params = useParams<{ token: string }>();
  const token = Array.isArray(params.token) ? params.token[0] : params.token;
  const { data: payload, error, isLoading } = useSWR(
    token ? `/api/public/documents/${encodeURIComponent(token)}` : null,
    fetcher,
  );

  if (isLoading) return <main className="min-h-screen bg-background px-5 py-10"><div className="mx-auto h-80 max-w-md animate-pulse rounded-2xl border border-border bg-surface" /></main>;
  if (error || !payload) return <main className="min-h-screen bg-background px-5 py-10"><p className="mx-auto max-w-md rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">Este comprobante ya no está disponible.</p></main>;

  const business = payload.order?.tenant ?? payload.quote?.tenant ?? payload.payment?.loan?.tenant ?? payload.account?.tenant;
  const total = payload.order?.total ?? payload.quote?.total ?? payload.payment?.amount ?? payload.account?.debt_balance ?? 0;
  const items = payload.order?.items ?? payload.quote?.items ?? [];
  const title = payload.kind === "quote" ? "Cotización" : payload.kind === "loan_payment" ? "Abono recibido" : "Comprobante";

  return <main className="min-h-screen bg-background px-5 py-10"><article className="mx-auto max-w-md rounded-2xl border border-border bg-surface p-5 shadow-sm"><div className="flex items-center gap-3 border-b border-border-soft pb-4"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10 text-accent"><ReceiptText className="h-5 w-5" /></span><div><p className="font-bold text-foreground">{business?.name ?? "Tlaco"}</p><p className="text-xs text-muted-foreground">Comprobante privado</p></div></div><h1 className="mt-5 text-xl font-bold text-foreground">{title}</h1><p className="mt-1 text-sm text-muted-foreground">Estado: {payload.order?.status ?? payload.quote?.status ?? "vigente"}</p><div className="mt-5 space-y-3">{items.map((item, index) => <div key={`${item.name_snapshot ?? item.product?.name ?? "linea"}-${index}`} className="flex justify-between gap-3 text-sm"><span>{item.product?.name ?? item.name_snapshot ?? "Artículo"} × {item.quantity}</span><strong className="tabular-nums">${Number(item.subtotal).toFixed(2)}</strong></div>)}</div><div className="mt-5 border-t border-border-soft pt-4"><div className="flex justify-between text-lg font-bold text-foreground"><span>Total</span><span className="tabular-nums">${Number(total).toFixed(2)}</span></div>{payload.account && <><p className="mt-2 text-sm text-muted-foreground">Deuda vigente: ${Number(payload.account.debt_balance).toFixed(2)}</p><p className="text-sm text-muted-foreground">Saldo a favor: ${Number(payload.account.stored_balance).toFixed(2)}</p></>}</div></article></main>;
}
