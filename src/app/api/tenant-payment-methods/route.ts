import { resolveUserError } from "@/lib/errors/resolveUserError";
import { createClient } from "@/lib/supabase/server";
import { requirePermission } from "@/lib/auth/requirePermission";
import { NextResponse } from "next/server";

async function canWriteSettings(userId: string, tenantId: string) {
  const result = await requirePermission(userId, tenantId, "settings.write");
  return !!result;
}

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

  if (!tenantId) {
    return NextResponse.json({ error: "tenant_id is required" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("tenant_payment_methods")
    .select(
      "id, tenant_id, kind, label, bank_name, account_holder, clabe, account_number, is_active, display_order, created_at, updated_at",
    )
    .eq("tenant_id", tenantId)
    .order("display_order", { ascending: true });

  if (error) {
    return NextResponse.json(
      { error: resolveUserError(error, "supabase") },
      { status: 500 },
    );
  }

  return NextResponse.json(data ?? []);
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

  const body = (await request.json()) as Record<string, unknown>;
  const tenantId = String(body.tenant_id ?? "");
  if (!tenantId) {
    return NextResponse.json({ error: "tenant_id is required" }, { status: 400 });
  }

  const allowed = await canWriteSettings(user.id, tenantId);
  if (!allowed) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const payload = {
    tenant_id: tenantId,
    kind: String(body.kind ?? "bank_transfer"),
    label: typeof body.label === "string" ? body.label.trim() || null : null,
    bank_name:
      typeof body.bank_name === "string" ? body.bank_name.trim() || null : null,
    account_holder:
      typeof body.account_holder === "string"
        ? body.account_holder.trim() || null
        : null,
    clabe: typeof body.clabe === "string" ? body.clabe.trim() || null : null,
    account_number:
      typeof body.account_number === "string"
        ? body.account_number.trim() || null
        : null,
    is_active: typeof body.is_active === "boolean" ? body.is_active : true,
    display_order: Number(body.display_order ?? 0),
  };

  // Check for duplicate CLABE within the same tenant before inserting.
  if (payload.clabe) {
    const { data: existing } = await supabase
      .from("tenant_payment_methods")
      .select("id")
      .eq("tenant_id", tenantId)
      .eq("clabe", payload.clabe)
      .maybeSingle();

    if (existing) {
      return NextResponse.json(
        { error: "Ya existe una cuenta con esa CLABE en este negocio." },
        { status: 409 },
      );
    }
  }

  const { data, error } = await supabase
    .from("tenant_payment_methods")
    .insert(payload)
    .select(
      "id, tenant_id, kind, label, bank_name, account_holder, clabe, account_number, is_active, display_order, created_at, updated_at",
    )
    .single();

  if (error) {
    return NextResponse.json(
      { error: resolveUserError(error, "supabase") },
      { status: 500 },
    );
  }

  return NextResponse.json(data, { status: 201 });
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

  const body = (await request.json()) as Record<string, unknown>;
  const id = String(body.id ?? "");
  const tenantId = String(body.tenant_id ?? "");

  if (!id || !tenantId) {
    return NextResponse.json(
      { error: "id y tenant_id son requeridos" },
      { status: 400 },
    );
  }

  const allowed = await canWriteSettings(user.id, tenantId);
  if (!allowed) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const updates: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };
  if (typeof body.kind === "string") updates.kind = body.kind;
  if (body.label !== undefined)
    updates.label = body.label === null ? null : String(body.label);
  if (body.bank_name !== undefined)
    updates.bank_name = body.bank_name === null ? null : String(body.bank_name);
  if (body.account_holder !== undefined)
    updates.account_holder =
      body.account_holder === null ? null : String(body.account_holder);
  if (body.clabe !== undefined)
    updates.clabe = body.clabe === null ? null : String(body.clabe);
  if (body.account_number !== undefined)
    updates.account_number =
      body.account_number === null ? null : String(body.account_number);
  if (typeof body.is_active === "boolean") updates.is_active = body.is_active;
  if (body.display_order !== undefined)
    updates.display_order = Number(body.display_order);

  // When activating a record, first deactivate all others for this tenant
  // so only one account can be active at a time.
  if (updates.is_active === true) {
    const { error: deactivateError } = await supabase
      .from("tenant_payment_methods")
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq("tenant_id", tenantId)
      .neq("id", id);

    if (deactivateError) {
      return NextResponse.json(
        { error: resolveUserError(deactivateError, "supabase") },
        { status: 500 },
      );
    }
  }

  const { data, error } = await supabase
    .from("tenant_payment_methods")
    .update(updates)
    .eq("id", id)
    .eq("tenant_id", tenantId)
    .select(
      "id, tenant_id, kind, label, bank_name, account_holder, clabe, account_number, is_active, display_order, created_at, updated_at",
    )
    .single();

  if (error) {
    return NextResponse.json(
      { error: resolveUserError(error, "supabase") },
      { status: 500 },
    );
  }

  return NextResponse.json(data);
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
  const id = searchParams.get("id");
  const tenantId = searchParams.get("tenant_id");

  if (!id || !tenantId) {
    return NextResponse.json(
      { error: "id y tenant_id son requeridos" },
      { status: 400 },
    );
  }

  const allowed = await canWriteSettings(user.id, tenantId);
  if (!allowed) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { error } = await supabase
    .from("tenant_payment_methods")
    .delete()
    .eq("id", id)
    .eq("tenant_id", tenantId);

  if (error) {
    return NextResponse.json(
      { error: resolveUserError(error, "supabase") },
      { status: 500 },
    );
  }

  return NextResponse.json({ success: true });
}
