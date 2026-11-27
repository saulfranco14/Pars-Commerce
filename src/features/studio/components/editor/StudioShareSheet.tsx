"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  Download,
  Globe,
  MessageCircle,
  Plus,
  Share2,
} from "lucide-react";
import { useStudioContext } from "../StudioProvider";
import { FormSheet } from "@/components/ui/FormSheet";
import { Notification } from "@/components/ui/Notification";
import { Skeleton } from "@/components/ui/Skeleton";
import { StudioPlacementSheet } from "./StudioPlacementSheet";
import { StudioShareTile } from "./StudioShareTile";
import {
  actionPair,
  adminActionButtonPrimary,
  adminActionButtonSecondary,
} from "@/components/admin/actionButtonClasses";
import { trackStudioFunnel } from "../../services/studioAnalyticsClient";
import { STUDIO_AD_SHARE_DONE } from "../../constants/studio";
import { studioTagline, suggestStudioCopy } from "../../helpers/sceneStyle";
import type { StudioShareSheetProps } from "../../interfaces/ui";

type Channel = keyof typeof STUDIO_AD_SHARE_DONE;

/** Four destinations, no steps in between. The image is prepared as the sheet opens. */
export function StudioShareSheet({
  open,
  onClose,
  disabled,
  output,
  editor,
  assets,
  draft,
  homeHref,
}: StudioShareSheetProps) {
  const { tenantId, summary } = useStudioContext(),
    [placementOpen, setPlacementOpen] = useState(false),
    [done, setDone] = useState<Channel | null>(null),
    preparedFor = useRef<string | null>(null);

  useEffect(() => {
    if (!open) {
      setDone(null);
      return;
    }
    trackStudioFunnel("studio_share_opened", { draft });
    const key = JSON.stringify(editor.scene);
    if (output.output && preparedFor.current === key) return;
    preparedFor.current = key;
    if (!editor.copy.trim())
      editor.setCopy(
        suggestStudioCopy(editor.source.current, studioTagline(editor.scene)),
      );
    void output.prepare().catch(() => {
      preparedFor.current = null;
    });
    // Prepares once per opening and only when the ad changed since the last one.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const prepared = output.output,
    ready = Boolean(prepared) && !output.busy && !disabled,
    publishable = Boolean(
      prepared &&
      !prepared.version.is_preparation &&
      summary?.publishEnabled &&
      summary.permissions.includes("studio.publish"),
    ),
    storeDetail = draft
      ? "Vencida: cambia la vigencia"
      : !summary?.permissions.includes("studio.publish")
        ? "Necesitas permiso para publicar"
        : "Arriba en tu sitio";

  function finish(channel: Channel) {
    trackStudioFunnel("studio_shared", { channel, draft });
    setDone(channel);
  }

  return (
    <>
      <FormSheet
        isOpen={open && !placementOpen}
        onClose={onClose}
        title={done ? STUDIO_AD_SHARE_DONE[done] : "Compartir"}
        icon={done ? CheckCircle2 : Share2}
        footer={
          done ? (
            <div className={actionPair}>
              <button
                type="button"
                className={adminActionButtonSecondary}
                onClick={onClose}
              >
                <ArrowLeft className="h-4 w-4" />
                Volver
              </button>
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
                ? "Ya lo ven tus clientes arriba en tu sitio."
                : draft
                  ? "Va marcado como borrador porque la promoción no está vigente."
                  : "Con tu anuncio y el mensaje listo. Lo encuentras en Tus anuncios."}
            </p>
          ) : (
            <>
              {!prepared && output.busy && (
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
                  detail="Estado, Instagram y más"
                  disabled={!ready}
                  onClick={() =>
                    void output.share().then(() => finish("status"))
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
                  detail="Para Instagram o Facebook"
                  disabled={!ready}
                  onClick={() => {
                    output.download();
                    finish("download");
                  }}
                />
              </div>
            </>
          )}
        </div>
      </FormSheet>
      {prepared && (
        <StudioPlacementSheet
          open={placementOpen}
          onClose={() => setPlacementOpen(false)}
          output={prepared}
          tenantId={tenantId}
          assets={assets}
          title={editor.title}
          destination={editor.destination}
          onSuccess={(message) => {
            output.setSuccess(message);
            setPlacementOpen(false);
            finish("store");
          }}
        />
      )}
    </>
  );
}
