import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { createTestAnonClient, createTestServiceClient, sql } from "@/test/integration/setup";
import {
  checkoutOrder,
  cleanupPlans,
  DAY,
  ensureAt as ensure,
  seedPlan,
  stockOf,
  subscriptionFor,
  type PlanSeed,
} from "@/test/integration/offers/planFixtures";

/**
 * 20261022000001_offer_plans against real Postgres: a plan bought in the
 * checkout becomes a subscription that activates when its order is paid by any
 * path, renews on demand exactly once per period, goes past due after grace,
 * and never touches legacy subscriptions.
 */
const SLUG = "itest-offer-plans";

describe("offer plans migration", () => {
  let data: PlanSeed;

  beforeEach(async () => {
    await cleanupPlans(SLUG);
    data = await seedPlan(SLUG);
  });

  afterEach(async () => {
    await cleanupPlans(SLUG);
  });

  it("turns the cart's plan into a pending instance billed by the checkout order", async () => {
    const orderId = await checkoutOrder(data);
    const sub = await subscriptionFor(orderId);
    expect(sub).toMatchObject({ status: "pending_setup", offer_plan_id: data.planId, billing_method: "manual", current_period_number: 0 });
    expect(sub.public_token).toMatch(/^[0-9a-f]{64}$/);

    const periods = await sql`select period_number, status, order_id from subscription_periods where subscription_id = ${sub.id}`;
    expect(periods).toEqual([{ period_number: 1, status: "pending", order_id: orderId }]);
    const [charge] = await sql`select amount, name_snapshot from order_plan_charges where order_id = ${orderId}`;
    expect(charge).toMatchObject({ amount: "559.00", name_snapshot: "Despensa Básica" });
    const items = await sql`select quantity, unit_price, line_kind from order_items where order_id = ${orderId}`;
    expect(items).toEqual([{ quantity: 2, unit_price: "0.00", line_kind: "plan_component" }]);
  });

  it("refuses to attach a plan that was paused after it reached the cart", async () => {
    await sql`update offer_plans set status = 'paused' where id = ${data.planId}`;
    await expect(checkoutOrder(data)).rejects.toMatchObject({ message: "PLAN_NOT_ACTIVE" });
  });

  it("activates on an approved transfer and decrements the plan's stock once", async () => {
    const orderId = await checkoutOrder(data);
    await sql`update orders set payment_verification_status = 'approved' where id = ${orderId}`;
    await sql`update orders set status = 'paid' where id = ${orderId}`;

    const sub = await subscriptionFor(orderId);
    expect(sub).toMatchObject({ status: "active", current_period_number: 1, completed_installments: 1 });
    expect(sub.start_date).not.toBeNull();
    expect(new Date(sub.current_period_end).getTime()).toBeGreaterThan(Date.now() + 27 * DAY);
    expect(await stockOf(data.riceId)).toBe(8);
    const payments = await sql`select installment_number from subscription_payments where subscription_id = ${sub.id}`;
    expect(payments).toHaveLength(1);
  });

  it("creates the next period's order once, only inside the renewal window", async () => {
    const orderId = await checkoutOrder(data);
    await sql`update orders set status = 'paid' where id = ${orderId}`;
    const sub = await subscriptionFor(orderId);
    const end = new Date(sub.current_period_end);

    expect(await ensure(data.tenantId, new Date(end.getTime() - 10 * DAY))).toBe(0);
    expect(await ensure(data.tenantId, new Date(end.getTime() - 2 * DAY))).toBe(1);
    expect(await ensure(data.tenantId, new Date(end.getTime() - 1 * DAY))).toBe(0);

    const [period] = await sql`select * from subscription_periods where subscription_id = ${sub.id} and period_number = 2`;
    expect(period.status).toBe("pending");
    expect(new Date(period.starts_at).getTime()).toBe(end.getTime());
    const [renewal] = await sql`select * from orders where id = ${period.order_id}`;
    expect(renewal).toMatchObject({
      status: "pending_payment", subscription_id: sub.id, subscription_installment: 2,
      total: "559.00", payment_method: "bank_transfer", payment_verification_status: "proof_required",
    });
    const items = await sql`select quantity, line_kind from order_items where order_id = ${renewal.id}`;
    expect(items).toEqual([{ quantity: 2, line_kind: "plan_component" }]);

    await sql`update orders set status = 'paid' where id = ${renewal.id}`;
    const after = await subscriptionFor(orderId);
    expect(after.current_period_number).toBe(2);
    expect(await stockOf(data.riceId)).toBe(6);
  });

  it("marks an unpaid renewal overdue after the grace days and recovers when paid", async () => {
    const orderId = await checkoutOrder(data);
    await sql`update orders set status = 'paid' where id = ${orderId}`;
    const sub = await subscriptionFor(orderId);
    const end = new Date(sub.current_period_end);
    await ensure(data.tenantId, new Date(end.getTime() - DAY));

    await ensure(data.tenantId, new Date(end.getTime() + 6 * DAY));
    expect((await subscriptionFor(orderId)).status).toBe("past_due");
    const [period] = await sql`select * from subscription_periods where subscription_id = ${sub.id} and period_number = 2`;
    expect(period.status).toBe("overdue");

    await sql`update orders set status = 'paid' where id = ${period.order_id}`;
    const recovered = await subscriptionFor(orderId);
    expect(recovered).toMatchObject({ status: "active", current_period_number: 2, past_due_since: null });
  });

  it("cancels the subscription when the first order is cancelled", async () => {
    const orderId = await checkoutOrder(data);
    await sql`update orders set status = 'cancelled' where id = ${orderId}`;
    expect((await subscriptionFor(orderId)).status).toBe("cancelled");
    expect(await stockOf(data.riceId)).toBe(10);
  });

  it("stops renewing a plan cancelled at period end and completes fixed-length plans", async () => {
    const orderId = await checkoutOrder(data);
    await sql`update orders set status = 'paid' where id = ${orderId}`;
    const sub = await subscriptionFor(orderId);
    await sql`update subscriptions set cancel_at_period_end = true where id = ${sub.id}`;
    const end = new Date(sub.current_period_end);
    expect(await ensure(data.tenantId, new Date(end.getTime() - DAY))).toBe(0);
    await ensure(data.tenantId, new Date(end.getTime() + DAY));
    expect((await subscriptionFor(orderId)).status).toBe("cancelled");

    await sql`update subscriptions set cancel_at_period_end = false, status = 'active', total_installments = 1 where id = ${sub.id}`;
    expect(await ensure(data.tenantId, new Date(end.getTime() - DAY))).toBe(0);
    await ensure(data.tenantId, new Date(end.getTime() + DAY));
    expect((await subscriptionFor(orderId)).status).toBe("completed");
  });

  it("leaves legacy subscriptions and order lines exactly as they were", async () => {
    const [legacy] = await sql`
      insert into subscriptions (tenant_id, customer_name, customer_email, type, frequency_type,
        original_amount, discounted_amount, installment_amount, charge_amount, status)
      values (${data.tenantId}, 'Ana', 'ana@example.com', 'recurring', 'months', 100, 100, 100, 100, 'active')
      returning status, offer_plan_id, current_period_number, cancel_at_period_end`;
    expect(legacy).toMatchObject({ status: "active", offer_plan_id: null, current_period_number: 0, cancel_at_period_end: false });
    expect(await ensure(data.tenantId, new Date(Date.now() + 400 * DAY))).toBe(0);
    const [still] = await sql`select status from subscriptions where customer_email = 'ana@example.com' and tenant_id = ${data.tenantId}`;
    expect(still.status).toBe("active");

    const [order] = await sql`
      insert into orders (tenant_id, status, subtotal, discount, total, paid_total, balance_due)
      values (${data.tenantId}, 'draft', 30, 0, 30, 0, 30) returning id`;
    const [line] = await sql`
      insert into order_items (order_id, product_id, quantity, unit_price, subtotal)
      values (${order.id}, ${data.riceId}, 1, 30, 30) returning line_kind, subscription_id`;
    expect(line).toEqual({ line_kind: "item", subscription_id: null });
  });

  it("keeps plans and their functions away from anonymous visitors", async () => {
    const anon = createTestAnonClient();
    const { data: plans } = await anon.from("offer_plans").select("id").eq("tenant_id", data.tenantId);
    expect(plans ?? []).toEqual([]);
    const { error } = await anon.rpc("ensure_due_periods", { p_tenant_id: data.tenantId });
    expect(error).not.toBeNull();
  });

  it("saves a plan with the default billing and delivery methods when they are omitted", async () => {
    const { data: id, error } = await createTestServiceClient().rpc("save_offer_plan", {
      p_plan: { tenant_id: data.tenantId, kind: "subscription", name: "Pan semanal", slug: "pan", price: 120, interval_unit: "week" },
      p_items: [{ product_id: data.riceId, quantity: 1 }],
    });
    expect(error).toBeNull();
    const [plan] = await sql`select status, billing_methods, fulfillment_methods from offer_plans where id = ${id as string}`;
    expect(plan).toEqual({ status: "draft", billing_methods: ["manual"], fulfillment_methods: ["pickup"] });
  });
});
