/* eslint-disable @next/next/no-img-element -- tenant storage uses signed URLs. */
/* eslint-disable @typescript-eslint/no-explicit-any -- Commerce schema types are regenerated after the migration rollout. */
import { notFound } from "next/navigation";
import { Camera, CheckCircle2, Clock3, Landmark, LockKeyhole, PackageCheck, ReceiptText, Star, Store, Truck, XCircle } from "lucide-react";

import { createAdminClient } from "@/lib/supabase/admin";
import { ReviewOrderItem } from "./ReviewOrderItem";
import { TrackingOrderFooter } from "./TrackingOrderFooter";
import { describeWeek, readBusinessHours } from "@/features/configuracion/helpers/businessHours";
import { CommerceFulfillmentTracker } from "@/features/orders/components/tracking/CommerceFulfillmentTracker";
import { resolveOrderFulfillmentMethod } from "@/features/orders/helpers/resolveOrderFulfillmentMethod";

export const metadata = { robots: { index: false, follow: false } };
type CommerceAdmin = { from: (table: string) => any; storage: any };
const labels: Record<string, { title: string; text: string; icon: typeof Clock3; className: string }> = {
  pending_payment: { title: "Pago pendiente", text: "Completa el pago para que el negocio pueda continuar.", icon: Clock3, className: "bg-amber-50 text-amber-800" },
  pending_acceptance: { title: "Pago confirmado", text: "El negocio revisará y aceptará tu pedido para comenzar a prepararlo.", icon: CheckCircle2, className: "bg-emerald-50 text-emerald-800" },
  paid: { title: "Pago confirmado", text: "Ahora puedes seguir aquí la preparación y la entrega de tu pedido.", icon: CheckCircle2, className: "bg-emerald-50 text-emerald-800" },
  assigned: { title: "Pedido aceptado", text: "El negocio ya aceptó tu pedido y lo preparará.", icon: CheckCircle2, className: "bg-emerald-50 text-emerald-800" },
  in_progress: { title: "En preparación", text: "Tu pedido está siendo preparado.", icon: PackageCheck, className: "bg-blue-50 text-blue-800" },
  completed: { title: "Pedido entregado", text: "Tu pedido fue marcado como entregado.", icon: CheckCircle2, className: "bg-emerald-50 text-emerald-800" },
  cancelled: { title: "Pedido no disponible", text: "El negocio no puede atender este pedido por ahora.", icon: XCircle, className: "bg-red-50 text-red-800" },
};

