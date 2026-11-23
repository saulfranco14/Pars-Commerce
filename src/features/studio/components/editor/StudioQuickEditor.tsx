"use client";
import { useState } from "react";
import {
  ChevronRight,
  Image as ImageIcon,
  Palette,
  Type,
} from "lucide-react";
import { useStudioContext } from "../StudioProvider";
import { StudioAiCard } from "./StudioAiCard";
import { StudioColorSheet } from "./StudioColorSheet";
import { StudioDesignGallery } from "./StudioDesignGallery";
import { StudioFormatPicker } from "./StudioFormatPicker";
import { StudioPhotoSheet } from "./StudioPhotoSheet";
import { StudioQuickReview } from "./StudioQuickReview";
import { StudioScenePreview } from "./StudioScenePreview";
import { StudioTextSheet } from "./StudioTextSheet";
import { STUDIO_PALETTES } from "../../constants/studio";
import { applyStudioFindings } from "../../helpers/scene";
import {
  restyleStudioScene,
  studioPaletteId,
  studioTagline,
} from "../../helpers/sceneStyle";
import type { StudioQuickEditorProps } from "../../interfaces/ui";

type Sheet = "text" | "photo" | "color" | null;

export function StudioQuickEditor({
  editor,
  asset,
  ai,
  tenantId,
  locked,
  catalogHref,
  rechargeHref,
}: StudioQuickEditorProps) {
  const { summary } = useStudioContext(),
    [sheet, setSheet] = useState<Sheet>(null),
    source = editor.source.current,
    scene = editor.scene,
    image = scene.nodes.find((n) => n.kind === "image"),
    tagline = studioTagline(scene),
    palette = STUDIO_PALETTES.find((p) => p.id === studioPaletteId(scene));
  const rows = [
    {
      key: "text" as const,
      icon: Type,
      title: "Textos",
      detail: tagline ? `Nombre y frase: “${tagline}”` : "Nombre y frase corta",
    },
    {
      key: "photo" as const,
      icon: ImageIcon,
      title: "Foto y logo",
      detail: image?.assetId ? "Tu foto subida" : "La de tu catálogo",
    },
    {
      key: "color" as const,
      icon: Palette,
      title: "Colores",
      detail: palette?.name ?? "Personalizado",
    },
  ];
  function improve() {
    setSheet(null);
    ai.setOpen(true);
  }
  return (
    <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,380px)]">
      <div className="rounded-2xl border border-border bg-border-soft/40 p-3 sm:p-5 lg:sticky lg:top-4">
        <div className="mx-auto max-w-md">
          <StudioScenePreview
            scene={scene}
            assets={asset.assets}
            tenantId={tenantId}
          />
        </div>
      </div>
      <div className="space-y-5">
        <StudioDesignGallery
          scene={scene}
          source={source}
          assets={asset.assets}
          tenantId={tenantId}
          disabled={locked}
          onPick={(template) =>
            editor.setScene(restyleStudioScene(scene, source, template))
          }
        />
        <StudioFormatPicker
          value={scene.format}
          disabled={locked}
          onChange={editor.setFormat}
        />
        <section className="space-y-3">
          <h2 className="text-sm font-bold">Ajustes fáciles</h2>
          <div className="overflow-hidden rounded-2xl border border-border bg-surface">
            {rows.map(({ key, icon: Icon, title, detail }) => (
              <button
                key={key}
                type="button"
                disabled={locked}
                onClick={() => setSheet(key)}
                className="flex min-h-14 w-full cursor-pointer items-center gap-3 border-b border-border p-3 text-left last:border-b-0 hover:bg-border-soft/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent disabled:cursor-not-allowed disabled:opacity-60"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent/10 text-accent">
                  <Icon className="h-4 w-4" aria-hidden />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-bold">{title}</span>
                  <span className="block truncate text-xs text-muted-foreground">
                    {detail}
                  </span>
                </span>
                <ChevronRight
                  className="h-4 w-4 shrink-0 text-muted-foreground"
                  aria-hidden
                />
              </button>
            ))}
          </div>
        </section>
        <StudioAiCard
          balance={summary?.balance.available ?? 0}
          enabled={Boolean(summary?.aiEnabled && editor.canEdit)}
          hasImage={Boolean(image)}
          disabled={locked}
          rechargeHref={rechargeHref}
          onImprove={improve}
        />
        <StudioQuickReview
          scene={scene}
          disabled={locked}
          onFix={() => editor.setScene(applyStudioFindings(scene))}
        />
      </div>
      <StudioTextSheet
        open={sheet === "text"}
        onClose={() => setSheet(null)}
        disabled={locked}
        scene={scene}
        source={source}
        catalogHref={catalogHref}
        onApply={editor.setScene}
      />
      <StudioPhotoSheet
        open={sheet === "photo"}
        onClose={() => setSheet(null)}
        disabled={locked}
        assets={asset.assets}
        aiAvailable={Boolean(
          summary?.aiEnabled && image && summary.balance.available,
        )}
        onUpload={(file, kind) => void asset.upload(file, kind, true)}
        onSelect={(id) => asset.select(id, image?.id)}
        onImprove={improve}
      />
      <StudioColorSheet
        open={sheet === "color"}
        onClose={() => setSheet(null)}
        disabled={locked}
        scene={scene}
        onApply={editor.setScene}
      />
    </div>
  );
}
