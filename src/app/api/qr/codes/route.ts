import { resolveUserError } from "@/lib/errors/resolveUserError";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { requirePermission } from "@/lib/auth/requirePermission";
import { NextResponse } from "next/server";

import type { Database, Json } from "@/types/database.types";

type QrCodeUpdate = Database["public"]["Tables"]["qr_codes"]["Update"];

type QrKind = "payment" | "table";

function normalizeKind(value: unknown): QrKind | null {
  if (value === "payment" || value === "table") return value;
  return null;
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
  const kind = searchParams.get("kind");
  const includeArchived = searchParams.get("include_archived") === "true";

  if (!tenantId) {
    return NextResponse.json({ error: "tenant_id is required" }, { status: 400 });
  }

  const canRead = await requirePermission(user.id, tenantId, "qr.read");
  if (!canRead) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let query = supabase
    .from("qr_codes")
    .select(
      "id, tenant_id, token, kind, label, table_capacity, preset_amount, preset_concept, allow_amount_override, print_template, metadata, is_active, archived_at, current_order_id, created_at, updated_at",
    )
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false });

  if (!includeArchived) query = query.is("archived_at", null);
  if (kind === "payment" || kind === "table") query = query.eq("kind", kind);

  const { data, error } = await query;
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
  const kind = normalizeKind(body.kind);
  const label = String(body.label ?? "").trim();
  const tableCapacity =
    body.table_capacity === null || body.table_capacity === undefined
      ? null
      : Number(body.table_capacity);
  const presetAmount =
    body.preset_amount === null || body.preset_amount === undefined
      ? null
      : Number(body.preset_amount);

  if (!tenantId || !kind || !label) {
    return NextResponse.json(
      { error: "tenant_id, kind y label son requeridos" },
      { status: 400 },
    );
  }

  const canWrite = await requirePermission(user.id, tenantId, "qr.write");
  if (!canWrite) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const admin = createAdminClient();
  const { data: membership } = await admin
    .from("tenant_memberships")
    .select("id")
    .eq("tenant_id", tenantId)
    .eq("user_id", user.id)
    .single();

  const token = crypto.randomUUID().replace(/-/g, "");
  const { data, error } = await admin
    .from("qr_codes")
    .insert({
      tenant_id: tenantId,
      token,
      kind,
      label,
      table_capacity: kind === "table" ? tableCapacity ?? null : null,
      preset_amount: kind === "payment" ? presetAmount : null,
      preset_concept:
        kind === "payment" && typeof body.preset_concept === "string"
          ? body.preset_concept.trim() || null
          : null,
      allow_amount_override:
        kind === "payment" && typeof body.allow_amount_override === "boolean"
          ? body.allow_amount_override
          : true,
      print_template:
        typeof body.print_template === "string" ? body.print_template : null,
      metadata:
        body.metadata && typeof body.metadata === "object"
          ? (body.metadata as Json)
          : null,
      created_by: canWrite?.membershipId ?? membership?.id ?? null,
    })
    .select(
      "id, tenant_id, token, kind, label, table_capacity, preset_amount, preset_concept, allow_amount_override, print_template, metadata, is_active, archived_at, current_order_id, created_at, updated_at",
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
  const qrId = String(body.id ?? "");
  const tenantId = String(body.tenant_id ?? "");

  if (!tenantId || !qrId) {
    return NextResponse.json(
      { error: "tenant_id e id son requeridos" },
      { status: 400 },
    );
  }

  const canWrite = await requirePermission(user.id, tenantId, "qr.write");
  if (!canWrite) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const updates: QrCodeUpdate = {
    updated_at: new Date().toISOString(),
  };

  if (typeof body.label === "string") updates.label = body.label.trim();
  if (typeof body.is_active === "boolean") updates.is_active = body.is_active;
  if (typeof body.print_template === "string")
    updates.print_template = body.print_template;
  if (body.metadata && typeof body.metadata === "object")
    updates.metadata = body.metadata as Json;
  if (typeof body.allow_amount_override === "boolean")
    updates.allow_amount_override = body.allow_amount_override;
  if (body.table_capacity !== undefined)
    updates.table_capacity =
      body.table_capacity === null ? null : Number(body.table_capacity);
  if (body.preset_amount !== undefined)
    updates.preset_amount =
      body.preset_amount === null ? null : Number(body.preset_amount);
  if (body.preset_concept !== undefined)
    updates.preset_concept =
      body.preset_concept === null ? null : String(body.preset_concept);

  const { data, error } = await supabase
    .from("qr_codes")
    .update(updates)
    .eq("id", qrId)
    .eq("tenant_id", tenantId)
    .select(
      "id, tenant_id, token, kind, label, table_capacity, preset_amount, preset_concept, allow_amount_override, print_template, metadata, is_active, archived_at, current_order_id, created_at, updated_at",
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
  const tenantId = searchParams.get("tenant_id");
  const qrId = searchParams.get("id");

  if (!tenantId || !qrId) {
    return NextResponse.json(
      { error: "tenant_id e id son requeridos" },
      { status: 400 },
    );
  }

  const canWrite = await requirePermission(user.id, tenantId, "qr.write");
  if (!canWrite) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { data, error } = await supabase
    .from("qr_codes")
    .update({ archived_at: new Date().toISOString(), is_active: false })
    .eq("id", qrId)
    .eq("tenant_id", tenantId)
    .select("id, archived_at, is_active")
    .single();

  if (error) {
    return NextResponse.json(
      { error: resolveUserError(error, "supabase") },
      { status: 500 },
    );
  }

  return NextResponse.json(data);
}
