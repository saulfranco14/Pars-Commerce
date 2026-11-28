import "server-only";
import { getPublicAppUrl } from "@/lib/env/appUrl";
import { formatOfferLabel } from "@/lib/offers/formatOfferLabel";
import { studioPriceLabel, studioProductPrice } from "../helpers/scene";
import { studioOwnPhotos } from "../helpers/photos";
import { StudioError, requireStudioData } from "./studioErrors";
import type { StudioDb } from "./studioDb";
import type { StudioSource, StudioSourceType } from "../interfaces/studio";

export async function getStudioSource(
  db: StudioDb,
  tenantId: string,
  type: StudioSourceType,
  id: string | null,
  customName = "Mi campaña",
): Promise<StudioSource> {
  const tenant = requireStudioData(
    await db
      .from("tenants")
      .select("id,name,site_slug,public_store_enabled,logo_url")
      .eq("id", tenantId)
      .single(),
  );
  const hash = requireStudioData(
    await db.rpc("studio_source_fingerprint", {
      p_tenant_id: tenantId,
      p_type: type,
      p_source_id: id,
    }),
  );
  if (typeof hash !== "string") throw new StudioError("NOT_FOUND");
  const base: StudioSource = {
    type,
    id,
    name: customName,
    description: "",
    conditions: "",
    price: null,
    priceLabel: "",
    badge: "",
    period: "",
    imageUrls: [],
    destinationUrl:
      tenant.site_slug && tenant.public_store_enabled
        ? `${getPublicAppUrl()}/sitio/${tenant.site_slug}`
        : "",
    status: "active",
    validFrom: null,
    validUntil: null,
    channels: ["public_store", "onsite"],
    isPublic: Boolean(tenant.public_store_enabled),
    commercialHash: hash,
    items: [],
  };
  base.logoUrl = tenant.logo_url;
  base.businessName = tenant.name;
  if (type === "custom") return base;
  if (!id) throw new StudioError("NOT_FOUND");
  if (type === "product") {
    const p = requireStudioData(
      await db
        .from("products")
        .select(
          "id,name,slug,type,description,price,image_url,is_public,deleted_at",
        )
        .eq("tenant_id", tenantId)
        .eq("id", id)
        .is("deleted_at", null)
        .single(),
    );
    const { data: images } = await db
      .from("product_images")
      .select("url")
      .eq("product_id", id)
      .order("position");
    const { data: variants } = await db
      .from("product_variants")
      .select("price")
      .eq("product_id", id)
      .eq("is_active", true)
      .is("archived_at", null);
    const { price, priceLabel } = studioProductPrice(
      Number(p.price),
      (variants ?? []).map((v) => v.price),
    );
    return {
      ...base,
      kind: p.type === "service" ? "service" : "product",
      name: p.name,
      description: p.description ?? "",
      price,
      priceLabel,
      imageUrls: studioOwnPhotos(
        (images ?? []).map((i) => i.url),
        [p.image_url],
      ),
      destinationUrl: base.destinationUrl
        ? `${base.destinationUrl}/productos/${p.slug}`
        : "",
      isPublic: Boolean(p.is_public),
    };
  }
  if (type === "subscription_plan") {
    const p = requireStudioData(
      await db
        .from("offer_plans")
        .select("*")
        .eq("tenant_id", tenantId)
        .eq("id", id)
        .single(),
    );
    const { data: items } = await db
      .from("offer_plan_items")
      .select("product_id,quantity")
      .eq("tenant_id", tenantId)
      .eq("plan_id", id);
    const ids = (items ?? []).map((i) => i.product_id);
    const { data: products } = ids.length
      ? await db
          .from("products")
          .select("id,name,price,image_url")
          .eq("tenant_id", tenantId)
          .in("id", ids)
      : { data: [] };
    return {
      ...base,
      name: p.name,
      description: p.description ?? "",
      price: Number(p.price),
      priceLabel: studioPriceLabel(Number(p.price)),
      period: `Cada ${p.interval_count} ${p.interval_unit === "week" ? "semana(s)" : "mes(es)"}`,
      status: p.status,
      imageUrls: studioOwnPhotos(
        [p.image_url],
        (products ?? []).map((x) => x.image_url),
      ),
      destinationUrl: base.destinationUrl
        ? `${base.destinationUrl}/planes/${p.slug}`
        : "",
      items: (products ?? []).map((x) => ({
        id: x.id,
        name: x.name,
        price: Number(x.price),
        quantity: items?.find((i) => i.product_id === x.id)?.quantity ?? 1,
        image: x.image_url,
      })),
    };
  }
  const p = requireStudioData(
    await db
      .from("promotions")
      .select("*")
      .eq("tenant_id", tenantId)
      .eq("id", id)
      .single(),
  );
  const row = p as unknown as {
    name: string;
    description: string | null;
    type: string;
    value: number;
    slug: string | null;
    status: string;
    image_url: string | null;
    valid_from: string | null;
    valid_until: string | null;
    sales_channels: string[];
    product_ids: string[] | null;
    bundle_product_ids: string[] | null;
    badge_label: string | null;
    buy_quantity: number | null;
    pay_quantity: number | null;
    quantity: number | null;
    min_amount: number | null;
  };
  const { data: items } = await db
    .from("promotion_items")
    .select("product_id,quantity")
    .eq("promotion_id", id);
  const ids = [
    ...new Set([
      ...(items ?? []).map((i) => i.product_id),
      ...(row.product_ids ?? []),
      ...(row.bundle_product_ids ?? []),
    ]),
  ];
  const { data: products } = ids.length
    ? await db
        .from("products")
        .select("id,name,price,image_url")
        .eq("tenant_id", tenantId)
        .in("id", ids)
    : { data: [] };
  const priced = ["bundle_price", "fixed_price"].includes(row.type);
  return {
    ...base,
    name: row.name,
    description: row.description ?? "",
    conditions: [
      Number(row.min_amount) > 0
        ? `Compra mínima ${studioPriceLabel(Number(row.min_amount))}`
        : "",
      ...(items ?? []).map(
        (item) =>
          `${item.quantity} × ${(products ?? []).find((p) => p.id === item.product_id)?.name ?? "Producto"}`,
      ),
    ]
      .filter(Boolean)
      .join(" · ")
      .slice(0, 500),
    price: priced ? Number(row.value) : null,
    priceLabel: priced ? studioPriceLabel(Number(row.value)) : "",
    badge: formatOfferLabel({ ...row, value: Number(row.value) }),
    status: row.status,
    validFrom: row.valid_from,
    validUntil: row.valid_until,
    channels: row.sales_channels ?? [],
    imageUrls: studioOwnPhotos(
      [row.image_url],
      (products ?? []).map((x) => x.image_url),
    ),
    destinationUrl: base.destinationUrl
      ? `${base.destinationUrl}/promociones/${row.slug ?? id}`
      : "",
    items: (products ?? []).map((x) => ({
      id: x.id,
      name: x.name,
      price: Number(x.price),
      quantity: items?.find((i) => i.product_id === x.id)?.quantity ?? 1,
      image: x.image_url,
    })),
  };
}

export async function listStudioSources(
  db: StudioDb,
  tenantId: string,
  type: StudioSourceType,
  query: string,
  cursor: string | null,
) {
  if (type === "custom") return { items: [], nextCursor: null };
  const table =
    type === "product"
      ? "products"
      : type === "promotion"
        ? "promotions"
        : "offer_plans";
  let q = db
    .from(table)
    .select("id,name")
    .eq("tenant_id", tenantId)
    .order("id")
    .limit(21);
  if (type === "product") q = q.is("deleted_at", null);
  if (query)
    q = q.ilike("name", `%${query.replace(/[%_,()]/g, "").slice(0, 80)}%`);
  if (cursor) q = q.gt("id", cursor);
  const rows = requireStudioData(await q);
  return {
    items: rows.slice(0, 20),
    nextCursor: rows.length > 20 ? rows[19].id : null,
  };
}
