import { STUDIO_DESIGN_IDS } from "../constants/designs";
import { STUDIO_FORMATS, STUDIO_TEMPLATES } from "../constants/studio";
import { arrangeStudioDesign } from "./designLayout";
import { studioDesignColors } from "./palette";
import type { StudioDesignInput } from "./designLayout";
import type {
  StudioDesignId,
  StudioLayout,
  StudioNode,
  StudioScene,
} from "../interfaces/scene";

type SlotKey =
  | "logo"
  | "image"
  | "name"
  | "badge"
  | "price"
  | "tagline"
  | "period"
  | "conditions"
  | "validity"
  | "phrase"
  | "brand"
  | "shade"
  | "frame"
  | "plate";
type Slot = Pick<StudioNode, "x" | "y" | "width" | "height"> & {
  fontSize?: number;
};
type Slots = Partial<Record<SlotKey, Slot>>;
interface Present {
  logo: boolean;
  image: boolean;
  badge: boolean;
  price: boolean;
  tagline: boolean;
  lines: SlotKey[];
  nameLength: number;
}

const LINE_KEYS: SlotKey[] = ["period", "conditions", "validity"];
const SINGLE_LINE = new Set<SlotKey>(["price", "badge", "tagline", "brand"]);
const FULL = { x: 0, y: 0, width: 1, height: 1 };
const LINE_STEP = 0.047;
/** A call to action ("Conoce más") borrows the price slot but must not shout like a price. */
const CTA_MAX_FONT = 0.07;

export function studioTemplate(id?: string) {
  return STUDIO_TEMPLATES.find((t) => t.id === id) ?? STUDIO_TEMPLATES[0];
}

export function isStudioDesign(layout?: string): layout is StudioDesignId {
  return (STUDIO_DESIGN_IDS as readonly string[]).includes(layout ?? "");
}

/** Layouts built over a full photo: the older posters and the six designs. */
export function isStudioPhotoLayout(layout: StudioLayout): boolean {
  return layout.startsWith("poster") || isStudioDesign(layout);
}

/** Which layout slot a text node fills; null for free layers added by hand. */
export function studioSlotKey(node: StudioNode): SlotKey | null {
  if (node.role === "headline") return "name";
  if (node.role === "tagline") return "tagline";
  if (node.role === "cta") return "price";
  if (
    node.role === "phrase" ||
    node.role === "brand" ||
    node.role === "shade" ||
    node.role === "frame" ||
    node.role === "plate"
  )
    return node.role;
  return node.binding ?? null;
}

/**
 * Photo-first layout like the Studio landing examples: full-bleed photo under a
 * dark shade, business name on top, a big phrase, and the offer at the bottom.
 */
