"use client";
import { useRef, useState } from "react";
import {
  Image as ImageIcon,
  Loader2,
  Move,
  RefreshCw,
  RotateCw,
  Smartphone,
  Sparkles,
  Type,
} from "lucide-react";
import { useStudioDesigns } from "../../hooks/useStudioDesigns";
import { useStudioGenerate } from "../../hooks/useStudioGenerate";
import { useStudioImageSize } from "../../hooks/useStudioImageSize";
import { useStudioImages } from "../../hooks/useStudioImages";
import { useStudioContext } from "../StudioProvider";
import { Notification } from "@/components/ui/Notification";
import { StudioDesignCarousel } from "./StudioDesignCarousel";
import { StudioFormatSheet } from "./StudioFormatSheet";
import { StudioGeneratingOverlay } from "./StudioGeneratingOverlay";
import { StudioGenerateSheet } from "./StudioGenerateSheet";
import { StudioImageStrip } from "./StudioImageStrip";
import { StudioImagesSheet } from "./StudioImagesSheet";
import { StudioPhotoSheet } from "./StudioPhotoSheet";
import { StudioTextSheet } from "./StudioTextSheet";
import {
  importImage,
  importSourceImage,
} from "../../services/studioClientService";
import { adminActionButtonPrimary } from "@/components/admin/actionButtonClasses";
import { STUDIO_FORMATS, STUDIO_SHARP_PHOTO_PX } from "../../constants/studio";
import { setStudioBackdrop, studioBackdrop } from "../../helpers/sceneStyle";
import type {
  StudioImageTileItem,
  StudioPosterEditorProps,
} from "../../interfaces/ui";

type Sheet = "generate" | "text" | "format" | "photo" | "images";

