import { NextResponse } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";

type CommerceAdmin = { from: (table: string) => any };

/** Public, read-only options for a product that is already public. */
export async function GET(request: Request) {
  const productId = new URL(request.url).searchParams.get("product_id");
  if (!productId) return NextResponse.json({ error: "product_id is required" }, { status: 400 });

  const admin = createAdminClient();
  const { data: product } = await admin
    .from("products")
    .select("id, has_variants")
    .eq("id", productId)
    .eq("is_public", true)
    .is("deleted_at", null)
    .maybeSingle();
  if (!product) return NextResponse.json({ error: "Producto no disponible" }, { status: 404 });
  if (!(product as { has_variants?: boolean }).has_variants) return NextResponse.json({ groups: [], variants: [] });

  const db = admin as unknown as CommerceAdmin;
  const [{ data: groups }, { data: values }, { data: variants }, { data: links }] = await Promise.all([
    db.from("product_option_groups").select("id, name, display_order").eq("product_id", productId).order("display_order"),
    db.from("product_option_values").select("id, option_group_id, label, swatch_hex, display_order"),
    db.from("product_variants").select("id, product_id, sku, price, stock, track_stock, image_url, is_active, selection_key, display_order").eq("product_id", productId).eq("is_active", true).is("archived_at", null).order("display_order"),
    db.from("product_variant_values").select("variant_id, option_value_id"),
  ]);
  const variantIds = new Set((variants ?? []).map((variant: { id: string }) => variant.id));
  const allowedLinks = (links ?? []).filter((link: { variant_id: string }) => variantIds.has(link.variant_id));
  const allowedValueIds = new Set(allowedLinks.map((link: { option_value_id: string }) => link.option_value_id));
  const groupIds = new Set((groups ?? []).map((group: { id: string }) => group.id));
  const allowedValues = (values ?? []).filter((value: { id: string; option_group_id: string }) => groupIds.has(value.option_group_id) && allowedValueIds.has(value.id));
  return NextResponse.json({
    groups: groups ?? [],
    values: allowedValues,
    variants: variants ?? [],
    variantValues: allowedLinks,
  });
}
