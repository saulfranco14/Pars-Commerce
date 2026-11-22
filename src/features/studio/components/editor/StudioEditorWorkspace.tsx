"use client";
import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  ImagePlus,
  Layers,
  Palette,
  QrCode,
  Redo2,
  Save,
  Sparkles,
  Square,
  Type,
  Undo2,
  X,
} from "lucide-react";
import { PageHeader } from "@/components/admin/PageHeader";
import { FormInput } from "@/components/ui/FormInput";
import { FormSheet } from "@/components/ui/FormSheet";
import { Notification } from "@/components/ui/Notification";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Skeleton } from "@/components/ui/Skeleton";
import {
  adminActionButtonAi,
  adminActionButtonIcon,
  adminActionButtonPrimary,
  adminActionButtonSecondary,
} from "@/components/admin/actionButtonClasses";
import { STUDIO_FORMATS, STUDIO_TEMPLATES } from "../../constants/studio";
import { applyStudioFinding } from "../../helpers/scene";
import { studioImageUrl } from "../../helpers/canvas";
import { useStudioEditor } from "../../hooks/useStudioEditor";
import { useStudioAssets } from "../../hooks/useStudioAssets";
import { useStudioOutput } from "../../hooks/useStudioOutput";
import { useStudioAi } from "../../hooks/useStudioAi";
import { useStudioContext } from "../StudioProvider";
import { StudioMembershipSheet } from "../StudioMembershipSheet";
import { StudioOptions } from "../StudioOptions";
import { StudioWizardProgress } from "../StudioWizardProgress";
import { StudioPropertiesPanel } from "./StudioPropertiesPanel";
import { StudioSourceSummary } from "./StudioSourceSummary";
import { StudioAssetPicker } from "./StudioAssetPicker";
import { StudioLayerPanel } from "./StudioLayerPanel";
import { StudioGenerationSheet } from "./StudioGenerationSheet";
import { StudioVariantCompare } from "./StudioVariantCompare";
import { StudioAiReviewPanel } from "./StudioAiReviewPanel";
import { StudioShareStep } from "./StudioShareStep";
import type { StudioEditorProps } from "../../interfaces/ui";
import type { StudioFormat } from "../../interfaces/scene";

const StudioCanvas = dynamic(() => import("./StudioCanvas"), {
  ssr: false,
  loading: () => <Skeleton className="aspect-square w-full rounded-xl" />,
});

