"use client";
import { ArrowRight, Copy, Redo2, Sparkles, Undo2, X } from "lucide-react";
import { useStudioContext } from "../StudioProvider";
import { Notification } from "@/components/ui/Notification";
import {
  actionPair,
  adminActionButtonIcon,
  adminActionButtonSecondary,
} from "@/components/admin/actionButtonClasses";
import type { StudioEditorNoticesProps } from "../../interfaces/ui";

export function StudioEditorNotices({
  editor,
  designId,
  stale,
  locked,
  errors,
  onRefresh,
  onMembership,
}: StudioEditorNoticesProps) {
  const { tenantSlug, summary } = useStudioContext(),
    canCreate = summary?.permissions.includes("studio.create");
  return (
    <>
      {summary &&
        !summary.active &&
        canCreate &&
        (summary.freeExportDesignId &&
        summary.freeExportDesignId !== designId ? (
          <Notification
            tone="info"
            message={
              <div className="space-y-3">
                <p>
                  Puedes seguir diseñando sin límite. Ya usaste tu descarga
                  gratis con otro anuncio; para compartir este, activa tu
                  membresía.
                </p>
                <button
                  type="button"
                  className={`${adminActionButtonSecondary} w-full sm:w-auto`}
                  onClick={onMembership}
                >
                  <Sparkles className="h-4 w-4" />
                  Membresías
                </button>
              </div>
            }
          />
        ) : (
          <Notification
            tone="success"
            title="Tu primera descarga es gratis"
            message="Este anuncio lo descargas y compartes sin costo. Es tu regalo de bienvenida."
          />
        ))}
      {editor.conflict && (
        <Notification
          tone="warning"
          title="Hay cambios en otra pestaña"
          message={
            <div className={`mt-2 ${actionPair}`}>
              <button
                type="button"
                className={adminActionButtonSecondary}
                onClick={editor.reloadFromServer}
              >
                <Redo2 className="h-4 w-4" />
                Recargar
              </button>
              <button
                type="button"
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
                <Copy className="h-4 w-4" />
                {editor.copying ? "Copiando…" : "Duplicar"}
              </button>
            </div>
          }
        />
      )}
      {stale && (
        <Notification
          tone="warning"
          title="El catálogo cambió"
          message={
            <div className="space-y-2">
              <p>
                Revisa precios, vigencia y fotos antes de compartir. La versión
                anterior se conserva.
              </p>
              {editor.canEdit && (
                <button
                  type="button"
                  className={`${adminActionButtonSecondary} w-full sm:w-auto`}
                  onClick={() =>
                    void editor
                      .refreshSource()
                      .then(() => onRefresh())
                      .catch((e) => editor.setError(e.message))
                  }
                >
                  <ArrowRight className="h-4 w-4" />
                  Actualizar
                </button>
              )}
            </div>
          }
        />
      )}
      {editor.recovery && (
        <Notification
          tone="info"
          message={
            <div className="flex items-center gap-3">
              <span className="min-w-0 flex-1">
                Encontramos cambios sin guardar en este dispositivo.
              </span>
              <button
                type="button"
                className={adminActionButtonSecondary}
                disabled={locked}
                onClick={editor.recover}
              >
                <Undo2 className="h-4 w-4" />
                Recuperar
              </button>
              <button
                type="button"
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
      {errors.filter(Boolean).map((error, i) => (
        <Notification key={`${i}:${error}`} tone="error" message={error} />
      ))}
    </>
  );
}
