"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useStudioAssets } from "../../hooks/useStudioAssets";
import { useStudioEditor } from "../../hooks/useStudioEditor";
import { useStudioOutput } from "../../hooks/useStudioOutput";
import { useStudioStaleRefresh } from "../../hooks/useStudioStaleRefresh";
import { useStudioContext } from "../StudioProvider";
import { PageHeader } from "@/components/admin/PageHeader";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Toast } from "@/components/ui/Toast";
import { StudioMembershipSheet } from "../StudioMembershipSheet";
import { StudioStepper } from "../StudioStepper";
import { StudioAdvancedEditor } from "./StudioAdvancedEditor";
import { StudioEditorBar } from "./StudioEditorBar";
import { StudioEditorNotices } from "./StudioEditorNotices";
import { StudioPosterEditor } from "./StudioPosterEditor";
import { StudioAdView } from "./StudioAdView";
import { StudioShareStep } from "./StudioShareStep";
import { adminActionButtonIcon } from "@/components/admin/actionButtonClasses";
import { STUDIO_ACTION_BAR_SPACE } from "../../constants/studio";
import { studioCatalogHref, studioRechargeHref } from "../../helpers/entry";
import { reviewStudioScene } from "../../helpers/scene";
import { reusableStudioVersion } from "../../helpers/adState";
import { studioTagline, suggestStudioCopy } from "../../helpers/sceneStyle";
import type { StudioEditorProps, StudioStep } from "../../interfaces/ui";

