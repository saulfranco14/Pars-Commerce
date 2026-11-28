import "server-only";

import { randomUUID } from "node:crypto";
import sharp from "sharp";

import { AD_BACKGROUND_BATCH, AD_BACKGROUND_BUCKET, AD_HEIGHT, AD_WIDTH, giroAdCopy } from "@/features/growth/constants/prospectAds";
import { GIRO_KEYS } from "@/features/growth/constants/giroCopy";
import { internalError } from "@/features/growth/services/growthDb";
import { adBackgroundUrl } from "@/features/growth/services/prospectAdsService";
import { generateStudioGeminiImage, studioModelFor } from "@/features/studio/services/studioGeminiImage";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { GrowthDb } from "@/features/growth/services/growthDb";
import type { AdBackground, AdBackgroundKind } from "@/features/growth/interfaces/prospectAds";
import type { GrowthActor } from "@/features/growth/interfaces/member";
import type { ServiceResult } from "@/features/qr/services/tablePaymentService";

const KINDS: AdBackgroundKind[] = ["giro", "producto"];

export function isAdGiro(giro: unknown): giro is string {
  return typeof giro === "string" && GIRO_KEYS.includes(giro);
}

export function isAdBackgroundKind(kind: unknown): kind is AdBackgroundKind {
  return KINDS.includes(kind as AdBackgroundKind);
}

export async function listAdBackgrounds(db: GrowthDb, giro: string): Promise<ServiceResult<AdBackground[]>> {
  const { data, error } = await db
    .from("growth_ad_backgrounds")
    .select("id, giro, kind, storage_path, status, created_at")
    .eq("giro", giro)
    .neq("status", "rejected")
    .order("created_at", { ascending: false })
    .limit(80);
  if (error) return internalError(error.message);
  return {
    ok: true,
    data: ((data ?? []) as Array<Omit<AdBackground, "url"> & { storage_path: string }>).map(({ storage_path, ...row }) => ({ ...row, url: adBackgroundUrl(storage_path) })),
  };
}

/** JPEG at the ad's size: light enough for the PNG renderer to fetch on every download. */
async function toAdJpeg(bytes: Buffer): Promise<Buffer> {
  return sharp(bytes).resize(AD_WIDTH, AD_HEIGHT, { fit: "cover", position: "attention" }).jpeg({ quality: 82, mozjpeg: true }).toBuffer();
}

/** A batch of new backgrounds for one giro and kind; they wait for review before any ad uses them. */
export async function generateAdBackgrounds(
  admin: SupabaseClient,
  db: GrowthDb,
  actor: GrowthActor,
  giro: string,
  kind: AdBackgroundKind,
): Promise<ServiceResult<{ created: number; failed: number }>> {
  const model = studioModelFor("STUDIO_GEMINI_IMAGE_MODEL");
  if (!model) return { ok: false, error: { code: "validation", message: "Falta configurar el modelo de imágenes de Studio." } };
  const copy = giroAdCopy(giro);
  const prompt = kind === "giro" ? copy.scenePrompt : copy.productPrompt;

  const results = await Promise.allSettled(
    Array.from({ length: AD_BACKGROUND_BATCH }, async () => {
      const image = await generateStudioGeminiImage({ model, prompt, images: [], aspectRatio: "4:5" });
      const path = `${giro}/${kind}/${randomUUID()}.jpg`;
      const upload = await admin.storage.from(AD_BACKGROUND_BUCKET).upload(path, await toAdJpeg(image.bytes), { contentType: "image/jpeg", upsert: false });
      if (upload.error) throw new Error(upload.error.message);
      const { error } = await db.from("growth_ad_backgrounds").insert({ giro, kind, storage_path: path, prompt, created_by: actor.userId });
      if (error) throw new Error(error.message);
    }),
  );
  const failed = results.filter((result) => result.status === "rejected");
  for (const result of failed) console.error("[growth] ad background failed:", (result as PromiseRejectedResult).reason);
  const created = results.length - failed.length;
  if (!created) return { ok: false, error: { code: "internal", message: "La IA no pudo hacer las imágenes. Intenta en unos minutos." } };
  return { ok: true, data: { created, failed: failed.length } };
}

export async function reviewAdBackground(db: GrowthDb, actor: GrowthActor, id: string, status: "approved" | "rejected"): Promise<ServiceResult<{ id: string; status: string }>> {
  const { data, error } = await db
    .from("growth_ad_backgrounds")
    .update({ status, reviewed_by: actor.userId, reviewed_at: new Date().toISOString() })
    .eq("id", id)
    .select("id, status")
    .maybeSingle();
  if (error) return internalError(error.message);
  if (!data) return { ok: false, error: { code: "not_found", message: "Esa imagen ya no existe." } };
  return { ok: true, data: data as { id: string; status: string } };
}
