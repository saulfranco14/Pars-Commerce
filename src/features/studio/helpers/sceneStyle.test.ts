import { describe, expect, it } from "vitest";
import {
  STUDIO_FORMATS as STUDIO_FORMATS_FOR_TEST,
  STUDIO_PALETTES,
  STUDIO_TEMPLATES,
} from "../constants/studio";
import {
  applyStudioFindings,
  bindStudioScene,
  createStudioNode,
  createStudioScene,
  reviewStudioScene,
} from "./scene";
import {
  recolorStudioScene,
  restyleStudioScene,
  setStudioBackdrop,
  setStudioHeadline,
  setStudioPhrase,
  studioBackdrop,
  setStudioTagline,
  studioHeadline,
  studioPaletteId,
  studioPhrase,
  studioTagline,
  suggestStudioCopy,
} from "./sceneStyle";
import { studioSceneSchema } from "../validations/studioSchemas";
import type { StudioFormat, StudioScene } from "../interfaces/scene";
import type { StudioSource } from "../interfaces/studio";

const product: StudioSource = {
  type: "product",
  id: "10000000-0000-4000-8000-000000000002",
  name: "Lavador oro carro",
  description: "",
  conditions: "",
  price: 130,
  priceLabel: "$130.00",
  badge: "",
  period: "",
  imageUrls: ["https://example.com/car.png"],
  logoUrl: "https://example.com/logo.png",
  destinationUrl: "https://tlaco.app/sitio/autolavado",
  status: "active",
  validFrom: null,
  validUntil: null,
  channels: ["public_store"],
  isPublic: true,
  commercialHash: "hash",
  items: [],
};
const promotion: StudioSource = {
  ...product,
  type: "promotion",
  name: "2 lavados",
  badge: "2 por $220.00",
  conditions: "Válido de lunes a jueves",
  validUntil: "2026-12-01T06:00:00Z",
};
const FORMATS: StudioFormat[] = ["square", "portrait", "story", "banner"];
const node = (
  scene: StudioScene,
  pick: (n: StudioScene["nodes"][0]) => boolean,
) => scene.nodes.find(pick)!;

describe("Studio ready-made designs", () => {
  it("builds every design in every format inside the safe area and without clipped copy", () => {
    for (const source of [product, promotion])
      for (const template of STUDIO_TEMPLATES)
        for (const format of FORMATS) {
          const scene = setStudioTagline(
            createStudioScene(source, template.id, format),
            "Agenda hoy",
          );
          expect(studioSceneSchema.safeParse(scene).success).toBe(true);
          expect(
            reviewStudioScene(scene).filter((f) =>
              ["OUTSIDE_SAFE_AREA", "TEXT_MAY_CLIP"].includes(f.code),
            ),
            `${source.type} · ${template.id} · ${format}`,
          ).toEqual([]);
        }
  });
  it("keeps the call to action on one line when there is no price (two only in the stamp)", () => {
    const promo = { ...promotion, priceLabel: "", price: null, badge: "" };
    const longestLine = (text: string, lines: number) => {
      if (lines === 1) return text.length;
      const words = text.split(" ");
      return Math.min(
        ...words
          .slice(1)
          .map((_, i) =>
            Math.max(
              words.slice(0, i + 1).join(" ").length,
              words.slice(i + 1).join(" ").length,
            ),
          ),
      );
    };
    for (const template of STUDIO_TEMPLATES)
      for (const format of FORMATS) {
        const scene = createStudioScene(promo, template.id, format),
          cta = node(scene, (n) => n.role === "cta"),
          size = STUDIO_FORMATS_FOR_TEST[format],
          charWidth = cta.fontSize * size.height * 0.62,
          lines = template.id === "stamp" ? 2 : 1;
        expect(longestLine(cta.content, lines) * charWidth).toBeLessThanOrEqual(
          cta.width * size.width + 1,
        );
      }
  });
  it("gives each design its own arrangement", () => {
    const price = (id: string) =>
        node(createStudioScene(product, id), (n) => n.binding === "price"),
      image = (id: string) =>
        node(createStudioScene(product, id), (n) => n.kind === "image");
    expect(price("offer").y).toBeLessThan(image("offer").y);
    expect(price("clean").y).toBeGreaterThan(image("clean").y);
    expect(image("fresh").x).toBeGreaterThan(0.5);
    expect(createStudioScene(product, "offer").template).toBe("offer");
  });
});

