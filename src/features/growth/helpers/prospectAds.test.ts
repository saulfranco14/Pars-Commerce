import { describe, expect, it } from "vitest";

import { adBusinessName, adDefaultPlace, buildLeadAds, formatAdPrice, headlineScale, pickBackground, sanitizeAdEdits } from "@/features/growth/helpers/prospectAds";

const LEAD = { businessName: "CAFE LA ESQUINA", giro: "cafeteria", colonia: "BENITO JUAREZ", municipio: "Nezahualcóyotl", edits: {}, backgrounds: {} };

describe("adBusinessName", () => {
  it("formats a real DENUE name and drops the legal suffix", () => {
    expect(adBusinessName("CAFE LA ESQUINA", "cafeteria")).toBe("Cafe La Esquina");
    expect(adBusinessName("ABARROTES LUPITA SA DE CV", "tienda")).toBe("Abarrotes Lupita");
  });

  it("has no name when DENUE has none worth printing", () => {
    expect(adBusinessName("TIENDA DE ABARROTES", "tienda")).toBeNull();
    expect(adBusinessName("Jugos y Licuados sin Nombre", "cafeteria")).toBeNull();
    expect(adBusinessName("Cafetería", "cafeteria")).toBeNull();
    expect(adBusinessName("  ", "cafeteria")).toBeNull();
  });
});

describe("buildLeadAds", () => {
  it("makes the four ads in order with the giro defaults", () => {
    const ads = buildLeadAds(LEAD);
    expect(ads.map((ad) => ad.kind)).toEqual(["giro", "name", "promo", "prod"]);
    expect(ads[0].headline).toBe("Café calientito todo el día");
    expect(ads[0].detail).toBe("Col. Benito Juarez, Neza");
    expect(ads[2]).toMatchObject({ headline: "2 cafés", price: "40" });
    expect(ads[3]).toMatchObject({ headline: "Café de olla", price: "25" });
  });

  it("says «Este es mi negocio» without a usable name", () => {
    const ads = buildLeadAds({ ...LEAD, businessName: "CAFETERIA" });
    expect(ads[1].headline).toBe("Este es mi negocio");
    expect(ads[3].eyebrow).toBe("Cafetería");
  });

  it("uses the owner's edits, including the address on text-only ads", () => {
    const ads = buildLeadAds({ ...LEAD, edits: { prod: { price: "28" }, name: { place: "Calle 7 núm. 12" } } });
    expect(ads[3].price).toBe("28");
    expect(ads[1].detail).toBe("Cafetería · Calle 7 núm. 12");
  });

  it("falls back to generic copy for an unknown giro", () => {
    expect(buildLeadAds({ ...LEAD, giro: "otro" })[3].headline).toBe("Producto estrella");
  });
});

describe("sanitizeAdEdits", () => {
  it("keeps known ads and fields only, trimmed and bounded", () => {
    const edits = sanitizeAdEdits({
      prod: { text: "  Capuchino \n grande ", price: "$0035.50", place: "nope" },
      giro: { place: "x".repeat(80), price: "10" },
      hack: { text: "<script>" },
      promo: { text: "" },
    });
    expect(edits.prod).toEqual({ text: "Capuchino grande", price: "3550" });
    expect(edits.giro?.place).toHaveLength(48);
    expect(edits.giro?.price).toBeUndefined();
    expect(edits).not.toHaveProperty("hack");
    expect(edits).not.toHaveProperty("promo");
  });

  it("returns nothing for junk", () => {
    expect(sanitizeAdEdits(null)).toEqual({});
    expect(sanitizeAdEdits("prod")).toEqual({});
  });
});

describe("small helpers", () => {
  it("formats prices", () => {
    expect(formatAdPrice("1250")).toBe("$1,250");
    expect(formatAdPrice(null)).toBe("$—");
  });

  it("picks the same background until the offset moves", () => {
    const urls = ["a", "b", "c"];
    expect(pickBackground(urls, "lead-1", 0)).toBe(pickBackground(urls, "lead-1", 0));
    expect(pickBackground(urls, "lead-1", 1)).not.toBe(pickBackground(urls, "lead-1", 0));
    expect(pickBackground([], "lead-1", 0)).toBeNull();
  });

  it("shrinks long headlines", () => {
    expect(headlineScale("Café")).toBe(1);
    expect(headlineScale("Pan recién horneado, mañana y tarde")).toBeLessThan(0.7);
  });

  it("uses the municipio alone without colonia", () => {
    expect(adDefaultPlace(null, "Nezahualcóyotl")).toBe("Neza");
  });
});
