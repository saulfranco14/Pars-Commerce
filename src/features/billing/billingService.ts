/* eslint-disable @typescript-eslint/no-explicit-any -- billing tables are introduced by the accompanying migration before generated DB types are refreshed. */
import { MercadoPagoConfig, PreApproval } from "mercadopago";
import type { SupabaseClient } from "@supabase/supabase-js";

import {
  DEFAULT_FREE_ENTITLEMENTS,
  type BillingAccount,
  type BillingPlan,
  type BillingPlanCode,
  type BillingStatus,
  type TenantEntitlements,
} from "@/features/billing/entitlements";

// The generated database type is intentionally not used here until the billing
// migration has been applied to every environment. This keeps the deployment
// order safe: migration first, application second.
type Db = SupabaseClient<any>;

/**
 * Billing migrations can be applied before generated Supabase types are
 * refreshed. Keep this narrow compatibility cast here, rather than forcing
 * every calling route to use `any`.
 */
export function asBillingAdmin(client: unknown): Db {
  return client as Db;
}

const FREE_PLAN: BillingPlan = {
  code: "free",
  name: "Gratis",
  amount_mxn: 0,
  billing_interval: "month",
  entitlements: DEFAULT_FREE_ENTITLEMENTS,
  is_active: true,
};

function asPlan(row: any): BillingPlan {
  return {
    code: row.code,
    name: row.name,
    amount_mxn: Number(row.amount_mxn),
    billing_interval: "month",
    entitlements: { ...DEFAULT_FREE_ENTITLEMENTS, ...(row.entitlements ?? {}) },
    is_active: Boolean(row.is_active),
  };
}

export async function listBillingPlans(admin: Db): Promise<BillingPlan[]> {
  const { data, error } = await admin
    .from("billing_plans")
    .select("code, name, amount_mxn, billing_interval, entitlements, is_active")
    .eq("is_active", true)
    .order("amount_mxn");
  if (error) throw new Error(error.message);
  return (data ?? []).map(asPlan);
}

async function usage(admin: Db, tenantId: string) {
  const [tables, kiosks] = await Promise.all([
    admin
      .from("qr_codes")
      .select("id", { count: "exact", head: true })
      .eq("tenant_id", tenantId)
      .eq("kind", "table")
      .eq("is_active", true)
      .is("archived_at", null),
    admin
      .from("tenant_devices")
      .select("id", { count: "exact", head: true })
      .eq("tenant_id", tenantId)
      .eq("status", "approved"),
  ]);
  return { active_tables: tables.count ?? 0, active_kiosks: kiosks.count ?? 0 };
}

