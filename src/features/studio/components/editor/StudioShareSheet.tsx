"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  Download,
  ExternalLink,
  Globe,
  MessageCircle,
  Plus,
  Share2,
} from "lucide-react";
import { useStudioSizes } from "../../hooks/useStudioSizes";
import { useStudioContext } from "../StudioProvider";
import { FormSheet } from "@/components/ui/FormSheet";
import { Notification } from "@/components/ui/Notification";
import { Skeleton } from "@/components/ui/Skeleton";
import { StudioPlacementSheet } from "./StudioPlacementSheet";
import { StudioScenePreview } from "./StudioScenePreview";
import { StudioShareTile } from "./StudioShareTile";
import {
  actionPair,
  adminActionButtonPrimary,
  adminActionButtonSecondary,
} from "@/components/admin/actionButtonClasses";
import { trackStudioFunnel } from "../../services/studioAnalyticsClient";
import {
  STUDIO_AD_SHARE_DONE,
  STUDIO_DOWNLOAD_SIZES,
} from "../../constants/studio";
import { reflowStudioScene } from "../../helpers/scene";
import type { StudioShareSheetProps } from "../../interfaces/ui";

type Channel = keyof typeof STUDIO_AD_SHARE_DONE;

/** Four destinations, no steps in between; the image is usually ready before the sheet opens. */
export function StudioShareSheet({
  open,
  onClose,
  disabled,
  prepared,
  output,
  editor,
  assets,
  draft,
  homeHref,
  onPublished,
}: StudioShareSheetProps) {
  const { tenantId, summary } = useStudioContext(),
    [placementOpen, setPlacementOpen] = useState(false),
    [choosing, setChoosing] = useState(false),
    [saving, setSaving] = useState<string | null>(null),
    [done, setDone] = useState<Channel | null>(null);

  useEffect(() => {
    if (!open) {
      setDone(null);
      setChoosing(false);
      return;
    }
    trackStudioFunnel("studio_share_opened", { draft, ready: prepared });
    // Counts each opening, and whether the image was already waiting.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const image = prepared ? output.output : null,
    ready = Boolean(image) && !disabled,
    storeUrl = editor.source.current.destinationUrl,
    publishable = Boolean(
      image &&
      !image.version.is_preparation &&
      summary?.publishEnabled &&
      summary.permissions.includes("studio.publish"),
    ),
    storeDetail = draft
      ? "Vencida: cambia la vigencia"
      : !summary?.permissions.includes("studio.publish")
        ? "Necesitas permiso para publicar"
        : "En tu tienda en línea";

  const sizes = useStudioSizes(image, assets, tenantId, open);

  async function downloadSize(size: (typeof STUDIO_DOWNLOAD_SIZES)[number]) {
    if (!image || saving) return;
    setSaving(size.format);
    try {
      const blob = await sizes.render(size.format);
      output.download(
        blob === image.blob ? undefined : { blob, suffix: size.suffix },
      );
      finish("download");
    } catch {
      output.setError("No pudimos preparar esa medida. Intenta otra vez.");
    } finally {
      setSaving(null);
    }
  }

  function finish(channel: Channel) {
    trackStudioFunnel("studio_shared", { channel, draft });
    setDone(channel);
  }

  return (
    <>
      <FormSheet
        isOpen={open && !placementOpen}
        onClose={onClose}
        title={
          done
            ? STUDIO_AD_SHARE_DONE[done]
            : choosing
              ? "Descargar"
              : "Compartir"
        }
        icon={done ? CheckCircle2 : Share2}
        footer={
          done ? (
            <div className={actionPair}>
              {done === "store" && storeUrl ? (
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
                  <ArrowLeft className="h-4 w-4" />
                  Volver
                </button>
              )}
              <Link href={homeHref} className={adminActionButtonPrimary}>
                <Plus className="h-4 w-4" />
                Otro
              </Link>
            </div>
          ) : undefined
        }
      >
        <div className="space-y-3 pb-3">
          {done ? (
            <p className="text-sm leading-6 text-muted-foreground">
              {done === "store"
                ? "Ya lo ven tus clientes en tu tienda en línea."
                : draft
                  ? "Va marcado como borrador porque la promoción no está vigente."
                  : "Con tu anuncio y el mensaje listo. Lo encuentras en Tus anuncios."}
            </p>
          ) : choosing && image ? (
            <>
              <p className="text-sm text-muted-foreground">
                Elige la medida. Se dibuja en tu teléfono, al momento.
              </p>
              <div className="grid grid-cols-3 items-end gap-2">
                {STUDIO_DOWNLOAD_SIZES.map((size) => (
                  <button
                    key={size.format}
                    type="button"
                    disabled={Boolean(saving)}
                    onClick={() => void downloadSize(size)}
                    className="flex min-w-0 cursor-pointer flex-col gap-1.5 rounded-xl p-1.5 text-left transition-colors hover:bg-border-soft/60 focus-visible:outline-2 focus-visible:outline-accent disabled:cursor-wait disabled:opacity-60"
                  >
                    <span className="pointer-events-none block overflow-hidden rounded-lg shadow-sm">
                      <StudioScenePreview
                        scene={reflowStudioScene(image.scene, size.format)}
                        assets={assets}
                        tenantId={tenantId}
                      />
                    </span>
                    <span className="text-sm font-bold">
                      {saving === size.format ? "Bajando…" : size.label}
                    </span>
                    <span className="text-xs leading-snug text-muted-foreground">
                      {size.detail}
                    </span>
                  </button>
                ))}
              </div>
              <button
                type="button"
                className={`${adminActionButtonSecondary} w-full sm:w-auto`}
                onClick={() => setChoosing(false)}
              >
                <ArrowLeft className="h-4 w-4" />
                Atrás
              </button>
            </>
          ) : (
            <>
              {image ? (
                <div className="flex items-center gap-3 rounded-xl bg-emerald-500/10 p-2 text-sm font-semibold text-emerald-700 dark:text-emerald-400">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={image.url}
                    alt=""
                    className="h-12 w-12 rounded-lg object-cover"
                  />
                  Lista en alta calidad
                </div>
              ) : (
                <div className="flex items-center gap-3 rounded-xl bg-border-soft/60 p-3 text-sm text-muted-foreground">
                  <Skeleton className="h-12 w-12 rounded-lg" />
                  Preparando tu imagen en alta calidad…
                </div>
              )}
              {output.error && (
                <Notification tone="error" message={output.error} />
              )}
              <div className="grid grid-cols-2 gap-3">
                <StudioShareTile
                  icon={MessageCircle}
                  tone="success"
                  title="WhatsApp"
                  detail="A tus clientes"
                  disabled={!ready}
                  onClick={() =>
                    void output.shareWhatsapp().then(() => finish("whatsapp"))
                  }
                />
                <StudioShareTile
                  icon={Share2}
                  title="Estado"
                  detail={
                    sizes.story ? "Pantalla completa, 9:16" : "Preparando…"
                  }
                  disabled={!ready || !sizes.story}
                  onClick={() =>
                    void output
                      .share(sizes.story!, "status")
                      .then(() => finish("status"))
                  }
                />
                <StudioShareTile
                  icon={Globe}
                  title="Tu tienda"
                  detail={storeDetail}
                  disabled={!ready || !publishable}
                  onClick={() => setPlacementOpen(true)}
                />
                <StudioShareTile
                  icon={Download}
                  title="Descargar"
                  detail="Cuadrado, vertical o historia"
                  disabled={!ready}
                  onClick={() => setChoosing(true)}
                />
              </div>
            </>
          )}
        </div>
      </FormSheet>
      {image && (
        <StudioPlacementSheet
          open={placementOpen}
          onClose={() => setPlacementOpen(false)}
          output={image}
          tenantId={tenantId}
          assets={assets}
          title={editor.title}
          destination={editor.destination}
          onSuccess={(_message, surfaces) => {
            setPlacementOpen(false);
            trackStudioFunnel("studio_shared", { channel: "store", draft });
            onPublished(surfaces);
          }}
        />
      )}
    </>
  );
}
