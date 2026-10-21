import { describe, expect, it } from "vitest";

import { offerDisplayStatus } from "@/features/promociones/helpers/offerStatus";
import { previewPromotion } from "@/features/promociones/helpers/promotionPreview";
import { rankSuggestedItems, templatesFor } from "@/features/promociones/helpers/templateSuggestions";
import { validityRange } from "@/features/promociones/helpers/validityPresets";

const NOW = new Date("2026-10-21T12:00:00");

describe("templatesFor", () => {
  it("separates templates for the business type from the universal ones", () => {
    const { forYou, universal } = templatesFor("lavado_autos");
    expect(forYou.map((template) => template.key)).toEqual(expect.arrayContaining(["lavado_combo", "club_lavado"]));
    expect(universal.every((template) => template.verticals === "all")).toBe(true);
  });

  it("returns only universal templates for an unknown business type", () => {
    expect(templatesFor(null).forYou).toHaveLength(0);
  });
});

describe("rankSuggestedItems", () => {
  it("floats keyword matches to the top ignoring accents and case", () => {
    const ranked = rankSuggestedItems([{ name: "Aromatizante" }, { name: "Encerado" }, { name: "Pulido de faros" }], ["encerado", "pulido"]);
    expect(ranked.map((entry) => entry.item.name)).toEqual(["Encerado", "Pulido de faros", "Aromatizante"]);
    expect(ranked[2].suggested).toBe(false);
  });
});

describe("offerDisplayStatus", () => {
  it("derives scheduled and expired from the dates", () => {
    expect(offerDisplayStatus({ status: "active", valid_from: "2026-11-01T00:00:00Z" }, NOW)).toBe("scheduled");
    expect(offerDisplayStatus({ status: "active", valid_until: "2026-10-01T00:00:00Z" }, NOW)).toBe("expired");
    expect(offerDisplayStatus({ status: "paused", valid_until: "2026-10-01T00:00:00Z" }, NOW)).toBe("paused");
  });
});

describe("validityRange", () => {
  it("covers this weekend from a Wednesday", () => {
    expect(validityRange("weekend", new Date("2026-10-21T12:00:00"))).toEqual({ from: "2026-10-23", until: "2026-10-25" });
  });

  it("starts today when the weekend already began", () => {
    expect(validityRange("weekend", new Date("2026-10-24T12:00:00"))).toEqual({ from: "2026-10-24", until: "2026-10-25" });
  });

  it("ends on the last day of the month", () => {
    expect(validityRange("month", NOW).until).toBe("2026-10-31");
  });
});

describe("previewPromotion", () => {
  it("prices a 2x1 as two pieces for the price of one", () => {
    expect(previewPromotion({ mechanic: "nxm", value: 0, buyQuantity: 2, payQuantity: 1, items: [{ id: "t", name: "Taco", price: 85, quantity: 1 }] })).toMatchObject({
      finalTotal: 85,
      listTotal: 170,
      savings: 85,
      savingsPercent: 50,
    });
  });

  it("prices a pack against the sum of its items", () => {
    const preview = previewPromotion({
      mechanic: "bundle_price",
      value: 199,
      items: [
        { id: "a", name: "Lavado", price: 150, quantity: 1 },
        { id: "b", name: "Encerado", price: 100, quantity: 1 },
      ],
    });
    expect(preview).toMatchObject({ listTotal: 250, finalTotal: 199, savings: 51 });
  });

  it("returns nothing for an event badge", () => {
    expect(previewPromotion({ mechanic: "event_badge", value: 0, items: [{ id: "a", name: "A", price: 10, quantity: 1 }] })).toBeNull();
  });
});
