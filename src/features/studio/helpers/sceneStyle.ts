import { STUDIO_PALETTES } from "../constants/studio";
import {
  arrangeStudioScene,
  isStudioDesign,
  isStudioPhotoLayout,
  studioSlotKey,
  studioTemplate,
} from "./layout";
import { createStudioNode, createStudioScene } from "./scene";
import type { StudioPalette } from "../constants/studio";
import type {
  StudioDesignId,
  StudioFormat,
  StudioNode,
  StudioPhotoPalette,
  StudioScene,
  StudioTemplateId,
} from "../interfaces/scene";
import type { StudioSource } from "../interfaces/studio";

const ACCENT_SLOTS = new Set(["price", "badge", "tagline"]);
const isText = (node: StudioNode) => ["text", "price"].includes(node.kind);
const headlineNode = (scene: StudioScene) =>
  scene.nodes.find((n) => n.binding === "name" || n.role === "headline");
const accentOf = (scene: StudioScene) =>
  scene.nodes.find((n) => {
    const key = studioSlotKey(n);
    return key !== null && ACCENT_SLOTS.has(key);
  })?.color ?? studioTemplate(scene.template).accent;

export function studioHeadline(scene: StudioScene): string {
  return headlineNode(scene)?.content ?? "";
}

export function studioTagline(scene: StudioScene): string {
  return scene.nodes.find((n) => n.role === "tagline")?.content ?? "";
}

export function isStudioPoster(scene: StudioScene): boolean {
  return isStudioPhotoLayout(studioTemplate(scene.template).layout);
}

export function studioPhrase(scene: StudioScene): string {
  return scene.nodes.find((n) => n.role === "phrase")?.content ?? "";
}

/** The big poster phrase; once it differs from the product name, the name shows as the detail line. */
export function setStudioPhrase(
  scene: StudioScene,
  source: StudioSource,
  text: string,
): StudioScene {
  const value = text.trim().slice(0, 80) || source.name,
    showName = value !== source.name;
  return arrangeStudioScene({
    ...scene,
    nodes: scene.nodes.map((n) =>
      n.role === "phrase"
        ? { ...n, content: value }
        : n.binding === "name"
          ? { ...n, visible: showName }
          : n,
    ),
  });
}

export function studioPaletteId(scene: StudioScene): string | null {
  const background = scene.background.toLowerCase();
  return (
    STUDIO_PALETTES.find((p) => p.background.toLowerCase() === background)
      ?.id ?? null
  );
}

/** A name equal to the catalog's stays bound, so catalog updates still reach the ad. */
export function setStudioHeadline(
  scene: StudioScene,
  source: StudioSource,
  text: string,
): StudioScene {
  const value = text.trim().slice(0, 120),
    node = headlineNode(scene);
  if (!node) return scene;
  const bound = !value || value === source.name;
  return arrangeStudioScene({
    ...scene,
    nodes: scene.nodes.map((n) =>
      n === node
        ? {
            ...n,
            binding: bound ? "name" : undefined,
            role: bound ? undefined : "headline",
            content: bound ? source.name : value,
          }
        : n,
    ),
  });
}

export function setStudioTagline(
  scene: StudioScene,
  text: string,
): StudioScene {
  const value = text.trim().slice(0, 60),
    existing = scene.nodes.find((n) => n.role === "tagline");
  const nodes = !value
    ? scene.nodes.filter((n) => n !== existing)
    : existing
      ? scene.nodes.map((n) => (n === existing ? { ...n, content: value } : n))
      : [
          ...scene.nodes,
          {
            ...createStudioNode("text", value),
            role: "tagline" as const,
            color: accentOf(scene),
            fontFamily: headlineNode(scene)?.fontFamily ?? "Arial",
          },
        ];
  return arrangeStudioScene({ ...scene, nodes });
}

export function recolorStudioScene(
  scene: StudioScene,
  palette: StudioPalette,
): StudioScene {
  return {
    ...scene,
    background: palette.background,
    nodes: scene.nodes.map((node) => {
      if (!isText(node)) return node;
      const key = studioSlotKey(node);
      return {
        ...node,
        color: key && ACCENT_SLOTS.has(key) ? palette.accent : palette.ink,
      };
    }),
  };
}

