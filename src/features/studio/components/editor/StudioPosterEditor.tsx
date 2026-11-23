"use client";
import { useRef, useState } from "react";
import {
  Image as ImageIcon,
  LayoutTemplate,
  RotateCw,
  Smartphone,
  Sparkles,
  Type,
} from "lucide-react";
import { useStudioGenerate } from "../../hooks/useStudioGenerate";
import { useStudioImageSize } from "../../hooks/useStudioImageSize";
import { useStudioImages } from "../../hooks/useStudioImages";
import { useStudioContext } from "../StudioProvider";
import { Notification } from "@/components/ui/Notification";
import { StudioFormatSheet } from "./StudioFormatSheet";
import { StudioGeneratingOverlay } from "./StudioGeneratingOverlay";
import { StudioGenerateSheet } from "./StudioGenerateSheet";
import { StudioImageStrip } from "./StudioImageStrip";
import { StudioImagesSheet } from "./StudioImagesSheet";
import { StudioPhotoSheet } from "./StudioPhotoSheet";
import { StudioScenePreview } from "./StudioScenePreview";
import { StudioStyleSheet } from "./StudioStyleSheet";
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

type Sheet = "generate" | "text" | "style" | "format" | "photo" | "images";
const PREVIEW_MAX_VH = 42;

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
    { key: "text" as const, label: "Textos", Icon: Type },
    { key: "style" as const, label: "Estilo", Icon: LayoutTemplate },
    { key: "format" as const, label: "Formato", Icon: Smartphone },
    { key: "photo" as const, label: "Foto", Icon: ImageIcon },
  ];
  return (
    <div className="flex flex-col gap-3">
      <div
        className="relative mx-auto w-full"
        style={{
          maxWidth: `min(100%, calc(${PREVIEW_MAX_VH}vh * ${format.width / format.height}))`,
        }}
      >
        <div
          key={revealed}
          className={`overflow-hidden rounded-2xl shadow-sm ${revealed ? "studio-reveal" : ""}`}
        >
          <StudioScenePreview
            scene={scene}
            assets={asset.assets}
            tenantId={tenantId}
          />
        </div>
        {gen.busy ? (
          <StudioGeneratingOverlay />
        ) : shownIsAi && editor.canEdit ? (
          <div className="absolute inset-x-2 bottom-2 flex items-center justify-between gap-2 rounded-xl bg-surface/95 py-1.5 pr-1.5 pl-3 text-sm font-semibold shadow-lg">
            ¿No te convence?
            <button
              type="button"
              onClick={openGenerate}
              disabled={locked}
              className="inline-flex min-h-9 cursor-pointer items-center gap-1.5 rounded-lg border border-accent/30 bg-accent/10 px-3 font-bold text-accent disabled:opacity-60"
            >
              <RotateCw className="h-4 w-4" />
              Otro
            </button>
          </div>
        ) : shown.imageUrl || ownPhoto?.id === shown.assetId ? (
          <span className="absolute top-2 left-2 rounded-lg bg-slate-900/75 px-2 py-0.5 text-xs font-semibold text-white">
            Tu foto del catálogo
          </span>
        ) : null}
      </div>
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
      {(gen.error || notice) && (
        <Notification
          tone="warning"
          message={gen.error ?? notice}
          onDismiss={() => {
            gen.clearError();
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
        {tools.map(({ key, label, Icon }) => (
          <button
            key={key}
            type="button"
            disabled={locked}
            onClick={() => setSheet(key)}
            className="flex min-h-14 cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border border-border bg-surface text-xs font-semibold transition-colors hover:bg-border-soft/60 disabled:cursor-not-allowed disabled:opacity-60"
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
      <StudioStyleSheet
        open={sheet === "style"}
        onClose={close}
        disabled={locked}
        scene={scene}
        source={source}
        assets={asset.assets}
        tenantId={tenantId}
        onApply={editor.setScene}
        onAdvanced={() => {
          close();
          onAdvanced();
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
