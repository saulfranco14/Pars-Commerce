import { describe, it, expect } from "vitest";

import {
  buildColumns,
  buildHistoryColumns,
  countStations,
  locateOrder,
  originLabel,
  rowInStation,
  toBoardOrder,
} from "@/features/operaciones/helpers/boardColumns";

import type { BoardOrderRow, BoardOrderExtras } from "@/features/operaciones/helpers/boardColumns";

const TODAY = "2026-10-19T06:00:00.000Z";

function row(overrides: Partial<BoardOrderRow> = {}): BoardOrderRow {
  return {
    id: "00000000-aaaa-bbbb-cccc-000000000001",
    order_number: "1048",
    status: "in_progress",
    fulfillment_status: "received",
    fulfillment_method: null,
    source: "staff",
    table_label: null,
    created_at: "2026-10-19T15:00:00.000Z",
    updated_at: "2026-10-19T15:00:00.000Z",
    scheduled_for: null,
    customer_name: "Ana",
    customer_phone: "5512345678",
    total: 300,
    paid_total: 0,
    balance_due: 300,
    paid_at: null,
    assigned_to: null,
    created_by: "u-waiter",
    ...overrides,
  };
}

const extras = (overrides: Partial<BoardOrderExtras> = {}): BoardOrderExtras => ({
  items: [{ id: "i1", name: "Lavado", quantity: 1, imageUrl: null, status: "received" }],
  deliveryEventTypes: [],
  assignedName: null,
  ...overrides,
});

describe("originLabel", () => {
  it("nombra la mesa, el canal o el mostrador", () => {
    expect(originLabel({ source: "qr_table", table_label: "4" })).toBe("Mesa 4");
    expect(originLabel({ source: "qr_table", table_label: "Terraza" })).toBe("Terraza");
    expect(originLabel({ source: "public_store", table_label: null })).toBe("Tienda en línea");
    expect(originLabel({ source: "staff", table_label: null })).toBe("Mostrador");
  });
});

describe("toBoardOrder", () => {
  it("preparación y entregas no ven montos", () => {
    expect(toBoardOrder(row(), extras(), "preparacion").total).toBeNull();
    expect(toBoardOrder(row(), extras(), "entregas").balanceDue).toBeNull();
    expect(toBoardOrder(row(), extras(), "caja").balanceDue).toBe(300);
  });

  it("solo entregas y recepción ven el teléfono", () => {
    expect(toBoardOrder(row(), extras(), "preparacion").customerPhone).toBeNull();
    expect(toBoardOrder(row(), extras(), "entregas").customerPhone).toBe("5512345678");
  });

  it("la dirección viene del detalle de entrega a domicilio", () => {
    const order = toBoardOrder(
      row({ fulfillment_method: "delivery" }),
      extras({ deliveryDetails: { address_text: "Calle 1", pickup_point_id: null } }),
      "entregas",
    );
    expect(order.fulfillmentMethod).toBe("delivery");
    expect(order.address).toBe("Calle 1");
  });
});

