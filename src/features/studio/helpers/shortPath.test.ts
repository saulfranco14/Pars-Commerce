import { describe, expect, it } from "vitest";
import {
  STUDIO_DEFAULT_SURFACE,
  STUDIO_FORMATS,
  STUDIO_RETIRED_SURFACES,
  STUDIO_SURFACES,
} from "../constants/studio";
import { STUDIO_TEXT_ONLY_DESIGNS } from "../constants/designs";
import { buildStudioImagePrompt } from "./aiPrompt";
import { createStudioScene, reviewStudioScene, studioProductPrice } from "./scene";
import { applyStudioDesign, setStudioBackdrop, studioBackdrop } from "./sceneStyle";
import { sortStudioShelf, studioShelfGaps, studioSourceIsDraft } from "./shelf";
import type { StudioFormat } from "../interfaces/scene";
import type { StudioShelfItem, StudioSource } from "../interfaces/studio";

const source = {
  type: "product",
  kind: "service",
  id: "p1",
  name: "Pulido de faros",
  businessName: "Autolavado Villada",
  description: "",
  conditions: "",
  price: null,
  priceLabel: "",
  badge: "",
  period: "",
  imageUrls: [],
  logoUrl: null,
  destinationUrl: "",
  status: "active",
  validFrom: null,
  validUntil: null,
  channels: ["public_store"],
  isPublic: true,
  commercialHash: "h",
  items: [],
} as unknown as StudioSource;

const item = (over: Partial<StudioShelfItem>): StudioShelfItem => ({
  type: "product",
  id: "x",
  name: "X",
  kind: "product",
  priceLabel: "$10",
  imageUrl: "https://example.com/x.jpg",
  gaps: [],
  state: "active",
  ad: null,
  ...over,
});

describe("Studio catalog gaps", () => {
  it("names what each item lacks", () => {
    expect(studioShelfGaps({ imageUrl: null, priceLabel: "", description: " " })).toEqual([
      "photo",
      "price",
      "description",
    ]);
    expect(
      studioShelfGaps({ imageUrl: "u", priceLabel: "2x1", description: null, hasItems: true }),
    ).toEqual([]);
  });

  it("lists complete and active items first", () => {
    const sorted = sortStudioShelf([
      item({ id: "expired", name: "A", state: "expired" }),
      item({ id: "gaps", name: "B", gaps: ["photo", "price"] }),
      item({ id: "full", name: "C" }),
    ]);
    expect(sorted.map((i) => i.id)).toEqual(["full", "gaps", "expired"]);
  });

  it("treats an expired, paused or future promotion as a draft", () => {
    const now = new Date("2026-11-26T12:00:00Z"),
      promo = { ...source, type: "promotion" as const };
    expect(studioSourceIsDraft({ ...promo, validUntil: "2026-10-26T00:00:00Z" }, now)).toBe(true);
    expect(studioSourceIsDraft({ ...promo, status: "paused" }, now)).toBe(true);
    expect(studioSourceIsDraft({ ...promo, validFrom: "2026-12-01T00:00:00Z" }, now)).toBe(true);
    expect(studioSourceIsDraft({ ...promo, validUntil: "2026-12-07T00:00:00Z" }, now)).toBe(false);
    expect(studioSourceIsDraft({ ...promo, type: "custom", status: "paused" }, now)).toBe(false);
  });
});

describe("Studio prices", () => {
  it("asks for a quote instead of showing $0", () => {
    expect(studioProductPrice(0, [])).toEqual({ price: null, priceLabel: "" });
    expect(studioProductPrice(140, [])).toEqual({ price: 140, priceLabel: "$140" });
    expect(studioProductPrice(0, [null, "90", 0, 120])).toEqual({
      price: 90,
      priceLabel: "Desde $90",
    });
    const scene = createStudioScene(source, "impact");
    expect(scene.nodes.find((n) => n.role === "cta")?.content).toBe("Pide tu cotización");
    expect(scene.nodes.some((n) => n.binding === "price")).toBe(false);
  });
});

describe("Studio text-only ads", () => {
  it("fades into the accent and keeps every text readable and inside the canvas", () => {
    for (const format of Object.keys(STUDIO_FORMATS) as StudioFormat[])
      for (const design of STUDIO_TEXT_ONLY_DESIGNS) {
        const scene = applyStudioDesign(
          createStudioScene(source, "impact", format),
          source,
          design,
          "Faros como nuevos.",
        );
        expect(studioBackdrop(scene).assetId ?? studioBackdrop(scene).imageUrl).toBeNull();
        const shade = scene.nodes.find((n) => n.role === "shade");
        expect(shade?.shade, design).toBe("fade");
        for (const node of scene.nodes.filter((n) => n.visible && ["text", "price"].includes(n.kind))) {
          expect(node.x + node.width, `${design}/${format}`).toBeLessThanOrEqual(0.98);
          expect(node.y + node.height, `${design}/${format}`).toBeLessThanOrEqual(0.985);
        }
        expect(reviewStudioScene(scene).filter((f) => f.code === "LOW_CONTRAST"), design).toEqual([]);
      }
  });

  it("adds and takes out the photo, re-arranging the design each time", () => {
    const bare = createStudioScene(source, "impact"),
      withPhoto = setStudioBackdrop(bare, { imageUrl: "https://example.com/foto.jpg" });
    expect(studioBackdrop(withPhoto).imageUrl).toBe("https://example.com/foto.jpg");
    expect(withPhoto.nodes.find((n) => n.role === "shade")?.shade).toBe("poster");
    const again = setStudioBackdrop(withPhoto, null);
    expect(studioBackdrop(again).imageUrl).toBeNull();
    expect(again.nodes.find((n) => n.role === "shade")?.shade).toBe("fade");
  });
});

describe("Studio illustrative scenes", () => {
  it("draws the service and treats the input only as colors", () => {
    const prompt = buildStudioImagePrompt({
      operation: "style",
      scene: "illustrate",
      productName: "Pulido de faros",
      withReference: false,
    });
    expect(prompt).toContain("illustrative");
    expect(prompt).toContain("only a color reference");
    expect(prompt).toContain("Pulido de faros");
  });
});

describe("Studio publish defaults", () => {
  it("ticks the item's own page, a space that accepts that item", () => {
    for (const [type, surface] of Object.entries(STUDIO_DEFAULT_SURFACE))
      expect(STUDIO_SURFACES[surface].sources, type).toContain(type);
    expect(STUDIO_DEFAULT_SURFACE.product).toBe("product_campaign");
    expect(STUDIO_SURFACES.product_campaign.format).toBe("square");
  });
});

describe("Studio places", () => {
  it("never ticks a retired space and gives each place its own size", () => {
    for (const surface of Object.values(STUDIO_DEFAULT_SURFACE))
      expect(STUDIO_RETIRED_SURFACES).not.toContain(surface);
    expect(STUDIO_RETIRED_SURFACES).toContain("store_home_campaign");
    expect(STUDIO_SURFACES.qr_promotion.format).toBe("square");
    expect(STUDIO_SURFACES.qr_menu_campaign.format).toBe("banner");
  });
});
