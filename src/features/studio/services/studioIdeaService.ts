import "server-only";
import { formatCurrency } from "@/features/qr/helpers/format";
import { requireStudioSourcePermission } from "./studioDesignService";
import type { StudioDb } from "./studioDb";
import type { StudioIdea } from "../interfaces/studio";

const SALES_WINDOW_DAYS = 90;

async function allowed(
  userId: string,
  tenantId: string,
  type: "product" | "promotion",
) {
  try {
    await requireStudioSourcePermission(userId, tenantId, type);
    return true;
  } catch {
    return false;
  }
}

async function topProductIdea(
  db: StudioDb,
  tenantId: string,
): Promise<StudioIdea | null> {
  const since = new Date(
    Date.now() - SALES_WINDOW_DAYS * 86_400_000,
  ).toISOString();
  const { data: sold } = await db
    .from("order_items")
    .select("product_id,quantity,orders!inner(tenant_id,status,paid_at)")
    .eq("orders.tenant_id", tenantId)
    .eq("orders.status", "paid")
    .gte("orders.paid_at", since)
    .limit(2000);
  const units = new Map<string, number>();
  for (const row of sold ?? [])
    units.set(row.product_id, (units.get(row.product_id) ?? 0) + row.quantity);
  const ranked = [...units.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([id]) => id);
  if (ranked.length) {
    const { data } = await db
      .from("products")
      .select("id,name,price,image_url")
      .eq("tenant_id", tenantId)
      .is("deleted_at", null)
      .in("id", ranked);
    const best = ranked
      .map((id) => data?.find((p) => p.id === id))
      .find(Boolean);
    if (best)
      return {
        key: "top_product",
        sourceType: "product",
        sourceId: best.id,
        title: best.name,
        detail: `Lo que más vendes · ${formatCurrency(Number(best.price))}`,
        imageUrl: best.image_url,
      };
  }
  const { data: fallback } = await db
    .from("products")
    .select("id,name,price,image_url")
    .eq("tenant_id", tenantId)
    .is("deleted_at", null)
    .not("image_url", "is", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return fallback
    ? {
        key: "top_product",
        sourceType: "product",
        sourceId: fallback.id,
        title: fallback.name,
        detail: `De tu catálogo · ${formatCurrency(Number(fallback.price))}`,
        imageUrl: fallback.image_url,
      }
    : null;
}

async function promotionIdea(
  db: StudioDb,
  tenantId: string,
): Promise<StudioIdea | null> {
  const now = new Date().toISOString();
  const { data } = await db
    .from("promotions")
    .select("id,name,valid_until,image_url")
    .eq("tenant_id", tenantId)
    .eq("status", "active")
    .or(`valid_until.is.null,valid_until.gte.${now}`)
    .order("valid_until", { ascending: true, nullsFirst: false })
    .limit(1)
    .maybeSingle();
  if (!data) return null;
  return {
    key: "active_promotion",
    sourceType: "promotion",
    sourceId: data.id,
    title: data.name,
    detail: data.valid_until
      ? `Vigente hasta el ${new Intl.DateTimeFormat("es-MX", { day: "numeric", month: "short", timeZone: "America/Mexico_City" }).format(new Date(data.valid_until))}`
      : "Promoción activa",
    imageUrl: data.image_url,
  };
}

/** Best seller in the sales window (or newest product with a photo), the nearest-ending promotion and a free notice. */
export async function listStudioIdeas(
  db: StudioDb,
  userId: string,
  tenantId: string,
): Promise<StudioIdea[]> {
  const [canProducts, canPromotions] = await Promise.all([
    allowed(userId, tenantId, "product"),
    allowed(userId, tenantId, "promotion"),
  ]);
  const [product, promotion] = await Promise.all([
    canProducts ? topProductIdea(db, tenantId) : null,
    canPromotions ? promotionIdea(db, tenantId) : null,
  ]);
  const notice: StudioIdea = {
    key: "notice",
    sourceType: "custom",
    sourceId: null,
    title: "Aviso para tus clientes",
    detail: "Horario, novedades o temporada",
    imageUrl: null,
  };
  return [product, promotion, notice].filter(
    (idea): idea is StudioIdea => idea !== null,
  );
}
