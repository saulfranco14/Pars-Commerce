import type { StudioFormat } from "../interfaces/scene";
import type { StudioSourceType, StudioSurface } from "../interfaces/studio";

export const STUDIO_CONTENT_UPDATED_AT = "2026-11-02T14:01:57Z";
export const STUDIO_BUCKET = "studio-assets";
export const STUDIO_RENDERER_VERSION = 1;
export const STUDIO_MAX_BYTES = 12 * 1024 * 1024;
export const STUDIO_FORMATS: Record<
  StudioFormat,
  { label: string; width: number; height: number }
> = {
  square: { label: "Cuadrado · 1:1", width: 1080, height: 1080 },
  portrait: { label: "Vertical · 4:5", width: 1080, height: 1350 },
  story: { label: "Historia · 9:16", width: 1080, height: 1920 },
  banner: { label: "Banner · 16:7", width: 1600, height: 700 },
};
export const STUDIO_SOURCES: Array<{
  value: StudioSourceType;
  label: string;
  description: string;
}> = [
  {
    value: "product",
    label: "Producto o servicio",
    description: "Su foto, nombre y precio del catálogo",
  },
  {
    value: "promotion",
    label: "Promoción o combo",
    description: "Descuentos, paquetes y condiciones reales",
  },
  {
    value: "subscription_plan",
    label: "Plan o suscripción",
    description: "Tu oferta recurrente y su periodicidad",
  },
  {
    value: "custom",
    label: "Campaña libre",
    description: "Una idea, temporada o mensaje de tu negocio",
  },
];
export const STUDIO_SURFACES: Record<
  StudioSurface,
  {
    label: string;
    channel: "public_store" | "table_qr";
    format: StudioFormat;
    sources: StudioSourceType[];
  }
> = {
  store_home_campaign: {
    label: "Campaña en portada",
    channel: "public_store",
    format: "banner",
    sources: ["product", "promotion", "subscription_plan", "custom"],
  },
  promotion_card: {
    label: "Tarjeta de promoción",
    channel: "public_store",
    format: "square",
    sources: ["promotion"],
  },
  promotion_detail: {
    label: "Detalle de promoción",
    channel: "public_store",
    format: "portrait",
    sources: ["promotion"],
  },
  product_campaign: {
    label: "Detalle del producto",
    channel: "public_store",
    format: "banner",
    sources: ["product"],
  },
  plan_card: {
    label: "Tarjeta del plan",
    channel: "public_store",
    format: "square",
    sources: ["subscription_plan"],
  },
  plan_detail: {
    label: "Detalle del plan",
    channel: "public_store",
    format: "banner",
    sources: ["subscription_plan"],
  },
  qr_promotion: {
    label: "Promoción en mesas / QR",
    channel: "table_qr",
    format: "banner",
    sources: ["promotion"],
  },
  qr_menu_campaign: {
    label: "Campaña en mesas / QR",
    channel: "table_qr",
    format: "banner",
    sources: ["product", "promotion", "subscription_plan", "custom"],
  },
};
export const STUDIO_FONTS = ["Arial", "Georgia", "Verdana"] as const;
export const STUDIO_TEMPLATES = [
  {
    id: "clean",
    name: "Esencial",
    background: "#f7f9fc",
    ink: "#172033",
    accent: "#3483fa",
  },
  {
    id: "premium",
    name: "Premium",
    background: "#172033",
    ink: "#ffffff",
    accent: "#e8a33d",
  },
  {
    id: "offer",
    name: "Oferta",
    background: "#fff7ed",
    ink: "#431407",
    accent: "#c2410c",
  },
  {
    id: "fresh",
    name: "Fresco",
    background: "#ecfdf5",
    ink: "#064e3b",
    accent: "#047857",
  },
] as const;
