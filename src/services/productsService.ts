import type {
  ProductListItem,
  ProductDetail,
  CreateProductPayload,
  UpdateProductPayload,
  ProductCreated,
  ProductUpdated,
} from "@/types/products";
import { apiFetch } from "@/services/apiFetch";

export async function listByTenant(
  tenantId: string,
  opts?: { type?: "product" | "service"; subcatalogId?: string; q?: string }
): Promise<ProductListItem[]> {
  const params = new URLSearchParams({ tenant_id: tenantId });
  if (opts?.type) params.set("type", opts.type);
  if (opts?.subcatalogId) params.set("subcatalog_id", opts.subcatalogId);
  if (opts?.q && opts.q.trim().length >= 2) params.set("q", opts.q.trim());
  const data = await apiFetch(`/api/products?${params}`);
  return Array.isArray(data) ? (data as ProductListItem[]) : [];
}

export async function getById(productId: string): Promise<ProductDetail> {
  const data = await apiFetch(
    `/api/products?product_id=${encodeURIComponent(productId)}`
  );
  return data as ProductDetail;
}

export async function create(
  payload: CreateProductPayload
): Promise<ProductCreated> {
  const data = await apiFetch("/api/products", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return data as ProductCreated;
}

export async function update(
  productId: string,
  payload: UpdateProductPayload
): Promise<ProductUpdated> {
  const data = await apiFetch("/api/products", {
    method: "PATCH",
    body: JSON.stringify({ product_id: productId, ...payload }),
  });
  return data as ProductUpdated;
}

export async function remove(productId: string): Promise<void> {
  await apiFetch(
    `/api/products?product_id=${encodeURIComponent(productId)}`,
    { method: "DELETE" }
  );
}
