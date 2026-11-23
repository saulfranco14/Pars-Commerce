export type StudioFormat = "square" | "portrait" | "story" | "banner";
export type StudioNodeKind =
  "text" | "price" | "image" | "logo" | "qr" | "shape";
export type StudioPosterId = "poster" | "poster_bottom" | "poster_framed";
export type StudioTemplateId =
  "clean" | "premium" | "offer" | "fresh" | StudioPosterId;
export type StudioLayout =
  "stack" | "price" | "split" | "poster" | "poster_bottom" | "poster_framed";
/**
 * Managed layers that are not bound to the catalog: an overridden name, the big
 * phrase, a short closing line, a call to action, the business name, and the
 * full-bleed photo, shade and frame of a poster.
 */
export type StudioRole =
  | "headline"
  | "phrase"
  | "tagline"
  | "cta"
  | "brand"
  | "backdrop"
  | "shade"
  | "frame";
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
  /** Shape filled with the poster's dark gradient instead of a flat color. */
  shade?: "poster" | "bottom";
  color: string;
  fill: string;
  fontSize: number;
  fontFamily: "Arial" | "Georgia" | "Verdana";
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

export interface StudioScene {
  schemaVersion: 1;
  format: StudioFormat;
  template?: StudioTemplateId;
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
