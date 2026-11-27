import type { StudioDesignId } from "../interfaces/scene";

export const STUDIO_DESIGN_IDS = [
  "impact",
  "band",
  "stamp",
  "statement",
  "top",
  "card",
] as const satisfies readonly StudioDesignId[];

/** Order matters: the first one is the recommended design and each gets the phrase with its angle. */
export const STUDIO_DESIGNS: ReadonlyArray<{
  id: StudioDesignId;
  name: string;
  /** Photo designs put white text over a shade; the rest draw on the light tone. */
  onPhoto: boolean;
}> = [
  { id: "impact", name: "Impacto", onPhoto: true },
  { id: "band", name: "Franja", onPhoto: false },
  { id: "stamp", name: "Sello", onPhoto: true },
  { id: "statement", name: "Frase", onPhoto: true },
  { id: "top", name: "Arriba", onPhoto: true },
  { id: "card", name: "Marco", onPhoto: false },
];

/** The angle the AI writes for each design, in the same order. */
export const STUDIO_PHRASE_ANGLES = [
  "beneficio",
  "precio u oferta",
  "urgencia",
  "antojo o emoción",
  "confianza",
  "novedad",
] as const;

export const STUDIO_DEFAULT_PALETTE = {
  dark: "#0b1220",
  light: "#f4efe6",
  accent: "#3483fa",
} as const;

/** "Otras frases" asks the AI again at most this many times per open design. */
export const STUDIO_MORE_PHRASES_MAX = 3;

/** Designs that still read well with no photo: Franja and Marco leave an empty photo area. */
export const STUDIO_TEXT_ONLY_DESIGNS: readonly StudioDesignId[] = [
  "impact",
  "stamp",
  "statement",
  "top",
];
