import { describe, it, expect } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";

import { createFakeSupabase } from "@/test/fakeSupabase";
import { advanceFulfillment } from "@/features/qr/services/tableFulfillmentService";

/**
 * Pagar primero y trabajar después (el flujo de autoservicio, tipo Rappi).
 *
 * `advanceFulfillment` rechazaba cualquier pedido pagado, así que en cuanto el
 * cliente pagaba por adelantado su pedido quedaba congelado en "recibido" para
 * siempre: no había forma de marcarlo en proceso ni listo. En una mesa el rechazo
 * SÍ es correcto — ahí el cobro va al final y pagado significa terminado.
 */

const asClient = (db: ReturnType<typeof createFakeSupabase>) =>
  db as unknown as SupabaseClient;

function order(source: string | null, status: string, fulfillment: string) {
  return createFakeSupabase({
    orders: [{ id: "o1", status, fulfillment_status: fulfillment, source }],
    order_activity_log: [],
  });
}

describe("avanzar el trabajo de un pedido YA PAGADO", () => {
  it("autoservicio: se puede empezar después de pagar", async () => {
    const result = await advanceFulfillment(
      asClient(order("kiosk", "paid", "received")),
      { orderId: "o1", target: "in_progress", actorUserId: "u1" },
    );
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.data.fulfillmentStatus).toBe("in_progress");
  });

  it("autoservicio: y se puede marcar listo al terminar", async () => {
    const result = await advanceFulfillment(
      asClient(order("kiosk", "paid", "in_progress")),
      { orderId: "o1", target: "ready", actorUserId: "u1" },
    );
    expect(result.ok).toBe(true);
  });

  it("mostrador: mismo caso, mismo permiso", async () => {
    const result = await advanceFulfillment(
      asClient(order("staff", "paid", "received")),
      { orderId: "o1", target: "in_progress", actorUserId: "u1" },
    );
    expect(result.ok).toBe(true);
  });

  it("mesa pagada: sigue rechazando — ahí pagado es terminado", async () => {
    const result = await advanceFulfillment(
      asClient(order("qr_table", "paid", "ready")),
      { orderId: "o1", target: "in_progress", actorUserId: "u1" },
    );
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.message).toMatch(/ya está pagada/);
  });

  it("origen desconocido pagado: sigue rechazando", async () => {
    const result = await advanceFulfillment(
      asClient(order(null, "paid", "received")),
      { orderId: "o1", target: "in_progress", actorUserId: "u1" },
    );
    expect(result.ok).toBe(false);
  });

  it("cancelada no avanza, venga de donde venga", async () => {
    const result = await advanceFulfillment(
      asClient(order("kiosk", "cancelled", "received")),
      { orderId: "o1", target: "in_progress", actorUserId: "u1" },
    );
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.message).toMatch(/cancelada/);
  });

  it("sin pagar avanza igual que siempre", async () => {
    const result = await advanceFulfillment(
      asClient(order("kiosk", "in_progress", "received")),
      { orderId: "o1", target: "in_progress", actorUserId: "u1" },
    );
    expect(result.ok).toBe(true);
  });

  it("deja rastro de quién lo movió y de dónde a dónde", async () => {
    const db = order("kiosk", "paid", "received");
    await advanceFulfillment(asClient(db), {
      orderId: "o1",
      target: "ready",
      actorUserId: "u1",
    });
    const logged = db.writes.find(
      (w) => w.table === "order_activity_log" && w.op === "insert",
    );
    expect(logged).toBeDefined();
    expect(logged?.values).toMatchObject({
      action: "fulfillment.changed",
      payload: { from: "received", to: "ready" },
    });
  });
});
