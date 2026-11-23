import { describe, expect, it } from "vitest";
import { STUDIO_DESIGNS } from "../constants/designs";
import { STUDIO_FORMATS } from "../constants/studio";
import { contrastRatio, studioDesignColors, studioPaletteFromPixels } from "./palette";
import { createStudioScene, reviewStudioScene, studioPriceLabel } from "./scene";
import { applyStudioDesign, applyStudioPalette } from "./sceneStyle";
import type { StudioFormat } from "../interfaces/scene";
import type { StudioSource } from "../interfaces/studio";

const source = {
  type: "product",
  id: "p1",
  name: "Lavado oro para tu carro",
  businessName: "Autolavado Villada",
  description: "",
  conditions: "",
  price: 130,
  priceLabel: "$130",
  badge: "",
  period: "",
  imageUrls: ["https://example.com/auto.jpg"],
  logoUrl: "https://example.com/logo.png",
  destinationUrl: "",
  status: "active",
  validFrom: null,
  validUntil: null,
  channels: ["public_store"],
  isPublic: true,
  commercialHash: "h",
  items: [],
} as unknown as StudioSource;

describe("Studio designs", () => {
  it("keeps every text of every design inside the canvas in every format", () => {
    for (const format of Object.keys(STUDIO_FORMATS) as StudioFormat[])
      for (const design of STUDIO_DESIGNS) {
        const scene = applyStudioDesign(
          createStudioScene(source, "impact", format),
          source,
          design.id,
          "Siempre impecable.",
        );
        for (const node of scene.nodes.filter(
          (n) => n.visible && ["text", "price"].includes(n.kind),
        )) {
          expect(node.x, `${design.id}/${format}/${node.content}`).toBeGreaterThanOrEqual(0.025);
          expect(node.y, `${design.id}/${format}/${node.content}`).toBeGreaterThanOrEqual(0.02);
          expect(node.x + node.width).toBeLessThanOrEqual(0.98);
          expect(node.y + node.height).toBeLessThanOrEqual(0.985);
        }
      }
  });

  it("shows the product name as the detail only when the phrase is something else", () => {
    const plain = createStudioScene(source, "impact");
    expect(plain.nodes.find((n) => n.binding === "name")?.visible).toBe(false);
    const phrased = applyStudioDesign(plain, source, "impact", "Siempre impecable.");
    expect(phrased.nodes.find((n) => n.binding === "name")?.visible).toBe(true);
    expect(phrased.nodes.find((n) => n.role === "phrase")?.content).toBe("Siempre impecable.");
  });

  it("draws every design with the poster typeface and passes the readability review", () => {
    for (const design of STUDIO_DESIGNS) {
      const scene = applyStudioDesign(
        createStudioScene(source, "impact"),
        source,
        design.id,
        "Brilla como nuevo.",
      );
      expect(scene.template).toBe(design.id);
      expect(
        scene.nodes.filter((n) => n.kind === "text").every((n) => n.fontFamily === "Inter Tight"),
      ).toBe(true);
      expect(
        reviewStudioScene(scene).filter((f) => f.code === "LOW_CONTRAST"),
        design.id,
      ).toEqual([]);
    }
  });

  it("repaints a design with its photo colors", () => {
    const scene = applyStudioPalette(createStudioScene(source, "band"), {
      photo: "a",
      dark: "#102030",
      light: "#e8e0d0",
      accent: "#d04010",
    });
    expect(scene.palette?.photo).toBe("a");
    expect(scene.background).not.toBe("#f4efe6");
  });
});

describe("Studio photo colors", () => {
  it("always returns readable pairs, even from a washed-out photo", () => {
    const colors = studioDesignColors({ dark: "#9a9a9a", light: "#a0a0a0", accent: "#f5e050" });
    expect(contrastRatio("#ffffff", colors.dark)).toBeGreaterThanOrEqual(7);
    expect(contrastRatio(colors.ink, colors.light)).toBeGreaterThanOrEqual(8);
    expect(contrastRatio(colors.accentInk, colors.light)).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(colors.onAccent, colors.accent)).toBeGreaterThanOrEqual(3);
  });

  it("finds the dark, light and strong tones of a photo", () => {
    const pixels = new Uint8ClampedArray(4 * 30);
    for (let i = 0; i < 30; i++) {
      const [r, g, b] = i < 12 ? [20, 24, 40] : i < 22 ? [235, 230, 220] : [30, 110, 220];
      pixels.set([r, g, b, 255], i * 4);
    }
    const palette = studioPaletteFromPixels(pixels, "photo");
    expect(palette.photo).toBe("photo");
    expect(palette.dark).toBe("#141828");
    const [r, , b] = [1, 3, 5].map((i) => parseInt(palette.accent.slice(i, i + 2), 16));
    expect(b).toBeGreaterThan(r);
  });
});

describe("Studio price label", () => {
  it("drops zero cents and keeps real ones", () => {
    expect(studioPriceLabel(130)).toBe("$130");
    expect(studioPriceLabel(1250)).toBe("$1,250");
    expect(studioPriceLabel(99.5)).toBe("$99.50");
  });
});
