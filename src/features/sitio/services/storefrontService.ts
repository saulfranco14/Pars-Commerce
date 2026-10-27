/* eslint-disable @typescript-eslint/no-explicit-any -- site_slug, has_variants and the commerce columns are not in the generated Supabase types yet. */
import { cache } from "react";
import { headers } from "next/headers";

import { createAdminClient } from "@/lib/supabase/admin";
import { enrichProducts, type ProductBase } from "@/lib/enrichProducts";
import { readBusinessHours } from "@/features/configuracion/helpers/businessHours";
import { listPublicPlans } from "@/features/planes/services/planQueryService";
import { COLLAGE_MAX_IMAGES, collageImages } from "@/features/promociones/helpers/promotionVisual";
import { searchPatterns } from "@/features/sitio/helpers/searchPatterns";

import {
  isPromotionActive,
  toPromotionsForPrice,
} from "@/features/sitio/helpers/promotions";

import type {
  ActivePromotion,
  CatalogItem,
  CatalogQuery,
  StoreCatalogCounts,
  StoreCategory,
  StoreTenant,
} from "@/features/sitio/interfaces/storefront";
import type { PublicCheckoutOptions } from "@/features/checkout/components/cart/CheckoutFulfillmentStep";
import type { SitePageContent } from "@/types/tenantSitePages";

type LooseDb = { from: (table: string) => any };

const PRODUCT_COLUMNS =
  "id, name, slug, description, price, image_url, subcatalog_id, type, has_variants, created_at";

function db(): LooseDb {
  return createAdminClient() as unknown as LooseDb;
}

