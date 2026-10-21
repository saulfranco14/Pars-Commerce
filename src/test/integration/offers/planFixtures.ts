import { createTestServiceClient, sql } from "@/test/integration/setup";

/** A tenant with one stocked product and an active monthly plan already in a cart. */
export interface PlanSeed {
  tenantId: string;
  cartId: string;
  riceId: string;
  planId: string;
}

export const DAY = 24 * 60 * 60 * 1000;

export async function cleanupPlans(slug: string): Promise<void> {
  const tenants = sql`select id from tenants where slug = ${slug}`;
  await sql`delete from order_items where order_id in (select id from orders where tenant_id in (${tenants}))`;
  await sql`delete from subscription_payments where tenant_id in (${tenants})`;
  await sql`delete from inventory_movements where product_id in (select id from products where tenant_id in (${tenants}))`;
  await sql`delete from orders where tenant_id in (${tenants})`;
  await sql`delete from subscriptions where tenant_id in (${tenants})`;
  await sql`delete from public_carts where tenant_id in (${tenants})`;
  await sql`delete from offer_plans where tenant_id in (${tenants})`;
  await sql`delete from product_inventory where product_id in (select id from products where tenant_id in (${tenants}))`;
  await sql`delete from products where tenant_id in (${tenants})`;
  await sql`delete from tenants where slug = ${slug}`;
}

export async function seedPlan(slug: string): Promise<PlanSeed> {
  const [tenant] = await sql`
    insert into tenants (name, slug, public_store_enabled) values ('ITest Plans', ${slug}, true) returning id`;
  const [rice] = await sql`
    insert into products (tenant_id, name, slug, price, is_public, track_stock, type)
    values (${tenant.id}, 'Arroz', 'arroz', 30, true, true, 'product') returning id`;
  await sql`delete from product_inventory where product_id = ${rice.id}`;
  await sql`insert into product_inventory (product_id, quantity) values (${rice.id}, 10)`;
  const { data: planId, error } = await createTestServiceClient().rpc("save_offer_plan", {
    p_plan: {
      tenant_id: tenant.id, kind: "subscription", status: "active", name: "Despensa Básica", slug: "despensa-basica",
      price: 559, interval_unit: "month", interval_count: 1, billing_methods: ["manual"], fulfillment_methods: ["pickup"],
    },
    p_items: [{ product_id: rice.id, quantity: 2 }],
  });
  if (error) throw error;
  const [cart] = await sql`
    insert into public_carts (tenant_id, fingerprint_id) values (${tenant.id}, ${`${slug}-fp`}) returning id`;
  await sql`
    insert into public_cart_plans (cart_id, tenant_id, offer_plan_id, price_snapshot)
    values (${cart.id}, ${tenant.id}, ${planId as string}, 559)`;
  return { tenantId: tenant.id, cartId: cart.id, riceId: rice.id, planId: planId as string };
}

/** A transfer checkout order with the cart's plan attached, as the orchestrator leaves it. */
export async function checkoutOrder(data: PlanSeed): Promise<string> {
  const [order] = await sql`
    insert into orders (tenant_id, status, subtotal, discount, total, source, customer_name, customer_email,
      payment_mode, payment_method, fulfillment_method, payment_verification_status, paid_total, balance_due, order_type)
    values (${data.tenantId}, 'pending_payment', 559, 0, 559, 'public_store', 'Juan', 'juan@example.com',
      'single', 'bank_transfer', 'pickup', 'proof_required', 0, 559, 'takeaway')
    returning id`;
  const { error } = await createTestServiceClient().rpc("create_checkout_plan_instances", {
    p_order_id: order.id,
    p_cart_id: data.cartId,
  });
  if (error) throw error;
  return order.id;
}

export async function subscriptionFor(orderId: string) {
  const [row] = await sql`select * from subscriptions where original_order_id = ${orderId}`;
  return row;
}

export async function stockOf(productId: string): Promise<number> {
  const [row] = await sql`select quantity from product_inventory where product_id = ${productId}`;
  return Number(row.quantity);
}

export async function ensureAt(tenantId: string, at: Date): Promise<number> {
  const { data, error } = await createTestServiceClient().rpc("ensure_due_periods", {
    p_tenant_id: tenantId,
    p_now: at.toISOString(),
  });
  if (error) throw error;
  return data as number;
}
