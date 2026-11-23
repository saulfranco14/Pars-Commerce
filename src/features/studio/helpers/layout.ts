import { STUDIO_FORMATS, STUDIO_TEMPLATES } from "../constants/studio";
import type {
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
  | "validity";
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
const SINGLE_LINE = new Set<SlotKey>(["price", "badge", "tagline"]);
const LINE_STEP = 0.047;

export function studioTemplate(id?: string) {
  return STUDIO_TEMPLATES.find((t) => t.id === id) ?? STUDIO_TEMPLATES[0];
}

/** Which layout slot a text node fills; null for free layers added by hand. */
export function studioSlotKey(node: StudioNode): SlotKey | null {
  if (node.role === "headline") return "name";
  if (node.role === "tagline") return "tagline";
  if (node.role === "cta") return "price";
  return node.binding ?? null;
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
  return Math.min(base, (width * aspect) / (0.58 * Math.max(1, text.length)));
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
  const present: Present = {
    logo: Boolean(logo),
    image: Boolean(image),
    badge: owners.has("badge"),
    price: owners.has("price"),
    tagline: owners.has("tagline"),
    lines: LINE_KEYS.filter((key) => owners.has(key)),
    nameLength: owners.get("name")?.content.length ?? 0,
  };
  const slots = wide ? wideSlots(present) : tallSlots(layout, present);
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
      const size = SINGLE_LINE.has(key)
        ? fitOneLine(fontSize, box.width, node.content, aspect)
        : fontSize;
      return {
        ...node,
        ...box,
        rotation: 0,
        fontSize: Math.max(0.005, size * heightScale),
      };
    }),
  };
}
