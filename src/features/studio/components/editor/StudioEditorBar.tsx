"use client";
import { ArrowRight, Download, Save } from "lucide-react";
import { StudioActionBar } from "../StudioActionBar";
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
    <StudioActionBar status={status}>
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
          className={`${adminActionButtonPrimary} w-full md:w-auto`}
          disabled={nextDisabled}
          onClick={onNext}
        >
          <Download className="h-4 w-4" />
          Descargas
        </button>
      )}
    </StudioActionBar>
  );
}
