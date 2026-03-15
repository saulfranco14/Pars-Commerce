import { createAdminClient } from "@/lib/supabase/admin";
import { notFound } from "next/navigation";
import Link from "next/link";
import { XCircle, Clock, ArrowLeft, Repeat, CalendarCheck } from "lucide-react";
import { ClearCartOnConfirm } from "./ClearCartOnConfirm";
import { PaymentSuccessFullScreen } from "./PaymentSuccessFullScreen";

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ order_id?: string; status?: string; subscription_id?: string }>;
}

function formatAddress(addr: {
  street?: string | null;
  city?: string | null;
  state?: string | null;
  postal_code?: string | null;
  country?: string | null;
}): string {
  const parts = [
    addr.street,
    addr.city,
    addr.state,
    addr.postal_code,
    addr.country,
  ].filter(Boolean);
  return parts.join(", ") || "Dirección no configurada";
}

function freqTypeLabel(type: string, freq: number): string {
  if (type === "weeks" && freq === 1) return "semana";
  if (type === "weeks" && freq === 2) return "quincena";
  if (type === "months" && freq === 1) return "mes";
  return `${freq} ${type === "weeks" ? "semanas" : "meses"}`;
}

export default async function ConfirmacionPage({
  params,
  searchParams,
}: PageProps) {
  const { slug } = await params;
  const { order_id, status, subscription_id } = await searchParams;
  const supabase = createAdminClient();

  const { data: tenant, error: tenantError } = await supabase
    .from("tenants")
    .select("id, name, theme_color")
    .eq("slug", slug)
    .single();

  if (tenantError || !tenant) {
    notFound();
  }

  const accentColor = tenant.theme_color?.trim() || "#6366f1";

  if (!order_id) {
    return (
      <div className="space-y-6">
        <div className="rounded-2xl bg-white py-16 text-center shadow-sm">
          <p className="text-gray-500">No se especificó orden.</p>
          <Link
            href={`/sitio/${slug}/inicio`}
            className="mt-4 inline-flex items-center gap-2 text-sm font-medium"
            style={{ color: accentColor }}
          >
            <ArrowLeft className="h-4 w-4" />
            Volver al inicio
          </Link>
        </div>
      </div>
    );
  }

  const { data: order, error: orderError } = await supabase
    .from("orders")
    .select("id, status, total, customer_name, created_at")
    .eq("id", order_id)
    .eq("tenant_id", tenant.id)
    .single();

  if (orderError || !order) {
    notFound();
  }

  const { data: address } = await supabase
    .from("tenant_addresses")
    .select("street, city, state, postal_code, country, phone")
    .eq("tenant_id", tenant.id)
    .single();

  const formattedAddress = formatAddress(address ?? {});
  const paymentStatus = status ?? "success";

  // ── Subscription confirmation ───────────────────────────────────
  if (subscription_id) {
    const { data: subscription } = await supabase
      .from("subscriptions")
      .select("id, type, frequency, frequency_type, charge_amount, total_installments, discount_percent, concept, customer_name")
      .eq("id", subscription_id)
      .single();

    const sub = subscription;
    const isInstallments = sub?.type === "installments";
    const periodLabel = sub ? freqTypeLabel(sub.frequency_type, sub.frequency) : "mes";

    return (
      <>
        <ClearCartOnConfirm />
        <div className="space-y-6">
          <div className="rounded-2xl bg-white p-8 shadow-sm">
            <div className="flex items-center justify-center">
              <div
                className="flex h-16 w-16 items-center justify-center rounded-full"
                style={{ backgroundColor: `${accentColor}20` }}
              >
                {isInstallments ? (
                  <CalendarCheck className="h-9 w-9" style={{ color: accentColor }} />
                ) : (
                  <Repeat className="h-9 w-9" style={{ color: accentColor }} />
                )}
              </div>
            </div>

            <h1 className="mt-6 text-center text-2xl font-bold text-gray-900">
              {isInstallments ? "¡Plan de pagos activado!" : "¡Compra recurrente activada!"}
            </h1>
            <p className="mt-2 text-center font-mono text-sm font-semibold text-gray-500">
              Orden: {order.id.slice(0, 8).toUpperCase()}
            </p>

            {sub && (
              <div className="mx-auto mt-6 max-w-xs space-y-3">
                <div
                  className="rounded-xl border-2 p-4"
                  style={{ borderColor: accentColor, backgroundColor: `${accentColor}08` }}
                >
                  <p className="text-center text-xs font-medium text-gray-500">
                    {sub.concept}
                  </p>
                  <p className="mt-2 text-center text-2xl font-bold tabular-nums" style={{ color: accentColor }}>
                    ${sub.charge_amount.toFixed(2)}
                    <span className="text-sm font-medium text-gray-500"> / {periodLabel}</span>
                  </p>
                  {isInstallments && sub.total_installments && (
                    <p className="mt-1 text-center text-sm text-gray-600">
                      {sub.total_installments} cobros en total
                    </p>
                  )}
                  {!isInstallments && (
                    <p className="mt-1 text-center text-sm text-gray-500">
                      Hasta que tú canceles
                    </p>
                  )}
                  {sub.discount_percent > 0 && (
                    <p className="mt-2 text-center text-xs font-medium text-green-700">
                      Ahorro por suscripción: {sub.discount_percent}%
                    </p>
                  )}
                </div>

                <div className="rounded-xl border border-gray-100 bg-gray-50 p-3">
                  <p className="text-center text-xs text-gray-500">
                    Recibirás un aviso antes de cada cobro. Puedes cancelar en cualquier momento sin penalización.
                  </p>
                </div>
              </div>
            )}

            {formattedAddress !== "Dirección no configurada" && (
              <div className="mx-auto mt-6 max-w-xs rounded-xl border border-gray-100 bg-gray-50 p-3">
                <p className="text-center text-xs font-medium text-gray-600">
                  {isInstallments ? "Recoge en:" : "Dirección de entrega:"}
                </p>
                <p className="mt-1 text-center text-xs text-gray-500">{formattedAddress}</p>
                {address?.phone && (
                  <p className="mt-1 text-center text-xs text-gray-500">Tel: {address.phone}</p>
                )}
              </div>
            )}

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center sm:gap-4">
              <Link
                href={`/sitio/${slug}/productos`}
                className="inline-flex min-h-[48px] cursor-pointer items-center justify-center gap-2 rounded-xl px-6 py-4 font-semibold text-white transition-opacity hover:opacity-90"
                style={{ backgroundColor: accentColor }}
              >
                Seguir comprando
              </Link>
              <Link
                href={`/sitio/${slug}/inicio`}
                className="inline-flex min-h-[48px] cursor-pointer items-center justify-center gap-2 rounded-xl border-2 px-6 py-4 font-semibold transition-opacity hover:opacity-90"
                style={{ borderColor: accentColor, color: accentColor }}
              >
                <ArrowLeft className="h-4 w-4" />
                Volver al inicio
              </Link>
            </div>
          </div>
        </div>
      </>
    );
  }

  // ── Success: full-screen celebration overlay ───────────────────
  if (paymentStatus === "success") {
    return (
      <>
        <ClearCartOnConfirm />
        <PaymentSuccessFullScreen
          slug={slug}
          accentColor={accentColor}
          orderId={order.id}
          customerName={order.customer_name}
          formattedAddress={formattedAddress}
          phone={address?.phone}
        />
      </>
    );
  }

  // ── Pending: payment is being processed ───────────────────────
  if (paymentStatus === "pending") {
    return (
      <div className="space-y-6">
        <ClearCartOnConfirm />
        <div className="rounded-2xl bg-white p-8 shadow-sm">
          <div className="flex items-center justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-amber-100">
              <Clock className="h-9 w-9 text-amber-500" />
            </div>
          </div>
          <h1 className="mt-6 text-center text-2xl font-bold text-gray-900">
            Pago en proceso
          </h1>
          <p className="mt-2 text-center font-mono font-semibold text-gray-500">
            Orden: {order.id.slice(0, 8).toUpperCase()}
          </p>
          <p className="mt-4 text-center text-gray-600">
            Hola {order.customer_name}, tu pago está siendo procesado. Te
            contactaremos cuando sea confirmado.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center sm:gap-4">
            <Link
              href={`/sitio/${slug}/productos`}
              className="inline-flex min-h-[48px] cursor-pointer items-center justify-center gap-2 rounded-xl px-6 py-4 font-semibold text-white transition-opacity hover:opacity-90"
              style={{ backgroundColor: accentColor }}
            >
              Seguir comprando
            </Link>
            <Link
              href={`/sitio/${slug}/inicio`}
              className="inline-flex min-h-[48px] cursor-pointer items-center justify-center gap-2 rounded-xl border-2 px-6 py-4 font-semibold transition-opacity hover:opacity-90"
              style={{ borderColor: accentColor, color: accentColor }}
            >
              <ArrowLeft className="h-4 w-4" />
              Volver al inicio
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ── Failure: payment did not go through ───────────────────────
  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-white p-8 shadow-sm">
        <div className="flex items-center justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
            <XCircle className="h-9 w-9 text-red-500" />
          </div>
        </div>
        <h1 className="mt-6 text-center text-2xl font-bold text-gray-900">
          El pago no pudo procesarse
        </h1>
        <p className="mt-4 text-center text-gray-600">
          Lo sentimos {order.customer_name}, hubo un problema con tu pago.
          Puedes intentarlo de nuevo.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center sm:gap-4">
          <Link
            href={`/sitio/${slug}/carrito`}
            className="inline-flex min-h-[48px] cursor-pointer items-center justify-center gap-2 rounded-xl px-6 py-4 font-semibold text-white transition-opacity hover:opacity-90"
            style={{ backgroundColor: accentColor }}
          >
            Intentar nuevamente
          </Link>
          <Link
            href={`/sitio/${slug}/inicio`}
            className="inline-flex min-h-[48px] cursor-pointer items-center justify-center gap-2 rounded-xl border-2 px-6 py-4 font-semibold transition-opacity hover:opacity-90"
            style={{ borderColor: accentColor, color: accentColor }}
          >
            <ArrowLeft className="h-4 w-4" />
            Volver al inicio
          </Link>
        </div>
      </div>
    </div>
  );
}
