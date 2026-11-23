"use client";
import { Check, Image as ImageIcon, Sparkles, Upload } from "lucide-react";
import { FormSheet } from "@/components/ui/FormSheet";
import { StudioAssetPicker } from "./StudioAssetPicker";
import {
  adminActionButtonAi,
  adminActionButtonPrimary,
  adminActionButtonSecondary,
  actionPair,
} from "@/components/admin/actionButtonClasses";
import type { StudioPhotoSheetProps } from "../../interfaces/ui";

const ACCEPT = "image/jpeg,image/png,image/webp";

export function StudioPhotoSheet({
  open,
  onClose,
  disabled,
  assets,
  aiAvailable,
  onUpload,
  onSelect,
  onImprove,
}: StudioPhotoSheetProps) {
  const upload = (kind: "image" | "logo", label: string) => (
    <label
      className={`${adminActionButtonSecondary} ${disabled ? "pointer-events-none opacity-60" : ""}`}
    >
      <Upload className="h-4 w-4" />
      {label}
      <input
        className="sr-only"
        aria-label={kind === "logo" ? "Subir logo" : "Subir foto"}
        type="file"
        accept={ACCEPT}
        disabled={disabled}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onUpload(file, kind);
          e.target.value = "";
        }}
      />
    </label>
  );
  return (
    <FormSheet
      isOpen={open}
      onClose={onClose}
      title="Foto y logo"
      icon={ImageIcon}
      footer={
        <button
          type="button"
          onClick={onClose}
          className={`${adminActionButtonPrimary} w-full`}
        >
          <Check className="h-4 w-4" />
          Listo
        </button>
      }
    >
      <div className="space-y-6 pb-3">
        <section className="space-y-3">
          <p className="text-sm leading-6 text-muted-foreground">
            Una foto clara y con luz se nota más que cualquier adorno.
          </p>
          <div className={actionPair}>
            {upload("image", "Subir")}
            <button
              type="button"
              disabled={disabled || !aiAvailable}
              onClick={onImprove}
              className={adminActionButtonAi}
            >
              <Sparkles className="h-4 w-4" />
              Mejorar
            </button>
          </div>
          <StudioAssetPicker
            assets={assets}
            disabled={disabled}
            onSelect={onSelect}
          />
        </section>
        <section className="space-y-3">
          <h3 className="text-sm font-bold">Logo</h3>
          <p className="text-xs leading-5 text-muted-foreground">
            Va en la esquina para que te reconozcan. Usa PNG con fondo
            transparente si lo tienes.
          </p>
          <div className="grid">{upload("logo", "Subir logo")}</div>
        </section>
      </div>
    </FormSheet>
  );
}
