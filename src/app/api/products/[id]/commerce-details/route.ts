import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

type CommerceAdmin = { from: (table: string) => any };
type CommerceRpc = { rpc: (name: string, args: Record<string, unknown>) => Promise<{ data: unknown; error: { message?: string } | null }> };
type VariantInput = {
  id?: string | null;
  size?: string;
  color?: string;
  sku?: string;
  price: number;
  stock: number;
  image_url?: string | null;
  is_active?: boolean;
  display_order?: number;
};

async function accessProduct(productId: string) {
  const session = await createClient();
  const { data: { user } } = await session.auth.getUser();
  if (!user) return { error: "Unauthorized", status: 401 as const };
  const admin = createAdminClient() as unknown as CommerceAdmin;
  const { data: product } = await admin.from("products").select("id, tenant_id").eq("id", productId).maybeSingle();
  if (!product) return { error: "Producto no encontrado.", status: 404 as const };
  const { data: membership } = await session.from("tenant_memberships").select("id, status").eq("tenant_id", product.tenant_id).eq("user_id", user.id).maybeSingle();
  if (!membership || membership.status !== "active") return { error: "Forbidden", status: 403 as const };
  return { admin, product, session };
}

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const access = await accessProduct(id);
  if ("error" in access) return NextResponse.json({ error: access.error }, { status: access.status });

  const [{ data: product }, { data: groups }, { data: variants }, { data: reviews }] = await Promise.all([
    access.admin.from("products").select("has_variants, size_guide, care_instructions, material_info").eq("id", id).maybeSingle(),
    access.admin.from("product_option_groups").select("id, name, display_order").eq("product_id", id).order("display_order"),
    access.admin.from("product_variants").select("id, sku, price, stock, track_stock, image_url, is_active, selection_key, display_order, archived_at").eq("product_id", id).is("archived_at", null).order("display_order"),
    access.admin.from("product_reviews").select("id, rating, comment, status, created_at").eq("product_id", id).order("created_at", { ascending: false }),
  ]);
  const groupIds = new Set((groups ?? []).map((group: { id: string }) => group.id));
  const variantIds = new Set((variants ?? []).map((variant: { id: string }) => variant.id));
  const [{ data: values }, { data: links }] = await Promise.all([
    access.admin.from("product_option_values").select("id, option_group_id, label, swatch_hex, display_order").order("display_order"),
    access.admin.from("product_variant_values").select("variant_id, option_value_id"),
  ]);

  return NextResponse.json({
    product,
    groups: groups ?? [],
    values: (values ?? []).filter((value: { option_group_id: string }) => groupIds.has(value.option_group_id)),
    variants: variants ?? [],
    variantValues: (links ?? []).filter((link: { variant_id: string }) => variantIds.has(link.variant_id)),
    reviews: reviews ?? [],
  });
}

function normalizedVariantKey(variant: VariantInput) {
  return [variant.size?.trim().toLocaleLowerCase("es-MX"), variant.color?.trim().toLocaleLowerCase("es-MX")]
    .filter(Boolean)
    .join("|");
}

function rpcMessage(message: string) {
  if (message.includes("VARIANTS_REQUIRED")) return "Agrega al menos una variante.";
  if (message.includes("VARIANT_OPTION_REQUIRED")) return "Cada variante necesita talla, color o ambos.";
  if (message.includes("VARIANT_PRICE_STOCK_INVALID")) return "Revisa el precio y las existencias de cada variante.";
  if (message.includes("VARIANT_DUPLICATE")) return "No puedes repetir la misma combinación de talla y color.";
  if (message.includes("VARIANT_SKU_DUPLICATE")) return "Cada SKU debe ser único dentro del producto.";
  if (message.includes("ACTIVE_VARIANT_REQUIRED")) return "Deja al menos una variante visible.";
  return message;
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json() as {
    has_variants?: boolean;
    size_guide?: string;
    care_instructions?: string;
    material_info?: string;
    variants?: VariantInput[];
  };
  const access = await accessProduct(id);
  if ("error" in access) return NextResponse.json({ error: access.error }, { status: access.status });

  const wantsVariants = body.has_variants === true;
  const variants = (body.variants ?? []).map((variant, index) => ({
    id: variant.id?.trim() || null,
    size: variant.size?.trim() || "",
    color: variant.color?.trim() || "",
    sku: variant.sku?.trim() || "",
    price: Number(variant.price),
    stock: Number(variant.stock),
    image_url: variant.image_url?.trim() || null,
    is_active: variant.is_active !== false,
    display_order: index,
  }));

  if (wantsVariants) {
    if (variants.length === 0) return NextResponse.json({ error: "Agrega al menos una variante." }, { status: 400 });
    const invalid = variants.find((variant) =>
      (!variant.size && !variant.color)
      || !Number.isFinite(variant.price)
      || variant.price < 0
      || !Number.isInteger(variant.stock)
      || variant.stock < 0,
    );
    if (invalid) return NextResponse.json({ error: "Cada variante necesita talla o color, además de precio y existencias válidas." }, { status: 400 });

    const keys = variants.map(normalizedVariantKey);
    if (new Set(keys).size !== keys.length) return NextResponse.json({ error: "No puedes repetir la misma combinación de talla y color." }, { status: 400 });
    const skus = variants.map((variant) => variant.sku.toLocaleLowerCase("es-MX")).filter(Boolean);
    if (new Set(skus).size !== skus.length) return NextResponse.json({ error: "Cada SKU debe ser único dentro del producto." }, { status: 400 });
    if (!variants.some((variant) => variant.is_active)) return NextResponse.json({ error: "Deja al menos una variante visible." }, { status: 400 });
  }

  const { data, error } = await (access.session as unknown as CommerceRpc).rpc("save_product_commerce_details", {
    p_product_id: id,
    p_has_variants: wantsVariants,
    p_material_info: body.material_info?.trim() || null,
    p_care_instructions: body.care_instructions?.trim() || null,
    p_size_guide: variants.some((variant) => variant.size) ? body.size_guide?.trim() || null : null,
    p_variants: variants,
  });
  if (error) return NextResponse.json({ error: rpcMessage(error.message ?? "No se pudo guardar la configuración del producto.") }, { status: 400 });
  return NextResponse.json({ success: true, result: data });
}
