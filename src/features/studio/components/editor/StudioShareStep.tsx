"use client";
import { useState } from "react";
import Image from "next/image";
import useSWR from "swr";
import {
  ArrowLeft,
  Copy,
  Download,
  Globe,
  MessageCircle,
  Share2,
} from "lucide-react";
import { FormInput } from "@/components/ui/FormInput";
import { Notification } from "@/components/ui/Notification";
import { FormSheet } from "@/components/ui/FormSheet";
import {
  adminActionButtonPrimary,
  adminActionButtonSecondary,
} from "@/components/admin/actionButtonClasses";
import { loadRenders } from "../../services/studioClientService";
import { STUDIO_FORMATS } from "../../constants/studio";
import { useStudioContext } from "../StudioProvider";
import { StudioPlacementSheet } from "./StudioPlacementSheet";
import type { useStudioOutput } from "../../hooks/useStudioOutput";
import type { StudioAsset } from "../../interfaces/studio";

export function StudioShareStep({
  output,
  title,
  copy,
  setCopy,
  destination,
  setDestination,
  assets,
  designId,
  readOnly,
  onBack,
}: {
  output: ReturnType<typeof useStudioOutput>;
  title: string;
  copy: string;
  setCopy: (value: string) => void;
  destination: string;
  setDestination: (value: string) => void;
  assets: StudioAsset[];
  designId: string;
  readOnly: boolean;
  onBack: () => void;
}) {
  const { tenantId, summary } = useStudioContext(),
    [placementOpen, setPlacementOpen] = useState(false);
  const saved = useSWR(
    readOnly ? ["studio-renders", tenantId, designId] : null,
    () => loadRenders(tenantId, designId),
  );
  const prepared = output.output;
  return (
    <div className="space-y-5">
      <div className="grid gap-5 lg:grid-cols-[1fr_1fr]">
        <section className="rounded-2xl border border-border bg-surface p-4">
          {prepared ? (
            <>
              <p className="mb-3 text-sm font-bold">
                {STUDIO_FORMATS[prepared.scene.format].label}
              </p>
              <Image
                src={prepared.url}
                alt={`Vista final de ${title}`}
                width={STUDIO_FORMATS[prepared.scene.format].width}
                height={STUDIO_FORMATS[prepared.scene.format].height}
                unoptimized
                className="mx-auto h-auto max-h-[65vh] w-auto max-w-full object-contain"
              />
            </>
          ) : (
            <p className="text-sm text-muted-foreground">
              Consulta tus exportaciones guardadas.
            </p>
          )}
          {prepared?.version.is_preparation && (
            <Notification
              tone="warning"
              className="mt-4"
              message="Material de preparación. No se puede publicar como oferta activa."
            />
          )}
        </section>
        <section className="space-y-4">
          <h2 className="text-lg font-bold">Revisa el texto y el destino</h2>
          <FormInput
            label="Texto para acompañar tu anuncio"
            value={copy}
            onChange={(e) => setCopy(e.target.value)}
            disabled={readOnly}
          />
          <FormInput
            label="Enlace de destino"
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
            disabled={readOnly}
          />
          <p className="text-xs leading-5 text-muted-foreground">
            Para corregir fotos, precio o composición, regresa al paso 2.
            Ajustar y exportar consume 0 Tlacos.
          </p>
          {output.error && <Notification tone="error" message={output.error} />}
          <div className="flex flex-wrap gap-2">
            {prepared && (
              <>
                <button
                  className={adminActionButtonPrimary}
                  onClick={output.download}
                >
                  <Download className="h-4 w-4" />
                  Descargar PNG
                </button>
                <button
                  className={adminActionButtonSecondary}
                  onClick={() => void output.share()}
                >
                  <Share2 className="h-4 w-4" />
                  Compartir archivo
                </button>
                <button
                  className={adminActionButtonSecondary}
                  onClick={() => void output.copyText()}
                >
                  <Copy className="h-4 w-4" />
                  Copiar texto
                </button>
                <a
                  className={adminActionButtonSecondary}
                  href={output.whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={output.recordWhatsapp}
                >
                  <MessageCircle className="h-4 w-4" />
                  WhatsApp: texto y enlace
                </a>
              </>
            )}
            {readOnly &&
              saved.data?.map((render) => (
                <a
                  key={render.id}
                  className={adminActionButtonSecondary}
                  href={render.url}
                  download={`${title}.png`}
                >
                  <Download className="h-4 w-4" />
                  Descargar {STUDIO_FORMATS[render.format]?.label}
                </a>
              ))}
          </div>
          <p className="text-xs leading-5 text-muted-foreground">
            Compartir no confirma una publicación en redes. El enlace de
            WhatsApp prepara texto y URL; adjunta el PNG manualmente si no lo
            compartiste como archivo.
          </p>
          {prepared &&
            !prepared.version.is_preparation &&
            !readOnly &&
            summary?.publishEnabled &&
            summary.permissions.includes("studio.publish") && (
              <button
                className={adminActionButtonSecondary}
                onClick={() => setPlacementOpen(true)}
              >
                <Globe className="h-4 w-4" />
                Aplicar al sitio o mesas
              </button>
            )}
        </section>
      </div>
      <button className={adminActionButtonSecondary} onClick={onBack}>
        <ArrowLeft className="h-4 w-4" />
        Volver al diseño
      </button>
      <FormSheet
        isOpen={Boolean(output.success)}
        onClose={() => output.setSuccess(null)}
        title="Tu diseño está listo"
        description={output.success ?? ""}
      >
        <div className="space-y-4 pb-3">
          <p className="text-sm leading-6 text-muted-foreground">
            Puedes conservarlo solo para redes o elegir dónde mostrarlo dentro
            de Tlaco.
          </p>
          <button
            className={adminActionButtonSecondary}
            onClick={() => output.setSuccess(null)}
          >
            <Share2 className="h-4 w-4" />
            Solo redes
          </button>
          {prepared &&
            !prepared.version.is_preparation &&
            !readOnly &&
            summary?.publishEnabled &&
            summary.permissions.includes("studio.publish") && (
              <button
                className={adminActionButtonPrimary}
                onClick={() => {
                  output.setSuccess(null);
                  setPlacementOpen(true);
                }}
              >
                <Globe className="h-4 w-4" />
                Elegir sitio / mesas
              </button>
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
          title={title}
          destination={destination}
          onSuccess={output.setSuccess}
        />
      )}
    </div>
  );
}
