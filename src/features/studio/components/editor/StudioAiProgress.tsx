"use client";
import { useState } from "react";
import { X } from "lucide-react";
import { Notification } from "@/components/ui/Notification";
import { StudioVariantCompare } from "./StudioVariantCompare";
import { adminActionButtonSecondary } from "@/components/admin/actionButtonClasses";
import { studioImageUrl } from "../../helpers/canvas";
import type { StudioAiProgressProps } from "../../interfaces/ui";

export function StudioAiProgress({
  editor,
  asset,
  ai,
  tenantId,
  locked,
  onRefresh,
}: StudioAiProgressProps) {
  const [ignored, setIgnored] = useState<string | null>(null),
    variant = ai.job?.status === "succeeded" ? ai.job.result_asset_id : null,
    target =
      ai.inputImage ??
      (editor.selected?.kind === "image"
        ? editor.selected
        : editor.scene.nodes.find((n) => n.kind === "image"));
  function applyVariant(id: string) {
    if (!target) return;
    const url = `/api/studio/assets/${id}/file?tenant_id=${tenantId}`;
    asset.register(id, url, "generated");
    if (editor.scene.nodes.some((n) => n.id === target.id))
      editor.updateNode(target.id, { assetId: id, imageUrl: undefined });
    else
      editor.setScene({
        ...editor.scene,
        nodes: [
          ...editor.scene.nodes,
          {
            ...target,
            id: crypto.randomUUID(),
            assetId: id,
            imageUrl: undefined,
          },
        ],
      });
    setIgnored(id);
    void onRefresh();
  }
  return (
    <>
      {ai.job && ["queued", "processing"].includes(ai.job.status) && (
        <Notification
          tone="info"
          message={
            <div className="space-y-3">
              <p>
                {ai.job.status === "queued"
                  ? "Tu propuesta está en cola"
                  : "La IA está preparando tu imagen"}
                . Puedes seguir trabajando.
              </p>
              {ai.job.status === "queued" && (
                <button
                  type="button"
                  className={`${adminActionButtonSecondary} w-full sm:w-auto`}
                  onClick={() => void ai.cancel()}
                >
                  <X className="h-4 w-4" />
                  Cancelar
                </button>
              )}
            </div>
          }
        />
      )}
      {ai.job?.status === "failed" && (
        <Notification
          tone="warning"
          message="La propuesta no se completó. La reserva se liberó; tu foto y tu diseño se conservan."
        />
      )}
      {variant && variant !== ignored && (
        <StudioVariantCompare
          original={target ? studioImageUrl(target, asset.assets, tenantId) : null}
          result={`/api/studio/assets/${variant}/file?tenant_id=${tenantId}`}
          disabled={locked}
          onOriginal={() => setIgnored(variant)}
          onUse={() => applyVariant(variant)}
        />
      )}
    </>
  );
}
