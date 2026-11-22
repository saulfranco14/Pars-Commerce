import { describe, expect, it } from "vitest";

import { SOLUTIONS } from "@/features/solutions/solutionCatalog";
import { SOLUTION_SEO } from "@/features/solutions/constants/solutionSeo";

describe("SOLUTION_SEO", () => {
  it("covers every solution page", () => {
    for (const solution of SOLUTIONS) expect(SOLUTION_SEO[solution.path]).toBeDefined();
  });

  it("keeps titles and descriptions inside what search results show", () => {
    for (const seo of Object.values(SOLUTION_SEO)) {
      // « · Tlaco» from the root template adds 8 characters to the title.
      expect(seo.title.length + 8).toBeLessThanOrEqual(62);
      expect(seo.description.length).toBeLessThanOrEqual(160);
    }
  });
});
