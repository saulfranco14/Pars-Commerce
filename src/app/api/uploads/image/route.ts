import { NextResponse } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

const BUCKET = "product-images";
const MAX_IMAGE_BYTES = 12 * 1024 * 1024;
const imageExtensions = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/gif": "gif",
  "image/webp": "webp",
} as const;

type ImageKind = "product" | "promotion" | "hero" | "logo";

function getPathFromPublicUrl(url: string) {
  try {
    const { pathname } = new URL(url);
    const match = pathname.match(/\/storage\/v1\/object\/public\/product-images\/(.+)/);
    return match ? decodeURIComponent(match[1].split("?")[0]) : null;
  } catch {
    return null;
  }
}

async function requireTenantMember(tenantId: string) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) return { error: "Unauthorized", status: 401 } as const;

  const { data: membership } = await supabase
    .from("tenant_memberships")
    .select("id")
    .eq("tenant_id", tenantId)
    .eq("user_id", user.id)
    .not("accepted_at", "is", null)
    .maybeSingle();

  if (!membership) return { error: "Forbidden", status: 403 } as const;
  return { supabase } as const;
}

function makePath(kind: ImageKind, tenantId: string, productId: string | null, extension: string) {
  const id = crypto.randomUUID();
  switch (kind) {
    case "product":
      return `${tenantId}/${productId ?? "product"}-${id}.${extension}`;
    case "promotion":
      return `${tenantId}/promotions/${id}.${extension}`;
    case "hero":
      return `${tenantId}/hero/hero-${id}.${extension}`;
    case "logo":
      return `${tenantId}/logos/logo-${id}.${extension}`;
  }
}

export async function POST(request: Request) {
  const formData = await request.formData();
  const tenantId = formData.get("tenant_id");
  const kind = formData.get("kind");
  const productId = formData.get("product_id");
  const previousUrl = formData.get("previous_url");
  const file = formData.get("file");

  if (typeof tenantId !== "string" || !tenantId) {
    return NextResponse.json({ error: "tenant_id is required" }, { status: 400 });
  }
  if (!["product", "promotion", "hero", "logo"].includes(String(kind))) {
    return NextResponse.json({ error: "Invalid image kind" }, { status: 400 });
  }
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "An image file is required" }, { status: 400 });
  }
  if (file.size === 0 || file.size > MAX_IMAGE_BYTES) {
    return NextResponse.json(
      { error: "La imagen debe pesar como m\u00e1ximo 12 MB." },
      { status: 400 },
    );
  }

  const extension = imageExtensions[file.type as keyof typeof imageExtensions];
  if (!extension) {
    return NextResponse.json(
      { error: "Solo puedes subir im\u00e1genes JPG, PNG, GIF o WebP." },
      { status: 400 },
    );
  }

  const membership = await requireTenantMember(tenantId);
  if ("error" in membership) {
    return NextResponse.json({ error: membership.error }, { status: membership.status });
  }

  const imageKind = kind as ImageKind;
  const requestedProductId = typeof productId === "string" && productId ? productId : null;
  if (imageKind === "product" && requestedProductId) {
    const { data: product } = await membership.supabase
      .from("products")
      .select("tenant_id")
      .eq("id", requestedProductId)
      .is("deleted_at", null)
      .maybeSingle();

    if (!product || product.tenant_id !== tenantId) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }
  }

  const path = makePath(imageKind, tenantId, requestedProductId, extension);
  const admin = createAdminClient();
  const { error: uploadError } = await admin.storage
    .from(BUCKET)
    .upload(path, Buffer.from(await file.arrayBuffer()), {
      contentType: file.type,
      upsert: false,
    });

  if (uploadError) {
    return NextResponse.json(
      { error: "No pudimos guardar la imagen. Intenta de nuevo en unos minutos." },
      { status: 502 },
    );
  }

  if (typeof previousUrl === "string") {
    const previousPath = getPathFromPublicUrl(previousUrl);
    if (previousPath && previousPath.startsWith(`${tenantId}/`) && previousPath !== path) {
      await admin.storage.from(BUCKET).remove([previousPath]);
    }
  }

  const {
    data: { publicUrl },
  } = admin.storage.from(BUCKET).getPublicUrl(path);
  return NextResponse.json({ url: publicUrl });
}

export async function DELETE(request: Request) {
  const body = await request.json();
  const tenantId = typeof body.tenant_id === "string" ? body.tenant_id : "";
  const url = typeof body.url === "string" ? body.url : "";
  if (!tenantId || !url) {
    return NextResponse.json({ error: "tenant_id and url are required" }, { status: 400 });
  }

  const membership = await requireTenantMember(tenantId);
  if ("error" in membership) {
    return NextResponse.json({ error: membership.error }, { status: membership.status });
  }

  const path = getPathFromPublicUrl(url);
  if (!path || !path.startsWith(`${tenantId}/`)) {
    return NextResponse.json({ error: "Invalid image URL" }, { status: 400 });
  }

  const { error } = await createAdminClient().storage.from(BUCKET).remove([path]);
  if (error) {
    return NextResponse.json({ error: "No pudimos eliminar la imagen." }, { status: 502 });
  }
  return NextResponse.json({ success: true });
}
