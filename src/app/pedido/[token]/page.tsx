/* eslint-disable @next/next/no-img-element -- tenant Storage domains are dynamic. */
import { notFound } from "next/navigation";
import { CheckCircle2, Clock3, PackageCheck, XCircle } from "lucide-react";

import { createAdminClient } from "@/lib/supabase/admin";

export const metadata = {
  robots: { index: false, follow: false },
};

const labels: Record<string, { title: string; text: string; icon: typeof Clock3; className: string }> = {
  pending_acceptance: { title: "Solicitud recibida", text: "El negocio revisará disponibilidad antes de confirmar tu pedido.", icon: Clock3, className: "bg-amber-50 text-amber-800" },
  assigned: { title: "Pedido aceptado", text: "El negocio ya aceptó tu pedido y lo preparará.", icon: CheckCircle2, className: "bg-emerald-50 text-emerald-800" },
  in_progress: { title: "En preparación", text: "Tu pedido está siendo preparado.", icon: PackageCheck, className: "bg-blue-50 text-blue-800" },
  cancelled: { title: "Pedido no disponible", text: "El negocio no puede atender este pedido por ahora.", icon: XCircle, className: "bg-red-50 text-red-800" },
};

export default async function PublicOrderRequestPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const admin = createAdminClient();
  const { data: order } = await admin
    .from("orders")
    .select("id, status, total, customer_name, rejection_reason, created_at, tenant:tenants(name, logo_url), items:order_items(quantity, unit_price, subtotal, product:products(name, image_url))")
    .eq("public_tracking_token", token)
    .maybeSingle();
  if (!order) notFound();
  const state = labels[order.status] ?? labels.pending_acceptance;
  const Icon = state.icon;
  const tenant = Array.isArray(order.tenant) ? order.tenant[0] : order.tenant;
  const items = (order.items ?? []).map((item) => ({ ...item, product: Array.isArray(item.product) ? item.product[0] : item.product }));

  return <main className="min-h-screen bg-background px-4 py-8 sm:py-12"><section className="mx-auto max-w-md overflow-hidden rounded-2xl border border-border bg-surface shadow-card"><header className="border-b border-border p-5"><p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Pedido de {tenant?.name ?? "negocio"}</p><h1 className="mt-2 text-xl font-bold text-foreground">Hola, {order.customer_name ?? "cliente"}</h1><p className="mt-1 text-sm text-muted-foreground">Consulta el estado de tu solicitud.</p></header><div className="space-y-5 p-5"><div className={`rounded-xl p-4 ${state.className}`}><Icon className="h-5 w-5" aria-hidden /><h2 className="mt-2 font-bold">{state.title}</h2><p className="mt-1 text-sm leading-6">{order.status === "cancelled" && order.rejection_reason ? order.rejection_reason : state.text}</p></div><section><h2 className="text-sm font-bold text-foreground">Tu pedido</h2><div className="mt-3 divide-y divide-border rounded-xl border border-border">{items.map((item) => <div key={`${item.product?.name}-${item.quantity}`} className="flex items-center gap-3 p-3"><span className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-border-soft">{item.product?.image_url ? <img src={item.product.image_url} alt="" className="h-full w-full object-cover" /> : <PackageCheck className="h-4 w-4 text-muted-foreground" />}</span><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold text-foreground">{item.product?.name ?? "Artículo"}</p><p className="text-xs text-muted-foreground">{item.quantity} × ${Number(item.unit_price).toFixed(2)}</p></div><p className="text-sm font-bold tabular-nums text-foreground">${Number(item.subtotal).toFixed(2)}</p></div>)}</div></section><div className="flex items-center justify-between border-t border-border pt-4"><span className="text-sm font-medium text-muted-foreground">Total</span><span className="text-xl font-bold tabular-nums text-foreground">${Number(order.total).toFixed(2)}</span></div><p className="text-xs leading-5 text-muted-foreground">Esta liga es privada. El pago sólo se solicitará si el negocio acepta tu pedido.</p></div></section></main>;
}
