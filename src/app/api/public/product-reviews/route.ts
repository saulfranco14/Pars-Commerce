/* eslint-disable @typescript-eslint/no-explicit-any -- Commerce schema types are regenerated after the migration rollout. */
import { NextResponse } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";

const PAGE_SIZE = 4;

type ReviewRow = {
  id: string;
  rating: number;
  comment: string | null;
  published_at: string | null;
};

export async function GET(request: Request) {
  const searchParams = new URL(request.url).searchParams;
  const productId = searchParams.get("product_id")?.trim();
  const parsedOffset = Number(searchParams.get("offset") ?? 0);
  const offset = Number.isFinite(parsedOffset)
    ? Math.max(0, Math.min(Math.floor(parsedOffset), 10_000))
    : 0;

  if (!productId) {
    return NextResponse.json(
      { error: "product_id is required" },
      { status: 400 },
    );
  }

  const admin = createAdminClient();
  const db = admin as unknown as { from: (table: string) => any };
  const { data: product } = await db
    .from("products")
    .select("id, tenant_id")
    .eq("id", productId)
    .eq("is_public", true)
    .is("deleted_at", null)
    .maybeSingle();

  if (!product) {
    return NextResponse.json({ error: "Producto no disponible" }, { status: 404 });
  }

  const { data: tenant } = await admin
    .from("tenants")
    .select("id")
    .eq("id", product.tenant_id)
    .eq("public_store_enabled", true)
    .maybeSingle();

  if (!tenant) {
    return NextResponse.json({ error: "Producto no disponible" }, { status: 404 });
  }

  const { data, error, count } = await db
    .from("product_reviews")
    .select("id, rating, comment, published_at", { count: "exact" })
    .eq("product_id", productId)
    .eq("status", "published")
    .order("published_at", { ascending: false })
    .range(offset, offset + PAGE_SIZE - 1);

  if (error) {
    return NextResponse.json(
      { error: "No se pudieron cargar las reseñas." },
      { status: 500 },
    );
  }

  const reviews = (data ?? []) as ReviewRow[];
  const total = count ?? reviews.length;
  const nextOffset = offset + reviews.length;

  return NextResponse.json({
    reviews,
    total,
    nextOffset,
    hasMore: nextOffset < total,
  });
}
