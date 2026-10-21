/* eslint-disable @typescript-eslint/no-explicit-any -- plan tables are not in the generated Supabase types yet. */
/**
 * Plan subscriptions (subscriptions with offer_plan_id). Every read first runs
 * ensure_due_periods, so without a cron the next period's order exists as soon
 * as the business or the customer looks at it.
 */
import type { SupabaseClient } from "@supabase/supabase-js";

import { duePeriod } from "@/features/suscripciones/helpers/planSubscriptionView";

import type { ServiceResult } from "@/features/qr/services/tablePaymentService";
import type {
  PlanPeriod,
  PlanSnapshot,
  PlanSubscriptionDetail,
  PublicPlanView,
} from "@/features/suscripciones/interfaces/planSubscription";

type Loose = { from: (table: string) => any; rpc: (fn: string, args: Record<string, unknown>) => any };

const SUBSCRIPTION_COLUMNS =
  "id, tenant_id, status, customer_name, customer_email, customer_phone, plan_snapshot, fulfillment_snapshot, current_period_number, current_period_end, cancel_at_period_end, past_due_since, public_token, created_at, periods:subscription_periods(id, period_number, status, amount, starts_at, ends_at, due_at, paid_at, order_id)";

function fail(code: "not_found" | "conflict" | "validation" | "internal", message: string): ServiceResult<never> {
  return { ok: false, error: { code, message } };
}

export async function ensureDuePeriods(
  admin: SupabaseClient,
  params: { tenantId: string; subscriptionId?: string | null },
): Promise<ServiceResult<number>> {
  const { data, error } = await (admin as unknown as Loose).rpc("ensure_due_periods", {
    p_tenant_id: params.tenantId,
    p_subscription_id: params.subscriptionId ?? null,
  });
  if (error) return fail("internal", error.message);
  return { ok: true, data: Number(data ?? 0) };
}

async function trackingTokens(db: Loose, orderIds: string[]): Promise<Map<string, string>> {
  const tokens = new Map<string, string>();
  if (orderIds.length === 0) return tokens;
  const { data } = await db.from("orders").select("id, public_tracking_token").in("id", orderIds);
  for (const row of (data ?? []) as Array<{ id: string; public_tracking_token: string | null }>) {
    if (row.public_tracking_token) tokens.set(row.id, row.public_tracking_token);
  }
  return tokens;
}

function toDetail(row: any, tokens: Map<string, string>): PlanSubscriptionDetail {
  const periods: PlanPeriod[] = ((row.periods ?? []) as any[])
    .map((period) => ({
      id: period.id,
      period_number: period.period_number,
      status: period.status,
      amount: Number(period.amount),
      starts_at: period.starts_at,
      ends_at: period.ends_at,
      due_at: period.due_at,
      paid_at: period.paid_at,
      order_id: period.order_id,
      order_tracking_token: period.order_id ? tokens.get(period.order_id) ?? null : null,
    }))
    .sort((a, b) => a.period_number - b.period_number);
  const plan = row.plan_snapshot as PlanSnapshot;
  return {
    id: row.id,
    status: row.status,
    customer_name: row.customer_name,
    customer_email: row.customer_email,
    customer_phone: row.customer_phone,
    plan: { ...plan, price: Number(plan.price) },
    fulfillment_method: row.fulfillment_snapshot?.method ?? null,
    current_period_number: row.current_period_number,
    current_period_end: row.current_period_end,
    cancel_at_period_end: row.cancel_at_period_end,
    past_due_since: row.past_due_since,
    public_token: row.public_token,
    created_at: row.created_at,
    periods,
    due_period: duePeriod(periods),
  };
}

async function hydrate(db: Loose, rows: any[]): Promise<PlanSubscriptionDetail[]> {
  const orderIds = rows.flatMap((row) => ((row.periods ?? []) as any[]).map((period) => period.order_id).filter(Boolean));
  const tokens = await trackingTokens(db, orderIds);
  return rows.map((row) => toDetail(row, tokens));
}

export async function listPlanSubscriptions(
  admin: SupabaseClient,
  tenantId: string,
): Promise<ServiceResult<PlanSubscriptionDetail[]>> {
  const ensured = await ensureDuePeriods(admin, { tenantId });
  if (!ensured.ok) return ensured;
  const db = admin as unknown as Loose;
  const { data, error } = await db
    .from("subscriptions")
    .select(SUBSCRIPTION_COLUMNS)
    .eq("tenant_id", tenantId)
    .not("offer_plan_id", "is", null)
    .order("created_at", { ascending: false });
  if (error) return fail("internal", error.message);
  return { ok: true, data: await hydrate(db, data ?? []) };
}

