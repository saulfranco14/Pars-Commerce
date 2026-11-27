import { formatCurrency } from "@/features/qr/helpers/format";
import { STUDIO_FORMATS } from "../constants/studio";
import {
  arrangeStudioScene,
  isStudioDesign,
  isStudioPhotoLayout,
  studioSlotKey,
  studioTemplate,
} from "./layout";
import { contrastRatio } from "./palette";
import type {
  StudioFinding,
  StudioFormat,
  StudioNode,
  StudioScene,
} from "../interfaces/scene";
import type { StudioSource } from "../interfaces/studio";

export function createStudioNode(
  kind: StudioNode["kind"],
  content = "",
): StudioNode {
  return {
    id: crypto.randomUUID(),
    kind,
    x: 0.08,
    y: 0.1,
    width: kind === "qr" ? 0.2 : 0.84,
    height: kind === "qr" ? 0.2 : 0.12,
    rotation: 0,
    locked: false,
    visible: true,
    content,
    color: "#172033",
    fill: "#3483fa",
    fontSize: 0.065,
    fontFamily: "Arial",
    fontStyle: "bold",
    align: "left",
    opacity: 1,
    stroke: "#ffffff",
    strokeWidth: 0,
    lineHeight: 1.1,
    cropX: 0.5,
    cropY: 0.5,
    cropScale: 1,
  };
}

/** Ad prices drop zero cents: $130, not $130.00, reads faster at a glance. */
export function studioPriceLabel(value: number): string {
  return formatCurrency(value).replace(/.00$/, "");
}

/** A product at $0 has no price yet: the ad asks for a quote instead of showing $0. */
export function studioProductPrice(
  base: number,
  variantPrices: Array<number | string | null>,
): { price: number | null; priceLabel: string } {
  const variants = variantPrices.flatMap((v) =>
    v === null || !(Number(v) > 0) ? [] : [Number(v)],
  );
  if (variants.length) {
    const price = Math.min(...variants);
    return { price, priceLabel: `Desde ${studioPriceLabel(price)}` };
  }
  return base > 0
    ? { price: base, priceLabel: studioPriceLabel(base) }
    : { price: null, priceLabel: "" };
}

export function studioValidity(source: StudioSource): string {
  if (!source.validUntil) return "";
  return `Válido hasta ${new Intl.DateTimeFormat("es-MX", { day: "numeric", month: "short", timeZone: "America/Mexico_City" }).format(new Date(source.validUntil))}`;
}

export function bindStudioScene(
  scene: StudioScene,
  source: StudioSource,
): StudioScene {
  const values = {
    name: source.name,
    price: source.priceLabel,
    badge: source.badge,
    validity: studioValidity(source),
    period: source.period,
    conditions: source.conditions ?? "",
  };
  return {
    ...scene,
    nodes: scene.nodes.map((node) =>
      node.binding ? { ...node, content: values[node.binding] } : node,
    ),
  };
}

export function createStudioScene(
  source: StudioSource,
  templateId = "clean",
  format: StudioFormat = "square",
): StudioScene {
  const template = studioTemplate(templateId),
    design = isStudioDesign(template.layout),
    font: Partial<StudioNode> = design ? { fontFamily: "Inter Tight" } : {},
    text = (content: string, extra: Partial<StudioNode>): StudioNode => ({
      ...createStudioNode("text", content),
      color: template.ink,
      ...font,
      ...extra,
    });
  const nodes: StudioNode[] = [],
    poster = isStudioPhotoLayout(template.layout);
  if (poster) {
    if (source.imageUrls[0])
      nodes.push({
        ...createStudioNode("image"),
        role: "backdrop",
        imageUrl: source.imageUrls[0],
      });
    nodes.push({
      ...createStudioNode("shape"),
      role: "shade",
      shade: template.layout === "poster_bottom" ? "bottom" : "poster",
      fill: "#000000",
      locked: true,
    });
    if (template.layout === "poster_framed")
      nodes.push({
        ...createStudioNode("shape"),
        role: "frame",
        fill: "#000000",
        stroke: "#ffffff",
        strokeWidth: 2,
        opacity: 0.8,
        locked: true,
      });
    if (design)
      nodes.push({
        ...createStudioNode("shape"),
        role: "plate",
        fill: template.accent,
        locked: true,
      });
  }
  if (source.logoUrl)
    nodes.push({ ...createStudioNode("logo"), imageUrl: source.logoUrl });
  if (!poster && source.imageUrls[0])
    nodes.push({ ...createStudioNode("image"), imageUrl: source.imageUrls[0] });
  if (poster) {
    if (source.businessName)
      nodes.push(
        text(source.businessName.toUpperCase(), {
          role: "brand",
          fontSize: 0.03,
        }),
      );
    nodes.push(text(source.name, { role: "phrase", lineHeight: 0.95 }));
  }
  nodes.push(text(source.name, { binding: "name", visible: !poster }));
  if (source.priceLabel)
    nodes.push({
      ...createStudioNode("price", source.priceLabel),
      ...font,
      binding: "price",
      color: template.accent,
    });
  if (source.badge)
    nodes.push(
      text(source.badge, { binding: "badge", color: template.accent }),
    );
  if (source.period)
    nodes.push(text(source.period, { binding: "period", fontStyle: "normal" }));
  if (source.conditions)
    nodes.push(
      text(source.conditions, { binding: "conditions", fontStyle: "normal" }),
    );
  if (source.validUntil)
    nodes.push(
      text(studioValidity(source), {
        binding: "validity",
        fontStyle: "normal",
      }),
    );
  if (!source.priceLabel && !(poster && source.badge))
    nodes.push(
      text(source.type === "custom" ? "Conoce más" : "Pide tu cotización", {
        role: "cta",
        color: template.accent,
      }),
    );
  return arrangeStudioScene(
    {
      schemaVersion: 1,
      format,
      template: template.id,
      background: template.background,
      nodes,
    },
    template.layout,
  );
}

