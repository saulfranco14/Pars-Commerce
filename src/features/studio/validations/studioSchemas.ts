import { z } from "zod";
import { validStudioDestination } from "../helpers/access";
import { STUDIO_DESIGN_IDS } from "../constants/designs";

export const uuidSchema = z.string().uuid();
const color = z.string().regex(/^#[0-9a-fA-F]{6}$/);
const unit = z.number().finite().min(0).max(1);
export const studioNodeSchema = z
  .object({
    id: z.string().min(1).max(80),
    kind: z.enum(["text", "price", "image", "logo", "qr", "shape"]),
    x: z.number().finite().min(-1).max(2),
    y: z.number().finite().min(-1).max(2),
    width: z.number().finite().min(0.005).max(2),
    height: z.number().finite().min(0.005).max(2),
    rotation: z.number().finite().min(-360).max(360),
    locked: z.boolean(),
    visible: z.boolean(),
    content: z.string().max(2000),
    assetId: uuidSchema.optional(),
    imageUrl: z.string().max(2048).optional(),
    binding: z
      .enum(["name", "price", "badge", "validity", "period", "conditions"])
      .optional(),
    role: z
      .enum([
        "headline",
        "phrase",
        "tagline",
        "cta",
        "brand",
        "backdrop",
        "shade",
        "frame",
        "plate",
      ])
      .optional(),
    shade: z.enum(["poster", "bottom", "top", "center"]).optional(),
    letterSpacing: z.number().finite().min(-0.2).max(0.5).optional(),
    caps: z.boolean().optional(),
    radius: z.number().finite().min(0).max(0.5).optional(),
    color,
    fill: color,
    fontSize: z.number().finite().min(0.005).max(0.5),
    fontFamily: z.enum(["Arial", "Georgia", "Verdana", "Inter Tight"]),
    fontStyle: z.enum(["normal", "bold", "italic"]),
    align: z.enum(["left", "center", "right"]),
    opacity: unit,
    stroke: color,
    strokeWidth: z.number().finite().min(0).max(10),
    lineHeight: z.number().finite().min(0.5).max(3),
    cropX: unit,
    cropY: unit,
    cropScale: z.number().finite().min(1).max(8),
    shadowColor: color.optional(),
    shadowBlur: z.number().finite().min(0).max(40).optional(),
    shadowOffsetX: z.number().finite().min(-20).max(20).optional(),
    shadowOffsetY: z.number().finite().min(-20).max(20).optional(),
  })
  .strict();
export const studioSceneSchema = z
  .object({
    schemaVersion: z.literal(1),
    format: z.enum(["square", "portrait", "story", "banner"]),
    template: z
      .enum([
        "clean",
        "premium",
        "offer",
        "fresh",
        "poster",
        "poster_bottom",
        "poster_framed",
        ...STUDIO_DESIGN_IDS,
      ])
      .optional(),
    palette: z
      .object({
        photo: z.string().max(2048),
        dark: color,
        light: color,
        accent: color,
      })
      .strict()
      .optional(),
    background: color,
    nodes: z
      .array(studioNodeSchema)
      .min(1)
      .max(100)
      .refine(
        (nodes) => new Set(nodes.map((n) => n.id)).size === nodes.length,
        "Cada capa debe tener un identificador único.",
      ),
  })
  .strict();
export const destinationSchema = z
  .string()
  .max(2048)
  .refine(validStudioDestination, "Usa un enlace HTTPS válido.");
export const createDesignSchema = z.object({
  tenant_id: uuidSchema,
  source_type: z.enum(["product", "promotion", "subscription_plan", "custom"]),
  source_id: uuidSchema.nullish(),
  title: z.string().trim().min(1).max(120),
  idempotency_key: uuidSchema,
});
export const saveDesignSchema = z.object({
  tenant_id: uuidSchema,
  revision: z.number().int().positive(),
  scene: studioSceneSchema,
  title: z.string().trim().min(1).max(120),
  copy: z.string().max(4000),
  destination_url: destinationSchema,
  status: z.enum(["draft", "ready", "archived"]).optional(),
  refresh_source: z.boolean().optional(),
});
export const generationSchema = z.object({
  tenant_id: uuidSchema,
  design_id: uuidSchema,
  asset_id: uuidSchema,
  operation: z.enum(["improve_photo", "style", "variation"]),
  quality: z.enum(["economy", "premium"]),
  scene: z.enum(["local", "street", "studio", "surprise"]).default("local"),
  wish: z.string().max(300).default(""),
  reference_asset_id: uuidSchema.optional(),
});
export const brandSchema = z.object({
  colors: z.array(color).min(1).max(6),
  font: z.enum(["Arial", "Georgia", "Verdana"]),
  default_format: z.enum(["square", "portrait", "story", "banner"]),
});