describe("buildColumns", () => {
  const card = (r: Partial<BoardOrderRow>, station: Parameters<typeof toBoardOrder>[2], e: Partial<BoardOrderExtras> = {}) =>
    toBoardOrder(row(r), extras(e), station);

  it("preparación separa por preparar y en proceso, sin solicitudes sin aceptar", () => {
    const orders = [
      card({ id: "a", fulfillment_status: "received" }, "preparacion"),
      card({ id: "b", fulfillment_status: "in_progress" }, "preparacion"),
      card({ id: "c", status: "pending_acceptance" }, "preparacion"),
    ];
    const [toDo, doing] = buildColumns("preparacion", orders, TODAY);
    expect(toDo.orders.map((o) => o.id)).toEqual(["a"]);
    expect(doing.orders.map((o) => o.id)).toEqual(["b"]);
  });

  it("entregas solo muestra pedidos listos a domicilio o para recoger, sin los ya entregados", () => {
    const orders = [
      card({ id: "home", fulfillment_status: "ready", fulfillment_method: "delivery", status: "paid" }, "entregas"),
      card({ id: "road", fulfillment_status: "ready", fulfillment_method: "delivery", status: "paid" }, "entregas", { deliveryEventTypes: ["out_for_delivery"] }),
      card({ id: "done", fulfillment_status: "ready", fulfillment_method: "pickup", status: "paid" }, "entregas", { deliveryEventTypes: ["pickup_completed"] }),
      card({ id: "table", fulfillment_status: "ready", source: "qr_table", table_label: "2" }, "entregas"),
    ];
    const [ready, onTheWay] = buildColumns("entregas", orders, TODAY);
    expect(ready.orders.map((o) => o.id)).toEqual(["home"]);
    expect(onTheWay.orders.map((o) => o.id)).toEqual(["road"]);
  });

  it("entregas nunca cobra: lo que falta pagar espera aparte hasta que Caja lo cobre", () => {
    const orders = [
      card({ id: "paid", fulfillment_status: "ready", fulfillment_method: "pickup", status: "paid" }, "entregas"),
      card({ id: "owes", fulfillment_status: "ready", fulfillment_method: "pickup" }, "entregas"),
    ];
    const [ready, , awaiting] = buildColumns("entregas", orders, TODAY);
    expect(ready.orders.map((o) => o.id)).toEqual(["paid"]);
    expect(awaiting.key).toBe("awaiting_payment");
    expect(awaiting.orders.map((o) => o.id)).toEqual(["owes"]);
  });

  it("recepción separa solicitudes, sin asignar y asignados", () => {
    const orders = [
      card({ id: "req", status: "pending_acceptance" }, "recepcion"),
      card({ id: "free" }, "recepcion"),
      card({ id: "taken", assigned_to: "u-1" }, "recepcion"),
    ];
    const [requests, unassigned, assigned] = buildColumns("recepcion", orders, TODAY);
    expect(requests.orders.map((o) => o.id)).toEqual(["req"]);
    expect(unassigned.orders.map((o) => o.id)).toEqual(["free"]);
    expect(assigned.orders.map((o) => o.id)).toEqual(["taken"]);
  });

  it("caja solo muestra lo que falta cobrar", () => {
    const orders = [
      card({ id: "owes", fulfillment_status: "ready" }, "caja"),
      card({ id: "paid", fulfillment_status: "ready", status: "paid", paid_total: 300, balance_due: 0 }, "caja"),
      card({ id: "working", fulfillment_status: "in_progress" }, "caja"),
    ];
    const [, ready, working] = buildColumns("caja", orders, TODAY);
    expect(ready.orders.map((o) => o.id)).toEqual(["owes"]);
    expect(working.orders.map((o) => o.id)).toEqual(["working"]);
  });

  it("caja pone primero los pagos que el cliente ya reportó, con su propina", () => {
    const payment = { id: "p1", amount: 250, tip: 50, method: "efectivo", payerName: "Gerardo" };
    const orders = [
      card({ id: "reported", source: "qr_table", table_label: "6", fulfillment_status: "ready" }, "caja", { pendingPayments: [payment] }),
      card({ id: "owes", fulfillment_status: "ready" }, "caja"),
    ];
    const [toConfirm, ready] = buildColumns("caja", orders, TODAY);
    expect(toConfirm.orders.map((o) => o.id)).toEqual(["reported"]);
    expect(toConfirm.orders[0].pendingPayments[0].tip).toBe(50);
    expect(ready.orders.map((o) => o.id)).toEqual(["owes"]);
  });

  it("caja pone el comprobante de transferencia en pagos por confirmar", () => {
    const proof = { id: "pr1", amountClaimed: 349, fileType: "image/jpeg", createdAt: TODAY, url: "https://x/y.jpg" };
    const orders = [
      card(
        { id: "proof", source: "public_store", status: "pending_payment", payment_verification_status: "proof_submitted" },
        "caja",
        { transferProof: proof },
      ),
    ];
    const [toConfirm, ready, working] = buildColumns("caja", orders, TODAY);
    expect(toConfirm.orders.map((o) => o.id)).toEqual(["proof"]);
    expect(toConfirm.orders[0].transferProof?.amountClaimed).toBe(349);
    expect([...ready.orders, ...working.orders]).toEqual([]);
  });

  it("el comprobante solo llega con su detalle a caja; las demás estaciones saben que espera revisión", () => {
    const proof = { id: "pr1", amountClaimed: 349, fileType: "image/jpeg", createdAt: TODAY, url: null };
    const prep = card({ payment_verification_status: "proof_submitted" }, "preparacion", { transferProof: proof });
    expect(prep.transferProof).toBeNull();
    expect(prep.paymentReview).toBe("proof");
  });

  it("una mesa pagada ya terminó: no sigue en recepción", () => {
    const orders = [
      card({ id: "paid-table", source: "qr_table", table_label: "6", status: "paid", assigned_to: "u-1" }, "recepcion"),
      card({ id: "paid-counter", source: "staff", status: "paid", assigned_to: "u-1" }, "recepcion"),
    ];
    const [, , assigned] = buildColumns("recepcion", orders, TODAY);
    expect(assigned.orders.map((o) => o.id)).toEqual(["paid-counter"]);
  });

  it("lo más viejo va primero: es lo siguiente por atender", () => {
    const orders = [
      card({ id: "new", created_at: "2026-10-19T16:00:00.000Z" }, "preparacion"),
      card({ id: "old", created_at: "2026-10-19T14:00:00.000Z" }, "preparacion"),
    ];
    expect(buildColumns("preparacion", orders, TODAY)[0].orders.map((o) => o.id)).toEqual(["old", "new"]);
  });

  it("caja: el historial lista lo pagado hoy, lo más reciente primero", () => {
    const orders = [
      card({ id: "morning", status: "paid", paid_total: 300 }, "caja", { doneAt: "2026-10-19T15:00:00.000Z", paidAmount: 300 }),
      card({ id: "noon", status: "paid", paid_total: 300 }, "caja", { doneAt: "2026-10-19T18:00:00.000Z", paidAmount: 300, tip: 50 }),
      card({ id: "unpaid" }, "caja", { doneAt: "2026-10-19T18:30:00.000Z" }),
    ];
    const [history] = buildHistoryColumns("caja", orders, TODAY);
    expect(history.orders.map((o) => o.id)).toEqual(["noon", "morning"]);
    expect(history.orders[0].tip).toBe(50);
  });

  it("terminados hoy: lo último que se terminó va arriba y lo de ayer no aparece", () => {
    const orders = [
      card({ id: "early", fulfillment_status: "ready" }, "preparacion", { doneAt: "2026-10-19T15:00:00.000Z" }),
      card({ id: "late", fulfillment_status: "ready" }, "preparacion", { doneAt: "2026-10-19T17:00:00.000Z" }),
      card({ id: "yesterday", fulfillment_status: "ready" }, "preparacion", { doneAt: "2026-10-18T20:00:00.000Z" }),
    ];
    expect(buildHistoryColumns("preparacion", orders, TODAY)[0].orders.map((o) => o.id)).toEqual(["late", "early"]);
  });
});

