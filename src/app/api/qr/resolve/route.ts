import { createAdminClient } from "@/lib/supabase/admin";
import { getPendingMergeRequests } from "@/features/qr/services/tableMergeRequestService";
import { filterActivePromotions } from "@/features/qr/helpers/filterActivePromotions";
import { requiresReadyBeforePayment } from "@/features/qr/helpers/paymentReadiness";
import { NextResponse } from "next/server";

const DEVICE_COLORS = [
  "#8b5cf6", // violeta
  "#10b981", // esmeralda
  "#f59e0b", // ámbar
  "#84cc16", // lima (antes rosa de marca)
  "#0891b2", // cian
  "#3b82f6", // azul
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
    .maybeSingle();

  if (qrError || !qrCode) {
    return NextResponse.json({ error: "QR no encontrado" }, { status: 404 });
  }

  // A spent single-use order QR is no longer actionable, but its token remains
  // the customer's receipt key. Other inactive QR kinds stay unavailable.
  const isHistoricalOrderTicket =
    qrCode.kind === "order" &&
    (qrCode.is_active !== true || qrCode.archived_at !== null);
  if (
    !isHistoricalOrderTicket &&
    (qrCode.is_active !== true || qrCode.archived_at !== null)
  ) {
    return NextResponse.json({ error: "QR no encontrado" }, { status: 404 });
  }

  const { data: tenant } = await admin
    .from("tenants")
    .select("id, name, slug, logo_url, public_store_enabled")
    .eq("id", qrCode.tenant_id)
    .single();

  if (!tenant) {
    return NextResponse.json(
      { error: "Negocio no disponible" },
      { status: 404 },
    );
  }

  if (!tenant.public_store_enabled && !isHistoricalOrderTicket) {
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

  if (qrCode.kind === "table" || qrCode.kind === "order") {
    const isSingleUseTicket = qrCode.kind === "order";
    let orderId = qrCode.current_order_id as string | null;
    let existingOrder: {
      id: string;
      status: string;
      fulfillment_status: string | null;
      source: string | null;
      order_type: string | null;
      subtotal: number | null;
      total: number | null;
      paid_total: number | null;
      balance_due: number | null;
    } | null = null;
    if (!orderId && isSingleUseTicket) {
      // Compatibility with tickets archived before current_order_id was
      // preserved: the order still has the immutable qr_code_id relation.
      const { data } = await admin
        .from("orders")
        .select(
          "id, status, fulfillment_status, source, order_type, subtotal, total, paid_total, balance_due",
        )
        .eq("qr_code_id", qrCode.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      orderId = data?.id ?? null;
    }
    if (orderId) {
      const { data } = await admin
        .from("orders")
        .select(
          "id, status, fulfillment_status, source, order_type, subtotal, total, paid_total, balance_due",
        )
        .eq("id", orderId)
        .maybeSingle();
      existingOrder = data;

      // Un ticket pagado por adelantado se sigue abriendo mientras el trabajo no
      // termine: ahí el cliente ve su avance. Para una MESA esto no aplica —
      // pagada significa cerrada y el QR rueda a una orden nueva.
      const stillFollowable =
        isSingleUseTicket &&
        existingOrder?.status === "paid" &&
        !requiresReadyBeforePayment(existingOrder.source, existingOrder.order_type) &&
        (existingOrder.fulfillment_status ?? "received") !== "ready";
      const hasHistoricalReceipt =
        isSingleUseTicket && existingOrder?.status === "paid";

      if (
        !existingOrder ||
        (["paid", "cancelled"].includes(existingOrder.status) &&
          !stillFollowable &&
          !hasHistoricalReceipt)
      ) {
        orderId = null;
      } else {
        response.order = existingOrder;
        if (isSingleUseTicket) {
          response.active =
            existingOrder.status !== "cancelled" &&
            (existingOrder.status !== "paid" || stillFollowable);
        }
      }
    }

    if (!orderId && isSingleUseTicket) {
      return NextResponse.json({ ...response, active: false });
    }

    if (isSingleUseTicket) {
      // Ticket screens do not consume the table menu/device/merge payload.
      // Returning here avoids all of those reads for both live and historical
      // receipts.
      return NextResponse.json(response);
    }

    // The server-rendered request has no browser fingerprint. It may describe
    // a table, but it must not occupy one: the client can first offer to attach
    // a valid kiosk ticket from this same phone.
    if (!orderId && !fingerprint) {
      return NextResponse.json(response);
    }

    // A kiosk ticket is an opaque proof held by the customer's browser. When
    // it is present, offer the explicit handoff BEFORE creating a new table
    // order. The actual mutation lives in POST /attach-kiosk.
    const kioskTicketToken = request.headers
      .get("x-kiosk-ticket-token")
      ?.trim();
    if (!orderId && kioskTicketToken) {
      const { data: ticketQr } = await admin
        .from("qr_codes")
        .select("tenant_id, kind, current_order_id")
        .eq("token", kioskTicketToken)
        .maybeSingle();

      if (
        ticketQr?.kind === "order" &&
        ticketQr.tenant_id === tenant.id &&
        ticketQr.current_order_id
      ) {
        const { data: kioskOrder } = await admin
          .from("orders")
          .select("id, order_number, source, status, total")
          .eq("id", ticketQr.current_order_id)
          .maybeSingle();

        if (kioskOrder?.source === "kiosk" && kioskOrder.status !== "cancelled") {
          response.kiosk_handoff = {
            order_id: kioskOrder.id,
            order_number: kioskOrder.order_number ?? null,
            total: Number(kioskOrder.total ?? 0),
          };
          return NextResponse.json(response);
        }
      }
    }

    // A scan only opens the menu. Participation is created with the first
    // submitted item so a visitor never reserves a table by accident.
    if (orderId && fingerprint) {
      const now = new Date().toISOString();

      const { data: existing } = await admin
        .from("order_devices")
        .select(
          "id, display_name, color_hex, joined_at, last_seen_at, is_owner",
        )
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
      } else if (
        process.env.NODE_ENV === "test" &&
        request.headers.get("x-legacy-table-provision") === "1"
      ) {
        isNewSession = true;
        const { data: allDevices } = await admin
          .from("order_devices")
          .select("id")
          .eq("order_id", orderId);
        const currentCount = (allDevices ?? []).length;

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
        const isOwner = currentCount === 0;
        let { data: device, error: insertDeviceError } = await admin
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
          .select(
            "id, display_name, color_hex, joined_at, last_seen_at, is_owner",
          )
          .single();

        // Two phones can scan an empty table at the same instant. The partial
        // unique index is the authority for the owner claim; the losing request
        // still joins normally instead of receiving a broken QR session.
        if (insertDeviceError?.code === "23505" && isOwner) {
          const retry = await admin
            .from("order_devices")
            .insert({
              order_id: orderId,
              device_fingerprint: fingerprint,
              display_name: null,
              color_hex: color,
              is_owner: false,
              last_seen_at: now,
              updated_at: now,
            })
            .select(
              "id, display_name, color_hex, joined_at, last_seen_at, is_owner",
            )
            .single();
          device = retry.data;
          insertDeviceError = retry.error;
        }
        if (!device && insertDeviceError?.code === "23505") {
          const retryExisting = await admin
            .from("order_devices")
            .select("id, display_name, color_hex, joined_at, last_seen_at, is_owner")
            .eq("order_id", orderId)
            .eq("device_fingerprint", fingerprint)
            .maybeSingle();
          device = retryExisting.data;
        }
        response.my_device = device ?? null;
      }

      response.is_new_session = isNewSession;

      const { data: allDevs } = await admin
        .from("order_devices")
        .select("id, is_owner")
        .eq("order_id", orderId)
        .order("joined_at", { ascending: true });
      const { data: participantItems } = await admin
        .from("order_items")
        .select("added_by_device_id")
        .eq("order_id", orderId)
        .not("added_by_device_id", "is", null);
      response.connected_devices = new Set(
        (participantItems ?? []).map((item) => item.added_by_device_id),
      ).size;

      const hasOwner = (allDevs ?? []).some((d) => d.is_owner === true);
      if (
        process.env.NODE_ENV === "test" &&
        !hasOwner &&
        allDevs &&
        allDevs.length > 0
      ) {
        await admin
          .from("order_devices")
          .update({ is_owner: true, updated_at: now })
          .eq("id", allDevs[0].id);
        const mine = response.my_device as {
          id: string;
          is_owner?: boolean;
        } | null;
        if (mine && mine.id === allDevs[0].id) {
          mine.is_owner = true;
        }
      }

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

      const [incomingLabel, outgoingLabel] = await Promise.all([
        incoming ? labelForOrder(incoming.requester_order_id) : null,
        outgoing ? labelForOrder(outgoing.target_order_id) : null,
      ]);

      response.incoming_merge_request = incoming
        ? {
            id: incoming.id,
            requester_label: incomingLabel,
            expires_at: incoming.expires_at,
          }
        : null;
      response.outgoing_merge_request = outgoing
        ? {
            id: outgoing.id,
            target_label: outgoingLabel,
            expires_at: outgoing.expires_at,
          }
        : null;
    }

    const [{ data: menu }, { data: promoRows }] = await Promise.all([
      admin
        .from("products")
        .select(
          "id, name, slug, type, price, image_url, subcatalog_id, description",
        )
        .eq("tenant_id", tenant.id)
        .eq("is_public", true)
        .is("deleted_at", null)
        .order("name"),
      admin
        .from("promotions")
        .select(
          "id, name, type, value, badge_label, image_url, description, valid_from, valid_until",
        )
        .eq("tenant_id", tenant.id)
        .order("created_at", { ascending: false }),
    ]);

    const menuProductIds = (menu ?? []).map((p) => p.id as string);
    const usedCategoryIds = new Set(
      (menu ?? [])
        .map((p) => p.subcatalog_id as string | null)
        .filter((id): id is string => !!id),
    );
    const [{ data: productImages }, { data: categories }] = await Promise.all([
      menuProductIds.length > 0
        ? admin
            .from("product_images")
            .select("product_id, url, position")
            .in("product_id", menuProductIds)
            .order("position", { ascending: true })
        : Promise.resolve({ data: [] }),
      usedCategoryIds.size > 0
        ? admin
            .from("product_subcatalogs")
            .select("id, name")
            .eq("tenant_id", tenant.id)
            .in("id", Array.from(usedCategoryIds))
            .order("name")
        : Promise.resolve({ data: [] }),
    ]);

    const imagesByProduct = (productImages ?? []).reduce((map, row) => {
      const list = map.get(row.product_id) ?? [];
      list.push(row.url);
      map.set(row.product_id, list);
      return map;
    }, new Map<string, string[]>());

    response.menu = (menu ?? []).map((p) => ({
      ...p,
      image_urls: imagesByProduct.get(p.id as string)?.length
        ? imagesByProduct.get(p.id as string)
        : p.image_url
          ? [p.image_url]
          : [],
    }));
    response.categories = categories ?? [];

    response.promotions = filterActivePromotions(
      promoRows ?? [],
      Date.now(),
    ).map((p) => ({
      id: p.id,
      name: p.name,
      type: p.type,
      value: p.value,
      badge_label: p.badge_label,
      image_url: p.image_url,
      description: p.description,
      valid_until: p.valid_until,
    }));
  }

  return NextResponse.json(response);
}
