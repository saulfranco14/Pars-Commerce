"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import useSWR from "swr";
import { CheckCircle2, FileText, MessageCircle, XCircle } from "lucide-react";

import { swrFetcher } from "@/lib/swrFetcher";

export default function CotizacionPublicaPage() {
  const params = useParams<{ token: string }>();
  const token = params.token;
  const { data, error, mutate } = useSWR<any>(token ? `/api/public/quotes/${token}` : null, swrFetcher);
  const [sending, setSending] = useState(false);
  async function respond(action: "accept" | "reject" | "changes") { if (!token) return; setSending(true); const response = await fetch(`/api/public/quotes/${token}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action }) }); const result = await response.json(); if (!response.ok) alert(result.error ?? "No pudimos registrar tu respuesta."); else await mutate(); setSending(false); }
  if (error) return <main className="min-h-screen bg-background px-5 py-12 text-center"><XCircle className="mx-auto h-10 w-10 text-red-500" /><h1 className="mt-3 text-xl font-bold">Esta cotización no está disponible</h1></main>;
  if (!data) return <main className="min-h-screen bg-background px-5 py-12 text-center text-sm text-muted-foreground">Cargando cotización…</main>;
  return <main className="min-h-screen bg-background px-5 py-8"><article className="mx-auto max-w-md rounded-2xl border border-border bg-surface p-5 shadow-sm"><div className="flex items-center gap-3 border-b border-border-soft pb-4"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10 text-accent"><FileText className="h-5 w-5" /></span><div><p className="font-bold text-foreground">{data.tenant?.name}</p><p className="text-xs text-muted-foreground">{data.quote_number} · Vigente hasta {new Date(data.valid_until).toLocaleDateString("es-MX")}</p></div></div><h1 className="mt-5 text-xl font-bold text-foreground">Cotización para {data.customer?.name}</h1><div className="mt-5 space-y-3">{data.items?.sort((a: any, b: any) => a.position - b.position).map((item: any) => <div key={item.name_snapshot} className="flex justify-between gap-3 text-sm"><span>{item.name_snapshot} × {item.quantity}</span><strong>${Number(item.subtotal).toFixed(2)}</strong></div>)}</div><div className="mt-5 border-t border-border-soft pt-4"><div className="flex justify-between text-lg font-bold"><span>Total</span><span>${Number(data.total).toFixed(2)}</span></div>{data.customer_note && <p className="mt-3 text-sm text-muted-foreground">{data.customer_note}</p>}</div>{["sent", "viewed", "ready_to_send"].includes(data.status) && <div className="mt-6 grid gap-2"><button disabled={sending} onClick={() => void respond("accept")} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-accent px-4 text-sm font-bold text-accent-foreground disabled:opacity-50"><CheckCircle2 className="h-4 w-4" />Aceptar cotización</button><button disabled={sending} onClick={() => void respond("changes")} className="min-h-11 rounded-xl border border-border bg-surface text-sm font-semibold text-foreground">Solicitar cambios</button><button disabled={sending} onClick={() => void respond("reject")} className="min-h-11 rounded-xl text-sm font-semibold text-muted-foreground">No aceptar</button></div>}{data.status === "converted" && <p className="mt-6 rounded-xl bg-emerald-50 p-3 text-sm font-semibold text-emerald-800">Tu cotización fue aceptada. El negocio continuará con tu orden.</p>}</article></main>;
}
