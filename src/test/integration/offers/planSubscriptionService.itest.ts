import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { createTestServiceClient, sql } from "@/test/integration/setup";
import { checkoutOrder, cleanupPlans, seedPlan, subscriptionFor, type PlanSeed } from "@/test/integration/offers/planFixtures";

import {
  cancelPlanSubscription,
  getPublicPlan,
  listPlanSubscriptions,
  resumePlanSubscription,
} from "@/features/suscripciones/services/planSubscriptionService";

/**
 * What the dashboard and /plan/{token} read and do: lists issue due renewals
 * on read, cancelling now voids the unpaid renewal, and the customer link
 * only opens its own subscription.
 */
const SLUG = "itest-plan-subscriptions";

async function moveIntoRenewalWindow(subscriptionId: string): Promise<void> {
  // Shift the paid period back so its end falls inside the lead days.
  await sql`
    update subscriptions
    set start_date = now() - interval '1 month' + interval '1 day',
        current_period_start = now() - interval '1 month' + interval '1 day',
        current_period_end = now() + interval '1 day'
    where id = ${subscriptionId}`;
}

describe("plan subscription service", () => {
  let data: PlanSeed;

  beforeEach(async () => {
    await cleanupPlans(SLUG);
    data = await seedPlan(SLUG);
  });

  afterEach(async () => {
    await cleanupPlans(SLUG);
  });

  it("issues the due renewal when the list is read, with its pay link", async () => {
    const admin = createTestServiceClient();
    const orderId = await checkoutOrder(data);
    await sql`update orders set status = 'paid' where id = ${orderId}`;
    const sub = await subscriptionFor(orderId);
    await moveIntoRenewalWindow(sub.id);

    const result = await listPlanSubscriptions(admin, data.tenantId);
    if (!result.ok) throw new Error(result.error.message);
    const [row] = result.data;
    expect(row.status).toBe("active");
    expect(row.due_period).toMatchObject({ period_number: 2, status: "pending", amount: 559 });
    expect(row.due_period?.order_tracking_token).toBeTruthy();
    expect(row.plan.name).toBe("Despensa Básica");

    const again = await listPlanSubscriptions(admin, data.tenantId);
    if (!again.ok) throw new Error(again.error.message);
    expect(await sql`select id from subscription_periods where subscription_id = ${sub.id}`).toHaveLength(2);
  });

  it("cancelling now voids the unpaid renewal order; at period end only stops renewing", async () => {
    const admin = createTestServiceClient();
    const orderId = await checkoutOrder(data);
    await sql`update orders set status = 'paid' where id = ${orderId}`;
    const sub = await subscriptionFor(orderId);

    await cancelPlanSubscription(admin, { tenantId: data.tenantId, subscriptionId: sub.id, when: "period_end" });
    expect(await subscriptionFor(orderId)).toMatchObject({ status: "active", cancel_at_period_end: true });
    await resumePlanSubscription(admin, { tenantId: data.tenantId, subscriptionId: sub.id });
    expect((await subscriptionFor(orderId)).cancel_at_period_end).toBe(false);

    await moveIntoRenewalWindow(sub.id);
    await listPlanSubscriptions(admin, data.tenantId);
    const [renewal] = await sql`select order_id from subscription_periods where subscription_id = ${sub.id} and period_number = 2`;

    await cancelPlanSubscription(admin, { tenantId: data.tenantId, subscriptionId: sub.id, when: "now" });
    expect((await subscriptionFor(orderId)).status).toBe("cancelled");
    const [order] = await sql`select status from orders where id = ${renewal.order_id}`;
    expect(order.status).toBe("cancelled");
    const [period] = await sql`select status from subscription_periods where order_id = ${renewal.order_id}`;
    expect(period.status).toBe("cancelled");
  });

  it("opens the customer page only with the exact token and never another tenant's plan", async () => {
    const admin = createTestServiceClient();
    const orderId = await checkoutOrder(data);
    const sub = await subscriptionFor(orderId);

    const view = await getPublicPlan(admin, sub.public_token);
    expect(view).toMatchObject({ id: sub.id, status: "pending_setup", tenant: { name: "ITest Plans" } });
    expect(view?.periods).toHaveLength(1);
    const wrong = sub.public_token.slice(0, -1) + (sub.public_token.endsWith("0") ? "1" : "0");
    expect(await getPublicPlan(admin, wrong)).toBeNull();
    expect(await getPublicPlan(admin, "not-a-token")).toBeNull();

    const other = await cancelPlanSubscription(admin, { tenantId: "00000000-0000-0000-0000-000000000000", subscriptionId: sub.id, when: "now" });
    expect(other).toMatchObject({ ok: false, error: { code: "not_found" } });
  });
});
