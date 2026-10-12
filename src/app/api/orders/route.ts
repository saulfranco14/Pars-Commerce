/* eslint-disable @typescript-eslint/no-explicit-any -- Commerce schema types are regenerated after the migration rollout. */
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getMexicoDateBounds } from "@/lib/dateBounds";
import { NextResponse } from "next/server";

import {
  assignedToMeFilter,
  canAccessOrder,
  resolveOrderAccess,
} from "@/features/orders/services/orderAccessService";
import { orderSearchFilter } from "@/features/orders/helpers/orderSearchFilter";
import { requirePermission } from "@/lib/auth/requirePermission";
import { ORDER_PERMISSIONS } from "@/features/orders/constants/orderPermissions";
import { serviceErrorToResponse } from "@/features/qr/services/serviceErrorToResponse";
import { resolveOrderFulfillmentMethod } from "@/features/orders/helpers/resolveOrderFulfillmentMethod";

import type { Database } from "@/types/database.types";

type OrderUpdate = Database["public"]["Tables"]["orders"]["Update"];

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
  const orderId = searchParams.get("order_id");
  const status = searchParams.get("status");
  const fulfillment = searchParams.get("fulfillment")?.trim() ?? "";
  const dateFrom = searchParams.get("date_from");
  const dateTo = searchParams.get("date_to");
  const scope = searchParams.get("scope");
  const searchTerm = searchParams.get("q");
  // `scheduled=1` es la vista de agenda: solo pedidos con hora de recolección,
  // y ordenados por esa hora en vez de por cuándo se crearon.
  const scheduledOnly = searchParams.get("scheduled") === "1";

  if (orderId) {
    // Estas columnas pertenecen al flujo ecommerce y todavía pueden no estar
    // reflejadas en el archivo generado de tipos. La consulta sigue siendo
    // segura: el acceso al tenant se valida inmediatamente después.
    const commerce = supabase as unknown as {
      from: (table: string) => any;
    };
    const { data: order, error: orderError } = await commerce
      .from("orders")
      .select(
        `
        id, order_number, tenant_id, status, fulfillment_status, fulfillment_method, delivery_fee, payment_verification_status, cancelled_from, source, order_type, qr_code_id, table_label, diner_count, customer_id, customer_name, customer_email, customer_phone, parent_order_id,
        subtotal, discount, total, paid_total, balance_due, payment_mode, payment_plan_status, created_at, updated_at, scheduled_for,
        created_by, assigned_to, completed_by, completed_at, paid_at,
        pickup_completed_at, pickup_completed_by,
        payment_method, payment_link, mp_preference_id,
        assigned_user:profiles!orders_assigned_to_fkey(id, display_name, email),
        pickup_completed_user:profiles!orders_pickup_completed_by_fkey(id, display_name, email),
        items:order_items(id, quantity, unit_price, subtotal, is_wholesale, wholesale_savings, product:products(id, name, type, image_url)),
        payments(id, provider, status, amount, metadata, created_at),
        payment_schedules:order_payment_schedules(id, installment_number, due_date, amount_due, amount_paid, status, paid_at),
        loan:loans!loans_order_id_fkey(id, status, amount, amount_pending, concept)
      `
      )
      .eq("id", orderId)
      .single();

    if (orderError || !order) {
      return NextResponse.json(
        { error: orderError?.message ?? "Order not found" },
        { status: 404 }
      );
    }

    const access = await resolveOrderAccess(user.id, order.tenant_id);
    if (!access.ok) return serviceErrorToResponse(access.error);
    if (!canAccessOrder(access.data, order)) {
      return NextResponse.json(
        { error: "Este pedido no está asignado a ti." },
        { status: 403 }
      );
    }

    // Supabase devuelve loan como array por ser relación 1-N; normalizar a objeto o null
    const loans = order.loan as unknown as unknown[];

    // Los pedidos complementarios ligados a este. Va en consulta aparte y no
    // como relación anidada porque `orders` se referencia a sí misma y
    // PostgREST necesitaría desambiguar la FK en cada `select` del archivo.
    const admin = createAdminClient() as unknown as {
      from: (table: string) => any;
      storage: {
        from: (bucket: string) => {
          createSignedUrl: (path: string, expiresIn: number) => Promise<{
            data: { signedUrl?: string } | null;
          }>;
        };
      };
    };
    const [
      { data: addenda },
      { data: deliveryDetails },
      { data: deliveryEvents },
      { data: transferProofs },
    ] =
      await Promise.all([
        commerce
          .from("orders")
          .select("id, status, total, created_at")
          .eq("parent_order_id", order.id)
          .order("created_at", { ascending: true }),
        commerce
          .from("order_delivery_details")
          .select(
            "recipient_name, recipient_phone, address_text, reference, pickup_point_id",
          )
          .eq("order_id", order.id)
          .maybeSingle(),
        commerce
          .from("order_delivery_events")
          .select("id, type, note, photo_path, created_at, created_by")
          .eq("order_id", order.id)
          .order("created_at", { ascending: true }),
        order.payment_verification_status === "proof_submitted"
          ? admin
              .from("order_transfer_proofs")
              .select(
                "id, status, file_type, amount_claimed, rejection_reason, storage_path, created_at",
              )
              .eq("order_id", order.id)
              .eq("status", "pending_review")
              .order("created_at", { ascending: false })
              .limit(1)
          : Promise.resolve({ data: [] }),
      ]);

    const latestProof = Array.isArray(transferProofs) ? transferProofs[0] : null;
    const signedProof = latestProof?.storage_path
      ? await admin.storage
          .from("order-payment-proofs")
          .createSignedUrl(latestProof.storage_path, 60 * 10)
      : null;
    const safeTransferProof = latestProof
      ? {
          id: latestProof.id,
          status: latestProof.status,
          file_type: latestProof.file_type,
          amount_claimed: latestProof.amount_claimed,
          rejection_reason: latestProof.rejection_reason,
          created_at: latestProof.created_at,
          signed_url: signedProof?.data?.signedUrl ?? null,
        }
      : null;

    const normalized = {
      ...order,
      loan: Array.isArray(loans) && loans.length > 0 ? loans[0] : null,
      addenda: addenda ?? [],
      delivery_details: deliveryDetails ?? null,
      delivery_events: deliveryEvents ?? [],
      transfer_proofs: safeTransferProof ? [safeTransferProof] : [],
    };
    return NextResponse.json(normalized);
  }

  if (!tenantId) {
    return NextResponse.json(
      { error: "tenant_id or order_id is required" },
      { status: 400 }
    );
  }

  const access = await resolveOrderAccess(user.id, tenantId);
  if (!access.ok) return serviceErrorToResponse(access.error);

  const allowedFulfillmentFilters = new Set([
    "",
    "received",
    "in_progress",
    "ready",
    "out_for_delivery",
    "delivered",
  ]);
  if (!allowedFulfillmentFilters.has(fulfillment)) {
    return NextResponse.json(
      { error: "Filtro de postventa no válido." },
      { status: 400 },
    );
  }

  const commerce = supabase as unknown as {
    from: (table: string) => any;
  };

  let query = commerce
    .from("orders")
    .select(
      `
      id, order_number, status, fulfillment_status, fulfillment_method, cancelled_from, source, order_type, qr_code_id, table_label, diner_count, customer_name, customer_email, total, paid_total, balance_due, payment_mode, payment_plan_status, created_at, paid_at, scheduled_for, pickup_completed_at, pickup_completed_by, assigned_to, created_by, payment_method,
      assigned_user:profiles!orders_assigned_to_fkey(id, display_name, email)
      `
    )
    .eq("tenant_id", tenantId);

  // La agenda se lee de lo más próximo a lo más lejano; el resto de la app
  // quiere lo más reciente primero.
  query = scheduledOnly
    ? query
        .not("scheduled_for", "is", null)
        .order("scheduled_for", { ascending: true })
    : query.order("created_at", { ascending: false });

  // Dos motivos distintos para recortar a "los míos", y el orden importa:
  // `scope=mine` es una preferencia de quien mira, mientras que la falta de
  // `orders.view_all` es una restricción. Se recorta si cualquiera aplica, y
  // nunca se amplía por venir `scope=all` en la URL.
  //
  // Se recorta en la consulta y no en memoria: traerse los pedidos ajenos para
  // descartarlos después los deja en la respuesta si alguien se salta el
  // filtro más adelante.
  if (!access.data.canViewAll || scope === "mine") {
    query = query.or(assignedToMeFilter(access.data));
  }

  if (searchTerm) {
    const filter = orderSearchFilter(searchTerm);
    // Un término que quedó vacío al sanearlo (solo signos) no debe devolver
    // todo el negocio como si nadie hubiera buscado nada.
    if (!filter) return NextResponse.json([]);
    query = query.or(filter);
  }

  if (status?.trim()) {
    query = query.eq("status", status.trim());
  }
  if (dateFrom?.trim()) {
    const { startUTC } = getMexicoDateBounds(dateFrom.trim());
    query = query.gte("created_at", startUTC);
  }
  if (dateTo?.trim()) {
    const { endUTC } = getMexicoDateBounds(dateTo.trim());
    query = query.lte("created_at", endUTC);
  }

  const { data: orders, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  let list = orders ?? [];
  if (list.length === 0) return NextResponse.json([]);

  // La postventa es un eje distinto al cobro. Los eventos de ruta/entrega no
  // viven en `orders.status`, así que se consultan juntos y se proyectan en la
  // bandeja sin convertir "pagada" en "terminada".
  const candidateOrderIds = list.map((order: { id: string }) => order.id);
  const admin = createAdminClient() as unknown as {
    from: (table: string) => any;
  };
  const [{ data: deliveryEvents }, { data: deliveryDetails }] =
    await Promise.all([
      admin
        .from("order_delivery_events")
        .select("order_id, type")
        .in("order_id", candidateOrderIds),
      admin
        .from("order_delivery_details")
        .select("order_id, address_text, pickup_point_id")
        .in("order_id", candidateOrderIds),
    ]);
  const deliveryEventTypesByOrder: Record<string, string[]> = {};
  for (const event of deliveryEvents ?? []) {
    const row = event as { order_id: string; type: string };
    deliveryEventTypesByOrder[row.order_id] ??= [];
    deliveryEventTypesByOrder[row.order_id].push(row.type);
  }
  const deliveryDetailsByOrder: Record<
    string,
    { address_text?: string | null; pickup_point_id?: string | null }
  > = {};
  for (const detail of deliveryDetails ?? []) {
    const row = detail as {
      order_id: string;
      address_text?: string | null;
      pickup_point_id?: string | null;
    };
    deliveryDetailsByOrder[row.order_id] = row;
  }

  if (fulfillment) {
    list = list.filter((order: any) => {
      if (order.source !== "public_store") return false;
      const eventTypes = deliveryEventTypesByOrder[order.id] ?? [];
      const method = resolveOrderFulfillmentMethod({
        ...order,
        delivery_details: deliveryDetailsByOrder[order.id],
      });
      const finished = eventTypes.some((type) =>
        method === "delivery"
          ? type === "delivered"
          : type === "pickup_completed",
      );
      const inTransit = eventTypes.includes("out_for_delivery") && !finished;
      if (fulfillment === "delivered") return finished;
      if (fulfillment === "out_for_delivery") return inTransit;
      if (
        !["paid", "completed"].includes(order.status) ||
        finished ||
        inTransit
      ) {
        return false;
      }
      return (order.fulfillment_status ?? "received") === fulfillment;
    });
  }

  if (list.length === 0) return NextResponse.json([]);

  const orderIds = list.map((o: { id: string }) => o.id);
  const { data: items } = await supabase
    .from("order_items")
    .select("order_id, product_id")
    .in("order_id", orderIds);

  const productIds = [
    ...new Set(
      (items ?? []).map((it) => (it as { product_id: string }).product_id)
    ),
  ];
  const productTypes: Record<string, string> = {};
  if (productIds.length > 0) {
    const { data: prods } = await supabase
      .from("products")
      .select("id, type")
      .in("id", productIds);
    for (const p of prods ?? []) {
      productTypes[p.id] = p.type;
    }
  }

  const productsCountByOrder: Record<string, number> = {};
  const servicesCountByOrder: Record<string, number> = {};
  for (const it of items ?? []) {
    const oid = (it as { order_id: string }).order_id;
    const pid = (it as { product_id: string }).product_id;
    const type = productTypes[pid];
    if (type === "product") {
      productsCountByOrder[oid] = (productsCountByOrder[oid] ?? 0) + 1;
    } else if (type === "service") {
      servicesCountByOrder[oid] = (servicesCountByOrder[oid] ?? 0) + 1;
    }
  }

  // Complementos de los pedidos listados, en una sola consulta. Sin esto, un
  // pedido cuyo cobro se repartió en dos se lee en la lista como si se hubiera
  // cobrado de menos.
  const { data: addenda } = await supabase
    .from("orders")
    .select("parent_order_id")
    .in("parent_order_id", orderIds);

  const addendaCountByOrder: Record<string, number> = {};
  for (const a of addenda ?? []) {
    const pid = (a as { parent_order_id: string }).parent_order_id;
    addendaCountByOrder[pid] = (addendaCountByOrder[pid] ?? 0) + 1;
  }

  const withType = list.map((o: any) => {
    const deliveryDetail = deliveryDetailsByOrder[o.id] ?? null;
    return {
      ...o,
      fulfillment_method: resolveOrderFulfillmentMethod({
        ...o,
        delivery_details: deliveryDetail,
      }),
      delivery_event_types: deliveryEventTypesByOrder[o.id] ?? [],
      products_count: productsCountByOrder[o.id] ?? 0,
      services_count: servicesCountByOrder[o.id] ?? 0,
      addenda_count: addendaCountByOrder[o.id] ?? 0,
    };
  });

  return NextResponse.json(withType);
}

