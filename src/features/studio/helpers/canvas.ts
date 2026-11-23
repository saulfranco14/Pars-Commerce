import Konva from "konva";
import QRCode from "qrcode";
import { validStudioDestination } from "./access";
import { STUDIO_FORMATS } from "../constants/studio";
import type { StudioNode, StudioScene } from "../interfaces/scene";
import type { StudioAsset } from "../interfaces/studio";

export function studioImageUrl(
  node: StudioNode,
  assets: StudioAsset[],
  tenantId: string,
): string | null {
  if (node.assetId)
    return (
      assets.find((a) => a.id === node.assetId)?.url ??
      `/api/studio/assets/${node.assetId}/file?tenant_id=${tenantId}`
    );
  return node.imageUrl ?? null;
}

export async function loadStudioImage(url: string): Promise<HTMLImageElement> {
  const image = new window.Image();
  image.crossOrigin = "anonymous";
  await new Promise<void>((resolve, reject) => {
    image.onload = () => resolve();
    image.onerror = () =>
      reject(
        new Error(
          "No pudimos cargar una imagen. Vuelve a subirla antes de exportar.",
        ),
      );
    image.src = url;
  });
  return image;
}

export function studioImageCrop(node: StudioNode, image: HTMLImageElement) {
  const ratio = node.width / node.height;
  const width = Math.min(image.width, image.height * ratio) / node.cropScale;
  const height = Math.min(image.height, image.width / ratio) / node.cropScale;
  return {
    x: (image.width - width) * node.cropX,
    y: (image.height - height) * node.cropY,
    width,
    height,
  };
}

export async function exportStudioScene(
  scene: StudioScene,
  assets: StudioAsset[],
  tenantId: string,
  preparation = false,
): Promise<Blob> {
  await document.fonts.ready;
  const size = STUDIO_FORMATS[scene.format],
    container = document.createElement("div");
  container.style.cssText =
    "position:fixed;left:-10000px;top:0;pointer-events:none";
  document.body.appendChild(container);
  const stage = new Konva.Stage({
      container,
      width: size.width,
      height: size.height,
    }),
    layer = new Konva.Layer();
  stage.add(layer);
  try {
    layer.add(
      new Konva.Rect({
        x: 0,
        y: 0,
        width: size.width,
        height: size.height,
        fill: scene.background,
      }),
    );
    const images = await Promise.all(
      scene.nodes.map(async (node) => {
        if (!node.visible) return null;
        if (
          node.kind === "qr" &&
          (!node.content || !validStudioDestination(node.content))
        )
          throw new Error(
            "Define un enlace HTTPS válido para cada QR antes de exportar.",
          );
        if (node.kind === "qr")
          return loadStudioImage(
            await QRCode.toDataURL(node.content || "https://tlaco.app", {
              width: 512,
              margin: 1,
              errorCorrectionLevel: "M",
            }),
          );
        const url = studioImageUrl(node, assets, tenantId);
        return url ? loadStudioImage(url) : null;
      }),
    );
    for (let i = 0; i < scene.nodes.length; i++) {
      const n = scene.nodes[i];
      if (!n.visible) continue;
      const base = {
        x: n.x * size.width,
        y: n.y * size.height,
        width: n.width * size.width,
        height: n.height * size.height,
        rotation: n.rotation,
        opacity: n.opacity,
        shadowColor: n.shadowColor ?? "#000000",
        shadowBlur: n.shadowBlur ?? 0,
        shadowOffsetX: n.shadowOffsetX ?? 0,
        shadowOffsetY: n.shadowOffsetY ?? 0,
      };
      if (["image", "logo", "qr"].includes(n.kind)) {
        const image = images[i];
        if (image && ["logo", "qr"].includes(n.kind)) {
          const fit = Math.min(
              base.width / image.width,
              base.height / image.height,
            ),
            width = image.width * fit,
            height = image.height * fit;
          const group = new Konva.Group({ ...base });
          group.add(
            new Konva.Image({
              image,
              x: (base.width - width) / 2,
              y: (base.height - height) / 2,
              width,
              height,
            }),
          );
          layer.add(group);
        } else if (image)
          layer.add(
            new Konva.Image({
              ...base,
              image,
              ...(n.kind === "qr"
                ? {}
                : {
                    crop: studioImageCrop(
                      { ...n, width: base.width, height: base.height },
                      image,
                    ),
                  }),
            }),
          );
      } else if (n.kind === "shape")
        layer.add(
          new Konva.Rect({
            ...base,
            ...studioShapeFill(n, base.height, 1),
          }),
        );
      else
        layer.add(
          new Konva.Text({
            ...base,
            text: n.content,
            fontSize: n.fontSize * size.height,
            fontFamily: n.fontFamily,
            fontStyle: n.fontStyle,
            align: n.align,
            fill: n.color,
            stroke: n.stroke,
            strokeWidth: n.strokeWidth,
            lineHeight: n.lineHeight,
            wrap: "word",
          }),
        );
    }
    if (preparation)
      layer.add(
        new Konva.Text({
          x: 0,
          y: size.height * 0.43,
          width: size.width,
          text: "BORRADOR",
          fontSize: size.height * 0.1,
          fontFamily: "Arial",
          fontStyle: "bold",
          align: "center",
          fill: "#ffffff",
          stroke: "#172033",
          strokeWidth: 2,
          opacity: 0.9,
          rotation: -10,
        }),
      );
    layer.draw();
    return (await stage.toBlob({
      mimeType: "image/png",
      pixelRatio: 1,
    })) as Blob;
  } finally {
    stage.destroy();
    container.remove();
  }
}

const SHADE_STOPS = {
  poster: [
    0,
    "rgba(8,10,16,0.78)",
    0.42,
    "rgba(8,10,16,0.15)",
    0.58,
    "rgba(8,10,16,0.2)",
    1,
    "rgba(8,10,16,0.88)",
  ],
  bottom: [
    0,
    "rgba(8,10,16,0.45)",
    0.35,
    "rgba(8,10,16,0.08)",
    0.55,
    "rgba(8,10,16,0.35)",
    1,
    "rgba(8,10,16,0.92)",
  ],
} as const;

/** Konva fill for a shape layer: the poster shade gradient, an empty frame, or a flat color. */
export function studioShapeFill(
  node: StudioNode,
  height: number,
  strokeScale: number,
) {
  if (node.role === "frame")
    return {
      stroke: node.stroke,
      strokeWidth: Math.max(1, node.strokeWidth * strokeScale),
    };
  if (node.shade)
    return {
      fillLinearGradientStartPoint: { x: 0, y: 0 },
      fillLinearGradientEndPoint: { x: 0, y: height },
      fillLinearGradientColorStops: [...SHADE_STOPS[node.shade]],
    };
  return {
    fill: node.fill,
    stroke: node.stroke,
    strokeWidth: node.strokeWidth * strokeScale,
  };
}
