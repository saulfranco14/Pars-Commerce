import { describe, expect, it } from "vitest";

import { EMPTY_WIZARD_VALUES } from "@/features/promociones/helpers/offerWizardMapping";
import { suggestPromotionName } from "@/features/promociones/helpers/promotionNaming";

const names: Record<string, string> = { t: "Tacos al pastor", l: "Lavado", e: "Encerado", a: "Aromatizante" };
const nameOf = (id: string) => names[id];

describe("suggestPromotionName", () => {
  it("names a 2x1 after its product", () => {
    expect(suggestPromotionName({ ...EMPTY_WIZARD_VALUES, mechanic: "nxm", productIds: ["t"] }, nameOf)).toBe("2x1 en Tacos al pastor");
  });

  it("names a pack after its items", () => {
    expect(
      suggestPromotionName(
        { ...EMPTY_WIZARD_VALUES, mechanic: "bundle_price", packItems: [{ product_id: "l", quantity: 1 }, { product_id: "e", quantity: 1 }] },
        nameOf,
      ),
    ).toBe("Combo Lavado + Encerado");
  });

  it("names a whole-store discount", () => {
    expect(suggestPromotionName({ ...EMPTY_WIZARD_VALUES, mechanic: "percentage", value: "15", appliesToAll: true }, nameOf)).toBe(
      "15% en toda la tienda",
    );
  });

  it("summarizes long product lists", () => {
    expect(
      suggestPromotionName({ ...EMPTY_WIZARD_VALUES, mechanic: "fixed_amount", value: "20", productIds: ["l", "e", "a"] }, nameOf),
    ).toBe("$20.00 menos en Lavado, Encerado y 1 más");
  });
});
