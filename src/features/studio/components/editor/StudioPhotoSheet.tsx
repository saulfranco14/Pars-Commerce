"use client";
import { Check, Image as ImageIcon, ImagePlus, Upload } from "lucide-react";
import { FormSheet } from "@/components/ui/FormSheet";
import {
  actionPair,
  adminActionButtonPrimary,
  adminActionButtonSecondary,
} from "@/components/admin/actionButtonClasses";
import type { StudioPhotoSheetProps } from "../../interfaces/ui";

const ACCEPT = "image/jpeg,image/png,image/webp";

export function StudioPhotoSheet({
  open,
  onClose,
  disabled,
  onUpload,
}: StudioPhotoSheetProps) {
  const upload = (kind: "image" | "logo", label: string) => (
    <label
      className={`${adminActionButtonSecondary} ${disabled ? "pointer-events-none opacity-60" : ""}`}
    >
      {kind === "logo" ? (
        <ImagePlus className="h-4 w-4" />
      ) : (
        <Upload className="h-4 w-4" />
      )}
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
      title="Tu foto"
      description="La IA usa la foto de tu producto para hacer tus imágenes. Entre más clara, mejor sale."
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
      <div className="space-y-4 pb-3">
        <div className={actionPair}>
          {upload("image", "Foto")}
          {upload("logo", "Logo")}
        </div>
        <p className="text-xs leading-5 text-muted-foreground">
          La foto nueva se usa en este anuncio y para las imágenes que generes.
          El logo va arriba a la derecha.
        </p>
      </div>
    </FormSheet>
  );
}
