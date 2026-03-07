import { createClient } from "@/lib/supabase/client";

const BUCKET = "product-images";

function extractPathFromUrl(url: string): string | null {
  try {
    const parsed = new URL(url);
    // Supabase public URLs follow the pattern: /storage/v1/object/public/<bucket>/<path>
    const match = parsed.pathname.match(/\/storage\/v1\/object\/public\/[^/]+\/(.+)/);
    return match ? decodeURIComponent(match[1].split("?")[0]) : null;
  } catch {
    return null;
  }
}

export async function deleteFileByUrl(url: string): Promise<void> {
  const path = extractPathFromUrl(url);
  if (!path) return;
  const supabase = createClient();
  await supabase.storage.from(BUCKET).remove([path]);
}

export async function uploadProductImage(
  file: File,
  tenantId: string,
  productId?: string
): Promise<string> {
  const supabase = createClient();
  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const safeExt = ["jpeg", "jpg", "png", "gif", "webp"].includes(ext)
    ? ext
    : "jpg";
  const id = productId || crypto.randomUUID();
  // Use a unique filename per upload so different products don't collide,
  // but keep a stable name when productId is provided to allow upsert.
  const path = `${tenantId}/${id}.${safeExt}`;

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, { upsert: true });

  if (error) throw error;

  const {
    data: { publicUrl },
  } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return publicUrl;
}

export async function uploadPromotionImage(
  file: File,
  tenantId: string,
  promotionId?: string,
  previousUrl?: string | null
): Promise<string> {
  const supabase = createClient();
  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const safeExt = ["jpeg", "jpg", "png", "gif", "webp"].includes(ext)
    ? ext
    : "jpg";
  const id = promotionId || crypto.randomUUID();
  const path = `${tenantId}/promotions/${id}.${safeExt}`;

  // Delete previous file if extension changed
  if (previousUrl) {
    const prevPath = extractPathFromUrl(previousUrl);
    if (prevPath && prevPath !== path) {
      await supabase.storage.from(BUCKET).remove([prevPath]);
    }
  }

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, { upsert: true });

  if (error) throw error;

  const {
    data: { publicUrl },
  } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return publicUrl;
}

export async function uploadTenantLogo(
  file: File,
  tenantId: string,
  previousUrl?: string | null
): Promise<string> {
  const supabase = createClient();
  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const safeExt = ["jpeg", "jpg", "png", "gif", "webp"].includes(ext)
    ? ext
    : "jpg";
  const path = `${tenantId}/logos/logo.${safeExt}`;

  // Delete the previous logo if it has a different extension (upsert won't remove it)
  if (previousUrl) {
    const prevPath = extractPathFromUrl(previousUrl);
    if (prevPath && prevPath !== path) {
      await supabase.storage.from(BUCKET).remove([prevPath]);
    }
  }

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, { upsert: true });

  if (error) throw error;

  const {
    data: { publicUrl },
  } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return publicUrl;
}