export default function StudioEditorWorkspace({
  detail,
  onRefresh,
  initialReview = false,
}: StudioEditorProps) {
  const { tenantId, tenantSlug, summary } = useStudioContext(),
    editor = useStudioEditor(detail),
    asset = useStudioAssets(detail, editor.scene, editor.setScene),
    [step, setStep] = useState(2),
    [panel, setPanel] = useState<"properties" | "layers" | "assets" | null>(
      null,
    ),
    [restoreId, setRestoreId] = useState<string | null>(null),
    [discardOpen, setDiscardOpen] = useState(false),
    [membershipOpen, setMembershipOpen] = useState(false),
    [ignoredVariant, setIgnoredVariant] = useState<string | null>(null);
  const output = useStudioOutput({
    tenantId,
    designId: detail.design.id,
    scene: editor.scene,
    assets: asset.assets,
    revision: editor.revision,
    saveNow: editor.saveNow,
    title: editor.title,
    copy: editor.copy,
    destination: editor.destination,
  });
  const quickStarted = useRef(false);
  useEffect(() => {
    if (initialReview && editor.canEdit && !quickStarted.current) {
      quickStarted.current = true;
      void output
        .prepare()
        .then(() => setStep(3))
        .catch(() => {});
    }
  }, [initialReview, editor.canEdit, output]);
  const image =
    editor.selected?.kind === "image"
      ? editor.selected
      : editor.scene.nodes.find((n) => n.kind === "image");
  const ai = useStudioAi({
    tenantId,
    designId: detail.design.id,
    image,
    ensureAsset: asset.ensureAsset,
    available: summary?.balance.available ?? 0,
  });
  const generationImage = ai.inputImage ?? image;
  const locked = !editor.canEdit || output.busy || asset.busy || editor.copying;
  editor.interactionLock.current = output.busy || asset.busy || editor.copying;
  const variant =
    ai.job?.status === "succeeded" ? ai.job.result_asset_id : null;
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
  async function review() {
    const prepared = await output.prepare();
    return prepared.version.id;
  }
  async function next() {
    if (!editor.canEdit) {
      setStep(3);
      return;
    }
    try {
      await output.prepare();
      setStep(3);
    } catch {
      /* Error is displayed by the output hook. */
    }
  }
  return (
    <div className="space-y-4">
      <PageHeader
        title={editor.title}
        description={
          editor.canEdit
            ? "Ajusta la composición sin gastar Tlacos. Tu catálogo conserva sus precios originales."
            : summary?.permissions.includes("studio.create")
              ? "Consulta tu diseño y descarga los archivos guardados. La edición requiere Studio vigente y disponible."
              : "Consulta el diseño y sus descargas. El propietario puede asignarte permiso para editar."
        }
        action={
          <Link
            className={adminActionButtonSecondary}
            href={`/dashboard/${tenantSlug}/studio/disenos`}
            onClick={(e) => {
              if (editor.saveState !== "saved") {
                e.preventDefault();
                setDiscardOpen(true);
              }
            }}
          >
            <ArrowLeft className="h-4 w-4" />
            Biblioteca
          </Link>
        }
      />
      <StudioWizardProgress step={step} />
      <StudioSourceSummary
        source={editor.source.current}
        tenantSlug={tenantSlug}
      />
      {summary &&
        !summary.active &&
        summary.permissions.includes("studio.create") &&
        (summary.freeExportDesignId &&
        summary.freeExportDesignId !== detail.design.id ? (
          <Notification
            tone="info"
            message={
              <div className="space-y-3">
                <p>
                  Puedes seguir diseñando sin límite. Ya usaste tu descarga
                  gratis con otro anuncio; para descargar o compartir este,
                  activa tu membresía.
                </p>
                <button
                  className={`${adminActionButtonSecondary} w-full sm:w-auto`}
                  onClick={() => setMembershipOpen(true)}
                >
                  <Sparkles className="h-4 w-4" />
                  Ver membresías Studio
                </button>
              </div>
            }
          />
        ) : (
          <Notification
            tone="success"
            message="Este anuncio lo descargas y compartes gratis. Es tu regalo de bienvenida."
          />
        ))}
      {editor.conflict && (
        <Notification
          tone="warning"
          title="Hay cambios en otra pestaña"
          message={
            <div className="flex flex-wrap gap-3">
              <button
                className={adminActionButtonSecondary}
                onClick={editor.reloadFromServer}
              >
                <Redo2 className="h-4 w-4" />
                Recargar del servidor
              </button>
              <button
                className={adminActionButtonSecondary}
                disabled={locked}
                onClick={() =>
                  void editor.saveAsCopy().then((id) => {
                    if (id)
                      window.location.assign(
                        `/dashboard/${tenantSlug}/studio/disenos/${id}`,
                      );
                  })
                }
              >
                <Save className="h-4 w-4" />
                {editor.copying ? "Conservando copia…" : "Conservar como copia"}
              </button>
            </div>
          }
        />
      )}
      {detail.stale && (
        <Notification
          tone="warning"
          title="El catálogo cambió"
          message={
            <>
              <p>
                Revisa precios, vigencia y fotografías antes de compartir. La
                versión anterior se conserva.
              </p>
              {editor.canEdit && (
                <button
                  className={`${adminActionButtonSecondary} mt-2`}
                  onClick={() =>
                    void editor
                      .refreshSource()
                      .then(() => onRefresh())
                      .catch((e) => editor.setError(e.message))
                  }
                >
                  <ArrowRight className="h-4 w-4" />
                  Actualizar desde catálogo
                </button>
              )}
            </>
          }
        />
      )}
      {editor.recovery && (
        <Notification
          tone="info"
          message={
            <div className="flex flex-wrap items-center gap-3">
              <span>Encontramos una composición local sin guardar.</span>
              <button
                className={adminActionButtonSecondary}
                disabled={locked}
                onClick={editor.recover}
              >
                <Undo2 className="h-4 w-4" />
                Recuperar composición
              </button>
              <button
                className={adminActionButtonIcon}
                aria-label="Descartar recuperación"
                onClick={editor.dismissRecovery}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          }
        />
      )}
      {[editor.error, asset.error, output.error, ai.error]
        .filter(Boolean)
        .map((error, i) => (
          <Notification key={`${i}:${error}`} tone="error" message={error} />
        ))}
      {step === 3 ? (
        <StudioShareStep
          output={output}
          title={editor.title}
          copy={editor.copy}
          setCopy={editor.setCopy}
          destination={editor.destination}
          setDestination={editor.setDestination}
          assets={asset.assets}
          designId={detail.design.id}
          readOnly={!editor.canEdit}
          onBack={() => setStep(2)}
        />
      ) : (
        <>
          <div className="flex flex-wrap items-end gap-3">
            <div className="min-w-40 flex-1">
              <FormInput
                label="Nombre del diseño"
                value={editor.title}
                maxLength={120}
                disabled={locked}
                onChange={(e) => editor.setTitle(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
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
          </div>
          <StudioOptions
            label="Formato del anuncio"
            value={editor.scene.format}
            options={Object.entries(STUDIO_FORMATS).map(([value, f]) => ({
              value: value as StudioFormat,
              label: f.label,
            }))}
            onChange={editor.setFormat}
            disabled={locked}
          />
          <div className="grid items-start gap-4 xl:grid-cols-[220px_minmax(0,1fr)_260px]">
            <aside className="order-2 space-y-5 rounded-2xl border border-border bg-surface p-4 xl:order-1">
              <h2 className="text-sm font-bold">Plantillas y contenido</h2>
              <div className="flex flex-wrap gap-2">
                {STUDIO_TEMPLATES.map((t) => (
                  <button
                    key={t.id}
                    className={adminActionButtonSecondary}
                    disabled={locked}
                    onClick={() => editor.template(t.id)}
                  >
                    <Palette className="h-4 w-4" />
                    {t.name}
                  </button>
                ))}
              </div>
              <div className="flex flex-wrap gap-2">
                {[
                  { kind: "text" as const, label: "Texto", Icon: Type },
                  { kind: "shape" as const, label: "Figura", Icon: Square },
                  { kind: "qr" as const, label: "QR", Icon: QrCode },
                ].map(({ kind, label, Icon }) => (
                  <button
                    key={kind}
                    className={adminActionButtonSecondary}
                    disabled={locked}
                    onClick={() => editor.addNode(kind)}
                  >
                    <Icon className="h-4 w-4" />
                    {label}
                  </button>
                ))}
              </div>
              <label
                className={`${adminActionButtonSecondary} ${locked ? "pointer-events-none opacity-50" : ""}`}
              >
                <ImagePlus className="h-4 w-4" />
                Subir fotografía
                <input
                  className="sr-only"
                  aria-label="Subir fotografía"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  disabled={locked}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) void asset.upload(file);
                    e.target.value = "";
                  }}
                />
              </label>
              <label
                className={`${adminActionButtonSecondary} ${locked ? "pointer-events-none opacity-50" : ""}`}
              >
                <ImagePlus className="h-4 w-4" />
                Subir logo
                <input
                  className="sr-only"
                  aria-label="Subir logo"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  disabled={locked}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) void asset.upload(file, "logo");
                    e.target.value = "";
                  }}
                />
              </label>
              <button
                className={adminActionButtonSecondary}
                disabled={locked}
                onClick={() => setPanel("assets")}
              >
                <ImagePlus className="h-4 w-4" />
                Mis imágenes
              </button>
              <FormInput
                label="Fondo del lienzo"
                type="color"
                value={editor.scene.background}
                disabled={locked}
                onChange={(e) =>
                  editor.setScene({
                    ...editor.scene,
                    background: e.target.value,
                  })
                }
              />
              <button
                className={adminActionButtonAi}
                disabled={
                  locked ||
                  !summary?.aiEnabled ||
                  !image ||
                  !summary.balance.available
                }
                onClick={() => ai.setOpen(true)}
              >
                <Sparkles className="h-4 w-4" />
                Nueva propuesta IA
              </button>
              {editor.canEdit && !summary?.balance.available && (
                <p className="text-xs leading-6 text-muted-foreground">
                  Puedes seguir editando sin Tlacos.{" "}
                  <Link
                    className="font-semibold text-accent underline"
                    href={`/dashboard/${tenantSlug}/studio/tlacos?return_to=${encodeURIComponent(`/dashboard/${tenantSlug}/studio/disenos/${detail.design.id}`)}`}
                  >
                    Recargar saldo
                  </Link>{" "}
                  para solicitar una propuesta de IA.
                </p>
              )}
              <p className="text-xs leading-5 text-muted-foreground">
                Foto intacta + plantilla: 0 Tlacos. Una generación requiere
                confirmación de costo.
              </p>
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
              <div className="mt-3 flex justify-center gap-2 xl:hidden">
                <button
                  className={adminActionButtonSecondary}
                  onClick={() => setPanel("layers")}
                >
                  <Layers className="h-4 w-4" />
                  Capas
                </button>
                <button
                  className={adminActionButtonSecondary}
                  onClick={() => setPanel("properties")}
                >
                  <Palette className="h-4 w-4" />
                  Propiedades
                </button>
              </div>
              <p className="mt-3 text-center text-xs text-muted-foreground">
                Línea punteada: área segura. Selecciona una capa para moverla o
                ajustar sus propiedades.
              </p>
            </main>
            <aside className="hidden space-y-5 rounded-2xl border border-border bg-surface p-4 xl:order-3 xl:block">
              {properties}
            </aside>
          </div>
          {ai.job && ["queued", "processing"].includes(ai.job.status) && (
            <Notification
              tone="info"
              message={
                <div className="flex flex-wrap items-center gap-3">
                  <span>
                    {ai.job.status === "queued"
                      ? "Tu propuesta está en cola"
                      : "La IA está preparando tu imagen"}
                    . Puedes seguir trabajando.
                  </span>
                  {ai.job.status === "queued" && (
                    <button
                      className={adminActionButtonSecondary}
                      onClick={() => void ai.cancel()}
                    >
                      <X className="h-4 w-4" />
                      Cancelar reserva
                    </button>
                  )}
                </div>
              }
            />
          )}
          {ai.job?.status === "failed" && (
            <Notification
              tone="warning"
              message="La propuesta no se completó. La reserva se liberó; tu fotografía y composición se conservan."
            />
          )}
          {variant && variant !== ignoredVariant && (
            <StudioVariantCompare
              original={
                generationImage
                  ? studioImageUrl(generationImage, asset.assets, tenantId)
                  : null
              }
              result={`/api/studio/assets/${variant}/file?tenant_id=${tenantId}`}
              disabled={locked}
              onOriginal={() => setIgnoredVariant(variant)}
              onUse={() => {
                if (generationImage) {
                  asset.register(
                    variant,
                    `/api/studio/assets/${variant}/file?tenant_id=${tenantId}`,
                    "generated",
                  );
                  if (
                    editor.scene.nodes.some((n) => n.id === generationImage.id)
                  )
                    editor.updateNode(generationImage.id, {
                      assetId: variant,
                      imageUrl: undefined,
                    });
                  else
                    editor.setScene({
                      ...editor.scene,
                      nodes: [
                        ...editor.scene.nodes,
                        {
                          ...generationImage,
                          id: crypto.randomUUID(),
                          assetId: variant,
                          imageUrl: undefined,
                        },
                      ],
                    });
                  setIgnoredVariant(variant);
                  void onRefresh();
                }
              }}
            />
          )}
          <div className="grid gap-4 lg:grid-cols-2">
            <section className="rounded-2xl border border-border bg-surface p-4">
              <StudioAiReviewPanel
                scene={editor.scene}
                tenantId={tenantId}
                enabled={Boolean(summary?.aiEnabled && editor.canEdit)}
                disabled={locked}
                prepareVersion={review}
                onApply={(finding) =>
                  editor.setScene(applyStudioFinding(editor.scene, finding))
                }
              />
            </section>
            <section className="space-y-3 rounded-2xl border border-border bg-surface p-4">
              <h3 className="text-sm font-bold">Versiones guardadas</h3>
              <button
                className={adminActionButtonSecondary}
                disabled={locked}
                onClick={() =>
                  void output
                    .prepare()
                    .then(() => onRefresh())
                    .catch(() => {})
                }
              >
                <Save className="h-4 w-4" />
                Guardar versión
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
                  Las versiones se crean al preparar una exportación o un
                  diagnóstico. Tu borrador se guarda automáticamente.
                </p>
              )}
            </section>
          </div>
          <div className="sticky bottom-0 z-20 flex flex-wrap items-center justify-between gap-3 border-t border-border bg-surface p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
            <p className="text-xs text-muted-foreground" role="status">
              {output.busy
                ? "Preparando exportación…"
                : asset.busy
                  ? "Guardando imagen…"
                  : editor.saveState === "saving"
                    ? "Guardando…"
                    : editor.saveState === "saved"
                      ? "Borrador guardado"
                      : editor.saveState === "error"
                        ? "Cambios conservados en este dispositivo"
                        : "Cambios locales"}
            </p>
            <div className="flex gap-2">
              <button
                className={adminActionButtonSecondary}
                disabled={locked}
                onClick={() => void editor.saveNow().catch(() => {})}
              >
                <Save className="h-4 w-4" />
                Guardar
              </button>
              <button
                className={adminActionButtonPrimary}
                disabled={output.busy || asset.busy}
                onClick={() => void next()}
              >
                <ArrowRight className="h-4 w-4" />
                {editor.canEdit ? "Revisar y compartir" : "Ver descargas"}
              </button>
            </div>
          </div>
        </>
      )}
      <FormSheet
        isOpen={Boolean(panel)}
        onClose={() => setPanel(null)}
        title={
          panel === "layers"
            ? "Capas del diseño"
            : panel === "assets"
              ? "Fotografías guardadas"
              : "Propiedades"
        }
      >
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
        <button
          className={`${adminActionButtonSecondary} my-4`}
          onClick={() => setPanel(null)}
        >
          <CheckIcon />
          Listo
        </button>
      </FormSheet>
      <StudioMembershipSheet
        open={membershipOpen || output.membershipRequired}
        onClose={() => {
          setMembershipOpen(false);
          output.clearMembershipRequired();
        }}
      />
      <StudioGenerationSheet ai={ai} />
      <ConfirmDialog
        isOpen={Boolean(restoreId)}
        onClose={() => setRestoreId(null)}
        title="Recuperar esta composición"
        description="El borrador actual quedará disponible mediante Deshacer. Revisa los datos del catálogo antes de compartir."
        onConfirm={() => {
          const version = detail.versions.find((v) => v.id === restoreId);
          if (version) editor.setScene(version.scene_json);
          setRestoreId(null);
        }}
        confirmLabel="Recuperar composición"
      />
      <ConfirmDialog
        isOpen={discardOpen}
        onClose={() => setDiscardOpen(false)}
        title="Conserva tu borrador antes de salir"
        description="Guarda los cambios antes de abrir la biblioteca. Si hay un conflicto, tu composición local se conserva."
        confirmLabel="Guardar y salir"
        onConfirm={async () => {
          try {
            await editor.saveNow();
            window.location.assign(`/dashboard/${tenantSlug}/studio/disenos`);
          } catch {
            setDiscardOpen(false);
          }
        }}
      />
    </div>
  );
}
function CheckIcon() {
  return <ArrowRight className="h-4 w-4" />;
}
