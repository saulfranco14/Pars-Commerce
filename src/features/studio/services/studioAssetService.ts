import "server-only";
import { createHash } from "node:crypto";
import sharp from "sharp";
import { z } from "zod";
import {
  STUDIO_BUCKET,
  STUDIO_FORMATS,
  STUDIO_MAX_BYTES,
  STUDIO_RENDERER_VERSION,
  STUDIO_SURFACES,
} from "../constants/studio";
import { uuidSchema } from "../validations/studioSchemas";
import { requireStudioAccess } from "./studioAccessService";
import { requireStudioData, StudioError } from "./studioErrors";
import type { StudioFormat } from "../interfaces/scene";
import type { StudioSurface } from "../interfaces/studio";

const assetInput = z.object({
  tenant_id: uuidSchema,
  design_id: uuidSchema,
  kind: z.enum(["original", "render", "preview"]),
  mime_type: z.enum(["image/png", "image/jpeg", "image/webp"]),
  version_id: uuidSchema.optional(),
  surface: z
    .enum([
      "social",
      ...(Object.keys(STUDIO_SURFACES) as [StudioSurface, ...StudioSurface[]]),
    ])
    .default("social"),
  format: z.enum(["square", "portrait", "story", "banner"]).optional(),
  renderer_version: z.number().int().positive().optional(),
});

export async function initiateStudioAsset(raw: unknown) {
  const input = assetInput.parse(raw);
  const { db } = await requireStudioAccess(
    input.tenant_id,
    "studio.create",
    "create",
  );
  if (
    !requireStudioData(
      await db.rpc("studio_rate_limit", {
        p_scope: `asset:${input.tenant_id}`,
        p_limit: 40,
      }),
    )
  )
    throw new StudioError("RATE_LIMIT");
  requireStudioData(
    await db
      .from("studio_designs")
      .select("id")
      .eq("tenant_id", input.tenant_id)
      .eq("id", input.design_id)
      .single(),
  );
  if (input.kind === "render") {
    if (!input.version_id || !input.format) throw new StudioError("VALIDATION");
    if (input.renderer_version !== STUDIO_RENDERER_VERSION)
      throw new StudioError(
        "REVISION_CONFLICT",
        "El exportador se actualizó. Guarda tus cambios y recarga Studio para exportar.",
      );
    requireStudioData(
      await db
        .from("studio_design_versions")
        .select("id")
        .eq("tenant_id", input.tenant_id)
        .eq("design_id", input.design_id)
        .eq("id", input.version_id)
        .single(),
    );
    if (
      input.surface !== "social" &&
      STUDIO_SURFACES[input.surface].format !== input.format
    )
      throw new StudioError(
        "VALIDATION",
        "El formato no corresponde a la superficie seleccionada.",
      );
  }
  const id = crypto.randomUUID(),
    extension =
      input.mime_type === "image/png"
        ? "png"
        : input.mime_type === "image/jpeg"
          ? "jpg"
          : "webp";
  const path = `${input.tenant_id}/${input.design_id}/${input.kind}/${id}.${extension}`;
  requireStudioData(
    await db
      .from("studio_assets")
      .insert({
        id,
        tenant_id: input.tenant_id,
        design_id: input.design_id,
        kind: input.kind,
        mime_type: input.mime_type,
        storage_path: path,
        metadata: {
          versionId: input.version_id ?? null,
          surface: input.surface,
          format: input.format ?? null,
          rendererVersion:
            input.kind === "render" ? STUDIO_RENDERER_VERSION : null,
        },
      })
      .select("id")
      .single(),
  );
  const signed = await db.storage
    .from(STUDIO_BUCKET)
    .createSignedUploadUrl(path);
  if (signed.error) throw new StudioError("INTERNAL");
  return {
    id,
    path,
    token: signed.data.token,
    signedUrl: signed.data.signedUrl,
  };
}

