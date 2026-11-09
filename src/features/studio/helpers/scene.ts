import { STUDIO_FORMATS, STUDIO_TEMPLATES } from "../constants/studio";
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
  const template =
    STUDIO_TEMPLATES.find((t) => t.id === templateId) ?? STUDIO_TEMPLATES[0];
  const nodes: StudioNode[] = [];
  if (source.logoUrl)
    nodes.push({
      ...createStudioNode("logo"),
      x: 0.8,
      y: 0.04,
      width: 0.14,
      height: 0.1,
      imageUrl: source.logoUrl,
    });
  if (source.imageUrls[0])
    nodes.push({
      ...createStudioNode("image"),
      x: 0.08,
      y: source.badge ? 0.3 : 0.25,
      width: 0.84,
      height: source.badge ? 0.4 : 0.45,
      imageUrl: source.imageUrls[0],
    });
  nodes.push({
    ...createStudioNode("text", source.name),
    binding: "name",
    color: template.ink,
    y: 0.06,
    height: 0.16,
    fontSize: source.name.length > 35 ? 0.042 : 0.06,
  });
  if (source.priceLabel)
    nodes.push({
      ...createStudioNode("price", source.priceLabel),
      binding: "price",
      y: 0.74,
      height: 0.12,
      color: template.accent,
      fontSize: 0.095,
    });
  if (source.badge)
    nodes.push({
      ...createStudioNode("text", source.badge),
      binding: "badge",
      y: 0.23,
      width: 0.84,
      height: 0.06,
      fontSize: 0.045,
      color: template.accent,
    });
  if (source.period)
    nodes.push({
      ...createStudioNode("text", source.period),
      binding: "period",
      y: 0.86,
      height: 0.05,
      fontSize: 0.03,
      color: template.ink,
    });
  if (source.conditions)
    nodes.push({
      ...createStudioNode("text", source.conditions),
      binding: "conditions",
      y: 0.85,
      height: 0.06,
      fontSize: 0.021,
      color: template.ink,
    });
  if (source.validUntil)
    nodes.push({
      ...createStudioNode("text", studioValidity(source)),
      binding: "validity",
      y: 0.91,
      height: 0.05,
      fontSize: 0.025,
      color: template.ink,
    });
  if (!source.priceLabel)
    nodes.push({
      ...createStudioNode("text", "Conoce más"),
      y: 0.8,
      height: 0.1,
      color: template.accent,
      fontSize: 0.055,
    });
  return reflowStudioScene(
    {
      schemaVersion: 1,
      format: "square",
      background: template.background,
      nodes,
    },
    format,
  );
}

export function reflowStudioScene(
  scene: StudioScene,
  format: StudioFormat,
): StudioScene {
  if (scene.format === format) return scene;
  const banner = format === "banner",
    from = STUDIO_FORMATS[scene.format],
    to = STUDIO_FORMATS[format],
    fontScale = to.width / to.height / (from.width / from.height);
  return {
    ...scene,
    format,
    nodes: scene.nodes.map((node) => {
      if (node.kind === "logo")
        return { ...node, x: 0.8, y: 0.04, width: 0.14, height: 0.1 };
      if (node.kind === "image")
        return {
          ...node,
          x: banner ? 0.52 : 0.08,
          y: banner ? 0.08 : 0.3,
          width: banner ? 0.42 : 0.84,
          height: banner ? 0.84 : 0.4,
        };
      if (node.kind === "shape" || node.kind === "qr" || !node.binding)
        return {
          ...node,
          fontSize: Math.max(0.005, Math.min(0.5, node.fontSize * fontScale)),
        };
      const positions = banner
        ? {
            name: { y: 0.08, height: 0.25 },
            price: { y: 0.57, height: 0.18 },
            badge: { y: 0.38, height: 0.1 },
            validity: { y: 0.91, height: 0.04 },
            period: { y: 0.78, height: 0.06 },
            conditions: { y: 0.78, height: 0.1 },
          }
        : {
            name: { y: 0.05, height: 0.16 },
            price: { y: 0.74, height: 0.1 },
            badge: { y: 0.23, height: 0.06 },
            validity: { y: 0.92, height: 0.04 },
            period: { y: 0.86, height: 0.04 },
            conditions: { y: 0.85, height: 0.06 },
          };
      return {
        ...node,
        x: 0.06,
        width: banner
          ? 0.43
          : node.binding === "name" &&
              scene.nodes.some((n) => n.kind === "logo")
            ? 0.67
            : 0.86,
        ...positions[node.binding],
        fontSize: Math.max(
          0.005,
          Math.min(node.fontSize * fontScale, banner ? 0.15 : 0.095),
        ),
      };
    }),
  };
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
