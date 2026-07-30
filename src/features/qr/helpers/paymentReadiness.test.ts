import { describe, it, expect } from "vitest";

import { requiresReadyBeforePayment } from "@/features/qr/helpers/paymentReadiness";

/**
 * La regla que decide si el cobro espera a que el pedido esté listo. Se separó
 * porque estaba implícita —"siempre espera"— y eso dejaba los tickets de
 * autoservicio sin forma de cobrarse.
 */
describe("requiresReadyBeforePayment", () => {
  it("espera en una mesa: el cliente paga cuando le llega", () => {
    expect(requiresReadyBeforePayment("qr_table")).toBe(true);
  });

  it("NO espera en la pantalla de autoservicio: se paga al pedir", () => {
    expect(requiresReadyBeforePayment("kiosk")).toBe(false);
  });

  it("NO espera en el mostrador: mismo caso, el cliente se lleva su número", () => {
    expect(requiresReadyBeforePayment("staff")).toBe(false);
  });

  it("un origen desconocido espera — no afloja nada de lo ya publicado", () => {
    expect(requiresReadyBeforePayment(null)).toBe(true);
    expect(requiresReadyBeforePayment(undefined)).toBe(true);
    expect(requiresReadyBeforePayment("")).toBe(true);
    expect(requiresReadyBeforePayment("public_store")).toBe(true);
  });

  it("no se cuela por espacios alrededor", () => {
    expect(requiresReadyBeforePayment("  kiosk  ")).toBe(false);
  });
});
