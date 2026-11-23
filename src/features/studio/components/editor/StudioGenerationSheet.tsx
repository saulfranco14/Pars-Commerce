"use client";
import Link from "next/link";
import { useStudioContext } from "../StudioProvider";
import { Sparkles } from "lucide-react";
import { FormSheet } from "@/components/ui/FormSheet";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { FormTextarea } from "@/components/ui/FormTextarea";
import { Notification } from "@/components/ui/Notification";
import { adminActionButtonAi } from "@/components/admin/actionButtonClasses";
import { StudioOptions } from "../StudioOptions";
import type { useStudioAi } from "../../hooks/useStudioAi";

export function StudioGenerationSheet({
  ai,
}: {
  ai: ReturnType<typeof useStudioAi>;
}) {
  const { tenantSlug, summary } = useStudioContext();
  return (
    <>
      <FormSheet
        isOpen={ai.open}
        onClose={() => ai.setOpen(false)}
        title="Una nueva propuesta con IA"
        description="La fotografía original y tus capas se conservan. Revisa el producto antes de compartir."
        icon={Sparkles}
      >
        <form
          onSubmit={ai.form.handleSubmit(ai.form.submit)}
          className="space-y-5 pb-3"
        >
          <StudioOptions
            label="Qué quieres hacer"
            value={ai.form.watch("operation")}
            options={[
              { value: "improve_photo", label: "Mejorar foto" },
              { value: "style", label: "Otro estilo" },
              { value: "variation", label: "Crear variante" },
            ]}
            onChange={(v) => ai.form.setValue("operation", v)}
          />
          <StudioOptions
            label="Calidad"
            value={ai.form.watch("quality")}
            options={[
              { value: "economy", label: "Económica · 1 Tlaco" },
              { value: "premium", label: "Premium · 2 Tlacos" },
            ]}
            onChange={(v) => ai.form.setValue("quality", v)}
          />
          <FormTextarea
            maxLength={1000}
            label="Describe la propuesta"
            {...ai.form.register("instructions")}
            error={ai.form.errors.instructions?.message}
          />
          <p className="text-xs text-muted-foreground">
            Saldo disponible: {summary?.balance.available ?? 0} Tlacos.{" "}
            <Link
              href={`/dashboard/${tenantSlug}/studio/tlacos?return_to=${encodeURIComponent(typeof window !== "undefined" ? window.location.pathname : "")}`}
              className="font-semibold text-accent underline"
            >
              Ver recargas
            </Link>
          </p>
          {ai.error && <Notification tone="error" message={ai.error} />}
          {ai.form.submitError && (
            <Notification tone="error" message={ai.form.submitError} />
          )}
          <p className="text-xs leading-5 text-muted-foreground">
            La IA puede modificar detalles visuales. Para conservar exactamente
            tu fotografía, continúa con la foto intacta y cambia la plantilla o
            el fondo manualmente.
          </p>
          <button
            disabled={ai.form.submitting}
            className={`${adminActionButtonAi} w-full`}
          >
            <Sparkles className="h-4 w-4" />
            {ai.form.submitting ? "Cotizando…" : "Cotizar"}
          </button>
        </form>
      </FormSheet>
      <ConfirmDialog
        isOpen={Boolean(ai.quote)}
        onClose={() => ai.setQuote(null)}
        onConfirm={ai.confirm}
        title={`Esta generación cuesta ${ai.quote?.cost ?? 0} ${ai.quote?.cost === 1 ? "Tlaco" : "Tlacos"}`}
        description="Reservaremos el saldo al confirmar. Se consume cuando la imagen está lista; un fallo definitivo libera la reserva."
        confirmLabel="Crear"
        loading={ai.busy}
        icon={Sparkles}
      />
    </>
  );
}
