"use client";
import { useEffect, useRef, useState } from "react";
import { useStudioAiPreference } from "./useStudioAiPreference";
import { useStudioGenerate } from "./useStudioGenerate";
import { useStudioImageSize } from "./useStudioImageSize";
import { useStudioContext } from "../components/StudioProvider";
import {
  updateDesignSource,
  uploadStudioAsset,
} from "../services/studioClientService";
import { trackStudioFunnel } from "../services/studioAnalyticsClient";
import {
  STUDIO_AI_SLOW_MS,
  STUDIO_AUTO_SCENE,
  STUDIO_SHARP_PHOTO_PX,
} from "../constants/studio";
import { studioSeedImage } from "../helpers/canvas";
import { studioDesignColors } from "../helpers/palette";
import { studioSourceIsDraft } from "../helpers/shelf";
import type { StudioAdAiKind, StudioAdInput } from "../interfaces/ui";

/** Ads whose Crear image was already asked for in this tab; survives going to A mano and back. */
const autoAiSpent = new Set<string>();

const errorText = (e: unknown, fallback: string) =>
  e instanceof Error ? e.message : fallback;

/** Remembers a one-time answer for this ad on this device; works without storage too. */
function useOnce(key: string): [boolean, () => void] {
  const [done, setDone] = useState(() => {
    try {
      return localStorage.getItem(key) === "1";
    } catch {
      return false;
    }
  });
  return [
    done,
    () => {
      setDone(true);
      try {
        localStorage.setItem(key, "1");
      } catch {
        /* Still answered for this visit. */
      }
    },
  ];
}

/**
 * The short path: while the AI makes the image the whole screen is for it,
 * with the designs to browse; every gap gets one question at most.
 */
