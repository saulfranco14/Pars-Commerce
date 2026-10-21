import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requirePermission } from "@/lib/auth/requirePermission";
import { isPromotionLive } from "@/lib/offers/pricing";

import { serviceErrorToResponse } from "@/features/qr/services/serviceErrorToResponse";
import {
  archivePromotion,
  getPromotionTenant,
  savePromotion,
} from "@/features/promociones/services/promotionAdminService";

import type { PromotionWriteInput } from "@/features/promociones/interfaces/promotionAdmin";

const LIST_COLUMNS =
  "id, name, slug, type, value, min_amount, product_ids, valid_from, valid_until, image_url, description, badge_label, subcatalog_ids, quantity, bundle_product_ids, status, applies_to, buy_quantity, pay_quantity, template_key, created_at";

async function currentUser() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  return { supabase, user: error ? null : user };
}

async function readJson<T>(request: Request): Promise<T | null> {
  try {
    return (await request.json()) as T;
  } catch {
    return null;
  }
}

export async function GET(request: Request) {
  const { supabase, user } = await currentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const tenantId = searchParams.get("tenant_id");
  const promotionId = searchParams.get("promotion_id");
  const activeOnly = searchParams.get("active_only") === "true";
  const includeArchived = searchParams.get("include_archived") === "true";

  if (!tenantId && !promotionId) {
    return NextResponse.json({ error: "tenant_id or promotion_id is required" }, { status: 400 });
  }

  if (promotionId) {
    const { data: promotion, error } = await supabase
      .from("promotions")
      .select("*, promotion_items(product_id, quantity, position)")
      .eq("id", promotionId)
      .single();
    if (error || !promotion) {
      return NextResponse.json({ error: error?.message ?? "Promotion not found" }, { status: 404 });
    }
    return NextResponse.json(promotion);
  }

  let query = supabase
    .from("promotions")
    .select(LIST_COLUMNS)
    .eq("tenant_id", tenantId as string)
    .order("created_at", { ascending: false });
  if (!includeArchived) query = query.neq("status", "archived");

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const promotions = activeOnly ? (data ?? []).filter((promotion) => isPromotionLive(promotion)) : (data ?? []);
  return NextResponse.json(promotions);
}

export async function POST(request: Request) {
  const { user } = await currentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await readJson<PromotionWriteInput & { tenant_id?: string }>(request);
  if (!body) return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  if (!body.tenant_id) return NextResponse.json({ error: "tenant_id is required" }, { status: 400 });

  if (!(await requirePermission(user.id, body.tenant_id, "promotions.write"))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { tenant_id: tenantId, ...input } = body;
  const result = await savePromotion(createAdminClient(), { tenantId, input });
  if (!result.ok) return serviceErrorToResponse(result.error);
  return NextResponse.json(result.data);
}

export async function PATCH(request: Request) {
  const { user } = await currentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await readJson<PromotionWriteInput & { promotion_id?: string }>(request);
  if (!body) return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  if (!body.promotion_id) return NextResponse.json({ error: "promotion_id is required" }, { status: 400 });

  const admin = createAdminClient();
  const tenantId = await getPromotionTenant(admin, body.promotion_id);
  if (!tenantId) return NextResponse.json({ error: "Promotion not found" }, { status: 404 });
  if (!(await requirePermission(user.id, tenantId, "promotions.write"))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { promotion_id: promotionId, ...input } = body;
  const result = await savePromotion(admin, { tenantId, promotionId, input });
  if (!result.ok) return serviceErrorToResponse(result.error);
  return NextResponse.json(result.data);
}

/** Archives instead of deleting so past orders keep pointing at the promotion. */
export async function DELETE(request: Request) {
  const { user } = await currentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const promotionId = new URL(request.url).searchParams.get("promotion_id");
  if (!promotionId) return NextResponse.json({ error: "promotion_id is required" }, { status: 400 });

  const admin = createAdminClient();
  const tenantId = await getPromotionTenant(admin, promotionId);
  if (!tenantId) return NextResponse.json({ error: "Promotion not found" }, { status: 404 });
  if (!(await requirePermission(user.id, tenantId, "promotions.write"))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const result = await archivePromotion(admin, { tenantId, promotionId });
  if (!result.ok) return serviceErrorToResponse(result.error);
  return NextResponse.json({ success: true });
}
