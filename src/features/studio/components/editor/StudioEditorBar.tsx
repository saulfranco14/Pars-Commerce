"use client";
import { ArrowRight, Download, Save } from "lucide-react";
import {
  actionPair,
  adminActionButtonPrimary,
  adminActionButtonSecondary,
} from "@/components/admin/actionButtonClasses";
import type { StudioEditorBarProps } from "../../interfaces/ui";

export function StudioEditorBar({
  status,
  canEdit,
  saveDisabled,
  nextDisabled,
  onSave,
  onNext,
}: StudioEditorBarProps) {
  return (
    <div className="sticky bottom-0 z-20 space-y-2 border-t border-border bg-surface p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:flex sm:items-center sm:justify-between sm:gap-3 sm:space-y-0">
      <p className="text-xs text-muted-foreground" role="status">
        {status}
      </p>
      {canEdit ? (
        <div className={actionPair}>
          <button
            type="button"
            className={adminActionButtonSecondary}
            disabled={saveDisabled}
            onClick={onSave}
          >
            <Save className="h-4 w-4" />
            Guardar
          </button>
          <button
            type="button"
            className={adminActionButtonPrimary}
            disabled={nextDisabled}
            onClick={onNext}
          >
            <ArrowRight className="h-4 w-4" />
            Compartir
          </button>
        </div>
      ) : (
        <button
          type="button"
          className={`${adminActionButtonPrimary} w-full sm:w-auto`}
          disabled={nextDisabled}
          onClick={onNext}
        >
          <Download className="h-4 w-4" />
          Descargas
        </button>
      )}
    </div>
  );
}