export function useStudioAd({
  editor,
  asset,
  photos,
  designs,
  tenantId,
  designId,
  autoAi,
}: StudioAdInput) {
  const { summary } = useStudioContext(),
    source = editor.source.current,
    aiActive = Boolean(summary?.aiEnabled && editor.canEdit),
    affordable = (summary?.balance.available ?? 0) >= 1,
    [aiOn] = useStudioAiPreference(tenantId, aiActive && affordable),
    [running, setRunning] = useState<{
      kind: StudioAdAiKind;
      startedAt: number;
    } | null>(null),
    /** The person chose to go on without waiting; a late image is kept, not applied. */
    [skipped, setSkipped] = useState(false),
    [failed, setFailed] = useState<StudioAdAiKind | null>(null),
    [slow, setSlow] = useState(false),
    [message, setMessage] = useState<string | null>(null),
    [error, setError] = useState<string | null>(null),
    [noPhotoOpen, setNoPhotoOpen] = useState(false),
    [saving, setSaving] = useState(false),
    [asked, markAsked] = useOnce(`tlaco:studio:asked:${designId}`),
    [photoAsked, markPhotoAsked] = useOnce(`tlaco:studio:photo:${designId}`),
    kind = useRef<StudioAdAiKind>("photo"),
    skippedRef = useRef(false);

  const gen = useStudioGenerate({
    designId,
    productPhoto: photos.productPhoto,
    onImage: (job) => {
      asset.register(job.result_asset_id!, job.result_url!, "generated");
      trackStudioFunnel("studio_ai_image_ready", {
        kind: kind.current,
        skipped: skippedRef.current,
      });
      if (skippedRef.current) {
        setMessage("Llegó la imagen de la IA: está en Cambiar › Foto.");
        return;
      }
      void photos.show(job.result_asset_id!, job.result_url!);
      setMessage(
        kind.current === "scene"
          ? "Escena lista. Es ilustrativa: muestra el servicio, no tu local."
          : "Listo. Tu foto del catálogo sigue en Cambiar › Foto.",
      );
    },
  });

  const size = useStudioImageSize(photos.shownUrl),
    small =
      !photos.shownIsAi &&
      size !== null &&
      Math.min(size.width, size.height) < STUDIO_SHARP_PHOTO_PX;

  useEffect(() => {
    if (!running) return;
    setSlow(false);
    const timer = setTimeout(() => setSlow(true), STUDIO_AI_SLOW_MS);
    return () => clearTimeout(timer);
  }, [running]);

  async function runAi(next: StudioAdAiKind, assetId?: string) {
    if (!aiActive) {
      setMessage("La IA de imágenes todavía no está activa en tu cuenta.");
      return false;
    }
    if (!affordable) {
      setMessage("Te quedaste sin Tlacos. Recarga para usar la IA.");
      return false;
    }
    kind.current = next;
    skippedRef.current = false;
    setSkipped(false);
    setFailed(null);
    setMessage(null);
    setRunning({ kind: next, startedAt: Date.now() });
    try {
      let input = assetId;
      if (next === "scene") {
        const colors = studioDesignColors(photos.latest.current.palette),
          seed = await studioSeedImage(colors.dark, colors.accent);
        input = (
          await uploadStudioAsset({
            tenantId,
            designId,
            file: seed,
            kind: "preview",
          })
        ).assetId;
      }
      const ok = await gen.generate({
        operation:
          next === "improve" || next === "camera" ? "improve_photo" : "style",
        scene: next === "scene" ? "illustrate" : STUDIO_AUTO_SCENE,
        quality: "economy",
        wish: "",
        assetId: input,
      });
      if (next === "scene") markPhotoAsked();
      if (!ok && !skippedRef.current) setFailed(next);
      return ok;
    } catch (e) {
      setError(errorText(e, "No pudimos hacer la imagen."));
      if (!skippedRef.current) setFailed(next);
      return false;
    } finally {
      setRunning(null);
    }
  }

  /** Leaves the wait with what the ad already has; the AI may still finish. */
  function goOn() {
    skippedRef.current = true;
    setSkipped(true);
    setFailed(null);
    gen.clearError();
    trackStudioFunnel("studio_ai_wait_skipped", { kind: kind.current });
    setMessage(
      photos.hasPhoto
        ? "Va con tu foto. Si la imagen de la IA llega, quedará en Cambiar › Foto."
        : "Va solo con texto. Puedes agregar foto en Cambiar › Foto.",
    );
  }

  const started = useRef(false);
  useEffect(() => {
    if (started.current || !editor.canEdit) return;
    if (!photos.hasPhoto) {
      started.current = true;
      if (!photoAsked && !photos.uploads.length && !photos.generated.length)
        setNoPhotoOpen(true);
      return;
    }
    if (!autoAi || autoAiSpent.has(designId) || photos.generated.length) {
      started.current = true;
      return;
    }
    if (!size) return;
    started.current = true;
    autoAiSpent.add(designId);
    // A reload must not spend another Tlaco on the same ad.
    window.history.replaceState(null, "", window.location.pathname);
    if (aiOn) void runAi(small ? "improve" : "photo");
    // Runs once, as soon as the photo size is known.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [size, photos.hasPhoto, autoAi, editor.canEdit]);

  useEffect(() => {
    trackStudioFunnel("studio_ad_ready", {
      type: source.type,
      photo: photos.hasPhoto,
    });
    // Once per opened ad.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [designId]);

  /** Writes an answer to the catalog, then the ad picks it up. */
  async function writeBack(change: Parameters<typeof updateDesignSource>[2]) {
    const result = await updateDesignSource(tenantId, designId, change);
    await editor.refreshSource();
    return result;
  }

  async function takePhoto(file: File) {
    setNoPhotoOpen(false);
    markPhotoAsked();
    const id = await asset.upload(file, "image", true);
    if (!id) return;
    setMessage("Tu foto ya está en el anuncio.");
    if (source.type !== "custom")
      await writeBack({ kind: "catalog-photo", assetId: id })
        .then((r) => {
          if (r.saved)
            setMessage("Tu foto ya está en el anuncio y en tu catálogo.");
        })
        .catch(() =>
          setMessage(
            "Tu foto quedó en este anuncio; no pudimos guardarla en tu catálogo.",
          ),
        );
    if (aiOn) void runAi("camera", id);
  }

  function textOnly() {
    setNoPhotoOpen(false);
    markPhotoAsked();
    setMessage(
      "Anuncio solo con texto, con tus colores. Agrega foto en Cambiar › Foto.",
    );
  }

  async function describe(text: string) {
    setSaving(true);
    setError(null);
    try {
      await writeBack({ kind: "describe", description: text });
      markAsked();
      trackStudioFunnel("studio_gap_answered", { gap: "description" });
      setMessage(`Guardado en tu catálogo: «${text}».`);
      await designs.rewrite();
    } catch (e) {
      setError(errorText(e, "No pudimos guardar la descripción."));
    } finally {
      setSaving(false);
    }
  }

  async function extend(day: string) {
    setSaving(true);
    setError(null);
    try {
      await writeBack({
        kind: "validity",
        validUntil: new Date(`${day}T23:59:59-06:00`).toISOString(),
      });
      trackStudioFunnel("studio_gap_answered", { gap: "validity" });
      setMessage("Vigencia cambiada. Ya se puede publicar en tu tienda.");
      return true;
    } catch (e) {
      setError(errorText(e, "No pudimos cambiar la vigencia."));
      return false;
    } finally {
      setSaving(false);
    }
  }

  const hint =
    message ??
    (!photos.hasPhoto
      ? "Anuncio solo con texto, con tus colores. Agrega foto en Cambiar › Foto."
      : small
        ? "Tu foto es chica y se verá borrosa."
        : "Listo para compartir.");

  return {
    running,
    /** The full-screen wait: the AI is working, or it just failed, and the person has not moved on. */
    waiting: Boolean((running || failed) && !skipped),
    slow,
    failed,
    failText: failed ? (gen.error ?? error ?? "No salió la imagen.") : null,
    goOn,
    retry: () => failed && void runAi(failed),
    aiOn,
    runAi,
    aiActive,
    affordable,
    small,
    hint,
    error: error ?? gen.error,
    clearError: () => {
      setError(null);
      gen.clearError();
    },
    noPhotoOpen,
    openNoPhoto: () => setNoPhotoOpen(true),
    closeNoPhoto: () => setNoPhotoOpen(false),
    takePhoto,
    textOnly,
    canIllustrate: source.type === "custom" || source.kind === "service",
    needsDescription:
      editor.canEdit &&
      !asked &&
      source.type !== "custom" &&
      !source.description.trim() &&
      !source.items.length,
    skipDescription: markAsked,
    describe,
    draft: studioSourceIsDraft(source),
    canExtend: source.type === "promotion" && source.status === "active",
    extend,
    saving,
  };
}
