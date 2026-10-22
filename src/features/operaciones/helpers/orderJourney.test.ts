import { describe, expect, it } from "vitest";

import { orderJourney } from "@/features/operaciones/helpers/orderJourney";
import { toBoardOrder } from "@/features/operaciones/helpers/boardColumns";

import type { BoardOrderExtras, BoardOrderRow } from "@/features/operaciones/helpers/boardColumns";

function order(r: Partial<BoardOrderRow> = {}, e: Partial<BoardOrderExtras> = {}) {
  const base: BoardOrderRow = {
    id: "o1",
    order_number: "A1C3",
    status: "assigned",
    fulfillment_status: "received",
    fulfillment_method: "pickup",
    source: "public_store",
    table_label: null,
    created_at: "2026-10-22T15:00:00.000Z",
    updated_at: "2026-10-22T15:00:00.000Z",
    scheduled_for: null,
    customer_name: "Laura",
    customer_phone: null,
    total: 300,
    paid_total: 0,
    balance_due: 300,
    paid_at: null,
    payment_method: "cash",
    assigned_to: null,
    created_by: null,
  };
  return toBoardOrder({ ...base, ...r }, { items: [], deliveryEventTypes: [], assignedName: null, ...e }, "caja");
}

const states = (o: ReturnType<typeof order>) => orderJourney(o).map((s) => `${s.key}:${s.state}:${s.detail}`);

describe("orderJourney", () => {
  it("recién aceptado: falta preparar, cobrar y entregar", () => {
    expect(states(order())).toEqual([
      "start:done:Aceptado",
      "prep:now:Por empezar",
      "pay:todo:Por cobrar en Caja",
      "delivery:todo:Recoge en local",
    ]);
  });

  it("una solicitud sin aceptar no se prepara todavía", () => {
    expect(states(order({ status: "pending_acceptance" })).slice(0, 2)).toEqual([
      "start:now:Por aceptar",
      "prep:todo:Por empezar",
    ]);
  });

  it("pagado en línea antes de preparar", () => {
    const items = [
      { id: "1", name: "A", quantity: 1, imageUrl: null, status: "ready" as const },
      { id: "2", name: "B", quantity: 1, imageUrl: null, status: "in_progress" as const },
      { id: "3", name: "C", quantity: 1, imageUrl: null, status: "received" as const },
    ];
    const o = order({ status: "paid", paid_total: 300, fulfillment_status: "in_progress", payment_method: "mercadopago" }, { items });
    expect(states(o).slice(1, 3)).toEqual(["prep:now:1 de 3 listos", "pay:done:Pagado en línea"]);
  });

  it("comprobante por revisar espera a Caja", () => {
    const o = order({ status: "pending_payment", payment_verification_status: "proof_submitted", fulfillment_method: "delivery" });
    expect(states(o)[2]).toBe("pay:wait:Comprobante por revisar");
    expect(states(o)[3]).toBe("delivery:todo:A domicilio");
  });

  it("listo sin pagar: el cobro es lo que sigue", () => {
    expect(states(order({ fulfillment_status: "ready" })).slice(1, 4)).toEqual([
      "prep:done:Listo",
      "pay:now:Por cobrar en Caja",
      "delivery:todo:Recoge en local",
    ]);
  });

  it("pagado y listo: toca entregar; luego en camino", () => {
    const paid = { status: "paid", paid_total: 300, fulfillment_status: "ready", fulfillment_method: "delivery" as const };
    expect(states(order(paid))[3]).toBe("delivery:now:Por salir");
    expect(states(order(paid, { deliveryEventTypes: ["out_for_delivery"] }))[3]).toBe("delivery:now:En camino");
  });

  it("una mesa no tiene entrega y se cobra al terminar", () => {
    const o = order({ source: "qr_table", table_label: "4", fulfillment_method: null, fulfillment_status: "in_progress" });
    expect(states(o)).toEqual(["start:done:Desde la mesa", "prep:now:En proceso", "pay:todo:Al terminar"]);
  });

  it("mostrador: el pago que el cliente declaró espera confirmación", () => {
    const payment = { id: "p", amount: 300, tip: 0, method: "efectivo", payerName: null };
    const o = order({ source: "staff", fulfillment_method: null }, { pendingPayments: [payment] });
    expect(states(o)).toEqual(["start:done:En mostrador", "prep:now:Por empezar", "pay:wait:Pago por confirmar"]);
  });
});