export async function getBillingAccount(admin: Db, tenantId: string): Promise<BillingAccount> {
  const { data: raw, error } = await admin
    .from("tenant_billing_accounts")
    .select("tenant_id, plan_code, status, current_period_end, cancel_at_period_end, mp_init_point, plan:billing_plans(code, name, amount_mxn, billing_interval, entitlements, is_active)")
    .eq("tenant_id", tenantId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  const account = raw ?? {
    tenant_id: tenantId,
    plan_code: "free",
    status: "free",
    current_period_end: null,
    cancel_at_period_end: false,
    mp_init_point: null,
    plan: FREE_PLAN,
  };
  const rawPlan = Array.isArray(account.plan) ? account.plan[0] : account.plan;
  return {
    tenant_id: account.tenant_id,
    plan_code: account.plan_code as BillingPlanCode,
    status: account.status as BillingStatus,
    current_period_end: account.current_period_end,
    cancel_at_period_end: Boolean(account.cancel_at_period_end),
    mp_init_point: account.mp_init_point,
    plan: rawPlan ? asPlan(rawPlan) : FREE_PLAN,
    usage: await usage(admin, tenantId),
  };
}

export async function requireBillingCapability(
  admin: Db,
  tenantId: string,
  capability: keyof TenantEntitlements,
): Promise<BillingAccount> {
  const account = await getBillingAccount(admin, tenantId);
  if (!account.plan.entitlements[capability]) {
    throw new BillingCapabilityError(account, capability);
  }
  return account;
}

export class BillingCapabilityError extends Error {
  constructor(
    public readonly account: BillingAccount,
    public readonly capability: keyof TenantEntitlements,
  ) {
    super("Esta función requiere un plan superior de Tlaco");
  }
}

export async function assertTableCapacity(admin: Db, tenantId: string, adding = 1) {
  const account = await getBillingAccount(admin, tenantId);
  if (account.usage.active_tables + adding > account.plan.entitlements.active_table_limit) {
    throw new BillingCapabilityError(account, "active_table_limit");
  }
  return account;
}

export async function assertKioskCapacity(admin: Db, tenantId: string, adding = 1) {
  const account = await getBillingAccount(admin, tenantId);
  if (account.usage.active_kiosks + adding > account.plan.entitlements.active_kiosk_limit) {
    throw new BillingCapabilityError(account, "active_kiosk_limit");
  }
  return account;
}

export async function createBillingCheckout(input: {
  admin: Db;
  tenantId: string;
  planCode: BillingPlanCode;
  payerEmail: string;
  origin: string;
}) {
  const { admin, tenantId, planCode, payerEmail, origin } = input;
  const { data: plan, error: planError } = await admin
    .from("billing_plans")
    .select("code, name, amount_mxn, entitlements, is_active")
    .eq("code", planCode)
    .eq("is_active", true)
    .single();
  if (planError || !plan || Number(plan.amount_mxn) <= 0) {
    throw new Error("Selecciona un plan de pago disponible");
  }
  // Tlaco uses the same Mercado Pago account for checkout and membership
  // charges. The separation is by external_reference and billing tables.
  const token = process.env.MERCADOPAGO_ACCESS_TOKEN;
  if (!token) throw new Error("No está configurado Mercado Pago para membresías");

  const account = await getBillingAccount(admin, tenantId);
  if (account.plan_code === planCode && account.status === "active") {
    throw new Error("Este plan ya está activo");
  }

  const mp = new PreApproval(new MercadoPagoConfig({ accessToken: token }));
  // One tenant must never keep two recurring authorizations after changing
  // tiers. The new authorization only becomes active after its own webhook.
  if (account.plan_code !== "free") {
    const { data: previous } = await admin
      .from("tenant_billing_accounts")
      .select("mp_preapproval_id")
      .eq("tenant_id", tenantId)
      .maybeSingle();
    if (previous?.mp_preapproval_id) {
      try {
        await mp.update({ id: previous.mp_preapproval_id, body: { status: "cancelled" } });
      } catch (error) {
        // The cancellation can already have been delivered by Mercado Pago.
        // A fresh authorization is still the correct next action.
        console.warn("Billing: previous preapproval was unavailable", error);
      }
    }
  }
  const start = new Date();
  start.setDate(start.getDate() + 1);
  const preference = await mp.create({
    body: {
      reason: `Tlaco ${plan.name}`,
      payer_email: payerEmail,
      status: "pending",
      external_reference: `tlaco_billing:${tenantId}:${plan.code}`,
      back_url: `${origin}/dashboard`,
      auto_recurring: {
        frequency: 1,
        frequency_type: "months",
        transaction_amount: Number(plan.amount_mxn),
        currency_id: "MXN",
        start_date: start.toISOString(),
      },
    },
  });
  if (!preference.id || !preference.init_point) throw new Error("Mercado Pago no devolvió una autorización válida");
  const now = new Date().toISOString();
  await admin.from("tenant_billing_accounts").upsert({
    tenant_id: tenantId,
    plan_code: plan.code,
    status: "pending_payment",
    mp_preapproval_id: preference.id,
    mp_init_point: preference.init_point,
    cancel_at_period_end: false,
    updated_at: now,
  });
  await logBillingActivity(admin, tenantId, "member", null, "billing.checkout_started", { plan_code: plan.code });
  return { checkout_url: preference.init_point };
}

export async function cancelBilling(input: { admin: Db; tenantId: string; actorId: string }) {
  const { admin, tenantId, actorId } = input;
  const account = await getBillingAccount(admin, tenantId);
  if (account.plan_code === "free") return account;
  if (account.mp_init_point && !account.current_period_end) {
    // Pending authorizations have no paid period and can safely return to Free.
    const { data: pending } = await admin
      .from("tenant_billing_accounts")
      .select("mp_preapproval_id")
      .eq("tenant_id", tenantId)
      .maybeSingle();
    if (pending?.mp_preapproval_id && process.env.MERCADOPAGO_ACCESS_TOKEN) {
      const mp = new PreApproval(new MercadoPagoConfig({ accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN }));
      await mp.update({ id: pending.mp_preapproval_id, body: { status: "cancelled" } });
    }
    await admin.from("tenant_billing_accounts").update({
      plan_code: "free", status: "free", mp_preapproval_id: null, mp_init_point: null,
      cancel_at_period_end: false, updated_at: new Date().toISOString(),
    }).eq("tenant_id", tenantId);
  } else {
    if (account.status !== "cancelling") {
      const { data } = await admin.from("tenant_billing_accounts").select("mp_preapproval_id").eq("tenant_id", tenantId).single();
      if (data?.mp_preapproval_id && process.env.MERCADOPAGO_ACCESS_TOKEN) {
        const mp = new PreApproval(new MercadoPagoConfig({ accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN }));
        await mp.update({ id: data.mp_preapproval_id, body: { status: "cancelled" } });
      }
      await admin.from("tenant_billing_accounts").update({
        status: "cancelling", cancel_at_period_end: true, updated_at: new Date().toISOString(),
      }).eq("tenant_id", tenantId);
    }
  }
  await logBillingActivity(admin, tenantId, "member", actorId, "billing.cancelled", { plan_code: account.plan_code });
  return getBillingAccount(admin, tenantId);
}

export async function logBillingActivity(
  admin: Db, tenantId: string, actorType: "member" | "system" | "webhook" | "platform_admin", actorId: string | null, action: string, payload: Record<string, unknown>,
) {
  await admin.from("billing_activity_events").insert({ tenant_id: tenantId, actor_type: actorType, actor_id: actorId, action, payload });
}

export async function handleBillingPreapprovalStatus(admin: Db, preapprovalId: string, status: string) {
  const { data: account } = await admin.from("tenant_billing_accounts")
    .select("tenant_id, plan_code, current_period_end")
    .eq("mp_preapproval_id", preapprovalId).maybeSingle();
  if (!account) return false;
  const next = status === "authorized" ? "active" : status === "cancelled" ? "cancelling" : "pending_payment";
  await admin.from("tenant_billing_accounts").update({ status: next, updated_at: new Date().toISOString() }).eq("tenant_id", account.tenant_id);
  await logBillingActivity(admin, account.tenant_id, "webhook", preapprovalId, "billing.preapproval_status", { status });
  return true;
}

export async function handleBillingAuthorizedPayment(admin: Db, input: {
  authorizedPaymentId: string; preapprovalId: string | null; amount: number; fee: number; status: string;
}) {
  if (!input.preapprovalId) return false;
  const { data: account } = await admin.from("tenant_billing_accounts")
    .select("tenant_id, plan_code")
    .eq("mp_preapproval_id", input.preapprovalId).maybeSingle();
  if (!account) return false;
  const now = new Date();
  const end = new Date(now);
  end.setMonth(end.getMonth() + 1);
  const approved = input.status === "approved";
  const { error } = await admin.from("tenant_billing_payments").insert({
    tenant_id: account.tenant_id, billing_account_tenant_id: account.tenant_id,
    external_payment_id: input.authorizedPaymentId, gross_amount: input.amount,
    processing_fee_amount: input.fee, net_amount: input.amount - input.fee,
    status: approved ? "approved" : "rejected", paid_at: approved ? now.toISOString() : null,
  });
  if (error && error.code !== "23505") throw new Error(error.message);
  if (approved) {
    await admin.from("tenant_billing_accounts").update({
      status: "active", current_period_start: now.toISOString(), current_period_end: end.toISOString(),
      grace_ends_at: null, cancel_at_period_end: false, updated_at: now.toISOString(),
    }).eq("tenant_id", account.tenant_id);
  } else {
    const graceEndsAt = new Date(now);
    graceEndsAt.setDate(graceEndsAt.getDate() + 7);
    await admin.from("tenant_billing_accounts").update({
      status: "past_due",
      grace_ends_at: graceEndsAt.toISOString(),
      updated_at: now.toISOString(),
    }).eq("tenant_id", account.tenant_id);
  }
  await logBillingActivity(admin, account.tenant_id, "webhook", input.authorizedPaymentId, "billing.payment_processed", { approved, plan_code: account.plan_code, amount: input.amount });
  return true;
}

/** Runs from a signed scheduler. No client can downgrade itself early. */
export async function applyBillingLifecycle(admin: Db, now = new Date()) {
  const nowIso = now.toISOString();
  const { data: expired, error } = await admin
    .from("tenant_billing_accounts")
    .select("tenant_id")
    .or(`and(status.eq.cancelling,current_period_end.lte.${nowIso}),and(status.eq.past_due,grace_ends_at.lte.${nowIso})`);
  if (error) throw new Error(error.message);
  const tenantIds = (expired ?? []).map((account: any) => account.tenant_id);
  if (tenantIds.length === 0) return { downgraded: 0 };
  const { error: updateError } = await admin
    .from("tenant_billing_accounts")
    .update({
      plan_code: "free", status: "free", mp_preapproval_id: null, mp_init_point: null,
      cancel_at_period_end: false, current_period_start: null, current_period_end: null,
      grace_ends_at: null, updated_at: nowIso,
    })
    .in("tenant_id", tenantIds);
  if (updateError) throw new Error(updateError.message);
  await Promise.all(tenantIds.map((tenantId: string) =>
    logBillingActivity(admin, tenantId, "system", null, "billing.downgraded_to_free", { at: nowIso }),
  ));
  return { downgraded: tenantIds.length };
}
