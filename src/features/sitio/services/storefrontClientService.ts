import { apiFetch } from "@/services/apiFetch";

import type { StoreSearchResult } from "@/features/sitio/interfaces/storefront";

export async function searchStore(payload: {
  slug: string;
  query: string;
}): Promise<StoreSearchResult[]> {
  const data = (await apiFetch(
    `/api/public/sitio/${encodeURIComponent(payload.slug)}/search?q=${encodeURIComponent(payload.query)}`,
  )) as { results?: StoreSearchResult[] };
  return data.results ?? [];
}
