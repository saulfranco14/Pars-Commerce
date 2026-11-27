"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Archive,
  CalendarClock,
  EyeOff,
  Globe,
  Palette,
  Share2,
  Sparkles,
} from "lucide-react";
import { useStudioAd } from "../../hooks/useStudioAd";
import { useStudioDesignPlacements } from "../../hooks/useStudioDesignPlacements";
import { useStudioDesigns } from "../../hooks/useStudioDesigns";
import { endStudioCreating } from "../../hooks/useStudioCreating";
import { useStudioPhotos } from "../../hooks/useStudioPhotos";
import { useStudioContext } from "../StudioProvider";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Notification } from "@/components/ui/Notification";
import { StudioActionBar } from "../StudioActionBar";
import { StudioAdReady } from "./StudioAdReady";
import { StudioAskCard } from "./StudioAskCard";
import { StudioChangeSheet } from "./StudioChangeSheet";
import { StudioDesignCarousel } from "./StudioDesignCarousel";
import { StudioGeneratingScreen } from "./StudioGeneratingScreen";
import { StudioMoreCard } from "./StudioMoreCard";
import { StudioNoPhotoSheet } from "./StudioNoPhotoSheet";
import { StudioPublishedSheet } from "./StudioPublishedSheet";
import { StudioShareSheet } from "./StudioShareSheet";
import { StudioValiditySheet } from "./StudioValiditySheet";
import {
  actionPair,
  adminActionButtonAi,
  adminActionButtonPrimary,
  adminActionButtonSecondary,
} from "@/components/admin/actionButtonClasses";
import { trackStudioFunnel } from "../../services/studioAnalyticsClient";
import { saveDesign } from "../../services/studioClientService";
import { revalidateStudioAds } from "../../services/studioAutoRefresh";
import {
  STUDIO_ACTION_BAR_SPACE,
  STUDIO_SURFACES,
} from "../../constants/studio";
import { STUDIO_TEXT_ONLY_DESIGNS } from "../../constants/designs";
import { studioRechargeHref } from "../../helpers/entry";
import { studioSharedAgo } from "../../helpers/adState";
import { studioTagline, suggestStudioCopy } from "../../helpers/sceneStyle";
import type { StudioDesignId } from "../../interfaces/scene";
import type { StudioAdViewProps } from "../../interfaces/ui";
import type { StudioSurface } from "../../interfaces/studio";