describe("Studio easy adjustments", () => {
  it("adds, edits and removes the short phrase", () => {
    const base = createStudioScene(product),
      added = setStudioTagline(base, "  Agenda hoy "),
      edited = setStudioTagline(added, "Te esperamos");
    expect(studioTagline(added)).toBe("Agenda hoy");
    expect(node(added, (n) => n.role === "tagline").color).toBe(
      node(added, (n) => n.binding === "price").color,
    );
    expect(studioTagline(edited)).toBe("Te esperamos");
    expect(setStudioTagline(edited, " ").nodes).toHaveLength(base.nodes.length);
  });
  it("keeps a renamed headline when the catalog rebinds and rebinds it when restored", () => {
    const renamed = setStudioHeadline(
      createStudioScene(product),
      product,
      "Lavado premium",
    );
    expect(studioHeadline(bindStudioScene(renamed, product))).toBe(
      "Lavado premium",
    );
    const restored = setStudioHeadline(renamed, product, product.name);
    expect(node(restored, (n) => n.binding === "name").role).toBeUndefined();
    expect(
      studioHeadline(bindStudioScene(restored, { ...product, name: "Nuevo" })),
    ).toBe("Nuevo");
  });
  it("switches design keeping the uploaded photo, copy, hand-added layers and layer ids", () => {
    const assetId = "20000000-0000-4000-8000-000000000003";
    let scene = createStudioScene(product);
    const image = node(scene, (n) => n.kind === "image");
    scene = {
      ...scene,
      nodes: [
        ...scene.nodes.map((n) =>
          n.id === image.id ? { ...n, assetId, imageUrl: undefined } : n,
        ),
        { ...createStudioNode("qr", "https://tlaco.app"), id: "qr-layer" },
      ],
    };
    scene = setStudioTagline(
      setStudioHeadline(scene, product, "Lavado premium"),
      "Agenda hoy",
    );
    const restyled = restyleStudioScene(scene, product, "fresh", "portrait");
    expect(restyled.template).toBe("fresh");
    expect(restyled.format).toBe("portrait");
    expect(node(restyled, (n) => n.kind === "image")).toMatchObject({
      id: image.id,
      assetId,
    });
    expect(studioHeadline(restyled)).toBe("Lavado premium");
    expect(studioTagline(restyled)).toBe("Agenda hoy");
    expect(restyled.nodes.some((n) => n.id === "qr-layer")).toBe(true);
    expect(studioSceneSchema.safeParse(restyled).success).toBe(true);
  });
  it("recolors text by role and recognizes the palette", () => {
    const palette = STUDIO_PALETTES.find((p) => p.id === "night")!,
      scene = recolorStudioScene(
        setStudioTagline(createStudioScene(product), "Agenda hoy"),
        palette,
      );
    expect(studioPaletteId(scene)).toBe("night");
    expect(node(scene, (n) => n.binding === "name").color).toBe(palette.ink);
    expect(node(scene, (n) => n.binding === "price").color).toBe(
      palette.accent,
    );
    expect(node(scene, (n) => n.role === "tagline").color).toBe(palette.accent);
  });
  it("fixes every actionable finding in one step", () => {
    const scene = createStudioScene(product);
    const broken = {
      ...scene,
      nodes: scene.nodes.map((n, i) => (i === 0 ? { ...n, x: 1.1 } : n)),
    };
    expect(
      reviewStudioScene(applyStudioFindings(broken)).some(
        (f) => f.code === "OUTSIDE_SAFE_AREA",
      ),
    ).toBe(false);
  });
});

describe("Studio posters", () => {
  const poster = () => createStudioScene(product, "poster");
  it("covers the canvas with the photo and the shade, and starts with the name as the phrase", () => {
    const scene = poster();
    expect(node(scene, (n) => n.role === "backdrop")).toMatchObject({
      x: 0,
      y: 0,
      width: 1,
      height: 1,
      imageUrl: product.imageUrls[0],
    });
    expect(node(scene, (n) => n.role === "shade").shade).toBe("poster");
    expect(studioPhrase(scene)).toBe(product.name);
    expect(node(scene, (n) => n.binding === "name").visible).toBe(false);
  });
  it("shows the product name as detail once the phrase changes, and hides it again when restored", () => {
    const changed = setStudioPhrase(poster(), product, "Siempre impecable.");
    expect(studioPhrase(changed)).toBe("Siempre impecable.");
    expect(node(changed, (n) => n.binding === "name").visible).toBe(true);
    const restored = setStudioPhrase(changed, product, "");
    expect(node(restored, (n) => n.binding === "name").visible).toBe(false);
  });
  it("swaps the poster photo for a generated image, or adds one when there was no photo", () => {
    const assetId = "30000000-0000-4000-8000-000000000004";
    const withImage = setStudioBackdrop(poster(), assetId);
    expect(studioBackdrop(withImage)).toEqual({ assetId, imageUrl: null });
    const noPhoto = createStudioScene({ ...product, imageUrls: [] }, "poster");
    const added = setStudioBackdrop(noPhoto, assetId);
    expect(added.nodes[0]).toMatchObject({
      role: "backdrop",
      assetId,
      width: 1,
    });
    expect(studioSceneSchema.safeParse(added).success).toBe(true);
  });
  it("changes poster style keeping image, phrase and the detail line", () => {
    const assetId = "30000000-0000-4000-8000-000000000005";
    const scene = setStudioBackdrop(
      setStudioPhrase(poster(), product, "Siempre impecable."),
      assetId,
    );
    const framed = restyleStudioScene(scene, product, "poster_framed");
    expect(framed.nodes.some((n) => n.role === "frame")).toBe(true);
    expect(studioBackdrop(framed).assetId).toBe(assetId);
    expect(studioPhrase(framed)).toBe("Siempre impecable.");
    expect(node(framed, (n) => n.binding === "name").visible).toBe(true);
    const bottom = restyleStudioScene(framed, product, "poster_bottom");
    expect(bottom.nodes.some((n) => n.role === "frame")).toBe(false);
    expect(node(bottom, (n) => n.role === "phrase").y).toBeGreaterThan(
      node(framed, (n) => n.role === "phrase").y,
    );
  });
});

describe("Studio share message", () => {
  it("writes the message from the catalog and the short phrase", () => {
    expect(suggestStudioCopy(product, "Agenda hoy!")).toBe(
      "Lavador oro carro a $130.00. Agenda hoy. Aquí los detalles:",
    );
    expect(suggestStudioCopy(promotion)).toBe(
      "2 lavados: 2 por $220.00. Aquí los detalles:",
    );
    expect(suggestStudioCopy({ ...product, priceLabel: "" })).toBe(
      "Lavador oro carro. Aquí los detalles:",
    );
  });
});
