"use client";
import { useState } from "react";
import dynamic from "next/dynamic";
import {
  Check,
  ImagePlus,
  Images,
  Layers,
  Palette,
  QrCode,
  Redo2,
  Save,
  Sparkles,
  Square,
  Type,
  Undo2,
  Upload,
} from "lucide-react";
import { useStudioContext } from "../StudioProvider";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { FormInput } from "@/components/ui/FormInput";
import { FormSheet } from "@/components/ui/FormSheet";
import { Skeleton } from "@/components/ui/Skeleton";
import { StudioAiReviewPanel } from "./StudioAiReviewPanel";
import { StudioAssetPicker } from "./StudioAssetPicker";
import { StudioLayerPanel } from "./StudioLayerPanel";
import { StudioPropertiesPanel } from "./StudioPropertiesPanel";
import {
  actionPair,
  adminActionButtonAi,
  adminActionButtonIcon,
  adminActionButtonPrimary,
  adminActionButtonSecondary,
} from "@/components/admin/actionButtonClasses";
import { applyStudioFinding } from "../../helpers/scene";
import type { StudioAdvancedEditorProps } from "../../interfaces/ui";

const StudioCanvas = dynamic(() => import("./StudioCanvas"), {
  ssr: false,
  loading: () => <Skeleton className="aspect-square w-full rounded-xl" />,
});
const ACCEPT = "image/jpeg,image/png,image/webp";
type Panel = "properties" | "layers" | "assets" | null;