export default function StudioEditorWorkspace({
  detail,
  onRefresh,
  initialReview = false,
  autoAi = false,
}: StudioEditorProps) {
  const { tenantId, tenantSlug } = useStudioContext(),
    editor = useStudioEditor(detail),
    asset = useStudioAssets(detail, editor.scene, editor.setScene),
    [step, setStep] = useState<StudioStep>(2),
    [mode, setMode] = useState<"simple" | "advanced">("simple"),
    /** The short path shows the finished ad; the step editor is "A mano". */
    [quick, setQuick] = useState(!initialReview),
    [discardOpen, setDiscardOpen] = useState(false);
  const output = useStudioOutput({
    tenantId,
    designId: detail.design.id,
    scene: editor.scene,
    assets: asset.assets,
    revision: editor.revision,
    saveNow: editor.saveNow,
    resync: editor.resync,
    title: editor.title,
    copy: editor.copy,
    destination: editor.destination,
  });
  const fresh = useStudioStaleRefresh(detail, editor, tenantId, onRefresh),
    [reusable] = useState(() =>
      fresh.updating ? null : reusableStudioVersion(detail),
    );
  const locked = !editor.canEdit || output.busy || asset.busy || editor.copying;
  editor.interactionLock.current = output.busy || asset.busy || editor.copying;
  const designPath = `/dashboard/${tenantSlug}/studio/disenos/${detail.design.id}`,
    library = `/dashboard/${tenantSlug}/studio/disenos`,
    parts = { editor, asset, tenantId, locked };

  async function next() {
    if (!editor.canEdit) {
      setStep(3);
      return;
    }
    if (!editor.copy.trim())
      editor.setCopy(
        suggestStudioCopy(editor.source.current, studioTagline(editor.scene)),
      );
    try {
      await output.prepare();
      setStep(3);
    } catch {
      /* The output hook shows the error. */
    }
  }
  const quickStarted = useRef(false);
  useEffect(() => {
    if (initialReview && editor.canEdit && !quickStarted.current) {
      quickStarted.current = true;
      void next();
    }
  });
  const home = `/dashboard/${tenantSlug}/studio`;
  const toast = output.success && (
    <Toast message={output.success} onDone={() => output.setSuccess(null)} />
  );
  const discard = (
    <ConfirmDialog
      isOpen={discardOpen}
      onClose={() => setDiscardOpen(false)}
      title="Guarda antes de salir"
      description="Guardamos tus cambios y te llevamos a Studio. Si hay un conflicto, tu diseño se conserva en este dispositivo."
      confirmLabel="Guardar"
      onConfirm={async () => {
        try {
          await editor.saveNow();
          window.location.assign(quick ? home : library);
        } catch {
          setDiscardOpen(false);
        }
      }}
    />
  );
  const findings = reviewStudioScene(editor.scene),
    saveText = output.busy
      ? "Preparando tu imagen…"
      : asset.busy
        ? "Guardando foto…"
        : editor.saveState === "saving"
          ? "Guardando…"
          : editor.saveState === "saved"
            ? "Borrador guardado"
            : editor.saveState === "error"
              ? "Guardado en este dispositivo"
              : "Cambios sin guardar",
    status = `${saveText} · ${findings.length ? "Revisa los textos largos" : "Se lee bien"}`;

  if (quick && editor.canEdit)
    return (
      <div className="space-y-3">
        <PageHeader
          compact
          title={editor.title}
          action={
            <Link
              className={adminActionButtonIcon}
              aria-label="Volver a Studio"
              href={home}
              onClick={(e) => {
                if (editor.saveState !== "saved") {
                  e.preventDefault();
                  setDiscardOpen(true);
                }
              }}
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
          }
        />
        <StudioEditorNotices
          editor={editor}
          stale={detail.stale && !fresh.updating}
          updating={fresh.updating}
          locked={locked}
          errors={[editor.error, asset.error]}
          onRefresh={onRefresh}
        />
        <StudioAdView
          {...parts}
          designId={detail.design.id}
          output={output}
          autoAi={autoAi}
          saveText={saveText}
          reusable={reusable}
          lastSharedAt={detail.lastSharedAt}
          updating={fresh.updating}
          onByHand={() => {
            setMode("simple");
            setQuick(false);
          }}
        />
        {discard}
        {toast}
        <StudioMembershipSheet
          open={output.membershipRequired}
          onClose={output.clearMembershipRequired}
        />
      </div>
    );
  return (
    <div className={`space-y-3 ${step === 2 ? STUDIO_ACTION_BAR_SPACE : ""}`}>
      <PageHeader
        compact
        title={editor.title}
        action={
          <div className="flex items-center gap-2">
            <StudioStepper compact step={step} onStep={setStep} />
            <Link
              className={adminActionButtonIcon}
              aria-label={
                editor.canEdit ? "Volver al anuncio" : "Volver a la biblioteca"
              }
              href={library}
              onClick={(e) => {
                if (editor.canEdit) {
                  e.preventDefault();
                  setStep(2);
                  setQuick(true);
                } else if (editor.saveState !== "saved") {
                  e.preventDefault();
                  setDiscardOpen(true);
                }
              }}
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </div>
        }
      />
      <StudioEditorNotices
        editor={editor}
        stale={detail.stale && !fresh.updating}
        locked={locked}
        errors={[editor.error, asset.error, step === 2 ? output.error : null]}
        onRefresh={onRefresh}
      />
      {step === 3 ? (
        <StudioShareStep
          output={output}
          editor={editor}
          assets={asset.assets}
          designId={detail.design.id}
          readOnly={!editor.canEdit}
          onBack={() => setStep(2)}
        />
      ) : (
        <>
          {mode === "simple" ? (
            <StudioPosterEditor
              {...parts}
              designId={detail.design.id}
              catalogHref={studioCatalogHref(editor.source.current, tenantSlug)}
              rechargeHref={studioRechargeHref(tenantSlug, designPath)}
              onAdvanced={() => setMode("advanced")}
            />
          ) : (
            <StudioAdvancedEditor
              {...parts}
              detail={detail}
              output={output}
              onRefresh={onRefresh}
              onSimple={() => setMode("simple")}
            />
          )}
          <StudioEditorBar
            status={status}
            canEdit={editor.canEdit}
            saveDisabled={locked}
            nextDisabled={output.busy || asset.busy}
            onSave={() => void editor.saveNow().catch(() => {})}
            onNext={() => void next()}
          />
        </>
      )}
      <StudioMembershipSheet
        open={output.membershipRequired}
        onClose={output.clearMembershipRequired}
      />
      {toast}
      {discard}
    </div>
  );
}
