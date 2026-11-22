import { describe, expect, it } from "vitest";

import { HERO_SCENES } from "@/features/landing/constants/heroScenes";
import { resolveHeroScene } from "@/features/landing/helpers/resolveHeroScene";

const indexOf = (key: string) => HERO_SCENES.findIndex((scene) => scene.key === key);

describe("resolveHeroScene", () => {
  it("rotates from the first scene when no campaign names a business type", () => {
    expect(resolveHeroScene({})).toEqual({ index: 0, fromCampaign: false });
    expect(resolveHeroScene({ giro: "ferreteria" })).toEqual({ index: 0, fromCampaign: false });
  });

  it("uses ?giro= with accents and casing ignored", () => {
    expect(resolveHeroScene({ giro: "Taquería" })).toEqual({
      index: indexOf("taqueria"),
      fromCampaign: true,
    });
  });

  it("falls back to utm_content and understands aliases inside longer values", () => {
    expect(resolveHeroScene({ utm_content: "video_boutique_v2" })).toEqual({
      index: indexOf("ropa"),
      fromCampaign: true,
    });
  });

  it("prefers ?giro= over utm_content and reads the first repeated value", () => {
    expect(
      resolveHeroScene({ giro: ["veterinaria", "tienda"], utm_content: "autolavado" }),
    ).toEqual({ index: indexOf("veterinaria"), fromCampaign: true });
  });
});