type Sheet = "change" | "share" | "validity" | "published" | "archive";
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
  reusable,
  lastSharedAt,
  updating,
}: StudioAdViewProps) {
  const { tenantSlug, summary } = useStudioContext(),
    router = useRouter(),
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
    [retireOpen, setRetireOpen] = useState(false),
    [publishedTo, setPublishedTo] = useState<StudioSurface[]>([]),
    /** A finished ad opens on its own, ready to share; Cambiar brings back the designs. */
    [finished, setFinished] = useState(Boolean(reusable) && !autoAi),
    [restoring, setRestoring] = useState(Boolean(reusable) && !autoAi),
    [archiving, setArchiving] = useState(false),
    published = useStudioDesignPlacements(designId),
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
    aiKind = photos.hasPhoto ? "photo" : ad.canIllustrate ? "scene" : null,
    sharedText = lastSharedAt
      ? `Compartido ${studioSharedAgo(lastSharedAt)}`
      : null,
    canPublish = Boolean(
      summary?.publishEnabled &&
      summary.permissions.includes("studio.publish") &&
      !ad.draft,
    );

  // The ad's own screen (or its AI wait) has taken over from the creating screen.
  useEffect(endStudioCreating, []);

  /* The share image is made in the background once the ad settles, so Compartir opens ready. */
  const sceneKey = JSON.stringify(editor.scene),
    preparedFor = useRef<string | null>(null),
    latestKey = useRef(sceneKey);
  latestKey.current = sceneKey;
  useEffect(() => {
    if (!restoring || !reusable) return;
    void output
      .restore(reusable)
      .then((ok) => {
        if (ok) preparedFor.current = latestKey.current;
      })
      .finally(() => setRestoring(false));
    // Once, with the version the ad opened with.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  function prepareShare() {
    if (restoring || (preparedFor.current === sceneKey && output.output))
      return;
    preparedFor.current = sceneKey;
    if (!editor.copy.trim())
      editor.setCopy(suggestStudioCopy(source, studioTagline(editor.scene)));
    void output.prepare().catch(() => {
      preparedFor.current = null;
    });
  }
  useEffect(() => {
    if (
      !editor.canEdit ||
      ad.waiting ||
      sheet ||
      output.busy ||
      restoring ||
      updating
    )
      return;
    const timer = setTimeout(prepareShare, PREPARE_AFTER_MS);
    return () => clearTimeout(timer);
    // Waits for the ad to settle; the scene key is what changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sceneKey, ad.waiting, sheet, restoring, updating]);
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
      cardShare={generating ? 0.9 : 0.86}
      maxVh={generating ? 0.62 : 0.56}
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
      {published.live.length > 0 && (
        <Notification
          tone="success"
          title="Publicado en tu tienda"
          message={
            <div className="space-y-2">
              <p>
                {[
                  ...new Set(
                    published.live.map(
                      (p) => STUDIO_SURFACES[p.surface]?.label ?? p.surface,
                    ),
                  ),
                  ...(sharedText ? [sharedText] : []),
                ].join(" · ")}
              </p>
              <button
                type="button"
                className={`${adminActionButtonSecondary} w-full sm:w-auto`}
                disabled={published.retiring}
                onClick={() => setRetireOpen(true)}
              >
                <EyeOff className="h-4 w-4" />
                {published.retiring ? "Retirando…" : "Retirar"}
              </button>
              {published.error && <p>{published.error}</p>}
            </div>
          }
        />
      )}
      {finished && !published.live.length && (
        <Notification
          tone="info"
          title="Listo para compartir"
          message={
            <div className="space-y-2">
              <p>{sharedText ?? "Todavía no lo compartes."}</p>
              {canPublish && (
                <button
                  type="button"
                  className={`${adminActionButtonSecondary} w-full sm:w-auto`}
                  disabled={locked}
                  onClick={() => {
                    setSheet("share");
                    prepareShare();
                  }}
                >
                  <Globe className="h-4 w-4" />
                  Publicar
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
      {!ad.waiting &&
        (finished ? (
          <StudioAdReady
            scene={editor.scene}
            assets={asset.assets}
            tenantId={tenantId}
          />
        ) : (
          carousel(false)
        ))}
      {finished && editor.canEdit && (
        <button
          type="button"
          className="mx-auto flex min-h-11 cursor-pointer items-center gap-1.5 px-3 text-sm font-semibold text-muted-foreground hover:text-foreground"
          disabled={locked || archiving}
          onClick={() => setSheet("archive")}
        >
          <Archive className="h-4 w-4" />
          Archivar
        </button>
      )}
      {ad.hint && (
        <p className="text-center text-sm text-muted-foreground" role="status">
          {ad.hint}
        </p>
      )}
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
            disabled={locked || updating}
            onClick={() => {
              if (finished) {
                setFinished(false);
                return;
              }
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
            disabled={ad.waiting || asset.busy || updating}
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
        onPublished={(surfaces) => {
          setPublishedTo(surfaces);
          setSheet("published");
          published.refresh();
        }}
      />
      <StudioPublishedSheet
        open={sheet === "published"}
        onClose={close}
        surfaces={publishedTo}
        scene={output.output?.scene ?? null}
        assets={asset.assets}
        tenantId={tenantId}
        storeUrl={source.destinationUrl}
        homeHref={home}
      />
      <ConfirmDialog
        isOpen={sheet === "archive"}
        onClose={close}
        title="Archivar anuncio"
        description={
          published.live.length
            ? "Lo quitamos de tu tienda y de Anuncios. Tus clientes vuelven a ver la foto del producto."
            : "Lo quitamos de Anuncios. Puedes crear otro cuando quieras."
        }
        confirmLabel="Archivar"
        onConfirm={async () => {
          setArchiving(true);
          try {
            if (published.live.length && !(await published.retireAll()))
              return;
            await editor.saveNow();
            await saveDesign(designId, {
              tenant_id: tenantId,
              revision: editor.revision.current,
              scene: editor.scene,
              title: editor.title,
              copy: editor.copy,
              destination_url: editor.destination,
              status: "archived",
            });
            revalidateStudioAds(tenantId);
            router.push(`${home}/disenos`);
          } catch (e) {
            editor.setError(
              e instanceof Error ? e.message : "No pudimos archivarlo.",
            );
          } finally {
            setArchiving(false);
            close();
          }
        }}
      />
      <ConfirmDialog
        isOpen={retireOpen}
        onClose={() => setRetireOpen(false)}
        title="Retirar de tu tienda"
        description="Tus clientes dejarán de verlo y vuelve lo que había antes. El anuncio se queda en Studio para usarlo cuando quieras."
        confirmLabel="Retirar"
        onConfirm={async () => {
          await published.retireAll();
          setRetireOpen(false);
        }}
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
