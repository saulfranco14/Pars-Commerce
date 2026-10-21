import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// The MP client throws on import without a token; bank transfer never calls it.
vi.hoisted(() => {
  process.env.MERCADOPAGO_ACCESS_TOKEN ??= "TEST-itest-placeholder";
});

import { createTestServiceClient, sql } from "@/test/integration/setup";

import { executePublicCheckout } from "@/features/checkout/services/publicCheckoutOrchestrator";

/**
 * The real storefront checkout with a mixed cart (one product + one plan)
 * paid by bank transfer: one order charges both today, the plan becomes a
 * pending subscription, and the cart is emptied of both.
 */
const SLUG = "itest-plan-checkout";
const FINGERPRINT = "itest-plan-checkout-fp";

interface Seed {
  tenantId: string;
  cartId: string;
  pickupPointId: string;
  soapId: string;
  riceId: string;
  planId: string;
}

async function cleanup(): Promise<void> {
  const tenants = sql`select id from tenants where slug = ${SLUG}`;
  await sql`delete from order_items where order_id in (select id from orders where tenant_id in (${tenants}))`;
  await sql`delete from orders where tenant_id in (${tenants})`;
  await sql`delete from subscriptions where tenant_id in (${tenants})`;
  await sql`delete from customers where tenant_id in (${tenants})`;
  await sql`delete from public_cart_items where cart_id in (select id from public_carts where tenant_id in (${tenants}))`;
  await sql`delete from public_carts where tenant_id in (${tenants})`;
  await sql`delete from offer_plans where tenant_id in (${tenants})`;
  await sql`delete from product_inventory where product_id in (select id from products where tenant_id in (${tenants}))`;
  await sql`delete from products where tenant_id in (${tenants})`;
  await sql`delete from tenant_payment_methods where tenant_id in (${tenants})`;
  await sql`delete from tenant_pickup_points where tenant_id in (${tenants})`;
  await sql`delete from tenant_fulfillment_settings where tenant_id in (${tenants})`;
  await sql`delete from tenants where slug = ${SLUG}`;
}

async function seed(): Promise<Seed> {
  const [tenant] = await sql`
    insert into tenants (name, slug, public_store_enabled) values ('ITest Plan Checkout', ${SLUG}, true) returning id`;
  await sql`insert into tenant_fulfillment_settings (tenant_id, pickup_enabled) values (${tenant.id}, true)`;
  const [point] = await sql`
    insert into tenant_pickup_points (tenant_id, name, address_text, is_primary) values (${tenant.id}, 'Matriz', 'Centro 1', true) returning id`;
  await sql`
    insert into tenant_payment_methods (tenant_id, kind, bank_name, account_holder, clabe)
    values (${tenant.id}, 'bank_transfer', 'Banco', 'Negocio', '012345678901234567')`;
  const [soap] = await sql`
    insert into products (tenant_id, name, slug, price, is_public, type) values (${tenant.id}, 'Jabón', 'jabon', 45, true, 'product') returning id`;
  const [rice] = await sql`
    insert into products (tenant_id, name, slug, price, is_public, type) values (${tenant.id}, 'Arroz', 'arroz', 30, true, 'product') returning id`;
  await sql`delete from product_inventory where product_id in (${soap.id}, ${rice.id})`;
  await sql`insert into product_inventory (product_id, quantity) values (${soap.id}, 10), (${rice.id}, 10)`;
  const { data: planId, error } = await createTestServiceClient().rpc("save_offer_plan", {
    p_plan: {
      tenant_id: tenant.id, kind: "subscription", status: "active", name: "Despensa Básica", slug: "despensa",
      price: 559, interval_unit: "month", interval_count: 1, fulfillment_methods: ["pickup"],
    },
    p_items: [{ product_id: rice.id, quantity: 2 }],
  });
  if (error) throw error;
  const [cart] = await sql`insert into public_carts (tenant_id, fingerprint_id) values (${tenant.id}, ${FINGERPRINT}) returning id`;
  await sql`
    insert into public_cart_items (cart_id, product_id, quantity, price_snapshot) values (${cart.id}, ${soap.id}, 1, 45)`;
  await sql`
    insert into public_cart_plans (cart_id, tenant_id, offer_plan_id, price_snapshot) values (${cart.id}, ${tenant.id}, ${planId as string}, 559)`;
  return { tenantId: tenant.id, cartId: cart.id, pickupPointId: point.id, soapId: soap.id, riceId: rice.id, planId: planId as string };
}

function checkoutRequest(data: Seed, overrides: Record<string, unknown> = {}): Request {
  return new Request("http://localhost/api/public-checkout", {
    method: "POST",
    headers: { "content-type": "application/json", "x-fingerprint-id": FINGERPRINT },
    body: JSON.stringify({
      tenant_id: data.tenantId,
      cart_id: data.cartId,
      customer_name: "Juan Pérez",
      customer_email: "juan@example.com",
      customer_phone: "5512345678",
      mode: "single",
      fulfillment_method: "pickup",
      pickup_point_id: data.pickupPointId,
      payment_method: "bank_transfer",
      ...overrides,
    }),
  });
}

describe("checkout with a plan in the cart", () => {
  let data: Seed;

  beforeEach(async () => {
    await cleanup();
    data = await seed();
  });

  afterEach(async () => {
    await cleanup();
  });

  it("charges the product and the first period today and opens the subscription", async () => {
    const response = await executePublicCheckout({ request: checkoutRequest(data) });
    const body = (await response.json()) as { order_id?: string; error?: string };
    expect(response.status, body.error).toBe(200);

    const [order] = await sql`select subtotal, total, balance_due, status from orders where id = ${body.order_id as string}`;
    expect(order).toMatchObject({ subtotal: "604.00", total: "604.00", balance_due: "604.00", status: "pending_payment" });

    const items = await sql`
      select product_id, quantity, unit_price, line_kind from order_items where order_id = ${body.order_id as string} order by line_kind`;
    expect(items).toEqual([
      { product_id: data.soapId, quantity: 1, unit_price: "45.00", line_kind: "item" },
      { product_id: data.riceId, quantity: 2, unit_price: "0.00", line_kind: "plan_component" },
    ]);

    const [sub] = await sql`select status, customer_email, fulfillment_snapshot from subscriptions where original_order_id = ${body.order_id as string}`;
    expect(sub.status).toBe("pending_setup");
    expect(sub.customer_email).toBe("juan@example.com");
    expect(sub.fulfillment_snapshot).toMatchObject({ method: "pickup", payment_method: "bank_transfer", delivery: { pickup_point_id: data.pickupPointId } });

    expect(await sql`select id from public_cart_items where cart_id = ${data.cartId}`).toHaveLength(0);
    expect(await sql`select id from public_cart_plans where cart_id = ${data.cartId}`).toHaveLength(0);
  });

  it("rejects plans in installments and asks to review a plan whose price changed", async () => {
    const partial = await executePublicCheckout({ request: checkoutRequest(data, { mode: "partial", payment_method: "mercadopago" }) });
    expect(partial.status).toBe(409);

    await sql`update offer_plans set price = 599 where id = ${data.planId}`;
    const repriced = await executePublicCheckout({ request: checkoutRequest(data) });
    expect(repriced.status).toBe(409);
    expect(await repriced.json()).toMatchObject({ code: "cart_repriced" });
    const [line] = await sql`select price_snapshot from public_cart_plans where cart_id = ${data.cartId}`;
    expect(line.price_snapshot).toBe("599.00");
  });
});
