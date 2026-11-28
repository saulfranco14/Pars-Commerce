import { describe, expect, it } from "vitest";

import { buildLeadAds } from "@/features/growth/helpers/prospectAds";
import { renderAdPng } from "@/features/growth/services/adImageService";

const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47];

describe("renderAdPng", () => {
  it("draws every ad as a PNG, with and without the sample band", async () => {
    const ads = buildLeadAds({ businessName: "TACOS EL GÜERO", giro: "taqueria", colonia: null, municipio: "Chimalhuacán", edits: {}, backgrounds: {} });
    for (const [index, ad] of ads.entries()) {
      const response = await renderAdPng(ad, { mark: index % 2 === 0, fileName: `anuncio-${ad.kind}.png`, download: true });
      const bytes = new Uint8Array(await response.arrayBuffer());
      expect(Array.from(bytes.slice(0, 4))).toEqual(PNG_SIGNATURE);
      expect(response.headers.get("content-disposition")).toContain(`anuncio-${ad.kind}.png`);
    }
  }, 30_000);
});
