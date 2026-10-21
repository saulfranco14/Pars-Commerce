import { randomUUID } from "node:crypto";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { createTestServiceClient, sql } from "@/test/integration/setup";

import { declareTrackedOrderPayment } from "@/features/orders/services/publicOrderPaymentService";
import { chargeAtCounter } from "@/features/orders/services/counterPaymentService";

/**
 * A storefront order picked up and paid at the business: the customer says
 * how they pay from /pedido (like at a table), Caja's "Cobrar" confirms that
 * same payment, and both sides end up seeing the order paid.
 */
const SLUG = "itest-tracked-order-payment";

interface Seed {
  orderId: string;
  token: string;
}

async function cleanup(): Promise<void> {
  const tenants = sql`select id from tenants where slug = ${SLUG}`;
  await sql`delete from order_activity_log where order_id in (select id from orders where tenant_id in (${tenants}))`;
  await sql`delete from payments where order_id in (select id from orders where tenant_id in (${tenants}))`;
  await sql`delete from order_split_groups where order_id in (select id from orders where tenant_id in (${tenants}))`;
  await sql`delete from order_items where order_id in (select id from orders where tenant_id in (${tenants}))`;
  await sql`delete from orders where tenant_id in (${tenants})`;
  await sql`delete from product_inventory where product_id in (select id from products where tenant_id in (${tenants}))`;
  await sql`delete from products where tenant_id in (${tenants})`;
  await sql`delete from tenants where slug = ${SLUG}`;
}

async function seed(fulfillment: "in_progress" | "ready"): Promise<Seed> {
  const [tenant] = await sql`insert into tenants (name, slug, public_store_enabled) values ('ITest Pago', ${SLUG}, true) returning id`;
  const [product] = await sql`
    insert into products (tenant_id, name, slug, price, is_public, type, track_stock)
    values (${tenant.id}, 'Lavado', 'lavado', 199, true, 'service', false) returning id`;
  const [order] = await sql`
    insert into orders (tenant_id, status, fulfillment_status, subtotal, discount, total, source, customer_name,
      payment_mode, payment_method, fulfillment_method, payment_verification_status, paid_total, balance_due, order_type)
    values (${tenant.id}, 'assigned', ${fulfillment}, 199, 0, 199, 'public_store', 'Jaret',
      'single', 'cash', 'pickup', 'not_required', 0, 199, 'takeaway')
    returning id, public_tracking_token`;
  await sql`
    insert into order_items (order_id, product_id, quantity, unit_price, subtotal, fulfillment_status)
    values (${order.id}, ${product.id}, 1, 199, 199, ${fulfillment})`;
  return { orderId: order.id, token: order.public_tracking_token };
}

describe("customer declares payment, Caja confirms it", () => {
  beforeEach(cleanup);
  afterEach(cleanup);

  it("leaves one pending payment that the counter charge confirms", async () => {
    const admin = createTestServiceClient();
    const data = await seed("ready");

    const declared = await declareTrackedOrderPayment(admin, { token: data.token, method: "efectivo" });
    expect(declared).toEqual({ ok: true, data: { amount: 199 } });
    const again = await declareTrackedOrderPayment(admin, { token: data.token, method: "tarjeta" });
    expect(again).toMatchObject({ ok: false, error: { code: "conflict" } });

    const pending = await sql`select id, metadata->>'method' as method from payments where order_id = ${data.orderId} and status = 'pending'`;
    expect(pending).toHaveLength(1);
    expect(pending[0].method).toBe("efectivo");

    const charged = await chargeAtCounter(admin, { orderId: data.orderId, method: "efectivo", actorUserId: randomUUID() });
    expect(charged).toMatchObject({ ok: true, data: { allPaid: true, confirmedExisting: true } });

    const [order] = await sql`select status, balance_due from orders where id = ${data.orderId}`;
    expect(order.status).toBe("paid");
    expect(Number(order.balance_due)).toBe(0);
    expect(await sql`select id from payments where order_id = ${data.orderId}`).toHaveLength(1);
  });

  it("lets a storefront customer pay while it is still being prepared, and rejects unknown links", async () => {
    const admin = createTestServiceClient();
    const data = await seed("in_progress");
    const early = await declareTrackedOrderPayment(admin, { token: data.token, method: "transferencia" });
    expect(early).toEqual({ ok: true, data: { amount: 199 } });
    const unknown = await declareTrackedOrderPayment(admin, { token: randomUUID(), method: "efectivo" });
    expect(unknown).toMatchObject({ ok: false, error: { code: "not_found" } });
  });
});
