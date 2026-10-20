import type {
  CatalogSort,
  CatalogType,
} from "@/features/sitio/interfaces/storefront";

export interface CatalogHrefParams {
  type?: CatalogType | null;
  subcatalogId?: string | null;
  q?: string | null;
  sort?: CatalogSort | null;
}

export function catalogHref(slug: string, params: CatalogHrefParams = {}): string {
  const query = new URLSearchParams();
  if (params.type) query.set("type", params.type);
  if (params.subcatalogId) query.set("subcatalog_id", params.subcatalogId);
  if (params.q?.trim()) query.set("q", params.q.trim());
  if (params.sort && params.sort !== "featured") query.set("sort", params.sort);
  const suffix = query.toString();
  return `/sitio/${slug}/productos${suffix ? `?${suffix}` : ""}`;
}

export function productHref(slug: string, product: { id: string; slug: string | null }): string {
  return `/sitio/${slug}/productos/${product.slug || product.id}`;
}

export function whatsappHref(phone: string, message?: string): string {
  const base = `https://wa.me/${phone.replace(/\D/g, "")}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}

export function productInquiryHref(phone: string, productName: string, productUrl: string): string {
  return whatsappHref(phone, `Hola, me interesa: ${productName}\n${productUrl}`);
}
