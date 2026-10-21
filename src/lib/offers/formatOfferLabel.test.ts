import { describe, expect, it } from "vitest";

import { formatOfferLabel } from "@/lib/offers/formatOfferLabel";

describe("formatOfferLabel", () => {
  it("labels every mechanic", () => {
    expect(formatOfferLabel({ type: "percentage", value: 15 })).toBe("15% de descuento");
    expect(formatOfferLabel({ type: "fixed_amount", value: 20 })).toBe("$20.00 de descuento");
    expect(formatOfferLabel({ type: "fixed_price", value: "99.5" })).toBe("Precio especial $99.50");
    expect(formatOfferLabel({ type: "bundle_price", value: 100, quantity: 3 })).toBe("3 por $100.00");
    expect(formatOfferLabel({ type: "nxm", value: 0, buy_quantity: 2, pay_quantity: 1 })).toBe("2x1");
    expect(formatOfferLabel({ type: "event_badge", value: 0, badge_label: "Buen Fin" })).toBe("Buen Fin");
  });

  it("formats thousands like the rest of the store", () => {
    expect(formatOfferLabel({ type: "fixed_price", value: 1200 })).toBe("Precio especial $1,200.00");
  });
});
