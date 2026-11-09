"use client";
import dynamic from "next/dynamic";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  Download,
  ImagePlus,
  Redo2,
  Undo2,
  Type,
  Square,
  QrCode,
  Trash2,
  Copy,
} from "lucide-react";
import { PageHeader } from "@/components/admin/PageHeader";
import { Notification } from "@/components/ui/Notification";
import { Skeleton } from "@/components/ui/Skeleton";
import {
  adminActionButtonIcon,
  adminActionButtonPrimary,
  adminActionButtonSecondary,
} from "@/components/admin/actionButtonClasses";
import { STUDIO_EXAMPLES } from "../../constants/marketing";
import { STUDIO_FORMATS, STUDIO_TEMPLATES } from "../../constants/studio";
import { useStudioLab } from "../../hooks/useStudioLab";
import { StudioOptions } from "../StudioOptions";
import { StudioLayerPanel } from "./StudioLayerPanel";
import { StudioPropertiesPanel } from "./StudioPropertiesPanel";
import type { StudioFormat } from "../../interfaces/scene";

const StudioCanvas = dynamic(() => import("./StudioCanvas"), {
  ssr: false,
  loading: () => <Skeleton className="aspect-square w-full rounded-xl" />,
});

export default function StudioLabWorkspace() {
  const lab = useStudioLab();
  return (
    <div className="space-y-5 pb-10">
      <PageHeader
        title="Laboratorio de Tlaco Studio"
        description="Prueba el lienzo, las capas, las plantillas y la exportación con contenido ilustrativo."
        action={
          <Link
            href="/dashboard/plataforma/studio"
            className={adminActionButtonSecondary}
          >
            <ArrowLeft className="h-4 w-4" /> Operación Studio
          </Link>
        }
      />
      <Notification
        tone="info"
        message="Acceso exclusivo de superadministrador. Los cambios viven en esta pestaña y el PNG lleva la marca BORRADOR. Esta prueba no crea negocios, membresías ni cargos."
      />
      <div className="grid gap-5 xl:grid-cols-[235px_minmax(0,1fr)_260px]">
        <aside className="order-2 space-y-5 rounded-2xl border border-border bg-surface p-4 xl:order-1">
          <div>
            <h2 className="text-sm font-bold">
              1. Elige un negocio de ejemplo
            </h2>
            <div className="relative mt-3 aspect-[4/3] overflow-hidden rounded-xl">
              <Image
                src={STUDIO_EXAMPLES[lab.example].image}
                alt={STUDIO_EXAMPLES[lab.example].alt}
                fill
                sizes="235px"
                className="object-cover"
              />
            </div>
            <label
              className="mt-3 block text-xs font-semibold"
              htmlFor="studio-lab-example"
            >
              Giro ilustrativo
            </label>
            <select
              id="studio-lab-example"
              value={lab.example}
              onChange={(event) =>
                lab.chooseExample(Number(event.target.value))
              }
              className="mt-2 min-h-11 w-full rounded-xl border border-border bg-background px-3 text-sm"
            >
              {STUDIO_EXAMPLES.map((item, i) => (
                <option key={item.id} value={i}>
                  {item.sector} · {item.category}
                </option>
              ))}
            </select>
          </div>
          <div>
            <h2 className="text-sm font-bold">Plantillas</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {STUDIO_TEMPLATES.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => lab.template(item.id)}
                  className={adminActionButtonSecondary}
                >
                  {item.name}
                </button>
              ))}
            </div>
          </div>
          <div>
            <h2 className="text-sm font-bold">Añade una capa</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => lab.add("text")}
                className={adminActionButtonSecondary}
              >
                <Type className="h-4 w-4" /> Texto
              </button>
              <button
                type="button"
                onClick={() => lab.add("shape")}
                className={adminActionButtonSecondary}
              >
                <Square className="h-4 w-4" /> Figura
              </button>
              <button
                type="button"
                onClick={() => lab.add("qr")}
                className={adminActionButtonSecondary}
              >
                <QrCode className="h-4 w-4" /> QR
              </button>
            </div>
          </div>
          <StudioLayerPanel
            nodes={lab.scene.nodes}
            selectedId={lab.selectedId}
            readOnly={lab.busy}
            onSelect={lab.setSelectedId}
            onChange={lab.updateNode}
            onMove={lab.move}
            onDelete={lab.remove}
            onDuplicate={lab.duplicate}
          />
        </aside>
        <div className="order-1 min-w-0 space-y-4 xl:order-2">
          <div className="rounded-2xl border border-border bg-surface p-4">
            <StudioOptions
              label="2. Ajusta el formato"
              value={lab.scene.format}
              options={Object.entries(STUDIO_FORMATS).map(([value, item]) => ({
                value: value as StudioFormat,
                label: item.label,
              }))}
              onChange={lab.format}
              disabled={lab.busy}
            />
            <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-border pt-4">
              <button
                type="button"
                className={adminActionButtonIcon}
                aria-label="Deshacer"
                onClick={lab.undo}
                disabled={!lab.canUndo || lab.busy}
              >
                <Undo2 className="h-4 w-4" />
              </button>
              <button
                type="button"
                className={adminActionButtonIcon}
                aria-label="Rehacer"
                onClick={lab.redo}
                disabled={!lab.canRedo || lab.busy}
              >
                <Redo2 className="h-4 w-4" />
              </button>
              <button
                type="button"
                className={adminActionButtonSecondary}
                onClick={lab.duplicate}
                disabled={!lab.selected || lab.busy}
              >
                <Copy className="h-4 w-4" /> Duplicar
              </button>
              <button
                type="button"
                className={adminActionButtonSecondary}
                onClick={lab.remove}
                disabled={!lab.selected || lab.busy}
              >
                <Trash2 className="h-4 w-4" /> Eliminar
              </button>
            </div>
          </div>
          <div className="min-w-0 rounded-2xl border border-border bg-surface p-2 sm:p-5">
            <StudioCanvas
              scene={lab.scene}
              selectedId={lab.selectedId}
              assets={[]}
              tenantId=""
              readOnly={lab.busy}
              onSelect={lab.setSelectedId}
              onChange={lab.updateNode}
            />
          </div>
          {lab.error && <Notification tone="error" message={lab.error} />}
          <button
            type="button"
            className={adminActionButtonPrimary}
            disabled={lab.busy}
            onClick={() => void lab.download()}
          >
            <Download className="h-4 w-4" />
            {lab.busy ? "Preparando PNG…" : "3. Descargar PNG de prueba"}
          </button>
          <p className="text-xs text-muted-foreground">
            El diseño se pierde al cerrar esta pestaña. Para probar guardado, IA
            o colocaciones, usa un negocio piloto después de configurar
            Supabase.
          </p>
        </div>
        <aside className="order-3 space-y-4 rounded-2xl border border-border bg-surface p-4">
          <h2 className="text-sm font-bold">Propiedades</h2>
          <StudioPropertiesPanel
            node={lab.selected}
            readOnly={lab.busy}
            onChange={lab.updateNode}
          />
          <p className="border-t border-border pt-4 text-xs leading-5 text-muted-foreground">
            <ImagePlus className="mr-1 inline h-4 w-4" aria-hidden />
            Arrastra o ajusta capas en el lienzo. El precio de ejemplo permanece
            vinculado a su fuente ilustrativa; cambia el giro para probar otro.
          </p>
        </aside>
      </div>
    </div>
  );
}