function posterSlots(layout: StudioLayout, p: Present, wide: boolean): Slots {
  const framed = layout === "poster_framed",
    slots: Slots = { image: FULL, shade: FULL };
  if (framed) slots.frame = { x: 0.045, y: 0.045, width: 0.91, height: 0.91 };
  const lines: SlotKey[] = [
    ...(p.tagline ? ["tagline" as const] : []),
    ...p.lines,
  ];
  if (wide) {
    const col = 0.55;
    slots.logo = { x: 0.86, y: 0.07, width: 0.1, height: 0.2 };
    slots.brand = {
      x: 0.05,
      y: 0.08,
      width: col,
      height: 0.07,
      fontSize: 0.045,
    };
    slots.phrase = {
      x: 0.05,
      y: 0.17,
      width: col,
      height: 0.36,
      fontSize: 0.15,
    };
    slots.name = {
      x: 0.05,
      y: 0.55,
      width: col,
      height: 0.08,
      fontSize: 0.055,
    };
    const priceKey = p.price ? "price" : p.badge ? "badge" : null;
    if (priceKey)
      slots[priceKey] = {
        x: 0.05,
        y: 0.64,
        width: col,
        height: 0.17,
        fontSize: 0.15,
      };
    if (p.price && p.badge)
      slots.badge = {
        x: 0.62,
        y: 0.64,
        width: 0.3,
        height: 0.1,
        fontSize: 0.06,
      };
    lines.slice(0, 2).forEach((key, i) => {
      slots[key] = {
        x: 0.05,
        y: 0.84 + i * 0.065,
        width: col,
        height: 0.06,
        fontSize: 0.04,
      };
    });
    return slots;
  }
  const inset = framed ? 0.1 : 0.07,
    width = 1 - inset * 2,
    end = 1 - inset + 0.01,
    lineH = 0.04,
    linesStart = end - lines.length * lineH;
  slots.logo = {
    x: 1 - inset - 0.12,
    y: inset - 0.015,
    width: 0.12,
    height: 0.1,
  };
  slots.brand = {
    x: inset,
    y: inset,
    width: width - 0.15,
    height: 0.045,
    fontSize: 0.03,
  };
  lines.forEach((key, i) => {
    slots[key] = {
      x: inset,
      y: linesStart + i * lineH,
      width,
      height: lineH,
      fontSize: key === "conditions" ? 0.021 : 0.024,
    };
  });
  const priceY = linesStart - 0.13,
    detailY = priceY - 0.055,
    priceKey = p.price ? "price" : p.badge ? "badge" : null;
  if (priceKey)
    slots[priceKey] = {
      x: inset,
      y: priceY,
      width,
      height: 0.125,
      fontSize: 0.11,
    };
  slots.name = { x: inset, y: detailY, width, height: 0.05, fontSize: 0.036 };
  let phraseEnd = detailY - 0.01;
  if (p.price && p.badge) {
    slots.badge = {
      x: inset,
      y: detailY - 0.055,
      width,
      height: 0.05,
      fontSize: 0.036,
    };
    phraseEnd = detailY - 0.065;
  }
  slots.phrase =
    layout === "poster_bottom"
      ? { x: inset, y: phraseEnd - 0.29, width, height: 0.29, fontSize: 0.115 }
      : { x: inset, y: inset + 0.075, width, height: 0.3, fontSize: 0.12 };
  return slots;
}

function bottomLines(present: Present, x: number, width: number): Slots {
  const start = 0.955 - present.lines.length * LINE_STEP;
  return Object.fromEntries(
    present.lines.map((key, i) => [
      key,
      {
        x,
        y: start + i * LINE_STEP,
        width,
        height: 0.045,
        fontSize: key === "conditions" ? 0.022 : 0.026,
      },
    ]),
  );
}

