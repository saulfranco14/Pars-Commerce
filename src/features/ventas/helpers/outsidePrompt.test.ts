import { describe, expect, it } from "vitest";

import { outsidePrompt, parseOutsideItems } from "@/features/ventas/helpers/outsidePrompt";

describe("parseOutsideItems", () => {
  it("reads the JSON even inside fences or prose", () => {
    const text = 'Claro:\n```json\n{"items":[{"title":"Día de Muertos","detail":"Coincide con el lunes 2."},{"title":"Lluvias","detail":"Pudo influir en la tarde."}]}\n```';
    expect(parseOutsideItems(text)).toEqual([
      { title: "Día de Muertos", detail: "Coincide con el lunes 2." },
      { title: "Lluvias", detail: "Pudo influir en la tarde." },
    ]);
  });

  it("drops broken items, trims and keeps four at most", () => {
    const items = Array.from({ length: 6 }, (_, index) => ({ title: ` T${index} `, detail: "d" }));
    const parsed = parseOutsideItems(JSON.stringify({ items: [...items, { title: 1 }, { title: "x" }] }));
    expect(parsed).toHaveLength(4);
    expect(parsed[0].title).toBe("T0");
  });

  it("returns nothing for text that is not JSON", () => {
    expect(parseOutsideItems("No encontré nada.")).toEqual([]);
    expect(parseOutsideItems("{roto")).toEqual([]);
  });
});

describe("outsidePrompt", () => {
  it("names the giro, the place and the week", () => {
    expect(outsidePrompt({ giroLabel: "Cafetería", place: "Neza", from: "2026-11-02", to: "2026-11-08" })).toContain("Cafetería en Neza");
  });
});