export function StudioAdvancedEditor({
  editor,
  asset,
  ai,
  tenantId,
  locked,
  detail,
  output,
  onRefresh,
}: StudioAdvancedEditorProps) {
  const { summary } = useStudioContext(),
    [panel, setPanel] = useState<Panel>(null),
    [restoreId, setRestoreId] = useState<string | null>(null),
    image =
      editor.selected?.kind === "image"
        ? editor.selected
        : editor.scene.nodes.find((n) => n.kind === "image");
  const tool =
    "flex min-h-16 cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border border-border bg-surface px-1 py-2 text-xs font-semibold transition-colors hover:bg-border-soft/60 disabled:cursor-not-allowed disabled:opacity-60";
  const uploadTool = (kind: "image" | "logo", label: string) => (
    <label
      className={`${tool} ${locked ? "pointer-events-none opacity-60" : ""}`}
    >
      {kind === "logo" ? (
        <ImagePlus className="h-5 w-5" aria-hidden />
      ) : (
        <Upload className="h-5 w-5" aria-hidden />
      )}
      {label}
      <input
        className="sr-only"
        aria-label={kind === "logo" ? "Subir logo" : "Subir foto"}
        type="file"
        accept={ACCEPT}
        disabled={locked}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void asset.upload(file, kind);
          e.target.value = "";
        }}
      />
    </label>
  );
  const properties = (
    <StudioPropertiesPanel
      node={editor.selected}
      readOnly={locked}
      onChange={editor.updateNode}
    />
  );
  const layers = (
    <StudioLayerPanel
      nodes={editor.scene.nodes}
      selectedId={editor.selectedId}
      readOnly={locked}
      onSelect={editor.setSelectedId}
      onChange={editor.updateNode}
      onMove={editor.moveLayer}
      onDelete={editor.deleteNode}
      onDuplicate={editor.duplicateNode}
    />
  );
  return (
    <div className="space-y-4">
      <div className="flex items-end gap-2">
        <div className="min-w-0 flex-1">
          <FormInput
            label="Nombre del diseño"
            value={editor.title}
            maxLength={120}
            disabled={locked}
            onChange={(e) => editor.setTitle(e.target.value)}
          />
        </div>
        <button
          className={adminActionButtonIcon}
          aria-label="Deshacer"
          onClick={editor.undo}
          disabled={locked || !editor.canUndo}
        >
          <Undo2 className="h-4 w-4" />
        </button>
        <button
          className={adminActionButtonIcon}
          aria-label="Rehacer"
          onClick={editor.redo}
          disabled={locked || !editor.canRedo}
        >
          <Redo2 className="h-4 w-4" />
        </button>
      </div>
      <div className="grid items-start gap-4 xl:grid-cols-[220px_minmax(0,1fr)_260px]">
        <aside className="order-2 space-y-4 rounded-2xl border border-border bg-surface p-4 xl:order-1">
          <h2 className="text-sm font-bold">Agregar</h2>
          <div className="grid grid-cols-3 gap-2">
            {[
              { kind: "text" as const, label: "Texto", Icon: Type },
              { kind: "shape" as const, label: "Figura", Icon: Square },
              { kind: "qr" as const, label: "QR", Icon: QrCode },
            ].map(({ kind, label, Icon }) => (
              <button
                key={kind}
                type="button"
                className={tool}
                disabled={locked}
                onClick={() => editor.addNode(kind)}
              >
                <Icon className="h-5 w-5" aria-hidden />
                {label}
              </button>
            ))}
            {uploadTool("image", "Foto")}
            {uploadTool("logo", "Logo")}
            <button
              type="button"
              className={tool}
              disabled={locked}
              onClick={() => setPanel("assets")}
            >
              <Images className="h-5 w-5" aria-hidden />
              Galería
            </button>
          </div>
          <FormInput
            label="Fondo del lienzo"
            type="color"
            value={editor.scene.background}
            disabled={locked}
            onChange={(e) =>
              editor.setScene({ ...editor.scene, background: e.target.value })
            }
          />
          {summary?.aiEnabled && (
            <button
              type="button"
              className={`${adminActionButtonAi} w-full`}
              disabled={locked || !image || !summary.balance.available}
              onClick={() => ai.setOpen(true)}
            >
              <Sparkles className="h-4 w-4" />
              Mejorar
            </button>
          )}
          <div className="hidden xl:block">{layers}</div>
        </aside>
        <main className="order-1 min-w-0 rounded-2xl border border-border bg-border-soft/40 p-3 sm:p-5 xl:order-2">
          <StudioCanvas
            scene={editor.scene}
            selectedId={editor.selectedId}
            assets={asset.assets}
            tenantId={tenantId}
            readOnly={locked}
            onSelect={editor.setSelectedId}
            onChange={editor.updateNode}
          />
          <div className={`mt-3 xl:hidden ${actionPair}`}>
            <button
              type="button"
              className={adminActionButtonSecondary}
              onClick={() => setPanel("layers")}
            >
              <Layers className="h-4 w-4" />
              Capas
            </button>
            <button
              type="button"
              className={adminActionButtonSecondary}
              onClick={() => setPanel("properties")}
            >
              <Palette className="h-4 w-4" />
              Estilo
            </button>
          </div>
          <p className="mt-3 text-center text-xs text-muted-foreground">
            Línea punteada: área segura. Toca una pieza para moverla o cambiar
            su tamaño.
          </p>
        </main>
        <aside className="hidden space-y-5 rounded-2xl border border-border bg-surface p-4 xl:order-3 xl:block">
          {properties}
        </aside>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-2xl border border-border bg-surface p-4">
          <StudioAiReviewPanel
            scene={editor.scene}
            tenantId={tenantId}
            enabled={Boolean(summary?.aiEnabled && editor.canEdit)}
            disabled={locked}
            prepareVersion={async () => (await output.prepare()).version.id}
            onApply={(finding) =>
              editor.setScene(applyStudioFinding(editor.scene, finding))
            }
          />
        </section>
        <section className="space-y-3 rounded-2xl border border-border bg-surface p-4">
          <h3 className="text-sm font-bold">Versiones guardadas</h3>
          <button
            type="button"
            className={`${adminActionButtonSecondary} w-full sm:w-auto`}
            disabled={locked}
            onClick={() =>
              void output
                .prepare()
                .then(() => onRefresh())
                .catch(() => {})
            }
          >
            <Save className="h-4 w-4" />
            Guardar
          </button>
          {detail.versions.length ? (
            detail.versions.map((version) => (
              <div
                key={version.id}
                className="flex items-center justify-between gap-3 text-sm"
              >
                <span>
                  Versión {version.version} ·{" "}
                  {new Date(version.created_at).toLocaleDateString("es-MX")}
                </span>
                <button
                  type="button"
                  className={adminActionButtonSecondary}
                  disabled={locked}
                  onClick={() => setRestoreId(version.id)}
                >
                  <Undo2 className="h-4 w-4" />
                  Recuperar
                </button>
              </div>
            ))
          ) : (
            <p className="text-xs leading-5 text-muted-foreground">
              Las versiones se crean al guardar o al compartir. Tu borrador se
              guarda solo.
            </p>
          )}
        </section>
      </div>
      <FormSheet
        isOpen={Boolean(panel)}
        onClose={() => setPanel(null)}
        title={
          panel === "layers"
            ? "Capas del diseño"
            : panel === "assets"
              ? "Fotos guardadas"
              : "Estilo"
        }
        footer={
          <button
            type="button"
            className={`${adminActionButtonPrimary} w-full`}
            onClick={() => setPanel(null)}
          >
            <Check className="h-4 w-4" />
            Listo
          </button>
        }
      >
        <div className="pb-3">
          {panel === "layers" ? (
            layers
          ) : panel === "assets" ? (
            <StudioAssetPicker
              assets={asset.assets}
              disabled={locked}
              onSelect={(id) => {
                asset.select(id, image?.id);
                setPanel(null);
              }}
            />
          ) : (
            properties
          )}
        </div>
      </FormSheet>
      <ConfirmDialog
        isOpen={Boolean(restoreId)}
        onClose={() => setRestoreId(null)}
        title="Recuperar esta composición"
        description="El borrador actual quedará disponible con Deshacer. Revisa los datos del catálogo antes de compartir."
        onConfirm={() => {
          const version = detail.versions.find((v) => v.id === restoreId);
          if (version) editor.setScene(version.scene_json);
          setRestoreId(null);
        }}
        confirmLabel="Recuperar"
      />
    </div>
  );
}
