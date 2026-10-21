import { describe, expect, it } from "vitest";

import { orderBackLink } from "@/features/orders/helpers/orderBackLink";

describe("orderBackLink", () => {
  it("returns to the station the order was opened from", () => {
    expect(orderBackLink("lavado", "/dashboard/lavado/operacion/caja")).toEqual({ href: "/dashboard/lavado/operacion/caja", label: "Volver a Caja" });
  });

  it("falls back to the orders list for anything else", () => {
    const list = { href: "/dashboard/lavado/ordenes", label: "Volver a órdenes" };
    expect(orderBackLink("lavado", null)).toEqual(list);
    expect(orderBackLink("lavado", "https://evil.example/dashboard/lavado/operacion/caja")).toEqual(list);
    expect(orderBackLink("lavado", "/dashboard/otro/operacion/caja")).toEqual(list);
    expect(orderBackLink("lavado", "/dashboard/lavado/operacion/inventada")).toEqual(list);
  });
});
