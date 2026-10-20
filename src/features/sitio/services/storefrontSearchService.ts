import { SEARCH_MIN_CHARS, SEARCH_RESULTS_LIMIT } from "@/features/sitio/constants/catalog";
import { productHref } from "@/features/sitio/helpers/storeLinks";
import {
  getStoreTenant,
  listCatalogItems,
} from "@/features/sitio/services/storefrontService";

import type { ServiceResult } from "@/features/qr/services/tablePaymentService";
import type { StoreSearchResult } from "@/features/sitio/interfaces/storefront";

export async function searchStoreCatalog(
  slug: string,
  rawQuery: string,
): Promise<ServiceResult<StoreSearchResult[]>> {
  const query = rawQuery.trim();
  if (query.length < SEARCH_MIN_CHARS) return { ok: true, data: [] };

  const tenant = await getStoreTenant(slug);
  if (!tenant) {
    return { ok: false, error: { code: "not_found", message: "No encontramos esta tienda." } };
  }

  const items = await listCatalogItems({
    tenantId: tenant.id,
    search: query,
    limit: SEARCH_RESULTS_LIMIT,
  });

  return {
    ok: true,
    data: items.map((item) => ({
      id: item.id,
      name: item.name,
      href: productHref(slug, item),
      price: item.promotion?.finalPrice ?? Number(item.price),
      image: item.image_urls[0] ?? null,
      type: item.type === "service" ? "service" : "product",
    })),
  };
}