function tallSlots(layout: StudioLayout, p: Present): Slots {
  const lines = bottomLines(p, 0.08, 0.84),
    linesStart = 0.955 - p.lines.length * LINE_STEP,
    logo = { x: 0.8, y: 0.04, width: 0.14, height: 0.1 },
    nameWidth = p.logo ? 0.67 : 0.84,
    slots: Slots = { ...lines, logo };
  if (layout === "split") {
    let y = 0.41;
    slots.name = {
      x: 0.06,
      y: 0.2,
      width: 0.42,
      height: 0.2,
      fontSize: p.nameLength > 24 ? 0.036 : 0.05,
    };
    if (p.badge) {
      slots.badge = { x: 0.06, y, width: 0.42, height: 0.05, fontSize: 0.032 };
      y += 0.06;
    }
    if (p.price) {
      slots.price = { x: 0.06, y, width: 0.42, height: 0.1, fontSize: 0.075 };
      y += 0.11;
    }
    if (p.tagline)
      slots.tagline = { x: 0.06, y, width: 0.42, height: 0.05, fontSize: 0.03 };
    slots.image = {
      x: 0.52,
      y: 0.2,
      width: 0.42,
      height: Math.max(0.12, Math.min(0.56, linesStart - 0.22)),
    };
    return slots;
  }
  if (layout === "price") {
    let y = 0.19;
    slots.name = {
      x: 0.08,
      y: 0.06,
      width: nameWidth,
      height: 0.12,
      fontSize: p.nameLength > 35 ? 0.036 : 0.05,
    };
    if (p.badge) {
      slots.badge = { x: 0.08, y, width: 0.84, height: 0.05, fontSize: 0.038 };
      y += 0.06;
    }
    if (p.price) {
      slots.price = { x: 0.08, y, width: 0.84, height: 0.17, fontSize: 0.15 };
      y += 0.18;
    }
    if (p.tagline) {
      slots.tagline = {
        x: 0.08,
        y,
        width: 0.84,
        height: 0.05,
        fontSize: 0.036,
      };
      y += 0.06;
    }
    slots.image = {
      x: 0.08,
      y: y + 0.01,
      width: 0.84,
      height: Math.max(0.12, linesStart - 0.03 - y),
    };
    return slots;
  }
  let bottom = linesStart - 0.01;
  if (p.tagline) {
    slots.tagline = {
      x: 0.08,
      y: bottom - 0.05,
      width: 0.84,
      height: 0.05,
      fontSize: 0.036,
    };
    bottom -= 0.055;
  }
  if (p.price) {
    slots.price = {
      x: 0.08,
      y: bottom - 0.1,
      width: 0.84,
      height: 0.1,
      fontSize: 0.085,
    };
    bottom -= 0.12;
  }
  slots.name = {
    x: 0.08,
    y: 0.06,
    width: nameWidth,
    height: 0.14,
    fontSize: p.nameLength > 35 ? 0.042 : 0.06,
  };
  let top = 0.22;
  if (p.badge) {
    slots.badge = {
      x: 0.08,
      y: 0.21,
      width: 0.84,
      height: 0.055,
      fontSize: 0.042,
    };
    top = 0.28;
  }
  slots.image = {
    x: 0.08,
    y: top,
    width: 0.84,
    height: Math.max(0.12, bottom - top),
  };
  return slots;
}

function wideSlots(p: Present): Slots {
  const step = 0.07,
    start = 0.955 - p.lines.length * step,
    slots: Slots = {
      logo: { x: 0.8, y: 0.04, width: 0.14, height: 0.1 },
      image: { x: 0.52, y: 0.08, width: 0.42, height: 0.84 },
      name: {
        x: 0.06,
        y: 0.08,
        width: 0.43,
        height: 0.26,
        fontSize: p.nameLength > 35 ? 0.075 : 0.1,
      },
    };
  let y = 0.36;
  if (p.badge) {
    slots.badge = { x: 0.06, y, width: 0.43, height: 0.09, fontSize: 0.06 };
    y += 0.1;
  }
  if (p.price) {
    slots.price = { x: 0.06, y, width: 0.43, height: 0.17, fontSize: 0.15 };
    y += 0.18;
  }
  if (p.tagline)
    slots.tagline = { x: 0.06, y, width: 0.43, height: 0.08, fontSize: 0.055 };
  p.lines.forEach((key, i) => {
    slots[key] = {
      x: 0.06,
      y: start + i * step,
      width: 0.43,
      height: 0.065,
      fontSize: key === "conditions" ? 0.04 : 0.045,
    };
  });
  return slots;
}

/** Largest font (as a share of height) that keeps one line of text inside its box. */
function fitOneLine(base: number, width: number, text: string, aspect: number) {
  return Math.min(base, (width * aspect) / (0.62 * Math.max(1, text.length)));
}