export async function completeStudioAsset(tenantId: string, id: string) {
  const { db } = await requireStudioAccess(tenantId, "studio.create", "create");
  const asset = requireStudioData(
    await db
      .from("studio_assets")
      .select("*")
      .eq("tenant_id", tenantId)
      .eq("id", id)
      .single(),
  );
  if (asset.kind === "generated") throw new StudioError("FORBIDDEN");
  if (asset.status === "ready") {
    const { data: render } = await db
      .from("studio_renders")
      .select("id")
      .eq("tenant_id", tenantId)
      .eq("asset_id", id)
      .maybeSingle();
    if (asset.kind !== "render" || render)
      return {
        assetId: id,
        renderId: render?.id ?? null,
        url: `/api/studio/assets/${id}/file?tenant_id=${tenantId}`,
      };
  }
  const file = await db.storage
    .from(STUDIO_BUCKET)
    .download(asset.storage_path);
  if (
    file.error ||
    !file.data ||
    file.data.size > STUDIO_MAX_BYTES ||
    !file.data.size
  )
    throw new StudioError(
      "VALIDATION",
      "El archivo debe ser una imagen de hasta 12 MB.",
    );
  const bytes = Buffer.from(await file.data.arrayBuffer());
  let normalized: Buffer, width: number, height: number;
  try {
    const isJpeg =
      bytes.length >= 3 &&
      bytes[0] === 0xff &&
      bytes[1] === 0xd8 &&
      bytes[2] === 0xff;
    const isPng = bytes
      .subarray(0, 8)
      .equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
    const isWebp =
      bytes.length >= 12 &&
      bytes.toString("ascii", 0, 4) === "RIFF" &&
      bytes.toString("ascii", 8, 12) === "WEBP";
    if (!isJpeg && !isPng && !isWebp) throw new Error("unsupported");
    const image = sharp(bytes, {
      limitInputPixels: 24_000_000,
      failOn: "error",
    });
    const meta = await image.metadata();
    if (
      !meta.width ||
      !meta.height ||
      !["jpeg", "png", "webp"].includes(meta.format ?? "") ||
      (meta.pages ?? 1) > 1
    )
      throw new Error("unsupported");
    const output = await image
      .rotate()
      .png()
      .toBuffer({ resolveWithObject: true });
    normalized = output.data;
    width = output.info.width;
    height = output.info.height;
  } catch {
    throw new StudioError(
      "VALIDATION",
      "Sube una imagen JPG, PNG o WebP válida de hasta 24 megapíxeles.",
    );
  }
  const metadata = asset.metadata as {
    versionId?: string;
    surface?: string;
    format?: StudioFormat;
    rendererVersion?: number;
  };
  if (asset.kind === "render") {
    if (!metadata.versionId || !metadata.format || !metadata.rendererVersion)
      throw new StudioError("VALIDATION");
    const size = STUDIO_FORMATS[metadata.format];
    if (width !== size.width || height !== size.height)
      throw new StudioError(
        "VALIDATION",
        "La exportación no tiene las dimensiones del formato aprobado.",
      );
  }
  if (normalized.length > STUDIO_MAX_BYTES)
    throw new StudioError(
      "VALIDATION",
      "La imagen procesada supera 12 MB. Usa una imagen más pequeña.",
    );
  const upload = await db.storage
    .from(STUDIO_BUCKET)
    .update(asset.storage_path, normalized, {
      contentType: "image/png",
      cacheControl: "0",
    });
  if (upload.error) throw new StudioError("INTERNAL");
  requireStudioData(
    await db
      .from("studio_assets")
      .update({
        status: "ready",
        mime_type: "image/png",
        width,
        height,
        byte_size: normalized.length,
        checksum: createHash("sha256").update(normalized).digest("hex"),
      })
      .eq("tenant_id", tenantId)
      .eq("id", id)
      .select("id")
      .single(),
  );
  let renderId: string | null = null;
  if (asset.kind === "render") {
    const created = await db
      .from("studio_renders")
      .upsert(
        {
          tenant_id: tenantId,
          design_id: asset.design_id,
          design_version_id: metadata.versionId!,
          asset_id: id,
          format: metadata.format!,
          surface: metadata.surface ?? "social",
          renderer_version: metadata.rendererVersion!,
        },
        {
          onConflict:
            "tenant_id,design_version_id,surface,format,renderer_version",
          ignoreDuplicates: true,
        },
      )
      .select("id,asset_id")
      .maybeSingle();
    if (created.error) throw new StudioError("INTERNAL");
    const render =
      created.data ??
      requireStudioData(
        await db
          .from("studio_renders")
          .select("id,asset_id")
          .eq("tenant_id", tenantId)
          .eq("design_version_id", metadata.versionId!)
          .eq("surface", metadata.surface ?? "social")
          .eq("format", metadata.format!)
          .eq("renderer_version", metadata.rendererVersion!)
          .single(),
      );
    renderId = render.id;
    return {
      assetId: render.asset_id,
      renderId,
      url: `/api/studio/assets/${render.asset_id}/file?tenant_id=${tenantId}`,
    };
  }
  return {
    assetId: id,
    renderId,
    url: `/api/studio/assets/${id}/file?tenant_id=${tenantId}`,
  };
}

