import { describe, expect, it } from "vitest";

import { applyLineQuantity, cartTotals, groupCartLines, removeCartLine } from "@/features/checkout/helpers/cartLineGroups";

import type { PublicCartItem } from "@/types/cart";

function line(id: string, overrides: Partial<PublicCartItem> = {}): PublicCartItem {
  return { id, product_id: `p-${id}`, quantity: 1, price_snapshot: 100, ...overrides };
}

const pack = (id: string, unit: number, quantity: number, price: number, list: number) =>
  line(id, {
    group_id: "g1",
    group_unit_quantity: unit,
    quantity,
    price_snapshot: price,
    list_unit_price: list,
    promotion: { id: "promo", name: "Café y pan", type: "bundle_price" },
  });

describe("groupCartLines", () => {
  it("keeps standalone lines and folds a pack where its first line was", () => {
    const entries = groupCartLines([line("a"), pack("b", 1, 2, 40, 50), line("c"), pack("d", 2, 4, 15, 20)]);
    expect(entries.map((entry) => entry.kind)).toEqual(["line", "pack", "line"]);
    const group = entries[1];
    if (group.kind !== "pack") throw new Error("expected pack");
    expect(group.lines.map((l) => l.id)).toEqual(["b", "d"]);
    expect(group.packs).toBe(2);
    expect(group.name).toBe("Café y pan");
    expect(group.total).toBe(140);
    expect(group.listTotal).toBe(180);
  });
});

describe("applyLineQuantity", () => {
  it("sets a standalone line directly", () => {
    expect(applyLineQuantity([line("a")], "a", 5)[0].quantity).toBe(5);
  });

  it("moves the whole group one pack in the direction pressed", () => {
    const items = [pack("b", 1, 2, 40, 50), pack("d", 2, 4, 15, 20)];
    const up = applyLineQuantity(items, "b", 3);
    expect(up.map((l) => l.quantity)).toEqual([3, 6]);
    const down = applyLineQuantity(items, "d", 3);
    expect(down.map((l) => l.quantity)).toEqual([1, 2]);
  });

  it("drops the group when it goes below one pack", () => {
    const items = [line("a"), pack("b", 1, 1, 40, 50), pack("d", 2, 2, 15, 20)];
    expect(applyLineQuantity(items, "b", 0).map((l) => l.id)).toEqual(["a"]);
  });
});

describe("removeCartLine", () => {
  it("removes every line of a pack together", () => {
    const items = [line("a"), pack("b", 1, 1, 40, 50), pack("d", 2, 2, 15, 20)];
    expect(removeCartLine(items, "d").map((l) => l.id)).toEqual(["a"]);
    expect(removeCartLine(items, "a").map((l) => l.id)).toEqual(["b", "d"]);
  });
});

describe("cartTotals", () => {
  it("reports savings against list price, never negative", () => {
    const totals = cartTotals([line("a", { quantity: 2 }), pack("b", 1, 1, 40, 50), line("c", { list_unit_price: 80 })]);
    expect(totals.subtotal).toBe(340);
    expect(totals.savings).toBe(10);
    expect(totals.itemsCount).toBe(4);
  });
});
