"use client";
import { ArrowRight, Copy, Redo2, Undo2, X } from "lucide-react";
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
  stale,
  locked,
  errors,
  onRefresh,
}: StudioEditorNoticesProps) {
  const { tenantSlug } = useStudioContext();
  return (
    <>
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
