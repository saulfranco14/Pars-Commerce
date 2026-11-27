"use client";
import Link from "next/link";
import { CheckCircle2, ExternalLink, Plus } from "lucide-react";
import { FormSheet } from "@/components/ui/FormSheet";
import { StudioScenePreview } from "./StudioScenePreview";
import {
  actionPair,
  adminActionButtonPrimary,
  adminActionButtonSecondary,
} from "@/components/admin/actionButtonClasses";
import { STUDIO_SURFACES } from "../../constants/studio";
import { reflowStudioScene } from "../../helpers/scene";
import type { StudioPublishedSheetProps } from "../../interfaces/ui";

/** The end of publishing: the ad in the shape each place shows it, and where to go next. */
export function StudioPublishedSheet({
  open,
  onClose,
  surfaces,
  scene,
  assets,
  tenantId,
  storeUrl,
  homeHref,
}: StudioPublishedSheetProps) {
  return (
    <FormSheet
      isOpen={open}
      onClose={onClose}
      title="Ya está en tu tienda"
      description="Así lo ven tus clientes."
      icon={CheckCircle2}
      footer={
        <div className={actionPair}>
          {storeUrl ? (
            <a
              href={storeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={adminActionButtonSecondary}
            >
              <ExternalLink className="h-4 w-4" />
              Ver tienda
            </a>
          ) : (
            <button
              type="button"
              className={adminActionButtonSecondary}
              onClick={onClose}
            >
              Cerrar
            </button>
          )}
          <Link href={homeHref} className={adminActionButtonPrimary}>
            <Plus className="h-4 w-4" />
            Otro
          </Link>
        </div>
      }
    >
      <div className="grid grid-cols-2 items-end gap-3 pb-3">
        {scene &&
          surfaces.map((surface) => {
            const place = STUDIO_SURFACES[surface];
            return (
              <figure
                key={surface}
                className={`m-0 flex min-w-0 flex-col gap-1.5 ${place.format === "banner" ? "col-span-2" : ""}`}
              >
                <span className="pointer-events-none relative block overflow-hidden rounded-xl shadow-sm ring-1 ring-border">
                  <StudioScenePreview
                    scene={reflowStudioScene(scene, place.format)}
                    assets={assets}
                    tenantId={tenantId}
                  />
                  {surface === "product_campaign" && (
                    <span
                      aria-hidden
                      className="absolute right-2 bottom-2 flex h-8 w-8 items-center justify-center rounded-full bg-accent text-accent-foreground shadow-md"
                    >
                      <Plus className="h-4 w-4" />
                    </span>
                  )}
                </span>
                <figcaption className="text-sm font-semibold">
                  {place.label}
                </figcaption>
              </figure>
            );
          })}
      </div>
    </FormSheet>
  );
}
