import "server-only";
import { getTenantRole } from "@/lib/auth/requirePermission";
import { roleHasPermission } from "@/lib/auth/permissions";
import { formatOfferLabel } from "@/lib/offers/formatOfferLabel";
import { offerDisplayStatus } from "@/features/promociones/helpers/offerStatus";
import { requireStudioAccess } from "./studioAccessService";
import { requireStudioData } from "./studioErrors";
import { studioPriceLabel, studioProductPrice } from "../helpers/scene";
import { sortStudioShelf, studioShelfGaps } from "../helpers/shelf";
import type { StudioShelfItem, StudioShelfState } from "../interfaces/studio";

const LIMIT = 80;
const STATES = new Set<StudioShelfState>([
  "active",
  "scheduled",
  "expired",
  "paused",
  "draft",
]);
const shelfState = (status: string): StudioShelfState =>
  STATES.has(status as StudioShelfState)
    ? (status as StudioShelfState)
    : "draft";

/** The catalog as Studio sees it: what each item has, what it lacks, and whether it can be published. */
export async function listStudioShelf(
  tenantId: string,
): Promise<{ items: StudioShelfItem[] }> {
  const { db, user } = await requireStudioAccess(tenantId, "studio.create");
  const role = await getTenantRole(user.id, tenantId),
    can = (permission: string) =>
      Boolean(role) &&
      roleHasPermission(role!.roleName, role!.permissions, permission),
    products = can("products.read"),
    offers = can("promotions.read");
  const [productRows, promotionRows, planRows] = await Promise.all([
    products
      ? db
          .from("products")
          .select("id,name,type,description,price,image_url,has_variants")
          .eq("tenant_id", tenantId)
          .is("deleted_at", null)
          .order("sort_order")
          .limit(LIMIT)
      : null,
    offers
      ? db
          .from("promotions")
          .select("*")
          .eq("tenant_id", tenantId)
          .neq("status", "archived")
          .order("created_at", { ascending: false })
          .limit(LIMIT)
      : null,
    offers
      ? db
          .from("offer_plans")
          .select("id,name,description,price,image_url,status")
          .eq("tenant_id", tenantId)
          .neq("status", "archived")
          .limit(LIMIT)
      : null,
  ]);
  const items: StudioShelfItem[] = [];
  if (productRows) {
    const rows = requireStudioData(productRows),
      ids = rows.map((r) => r.id);
    const [images, variants] = ids.length
      ? await Promise.all([
          db
            .from("product_images")
            .select("product_id,url,position")
            .in("product_id", ids)
            .order("position"),
          db
            .from("product_variants")
            .select("product_id,price")
            .in("product_id", ids)
            .eq("is_active", true)
            .is("archived_at", null),
        ])
      : [{ data: [] }, { data: [] }];
    for (const p of rows) {
      const imageUrl =
          images.data?.find((i) => i.product_id === p.id)?.url ??
          p.image_url ??
          null,
        { priceLabel } = studioProductPrice(
          Number(p.price),
          (variants.data ?? [])
            .filter((v) => v.product_id === p.id)
            .map((v) => v.price),
        );
      items.push({
        type: "product",
        id: p.id,
        name: p.name,
        kind: p.type === "service" ? "service" : "product",
        priceLabel,
        imageUrl,
        gaps: studioShelfGaps({
          imageUrl,
          priceLabel,
          description: p.description,
        }),
        state: "active",
      });
    }
  }
  if (promotionRows)
    for (const row of requireStudioData(promotionRows) as unknown as Array<
      Parameters<typeof formatOfferLabel>[0] & {
        id: string;
        name: string;
        description: string | null;
        image_url: string | null;
        status: string;
        valid_from: string | null;
        valid_until: string | null;
        product_ids: string[] | null;
        bundle_product_ids: string[] | null;
      }
    >) {
      const priceLabel = formatOfferLabel({ ...row, value: Number(row.value) });
      items.push({
        type: "promotion",
        id: row.id,
        name: row.name,
        kind: "promotion",
        priceLabel,
        imageUrl: row.image_url,
        gaps: studioShelfGaps({
          imageUrl: row.image_url,
          priceLabel,
          description: row.description,
          hasItems: Boolean(
            row.product_ids?.length || row.bundle_product_ids?.length,
          ),
        }),
        state: shelfState(offerDisplayStatus(row)),
      });
    }
  if (planRows)
    for (const row of requireStudioData(planRows)) {
      const priceLabel = studioPriceLabel(Number(row.price));
      items.push({
        type: "subscription_plan",
        id: row.id,
        name: row.name,
        kind: "plan",
        priceLabel,
        imageUrl: row.image_url,
        gaps: studioShelfGaps({
          imageUrl: row.image_url,
          priceLabel,
          description: row.description,
          hasItems: true,
        }),
        state: shelfState(row.status),
      });
    }
  return { items: sortStudioShelf(items) };
}