describe("rowInStation", () => {
  it("mis pedidos son los que levanté o me asignaron", () => {
    expect(rowInStation("mis-pedidos", row({ created_by: "u-1" }), "u-1")).toBe(true);
    expect(rowInStation("mis-pedidos", row({ assigned_to: "u-1", created_by: "u-2" }), "u-1")).toBe(true);
    expect(rowInStation("mis-pedidos", row({ created_by: "u-2" }), "u-1")).toBe(false);
  });

  it("preparación excluye lo listo y las mesas pagadas; entregas solo lo listo sin cerrar", () => {
    expect(rowInStation("preparacion", row({ fulfillment_status: "ready" }), "u")).toBe(false);
    expect(rowInStation("preparacion", row({ source: "qr_table", status: "paid" }), "u")).toBe(false);
    expect(rowInStation("entregas", row({ fulfillment_status: "ready" }), "u")).toBe(true);
    expect(rowInStation("entregas", row({ fulfillment_status: "ready", status: "completed" }), "u")).toBe(false);
  });
});

describe("countStations", () => {
  it("cuenta lo que espera a alguien en cada estación", () => {
    const entries = [
      row({ id: "req", status: "pending_acceptance", source: "public_store" }),
      row({ id: "free", created_by: "u-1" }),
      row({ id: "ready-owes", fulfillment_status: "ready", fulfillment_method: "pickup", assigned_to: "u-1" }),
      row({ id: "ready-paid", fulfillment_status: "ready", fulfillment_method: "pickup", status: "paid", assigned_to: "u-2" }),
    ].map((r) => ({ row: r, order: toBoardOrder(r, extras(), "caja") }));
    const counts = countStations(["recepcion", "mis-pedidos", "preparacion", "entregas", "caja"], entries, "u-1", TODAY);
    expect(counts).toEqual({ recepcion: 2, "mis-pedidos": 2, preparacion: 1, entregas: 1, caja: 1 });
  });
});

describe("locateOrder", () => {
  it("dice en qué estación y grupo está un pedido", () => {
    const r = row({ fulfillment_status: "ready", fulfillment_method: "pickup" });
    const order = toBoardOrder(r, extras(), "caja");
    expect(locateOrder(["preparacion", "entregas", "caja"], r, order, "u", TODAY)).toEqual([
      { station: "entregas", stationLabel: "Entregas", columnLabel: "Esperando cobro" },
      { station: "caja", stationLabel: "Caja", columnLabel: "Listos por cobrar" },
    ]);
  });
});
