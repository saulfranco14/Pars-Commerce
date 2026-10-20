import { describe, it, expect } from "vitest";

import { orderCloseErrorMessage } from "@/features/qr/helpers/orderCloseError";

describe("orderCloseErrorMessage", () => {
  it("nombra el producto sin inventario", () => {
    expect(
      orderCloseErrorMessage({ message: "STOCK_INSUFFICIENT", details: "product_id=x; product=Cerveza; requested=2" }),
    ).toBe("No hay inventario suficiente de Cerveza para cerrar la cuenta. Ajusta el inventario y vuelve a confirmar.");
  });

  it("cualquier otro error pide volver a intentar", () => {
    expect(orderCloseErrorMessage({ message: "timeout" })).toMatch(/Vuelve a confirmar/);
  });
});
