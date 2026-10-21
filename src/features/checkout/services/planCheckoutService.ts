/* eslint-disable @typescript-eslint/no-explicit-any -- plan tables are not in the generated Supabase types yet. */
import type { SupabaseClient } from "@supabase/supabase-js";

import { listCartPlans } from "@/features/checkout/services/cartPlanService";

import type { ServiceResult } from "@/features/qr/services/tablePaymentService";
import type { CartPlanLine } from "@/types/cart";

type Loose = { from: (table: string) => any; rpc: (fn: string, args: Record<string, unknown>) => any };

export interface CheckoutPlans {
  lines: CartPlanLine[];
  /** What the first period delivers, so stock is checked with the rest of the cart. */
  components: Array<{ product_id: string; product_variant_id: string | null; quantity: number }>;
}

export async function loadCheckoutPlans(admin: SupabaseClient, cartId: string): Promise<CheckoutPlans> {
  const lines = await listCartPlans(admin, cartId);
  if (lines.length === 0) return { lines, components: [] };
  const { data } = await (admin as unknown as Loose)
    .from("offer_plan_items")
    .select("product_id, product_variant_id, quantity")
    .in("plan_id", lines.map((line) => line.offer_plan_id));
  return { lines, components: (data ?? []) as CheckoutPlans["components"] };
}

/** Creates each plan's pending subscription, its period 1 and the order's plan lines in one transaction. */
export async function attachPlansToOrder(
  admin: SupabaseClient,
  params: { orderId: string; cartId: string },
): Promise<ServiceResult<number>> {
  const { data, error } = await (admin as unknown as Loose).rpc("create_checkout_plan_instances", {
    p_order_id: params.orderId,
    p_cart_id: params.cartId,
  });
  if (error) {
    if (String(error.message).includes("PLAN_NOT_ACTIVE")) {
      return { ok: false, error: { code: "conflict", message: "Uno de los planes ya no está disponible. Revisa tu carrito." } };
    }
    return { ok: false, error: { code: "internal", message: error.message } };
  }
  return { ok: true, data: Number(data ?? 0) };
}

export async function clearCartPlans(admin: Pick<Loose, "from">, cartId: string): Promise<void> {
  await admin.from("public_cart_plans").delete().eq("cart_id", cartId);
}

export async function cartHasPlans(admin: Pick<Loose, "from">, cartId: string): Promise<boolean> {
  const { data } = await admin.from("public_cart_plans").select("id").eq("cart_id", cartId).limit(1);
  return (data ?? []).length > 0;
}
