import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const tenantId = searchParams.get("tenant_id");
  const promotionId = searchParams.get("promotion_id");
  const activeOnly = searchParams.get("active_only") === "true";

  if (!tenantId && !promotionId) {
    return NextResponse.json(
      { error: "tenant_id or promotion_id is required" },
      { status: 400 },
    );
  }

  if (promotionId) {
    const { data: promotion, error } = await supabase
      .from("promotions")
      .select("*")
      .eq("id", promotionId)
      .single();

    if (error || !promotion) {
      return NextResponse.json(
        { error: error?.message ?? "Promotion not found" },
        { status: 404 },
      );
    }
    return NextResponse.json(promotion);
  }

  const query = supabase
    .from("promotions")
    .select(
      "id, name, slug, type, value, min_amount, product_ids, valid_from, valid_until, image_url, description, badge_label, subcatalog_ids, quantity, bundle_product_ids, created_at",
    )
    .eq("tenant_id", tenantId as string)
    .order("created_at", { ascending: false });

  const { data: rawPromotions, error } = await query;
  let promotions = rawPromotions;

  if (activeOnly && promotions) {
    const now = new Date();
    promotions = promotions.filter((p) => {
      const from = p.valid_from ? new Date(p.valid_from) : null;
      const until = p.valid_until ? new Date(p.valid_until) : null;
      if (from && from > now) return false;
      if (until && until < now) return false;
      return true;
    });
  }

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(promotions ?? []);
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: {
    tenant_id?: string;
    name?: string;
    slug?: string;
    type?: string;
    value?: number;
    min_amount?: number;
    product_ids?: string[];
    valid_from?: string;
    valid_until?: string;
    image_url?: string;
    description?: string;
    badge_label?: string;
    subcatalog_ids?: string[];
    quantity?: number;
    bundle_product_ids?: string[];
    apply_automatically?: boolean;
    priority?: number;
    trigger_product_ids?: string[];
    trigger_quantity?: number;
    free_quantity_per_trigger?: number;
    free_quantity_max?: number;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const {
    tenant_id,
    name,
    slug,
    type,
    value,
    min_amount,
    product_ids,
    valid_from,
    valid_until,
    image_url,
    description,
    badge_label,
    subcatalog_ids,
    quantity,
    bundle_product_ids,
    apply_automatically,
    priority,
    trigger_product_ids,
    trigger_quantity,
    free_quantity_per_trigger,
    free_quantity_max,
  } = body;

  if (!tenant_id || !name || !type) {
    return NextResponse.json(
      { error: "tenant_id, name and type are required" },
      { status: 400 },
    );
  }

  if (type !== "event_badge" && type !== "buy_x_get_y_free" && (value == null || value < 0)) {
    return NextResponse.json(
      { error: "value (>= 0) is required for this promotion type" },
      { status: 400 },
    );
  }

  const validTypes = ["percentage", "fixed_amount", "bundle_price", "fixed_price", "event_badge", "buy_x_get_y_free"];
  if (!validTypes.includes(type)) {
    return NextResponse.json(
      { error: "type must be one of: percentage, fixed_amount, bundle_price, fixed_price, event_badge, buy_x_get_y_free" },
      { status: 400 },
    );
  }

  const derivedSlug = (slug?.trim() || name.toLowerCase().trim().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "")) || null;

  const admin = createAdminClient();
  const { data: membership } = await admin
    .from("tenant_memberships")
    .select("role:tenant_roles(name, permissions)")
    .eq("user_id", user.id)
    .eq("tenant_id", tenant_id)
    .single();

  const rawRole = membership?.role as
    | { name: string; permissions: string[] }
    | { name: string; permissions: string[] }[]
    | null
    | undefined;
  const role = Array.isArray(rawRole) ? rawRole[0] : rawRole;
  const canWrite =
    role &&
    (role.name === "owner" ||
      (Array.isArray(role.permissions) &&
        role.permissions.includes("promotions.write")));

  if (!canWrite) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const insertData: Record<string, unknown> = {
    tenant_id,
    name: name.trim(),
    slug: derivedSlug || undefined,
    type,
    value: type === "buy_x_get_y_free" ? 0 : value,
    min_amount: min_amount ?? null,
    product_ids: product_ids?.length ? product_ids : null,
    valid_from: valid_from || null,
    valid_until: valid_until || null,
    image_url: image_url?.trim() || null,
    description: description?.trim() || null,
    badge_label: badge_label?.trim() || null,
    subcatalog_ids: subcatalog_ids?.length ? subcatalog_ids : null,
    quantity: quantity ?? null,
    bundle_product_ids: bundle_product_ids?.length ? bundle_product_ids : null,
    apply_automatically: apply_automatically ?? false,
    priority: priority ?? 100,
    trigger_product_ids: trigger_product_ids?.length ? trigger_product_ids : null,
    trigger_quantity: trigger_quantity ?? 1,
    free_quantity_per_trigger: free_quantity_per_trigger ?? 1,
    free_quantity_max: free_quantity_max ?? null,
  };

  const { data: promotion, error } = await admin
    .from("promotions")
    .insert(insertData)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(promotion);
}

