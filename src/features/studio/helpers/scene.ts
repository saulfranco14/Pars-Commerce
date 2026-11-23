import { STUDIO_FORMATS } from "../constants/studio";
import { arrangeStudioScene, studioSlotKey, studioTemplate } from "./layout";
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
    text = (content: string, extra: Partial<StudioNode>): StudioNode => ({
      ...createStudioNode("text", content),
      color: template.ink,
      ...extra,
    });
  const nodes: StudioNode[] = [];
  if (source.logoUrl)
    nodes.push({ ...createStudioNode("logo"), imageUrl: source.logoUrl });
  if (source.imageUrls[0])
    nodes.push({ ...createStudioNode("image"), imageUrl: source.imageUrls[0] });
  nodes.push(text(source.name, { binding: "name" }));
  if (source.priceLabel)
    nodes.push({
      ...createStudioNode("price", source.priceLabel),
      binding: "price",
      color: template.accent,
    });
  if (source.badge)
    nodes.push(text(source.badge, { binding: "badge", color: template.accent }));
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
  if (!source.priceLabel)
    nodes.push(text("Conoce más", { role: "cta", color: template.accent }));
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

function luminance(hex: string): number {
  const channels = [1, 3, 5]
    .map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map((v) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
}

export function reviewStudioScene(scene: StudioScene): StudioFinding[] {
  const findings: StudioFinding[] = [];
  for (const node of scene.nodes.filter((n) => n.visible)) {
    if (
      node.x < 0.025 ||
      node.y < 0.025 ||
      node.x + node.width > 0.975 ||
      node.y + node.height > 0.975
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
            (node.width * size.width) / (node.fontSize * size.height * 0.58),
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
      const a = luminance(node.color),
        b = luminance(scene.background);
      if ((Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05) < 3)
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
