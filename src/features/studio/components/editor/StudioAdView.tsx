"use client";
import { useState } from "react";
import { CalendarClock, Palette, Share2, Sparkles } from "lucide-react";
import { useStudioAd } from "../../hooks/useStudioAd";
import { useStudioDesigns } from "../../hooks/useStudioDesigns";
import { useStudioPhotos } from "../../hooks/useStudioPhotos";
import { useStudioContext } from "../StudioProvider";
import { Notification } from "@/components/ui/Notification";
import { StudioActionBar } from "../StudioActionBar";
import { StudioAiStatus } from "./StudioAiStatus";
import { StudioAskCard } from "./StudioAskCard";
import { StudioChangeSheet } from "./StudioChangeSheet";
import { StudioFadingPreview } from "./StudioFadingPreview";
import { StudioNoPhotoSheet } from "./StudioNoPhotoSheet";
import { StudioShareSheet } from "./StudioShareSheet";
import { StudioValiditySheet } from "./StudioValiditySheet";
import {
  actionPair,
  adminActionButtonAi,
  adminActionButtonPrimary,
  adminActionButtonSecondary,
} from "@/components/admin/actionButtonClasses";
import { trackStudioFunnel } from "../../services/studioAnalyticsClient";
import {
  STUDIO_ACTION_BAR_SPACE,
  STUDIO_FORMATS,
} from "../../constants/studio";
import type { StudioAdViewProps } from "../../interfaces/ui";

type Sheet = "change" | "share" | "validity";
/** Tallest the ad may get on screen, so the actions stay in view. */
const STAGE_MAX_VH = 56;

/** The ad, ready at once; Cambiar and Compartir are the only two moves. */
export function StudioAdView({
  editor,
  asset,
  tenantId,
  locked,
  designId,
  output,
  autoAi,
  saveText,
  onByHand,
}: StudioAdViewProps) {
  const { tenantSlug } = useStudioContext(),
    photos = useStudioPhotos({ editor, asset, tenantId, designId }),
    designs = useStudioDesigns(editor, designId, photos.shownUrl),
    ad = useStudioAd({
      editor,
      asset,
      photos,
      designs,
      tenantId,
      designId,
      autoAi,
    }),
    [sheet, setSheet] = useState<Sheet | null>(null),
    source = editor.source.current,
    format = STUDIO_FORMATS[editor.scene.format],
    close = () => setSheet(null);

  return (
    <div className={`space-y-3 ${STUDIO_ACTION_BAR_SPACE}`}>
      {ad.draft && (
        <Notification
          tone="warning"
          title={
            source.validUntil && new Date(source.validUntil) <= new Date()
              ? "Esta promoción ya venció"
              : "Esta promoción no está activa"
          }
          message={
            <div className="space-y-2">
              <p>
                Puedes mandarla como borrador. Para publicarla en tu tienda,
                {ad.canExtend
                  ? " cambia la vigencia."
                  : " actívala en Promociones."}
              </p>
              {ad.canExtend && (
                <button
                  type="button"
                  className={`${adminActionButtonSecondary} w-full sm:w-auto`}
                  disabled={locked}
                  onClick={() => setSheet("validity")}
                >
                  <CalendarClock className="h-4 w-4" />
                  Vigencia
                </button>
              )}
            </div>
          }
        />
      )}
      {ad.needsDescription && (
        <StudioAskCard
          name={source.name}
          saving={ad.saving}
          onSave={(text) => void ad.describe(text)}
          onSkip={ad.skipDescription}
        />
      )}
      {(ad.error || designs.error) && (
        <Notification
          tone="warning"
          message={ad.error ?? designs.error}
          onDismiss={() => {
            ad.clearError();
            designs.clearError();
          }}
        />
      )}
      <div
        className="relative mx-auto w-full"
        style={{
          maxWidth: `calc(${STAGE_MAX_VH}vh * ${format.width / format.height})`,
        }}
      >
        <div className="overflow-hidden rounded-2xl shadow-sm">
          <StudioFadingPreview
            scene={editor.scene}
            assets={asset.assets}
            tenantId={tenantId}
          />
        </div>
        {ad.draft && (
          <span
            aria-hidden
            className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -rotate-10 text-5xl font-bold tracking-wider text-white/85 [-webkit-text-stroke:1.5px_#172033]"
          >
            BORRADOR
          </span>
        )}
      </div>
      <StudioAiStatus
        running={ad.running}
        landed={ad.landed}
        onUndo={ad.undo}
      />
      <p className="text-center text-sm text-muted-foreground" role="status">
        {ad.hint}
      </p>
      {ad.small && !ad.running && !ad.landed && ad.aiActive && (
        <button
          type="button"
          className={`${adminActionButtonAi} w-full sm:w-auto`}
          disabled={locked || !ad.affordable}
          onClick={() => void ad.runAi("improve")}
        >
          <Sparkles className="h-4 w-4" />
          Mejorar
        </button>
      )}
      <StudioActionBar status={saveText}>
        <div className={actionPair}>
          <button
            type="button"
            className={adminActionButtonSecondary}
            disabled={locked}
            onClick={() => {
              setSheet("change");
              trackStudioFunnel("studio_change_opened");
            }}
          >
            <Palette className="h-4 w-4" />
            Cambiar
          </button>
          <button
            type="button"
            className={adminActionButtonPrimary}
            disabled={output.busy || asset.busy}
            onClick={() => setSheet("share")}
          >
            <Share2 className="h-4 w-4" />
            Compartir
          </button>
        </div>
      </StudioActionBar>
      <StudioChangeSheet
        open={sheet === "change"}
        onClose={close}
        disabled={locked}
        photos={photos}
        designs={designs}
        ad={ad}
        assets={asset.assets}
        tenantId={tenantId}
        onByHand={() => {
          close();
          onByHand();
        }}
      />
      <StudioShareSheet
        open={sheet === "share"}
        onClose={close}
        disabled={asset.busy}
        output={output}
        editor={editor}
        assets={asset.assets}
        draft={ad.draft}
        homeHref={`/dashboard/${tenantSlug}/studio`}
      />
      <StudioValiditySheet
        open={sheet === "validity"}
        onClose={close}
        disabled={locked}
        saving={ad.saving}
        onSave={ad.extend}
      />
      <StudioNoPhotoSheet
        open={ad.noPhotoOpen && sheet === null}
        onClose={ad.closeNoPhoto}
        disabled={locked || asset.busy}
        name={source.name}
        canIllustrate={ad.canIllustrate && ad.aiActive && ad.affordable}
        aiOn={ad.aiOn}
        onCamera={(file) => void ad.takePhoto(file)}
        onScene={() => {
          ad.closeNoPhoto();
          void ad.runAi("scene");
        }}
        onText={ad.textOnly}
      />
    </div>
  );
}