function sanitizeSearch(raw: string): string {
  return raw.trim().replace(/[,()%*\\:"']/g, " ").replace(/\s+/g, " ").slice(0, 80);
}

export const getStoreTenant = cache(async (slug: string): Promise<StoreTenant | null> => {
  const { data } = await db()
    .from("tenants")
    .select(
      "id, name, description, logo_url, theme_color, site_slug, whatsapp_phone, whatsapp_orders_enabled, social_links, site_template_id, accepting_orders, settings",
    )
    .eq("site_slug", slug)
    .eq("public_store_enabled", true)
    .maybeSingle();
  return (data as StoreTenant | null) ?? null;
});

export const getStoreLayoutVariant = cache(async (templateId: string | null): Promise<string | null> => {
  if (!templateId) return null;
  const { data } = await db()
    .from("site_templates")
    .select("layout_variant")
    .eq("id", templateId)
    .maybeSingle();
  return (data?.layout_variant as string | undefined) ?? null;
});

export const getStoreNavPages = cache(async (tenantId: string) => {
  const { data } = await db()
    .from("tenant_site_pages")
    .select("id, slug, title, position")
    .eq("tenant_id", tenantId)
    .eq("is_enabled", true)
    .order("position", { ascending: true });
  return (data ?? []) as Array<{ id: string; slug: string; title: string; position: number }>;
});

export const getStorePageContent = cache(async (tenantId: string, pageSlug: string): Promise<SitePageContent> => {
  const { data } = await db()
    .from("tenant_site_pages")
    .select("content")
    .eq("tenant_id", tenantId)
    .eq("slug", pageSlug)
    .eq("is_enabled", true)
    .maybeSingle();
  return (data?.content as SitePageContent | null) ?? {};
});

/** One pass over the public catalog gives the header counts and the category tiles. */
export const getCatalogIndex = cache(async (tenantId: string): Promise<{
  counts: StoreCatalogCounts;
  categories: StoreCategory[];
}> => {
  const client = db();
  const [itemsRes, subcatalogsRes] = await Promise.all([
    client
      .from("products")
      .select("type, subcatalog_id, image_url, price")
      .eq("tenant_id", tenantId)
      .eq("is_public", true)
      .is("deleted_at", null),
    client
      .from("product_subcatalogs")
      .select("id, name")
      .eq("tenant_id", tenantId)
      .order("name", { ascending: true }),
  ]);
  const items = (itemsRes.data ?? []) as Array<{
    type: string;
    subcatalog_id: string | null;
    image_url: string | null;
    price: number;
  }>;
  const counts = {
    products: items.filter((item) => item.type === "product").length,
    services: items.filter((item) => item.type === "service").length,
  };
  const categories = ((subcatalogsRes.data ?? []) as Array<{ id: string; name: string }>)
    .map((subcatalog) => {
      const members = items.filter((item) => item.subcatalog_id === subcatalog.id);
      if (members.length === 0) return null;
      return {
        id: subcatalog.id,
        name: subcatalog.name,
        image: members.find((item) => item.image_url)?.image_url ?? null,
        count: members.length,
        minPrice: Math.min(...members.map((item) => Number(item.price))),
      };
    })
    .filter((category): category is StoreCategory => category !== null);
  return { counts, categories };
});

export const getActivePlans = cache(async (tenantId: string) => listPublicPlans(createAdminClient(), tenantId));

export const getActivePlan = cache(async (tenantId: string, planSlug: string) => {
  const [plan] = await listPublicPlans(createAdminClient(), tenantId, planSlug);
  return plan ?? null;
});

export const getActivePromotions = cache(async (tenantId: string): Promise<ActivePromotion[]> => {
  const { data } = await db()
    .from("promotions")
    .select(
      "id, name, slug, type, value, quantity, min_amount, product_ids, bundle_product_ids, subcatalog_ids, applies_to, buy_quantity, pay_quantity, status, badge_label, valid_from, valid_until, image_url, sales_channels",
    )
    .eq("tenant_id", tenantId)
    .eq("status", "active")
    .contains("sales_channels", ["public_store"])
    .order("created_at", { ascending: false });
  const now = new Date();
  const live = ((data ?? []) as ActivePromotion[])
    .filter((promotion) => isPromotionActive(promotion, now))
    .map((promotion) => ({ ...promotion, value: Number(promotion.value) }));
  return attachPreviewImages(tenantId, live);
});

type PhotoRow = { id: string; image_url: string | null; subcatalog_id: string | null };

/** Photos for promotions without their own image: their products, else their categories', else the store's. */
async function attachPreviewImages(tenantId: string, promotions: ActivePromotion[]): Promise<ActivePromotion[]> {
  const needing = promotions.filter((promotion) => !promotion.image_url);
  if (needing.length === 0) return promotions;
  const { data } = await db()
    .from("products")
    .select("id, image_url, subcatalog_id")
    .eq("tenant_id", tenantId)
    .eq("is_public", true)
    .is("deleted_at", null)
    .not("image_url", "is", null)
    .order("sort_order", { ascending: true })
    .limit(200);
  const photos = (data ?? []) as PhotoRow[];
  const imageById = new Map(photos.map((row) => [row.id, row.image_url]));
  return promotions.map((promotion) => {
    if (promotion.image_url) return promotion;
    const own = [...(promotion.bundle_product_ids ?? []), ...(promotion.product_ids ?? [])];
    let images = collageImages(own, (id) => imageById.get(id));
    if (images.length === 0 && promotion.subcatalog_ids?.length) {
      const inCategories = photos.filter((row) => row.subcatalog_id && promotion.subcatalog_ids?.includes(row.subcatalog_id));
      images = collageImages(inCategories.map((row) => row.id), (id) => imageById.get(id));
    }
    if (images.length === 0 && promotion.applies_to === "all") {
      images = collageImages(photos.slice(0, COLLAGE_MAX_IMAGES * 2).map((row) => row.id), (id) => imageById.get(id));
    }
    return { ...promotion, preview_images: images };
  });
}

async function enrichCatalogRows(tenantId: string, rows: ProductBase[]): Promise<CatalogItem[]> {
  if (rows.length === 0) return [];
  const [imagesRes, promotions] = await Promise.all([
    db()
      .from("product_images")
      .select("product_id, url, position")
      .in("product_id", rows.map((row) => row.id)),
    getActivePromotions(tenantId),
  ]);
  return enrichProducts(
    rows.map((row) => ({ ...row, price: Number(row.price), type: row.type ?? "product" })),
    (imagesRes.data ?? []) as Array<{ product_id: string; url: string; position: number }>,
    toPromotionsForPrice(promotions),
  );
}

export async function listCatalogItems(query: CatalogQuery): Promise<CatalogItem[]> {
  let request = db()
    .from("products")
    .select(PRODUCT_COLUMNS)
    .eq("tenant_id", query.tenantId)
    .eq("is_public", true)
    .is("deleted_at", null);

  if (query.type) request = request.eq("type", query.type);
  if (query.subcatalogId) request = request.eq("subcatalog_id", query.subcatalogId);
  const search = query.search ? sanitizeSearch(query.search) : "";
  if (search) {
    const patterns = searchPatterns(search);
    // "cerveza" should find the Tecate and Indio in "Cervezas", whose names never say it.
    const { data: categories } = await db()
      .from("product_subcatalogs")
      .select("id")
      .eq("tenant_id", query.tenantId)
      .or(patterns.map((pattern) => `name.ilike.${pattern}`).join(","));
    const categoryIds = ((categories ?? []) as Array<{ id: string }>).map((category) => category.id);
    const clauses = patterns.flatMap((pattern) => [`name.ilike.${pattern}`, `description.ilike.${pattern}`]);
    if (categoryIds.length > 0) clauses.push(`subcatalog_id.in.(${categoryIds.join(",")})`);
    request = request.or(clauses.join(","));
  }

  switch (query.sort) {
    case "newest":
      request = request.order("created_at", { ascending: false });
      break;
    case "price_asc":
      request = request.order("price", { ascending: true });
      break;
    case "price_desc":
      request = request.order("price", { ascending: false });
      break;
    default:
      request = request.order("name", { ascending: true });
  }
  if (query.limit) request = request.limit(query.limit);

  const { data } = await request;
  const items = await enrichCatalogRows(query.tenantId, (data ?? []) as ProductBase[]);
  if (query.sort !== "price_asc" && query.sort !== "price_desc") return items;
  // Shoppers compare what they will pay, so a promotion moves the item.
  const direction = query.sort === "price_asc" ? 1 : -1;
  const shelfPrice = (item: CatalogItem) => item.promotion?.finalPrice ?? Number(item.price);
  return [...items].sort((left, right) => (shelfPrice(left) - shelfPrice(right)) * direction);
}

export async function listCatalogItemsByIds(tenantId: string, ids: string[]): Promise<CatalogItem[]> {
  if (ids.length === 0) return [];
  const { data } = await db()
    .from("products")
    .select(PRODUCT_COLUMNS)
    .eq("tenant_id", tenantId)
    .in("id", ids)
    .eq("is_public", true)
    .is("deleted_at", null)
    .order("name", { ascending: true });
  return enrichCatalogRows(tenantId, (data ?? []) as ProductBase[]);
}

/** What this business actually offers at checkout; drives the cart and the home highlights. */
export const getCheckoutOptions = cache(async (tenant: Pick<StoreTenant, "id" | "settings">): Promise<PublicCheckoutOptions> => {
  const client = db();
  const businessHours = readBusinessHours(tenant.settings ?? {});
  const [{ data: fulfillment }, { data: pickupPoints }, { data: paymentMethods }, { data: onlineConnection }] =
    await Promise.all([
      client
        .from("tenant_fulfillment_settings")
        .select("delivery_enabled, delivery_fee, delivery_area_label, pickup_enabled, online_payment_enabled")
        .eq("tenant_id", tenant.id)
        .maybeSingle(),
      client
        .from("tenant_pickup_points")
        .select("id, name, address_text, reference, instructions, latitude, longitude, mapbox_feature_id, business_hours")
        .eq("tenant_id", tenant.id)
        .eq("is_active", true)
        .order("is_primary", { ascending: false }),
      client.from("tenant_payment_methods").select("kind, is_active").eq("tenant_id", tenant.id).eq("is_active", true),
      client
        .from("payment_provider_connections")
        .select("status")
        .eq("tenant_id", tenant.id)
        .eq("provider", "mercadopago")
        .maybeSingle(),
    ]);
  const methods = (paymentMethods ?? []) as Array<{ kind: string }>;
  return {
    deliveryEnabled: Boolean(fulfillment?.delivery_enabled),
    deliveryFee: Number(fulfillment?.delivery_fee ?? 0),
    deliveryAreaLabel: fulfillment?.delivery_area_label ?? null,
    pickupEnabled: fulfillment ? Boolean(fulfillment.pickup_enabled) : true,
    // A point without its own schedule follows the official business hours.
    pickupPoints: ((pickupPoints ?? []) as Array<Record<string, unknown>>).map((point) => ({
      ...point,
      business_hours: point.business_hours ?? businessHours,
    })) as PublicCheckoutOptions["pickupPoints"],
    onlinePaymentEnabled: Boolean(fulfillment?.online_payment_enabled) && onlineConnection?.status === "connected",
    transferEnabled: methods.some((method) => method.kind === "bank_transfer"),
    cashEnabled: methods.some((method) => method.kind === "cash"),
  };
});

export async function getRequestBaseUrl(): Promise<string> {
  const headersList = await headers();
  const host = headersList.get("host") ?? "";
  const protocol = headersList.get("x-forwarded-proto") === "https" ? "https" : "http";
  return host ? `${protocol}://${host}` : "";
}