export async function getPlanSubscription(
  admin: SupabaseClient,
  params: { tenantId: string; subscriptionId: string },
): Promise<ServiceResult<PlanSubscriptionDetail>> {
  const ensured = await ensureDuePeriods(admin, params);
  if (!ensured.ok) return ensured;
  const db = admin as unknown as Loose;
  const { data } = await db
    .from("subscriptions")
    .select(SUBSCRIPTION_COLUMNS)
    .eq("id", params.subscriptionId)
    .eq("tenant_id", params.tenantId)
    .not("offer_plan_id", "is", null)
    .maybeSingle();
  if (!data) return fail("not_found", "La suscripción ya no existe.");
  const [detail] = await hydrate(db, [data]);
  return { ok: true, data: detail };
}

export async function getPublicPlan(admin: SupabaseClient, token: string): Promise<PublicPlanView | null> {
  if (!/^[0-9a-f]{64}$/.test(token)) return null;
  const db = admin as unknown as Loose;
  const { data: found } = await db.from("subscriptions").select("id, tenant_id").eq("public_token", token).maybeSingle();
  if (!found) return null;
  await ensureDuePeriods(admin, { tenantId: found.tenant_id, subscriptionId: found.id });
  const [{ data: row }, { data: tenant }] = await Promise.all([
    db.from("subscriptions").select(SUBSCRIPTION_COLUMNS).eq("id", found.id).maybeSingle(),
    db.from("tenants").select("name, logo_url, whatsapp_phone, site_slug").eq("id", found.tenant_id).maybeSingle(),
  ]);
  if (!row) return null;
  const [detail] = await hydrate(db, [row]);
  return {
    ...detail,
    tenant: {
      name: tenant?.name ?? "",
      logo_url: tenant?.logo_url ?? null,
      whatsapp_phone: tenant?.whatsapp_phone ?? null,
      site_slug: tenant?.site_slug ?? null,
    },
  };
}

/**
 * `period_end` keeps what was already paid and stops renewing; `now` also
 * cancels an unpaid renewal order so nobody is asked to pay it.
 */
export async function cancelPlanSubscription(
  admin: SupabaseClient,
  params: { tenantId: string; subscriptionId: string; when: "now" | "period_end" },
): Promise<ServiceResult<null>> {
  const db = admin as unknown as Loose;
  const { data: sub } = await db
    .from("subscriptions")
    .select("id, status, periods:subscription_periods(id, status, order_id, period_number)")
    .eq("id", params.subscriptionId)
    .eq("tenant_id", params.tenantId)
    .not("offer_plan_id", "is", null)
    .maybeSingle();
  if (!sub) return fail("not_found", "La suscripción ya no existe.");
  if (sub.status === "cancelled" || sub.status === "completed") return { ok: true, data: null };

  const now = new Date().toISOString();
  if (params.when === "period_end" && sub.status !== "pending_setup") {
    const { error } = await db.from("subscriptions").update({ cancel_at_period_end: true, updated_at: now }).eq("id", sub.id);
    if (error) return fail("internal", error.message);
    return { ok: true, data: null };
  }

  const unpaidOrders = ((sub.periods ?? []) as Array<{ status: string; order_id: string | null }>)
    .filter((period) => (period.status === "pending" || period.status === "overdue") && period.order_id)
    .map((period) => period.order_id as string);
  if (unpaidOrders.length > 0) {
    const { error } = await db
      .from("orders")
      .update({ status: "cancelled", updated_at: now })
      .in("id", unpaidOrders)
      .in("status", ["pending_payment", "pending_acceptance"]);
    if (error) return fail("internal", error.message);
  }
  const { error } = await db
    .from("subscriptions")
    .update({ status: "cancelled", cancelled_at: now, updated_at: now })
    .eq("id", sub.id);
  if (error) return fail("internal", error.message);
  return { ok: true, data: null };
}

export async function resumePlanSubscription(
  admin: SupabaseClient,
  params: { tenantId: string; subscriptionId: string },
): Promise<ServiceResult<null>> {
  const { error } = await (admin as unknown as Loose)
    .from("subscriptions")
    .update({ cancel_at_period_end: false, updated_at: new Date().toISOString() })
    .eq("id", params.subscriptionId)
    .eq("tenant_id", params.tenantId)
    .in("status", ["active", "past_due"]);
  if (error) return fail("internal", error.message);
  return { ok: true, data: null };
}

export async function getPlanSubscriptionTenantByToken(admin: SupabaseClient, token: string) {
  if (!/^[0-9a-f]{64}$/.test(token)) return null;
  const { data } = await (admin as unknown as Loose)
    .from("subscriptions")
    .select("id, tenant_id")
    .eq("public_token", token)
    .maybeSingle();
  return (data as { id: string; tenant_id: string } | null) ?? null;
}
