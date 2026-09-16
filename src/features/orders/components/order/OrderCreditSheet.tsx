"use client";

import useSWR from "swr";
import { AlertTriangle, WalletCards } from "lucide-react";

import { FormSheet } from "@/components/ui/FormSheet";
import { swrFetcher } from "@/lib/swrFetcher";

type Account = { id: string; credit_limit: number; debt_balance: number; stored_balance: number; status: string };

export function OrderCreditSheet({ open, onClose, tenantId, orderId, customerId, total, onCharged }: { open: boolean; onClose: () => void; tenantId: string; orderId: string; customerId: string | null | undefined; total: number; onCharged: () => Promise<void> }) {
  const { data: accounts, isLoading } = useSWR<Account[]>(open && customerId ? `/api/credit-accounts?tenant_id=${tenantId}&customer_id=${customerId}` : null, swrFetcher);
  const account = accounts?.[0];
  const available = account ? Number(account.credit_limit) - Number(account.debt_balance) : 0;
  async function charge() { if (!account) return; const response = await fetch(`/api/credit-accounts/${account.id}/charge`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ order_id: orderId }) }); const result = await response.json(); if (!response.ok) { alert(result.error ?? "No pudimos agregar la orden al crédito."); return; } await onCharged(); onClose(); }
  return <FormSheet isOpen={open} onClose={onClose} title="Agregar a crédito" description="Se valida el límite antes de entregar los productos." icon={WalletCards} footer={account ? <button type="button" disabled={available < total || account.status !== "active"} onClick={() => void charge()} className="min-h-12 w-full rounded-xl bg-accent px-4 text-sm font-bold text-accent-foreground disabled:opacity-50">Agregar ${total.toFixed(2)} a crédito</button> : null}>{!customerId ? <p className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">Primero vincula un cliente a esta orden.</p> : isLoading ? <p className="text-sm text-muted-foreground">Buscando línea de crédito…</p> : !account ? <p className="rounded-xl border border-border bg-surface-raised p-3 text-sm text-muted-foreground">Este cliente no tiene crédito autorizado. El propietario puede crearlo desde Crédito de clientes.</p> : <div className="space-y-4"><div className="grid grid-cols-2 gap-3 rounded-xl bg-surface-raised p-3"><div><p className="text-xs text-muted-foreground">Disponible</p><p className="font-bold tabular-nums text-foreground">${available.toFixed(2)}</p></div><div><p className="text-xs text-muted-foreground">Esta orden</p><p className="font-bold tabular-nums text-foreground">${total.toFixed(2)}</p></div></div>{available < total && <p className="flex gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700"><AlertTriangle className="h-4 w-4 shrink-0" />No alcanza el crédito disponible. Debe abonar o el propietario debe aumentar el límite.</p>}{Number(account.stored_balance) > 0 && <p className="text-sm text-emerald-700">Se usará primero el saldo a favor: ${Number(account.stored_balance).toFixed(2)}.</p>}</div>}</FormSheet>;
}
