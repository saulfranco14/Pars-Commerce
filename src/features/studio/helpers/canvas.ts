import Konva from "konva";
import QRCode from "qrcode";
import { validStudioDestination } from "./access";
import { STUDIO_FORMATS } from "../constants/studio";
import { studioPosterFont } from "../constants/studioFont";
import { hexToRgb, studioPaletteFromPixels } from "./palette";
import { isStudioDesign } from "./layout";
import { applyStudioPalette, setStudioBackdrop } from "./sceneStyle";
import type {
  StudioNode,
  StudioPhotoPalette,
  StudioScene,
} from "../interfaces/scene";
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

export type StudioImageSource = HTMLImageElement | ImageBitmap;
const UPSCALE_TARGET_PX = 1080;

/**
 * Loads an image for the canvas. Small photos are enlarged once with the
 * browser's high-quality resampling, so a 232 px catalog photo looks soft on a
 * 1080 px ad instead of blocky. QR codes are never resampled.
 */
const IMAGE_CACHE_SIZE = 24;
const imageCache = new Map<string, Promise<StudioImageSource>>();

/** Decodes each photo once, so six design previews and the export share it. */
export function loadStudioImage(
  url: string,
  upscale = false,
): Promise<StudioImageSource> {
  const key = `${upscale ? "1" : "0"}:${url}`,
    cached = imageCache.get(key);
  if (cached) {
    imageCache.delete(key);
    imageCache.set(key, cached);
    return cached;
  }
  const task = decodeStudioImage(url, upscale);
  imageCache.set(key, task);
  task.catch(() => imageCache.delete(key));
  if (imageCache.size > IMAGE_CACHE_SIZE)
    imageCache.delete(imageCache.keys().next().value!);
  return task;
}

async function decodeStudioImage(
  url: string,
  upscale: boolean,
): Promise<StudioImageSource> {
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
  const longest = Math.max(image.naturalWidth, image.naturalHeight);
  if (
    !upscale ||
    longest >= UPSCALE_TARGET_PX ||
    !("createImageBitmap" in window)
  )
    return image;
  const scale = UPSCALE_TARGET_PX / longest;
  try {
    return await createImageBitmap(image, {
      resizeWidth: Math.round(image.naturalWidth * scale),
      resizeHeight: Math.round(image.naturalHeight * scale),
      resizeQuality: "high",
    });
  } catch {
    return image;
  }
}

