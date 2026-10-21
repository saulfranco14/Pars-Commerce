/* eslint-disable @typescript-eslint/no-explicit-any -- offer_plans is not in the generated Supabase types yet. */
import type { SupabaseClient } from "@supabase/supabase-js";

import type { ServiceResult } from "@/features/qr/services/tablePaymentService";
import type { OfferPlan, PublicOfferPlan } from "@/features/planes/interfaces/offerPlan";

type Loose = { from: (table: string) => any };

export const PLAN_COLUMNS =
  "id, tenant_id, kind, status, template_key, name, slug, description, image_url, price, interval_unit, interval_count, max_periods, billing_methods, fulfillment_methods, preferred_weekday, renewal_lead_days, grace_days, max_active_members, created_at";

/** Subscribers that hold a seat: active or behind on a payment. */
export const SEAT_STATUSES = ["active", "past_due", "pending_setup"] as const;

export async function countPlanSeats(admin: SupabaseClient, planIds: string[]): Promise<Map<string, number>> {
  const counts = new Map<string, number>();
  if (planIds.length === 0) return counts;
  const { data } = await (admin as unknown as Loose)
    .from("subscriptions")
    .select("offer_plan_id")
    .in("offer_plan_id", planIds)
    .in("status", [...SEAT_STATUSES]);
  for (const row of (data ?? []) as Array<{ offer_plan_id: string }>) {
    counts.set(row.offer_plan_id, (counts.get(row.offer_plan_id) ?? 0) + 1);
  }
  return counts;
}

export async function listPlansWithCounts(
  admin: SupabaseClient,
  params: { tenantId: string; planId?: string | null; includeArchived?: boolean },
): Promise<ServiceResult<OfferPlan[]>> {
  let query = (admin as unknown as Loose)
    .from("offer_plans")
    .select(`${PLAN_COLUMNS}, items:offer_plan_items(product_id, product_variant_id, quantity, position)`)
    .eq("tenant_id", params.tenantId)
    .order("created_at", { ascending: false });
  if (params.planId) query = query.eq("id", params.planId);
  else if (!params.includeArchived) query = query.neq("status", "archived");

  const { data, error } = await query;
  if (error) return { ok: false, error: { code: "internal", message: error.message } };

  const plans = (data ?? []) as OfferPlan[];
  const counts = await countPlanSeats(admin, plans.map((plan) => plan.id));
  return {
    ok: true,
    data: plans.map((plan) => ({
      ...plan,
      price: Number(plan.price),
      items: [...(plan.items ?? [])].sort((a, b) => (a.position ?? 0) - (b.position ?? 0)),
      active_count: counts.get(plan.id) ?? 0,
    })),
  };
}

/** Active plans with their products, ready for the storefront. */
export async function listPublicPlans(admin: SupabaseClient, tenantId: string, slug?: string): Promise<PublicOfferPlan[]> {
  let query = (admin as unknown as Loose)
    .from("offer_plans")
    .select(
      `${PLAN_COLUMNS}, items:offer_plan_items(product_id, quantity, position, product:products(id, name, image_url, price, deleted_at))`,
    )
    .eq("tenant_id", tenantId)
    .eq("status", "active")
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });
  if (slug) query = query.eq("slug", slug);

  const { data } = await query;
  return ((data ?? []) as Array<OfferPlan & { items: Array<{ product_id: string; quantity: number; position: number; product: any }> }>).map(
    (plan) => {
      const items = [...(plan.items ?? [])]
        .filter((item) => item.product && !item.product.deleted_at)
        .sort((a, b) => a.position - b.position)
        .map((item) => ({
          product_id: item.product_id,
          name: item.product.name as string,
          image_url: (item.product.image_url as string | null) ?? null,
          quantity: item.quantity,
          price: Number(item.product.price ?? 0),
        }));
      return {
        id: plan.id,
        kind: plan.kind,
        name: plan.name,
        slug: plan.slug,
        description: plan.description,
        image_url: plan.image_url,
        price: Number(plan.price),
        interval_unit: plan.interval_unit,
        interval_count: plan.interval_count,
        max_periods: plan.max_periods,
        fulfillment_methods: plan.fulfillment_methods,
        preferred_weekday: plan.preferred_weekday,
        items,
        list_value: Math.round(items.reduce((sum, item) => sum + item.price * item.quantity, 0) * 100) / 100,
      };
    },
  );
}
