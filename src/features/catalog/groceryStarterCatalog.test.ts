import { existsSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { GROCERY_CATEGORIES, groceryProducts } from "@/features/catalog/groceryStarterCatalog";
import { deriveSlug } from "@/features/onboarding/helpers/deriveSlug";

describe("grocery starter catalog", () => {
  it("gives every product a unique slug once accents are stripped", () => {
    const slugs = groceryProducts.map((product) => deriveSlug(product.name));
    const duplicates = slugs.filter((slug, index) => slugs.indexOf(slug) !== index);
    expect(duplicates).toEqual([]);
    expect(slugs.every((slug) => slug.length > 0)).toBe(true);
  });

  it("keeps every price positive", () => {
    expect(groceryProducts.filter((product) => !(product.price > 0))).toEqual([]);
  });

  it("ships a cover image for every public category", () => {
    const missing = GROCERY_CATEGORIES.filter((category) => category.isPublic !== false)
      .filter((category) => !category.cover || !existsSync(join(process.cwd(), "public/catalog/starter/abarrotes", `${category.cover}.webp`)))
      .map((category) => category.name);
    expect(missing).toEqual([]);
  });

  it("keeps cigarettes off the public site", () => {
    const cigarettes = groceryProducts.filter((product) => product.category === "Cigarros");
    expect(cigarettes.length).toBeGreaterThan(0);
    expect(cigarettes.every((product) => product.isPublic === false)).toBe(true);
    expect(groceryProducts.filter((product) => product.category !== "Cigarros").every((product) => product.isPublic !== false)).toBe(true);
  });

  it("labels every beer for adults only", () => {
    const beers = groceryProducts.filter((product) => product.category === "Cervezas");
    expect(beers.every((product) => product.description?.includes("mayores de 18"))).toBe(true);
  });
});
