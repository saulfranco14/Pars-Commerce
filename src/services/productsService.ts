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
  opts?: { type?: "product" | "service" }
): Promise<ProductListItem[]> {
  const params = new URLSearchParams({ tenant_id: tenantId });
  if (opts?.type) params.set("type", opts.type);
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
