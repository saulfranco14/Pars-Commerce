type ImageKind = "product" | "promotion" | "hero" | "logo";

async function uploadTenantImage(
  file: File,
  tenantId: string,
  kind: ImageKind,
  options: { productId?: string; previousUrl?: string | null } = {},
): Promise<string> {
  const formData = new FormData();
  formData.set("file", file);
  formData.set("tenant_id", tenantId);
  formData.set("kind", kind);
  if (options.productId) formData.set("product_id", options.productId);
  if (options.previousUrl) formData.set("previous_url", options.previousUrl);

  const response = await fetch("/api/uploads/image", {
    method: "POST",
    body: formData,
  });
  const body = (await response.json().catch(() => null)) as { error?: string; url?: string } | null;
  if (!response.ok || !body?.url) {
    throw new Error(body?.error ?? "No pudimos guardar la imagen. Intenta de nuevo.");
  }
  return body.url;
}

export async function deleteFileByUrl(url: string, tenantId: string): Promise<void> {
  const response = await fetch("/api/uploads/image", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url, tenant_id: tenantId }),
  });
  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new Error(body?.error ?? "No pudimos eliminar la imagen.");
  }
}

export function uploadProductImage(
  file: File,
  tenantId: string,
  productId?: string,
): Promise<string> {
  return uploadTenantImage(file, tenantId, "product", { productId });
}

export function uploadPromotionImage(
  file: File,
  tenantId: string,
  _promotionId?: string,
  previousUrl?: string | null,
): Promise<string> {
  return uploadTenantImage(file, tenantId, "promotion", { previousUrl });
}

export function uploadHeroImage(
  file: File,
  tenantId: string,
  previousUrl?: string | null,
): Promise<string> {
  return uploadTenantImage(file, tenantId, "hero", { previousUrl });
}

export function deleteHeroImage(url: string, tenantId: string): Promise<void> {
  return deleteFileByUrl(url, tenantId);
}

export function uploadTenantLogo(
  file: File,
  tenantId: string,
  previousUrl?: string | null,
): Promise<string> {
  return uploadTenantImage(file, tenantId, "logo", { previousUrl });
}
