import { describe, it, expect } from "vitest";

import { isTableServiceOrder } from "@/features/orders/helpers/isTableServiceOrder";

describe("isTableServiceOrder", () => {
  it("una mesa por QR se cobra con su cuenta", () => {
    expect(isTableServiceOrder({ source: "qr_table", qr_code_id: "q", table_label: "Mesa 6", order_type: "dine_in" })).toBe(true);
  });

  it("un kiosco que se sentó a la mesa también", () => {
    expect(isTableServiceOrder({ source: "kiosk", order_type: "dine_in" })).toBe(true);
  });

  it("mostrador, kiosco y tienda en línea no", () => {
    expect(isTableServiceOrder({ source: "staff" })).toBe(false);
    expect(isTableServiceOrder({ source: "kiosk", qr_code_id: "q" })).toBe(false);
    expect(isTableServiceOrder({ source: "public_store" })).toBe(false);
  });
});
