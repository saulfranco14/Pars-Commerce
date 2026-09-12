import { NextResponse } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";
import { requireDevice } from "@/lib/auth/requireDevice";
import { readPickupScheduling } from "@/features/checkout/helpers/pickupSchedule";
import { readBusinessHours } from "@/features/configuracion/helpers/businessHours";
import { DEFAULT_IDLE_RESET_SECONDS } from "@/features/dispositivos/constants/kiosk";

/**
 * Todo lo que la pantalla necesita, en una sola llamada. Se autentica con el
 * token del dispositivo: no hay sesión de empleado.
 */
export async function GET() {
  const device = await requireDevice();
  if (!device) {
    return NextResponse.json(
      { error: "Esta pantalla no está autorizada" },
      { status: 401 },
    );
  }

  const admin = createAdminClient();
  const { data: tenant } = await admin
    .from("tenants")
    .select("id, name, logo_url, settings, accepting_orders")
    .eq("id", device.tenantId)
    .single();

  if (!tenant) {
    return NextResponse.json({ error: "Negocio no encontrado" }, { status: 404 });
  }

  // `is_public`, el mismo criterio que la tienda: una pantalla es cara al
  // cliente, no un mostrador donde el personal vende cosas internas.
  const { data: rawProducts } = await admin
    .from("products")
    .select(
      "id, name, description, price, image_url, subcatalog_id, product_subcatalogs(id, name)",
    )
    .eq("tenant_id", device.tenantId)
    .eq("is_public", true)
    .is("deleted_at", null)
    .order("name");

  // La galería vive en `product_images`, no en una columna — igual que en
  // /api/qr/resolve.
  const productIds = (rawProducts ?? []).map((p) => p.id);
  const { data: productImages } = productIds.length
    ? await admin
        .from("product_images")
        .select("product_id, url")
        .in("product_id", productIds)
        .order("position", { ascending: true })
    : { data: [] };

  const galleryByProduct = (productImages ?? []).reduce((map, row) => {
    const list = map.get(row.product_id) ?? [];
    list.push(row.url);
    map.set(row.product_id, list);
    return map;
  }, new Map<string, string[]>());

  const products = (rawProducts ?? []).map((p) => {
    const gallery = galleryByProduct.get(p.id);
    return {
      id: p.id,
      name: p.name,
      description: p.description,
      price: p.price,
      image_url: p.image_url,
      subcatalog_id: p.subcatalog_id,
      image_urls: gallery?.length ? gallery : p.image_url ? [p.image_url] : [],
    };
  });

  // Cada categoría se queda con la primera foto de sus productos: la rejilla de
  // categorías de la pantalla necesita una imagen y el catálogo no la guarda.
  const categories: { id: string; name: string; imageUrl: string | null }[] = [];
  const seen = new Map<string, number>();
  for (const p of rawProducts ?? []) {
    const sub = p.product_subcatalogs as { id: string; name: string } | null;
    if (!sub?.id) continue;
    const at = seen.get(sub.id);
    if (at === undefined) {
      seen.set(sub.id, categories.length);
      categories.push({ id: sub.id, name: sub.name, imageUrl: p.image_url });
    } else if (!categories[at].imageUrl) {
      categories[at].imageUrl = p.image_url;
    }
  }

  const settings = (tenant.settings as Record<string, unknown> | null) ?? {};

  return NextResponse.json({
    tenantName: tenant.name,
    tenantLogoUrl: tenant.logo_url,
    deviceName: device.name,
    acceptingOrders: tenant.accepting_orders !== false,
    products,
    categories,
    pickupScheduling: readPickupScheduling(settings),
    businessHours: readBusinessHours(settings),
    idleResetSeconds:
      Number(settings.kiosk_idle_seconds) || DEFAULT_IDLE_RESET_SECONDS,
  });
}