export async function getStudioAssetFile(tenantId: string, id: string) {
  const { db } = await requireStudioAccess(tenantId);
  const asset = requireStudioData(
    await db
      .from("studio_assets")
      .select("storage_path,mime_type")
      .eq("tenant_id", tenantId)
      .eq("id", id)
      .eq("status", "ready")
      .single(),
  );
  const file = await db.storage
    .from(STUDIO_BUCKET)
    .download(asset.storage_path);
  if (file.error || !file.data) throw new StudioError("NOT_FOUND");
  return new Response(file.data, {
    headers: {
      "Content-Type": asset.mime_type,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
      "X-Robots-Tag": "noindex",
    },
  });
}

export async function importStudioSourceImage(
  tenantId: string,
  designId: string,
  index: number,
) {
  const { db } = await requireStudioAccess(tenantId, "studio.create", "create");
  const design = requireStudioData(
    await db
      .from("studio_designs")
      .select("source_snapshot")
      .eq("tenant_id", tenantId)
      .eq("id", designId)
      .single(),
  );
  const snapshot = design.source_snapshot as {
    imageUrls?: string[];
    logoUrl?: string | null;
  };
  const source =
    index === -1 ? snapshot.logoUrl : (snapshot.imageUrls ?? [])[index];
  if (!source) throw new StudioError("NOT_FOUND");
  let objectPath: string;
  try {
    const url = new URL(source),
      host = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL!).host;
    const prefix = "/storage/v1/object/public/product-images/";
    const local =
      process.env.NODE_ENV !== "production" &&
      ["localhost", "127.0.0.1"].includes(url.hostname);
    if (
      (url.protocol !== "https:" && !(local && url.protocol === "http:")) ||
      url.host !== host ||
      !url.pathname.startsWith(prefix)
    )
      throw new Error();
    objectPath = decodeURIComponent(url.pathname.slice(prefix.length));
    if (
      !objectPath.startsWith(`${tenantId}/`) ||
      objectPath.split("/").some((part) => part === ".." || part === ".")
    )
      throw new Error();
  } catch {
    throw new StudioError(
      "VALIDATION",
      "Sube esta fotografía o logo como JPG, PNG o WebP para conservarlo en Studio.",
    );
  }
  const { data: existing } = await db
    .from("studio_assets")
    .select("id")
    .eq("tenant_id", tenantId)
    .eq("design_id", designId)
    .eq("status", "ready")
    .contains("metadata", { source_url: source })
    .limit(1)
    .maybeSingle();
  if (existing)
    return {
      assetId: existing.id,
      url: `/api/studio/assets/${existing.id}/file?tenant_id=${tenantId}`,
    };
  const file = await db.storage.from("product-images").download(objectPath);
  if (file.error || !file.data || file.data.size > STUDIO_MAX_BYTES)
    throw new StudioError(
      "VALIDATION",
      "La foto no está disponible o supera 12 MB.",
    );
  const id = crypto.randomUUID(),
    path = `${tenantId}/${designId}/original/${id}.png`;
  requireStudioData(
    await db
      .from("studio_assets")
      .insert({
        id,
        tenant_id: tenantId,
        design_id: designId,
        kind: "original",
        status: "pending",
        storage_path: path,
        mime_type: ["image/jpeg", "image/webp"].includes(file.data.type)
          ? file.data.type
          : "image/png",
        metadata: { source_url: source },
      })
      .select("id")
      .single(),
  );
  const upload = await db.storage
    .from(STUDIO_BUCKET)
    .upload(path, file.data, { upsert: false });
  if (upload.error) throw new StudioError("INTERNAL");
  return completeStudioAsset(tenantId, id);
}
