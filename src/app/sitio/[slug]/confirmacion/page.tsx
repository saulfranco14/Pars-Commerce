import { createAdminClient } from "@/lib/supabase/admin";
import { notFound } from "next/navigation";
import Link from "next/link";
import { CheckCircle, ArrowLeft, MapPin, Phone } from "lucide-react";
import { ClearCartOnConfirm } from "./ClearCartOnConfirm";

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ order_id?: string }>;
}

function formatAddress(addr: {
  street?: string | null;
  city?: string | null;
  state?: string | null;
  postal_code?: string | null;
  country?: string | null;
}): string {
  const parts = [addr.street, addr.city, addr.state, addr.postal_code, addr.country].filter(Boolean);
  return parts.join(", ") || "Dirección no configurada";
}

export default async function ConfirmacionPage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const { order_id } = await searchParams;
  const supabase = createAdminClient();

  const { data: tenant, error: tenantError } = await supabase
    .from("tenants")
    .select("id, name, theme_color")
    .eq("slug", slug)
    .single();

  if (tenantError || !tenant) {
    notFound();
  }

  if (!order_id) {
    return (
      <div className="space-y-6">
        <div className="rounded-2xl bg-white py-16 text-center shadow-sm">
          <p className="text-gray-500">No se especificó orden.</p>
          <Link
            href={`/sitio/${slug}/inicio`}
            className="mt-4 inline-flex items-center gap-2 text-sm font-medium"
            style={{ color: tenant.theme_color?.trim() || "#6366f1" }}
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

  const accentColor = tenant.theme_color?.trim() || "#6366f1";

  return (
    <div className="space-y-6">
      <ClearCartOnConfirm />
      <div className="rounded-2xl bg-white p-8 shadow-sm">
        <div className="flex items-center justify-center">
          <div
            className="flex h-16 w-16 items-center justify-center rounded-full"
            style={{ backgroundColor: `${accentColor}20` }}
          >
            <CheckCircle className="h-10 w-10" style={{ color: accentColor }} />
          </div>
        </div>
        <h1 className="mt-6 text-center text-2xl font-bold text-gray-900">
          Tu ticket ha sido creado
        </h1>
        <p className="mt-2 text-center text-gray-600">
          Número de orden: <span className="font-mono font-semibold">{order.id.slice(0, 8).toUpperCase()}</span>
        </p>
        <p className="mt-4 text-center text-gray-600">
          Hola {order.customer_name}, puedes pasar a recoger tu pedido en:
        </p>

        <div className="mt-6 rounded-xl border border-gray-200 bg-gray-50 p-6">
          <div className="flex items-start gap-3">
            <MapPin className="mt-0.5 h-5 w-5 shrink-0" style={{ color: accentColor }} />
            <div>
              <h3 className="font-semibold text-gray-900">Dirección de recolección</h3>
              <p className="mt-1 text-gray-600">{formatAddress(address ?? {})}</p>
            </div>
          </div>
          {address?.phone && (
            <div className="mt-4 flex items-center gap-3">
              <Phone className="h-5 w-5 shrink-0" style={{ color: accentColor }} />
              <a
                href={`tel:${address.phone}`}
                className="text-gray-600 hover:underline"
              >
                {address.phone}
              </a>
            </div>
          )}
        </div>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center sm:gap-4">
          <Link
            href={`/sitio/${slug}/productos`}
            className="inline-flex min-h-[48px] cursor-pointer items-center justify-center gap-2 rounded-xl px-6 py-4 font-semibold text-white transition-opacity hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2"
            style={{ backgroundColor: accentColor }}
          >
            Seguir comprando
          </Link>
          <Link
            href={`/sitio/${slug}/inicio`}
            className="inline-flex min-h-[48px] cursor-pointer items-center justify-center gap-2 rounded-xl border-2 px-6 py-4 font-semibold transition-opacity hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2"
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
