"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useStudioAi } from "../../hooks/useStudioAi";
import { useStudioAssets } from "../../hooks/useStudioAssets";
import { useStudioEditor } from "../../hooks/useStudioEditor";
import { useStudioOutput } from "../../hooks/useStudioOutput";
import { useStudioContext } from "../StudioProvider";
import { PageHeader } from "@/components/admin/PageHeader";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { FilterTabs } from "@/components/ui/FilterTabs";
import { Toast } from "@/components/ui/Toast";
import { StudioMembershipSheet } from "../StudioMembershipSheet";
import { StudioStepper } from "../StudioStepper";
import { StudioAdvancedEditor } from "./StudioAdvancedEditor";
import { StudioAiProgress } from "./StudioAiProgress";
import { StudioEditorBar } from "./StudioEditorBar";
import { StudioEditorNotices } from "./StudioEditorNotices";
import { StudioGenerationSheet } from "./StudioGenerationSheet";
import { StudioQuickEditor } from "./StudioQuickEditor";
import { StudioShareStep } from "./StudioShareStep";
import { adminActionButtonSecondary } from "@/components/admin/actionButtonClasses";
import { STUDIO_ACTION_BAR_SPACE } from "../../constants/studio";
import { studioCatalogHref, studioRechargeHref } from "../../helpers/entry";
import { studioTagline, suggestStudioCopy } from "../../helpers/sceneStyle";
import type { StudioEditorProps, StudioStep } from "../../interfaces/ui";

const MODES = [
  { value: "simple", label: "Fácil" },
  { value: "advanced", label: "A mano" },
] as const;

export default function StudioEditorWorkspace({
  detail,
  onRefresh,
  initialReview = false,
}: StudioEditorProps) {
  const { tenantId, tenantSlug, summary } = useStudioContext(),
    editor = useStudioEditor(detail),
    asset = useStudioAssets(detail, editor.scene, editor.setScene),
    [step, setStep] = useState<StudioStep>(2),
    [mode, setMode] = useState<"simple" | "advanced">("simple"),
    [discardOpen, setDiscardOpen] = useState(false),
    [membershipOpen, setMembershipOpen] = useState(false);
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
  const locked = !editor.canEdit || output.busy || asset.busy || editor.copying;
  editor.interactionLock.current = output.busy || asset.busy || editor.copying;
  const designPath = `/dashboard/${tenantSlug}/studio/disenos/${detail.design.id}`,
    parts = { editor, asset, ai, tenantId, locked };

  function suggestCopy() {
    if (editor.canEdit && !editor.copy.trim())
      editor.setCopy(
        suggestStudioCopy(editor.source.current, studioTagline(editor.scene)),
      );
  }
  async function next() {
    if (!editor.canEdit) {
      setStep(3);
      return;
    }
    suggestCopy();
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
  const status = output.busy
    ? "Preparando tu imagen…"
    : asset.busy
      ? "Guardando imagen…"
      : editor.saveState === "saving"
        ? "Guardando…"
        : editor.saveState === "saved"
          ? "Borrador guardado"
          : editor.saveState === "error"
            ? "Cambios guardados en este dispositivo"
            : "Cambios sin guardar";

  return (
    <div className={`space-y-5 ${step === 2 ? STUDIO_ACTION_BAR_SPACE : ""}`}>
      <PageHeader
        title={editor.title}
        description={
          !editor.canEdit
            ? summary?.permissions.includes("studio.create")
              ? "Consulta tu diseño y descarga tus archivos. Para editar necesitas Studio vigente."
              : "Consulta el diseño y sus descargas. El propietario puede darte permiso para editar."
            : step === 3
              ? "Elige dónde compartirlo. El mensaje ya va escrito."
              : "Elige un diseño y ajústalo. No gasta Tlacos."
        }
        action={
          <Link
            className={`${adminActionButtonSecondary} w-full sm:w-auto`}
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
      <StudioStepper step={step} onStep={setStep} />
      <StudioEditorNotices
        editor={editor}
        designId={detail.design.id}
        stale={detail.stale}
        locked={locked}
        errors={[
          editor.error,
          asset.error,
          ai.error,
          step === 2 ? output.error : null,
        ]}
        onRefresh={onRefresh}
        onMembership={() => setMembershipOpen(true)}
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
          {editor.canEdit && (
            <FilterTabs
              tabs={MODES}
              activeValue={mode}
              onTabChange={(value) => setMode(value as typeof mode)}
              ariaLabel="Forma de editar"
              density="touch"
            />
          )}
          {mode === "simple" ? (
            <StudioQuickEditor
              {...parts}
              catalogHref={studioCatalogHref(editor.source.current, tenantSlug)}
              rechargeHref={studioRechargeHref(tenantSlug, designPath)}
            />
          ) : (
            <StudioAdvancedEditor
              {...parts}
              detail={detail}
              output={output}
              onRefresh={onRefresh}
            />
          )}
          <StudioAiProgress {...parts} onRefresh={onRefresh} />
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
        open={membershipOpen || output.membershipRequired}
        onClose={() => {
          setMembershipOpen(false);
          output.clearMembershipRequired();
        }}
      />
      <StudioGenerationSheet ai={ai} />
      {output.success && (
        <Toast
          message={output.success}
          onDone={() => output.setSuccess(null)}
        />
      )}
      <ConfirmDialog
        isOpen={discardOpen}
        onClose={() => setDiscardOpen(false)}
        title="Guarda antes de salir"
        description="Guardamos tus cambios y te llevamos a la biblioteca. Si hay un conflicto, tu diseño se conserva en este dispositivo."
        confirmLabel="Guardar"
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