/** Places every managed layer for the scene's format; free layers keep their position. */
export function arrangeStudioScene(
  scene: StudioScene,
  layout: StudioLayout = studioTemplate(scene.template).layout,
): StudioScene {
  const format = STUDIO_FORMATS[scene.format],
    wide = scene.format === "banner",
    heightScale = wide ? 1 : format.width / format.height,
    aspect = wide ? format.width / format.height : 1,
    image = scene.nodes.find((n) => n.kind === "image"),
    logo = scene.nodes.find((n) => n.kind === "logo"),
    owners = new Map<SlotKey, StudioNode>();
  for (const node of scene.nodes) {
    const key = studioSlotKey(node);
    if (key && !owners.has(key)) owners.set(key, node);
  }
  if (isStudioDesign(layout))
    return arrangeDesignScene(scene, layout, owners, image, logo);
  const present: Present = {
    logo: Boolean(logo),
    image: Boolean(image),
    badge: owners.has("badge"),
    price: owners.has("price"),
    tagline: owners.has("tagline"),
    lines: LINE_KEYS.filter((key) => owners.has(key)),
    nameLength: owners.get("name")?.content.length ?? 0,
  };
  const slots = layout.startsWith("poster")
    ? posterSlots(layout, present, wide)
    : wide
      ? wideSlots(present)
      : tallSlots(layout, present);
  return {
    ...scene,
    nodes: scene.nodes.map((node) => {
      const key: SlotKey | null =
        node === image
          ? "image"
          : node === logo
            ? "logo"
            : (() => {
                const k = studioSlotKey(node);
                return k && owners.get(k) === node ? k : null;
              })();
      const slot = key ? slots[key] : undefined;
      if (!key || !slot) return node;
      const { fontSize, ...box } = slot;
      if (fontSize === undefined) return { ...node, ...box, rotation: 0 };
      const base =
          node.role === "cta" ? Math.min(fontSize, CTA_MAX_FONT) : fontSize,
        size = SINGLE_LINE.has(key)
          ? fitOneLine(base, box.width, node.content, aspect)
          : base;
      return {
        ...node,
        ...box,
        rotation: 0,
        fontSize: Math.max(0.005, size * heightScale),
      };
    }),
  };
}

/** Places every managed layer of one of the six designs and paints it with the photo's colors. */
function arrangeDesignScene(
  scene: StudioScene,
  layout: StudioDesignId,
  owners: Map<SlotKey, StudioNode>,
  image: StudioNode | undefined,
  logo: StudioNode | undefined,
): StudioScene {
  const format = STUDIO_FORMATS[scene.format],
    shown = (key: SlotKey) => {
      const node = owners.get(key);
      return node?.visible && node.content.trim() ? node : undefined;
    };
  const phrase = owners.get("phrase"),
    name = owners.get("name"),
    price = shown("price"),
    badge = shown("badge"),
    offer = price ?? badge,
    phraseText = (phrase?.visible ? phrase.content : name?.content) ?? "",
    notes: StudioDesignInput["notes"] = [];
  if (price && badge) notes.push({ key: "badge", text: badge.content });
  for (const key of ["tagline", "validity", "period", "conditions"] as const) {
    const node = shown(key);
    if (node) notes.push({ key, text: node.content });
  }
  const { background, placements } = arrangeStudioDesign({
    layout,
    width: format.width,
    height: format.height,
    logo: Boolean(logo?.visible),
    brand: shown("brand")?.content ?? "",
    phrase: phraseText,
    name:
      name?.content.trim() && phraseText.trim() !== name.content.trim()
        ? name.content
        : null,
    offer: offer
      ? {
          key: offer === price ? "price" : "badge",
          text: offer.content,
          cta: offer.role === "cta",
        }
      : null,
    notes,
    colors: studioDesignColors(scene.palette),
    photo: Boolean(image?.visible && (image.assetId || image.imageUrl)),
  });
  return {
    ...scene,
    background,
    nodes: scene.nodes.map((node) => {
      const slotKey = studioSlotKey(node),
        key =
          node === image
            ? "image"
            : node === logo
              ? "logo"
              : slotKey && owners.get(slotKey) === node
                ? slotKey
                : null,
        placement = key ? placements[key] : undefined;
      if (!placement) return node;
      return {
        ...node,
        ...(placement.box ? { ...placement.box, rotation: 0 } : {}),
        ...(placement.fontSize === undefined
          ? {}
          : { fontSize: Math.max(0.005, Math.min(0.5, placement.fontSize)) }),
        ...placement.style,
      };
    }),
  };
}
