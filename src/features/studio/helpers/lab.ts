import { STUDIO_EXAMPLES } from "../constants/marketing";
import { createStudioScene } from "./scene";
import type { StudioFormat } from "../interfaces/scene";
import type { StudioSource } from "../interfaces/studio";

export function studioLabScene(
  index = 0,
  template = "clean",
  format: StudioFormat = "portrait",
) {
  const example = STUDIO_EXAMPLES[index] ?? STUDIO_EXAMPLES[0];
  const source: StudioSource = {
    type: "custom",
    id: null,
    name: example.headline.replace(/\n/g, " "),
    description: example.detail,
    conditions: "Contenido ilustrativo · prueba interna",
    price: null,
    priceLabel: example.price,
    badge: example.business,
    period: "",
    imageUrls: [example.image],
    destinationUrl: "https://tlaco.app/studio",
    status: "draft",
    validFrom: null,
    validUntil: null,
    channels: [],
    isPublic: false,
    commercialHash: "lab",
    items: [],
  };
  const scene = createStudioScene(source, template, format);
  // Price stays bound to the illustrative source; free text can be edited normally.
  return {
    ...scene,
    nodes: scene.nodes.map((node) => ({
      ...node,
      binding: node.binding === "price" ? node.binding : undefined,
    })),
  };
}