const ALLOWED_TRANSITIONS: Record<string, string[]> = {
  draft: ["assigned", "in_progress", "cancelled"],
  assigned: ["in_progress", "cancelled"],
  in_progress: ["completed", "cancelled"],
  completed: ["pending_payment", "paid"],
  pending_payment: ["partial", "paid", "cancelled"],
  pending_pickup: ["paid", "cancelled"],
  pending_subscription: ["installment_active", "cancelled"],
  installment_active: ["partial", "paid", "cancelled"],
  partial: ["paid", "cancelled"],
  paid: ["cancelled"],
  cancelled: [],
};

export async function PATCH(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const {
    order_id,
    status,
    assigned_to,
    payment_method,
    customer_id,
    customer_name,
    customer_email,
    customer_phone,
    discount,
  } = body as {
    order_id: string;
    status?: string;
    assigned_to?: string | null;
    payment_method?: string | null;
    customer_id?: string | null;
    customer_name?: string | null;
    customer_email?: string | null;
    customer_phone?: string | null;
    discount?: number;
  };

  if (!order_id) {
    return NextResponse.json(
      { error: "order_id is required" },
      { status: 400 }
    );
  }

  const { data: order, error: fetchError } = await supabase
    .from("orders")
    .select("id, status, tenant_id, subtotal, total, paid_total, assigned_to, created_by")
    .eq("id", order_id)
    .single();

  if (fetchError || !order) {
    return NextResponse.json(
      { error: fetchError?.message ?? "Order not found" },
      { status: 404 }
    );
  }

  const access = await resolveOrderAccess(user.id, order.tenant_id);
  if (!access.ok) return serviceErrorToResponse(access.error);

  if (!canAccessOrder(access.data, order)) {
    return NextResponse.json(
      { error: "Este pedido no está asignado a ti." },
      { status: 403 }
    );
  }

  if (!access.data.canWrite) {
    return NextResponse.json(
      { error: "Tu rol solo puede consultar pedidos." },
      { status: 403 }
    );
  }

  if (status === "cancelled" && !access.data.canClose) {
    return NextResponse.json(
      { error: "Tu rol no puede cancelar pedidos." },
      { status: 403 }
    );
  }

  // "Asignar" es CAMBIAR de dueño. Reenviar el mismo valor no es un cambio y
  // no se cobra permiso por ello: hay flujos que mandan `assigned_to` junto
  // con otro campo sin intención de reasignar nada.
  const nextAssignee = assigned_to === undefined ? undefined : assigned_to || null;
  const changesAssignee =
    nextAssignee !== undefined && nextAssignee !== order.assigned_to;

  if (changesAssignee) {
    // Quedarse un pedido que no tiene dueño es TOMARLO, y para eso basta
    // `order.take`. `orders.assign` es para repartir el trabajo de otros: dar
    // un pedido a alguien más, o quitárselo a quien ya lo tenía.
    const takingItForMyself =
      nextAssignee === user.id && order.assigned_to === null;

    if (!takingItForMyself && !access.data.canAssign) {
      return NextResponse.json(
        { error: "Tu rol no puede repartir pedidos." },
        { status: 403 }
      );
    }
    // Reasignar un pedido pagado reescribe a quién se le atribuye la venta,
    // así que pide el permiso más estricto aunque el rol sí pueda repartir.
    if (order.status === "paid" && !access.data.canTouchPaid) {
      return NextResponse.json(
        {
          error:
            "Solo el propietario del negocio puede cambiar la asignación en pedidos ya pagados.",
        },
        { status: 403 }
      );
    }
  }

  const updates: OrderUpdate = {
    updated_at: new Date().toISOString(),
  };

  if (status !== undefined) {
    const allowed = ALLOWED_TRANSITIONS[order.status];
    if (!allowed?.includes(status)) {
      return NextResponse.json(
        { error: `Cannot transition from ${order.status} to ${status}` },
        { status: 409 }
      );
    }
    if (status === "in_progress" || status === "completed") {
      const { count } = await supabase
        .from("order_items")
        .select("id", { count: "exact", head: true })
        .eq("order_id", order_id);
      if ((count ?? 0) === 0) {
        return NextResponse.json(
          { error: "La orden debe tener al menos un item para iniciar o completar" },
          { status: 400 }
        );
      }
    }
    updates.status = status;
    if (status === "cancelled") {
      updates.cancelled_from = order.status;
    }
    if (status === "paid") {
      updates.paid_at = new Date().toISOString();
      updates.paid_total = Number(order.total ?? 0);
      updates.balance_due = 0;
    }
    if (status === "partial") {
      const paidTotal = Number(order.paid_total ?? 0);
      updates.paid_total = paidTotal;
      updates.balance_due = Math.max(0, Number(order.total ?? 0) - paidTotal);
    }
    if (status === "completed") {
      updates.completed_at = new Date().toISOString();
      updates.completed_by = user.id;
    }
  }

  if (assigned_to !== undefined) updates.assigned_to = assigned_to || null;
  if (payment_method !== undefined)
    updates.payment_method = payment_method?.trim() || null;

  const hasCustomerUpdate =
    customer_id !== undefined ||
    customer_name !== undefined ||
    customer_email !== undefined ||
    customer_phone !== undefined;
  if (hasCustomerUpdate && order.status === "paid") {
    return NextResponse.json(
      { error: "No se puede editar el cliente en órdenes ya pagadas" },
      { status: 409 }
    );
  }
  if (customer_id !== undefined) updates.customer_id = customer_id;
  if (customer_name !== undefined)
    updates.customer_name = customer_name?.trim() || null;
  if (customer_email !== undefined)
    updates.customer_email = customer_email?.trim() || null;
  if (customer_phone !== undefined)
    updates.customer_phone = customer_phone?.trim() || null;

  const editableStatuses = ["draft", "assigned", "in_progress"];
  if (discount !== undefined) {
    if (!editableStatuses.includes(order.status)) {
      return NextResponse.json(
        { error: "Solo se puede editar descuento en órdenes en edición" },
        { status: 409 }
      );
    }
    const discountVal = Math.max(0, Number(discount));
    const subtotalVal = Number(order.subtotal);
    if (discountVal > subtotalVal) {
      return NextResponse.json(
        { error: "El descuento no puede ser mayor al subtotal" },
        { status: 400 }
      );
    }
    updates.discount = discountVal;
    updates.total = Math.max(0, subtotalVal - discountVal);
  }

  const { data: updated, error } = await supabase
    .from("orders")
    .update(updates)
    .eq("id", order_id)
    .select("id, status, assigned_to, paid_at, subtotal, discount, total")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Un cambio de dueño se registra: es la única forma de responder "¿quién le
  // pasó este pedido a quién?" cuando la comisión de una venta se discute.
  // Se hace después del UPDATE y sin bloquear la respuesta — si el log falla,
  // el pedido ya se reasignó y negarlo sería peor.
  if (changesAssignee) {
    await supabase.from("order_activity_log").insert({
      order_id,
      actor_type: "member",
      actor_id: user.id,
      actor_label: "personal",
      action: "order.assigned",
      payload: { from: order.assigned_to, to: nextAssignee },
    });
  }

  return NextResponse.json(updated);
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

  const body = await request.json();
  const {
    tenant_id,
    customer_id,
    customer_name,
    customer_email,
    customer_phone,
    assigned_to,
  } = body as {
    tenant_id: string;
    customer_id?: string;
    customer_name?: string;
    customer_email?: string;
    customer_phone?: string;
    assigned_to?: string;
  };

  if (!tenant_id) {
    return NextResponse.json(
      { error: "tenant_id is required" },
      { status: 400 }
    );
  }

  if (customer_id) {
    const { data: customer } = await supabase
      .from("customers")
      .select("id")
      .eq("id", customer_id)
      .eq("tenant_id", tenant_id)
      .maybeSingle();

    if (!customer) {
      return NextResponse.json(
        { error: "El cliente no pertenece a este negocio." },
        { status: 400 },
      );
    }
  }

  const taker = await requirePermission(
    user.id,
    tenant_id,
    ORDER_PERMISSIONS.take
  );
  if (!taker) {
    return NextResponse.json(
      { error: "Tu rol no puede levantar pedidos." },
      { status: 403 }
    );
  }

  // Levantar un pedido a nombre de otra persona es asignar, y eso es un
  // permiso aparte: `order.take` autoriza tomarlo, no repartirlo.
  if (assigned_to && assigned_to !== user.id) {
    const assigner = await requirePermission(
      user.id,
      tenant_id,
      ORDER_PERMISSIONS.assign
    );
    if (!assigner) {
      return NextResponse.json(
        { error: "Tu rol no puede asignar pedidos a otra persona." },
        { status: 403 }
      );
    }
  }

  // Quien lo toma, lo tiene. Sin esto el pedido nace sin dueño y quien lo
  // levantó deja de verlo en cuanto su rol se limita a los suyos.
  const owner_id = assigned_to || user.id;

  const { data: order, error } = await supabase
    .from("orders")
    .insert({
      tenant_id,
      status: "assigned",
      subtotal: 0,
      discount: 0,
      total: 0,
      source: "dashboard",
      created_by: user.id,
      assigned_to: owner_id,
      customer_id: customer_id ?? null,
      customer_name: customer_name?.trim() || null,
      customer_email: customer_email?.trim() || null,
      customer_phone: customer_phone?.trim() || null,
    })
    .select("id, status, customer_name, total, created_at")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(order);
}
