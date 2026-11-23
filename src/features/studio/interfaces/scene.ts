export type StudioFormat = "square" | "portrait" | "story" | "banner";
export type StudioNodeKind =
  "text" | "price" | "image" | "logo" | "qr" | "shape";
export type StudioPosterId = "poster" | "poster_bottom" | "poster_framed";
/** The six photo-first ads offered side by side after an image is made. */
export type StudioDesignId =
  "impact" | "band" | "stamp" | "statement" | "top" | "card";
export type StudioTemplateId =
  "clean" | "premium" | "offer" | "fresh" | StudioPosterId | StudioDesignId;
export type StudioLayout =
  | "stack"
  | "price"
  | "split"
  | "poster"
  | "poster_bottom"
  | "poster_framed"
  | StudioDesignId;
export type StudioFontFamily = "Arial" | "Georgia" | "Verdana" | "Inter Tight";
/**
 * Managed layers that are not bound to the catalog: an overridden name, the big
 * phrase, a short closing line, a call to action, the business name, and the
 * full-bleed photo, shade and frame of a poster, and the plate (stamp, pill or
 * chip) a design draws behind one of its texts.
 */
export type StudioRole =
  | "headline"
  | "phrase"
  | "tagline"
  | "cta"
  | "brand"
  | "backdrop"
  | "shade"
  | "frame"
  | "plate";
export type StudioShade = "poster" | "bottom" | "top" | "center";
export type StudioBinding =
  "name" | "price" | "badge" | "validity" | "period" | "conditions";

export interface StudioNode {
  id: string;
  kind: StudioNodeKind;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  locked: boolean;
  visible: boolean;
  content: string;
  assetId?: string;
  imageUrl?: string;
  binding?: StudioBinding;
  role?: StudioRole;
  /** Shape filled with a gradient of its fill color instead of a flat color. */
  shade?: StudioShade;
  /** Letter spacing as a share of the font size. */
  letterSpacing?: number;
  /** Drawn in capitals without changing the stored text. */
  caps?: boolean;
  /** Corner radius as a share of the shorter side; 0.5 draws a pill or a circle. */
  radius?: number;
  color: string;
  fill: string;
  fontSize: number;
  fontFamily: StudioFontFamily;
  fontStyle: "normal" | "bold" | "italic";
  align: "left" | "center" | "right";
  opacity: number;
  stroke: string;
  strokeWidth: number;
  lineHeight: number;
  cropX: number;
  cropY: number;
  cropScale: number;
  shadowColor?: string;
  shadowBlur?: number;
  shadowOffsetX?: number;
  shadowOffsetY?: number;
}

/** Colors taken from the ad's photo; `photo` says which image they came from. */
export interface StudioPhotoPalette {
  photo: string;
  dark: string;
  light: string;
  accent: string;
}

export interface StudioScene {
  schemaVersion: 1;
  format: StudioFormat;
  template?: StudioTemplateId;
  palette?: StudioPhotoPalette;
  background: string;
  nodes: StudioNode[];
}

export interface StudioFinding {
  code: string;
  nodeId?: string;
  message: string;
  severity: "warning" | "error";
  action?: "increase_price" | "center_image" | "fit_node";
}

export interface StudioCanvasHandle {
  exportPng: () => Promise<Blob>;
}