/** Rebuilds the ad with another design while keeping the person's photo, logo, copy and hand-added layers. */
export function restyleStudioScene(
  scene: StudioScene,
  source: StudioSource,
  templateId: StudioTemplateId,
  format: StudioFormat = scene.format,
): StudioScene {
  const template = studioTemplate(templateId),
    fresh = createStudioScene(source, templateId, format),
    image = scene.nodes.find((n) => n.kind === "image"),
    logo = scene.nodes.find((n) => n.kind === "logo"),
    tagline = scene.nodes.find((n) => n.role === "tagline"),
    toDesign = isStudioDesign(template.layout),
    font = toDesign ? undefined : headlineNode(scene)?.fontFamily,
    fromPoster = isStudioPoster(scene),
    toPoster = isStudioPhotoLayout(template.layout),
    carried = new Set<StudioNode>();
  const previousOf = (node: StudioNode) => {
    if (node.kind === "image") return image;
    if (node.kind === "logo") return logo;
    const key = studioSlotKey(node);
    return key ? scene.nodes.find((n) => studioSlotKey(n) === key) : undefined;
  };
  const nodes = fresh.nodes.map((node) => {
    const previous = previousOf(node),
      styled = font && isText(node) ? { ...node, fontFamily: font } : node;
    if (!previous) return styled;
    carried.add(previous);
    if (node.kind === "image" || node.kind === "logo")
      return {
        ...styled,
        id: previous.id,
        assetId: previous.assetId,
        imageUrl: previous.assetId ? undefined : previous.imageUrl,
        cropX: previous.cropX,
        cropY: previous.cropY,
        cropScale: previous.cropScale,
      };
    if (previous.role === "phrase" || previous.role === "brand")
      return { ...styled, id: previous.id, content: previous.content };
    if (node.binding === "name" && fromPoster && toPoster)
      return { ...styled, id: previous.id, visible: previous.visible };
    return previous.role === "headline"
      ? {
          ...styled,
          id: previous.id,
          binding: undefined,
          role: "headline" as const,
          content: previous.content,
        }
      : { ...styled, id: previous.id };
  });
  for (const node of [image, logo])
    if (node && !carried.has(node)) {
      carried.add(node);
      nodes.unshift(node);
    }
  if (tagline) {
    carried.add(tagline);
    nodes.push({ ...tagline, color: template.accent });
  }
  const free = scene.nodes.filter((n) => !carried.has(n) && !studioSlotKey(n));
  return arrangeStudioScene(
    { ...fresh, palette: scene.palette, nodes: [...nodes, ...free] },
    template.layout,
  );
}

/** One of the six designs over the same photo, optionally with its own phrase. */
export function applyStudioDesign(
  scene: StudioScene,
  source: StudioSource,
  design: StudioDesignId,
  phrase?: string,
): StudioScene {
  const styled =
    scene.template === design
      ? scene
      : restyleStudioScene(scene, source, design);
  return phrase ? setStudioPhrase(styled, source, phrase) : styled;
}

/** Repaints a design with the colors of its photo; older templates keep theirs. */
export function applyStudioPalette(
  scene: StudioScene,
  palette: StudioPhotoPalette,
): StudioScene {
  if (!isStudioDesign(scene.template)) return { ...scene, palette };
  return arrangeStudioScene({ ...scene, palette });
}

/** The image the palette must come from: the stored asset id or the photo URL. */
export function studioPhotoKey(scene: StudioScene): string | null {
  const { assetId, imageUrl } = studioBackdrop(scene);
  return assetId ?? imageUrl;
}

/** The message that goes with the image; the share actions append the link. */
export function suggestStudioCopy(source: StudioSource, tagline = ""): string {
  const offer = source.badge
    ? `${source.name}: ${source.badge}.`
    : source.priceLabel
      ? `${source.name} a ${source.priceLabel}.`
      : `${source.name}.`;
  const phrase = tagline.trim().replace(/[.!?¡¿]+$/u, "");
  return [offer, phrase && `${phrase}.`, "Aquí los detalles:"]
    .filter(Boolean)
    .join(" ");
}

/**
 * Puts an image on the poster photo (or the first photo of older designs);
 * adds the poster photo if missing, and `null` takes it out for a text-only ad.
 */
export function setStudioBackdrop(
  scene: StudioScene,
  picture: string | { imageUrl: string } | null,
): StudioScene {
  const target =
    scene.nodes.find((n) => n.role === "backdrop") ??
    scene.nodes.find((n) => n.kind === "image");
  const design = isStudioDesign(scene.template);
  if (picture === null) {
    if (!target) return scene;
    const nodes = scene.nodes.filter((n) => n !== target);
    return design
      ? arrangeStudioScene({ ...scene, nodes, palette: undefined })
      : { ...scene, nodes };
  }
  const image = {
    assetId: typeof picture === "string" ? picture : undefined,
    imageUrl: typeof picture === "string" ? undefined : picture.imageUrl,
    cropX: 0.5,
    cropY: 0.5,
    cropScale: 1,
  };
  if (target) {
    const next = {
      ...scene,
      nodes: scene.nodes.map((n) => (n === target ? { ...n, ...image } : n)),
    };
    return design ? arrangeStudioScene(next) : next;
  }
  if (!isStudioPoster(scene)) return scene;
  return arrangeStudioScene({
    ...scene,
    nodes: [
      { ...createStudioNode("image"), role: "backdrop", ...image },
      ...scene.nodes,
    ],
  });
}

/** What the poster photo shows now: a stored image or a catalog photo URL. */
export function studioBackdrop(scene: StudioScene): {
  assetId: string | null;
  imageUrl: string | null;
} {
  const node =
    scene.nodes.find((n) => n.role === "backdrop") ??
    scene.nodes.find((n) => n.kind === "image");
  return { assetId: node?.assetId ?? null, imageUrl: node?.imageUrl ?? null };
}
