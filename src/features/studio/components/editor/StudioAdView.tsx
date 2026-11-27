"use client";
import { useEffect, useRef, useState } from "react";
import { CalendarClock, Palette, Share2, Sparkles } from "lucide-react";
import { useStudioAd } from "../../hooks/useStudioAd";
import { useStudioDesigns } from "../../hooks/useStudioDesigns";
import { useStudioPhotos } from "../../hooks/useStudioPhotos";
import { useStudioContext } from "../StudioProvider";
import { Notification } from "@/components/ui/Notification";
import { StudioActionBar } from "../StudioActionBar";
import { StudioAskCard } from "./StudioAskCard";
import { StudioChangeSheet } from "./StudioChangeSheet";
import { StudioDesignCarousel } from "./StudioDesignCarousel";
import { StudioGeneratingScreen } from "./StudioGeneratingScreen";
import { StudioMoreCard } from "./StudioMoreCard";
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
import { STUDIO_ACTION_BAR_SPACE } from "../../constants/studio";
import { STUDIO_TEXT_ONLY_DESIGNS } from "../../constants/designs";
import { studioRechargeHref } from "../../helpers/entry";
import { studioTagline, suggestStudioCopy } from "../../helpers/sceneStyle";
import type { StudioDesignId } from "../../interfaces/scene";
import type { StudioAdViewProps } from "../../interfaces/ui";

type Sheet = "change" | "share" | "validity";
/** Quiet time after the last change before the share image is prepared. */
const PREPARE_AFTER_MS = 2000;

/** The ad among its designs; Cambiar and Compartir are the only two moves. */
export function StudioAdView({
  editor,
  asset,
  tenantId,
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
    locked = !editor.canEdit || asset.busy || ad.waiting,
    close = () => setSheet(null),
    home = `/dashboard/${tenantSlug}/studio`;

  const shown = designs.options
      .map((option, index) => ({ option, index }))
      .filter(
        ({ option }) =>
          photos.hasPhoto ||
          STUDIO_TEXT_ONLY_DESIGNS.includes(option.id as StudioDesignId),
      ),
    active = shown.findIndex(({ index }) => index === designs.activeIndex),
    pick = (i: number) => {
      const target = shown[i];
      if (!target) return;
      designs.pick(target.index);
      trackStudioFunnel("studio_design_changed", { design: target.option.id });
    },
    aiKind = photos.hasPhoto ? "photo" : ad.canIllustrate ? "scene" : null;

  /* The share image is made in the background once the ad settles, so Compartir opens ready. */
  const sceneKey = JSON.stringify(editor.scene),
    preparedFor = useRef<string | null>(null);
  function prepareShare() {
    if (preparedFor.current === sceneKey && output.output) return;
    preparedFor.current = sceneKey;
    if (!editor.copy.trim())
      editor.setCopy(suggestStudioCopy(source, studioTagline(editor.scene)));
    void output.prepare().catch(() => {
      preparedFor.current = null;
    });
  }
  useEffect(() => {
    if (!editor.canEdit || ad.waiting || sheet || output.busy) return;
    const timer = setTimeout(prepareShare, PREPARE_AFTER_MS);
    return () => clearTimeout(timer);
    // Waits for the ad to settle; the scene key is what changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sceneKey, ad.waiting, sheet]);
  const prepared =
    Boolean(output.output) && preparedFor.current === sceneKey && !output.busy;

  const draftStamp = ad.draft ? (
    <span
      aria-hidden
      className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -rotate-10 text-4xl font-bold tracking-wider text-white/85 [-webkit-text-stroke:1.5px_#172033]"
    >
      BORRADOR
    </span>
  ) : undefined;

  const carousel = (generating: boolean) => (
    <StudioDesignCarousel
      options={shown.map(({ option }) => option)}
      active={active}
      onPick={pick}
      assets={asset.assets}
      tenantId={tenantId}
      disabled={!editor.canEdit}
      generating={generating}
      dark={generating}
      overlay={generating ? undefined : draftStamp}
      endCard={
        generating || !aiKind || !ad.aiActive ? undefined : (
          <StudioMoreCard
            disabled={locked}
            blocked={
              ad.affordable
                ? null
                : "Te quedaste sin Tlacos. Lo demás sigue gratis."
            }
            rechargeHref={studioRechargeHref(tenantSlug, home)}
            onGenerate={() => {
              trackStudioFunnel("studio_more_image", { kind: aiKind });
              void ad.runAi(aiKind);
            }}
          />
        )
      }
    />
  );

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
      {(ad.error || designs.error) && !ad.waiting && (
        <Notification
          tone="warning"
          message={ad.error ?? designs.error}
          onDismiss={() => {
            ad.clearError();
            designs.clearError();
          }}
        />
      )}
      {!ad.waiting && carousel(false)}
      <p className="text-center text-sm text-muted-foreground" role="status">
        {ad.hint}
      </p>
      {ad.small && !ad.running && ad.aiActive && (
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
            disabled={ad.waiting || asset.busy}
            onClick={() => {
              setSheet("share");
              prepareShare();
            }}
          >
            <Share2 className="h-4 w-4" />
            Compartir
          </button>
        </div>
      </StudioActionBar>
      {ad.waiting && (
        <StudioGeneratingScreen
          ad={ad}
          title={editor.title}
          carousel={carousel(true)}
          goOnLabel={photos.hasPhoto ? "Usar mi foto" : "Seguir con texto"}
        />
      )}
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
        prepared={prepared}
        output={output}
        editor={editor}
        assets={asset.assets}
        draft={ad.draft}
        homeHref={home}
      />
      <StudioValiditySheet
        open={sheet === "validity"}
        onClose={close}
        disabled={locked}
        saving={ad.saving}
        onSave={ad.extend}
      />
      <StudioNoPhotoSheet
        open={ad.noPhotoOpen && sheet === null && !ad.waiting}
        onClose={ad.closeNoPhoto}
        disabled={locked}
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
