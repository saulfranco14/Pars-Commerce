import "server-only";
import { z } from "zod";
import { getPublicAppUrl } from "@/lib/env/appUrl";
import { requireStudioOwner, requireStudioAccess } from "./studioAccessService";
import { requireStudioData, StudioError } from "./studioErrors";
import { studioFlags } from "./studioFlags";
import { studioMpRequest } from "./studioPaymentProvider";
import { studioDb } from "./studioDb";
import { uuidSchema } from "../validations/studioSchemas";
import { safeNextPath } from "@/lib/auth/safeNextPath";
import type { StudioMpSubscription } from "./studioPaymentProvider";
import type { StudioRows } from "@/types/studio.database";

const checkoutSchema = z.object({
  tenant_id: uuidSchema,
  plan_code: z.enum(["basic", "pro", "business"]),
  catalog_version: z.number().int().positive(),
  idempotency_key: uuidSchema,
  return_to: z.string().max(2048).optional(),
});
async function studioReturnUrl(tenantId: string, raw?: string) {
  const { db } = await requireStudioAccess(tenantId);
  const tenant = requireStudioData(
    await db.from("tenants").select("slug").eq("id", tenantId).single(),
  );
  const base = `/dashboard/${encodeURIComponent(tenant.slug)}/studio`,
    next = safeNextPath(raw),
    parsed = new URL(next, getPublicAppUrl());
  const url = new URL(
    parsed.pathname === base || parsed.pathname.startsWith(`${base}/`)
      ? next
      : base,
    getPublicAppUrl(),
  );
  url.searchParams.set("payment", "pending");
  return url.toString();
}
export async function createStudioCheckout(raw: unknown) {
  const input = checkoutSchema.parse(raw);
  if (!studioFlags().checkout) throw new StudioError("NOT_CONFIGURED");
  const { db, user } = await requireStudioOwner(input.tenant_id);
  if (
    !requireStudioData(
      await db.rpc("studio_rate_limit", {
        p_scope: `billing:${input.tenant_id}`,
        p_limit: 5,
      }),
    )
  )
    throw new StudioError("RATE_LIMIT");
  const subscription = requireStudioData(
    await db.rpc("studio_begin_checkout", {
      p_tenant_id: input.tenant_id,
      p_actor_id: user.id,
      p_plan_code: input.plan_code,
      p_catalog_version: input.catalog_version,
      p_key: input.idempotency_key,
    }),
  ) as unknown as StudioRows["tenant_studio_subscriptions"] & {
    claimed: boolean;
  };
  if (subscription.mp_init_point) return { url: subscription.mp_init_point };
  if (!subscription.claimed)
    throw new StudioError(
      "PAYMENT_PENDING",
      "Estamos confirmando la solicitud anterior. No inicies otra compra.",
      409,
    );
  try {
    const result = await studioMpRequest<StudioMpSubscription>(
      "preapproval",
      "POST",
      {
        reason: `Tlaco ${input.plan_code === "basic" ? "Studio Básico" : input.plan_code === "pro" ? "Studio Pro" : "Studio Negocio"}`,
        external_reference: `studio_subscription:${subscription.id}`,
        payer_email: user.email,
        auto_recurring: {
          frequency: 1,
          frequency_type: "months",
          transaction_amount: Number(subscription.contracted_amount_mxn),
          currency_id: "MXN",
        },
        back_url: await studioReturnUrl(input.tenant_id, input.return_to),
        status: "pending",
      },
      input.idempotency_key,
    );
    if (!result.id || !result.init_point)
      throw new StudioError(
        "PAYMENT_PENDING",
        "La solicitud está pendiente de conciliación.",
        409,
      );
    requireStudioData(
      await db
        .from("tenant_studio_subscriptions")
        .update({
          mp_preapproval_id: result.id,
          mp_init_point: result.init_point,
          updated_at: new Date().toISOString(),
        })
        .eq("tenant_id", input.tenant_id)
        .eq("id", subscription.id)
        .select("id")
        .single(),
    );
    await db.from("studio_activity_events").insert({
      tenant_id: input.tenant_id,
      actor_id: user.id,
      action: "membership.checkout_started",
      entity_id: subscription.id,
    });
    return { url: result.init_point };
  } catch (error) {
    // An ambiguous provider failure stays pending to avoid a second recurring contract.
    console.error("[studio] subscription checkout pending reconciliation", {
      subscriptionId: subscription.id,
      code: error instanceof StudioError ? error.code : "NETWORK_ERROR",
    });
    throw error;
  }
}

