import { create, update } from "@/services/productsService";
import { deriveSlug } from "@/lib/forms/deriveSlug";

import type { MultiImageUploadRef } from "@/components/MultiImageUpload";
import type { ServiceFieldValues } from "@/features/servicios/validations/serviceFieldSchema";
import type { ProductCreated } from "@/types/products";

/**
 * Maps the schema-driven form values into the API payload, then runs the
 * two-phase create → upload-images → persist-URLs flow. The component that
 * renders the form shouldn't know any of this — it only owns form state and
 * hands off values + the image upload ref on submit.
 */
export async function createServiceFromForm(
  tenantId: string,
  values: ServiceFieldValues,
  imageUploadRef: MultiImageUploadRef | null,
): Promise<ProductCreated> {
  const finalSlug = (values.slug?.trim() || deriveSlug(values.name)).toLowerCase();

  const created = await create({
    tenant_id: tenantId,
    name: values.name.trim(),
    slug: finalSlug,
    description: values.description?.trim() || undefined,
    price: values.price,
    cost_price: values.cost_price,
    commission_amount: values.commission_amount,
    sku: values.sku?.trim() || undefined,
    subcatalog_id: values.subcatalog_id || null,
    unit: "service",
    is_public: values.is_public,
    type: "service",
    track_stock: false,
  });

  const uploadedUrls = imageUploadRef
    ? await imageUploadRef.uploadPendingFiles(created.id)
    : [];
  if (uploadedUrls.length > 0) {
    await update(created.id, { image_urls: uploadedUrls });
  }

  return created;
}