export function studioImageCrop(node: StudioNode, image: StudioImageSource) {
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
  await loadStudioFonts();
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
        return url ? loadStudioImage(url, node.kind === "image") : null;
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
              cornerRadius: studioCornerRadius(n, base.width, base.height),
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
            ...studioShapeFill(n, base.width, base.height, 1),
          }),
        );
      else
        layer.add(
          new Konva.Text({
            ...base,
            ...studioTextProps(n, size.height, 1),
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

/** Shade opacity along its height (or from its center outwards for "center"). */
const SHADE_STOPS: Record<NonNullable<StudioNode["shade"]>, number[][]> = {
  poster: [[0, 0.78], [0.42, 0.15], [0.58, 0.2], [1, 0.88]],
  bottom: [[0, 0.45], [0.35, 0.08], [0.55, 0.35], [1, 0.92]],
  top: [[0, 0.94], [0.36, 0.7], [0.62, 0], [1, 0]],
  center: [[0, 0.78], [1, 0.4]],
  fade: [[0, 0], [0.45, 0.22], [1, 0.95]],
};

function shadeStops(node: StudioNode) {
  const [r, g, b] = hexToRgb(node.fill);
  return SHADE_STOPS[node.shade!].flatMap(([at, alpha]) => [
    at,
    `rgba(${r},${g},${b},${alpha})`,
  ]);
}

export function studioCornerRadius(
  node: StudioNode,
  width: number,
  height: number,
) {
  return (node.radius ?? 0) * Math.min(width, height);
}

/** Konva fill for a shape layer: a shade gradient in its color, an empty frame, or a flat color. */
export function studioShapeFill(
  node: StudioNode,
  width: number,
  height: number,
  strokeScale: number,
) {
  if (node.role === "frame")
    return {
      stroke: node.stroke,
      strokeWidth: Math.max(1, node.strokeWidth * strokeScale),
    };
  if (node.shade === "center")
    return {
      fillRadialGradientStartPoint: { x: width / 2, y: height / 2 },
      fillRadialGradientEndPoint: { x: width / 2, y: height / 2 },
      fillRadialGradientStartRadius: 0,
      fillRadialGradientEndRadius: Math.max(width, height) * 0.62,
      fillRadialGradientColorStops: shadeStops(node),
    };
  if (node.shade)
    return {
      fillLinearGradientStartPoint: { x: 0, y: 0 },
      fillLinearGradientEndPoint: { x: 0, y: height },
      fillLinearGradientColorStops: shadeStops(node),
    };
  return {
    fill: node.fill,
    stroke: node.stroke,
    strokeWidth: node.strokeWidth * strokeScale,
    cornerRadius: studioCornerRadius(node, width, height),
  };
}

const POSTER_WEIGHT = { bold: "800", normal: "600", italic: "italic 600" };

/** Text props shared by the editor and the export, so both draw the same letters. */
export function studioTextProps(
  node: StudioNode,
  height: number,
  renderScale: number,
) {
  const fontSize = node.fontSize * height,
    poster = node.fontFamily === "Inter Tight";
  return {
    text: node.caps ? node.content.toLocaleUpperCase("es-MX") : node.content,
    fontSize,
    fontFamily: poster ? studioPosterFont.style.fontFamily : node.fontFamily,
    fontStyle: poster ? POSTER_WEIGHT[node.fontStyle] : node.fontStyle,
    letterSpacing: (node.letterSpacing ?? 0) * fontSize,
    align: node.align,
    fill: node.color,
    stroke: node.stroke,
    strokeWidth: node.strokeWidth * renderScale,
    lineHeight: node.lineHeight,
    wrap: "word" as const,
  };
}

/** Resolves once the designs' typeface is ready, so nothing is drawn with a fallback. */
export async function loadStudioFonts(): Promise<void> {
  const family = studioPosterFont.style.fontFamily;
  try {
    await Promise.all([
      document.fonts.load(`800 48px ${family}`),
      document.fonts.load(`600 48px ${family}`),
    ]);
  } catch {
    /* A missing font falls back to the system sans; the ad still exports. */
  }
  await document.fonts.ready;
}

/** Reads the photo's tones from a 40 px copy; null when the image can't be read. */
export async function sampleStudioPalette(
  url: string,
  photo: string,
): Promise<StudioPhotoPalette | null> {
  try {
    const image = await loadStudioImage(url),
      canvas = document.createElement("canvas");
    canvas.width = canvas.height = 40;
    const context = canvas.getContext("2d", { willReadFrequently: true });
    if (!context) return null;
    context.drawImage(image, 0, 0, 40, 40);
    return studioPaletteFromPixels(
      context.getImageData(0, 0, 40, 40).data,
      photo,
    );
  } catch {
    return null;
  }
}

/**
 * Decodes a new photo and reads its colors first, then hands back one change
 * that sets both, so the ad switches once instead of photo-then-colors.
 */
export async function prepareStudioPhoto(
  picture: string | { imageUrl: string },
  url: string,
): Promise<(scene: StudioScene) => StudioScene> {
  const key = typeof picture === "string" ? picture : picture.imageUrl;
  const [palette] = await Promise.all([
    sampleStudioPalette(url, key),
    loadStudioImage(url, true).catch(() => null),
  ]);
  return (scene) => {
    const next = setStudioBackdrop(scene, picture);
    return palette && isStudioDesign(next.template)
      ? applyStudioPalette(next, palette)
      : next;
  };
}

/**
 * A plain gradient in the ad's colors. The AI needs an input image; for an
 * illustrative service scene this one only carries the colors, never content.
 */
export async function studioSeedImage(
  dark: string,
  accent: string,
): Promise<Blob> {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 512;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Tu navegador no pudo preparar la escena.");
  const gradient = context.createLinearGradient(0, 0, 0, 512);
  gradient.addColorStop(0, dark);
  gradient.addColorStop(1, accent);
  context.fillStyle = gradient;
  context.fillRect(0, 0, 512, 512);
  return new Promise((resolve, reject) =>
    canvas.toBlob(
      (blob) =>
        blob
          ? resolve(blob)
          : reject(new Error("Tu navegador no pudo preparar la escena.")),
      "image/png",
    ),
  );
}
