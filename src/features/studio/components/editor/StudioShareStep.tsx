"use client";
import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import useSWR from "swr";
import {
  ArrowLeft,
  Check,
  Copy,
  Download,
  Globe,
  MessageCircle,
  Pencil,
  Plus,
  Share2,
} from "lucide-react";
import { useStudioContext } from "../StudioProvider";
import { FormInput } from "@/components/ui/FormInput";
import { FormSheet } from "@/components/ui/FormSheet";
import { FormTextarea } from "@/components/ui/FormTextarea";
import { Notification } from "@/components/ui/Notification";
import { Skeleton } from "@/components/ui/Skeleton";
import { StudioPlacementSheet } from "./StudioPlacementSheet";
import { StudioShareTile } from "./StudioShareTile";
import {
  actionPair,
  actionStack,
  adminActionButtonPrimary,
  adminActionButtonSecondary,
  adminActionButtonText,
} from "@/components/admin/actionButtonClasses";
import { loadRenders } from "../../services/studioClientService";
import { STUDIO_FORMATS } from "../../constants/studio";
import { studioTemplate } from "../../helpers/layout";
import type {
  StudioShareStepProps,
  StudioShareTileProps,
} from "../../interfaces/ui";

export function StudioShareStep({
  output,
  editor,
  assets,
  designId,
  readOnly,
  onBack,
}: StudioShareStepProps) {
  const { tenantId, tenantSlug, summary } = useStudioContext(),
    [placementOpen, setPlacementOpen] = useState(false),
    [messageOpen, setMessageOpen] = useState(false);
  const saved = useSWR(
    readOnly ? ["studio-renders", tenantId, designId] : null,
    () => loadRenders(tenantId, designId),
  );
  const prepared = output.output,
    scene = prepared?.scene ?? editor.scene,
    size = STUDIO_FORMATS[scene.format],
    ready = Boolean(prepared) && !output.busy,
    canPlace = Boolean(
      prepared &&
      !prepared.version.is_preparation &&
      !readOnly &&
      summary?.publishEnabled &&
      summary.permissions.includes("studio.publish"),
    );
  const tiles: StudioShareTileProps[] = [
    {
      icon: MessageCircle,
      tone: "success",
      title: "WhatsApp",
      detail: "Imagen y mensaje listos para enviar",
      onClick: () => void output.shareWhatsapp(),
    },
    {
      icon: Share2,
      title: "Redes",
      detail: "Instagram, Facebook y más",
      onClick: () => void output.share(),
    },
    {
      icon: Download,
      title: "Descargar",
      detail: "Guarda la imagen en tu equipo",
      onClick: () => output.download(),
    },
    canPlace
      ? {
          icon: Globe,
          title: "Mi sitio",
          detail: "Portada de tu tienda o mesas QR",
          onClick: () => setPlacementOpen(true),
        }
      : {
          icon: Copy,
          title: "Copiar",
          detail: "Solo el mensaje y el enlace",
          onClick: () => void output.copyText(),
        },
  ];
  return (
    <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,420px)]">
      <section className="overflow-hidden rounded-2xl border border-border bg-surface lg:sticky lg:top-4">
        <div className="flex justify-center bg-border-soft/50 p-4">
          {prepared ? (
            <Image
              src={prepared.url}
              alt={`Vista final de ${editor.title}`}
              width={size.width}
              height={size.height}
              unoptimized
              className="h-auto max-h-[45vh] w-auto max-w-full rounded-lg object-contain shadow-sm"
            />
          ) : output.busy ? (
            <Skeleton className="aspect-square w-full max-w-xs rounded-lg" />
          ) : (
            <p className="py-10 text-sm text-muted-foreground">
              Consulta abajo tus archivos guardados.
            </p>
          )}
        </div>
        <div className="flex items-center justify-between gap-3 p-4">
          <div className="min-w-0">
            <p className="truncate font-bold">
              {studioTemplate(scene.template).name} · {size.channel}
            </p>
            <p className="text-xs text-muted-foreground">
              {prepared
                ? "Imagen lista en alta calidad"
                : output.busy
                  ? "Preparando tu imagen…"
                  : "Sin imagen preparada"}
            </p>
          </div>
          {!readOnly && (
            <button
              type="button"
              className={adminActionButtonText}
              onClick={onBack}
            >
              <Pencil className="h-4 w-4" />
              Cambiar
            </button>
          )}
        </div>
        {prepared?.version.is_preparation && (
          <div className="px-4 pb-4">
            <Notification
              tone="warning"
              message="Material de preparación. No se puede publicar como oferta activa."
            />
          </div>
        )}
      </section>
      <div className="space-y-5">
        {!readOnly && (
          <>
            <section className="space-y-3">
              <h2 className="text-lg font-bold">¿Dónde lo compartes?</h2>
              <div className="grid grid-cols-2 gap-3">
                {tiles.map((tile) => (
                  <StudioShareTile
                    key={tile.title}
                    {...tile}
                    disabled={!ready}
                  />
                ))}
              </div>
            </section>
            <section className="space-y-3 rounded-2xl border border-border bg-surface p-4">
              <h3 className="text-sm font-bold">Mensaje que lo acompaña</h3>
              <div className="space-y-1 rounded-xl bg-border-soft/60 p-3 text-sm leading-6">
                <p className="whitespace-pre-line wrap-break-word">
                  {editor.copy || "Escribe el mensaje que va con tu imagen."}
                </p>
                {editor.destination && (
                  <p className="break-all font-semibold text-accent">
                    {editor.destination}
                  </p>
                )}
              </div>
              <div className={actionPair}>
                <button
                  type="button"
                  className={adminActionButtonSecondary}
                  onClick={() => setMessageOpen(true)}
                >
                  <Pencil className="h-4 w-4" />
                  Editar
                </button>
                <button
                  type="button"
                  className={adminActionButtonSecondary}
                  onClick={() => void output.copyText()}
                >
                  <Copy className="h-4 w-4" />
                  Copiar
                </button>
              </div>
            </section>
          </>
        )}
        {readOnly && Boolean(saved.data?.length) && (
          <section className="space-y-3">
            <h2 className="text-lg font-bold">Tus archivos</h2>
            <div className={actionStack}>
              {saved.data?.map((render) => (
                <a
                  key={render.id}
                  className={adminActionButtonSecondary}
                  href={render.url}
                  download={`${editor.title}.png`}
                >
                  <Download className="h-4 w-4" />
                  {STUDIO_FORMATS[render.format]?.channel ?? "Descargar"}
                </a>
              ))}
            </div>
          </section>
        )}
        {output.error && <Notification tone="error" message={output.error} />}
        <div className={actionPair}>
          <button
            type="button"
            className={adminActionButtonSecondary}
            onClick={onBack}
          >
            <ArrowLeft className="h-4 w-4" />
            Atrás
          </button>
          <Link
            href={`/dashboard/${tenantSlug}/studio/nuevo`}
            className={adminActionButtonPrimary}
          >
            <Plus className="h-4 w-4" />
            Nuevo
          </Link>
        </div>
      </div>
      <FormSheet
        isOpen={messageOpen}
        onClose={() => setMessageOpen(false)}
        title="Mensaje que lo acompaña"
        icon={MessageCircle}
        footer={
          <button
            type="button"
            className={`${adminActionButtonPrimary} w-full`}
            onClick={() => setMessageOpen(false)}
          >
            <Check className="h-4 w-4" />
            Listo
          </button>
        }
      >
        <div className="space-y-4 pb-3">
          <FormTextarea
            label="Mensaje"
            maxLength={1000}
            value={editor.copy}
            onChange={(e) => editor.setCopy(e.target.value)}
          />
          <FormInput
            label="Enlace"
            value={editor.destination}
            onChange={(e) => editor.setDestination(e.target.value)}
          />
          <p className="text-xs leading-5 text-muted-foreground">
            El enlace va al final del mensaje. Por defecto lleva a tu tienda.
          </p>
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
          onSuccess={output.setSuccess}
        />
      )}
    </div>
  );
}
