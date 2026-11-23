export type StudioFormat = "square" | "portrait" | "story" | "banner";
export type StudioNodeKind =
  | "text"
  | "price"
  | "image"
  | "logo"
  | "qr"
  | "shape";
export type StudioTemplateId = "clean" | "premium" | "offer" | "fresh";
export type StudioLayout = "stack" | "price" | "split";
/** Managed copy that is not bound to the catalog: an overridden name, a short phrase or a call to action. */
export type StudioRole = "headline" | "tagline" | "cta";
export type StudioBinding =
  | "name"
  | "price"
  | "badge"
  | "validity"
  | "period"
  | "conditions";

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