export function StudioPosterEditor({
  editor,
  asset,
  tenantId,
  locked,
  designId,
  catalogHref,
  rechargeHref,
  onAdvanced,
}: StudioPosterEditorProps) {
  const { summary } = useStudioContext(),
    library = useStudioImages(),
    [sheet, setSheet] = useState<Sheet | null>(null),
    [notice, setNotice] = useState<string | null>(null),
    [revealed, setRevealed] = useState(0),
    scene = editor.scene,
    source = editor.source.current,
    latest = useRef(scene);
  latest.current = scene;
  const urlOf = (id: string) =>
    asset.assets.find((a) => a.id === id)?.url ??
    `/api/studio/assets/${id}/file?tenant_id=${tenantId}`;
  const byNewest = [...asset.assets]
    .filter((a) => a.status === "ready")
    .sort((a, b) => b.created_at.localeCompare(a.created_at));
  const generated = byNewest.filter((a) => a.kind === "generated"),
    ownPhoto = byNewest.find((a) => a.kind === "original"),
    shown = studioBackdrop(scene),
    shownIsAi = generated.some((a) => a.id === shown.assetId);
  async function productPhoto() {
    if (ownPhoto) return ownPhoto.id;
    if (!source.imageUrls.length)
      throw new Error("Sube la foto de tu producto en Foto para usar la IA.");
    const imported = await importSourceImage(tenantId, designId, 0);
    asset.register(imported.assetId, imported.url);
    return imported.assetId;
  }
  const gen = useStudioGenerate({
    designId,
    productPhoto,
    onImage: (job) => {
      asset.register(job.result_asset_id!, job.result_url!, "generated");
      editor.setScene(setStudioBackdrop(latest.current, job.result_asset_id!));
      setRevealed((n) => n + 1);
      void library.refresh();
    },
  });
  async function reuseImage(id: string) {
    try {
      const copy = await importImage(tenantId, designId, id);
      asset.register(copy.assetId, copy.url, "generated");
      editor.setScene(setStudioBackdrop(latest.current, copy.assetId));
    } catch (e) {
      setNotice(e instanceof Error ? e.message : "No pudimos usar esa imagen.");
    }
  }
  const tiles: StudioImageTileItem[] = (() => {
    const mine = generated.map((a, i) => ({
      key: a.id,
      label: i === 0 ? "Nueva" : `Imagen ${generated.length - i}`,
      url: urlOf(a.id),
      badge: "Tuya" as const,
      selected: shown.assetId === a.id,
      onPick: () => editor.setScene(setStudioBackdrop(latest.current, a.id)),
    }));
    const photoUrl = ownPhoto
      ? urlOf(ownPhoto.id)
      : (source.imageUrls[0] ?? null);
    const photo: StudioImageTileItem[] = photoUrl
      ? [
          {
            key: "photo",
            label: "Tu foto",
            url: photoUrl,
            selected: ownPhoto
              ? shown.assetId === ownPhoto.id
              : shown.imageUrl === photoUrl,
            onPick: () =>
              editor.setScene(
                setStudioBackdrop(
                  latest.current,
                  ownPhoto ? ownPhoto.id : { imageUrl: photoUrl },
                ),
              ),
          },
        ]
      : [];
    const others = library.images
      .filter((img) => img.designId !== designId)
      .map((img) => ({
        key: img.id,
        label: img.title || "Otro",
        url: img.url,
        badge: "Otro" as const,
        selected: false,
        onPick: () => void reuseImage(img.id),
      }));
    return [...mine, ...photo, ...others];
  })();
  const aiReady = Boolean(summary?.aiEnabled && editor.canEdit),
    format = STUDIO_FORMATS[scene.format],
    close = () => setSheet(null);
  const shownUrl = shown.assetId ? urlOf(shown.assetId) : shown.imageUrl,
    designs = useStudioDesigns(editor, designId, shownUrl),
    photoSize = useStudioImageSize(shownUrl),
    blurry =
      !shownIsAi &&
      photoSize !== null &&
      Math.min(photoSize.width, photoSize.height) < STUDIO_SHARP_PHOTO_PX;
  function openGenerate() {
    if (!aiReady) {
      setNotice("La IA de imágenes todavía no está activa en tu cuenta.");
      return;
    }
    setSheet("generate");
  }
  const tools = [
    { key: "text", label: "Textos", Icon: Type, onClick: () => setSheet("text") },
    { key: "format", label: "Formato", Icon: Smartphone, onClick: () => setSheet("format") },
    { key: "photo", label: "Foto", Icon: ImageIcon, onClick: () => setSheet("photo") },
    { key: "hand", label: "A mano", Icon: Move, onClick: onAdvanced },
  ];
  const linkClass =
    "inline-flex min-h-11 cursor-pointer items-center gap-1.5 font-bold text-accent disabled:cursor-not-allowed disabled:opacity-60";
  return (
    <div className="flex flex-col gap-3">
      <StudioDesignCarousel
        options={designs.options}
        active={designs.activeIndex}
        onPick={designs.pick}
        assets={asset.assets}
        tenantId={tenantId}
        disabled={locked || !editor.canEdit}
        overlay={gen.busy ? <StudioGeneratingOverlay /> : undefined}
        revealKey={revealed}
      />
      {editor.canEdit && (
        <div className="flex items-start justify-between gap-3 text-sm">
          <div className="flex min-w-0 flex-col">
            <button
              type="button"
              onClick={() => void designs.more()}
              disabled={locked || designs.busy || designs.moreLeft <= 0}
              className={linkClass}
            >
              {designs.busy ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              ) : (
                <RefreshCw className="h-4 w-4" aria-hidden />
              )}
              Otras frases
            </button>
            <span className="text-xs text-muted-foreground">
              {designs.moreLeft > 0
                ? "Gratis: la IA escribe 6 nuevas"
                : "Ya pediste 3 veces; cambia la frase en Textos"}
            </span>
          </div>
          <div className="flex min-w-0 flex-col items-end text-right">
            <button
              type="button"
              onClick={openGenerate}
              disabled={locked || gen.busy}
              className={linkClass}
            >
              <RotateCw className="h-4 w-4" aria-hidden />
              Otra imagen
            </button>
            <span className="text-xs text-muted-foreground">
              Desde 1 Tlaco
            </span>
          </div>
        </div>
      )}
      {blurry && !gen.busy && editor.canEdit && (
        <Notification
          tone="info"
          title="Tu foto es chica y se ve borrosa"
          message={
            <div className="space-y-2">
              <p>
                Mide {photoSize?.width} × {photoSize?.height} px y el anuncio
                sale a {format.width} px. Genera una imagen con IA (sale nítida)
                o sube una foto de al menos {STUDIO_SHARP_PHOTO_PX} px.
              </p>
              <button
                type="button"
                onClick={openGenerate}
                disabled={locked}
                className={`${adminActionButtonPrimary} w-full sm:w-auto`}
              >
                <Sparkles className="h-4 w-4" />
                Generar
              </button>
            </div>
          }
        />
      )}
      {(gen.error || notice || designs.error) && (
        <Notification
          tone="warning"
          message={gen.error ?? notice ?? designs.error}
          onDismiss={() => {
            gen.clearError();
            designs.clearError();
            setNotice(null);
          }}
        />
      )}
      <StudioImageStrip
        tiles={tiles}
        disabled={locked || gen.busy}
        onGenerate={openGenerate}
        onSeeAll={() => setSheet("images")}
      />
      <div className="grid grid-cols-4 gap-2">
        {tools.map(({ key, label, Icon, onClick }) => (
          <button
            key={key}
            type="button"
            disabled={locked}
            onClick={onClick}
            className="flex min-h-14 cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border border-muted/50 bg-surface text-xs font-semibold transition-colors hover:border-accent hover:bg-accent/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Icon className="h-5 w-5 text-accent" aria-hidden />
            {label}
          </button>
        ))}
      </div>
      <StudioGenerateSheet
        open={sheet === "generate"}
        onClose={close}
        disabled={locked || gen.busy}
        balance={summary?.balance.available ?? 0}
        rechargeHref={rechargeHref}
        onGenerate={(options) => {
          close();
          void gen.generate({ operation: "style", ...options });
        }}
      />
      <StudioTextSheet
        open={sheet === "text"}
        onClose={close}
        disabled={locked}
        designId={designId}
        scene={scene}
        source={source}
        catalogHref={catalogHref}
        onApply={editor.setScene}
        onMessage={(message) => {
          if (!editor.copy.trim()) editor.setCopy(message);
        }}
      />
      <StudioFormatSheet
        open={sheet === "format"}
        onClose={close}
        disabled={locked}
        value={scene.format}
        onChange={editor.setFormat}
      />
      <StudioPhotoSheet
        open={sheet === "photo"}
        onClose={close}
        disabled={locked}
        onUpload={(file, kind) => {
          close();
          void asset.upload(file, kind, true);
        }}
      />
      <StudioImagesSheet
        open={sheet === "images"}
        onClose={close}
        disabled={locked}
        tiles={tiles}
      />
    </div>
  );
}
