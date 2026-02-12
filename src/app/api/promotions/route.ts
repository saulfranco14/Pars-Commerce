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
      { status: 400 }
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
        { status: 404 }
      );
    }
    return NextResponse.json(promotion);
  }

  let query = supabase
    .from("promotions")
    .select("id, name, type, value, min_amount, product_ids, valid_from, valid_until, created_at")
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
    type?: string;
    value?: number;
    min_amount?: number;
    product_ids?: string[];
    valid_from?: string;
    valid_until?: string;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { tenant_id, name, type, value, min_amount, product_ids, valid_from, valid_until } = body;

  if (!tenant_id || !name || !type || value == null || value < 0) {
    return NextResponse.json(
      { error: "tenant_id, name, type and value (>= 0) are required" },
      { status: 400 }
    );
  }

  if (!["percentage", "fixed_amount"].includes(type)) {
    return NextResponse.json(
      { error: "type must be percentage or fixed_amount" },
      { status: 400 }
    );
  }

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

  const { data: promotion, error } = await admin
    .from("promotions")
    .insert({
      tenant_id,
      name: name.trim(),
      type,
      value,
      min_amount: min_amount ?? null,
      product_ids: product_ids?.length ? product_ids : null,
      valid_from: valid_from || null,
      valid_until: valid_until || null,
    })
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
    type?: string;
    value?: number;
    min_amount?: number;
    product_ids?: string[] | null;
    valid_from?: string | null;
    valid_until?: string | null;
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
      { status: 400 }
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
  if (updates.type !== undefined) updateData.type = updates.type;
  if (updates.value !== undefined) updateData.value = updates.value;
  if (updates.min_amount !== undefined) updateData.min_amount = updates.min_amount;
  if (updates.product_ids !== undefined) updateData.product_ids = updates.product_ids;
  if (updates.valid_from !== undefined) updateData.valid_from = updates.valid_from;
  if (updates.valid_until !== undefined) updateData.valid_until = updates.valid_until;

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
      { status: 400 }
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

  const { error } = await admin.from("promotions").delete().eq("id", promotionId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
