import { createAdminClient } from "@/lib/supabase/admin";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, MessageCircle, Package } from "lucide-react";

interface PageProps {
  params: Promise<{ slug: string; productSlug: string }>;
}

function buildWhatsAppUrl(phone: string, productName: string, productUrl: string): string {
  const text = encodeURIComponent(`Hola, me interesa: ${productName}\n${productUrl}`);
  const cleanPhone = phone.replace(/\D/g, "");
  return `https://wa.me/${cleanPhone}?text=${text}`;
}

export default async function ProductoDetallePage({ params }: PageProps) {
  const { slug, productSlug } = await params;
  const supabase = createAdminClient();

  const { data: tenant, error: tenantError } = await supabase
    .from("tenants")
    .select("id, name, theme_color, whatsapp_phone")
    .eq("slug", slug)
    .single();

  if (tenantError || !tenant) {
    notFound();
  }

  const { data: product, error: productError } = await supabase
    .from("products")
    .select("id, name, slug, description, price, image_url")
    .eq("tenant_id", tenant.id)
    .eq("slug", productSlug)
    .eq("is_public", true)
    .is("deleted_at", null)
    .single();

  if (productError || !product) {
    notFound();
  }

  const { data: images } = await supabase
    .from("product_images")
    .select("url, position")
    .eq("product_id", product.id)
    .order("position", { ascending: true });

  const imageUrls =
    images && images.length > 0
      ? images.map((i) => i.url)
      : product.image_url
        ? [product.image_url]
        : [];

  const headersList = await headers();
  const host = headersList.get("host") ?? "";
  const protocol = headersList.get("x-forwarded-proto") === "https" ? "https" : "http";
  const baseUrl = host ? `${protocol}://${host}` : "";
  const productUrl = `${baseUrl}/sitio/${slug}/productos/${product.slug || product.id}`;
  const waHref = tenant.whatsapp_phone
    ? buildWhatsAppUrl(tenant.whatsapp_phone, product.name, productUrl)
    : null;

  const accentColor = tenant.theme_color?.trim() || "#6366f1";

  return (
    <div className="space-y-6">
      <Link
        href={`/sitio/${slug}/productos`}
        className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 transition-colors hover:text-gray-900"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver a productos
      </Link>

      <div className="overflow-hidden rounded-2xl bg-white shadow-md sm:flex">
        <div className="relative h-64 w-full shrink-0 sm:h-96 sm:w-80">
          {imageUrls.length > 0 ? (
            <img
              src={imageUrls[0]}
              alt={product.name}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gray-100">
              <Package className="h-24 w-24 text-gray-300" />
            </div>
          )}
          <div
            className="absolute right-4 top-4 rounded-lg px-4 py-2 text-lg font-bold text-white shadow-md"
            style={{ backgroundColor: accentColor }}
          >
            ${Number(product.price).toFixed(2)}
          </div>
        </div>

        <div className="flex flex-1 flex-col p-6 sm:p-8">
          <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">
            {product.name}
          </h1>
          {product.description && (
            <div className="mt-4 flex-1">
              <p className="whitespace-pre-wrap text-gray-600">
                {product.description}
              </p>
            </div>
          )}

          {waHref ? (
            <a
              href={waHref}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 flex cursor-pointer items-center justify-center gap-2 rounded-xl px-6 py-4 text-base font-semibold text-white transition-all hover:opacity-90 hover:shadow-lg disabled:opacity-50"
              style={{ backgroundColor: accentColor }}
            >
              <MessageCircle className="h-5 w-5" />
              Consultar por WhatsApp
            </a>
          ) : (
            <p className="mt-6 text-center text-sm text-gray-500">
              Configura WhatsApp en el dashboard para habilitar consultas.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
