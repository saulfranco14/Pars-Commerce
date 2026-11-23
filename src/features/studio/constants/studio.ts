import { Megaphone, PenLine, Repeat, Tag } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type {
  StudioFormat,
  StudioLayout,
  StudioTemplateId,
} from "../interfaces/scene";
import type { StudioSourceType, StudioSurface } from "../interfaces/studio";

export const STUDIO_CONTENT_UPDATED_AT = "2026-11-02T14:01:57Z";
export const STUDIO_BUCKET = "studio-assets";
export const STUDIO_RENDERER_VERSION = 1;
export const STUDIO_MAX_BYTES = 12 * 1024 * 1024;
export const STUDIO_FORMATS: Record<
  StudioFormat,
  {
    label: string;
    width: number;
    height: number;
    channel: string;
    hint: string;
  }
> = {
  square: {
    label: "Cuadrado · 1:1",
    width: 1080,
    height: 1080,
    channel: "Post",
    hint: "Se ve completo en el feed de Instagram y Facebook.",
  },
  portrait: {
    label: "Vertical · 4:5",
    width: 1080,
    height: 1350,
    channel: "Feed vertical",
    hint: "Ocupa más pantalla mientras tus clientes deslizan el feed.",
  },
  story: {
    label: "Historia · 9:16",
    width: 1080,
    height: 1920,
    channel: "Historia o Estado",
    hint: "Pantalla completa para Estados de WhatsApp e Historias.",
  },
  banner: {
    label: "Banner · 16:7",
    width: 1600,
    height: 700,
    channel: "Portada del sitio",
    hint: "Va arriba en tu tienda en línea: lo primero que ven tus clientes.",
  },
};
export const STUDIO_SOURCES: Array<{
  value: StudioSourceType;
  label: string;
  description: string;
  icon: LucideIcon;
}> = [
  {
    value: "product",
    label: "Producto o servicio",
    description: "Su foto, nombre y precio del catálogo",
    icon: Tag,
  },
  {
    value: "promotion",
    label: "Promoción o combo",
    description: "Descuentos, paquetes y condiciones reales",
    icon: Megaphone,
  },
  {
    value: "subscription_plan",
    label: "Plan o suscripción",
    description: "Tu oferta recurrente y su periodicidad",
    icon: Repeat,
  },
  {
    value: "custom",
    label: "Campaña libre",
    description: "Un aviso, una temporada o una novedad",
    icon: PenLine,
  },
];
export const STUDIO_HOW_IT_WORKS = [
  { title: "Elige", detail: "qué quieres anunciar" },
  { title: "Te lo damos hecho", detail: "con tu foto y tu precio" },
  { title: "Compártelo", detail: "en WhatsApp o redes" },
] as const;
export const STUDIO_STEPS = [
  "Qué anuncias",
  "Elige y ajusta",
  "Comparte",
] as const;
export const STUDIO_TAGLINES = [
  "Agenda hoy",
  "Pide el tuyo",
  "Te esperamos",
  "Solo esta semana",
  "Pregunta por paquetes",
] as const;
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
export interface StudioPalette {
  id: string;
  name: string;
  background: string;
  ink: string;
  accent: string;
}
export const STUDIO_TEMPLATES: ReadonlyArray<
  StudioPalette & { id: StudioTemplateId; layout: StudioLayout }
> = [
  {
    id: "clean",
    name: "Esencial",
    background: "#f7f9fc",
    ink: "#172033",
    accent: "#3483fa",
    layout: "stack",
  },
  {
    id: "premium",
    name: "Premium",
    background: "#172033",
    ink: "#ffffff",
    accent: "#e8a33d",
    layout: "stack",
  },
  {
    id: "offer",
    name: "Oferta",
    background: "#fff7ed",
    ink: "#431407",
    accent: "#c2410c",
    layout: "price",
  },
  {
    id: "fresh",
    name: "Fresco",
    background: "#ecfdf5",
    ink: "#064e3b",
    accent: "#047857",
    layout: "split",
  },
];
export const STUDIO_PALETTES: ReadonlyArray<StudioPalette> = [
  ...STUDIO_TEMPLATES,
  {
    id: "night",
    name: "Noche",
    background: "#0f172a",
    ink: "#f8fafc",
    accent: "#38bdf8",
  },
  {
    id: "coral",
    name: "Coral",
    background: "#fff1f2",
    ink: "#4c0519",
    accent: "#e11d48",
  },
  {
    id: "sand",
    name: "Arena",
    background: "#faf5eb",
    ink: "#3b2f1e",
    accent: "#a16207",
  },
  {
    id: "mono",
    name: "Contraste",
    background: "#ffffff",
    ink: "#111111",
    accent: "#111111",
  },
];
