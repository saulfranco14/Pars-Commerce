import { createClient } from "@/lib/supabase/client";

const BUCKET = "product-images";

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
