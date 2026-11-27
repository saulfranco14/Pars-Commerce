import { Megaphone, PenLine, Repeat, Tag } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type {
  StudioFormat,
  StudioLayout,
  StudioTemplateId,
} from "../interfaces/scene";
import type { StudioSourceType, StudioSurface } from "../interfaces/studio";
import { STUDIO_DESIGN_IDS, STUDIO_DESIGNS } from "./designs";

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
/** Bottom room so the floating phone action bar never covers the last content. */
export const STUDIO_ACTION_BAR_SPACE = "pb-44 md:pb-0";
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
    /** Where the person's customers will see it. */
    hint: string;
    channel: "public_store" | "table_qr";
    format: StudioFormat;
    sources: StudioSourceType[];
  }
> = {
  store_home_campaign: {
    label: "Campaña en portada",
    hint: "Arriba en tu tienda en línea: lo primero que ven.",
    channel: "public_store",
    format: "banner",
    sources: ["product", "promotion", "subscription_plan", "custom"],
  },
  promotion_card: {
    label: "Tarjeta de promoción",
    hint: "En la lista de promociones de tu tienda.",
    channel: "public_store",
    format: "square",
    sources: ["promotion"],
  },
  promotion_detail: {
    label: "Detalle de promoción",
    hint: "Al abrir la promoción en tu tienda.",
    channel: "public_store",
    format: "portrait",
    sources: ["promotion"],
  },
  product_campaign: {
    label: "Detalle del producto",
    hint: "Primera foto al abrir este producto en tu tienda.",
    channel: "public_store",
    format: "square",
    sources: ["product"],
  },
  plan_card: {
    label: "Tarjeta del plan",
    hint: "En la lista de planes de tu tienda.",
    channel: "public_store",
    format: "square",
    sources: ["subscription_plan"],
  },
  plan_detail: {
    label: "Detalle del plan",
    hint: "Al abrir el plan en tu tienda.",
    channel: "public_store",
    format: "banner",
    sources: ["subscription_plan"],
  },
  qr_promotion: {
    label: "Promoción en mesas / QR",
    hint: "En la pantalla que ven tus clientes al escanear el QR.",
    channel: "table_qr",
    format: "banner",
    sources: ["promotion"],
  },
  qr_menu_campaign: {
    label: "Campaña en mesas / QR",
    hint: "Arriba en la pantalla del QR de tus mesas.",
    channel: "table_qr",
    format: "banner",
    sources: ["product", "promotion", "subscription_plan", "custom"],
  },
};
export const STUDIO_FONTS = ["Arial", "Georgia", "Verdana"] as const;
/** The editor also offers the designs' typeface; brand settings keep the three system fonts. */
export const STUDIO_EDITOR_FONTS = ["Inter Tight", ...STUDIO_FONTS] as const;
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
  {
    id: "poster",
    name: "Clásico",
    background: "#111827",
    ink: "#ffffff",
    accent: "#ffffff",
    layout: "poster",
  },
  {
    id: "poster_bottom",
    name: "Abajo",
    background: "#111827",
    ink: "#ffffff",
    accent: "#ffffff",
    layout: "poster_bottom",
  },
  {
    id: "poster_framed",
    name: "Con marco",
    background: "#111827",
    ink: "#ffffff",
    accent: "#ffffff",
    layout: "poster_framed",
  },
  ...STUDIO_DESIGNS.map((design) => ({
    id: design.id,
    name: design.name,
    background: design.onPhoto ? "#0b1220" : "#f4efe6",
    ink: design.onPhoto ? "#ffffff" : "#1f1a14",
    accent: "#3483fa",
    layout: design.id,
  })),
];
/** The six designs of the guided editor and batches; the older templates stay for existing ads. */
export const STUDIO_POSTER_STYLES = STUDIO_TEMPLATES.filter((t) =>
  (STUDIO_DESIGN_IDS as readonly string[]).includes(t.id),
);
export const STUDIO_DEFAULT_TEMPLATE: StudioTemplateId = "impact";
export const STUDIO_PALETTES: ReadonlyArray<StudioPalette> = [
  ...STUDIO_TEMPLATES.filter(
    (t) =>
      !t.layout.startsWith("poster") &&
      !(STUDIO_DESIGN_IDS as readonly string[]).includes(t.id),
  ),
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
export const STUDIO_SCENES = [
  {
    id: "local",
    label: "En tu local",
    prompt: "inside the business's own shop, counter or workspace",
  },
  {
    id: "street",
    label: "En la calle",
    prompt: "outdoors on a lively Mexican street with natural daylight",
  },
  {
    id: "studio",
    label: "Estudio",
    prompt: "in a clean photo studio with a soft seamless backdrop",
  },
  {
    id: "surprise",
    label: "Sorpréndeme",
    prompt: "in the most appealing real-world setting for this product",
  },
] as const;
export const STUDIO_QUALITIES = [
  { value: "economy", label: "Normal", cost: 1 },
  { value: "premium", label: "Premium", cost: 3 },
] as const;
export const STUDIO_NOTES = [
  "Agenda hoy",
  "Te esperamos",
  "Solo esta semana",
  "Pide el tuyo",
] as const;
export const STUDIO_BATCH_MAX = 50;
/** Items per request, so each call stays well inside the server time limit. */
export const STUDIO_BATCH_CHUNK = 5;
/** Typical time of one image; only paces the batch bar, never shown as a promise. */
export const STUDIO_BATCH_IMAGE_ESTIMATE_MS = 25_000;
/** Below this many pixels on the short side a photo looks blurry on a 1080 px ad. */
export const STUDIO_SHARP_PHOTO_PX = 600;
/** The AI picks the setting from the business's own line; changeable in Cambiar › Foto. */
export const STUDIO_AUTO_SCENE = "surprise" as const;
export const STUDIO_SHELF_GAP_LABELS = {
  photo: "Sin foto",
  price: "Sin precio",
  description: "Sin descripción",
} as const;
export const STUDIO_SHELF_KIND_LABELS = {
  product: "Producto",
  service: "Servicio",
  promotion: "Promoción",
  plan: "Plan",
} as const;
/** What the status line says while the AI works, per kind of job. */
export const STUDIO_AD_AI_TEXT = {
  photo: "La IA hace tu imagen",
  improve: "La IA mejora tu foto sin cambiar el producto",
  camera: "La IA deja lista la foto que tomaste",
  scene: "La IA crea una escena ilustrativa del servicio",
} as const;
export const STUDIO_AD_SHARE_DONE = {
  whatsapp: "Abriendo WhatsApp",
  status: "Abriendo para compartir",
  store: "Publicado en tu tienda",
  download: "Descargado",
} as const;
export const STUDIO_SHELF_STATE_LABELS = {
  active: "",
  scheduled: "Programada",
  expired: "Vencida",
  paused: "Pausada",
  draft: "Borrador",
} as const;
export const STUDIO_HOME_TABS = [
  { id: "catalog", label: "Catálogo" },
  { id: "ads", label: "Tus anuncios" },
] as const;
/** Ticked when the publish sheet opens: the item's own page, never the whole store. */
export const STUDIO_DEFAULT_SURFACE = {
  product: "product_campaign",
  promotion: "promotion_detail",
  subscription_plan: "plan_detail",
  custom: "store_home_campaign",
} as const;
/** After this long the full-screen wait offers to go on without the AI image. */
export const STUDIO_AI_SLOW_MS = 40_000;
