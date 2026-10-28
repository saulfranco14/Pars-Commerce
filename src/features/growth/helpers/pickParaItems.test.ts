import { describe, expect, it } from "vitest";

import { pickParaItems } from "@/features/growth/helpers/pickParaItems";

import type { CatalogItemDefinition } from "@/features/catalog/catalogDefinitions";

const item = (name: string, category?: string): CatalogItemDefinition => ({ name, price: 10, type: "product", category });

describe("pickParaItems", () => {
  it("takes one item per category in turns", () => {
    const items = [item("Coca 1", "Refrescos"), item("Coca 2", "Refrescos"), item("Coca 3", "Refrescos"), item("Sabritas", "Botanas"), item("Leche", "Lácteos")];
    expect(pickParaItems(items, 4).map((entry) => entry.name)).toEqual(["Coca 1", "Sabritas", "Leche", "Coca 2"]);
  });

  it("stops when it runs out of items", () => {
    expect(pickParaItems([item("Uno"), item("Dos")], 8)).toHaveLength(2);
  });
});