export async function createStudioPackCheckout(raw: unknown) {
  const input = z
    .object({
      tenant_id: uuidSchema,
      pack_code: z.string().max(40),
      catalog_version: z.number().int().positive(),
      idempotency_key: uuidSchema,
      return_to: z.string().max(2048).optional(),
    })
    .parse(raw);
  if (!studioFlags().checkout) throw new StudioError("NOT_CONFIGURED");
  const { db, user } = await requireStudioAccess(
    input.tenant_id,
    "studio.manage",
    true,
  );
  if (
    !requireStudioData(
      await db.rpc("studio_rate_limit", {
        p_scope: `billing:${input.tenant_id}`,
        p_limit: 5,
      }),
    )
  )
    throw new StudioError("RATE_LIMIT");
  const pack = requireStudioData(
    await db
      .from("studio_credit_packs")
      .select("*")
      .eq("code", input.pack_code)
      .eq("is_active", true)
      .single(),
  );
  if (pack.catalog_version !== input.catalog_version)
    throw new StudioError("CATALOG_CHANGED");
  const created = await db
    .from("studio_credit_orders")
    .upsert(
      {
        tenant_id: input.tenant_id,
        pack_code: pack.code,
        amount_mxn: pack.amount_mxn,
        tlacos: pack.tlacos,
        catalog_version: pack.catalog_version,
        idempotency_key: input.idempotency_key,
        created_by: user.id,
      },
      { onConflict: "tenant_id,idempotency_key", ignoreDuplicates: true },
    )
    .select("*")
    .maybeSingle();
  if (created.error) requireStudioData(created);
  const order =
    created.data ??
    requireStudioData(
      await db
        .from("studio_credit_orders")
        .select("*")
        .eq("tenant_id", input.tenant_id)
        .eq("idempotency_key", input.idempotency_key)
        .single(),
    );
  if (order.init_point) return { url: order.init_point };
  if (!created.data)
    throw new StudioError(
      "PAYMENT_PENDING",
      "Tu solicitud está en preparación. Revisa el historial antes de volver a comprar.",
      409,
    );
  const base = getPublicAppUrl(),
    back = await studioReturnUrl(input.tenant_id, input.return_to);
  const preference = await studioMpRequest<{ id: string; init_point: string }>(
    "checkout/preferences",
    "POST",
    {
      items: [
        {
          id: order.id,
          title: `${pack.name}: ${pack.tlacos} Tlacos`,
          quantity: 1,
          currency_id: "MXN",
          unit_price: Number(order.amount_mxn),
        },
      ],
      external_reference: `studio_credit_pack:${order.id}`,
      payer: { email: user.email },
      back_urls: { success: back, pending: back, failure: back },
      notification_url: `${base}/api/mercadopago/webhook`,
      ...(base.startsWith("https://") ? { auto_return: "approved" } : {}),
      metadata: { product: "tlaco_studio", order_id: order.id },
    },
    order.id,
  );
  requireStudioData(
    await db
      .from("studio_credit_orders")
      .update({
        provider_preference_id: preference.id,
        init_point: preference.init_point,
      })
      .eq("tenant_id", input.tenant_id)
      .eq("id", order.id)
      .select("id")
      .single(),
  );
  return { url: preference.init_point };
}

