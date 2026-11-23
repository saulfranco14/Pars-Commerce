"use client";
import { useRef, useState } from "react";
import { useStudioContext } from "../components/StudioProvider";
import { generateImage } from "../services/studioClientService";
import type { StudioImageRequest, StudioRunJob } from "../interfaces/studio";

type GenerateOptions = Pick<
  StudioImageRequest,
  "quality" | "scene" | "wish" | "operation" | "referenceAssetId"
>;

/**
 * One tap, one image: prices, reserves and generates on the server, then hands
 * the stored image back. A failed generation releases its Tlacos.
 */
export function useStudioGenerate(input: {
  designId: string;
  productPhoto: () => Promise<string>;
  onImage: (job: StudioRunJob) => void;
}) {
  const { tenantId, refresh } = useStudioContext(),
    [busy, setBusy] = useState(false),
    [error, setError] = useState<string | null>(null),
    running = useRef(false);
  async function generate(options: GenerateOptions) {
    if (running.current) return;
    running.current = true;
    setBusy(true);
    setError(null);
    try {
      const job = await generateImage({
        tenantId,
        designId: input.designId,
        assetId: await input.productPhoto(),
        ...options,
      });
      if (job.status === "succeeded" && job.result_asset_id) input.onImage(job);
      else if (job.status === "failed")
        setError(
          "No pudimos hacer la imagen esta vez. No se cobró ningún Tlaco; intenta de nuevo.",
        );
      else
        setError(
          "Tu imagen sigue en proceso. Aparecerá en Tus imágenes en unos minutos.",
        );
    } catch (e) {
      setError(e instanceof Error ? e.message : "No pudimos hacer la imagen.");
    } finally {
      running.current = false;
      setBusy(false);
      void refresh();
    }
  }
  return { generate, busy, error, clearError: () => setError(null) };
}
