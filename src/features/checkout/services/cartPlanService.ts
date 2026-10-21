/* eslint-disable @typescript-eslint/no-explicit-any -- public_cart_plans is not in the generated Supabase types yet. */
/**
 * Plans live in their own cart table (public_cart_plans), so product lines and
 * their pricing rules are untouched. Every write is service-role and checks
 * that the plan is active, belongs to the cart's tenant and still has seats.
 */
import type { SupabaseClient } from "@supabase/supabase-js";

import { countPlanSeats } from "@/features/planes/services/planQueryService";

import type { ServiceResult } from "@/features/qr/services/tablePaymentService";
import type { CartPlanLine } from "@/types/cart";

type Loose = { from: (table: string) => any };

export const MAX_PLANS_PER_CART = 3;

const CART_PLAN_COLUMNS =
  "id, offer_plan_id, billing_method, price_snapshot, plan:offer_plans(id, kind, status, name, slug, image_url, price, interval_unit, interval_count, max_periods, fulfillment_methods, preferred_weekday, items:offer_plan_items(quantity))";

function fail(code: "not_found" | "conflict" | "validation" | "internal", message: string): ServiceResult<never> {
  return { ok: false, error: { code, message } };
}

export async function addPlanToCart(
  admin: SupabaseClient,
  input: { cartId: string; tenantId: string; planId: string },
): Promise<ServiceResult<null>> {
  const db = admin as unknown as Loose;
  const { data: plan } = await db
    .from("offer_plans")
    .select("id, tenant_id, status, price, max_active_members")
    .eq("id", input.planId)
    .eq("tenant_id", input.tenantId)
    .maybeSingle();
  if (!plan || plan.status !== "active") return fail("not_found", "Este plan ya no está disponible.");

  if (plan.max_active_members) {
    const seats = (await countPlanSeats(admin, [plan.id])).get(plan.id) ?? 0;
    if (seats >= plan.max_active_members) return fail("conflict", "Este plan ya no tiene lugares disponibles.");
  }

  const { data: current } = await db.from("public_cart_plans").select("id, offer_plan_id").eq("cart_id", input.cartId);
  const rows = (current ?? []) as Array<{ id: string; offer_plan_id: string }>;
  if (rows.some((row) => row.offer_plan_id === plan.id)) return { ok: true, data: null };
  if (rows.length >= MAX_PLANS_PER_CART) return fail("conflict", `Puedes llevar hasta ${MAX_PLANS_PER_CART} planes por compra.`);

  const { error } = await db.from("public_cart_plans").insert({
    cart_id: input.cartId,
    tenant_id: input.tenantId,
    offer_plan_id: plan.id,
    billing_method: "manual",
    price_snapshot: Number(plan.price),
  });
  // A double tap races into the unique key; the plan is in the cart either way.
  if (error && error.code !== "23505") return fail("internal", error.message);
  return { ok: true, data: null };
}

export async function removePlanFromCart(
  admin: SupabaseClient,
  input: { cartId: string; planLineId: string },
): Promise<ServiceResult<null>> {
  const { error } = await (admin as unknown as Loose)
    .from("public_cart_plans")
    .delete()
    .eq("id", input.planLineId)
    .eq("cart_id", input.cartId);
  if (error) return fail("internal", error.message);
  return { ok: true, data: null };
}

export async function listCartPlans(admin: SupabaseClient, cartId: string): Promise<CartPlanLine[]> {
  const { data } = await (admin as unknown as Loose)
    .from("public_cart_plans")
    .select(CART_PLAN_COLUMNS)
    .eq("cart_id", cartId)
    .order("created_at", { ascending: true });
  return ((data ?? []) as any[])
    .filter((row) => row.plan)
    .map((row) => ({
      id: row.id as string,
      offer_plan_id: row.offer_plan_id as string,
      billing_method: row.billing_method,
      price_snapshot: Number(row.price_snapshot),
      plan: {
        id: row.plan.id,
        kind: row.plan.kind,
        status: row.plan.status,
        name: row.plan.name,
        slug: row.plan.slug,
        image_url: row.plan.image_url ?? null,
        interval_unit: row.plan.interval_unit,
        interval_count: row.plan.interval_count,
        max_periods: row.plan.max_periods,
        fulfillment_methods: row.plan.fulfillment_methods ?? [],
        preferred_weekday: row.plan.preferred_weekday,
        items_count: ((row.plan.items ?? []) as Array<{ quantity: number }>).reduce((sum, item) => sum + item.quantity, 0),
      },
    }));
}

/** Drops plans that were paused or archived and refreshes changed prices. */
export async function repriceCartPlans(admin: SupabaseClient, cartId: string): Promise<ServiceResult<{ changed: boolean }>> {
  const db = admin as unknown as Loose;
  const { data } = await db.from("public_cart_plans").select("id, offer_plan_id, price_snapshot").eq("cart_id", cartId);
  const lines = ((data ?? []) as Array<{ id: string; offer_plan_id: string; price_snapshot: number | string }>).map((row) => ({
    ...row,
    price_snapshot: Number(row.price_snapshot),
  }));
  let changed = false;
  for (const line of lines) {
    const { data: plan } = await db.from("offer_plans").select("status, price").eq("id", line.offer_plan_id).maybeSingle();
    if (!plan || plan.status !== "active") {
      const { error } = await db.from("public_cart_plans").delete().eq("id", line.id);
      if (error) return fail("internal", error.message);
      changed = true;
    } else if (Number(plan.price) !== line.price_snapshot) {
      const { error } = await db.from("public_cart_plans").update({ price_snapshot: Number(plan.price) }).eq("id", line.id);
      if (error) return fail("internal", error.message);
      changed = true;
    }
  }
  return { ok: true, data: { changed } };
}