export async function cancelStudioMembership(tenantId: string) {
  const { db, user } = await requireStudioOwner(tenantId);
  const sub = requireStudioData(
    await db
      .from("tenant_studio_subscriptions")
      .select("*")
      .eq("tenant_id", tenantId)
      .single(),
  );
  if (sub.cancel_at_period_end || sub.status === "cancelled")
    return { cancelled: true };
  if (!sub.mp_preapproval_id && sub.checkout_key)
    throw new StudioError(
      "PAYMENT_PENDING",
      "Primero debemos confirmar el estado de la contratación anterior. No se iniciará otra suscripción.",
      409,
    );
  if (sub.mp_preapproval_id)
    await studioMpRequest(
      `preapproval/${encodeURIComponent(sub.mp_preapproval_id)}`,
      "PUT",
      { status: "cancelled" },
    );
  const paid = Boolean(
    sub.current_period_end && new Date(sub.current_period_end) > new Date(),
  );
  requireStudioData(
    await db
      .from("tenant_studio_subscriptions")
      .update({
        status: paid ? "cancelling" : "cancelled",
        cancel_at_period_end: true,
        pending_plan_code: null,
        pending_amount_mxn: null,
        pending_tlacos: null,
        plan_change_status: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", sub.id)
      .eq("tenant_id", tenantId)
      .select("id")
      .single(),
  );
  await db.from("studio_activity_events").insert({
    tenant_id: tenantId,
    actor_id: user.id,
    action: "membership.cancelled",
    entity_id: sub.id,
  });
  return { cancelled: true };
}

export async function changeStudioPlan(raw: unknown) {
  const input = z
    .object({
      tenant_id: uuidSchema,
      plan_code: z.enum(["basic", "pro", "business"]),
      catalog_version: z.number().int().positive(),
    })
    .parse(raw);
  if (!studioFlags().checkout) throw new StudioError("NOT_CONFIGURED");
  const { db, user } = await requireStudioOwner(input.tenant_id);
  if (
    !requireStudioData(
      await db.rpc("studio_rate_limit", {
        p_scope: `billing:${input.tenant_id}`,
        p_limit: 5,
      }),
    )
  )
    throw new StudioError("RATE_LIMIT");
  const sub = requireStudioData(
    await db
      .from("tenant_studio_subscriptions")
      .select("*")
      .eq("tenant_id", input.tenant_id)
      .single(),
  );
  if (
    sub.status !== "active" ||
    !sub.mp_preapproval_id ||
    sub.cancel_at_period_end
  )
    throw new StudioError(
      "VALIDATION",
      "Reactiva tu membresía antes de cambiar de plan.",
    );
  if (sub.plan_change_status === "pending")
    throw new StudioError(
      "PAYMENT_PENDING",
      "Estamos confirmando tu cambio anterior antes de programar otro.",
      409,
    );
  const plan = requireStudioData(
    await db
      .from("studio_plans")
      .select("*")
      .eq("code", input.plan_code)
      .eq("is_active", true)
      .single(),
  );
  if (plan.catalog_version !== input.catalog_version)
    throw new StudioError("CATALOG_CHANGED");
  requireStudioData(
    await db
      .from("tenant_studio_subscriptions")
      .update({
        pending_plan_code: plan.code,
        pending_amount_mxn: plan.amount_mxn,
        pending_tlacos: plan.monthly_tlacos,
        plan_change_status: "pending",
        updated_at: new Date().toISOString(),
      })
      .eq("tenant_id", input.tenant_id)
      .eq("id", sub.id)
      .eq("updated_at", sub.updated_at)
      .eq("status", "active")
      .eq("cancel_at_period_end", false)
      .select("id")
      .single(),
  );
  const changed = await studioMpRequest<StudioMpSubscription>(
    `preapproval/${encodeURIComponent(sub.mp_preapproval_id)}`,
    "PUT",
    {
      auto_recurring: {
        transaction_amount: Number(plan.amount_mxn),
        currency_id: "MXN",
      },
    },
  );
  if (
    changed.status !== "authorized" ||
    Number(changed.auto_recurring?.transaction_amount) !==
      Number(plan.amount_mxn)
  )
    throw new StudioError(
      "PAYMENT_PENDING",
      "Estamos confirmando el importe de tu siguiente renovación.",
      409,
    );
  const confirmed = requireStudioData(
    await db.rpc("studio_confirm_plan_change", {
      p_subscription_id: sub.id,
      p_plan_code: plan.code,
      p_amount: Number(plan.amount_mxn),
    }),
  );
  if (!confirmed)
    throw new StudioError(
      "PAYMENT_PENDING",
      "El estado de la membresía cambió mientras confirmábamos tu solicitud.",
      409,
    );
  await db.from("studio_activity_events").insert({
    tenant_id: input.tenant_id,
    actor_id: user.id,
    action: "membership.plan_scheduled",
    entity_id: sub.id,
    metadata: { plan_code: plan.code },
  });
  return { scheduled: true, effectiveAt: sub.current_period_end };
}

export async function reconcileStudioPlanChange(subscriptionId: string) {
  const db = studioDb();
  const sub = requireStudioData(
    await db
      .from("tenant_studio_subscriptions")
      .select("*")
      .eq("id", subscriptionId)
      .single(),
  );
  if (
    sub.plan_change_status !== "pending" ||
    sub.cancel_at_period_end ||
    !sub.mp_preapproval_id ||
    !sub.pending_plan_code ||
    sub.pending_amount_mxn === null ||
    sub.status !== "active"
  )
    return;
  let provider = await studioMpRequest<StudioMpSubscription>(
    `preapproval/${encodeURIComponent(sub.mp_preapproval_id)}`,
  );
  if (
    provider.external_reference !== `studio_subscription:${sub.id}` ||
    provider.status !== "authorized"
  )
    throw new StudioError("PAYMENT_MISMATCH");
  const amount = Number(provider.auto_recurring?.transaction_amount);
  if (amount !== Number(sub.pending_amount_mxn)) {
    if (amount !== Number(sub.contracted_amount_mxn))
      throw new StudioError("PAYMENT_MISMATCH");
    provider = await studioMpRequest<StudioMpSubscription>(
      `preapproval/${encodeURIComponent(sub.mp_preapproval_id)}`,
      "PUT",
      {
        auto_recurring: {
          transaction_amount: Number(sub.pending_amount_mxn),
          currency_id: "MXN",
        },
      },
    );
  }
  if (
    Number(provider.auto_recurring?.transaction_amount) !==
    Number(sub.pending_amount_mxn)
  )
    throw new StudioError("PAYMENT_PENDING");
  const confirmed = requireStudioData(
    await db.rpc("studio_confirm_plan_change", {
      p_subscription_id: sub.id,
      p_plan_code: sub.pending_plan_code,
      p_amount: Number(sub.pending_amount_mxn),
    }),
  );
  if (!confirmed) throw new StudioError("PAYMENT_PENDING");
}
