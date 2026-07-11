import { resolveUserError } from "@/lib/errors/resolveUserError";
import { createAdminClient } from "@/lib/supabase/admin";
import { getPendingMergeRequests } from "@/features/qr/services/tableMergeRequestService";
import { NextResponse } from "next/server";

const DEVICE_COLORS = [
  "#3b82f6",
  "#8b5cf6",
  "#10b981",
  "#f59e0b",
  "#ec4899",
  "#14b8a6",
];

function pickColor(index: number) {
  return DEVICE_COLORS[index % DEVICE_COLORS.length];
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const token = (searchParams.get("token") ?? "").trim();
  const fingerprint = request.headers.get("x-fingerprint-id")?.trim() ?? null;

  if (!token) {
    return NextResponse.json({ error: "token is required" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: qrCode, error: qrError } = await admin
    .from("qr_codes")
    .select(
      "id, tenant_id, token, kind, label, table_capacity, preset_amount, preset_concept, allow_amount_override, is_active, archived_at, current_order_id",
    )
    .eq("token", token)
    .is("archived_at", null)
    .eq("is_active", true)
    .single();

  if (qrError || !qrCode) {
    return NextResponse.json({ error: "QR no encontrado" }, { status: 404 });
  }

  const { data: tenant } = await admin
    .from("tenants")
    .select("id, name, slug, logo_url, public_store_enabled")
    .eq("id", qrCode.tenant_id)
    .single();

  if (!tenant) {
    return NextResponse.json({ error: "Negocio no disponible" }, { status: 404 });
  }

  if (!tenant.public_store_enabled) {
    return NextResponse.json(
      { error: "La tienda pública de este negocio no está activa" },
      { status: 403 },
    );
  }

  const response: Record<string, unknown> = {
    tenant,
    qr_code: qrCode,
    kind: qrCode.kind,
  };

  if (qrCode.kind === "table") {
    // Note (LINK model): linked tables each keep their own live order + QR, so
    // scanning any table resolves its own order normally. The shared bill is
    // aggregated at read-time in the bill route via merge_group_id — no
    // redirect needed here.
    let orderId = qrCode.current_order_id as string | null;
    if (orderId) {
      const { data: existingOrder } = await admin
        .from("orders")
        .select("id, status, subtotal, total, paid_total, balance_due")
        .eq("id", orderId)
        .single();

      if (!existingOrder || ["paid", "cancelled"].includes(existingOrder.status)) {
        orderId = null;
      } else {
        response.order = existingOrder;
      }
    }

    if (!orderId) {
      const { data: order, error: orderError } = await admin
        .from("orders")
        .insert({
          tenant_id: tenant.id,
          status: "draft",
          subtotal: 0,
          total: 0,
          discount: 0,
          source: "qr_table",
          order_type: "dine_in",
          qr_code_id: qrCode.id,
          table_label: qrCode.label,
          diner_count: 0,
        })
        .select("id, status, subtotal, total, paid_total, balance_due")
        .single();

      if (orderError || !order) {
        return NextResponse.json(
          { error: resolveUserError(orderError, "supabase") },
          { status: 500 },
        );
      }
      orderId = order.id;
      response.order = order;
      await admin
        .from("qr_codes")
        .update({ current_order_id: order.id, updated_at: new Date().toISOString() })
        .eq("id", qrCode.id);
      await admin.from("order_activity_log").insert({
        order_id: order.id,
        actor_type: "system",
        actor_label: "sistema",
        action: "order.created",
        payload: { qr_code_id: qrCode.id, table_label: qrCode.label },
      });
    }

    if (fingerprint) {
      const now = new Date().toISOString();

      // Check if this device already has a row for THIS order. If not, it
      // means either (a) brand-new device, or (b) returning device whose
      // previous order already closed. In both cases the customer must go
      // through the name prompt again — we never silently revive a stale
      // identity onto a fresh order. The is_new_session flag tells the
      // client to clear the cached display_name in localStorage.
      const { data: existing } = await admin
        .from("order_devices")
        .select("id, display_name, color_hex, joined_at, last_seen_at, is_owner")
        .eq("order_id", orderId)
        .eq("device_fingerprint", fingerprint)
        .maybeSingle();

      let isNewSession = false;

      if (existing) {
        await admin
          .from("order_devices")
          .update({ last_seen_at: now, updated_at: now })
          .eq("id", existing.id);
        response.my_device = existing;
      } else {
        isNewSession = true;
        const { data: allDevices } = await admin
          .from("order_devices")
          .select("id")
          .eq("order_id", orderId);
        const currentCount = (allDevices ?? []).length;

        // Enforce table capacity: a brand-new device may only join if the
        // table still has room. Existing devices always pass (checked above),
        // so a returning customer is never locked out of their own table.
        const capacity = qrCode.table_capacity as number | null;
        if (capacity && capacity > 0 && currentCount >= capacity) {
          return NextResponse.json(
            {
              error: `Esta mesa ya está llena (${capacity} ${capacity === 1 ? "persona" : "personas"}). Pide al personal que te asigne otra o que amplíe la mesa.`,
              code: "table_full",
              capacity,
              connected_devices: currentCount,
            },
            { status: 409 },
          );
        }

        const color = pickColor(currentCount);
        // The first device to join is the table's responsible ("owner"): only
        // it (or staff) may approve merging another table into this one.
        const isOwner = currentCount === 0;
        const { data: device } = await admin
          .from("order_devices")
          .insert({
            order_id: orderId,
            device_fingerprint: fingerprint,
            display_name: null,
            color_hex: color,
            is_owner: isOwner,
            last_seen_at: now,
            updated_at: now,
          })
          .select("id, display_name, color_hex, joined_at, last_seen_at, is_owner")
          .single();
        response.my_device = device ?? null;
      }

      response.is_new_session = isNewSession;

      // One devices read gives us the connected count AND the owner check.
      // Self-heal: every order must have exactly one responsible ("owner") —
      // races on order re-creation or legacy rows can leave none, which would
      // block merge approvals forever. Promote the earliest-joined device.
      const { data: allDevs } = await admin
        .from("order_devices")
        .select("id, is_owner")
        .eq("order_id", orderId)
        .order("joined_at", { ascending: true });
      response.connected_devices = (allDevs ?? []).length;

      const hasOwner = (allDevs ?? []).some((d) => d.is_owner === true);
      if (!hasOwner && allDevs && allDevs.length > 0) {
        await admin
          .from("order_devices")
          .update({ is_owner: true, updated_at: now })
          .eq("id", allDevs[0].id);
        const mine = response.my_device as { id: string; is_owner?: boolean } | null;
        if (mine && mine.id === allDevs[0].id) {
          mine.is_owner = true;
        }
      }

      // Pending merge requests so the mesa/menu screen can surface an invite
      // without the customer opening the bill. (orderId is always set here.)
      const mergeOrderId = orderId as string;
      const nowIso = new Date().toISOString();
      const { incoming, outgoing } = await getPendingMergeRequests(
        admin,
        mergeOrderId,
        nowIso,
      );

      async function labelForOrder(otherOrderId: string): Promise<string> {
        const { data: o } = await admin
          .from("orders")
          .select("table_label")
          .eq("id", otherOrderId)
          .maybeSingle();
        return (o?.table_label as string | null) ?? "otra mesa";
      }

      response.incoming_merge_request = incoming
        ? {
            id: incoming.id,
            requester_label: await labelForOrder(incoming.requester_order_id),
            expires_at: incoming.expires_at,
          }
        : null;
      response.outgoing_merge_request = outgoing
        ? {
            id: outgoing.id,
            target_label: await labelForOrder(outgoing.target_order_id),
            expires_at: outgoing.expires_at,
          }
        : null;
    }

    const { data: menu } = await admin
      .from("products")
      .select("id, name, slug, type, price, image_url, subcatalog_id, description")
      .eq("tenant_id", tenant.id)
      .eq("is_public", true)
      .is("deleted_at", null)
      .order("name");

    response.menu = menu ?? [];

    // Categories (subcatalogs) so the menu can group products. Only the ones
    // that actually have public products are returned — no empty sections.
    const usedCategoryIds = new Set(
      (menu ?? [])
        .map((p) => p.subcatalog_id as string | null)
        .filter((id): id is string => !!id),
    );
    if (usedCategoryIds.size > 0) {
      const { data: categories } = await admin
        .from("product_subcatalogs")
        .select("id, name")
        .eq("tenant_id", tenant.id)
        .in("id", Array.from(usedCategoryIds))
        .order("name");
      response.categories = categories ?? [];
    } else {
      response.categories = [];
    }
  }

  return NextResponse.json(response);
}