export function reflowStudioScene(
  scene: StudioScene,
  format: StudioFormat,
): StudioScene {
  if (scene.format === format) return scene;
  const from = STUDIO_FORMATS[scene.format],
    to = STUDIO_FORMATS[format],
    fontScale = to.width / to.height / (from.width / from.height);
  return arrangeStudioScene({
    ...scene,
    format,
    nodes: scene.nodes.map((node) =>
      ["text", "price"].includes(node.kind) && !studioSlotKey(node)
        ? {
            ...node,
            fontSize: Math.max(0.005, Math.min(0.5, node.fontSize * fontScale)),
          }
        : node,
    ),
  });
}

/** The flat color a text sits on: a solid plate under it, or the scene background. */
function groundOf(scene: StudioScene, node: StudioNode): string {
  const cx = node.x + node.width / 2,
    cy = node.y + node.height / 2,
    plate = scene.nodes.find(
      (n) =>
        n.role === "plate" &&
        n.visible &&
        n.opacity >= 0.8 &&
        cx >= n.x &&
        cx <= n.x + n.width &&
        cy >= n.y &&
        cy <= n.y + n.height,
    );
  return plate?.fill ?? scene.background;
}

export function reviewStudioScene(scene: StudioScene): StudioFinding[] {
  const findings: StudioFinding[] = [];
  for (const node of scene.nodes.filter((n) => n.visible)) {
    if (
      node.role !== "backdrop" &&
      node.role !== "shade" &&
      (node.x < 0.025 ||
        node.y < 0.025 ||
        node.x + node.width > 0.975 ||
        node.y + node.height > 0.975)
    )
      findings.push({
        code: "OUTSIDE_SAFE_AREA",
        nodeId: node.id,
        message: "Una capa sale del área segura.",
        severity: "error",
        action: "fit_node",
      });
    if (node.kind === "price" && node.fontSize < 0.045)
      findings.push({
        code: "SMALL_PRICE",
        nodeId: node.id,
        message: "El precio puede ser difícil de leer.",
        severity: "warning",
        action: "increase_price",
      });
    if (["text", "price"].includes(node.kind)) {
      const size = STUDIO_FORMATS[scene.format],
        characters = Math.max(
          1,
          Math.floor(
            (node.width * size.width) /
              (node.fontSize * size.height * (0.58 + (node.letterSpacing ?? 0))),
          ),
        );
      const lines = node.content
        .split("\n")
        .reduce(
          (count, line) =>
            count + Math.max(1, Math.ceil(line.length / characters)),
          0,
        );
      if (lines * node.fontSize * node.lineHeight > node.height + 0.005)
        findings.push({
          code: "TEXT_MAY_CLIP",
          nodeId: node.id,
          message:
            node.kind === "price"
              ? "El precio puede quedar recortado. Dale más espacio o reduce el tamaño."
              : "Este texto puede quedar recortado. Revisa su caja en la vista previa.",
          severity: "warning",
        });
      if (contrastRatio(node.color, groundOf(scene, node)) < 3)
        findings.push({
          code: "LOW_CONTRAST",
          nodeId: node.id,
          message: "Revisa el contraste del texto sobre el fondo.",
          severity: "warning",
        });
    }
  }
  return findings;
}

export function applyStudioFinding(
  scene: StudioScene,
  finding: StudioFinding,
): StudioScene {
  return {
    ...scene,
    nodes: scene.nodes.map((node) => {
      if (node.id !== finding.nodeId) return node;
      if (finding.action === "increase_price")
        return { ...node, fontSize: Math.max(node.fontSize, 0.07) };
      if (finding.action === "center_image")
        return { ...node, x: (1 - node.width) / 2, y: (1 - node.height) / 2 };
      if (finding.action === "fit_node") {
        const width = Math.min(node.width, 0.9),
          height = Math.min(node.height, 0.9);
        return {
          ...node,
          width,
          height,
          x: Math.max(0.04, Math.min(node.x, 0.96 - width)),
          y: Math.max(0.04, Math.min(node.y, 0.96 - height)),
        };
      }
      return node;
    }),
  };
}

/** Applies every automatic fix the local review offers, in one step. */
export function applyStudioFindings(scene: StudioScene): StudioScene {
  return reviewStudioScene(scene)
    .filter((finding) => finding.action)
    .reduce(applyStudioFinding, scene);
}