export async function PATCH(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: {
    promotion_id?: string;
    name?: string;
    slug?: string | null;
    type?: string;
    value?: number;
    min_amount?: number;
    product_ids?: string[] | null;
    valid_from?: string | null;
    valid_until?: string | null;
    image_url?: string | null;
    description?: string | null;
    badge_label?: string | null;
    subcatalog_ids?: string[] | null;
    quantity?: number | null;
    bundle_product_ids?: string[] | null;
    apply_automatically?: boolean;
    priority?: number;
    trigger_product_ids?: string[] | null;
    trigger_quantity?: number;
    free_quantity_per_trigger?: number;
    free_quantity_max?: number | null;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { promotion_id, ...updates } = body;

  if (!promotion_id) {
    return NextResponse.json(
      { error: "promotion_id is required" },
      { status: 400 },
    );
  }

  const admin = createAdminClient();
  const { data: promotion } = await admin
    .from("promotions")
    .select("tenant_id")
    .eq("id", promotion_id)
    .single();

  if (!promotion) {
    return NextResponse.json({ error: "Promotion not found" }, { status: 404 });
  }

  const { data: membership } = await admin
    .from("tenant_memberships")
    .select("role:tenant_roles(name, permissions)")
    .eq("user_id", user.id)
    .eq("tenant_id", promotion.tenant_id)
    .single();

  const rawRole = membership?.role as
    | { name: string; permissions: string[] }
    | { name: string; permissions: string[] }[]
    | null
    | undefined;
  const role = Array.isArray(rawRole) ? rawRole[0] : rawRole;
  const canWrite =
    role &&
    (role.name === "owner" ||
      (Array.isArray(role.permissions) &&
        role.permissions.includes("promotions.write")));

  if (!canWrite) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const updateData: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };
  if (updates.name !== undefined) updateData.name = updates.name.trim();
  if (updates.slug !== undefined) updateData.slug = updates.slug?.trim() || null;
  if (updates.type !== undefined) updateData.type = updates.type;
  if (updates.value !== undefined) updateData.value = updates.value;
  if (updates.min_amount !== undefined)
    updateData.min_amount = updates.min_amount;
  if (updates.product_ids !== undefined)
    updateData.product_ids = updates.product_ids;
  if (updates.valid_from !== undefined)
    updateData.valid_from = updates.valid_from;
  if (updates.valid_until !== undefined)
    updateData.valid_until = updates.valid_until;
  if (updates.image_url !== undefined)
    updateData.image_url = updates.image_url?.trim() || null;
  if (updates.description !== undefined)
    updateData.description = updates.description?.trim() || null;
  if (updates.badge_label !== undefined)
    updateData.badge_label = updates.badge_label?.trim() || null;
  if (updates.subcatalog_ids !== undefined)
    updateData.subcatalog_ids = updates.subcatalog_ids;
  if (updates.quantity !== undefined)
    updateData.quantity = updates.quantity;
  if (updates.bundle_product_ids !== undefined)
    updateData.bundle_product_ids = updates.bundle_product_ids;
  if (updates.apply_automatically !== undefined)
    updateData.apply_automatically = updates.apply_automatically;
  if (updates.priority !== undefined) updateData.priority = updates.priority;
  if (updates.trigger_product_ids !== undefined)
    updateData.trigger_product_ids = updates.trigger_product_ids;
  if (updates.trigger_quantity !== undefined)
    updateData.trigger_quantity = updates.trigger_quantity;
  if (updates.free_quantity_per_trigger !== undefined)
    updateData.free_quantity_per_trigger = updates.free_quantity_per_trigger;
  if (updates.free_quantity_max !== undefined)
    updateData.free_quantity_max = updates.free_quantity_max;

  const { data: updated, error } = await admin
    .from("promotions")
    .update(updateData)
    .eq("id", promotion_id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(updated);
}

export async function DELETE(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const promotionId = searchParams.get("promotion_id");

  if (!promotionId) {
    return NextResponse.json(
      { error: "promotion_id is required" },
      { status: 400 },
    );
  }

  const admin = createAdminClient();
  const { data: promotion } = await admin
    .from("promotions")
    .select("tenant_id")
    .eq("id", promotionId)
    .single();

  if (!promotion) {
    return NextResponse.json({ error: "Promotion not found" }, { status: 404 });
  }

  const { data: membership } = await admin
    .from("tenant_memberships")
    .select("role:tenant_roles(name, permissions)")
    .eq("user_id", user.id)
    .eq("tenant_id", promotion.tenant_id)
    .single();

  const rawRole = membership?.role as
    | { name: string; permissions: string[] }
    | { name: string; permissions: string[] }[]
    | null
    | undefined;
  const role = Array.isArray(rawRole) ? rawRole[0] : rawRole;
  const canWrite =
    role &&
    (role.name === "owner" ||
      (Array.isArray(role.permissions) &&
        role.permissions.includes("promotions.write")));

  if (!canWrite) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { error } = await admin
    .from("promotions")
    .delete()
    .eq("id", promotionId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