export default async function PublicOrderRequestPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const admin = createAdminClient() as unknown as CommerceAdmin;
  const { data: order } = await admin.from("orders").select("id, status, fulfillment_status, total, paid_total, paid_at, customer_name, rejection_reason, created_at, scheduled_for, payment_verification_status, fulfillment_method, delivery_fee, transfer_payment_method_id, tenant:tenants(name, logo_url, settings), items:order_items(id, quantity, unit_price, subtotal, variant_snapshot, product:products(id, name, image_url, type), reviews:product_reviews(id, rating, comment, status, published_at))").eq("public_tracking_token", token).maybeSingle();
  if (!order) notFound();
  const [{ data: delivery }, { data: events }, { data: proofs }, { data: transfer }] = await Promise.all([
    admin.from("order_delivery_details").select("address_text, reference, recipient_name, pickup_point_id, pickup_point:tenant_pickup_points(name, address_text, reference, instructions, business_hours)").eq("order_id", order.id).maybeSingle(),
    admin.from("order_delivery_events").select("id, type, note, photo_path, created_at").eq("order_id", order.id).order("created_at"),
    admin.from("order_transfer_proofs").select("id, status, rejection_reason, created_at").eq("order_id", order.id).order("created_at", { ascending: false }),
    admin.from("tenant_payment_methods").select("label, bank_name, account_holder, clabe, account_number").eq("id", order.transfer_payment_method_id ?? "00000000-0000-0000-0000-000000000000").maybeSingle(),
  ]);
  const baseState = labels[order.status] ?? labels.pending_acceptance;
  const tenant = Array.isArray(order.tenant) ? order.tenant[0] : order.tenant;
  const pickupPoint = delivery?.pickup_point
    ? Array.isArray(delivery.pickup_point) ? delivery.pickup_point[0] : delivery.pickup_point
    : null;
  const pickupHours = pickupPoint?.business_hours
    ? readBusinessHours({ business_hours: pickupPoint.business_hours })
    : readBusinessHours((tenant?.settings as Record<string, unknown> | null) ?? null);
  const items = (order.items ?? []).map((item: any) => ({ ...item, product: Array.isArray(item.product) ? item.product[0] : item.product }));
  const latestProof = proofs?.[0] as { status?: string; rejection_reason?: string | null } | undefined;
  const deliveryEvents = (events ?? []) as Array<{ id: string; type: string; note?: string | null; photo_path?: string | null; created_at: string }>;
  const fulfillmentMethod = resolveOrderFulfillmentMethod({
    fulfillment_method: order.fulfillment_method,
    scheduled_for: order.scheduled_for,
    delivery_details: delivery,
  });
  const relevantDeliveryEvents = deliveryEvents.filter((event) =>
    fulfillmentMethod === "delivery"
      ? event.type !== "pickup_completed"
      : !["out_for_delivery", "delivered"].includes(event.type),
  );
  const paymentSettled =
    order.status === "paid" ||
    Boolean(order.paid_at) ||
    Number(order.paid_total ?? 0) >= Number(order.total) ||
    order.payment_verification_status === "approved";
  const hasOutForDelivery = relevantDeliveryEvents.some((event) => event.type === "out_for_delivery");
  const hasFinishedFulfillment = relevantDeliveryEvents.some((event) =>
    fulfillmentMethod === "delivery"
      ? event.type === "delivered"
      : event.type === "pickup_completed",
  );
  const state = hasFinishedFulfillment
    ? {
        ...labels.completed,
        title: "Pedido entregado",
        text:
          fulfillmentMethod === "delivery"
            ? "El negocio confirmó la entrega de tu pedido."
            : "El negocio confirmó que te entregó el pedido en el punto de recolección.",
      }
    : order.status === "completed" && paymentSettled
      ? labels.paid
      : baseState;
  const Icon = state.icon;
  const liveFulfillmentLabel = hasFinishedFulfillment
    ? "Entregado"
    : hasOutForDelivery
      ? "En camino"
      : order.fulfillment_status === "ready"
        ? "Listo"
        : order.fulfillment_status === "in_progress"
          ? "Preparando"
          : state.title;
  const deliveredEvent = relevantDeliveryEvents.find((event) =>
    fulfillmentMethod === "delivery"
      ? event.type === "delivered"
      : event.type === "pickup_completed",
  ) as { photo_path?: string | null; created_at: string; note?: string | null } | undefined;
  const signedEvidence = deliveredEvent?.photo_path ? await admin.storage.from("order-delivery-proofs").createSignedUrl(deliveredEvent.photo_path, 60 * 15) : null;
  const total = Number(order.total);
  const visibleItems = items.slice(0, 2);
  const hiddenItems = items.slice(2);
  const pickupDate = order.scheduled_for
    ? new Intl.DateTimeFormat("es-MX", { dateStyle: "medium", timeStyle: "short", timeZone: "America/Mexico_City" }).format(new Date(order.scheduled_for))
    : null;
  const firstUnreviewedItem = items.find((item: any) => {
    const reviews = Array.isArray(item.reviews) ? item.reviews : [];
    return reviews.length === 0;
  });

  return (
    <main className="min-h-screen bg-background px-4 pb-64 pt-5 sm:px-6 sm:pb-56 sm:pt-10 lg:pb-56 lg:pt-12">
      <section className="mx-auto max-w-6xl">
        <header className="border-b border-border pb-5 sm:rounded-t-3xl sm:border-x sm:border-t sm:bg-surface sm:px-7 sm:pt-7 lg:px-8">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">Pedido de {tenant?.name ?? "negocio"}</p>
              <h1 className="mt-1 text-2xl font-bold tracking-tight text-foreground">Hola, {order.customer_name ?? "cliente"}</h1>
              <p className="mt-1 text-sm leading-5 text-muted-foreground">Aquí puedes revisar el avance y los detalles de tu pedido.</p>
            </div>
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border-soft bg-surface text-muted-foreground" aria-label="Enlace privado">
              <LockKeyhole className="h-4 w-4" aria-hidden />
            </span>
          </div>
        </header>

        <div className="grid gap-4 pt-5 sm:rounded-b-3xl sm:border-x sm:border-b sm:bg-surface sm:p-7 sm:pt-6 lg:grid-cols-[minmax(0,0.82fr)_minmax(0,1.18fr)] lg:items-start lg:gap-6 lg:p-8">
          <div className="min-w-0 space-y-4 lg:sticky lg:top-6">
          <section className={`rounded-2xl border p-4 ${state.className}`} aria-live="polite">
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/70"><Icon className="h-5 w-5" aria-hidden /></span>
              <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-[0.11em] opacity-75">Estado de tu pedido</p>
                <h2 className="mt-0.5 font-bold">{state.title}</h2>
                <p className="mt-1 text-sm leading-5">{order.status === "cancelled" && order.rejection_reason ? order.rejection_reason : state.text}</p>
              </div>
            </div>
          </section>

          {paymentSettled && order.status !== "cancelled" ? (
            <CommerceFulfillmentTracker
              fulfillmentMethod={fulfillmentMethod}
              fulfillmentStatus={order.fulfillment_status}
              events={relevantDeliveryEvents}
            />
          ) : null}

          {delivery ? (
            <section className="rounded-2xl border border-border bg-surface p-4 shadow-sm">
              <div className="flex items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700">{fulfillmentMethod === "delivery" ? <Truck className="h-5 w-5" aria-hidden /> : <Store className="h-5 w-5" aria-hidden />}</span>
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.11em] text-muted-foreground">Cómo lo recibirás</p>
                  <h2 className="mt-0.5 text-base font-bold text-foreground">{fulfillmentMethod === "delivery" ? "Entrega a domicilio" : "Recolección en negocio"}</h2>
                  {fulfillmentMethod === "delivery" ? (
                    <p className="mt-2 text-sm leading-5 text-muted-foreground">{delivery.address_text}{delivery.reference ? ` · ${delivery.reference}` : ""}</p>
                  ) : (
                    <div className="mt-2 space-y-2 text-sm leading-5 text-muted-foreground">
                      <p><strong className="text-foreground">{pickupPoint?.name ?? "Punto de recolección"}</strong><br />{pickupPoint?.address_text}{pickupPoint?.reference ? ` · ${pickupPoint.reference}` : ""}</p>
                      {pickupDate ? <p className="rounded-xl bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-950">Pasas por tu pedido: {pickupDate}</p> : null}
                      {pickupHours ? (
                        <details className="rounded-xl border border-border-soft bg-background px-3">
                          <summary className="flex min-h-11 cursor-pointer list-none items-center text-xs font-semibold text-foreground">Ver horario del punto</summary>
                          <div className="border-t border-border-soft py-2 text-xs leading-5">{describeWeek(pickupHours).map((line) => <p key={line}>{line}</p>)}</div>
                        </details>
                      ) : null}
                      {pickupPoint?.instructions ? <p className="text-xs leading-5">Al llegar: {pickupPoint.instructions}</p> : null}
                    </div>
                  )}
                </div>
              </div>
            </section>
          ) : null}

          {["proof_required", "proof_submitted", "rejected"].includes(order.payment_verification_status) && !paymentSettled && transfer ? (
            <section className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
              <div className="flex gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/70 text-amber-800"><Landmark className="h-5 w-5" aria-hidden /></span>
                <div className="min-w-0"><h2 className="font-bold text-amber-950">Datos para transferir</h2><p className="mt-0.5 text-sm leading-5 text-amber-900">Transfiere exactamente el total de tu pedido.</p></div>
              </div>
              <dl className="mt-4 space-y-2 text-sm text-amber-950"><div className="flex justify-between gap-3"><dt>Banco</dt><dd className="font-semibold text-right">{transfer.bank_name}</dd></div><div className="flex justify-between gap-3"><dt>Titular</dt><dd className="font-semibold text-right">{transfer.account_holder}</dd></div><div className="flex justify-between gap-3"><dt>CLABE</dt><dd className="font-mono font-semibold text-right">{transfer.clabe ?? transfer.account_number}</dd></div></dl>
            </section>
          ) : null}

          {order.payment_verification_status === "proof_submitted" && !paymentSettled ? <section className="rounded-2xl border border-blue-200 bg-blue-50 p-4 text-blue-950"><p className="font-bold">Comprobante enviado</p><p className="mt-1 text-sm leading-5 text-blue-900">El negocio lo validará antes de preparar tu pedido. Te avisaremos aquí cuando cambie.</p></section> : null}
          {order.payment_verification_status === "rejected" && !paymentSettled ? <section className="rounded-2xl border border-red-200 bg-red-50 p-4 text-red-900"><p className="font-bold">Necesitamos otro comprobante</p><p className="mt-1 text-sm leading-5">{latestProof?.rejection_reason ?? "El comprobante no pudo validarse. Puedes enviar uno nuevo desde la acción inferior."}</p></section> : null}
          </div>

          <div className="min-w-0 space-y-4">
          <section className="rounded-2xl border border-border bg-surface shadow-sm">
            <div className="flex items-center justify-between gap-3 px-4 pb-3 pt-4"><div className="flex items-center gap-2"><ReceiptText className="h-4 w-4 text-blue-700" aria-hidden /><h2 className="font-bold text-foreground">Tu pedido</h2></div><span className="text-xs font-medium text-muted-foreground">{items.length} {items.length === 1 ? "artículo" : "artículos"}</span></div>
            <div className="divide-y divide-border border-y border-border">{visibleItems.map((item: any) => <OrderItem key={item.id} item={item} />)}</div>
            {hiddenItems.length > 0 ? <details className="group"><summary className="flex min-h-12 cursor-pointer list-none items-center justify-between px-4 text-sm font-semibold text-blue-700">Ver {hiddenItems.length} {hiddenItems.length === 1 ? "artículo más" : "artículos más"}<span className="transition-transform group-open:rotate-180" aria-hidden>⌄</span></summary><div className="divide-y divide-border border-t border-border">{hiddenItems.map((item: any) => <OrderItem key={item.id} item={item} />)}</div></details> : null}
            <div className="flex items-center justify-between px-4 py-4"><span className="text-sm font-semibold text-muted-foreground">Total</span><span className="text-lg font-bold tabular-nums text-foreground">${total.toFixed(2)}</span></div>
          </section>

          {relevantDeliveryEvents.length > 0 ? <section className="rounded-2xl border border-border bg-surface p-4 shadow-sm"><h2 className="text-sm font-bold text-foreground">Seguimiento</h2><div className="mt-3 space-y-3">{relevantDeliveryEvents.map((event) => <div key={event.id} className="border-l-2 border-blue-200 pl-3"><p className="text-sm font-semibold text-foreground">{event.type === "out_for_delivery" ? "Tu pedido va en camino" : "Pedido entregado"}</p><p className="mt-1 text-xs text-muted-foreground">{new Intl.DateTimeFormat("es-MX", { dateStyle: "medium", timeStyle: "short" }).format(new Date(event.created_at))}</p>{event.note ? <p className="mt-1 text-sm leading-5 text-muted-foreground">{event.note}</p> : null}</div>)}</div></section> : null}
          {signedEvidence?.data?.signedUrl ? (
            <figure className="overflow-hidden rounded-2xl border border-border bg-surface shadow-sm">
              <div className="flex items-start gap-3 px-4 py-4">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700"><Camera className="h-5 w-5" aria-hidden /></span>
                <div>
                  <h2 className="font-bold text-foreground">Entrega confirmada</h2>
                  <p className="mt-1 text-sm leading-5 text-muted-foreground">El negocio registró esta fotografía al cerrar la entrega.</p>
                </div>
              </div>
              <img src={signedEvidence.data.signedUrl} alt="Fotografía registrada como evidencia de entrega" className="aspect-[4/3] w-full object-cover" />
              {deliveredEvent?.note ? <figcaption className="border-t border-border px-4 py-3 text-sm leading-5 text-muted-foreground">{deliveredEvent.note}</figcaption> : null}
            </figure>
          ) : null}

          {hasFinishedFulfillment && items.length > 0 ? (
            <section id="calificar-pedido" className="scroll-mt-24 rounded-2xl border border-border bg-surface p-4 shadow-sm sm:p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.11em] text-blue-700">Después de recibirlo</p>
                  <h2 className="mt-1 text-base font-bold text-foreground">¿Cómo estuvo tu pedido?</h2>
                  <p className="mt-1 text-sm leading-5 text-muted-foreground">Califica sólo lo que quieras. Cada opinión queda ligada a esta compra real.</p>
                </div>
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-500"><Star className="h-5 w-5" aria-hidden /></span>
              </div>
              <div className="mt-4 space-y-2">
                {items.map((item: any) => {
                  const reviews = Array.isArray(item.reviews) ? item.reviews : [];
                  const existingReview = reviews.find((review: { status?: string }) => review.status === "published") ?? reviews[0] ?? null;
                  return (
                    <ReviewOrderItem
                      key={item.id}
                      token={token}
                      itemId={item.id}
                      productName={item.product?.name ?? "Artículo"}
                      imageUrl={item.product?.image_url ?? null}
                      initialReview={existingReview ? { rating: Number(existingReview.rating), comment: existingReview.comment } : null}
                    />
                  );
                })}
              </div>
            </section>
          ) : null}
          <p className="px-1 text-xs leading-5 text-muted-foreground">Esta liga es privada. Compártela sólo con las personas que recibirán este pedido.</p>
          </div>
        </div>
      </section>

      <TrackingOrderFooter
        total={total}
        status={liveFulfillmentLabel}
        token={token}
        paymentVerificationStatus={order.payment_verification_status}
        paymentSettled={paymentSettled}
        canReview={hasFinishedFulfillment}
        reviewTargetId={firstUnreviewedItem?.id ?? null}
      />
    </main>
  );
}

function OrderItem({ item }: { item: any }) {
  return <div className="p-4"><div className="flex items-center gap-3"><span className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-border-soft">{item.product?.image_url ? <img src={item.product.image_url} alt="" className="h-full w-full object-cover" /> : <PackageCheck className="h-4 w-4 text-muted-foreground" />}</span><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold text-foreground">{item.product?.name ?? "Artículo"}</p>{item.variant_snapshot?.selection_key ? <p className="truncate text-xs text-muted-foreground">{item.variant_snapshot.selection_key}</p> : null}<p className="mt-0.5 text-xs text-muted-foreground">{item.quantity} × ${Number(item.unit_price).toFixed(2)}</p></div><p className="text-sm font-bold tabular-nums text-foreground">${Number(item.subtotal).toFixed(2)}</p></div></div>;
}
