import { describe, expect, it } from "vitest";

import { createFakeSupabase } from "@/test/fakeSupabase";

import { handleStoreSubscriptionPayment } from "@/features/sitio/services/subscriptionWebhookHandlers";

type Admin = Parameters<typeof handleStoreSubscriptionPayment>[0];
const asClient = (db: ReturnType<typeof createFakeSupabase>) => db as unknown as Admin;

function subscription(completed: number) {
  return {
    id: "sub-1",
    tenant_id: "tenant-1",
    type: "recurring",
    status: "active",
    concept: "Despensa",
    installment_amount: 540,
    charge_amount: 540,
    service_fee_per_charge: 0,
    total_installments: null,
    completed_installments: completed,
    mp_preapproval_id: "pre-1",
    items_snapshot: [
      { product_id: "rice", quantity: 2, unit_price: 50, promotion_id: null },
      { product_id: "oil", quantity: 1, unit_price: 480, promotion_id: null },
    ],
    customer_name: "Ana",
    customer_email: "ana@example.com",
    customer_phone: "5512345678",
    customer_id: "cust-1",
    original_order_id: "order-1",
  };
}

const originalOrder = {
  id: "order-1",
  tenant_id: "tenant-1",
  status: "pending_subscription",
  fulfillment_method: "delivery",
  order_type: "takeaway",
  delivery_fee: 30,
  scheduled_for: null,
};

describe("handleStoreSubscriptionPayment", () => {
  it("settles the checkout order on the first charge instead of creating a second one", async () => {
    const db = createFakeSupabase({
      subscriptions: [subscription(0)],
      orders: [originalOrder],
      subscription_payments: [],
    });
    await handleStoreSubscriptionPayment(asClient(db), "pay-1", "pre-1");

    const orders = db.rowsOf("orders");
    expect(orders).toHaveLength(1);
    expect(orders[0]).toMatchObject({ id: "order-1", status: "paid", paid_total: 540, balance_due: 0 });
    expect(db.rowsOf("subscription_payments")[0]).toMatchObject({ order_id: "order-1", installment_number: 1 });
    expect(db.rowsOf("subscriptions")[0]).toMatchObject({ completed_installments: 1 });
  });

  it("creates later periods as pending and then pays them, copying the delivery", async () => {
    const db = createFakeSupabase({
      subscriptions: [subscription(1)],
      orders: [{ ...originalOrder, status: "paid" }],
      order_delivery_details: [{ id: "d1", order_id: "order-1", address_text: "Calle 1", recipient_name: "Ana" }],
      order_items: [],
      subscription_payments: [],
    });
    await handleStoreSubscriptionPayment(asClient(db), "pay-2", "pre-1");

    const renewal = db.rowsOf("orders").find((order) => order.id !== "order-1");
    expect(renewal).toMatchObject({
      status: "paid",
      total: 540,
      subscription_installment: 2,
      fulfillment_method: "delivery",
      delivery_fee: 30,
    });
    const insertedStatus = db.writes.find((write) => write.table === "orders" && write.op === "insert")?.values as Record<string, unknown>;
    expect(insertedStatus.status).toBe("pending_payment");
    expect(db.rowsOf("order_items")).toHaveLength(2);
    expect(db.rowsOf("order_delivery_details").filter((row) => row.order_id === renewal?.id)).toHaveLength(1);
  });

  it("does nothing when Mercado Pago retries a charge it already sent", async () => {
    const db = createFakeSupabase(
      { subscriptions: [subscription(1)], orders: [originalOrder], subscription_payments: [] },
      { errors: { subscription_payments: { code: "23505", message: "duplicate" } } },
    );
    await handleStoreSubscriptionPayment(asClient(db), "pay-2", "pre-1");

    expect(db.writes.filter((write) => write.table === "orders")).toHaveLength(0);
    expect(db.rowsOf("subscriptions")[0]).toMatchObject({ completed_installments: 1 });
  });
});
