import { describe, expect, it } from "vitest";

import { isLeadLinkToken, leadLinkSlug } from "@/features/growth/helpers/leadLinkToken";

describe("leadLinkSlug", () => {
  it("keeps the name readable without accents or symbols", () => {
    expect(leadLinkSlug("360 Spray Paint")).toBe("360-spray-paint");
    expect(leadLinkSlug("Panadería «La Espiga»")).toBe("panaderia-la-espiga");
  });

  it("cuts long names at a word", () => {
    expect(leadLinkSlug("Materiales para la construcción y ferretería El Güero")).toBe("materiales-para-la-construccion");
  });

  it("is empty when the name has nothing usable", () => {
    expect(leadLinkSlug("¡¡!!")).toBe("");
  });
});

describe("isLeadLinkToken", () => {
  it("accepts old and new links", () => {
    expect(isLeadLinkToken("CS5Dx7kq2Xm9aTzP0bLwYc3NvR8uE1gHfJ6sKdQ4oIA")).toBe(true);
    expect(isLeadLinkToken("360-spray-paint-7Kq2Xm9a_TzP")).toBe(true);
  });

  it("rejects short or odd input", () => {
    expect(isLeadLinkToken("short")).toBe(false);
    expect(isLeadLinkToken("360 spray paint 7Kq2Xm9a")).toBe(false);
  });
});
