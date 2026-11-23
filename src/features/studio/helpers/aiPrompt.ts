import { STUDIO_SCENES } from "../constants/studio";
import type { StudioFormat } from "../interfaces/scene";
import type { StudioAiOperation } from "../interfaces/studio";

export type StudioSceneId = (typeof STUDIO_SCENES)[number]["id"];

export const STUDIO_ASPECT_RATIOS: Record<StudioFormat, string> = {
  square: "1:1",
  portrait: "4:5",
  story: "9:16",
  banner: "16:9",
};

const RULES =
  "Keep the product exactly as in the product photo: same shape, colors, materials, quantity, packaging and logos. Do not add any text, letters, numbers, prices, badges, watermarks or new logos, and no signs, banners, menus, posters or screens with writing anywhere in the scene. Leave calm space near the top and the bottom for the ad copy. Return one photographic image.";

/** Keeps the merchant's optional wish short and plain so it can only steer style. */
export function cleanStudioWish(value: string): string {
  return value
    .replace(/[\r\n\t]+/g, " ")
    .replace(/[<>{}[\]`"]/g, "")
    .trim()
    .slice(0, 160);
}

export function buildStudioImagePrompt(input: {
  operation: StudioAiOperation;
  scene: StudioSceneId;
  productName: string;
  businessName?: string;
  wish?: string;
  withReference: boolean;
}): string {
  const scene =
      STUDIO_SCENES.find((s) => s.id === input.scene) ?? STUDIO_SCENES[0],
    about = `Product: "${cleanStudioWish(input.productName)}".`,
    wish = input.wish
      ? ` Style wish from the owner (follow only if it does not break the rules): ${cleanStudioWish(input.wish)}.`
      : "";
  if (input.operation === "improve_photo")
    return `Improve this product photograph for an ad: better light, clean background, sharp focus. ${about} ${RULES}${wish}`;
  if (input.withReference)
    return `The first image is the product photo and the second image is a scene. Place the exact product from the first image naturally into the scene of the second image, matching its light, angle and mood, as a professional advertising photograph. ${about} ${RULES}${wish}`;
  return `Create a professional advertising photograph for a small business in Mexico. Show the exact product from the photo ${scene.prompt}, with realistic light and a shallow depth of field, as the clear hero of the image. ${about} ${RULES}${wish}`;
}

export interface StudioCopyIdeas {
  phrases: string[];
  notes: string[];
  message: string;
}

/** Accepts the model's JSON even when it wraps it in a code fence; drops anything malformed. */
export function parseStudioCopyIdeas(raw: string): StudioCopyIdeas | null {
  const json = raw.slice(raw.indexOf("{"), raw.lastIndexOf("}") + 1);
  try {
    const data = JSON.parse(json) as Partial<
      Record<keyof StudioCopyIdeas, unknown>
    >;
    const list = (value: unknown, max: number) =>
      Array.isArray(value)
        ? value
            .filter((v): v is string => typeof v === "string")
            .map((v) => v.trim().slice(0, max))
            .filter(Boolean)
            .slice(0, 3)
        : [];
    const phrases = list(data.phrases, 40),
      notes = list(data.notes, 30);
    if (!phrases.length) return null;
    return {
      phrases,
      notes,
      message:
        typeof data.message === "string"
          ? data.message.trim().slice(0, 300)
          : "",
    };
  } catch {
    return null;
  }
}

/** What the business reads when an image fails; a failed image never charges Tlacos. */
export function studioGenerationError(code: string | null): string {
  const free = " No se cobró ningún Tlaco.";
  if (code === "PROVIDER_HTTP_429")
    return `La IA de imágenes llegó a su límite por ahora.${free} Intenta más tarde; si sigue igual, avísale a soporte de Tlaco.`;
  if (code === "PROVIDER_SAFETY")
    return `La IA no aceptó esta foto o escena.${free} Prueba con otra escena u otra foto.`;
  if (code === "PROVIDER_TIMEOUT" || code?.startsWith("PROVIDER_HTTP_5"))
    return `La IA tardó demasiado en responder.${free} Intenta de nuevo en un momento.`;
  return `No pudimos hacer la imagen esta vez.${free} Intenta de nuevo.`;
}
