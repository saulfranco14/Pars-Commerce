import { createAdminClient } from "@/lib/supabase/admin";
import { notFound } from "next/navigation";
import Link from "next/link";
import { XCircle, Clock, ArrowLeft } from "lucide-react";
import { ClearCartOnConfirm } from "./ClearCartOnConfirm";
import { PaymentSuccessFullScreen } from "./PaymentSuccessFullScreen";

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ order_id?: string; status?: string }>;
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

export default async function ConfirmacionPage({
  params,
  searchParams,
}: PageProps) {
  const { slug } = await params;
  const { order_id, status } = await searchParams;
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
