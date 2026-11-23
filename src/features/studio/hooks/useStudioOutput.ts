"use client";
import { useEffect, useState } from "react";
import { ApiFetchError } from "@/services/apiFetch";
import { exportStudioScene } from "../helpers/canvas";
import {
  createVersion,
  recordShare,
  uploadStudioAsset,
  downloadStudioBlob,
} from "../services/studioClientService";
import type { StudioAsset, StudioVersion } from "../interfaces/studio";
import type { StudioScene } from "../interfaces/scene";

export interface StudioPreparedOutput {
  version: StudioVersion;
  blob: Blob;
  url: string;
  renderId: string;
  assetId: string;
  scene: StudioScene;
}
export function useStudioOutput(input: {
  tenantId: string;
  designId: string;
  scene: StudioScene;
  assets: StudioAsset[];
  revision: React.RefObject<number>;
  saveNow: () => Promise<void>;
  /** Catches up with a newer server revision (an image that landed meanwhile). */
  resync: () => Promise<void>;
  title: string;
  copy: string;
  destination: string;
}) {
  const [output, setOutput] = useState<StudioPreparedOutput | null>(null),
    [busy, setBusy] = useState(false),
    [error, setError] = useState<string | null>(null),
    [success, setSuccess] = useState<string | null>(null),
    [membershipRequired, setMembershipRequired] = useState(false);
  useEffect(
    () => () => {
      if (output) URL.revokeObjectURL(output.url);
    },
    [output],
  );
  async function prepare(): Promise<StudioPreparedOutput> {
    setBusy(true);
    setError(null);
    try {
      await input.saveNow();
      const version = await createVersion(
        input.tenantId,
        input.designId,
        input.revision.current,
      ).catch(async (e) => {
        if (!(e instanceof ApiFetchError && e.code === "REVISION_CONFLICT"))
          throw e;
        await input.resync();
        return createVersion(
          input.tenantId,
          input.designId,
          input.revision.current,
        );
      });
      const scene = version.scene_json;
      const blob = await exportStudioScene(
        scene,
        input.assets,
        input.tenantId,
        version.is_preparation,
      );
      const render = await uploadStudioAsset({
        tenantId: input.tenantId,
        designId: input.designId,
        file: blob,
        kind: "render",
        versionId: version.id,
        surface: "social",
        format: scene.format,
      });
      if (!render.renderId)
        throw new Error("La exportación todavía no está disponible.");
      const storedBlob = await downloadStudioBlob(render.url);
      const prepared = {
        version,
        scene,
        blob: storedBlob,
        url: URL.createObjectURL(storedBlob),
        renderId: render.renderId,
        assetId: render.assetId,
      };
      setOutput(prepared);
      return prepared;
    } catch (e) {
      if (e instanceof ApiFetchError && e.code === "MEMBERSHIP_REQUIRED")
        setMembershipRequired(true);
      setError(
        e instanceof Error ? e.message : "No pudimos preparar la exportación.",
      );
      throw e;
    } finally {
      setBusy(false);
    }
  }
  async function audit(action: string, target: string) {
    if (output)
      await recordShare(
        input.tenantId,
        output.version.id,
        action,
        target,
      ).catch(() => {});
  }
  function download() {
    if (!output) return;
    const a = document.createElement("a");
    a.href = output.url;
    a.download = `${input.title || "anuncio"}.png`;
    a.click();
    void audit("exported", "download");
    setSuccess("Tu archivo PNG está preparado y la descarga se inició.");
  }
  async function copyText() {
    try {
      await navigator.clipboard.writeText(
        [input.copy, input.destination].filter(Boolean).join("\n"),
      );
      void audit("copy_text", "clipboard");
      setSuccess("Texto copiado. Puedes pegarlo junto a tu anuncio.");
    } catch {
      setError(
        "No pudimos copiar automáticamente. Selecciona el texto y cópialo manualmente.",
      );
    }
  }
  const message = [input.copy, input.destination].filter(Boolean).join("\n"),
    whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
  function imageFile() {
    return output
      ? new File([output.blob], `${input.title || "anuncio"}.png`, {
          type: "image/png",
        })
      : null;
  }
  const canShareFiles = (file: File) =>
    "share" in navigator && Boolean(navigator.canShare?.({ files: [file] }));
  async function shareFile(file: File, target: string) {
    void audit("share_sheet_opened", target);
    try {
      await navigator.share({
        files: [file],
        title: input.title,
        text: message,
      });
      void audit("share_sheet_completed", target);
      setSuccess("Listo. Revisa el envío en la aplicación que elegiste.");
    } catch (e) {
      if (e instanceof DOMException && e.name === "AbortError") {
        void audit("share_sheet_cancelled", target);
        return;
      }
      setError(
        "No pudimos compartir el archivo. Descárgalo y adjúntalo a mano.",
      );
    }
  }
  async function share() {
    const file = imageFile();
    if (!file) return;
    if (canShareFiles(file)) return shareFile(file, "native");
    download();
    setSuccess("Descargamos la imagen. Súbela desde tu red social.");
  }
  /** Phones get the share sheet with image and text; elsewhere the image downloads and WhatsApp opens with the text. */
  async function shareWhatsapp() {
    const file = imageFile();
    if (!file) return;
    if (canShareFiles(file)) return shareFile(file, "whatsapp");
    download();
    void audit("whatsapp_opened", "whatsapp");
    window.open(whatsappUrl, "_blank", "noopener,noreferrer");
    setSuccess("Descargamos la imagen. Adjúntala en el chat de WhatsApp.");
  }
  return {
    output,
    busy,
    membershipRequired,
    clearMembershipRequired: () => setMembershipRequired(false),
    error,
    setError,
    success,
    setSuccess,
    prepare,
    download,
    copyText,
    share,
    shareWhatsapp,
  };
}
