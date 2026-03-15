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
  const subscriptionId = searchParams.get("subscription_id");
  const status = searchParams.get("status");
  const type = searchParams.get("type");

  // ── Single subscription detail ──────────────────────────────────────────────
  if (subscriptionId) {
    const { data: subscription, error: subError } = await supabase
      .from("subscriptions")
      .select(
        `
        *,
        payments:subscription_payments(
          id, installment_number, amount, service_fee, net_amount,
          order_id, mp_payment_id, status, created_at
        )
        `
      )
      .eq("id", subscriptionId)
      .single();

    if (subError || !subscription) {
      return NextResponse.json(
        { error: subError?.message ?? "Subscription not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(subscription);
  }

  // ── List subscriptions ──────────────────────────────────────────────────────
  if (!tenantId) {
    return NextResponse.json(
      { error: "tenant_id or subscription_id is required" },
      { status: 400 }
    );
  }

  const { data: membership } = await supabase
    .from("tenant_memberships")
    .select("id")
    .eq("tenant_id", tenantId)
    .eq("user_id", user.id)
    .single();

  if (!membership) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let query = supabase
    .from("subscriptions")
    .select(
      `
      id, type, status, concept, customer_name, customer_email,
      charge_amount, frequency, frequency_type,
      total_installments, completed_installments,
      discount_percent, original_amount, discounted_amount,
      created_at, cancelled_at, start_date
      `
    )
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false });

  if (status?.trim()) {
    query = query.eq("status", status.trim());
  }
  if (type?.trim()) {
    query = query.eq("type", type.trim());
  }

  const { data: subscriptions, error: listError } = await query;

  if (listError) {
    return NextResponse.json(
      { error: listError.message },
      { status: 500 }
    );
  }

  return NextResponse.json(subscriptions ?? []);
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

  let body: { subscription_id?: string; action?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { subscription_id, action } = body;

  if (!subscription_id || !action) {
    return NextResponse.json(
      { error: "subscription_id and action are required" },
      { status: 400 }
    );
  }

  if (!["pause", "cancel"].includes(action)) {
    return NextResponse.json(
      { error: "action must be 'pause' or 'cancel'" },
      { status: 400 }
    );
  }

  const admin = createAdminClient();

  const { data: subscription, error: subError } = await admin
    .from("subscriptions")
    .select("id, tenant_id, status, mp_preapproval_id")
    .eq("id", subscription_id)
    .single();

  if (subError || !subscription) {
    return NextResponse.json(
      { error: "Subscription not found" },
      { status: 404 }
    );
  }

  // Verify membership
  const { data: membership } = await supabase
    .from("tenant_memberships")
    .select("id")
    .eq("tenant_id", subscription.tenant_id)
    .eq("user_id", user.id)
    .single();

  if (!membership) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Validate transition
  const ALLOWED_TRANSITIONS: Record<string, string[]> = {
    pause: ["active"],
    cancel: ["active", "paused", "pending_setup", "card_failed"],
  };

  if (!ALLOWED_TRANSITIONS[action]?.includes(subscription.status)) {
    return NextResponse.json(
      { error: `No se puede ${action === "pause" ? "pausar" : "cancelar"} una suscripción con estado '${subscription.status}'` },
      { status: 400 }
    );
  }

  const newStatus = action === "pause" ? "paused" : "cancelled";
  const updateData: Record<string, unknown> = {
    status: newStatus,
    updated_at: new Date().toISOString(),
  };
  if (action === "cancel") {
    updateData.cancelled_at = new Date().toISOString();
  }

  const { error: updateError } = await admin
    .from("subscriptions")
    .update(updateData)
    .eq("id", subscription_id);

  if (updateError) {
    return NextResponse.json(
      { error: updateError.message },
      { status: 500 }
    );
  }

  // If MP preapproval exists, try to cancel/pause in MP too
  if (subscription.mp_preapproval_id && action === "cancel") {
    try {
      const { PreApproval, MercadoPagoConfig } = await import("mercadopago");
      const mpConfig = new MercadoPagoConfig({
        accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN!,
      });
      const preApproval = new PreApproval(mpConfig);
      await preApproval.update({
        id: subscription.mp_preapproval_id,
        body: { status: "cancelled" },
      });
    } catch (err) {
      console.error("[subscriptions PATCH] Error cancelling MP preapproval:", err);
    }
  }

  if (subscription.mp_preapproval_id && action === "pause") {
    try {
      const { PreApproval, MercadoPagoConfig } = await import("mercadopago");
      const mpConfig = new MercadoPagoConfig({
        accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN!,
      });
      const preApproval = new PreApproval(mpConfig);
      await preApproval.update({
        id: subscription.mp_preapproval_id,
        body: { status: "paused" },
      });
    } catch (err) {
      console.error("[subscriptions PATCH] Error pausing MP preapproval:", err);
    }
  }

  return NextResponse.json({ success: true, status: newStatus });
}
