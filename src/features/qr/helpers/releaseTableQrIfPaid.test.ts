import { describe, it, expect } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";

import { createFakeSupabase } from "@/test/fakeSupabase";
import { releaseTableQrIfPaid } from "@/features/qr/helpers/releaseTableQrIfPaid";

/**
 * Cuándo se gasta un QR al cobrar.
 *
 * Un ticket que se paga POR ADELANTADO no puede archivarse al cobrar: es la única
 * pantalla donde el cliente sigue su pedido, y morir ahí lo dejaba con un QR
 * muerto ("Código QR no disponible") justo después de pagar.
 *
 * Y al revés: una MESA sí tiene que liberarse al pagar. Si esto se rompe, la mesa
 * se queda ocupada para siempre — de ahí que estén las dos caras aquí.
 */

const asClient = (db: ReturnType<typeof createFakeSupabase>) =>
  db as unknown as SupabaseClient;

function scenario({
  kind,
  source,
  status = "paid",
  fulfillment = "received",
}: {
  kind: string;
  source: string | null;
  status?: string;
  fulfillment?: string;
}) {
  return createFakeSupabase({
    orders: [
      {
        id: "o1",
        status,
        qr_code_id: "q1",
        order_type: "takeaway",
        source,
        fulfillment_status: fulfillment,
      },
    ],
    qr_codes: [
      {
        id: "q1",
        current_order_id: "o1",
        kind,
        is_active: true,
        archived_at: null,
      },
    ],
    order_activity_log: [],
  });
}

function qrUpdate(db: ReturnType<typeof createFakeSupabase>) {
  return db.writes.find((w) => w.table === "qr_codes" && w.op === "update");
}

describe("releaseTableQrIfPaid", () => {
  it("ticket de autoservicio pagado y sin empezar: NO lo archiva", async () => {
    const db = scenario({ kind: "order", source: "kiosk" });
    await releaseTableQrIfPaid(asClient(db), "o1");
    expect(qrUpdate(db)).toBeUndefined();
  });

  it("ticket de autoservicio en proceso: sigue vivo", async () => {
    const db = scenario({
      kind: "order",
      source: "kiosk",
      fulfillment: "in_progress",
    });
    await releaseTableQrIfPaid(asClient(db), "o1");
    expect(qrUpdate(db)).toBeUndefined();
  });

  it("ticket de autoservicio LISTO: ahí sí se gasta", async () => {
    const db = scenario({
      kind: "order",
      source: "kiosk",
      fulfillment: "ready",
    });
    await releaseTableQrIfPaid(asClient(db), "o1");
    const write = qrUpdate(db);
    expect(write).toBeDefined();
    expect(write?.values).toMatchObject({
      current_order_id: null,
      is_active: false,
    });
  });

  it("ticket de mostrador: también paga por adelantado, también sigue vivo", async () => {
    const db = scenario({ kind: "order", source: "staff" });
    await releaseTableQrIfPaid(asClient(db), "o1");
    expect(qrUpdate(db)).toBeUndefined();
  });

  it("MESA pagada: se libera al cobrar — si no, queda ocupada para siempre", async () => {
    const db = scenario({ kind: "table", source: "qr_table" });
    await releaseTableQrIfPaid(asClient(db), "o1");
    const write = qrUpdate(db);
    expect(write).toBeDefined();
    expect(write?.values).toMatchObject({ current_order_id: null });
    // Una mesa NO se archiva: se reusa con el siguiente cliente.
    expect(write?.values).not.toHaveProperty("archived_at");
  });

  it("QR de cobro suelto pagado: también se libera", async () => {
    const db = scenario({ kind: "payment", source: "qr_payment" });
    await releaseTableQrIfPaid(asClient(db), "o1");
    expect(qrUpdate(db)).toBeDefined();
  });

  it("ticket de origen desconocido: se gasta al cobrar (regla estricta)", async () => {
    const db = scenario({ kind: "order", source: null });
    await releaseTableQrIfPaid(asClient(db), "o1");
    expect(qrUpdate(db)).toBeDefined();
  });

  it("sin pagar no toca nada", async () => {
    const db = scenario({
      kind: "table",
      source: "qr_table",
      status: "in_progress",
    });
    await releaseTableQrIfPaid(asClient(db), "o1");
    expect(qrUpdate(db)).toBeUndefined();
  });

  it("si el QR ya apunta a otra orden, no lo toca", async () => {
    const db = createFakeSupabase({
      orders: [
        {
          id: "o1",
          status: "paid",
          qr_code_id: "q1",
          source: "qr_table",
          fulfillment_status: "ready",
        },
      ],
      qr_codes: [{ id: "q1", current_order_id: "otra", kind: "table" }],
      order_activity_log: [],
    });
    await releaseTableQrIfPaid(asClient(db), "o1");
    expect(qrUpdate(db)).toBeUndefined();
  });
});
