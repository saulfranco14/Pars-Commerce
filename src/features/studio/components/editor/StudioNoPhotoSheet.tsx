"use client";
import { useRef } from "react";
import { Camera, ImageOff, Sparkles, Type } from "lucide-react";
import { FormSheet } from "@/components/ui/FormSheet";
import { StudioShareTile } from "./StudioShareTile";
import type { StudioNoPhotoSheetProps } from "../../interfaces/ui";

/**
 * No photo: take one, let the AI illustrate a service, or go with text. Goods
 * never get an invented picture: the ad would show something that is not sold.
 */
export function StudioNoPhotoSheet({
  open,
  onClose,
  disabled,
  name,
  canIllustrate,
  aiOn,
  onCamera,
  onScene,
  onText,
}: StudioNoPhotoSheetProps) {
  const input = useRef<HTMLInputElement>(null);
  return (
    <FormSheet
      isOpen={open}
      onClose={onClose}
      title={`${name} no tiene foto`}
      description="Elige cómo quieres tu anuncio. Mientras tanto ya está listo con texto."
      icon={ImageOff}
    >
      <div className="space-y-3 pb-3">
        <div className="grid grid-cols-2 gap-3">
          <StudioShareTile
            icon={Camera}
            title="Tomar foto"
            detail={
              aiOn
                ? "Con tu cámara; la IA la deja lista · 1 Tlaco"
                : "Con tu cámara; se guarda en tu catálogo"
            }
            disabled={disabled}
            onClick={() => input.current?.click()}
          />
          {canIllustrate && (
            <StudioShareTile
              icon={Sparkles}
              title="Escena con IA"
              detail="La IA muestra el servicio · 1 Tlaco"
              disabled={disabled}
              onClick={onScene}
            />
          )}
          <StudioShareTile
            icon={Type}
            title="Solo texto"
            detail="Gratis y al momento"
            disabled={disabled}
            onClick={onText}
          />
        </div>
        <p className="text-xs leading-5 text-muted-foreground">
          {canIllustrate
            ? "La escena es ilustrativa: muestra el servicio, no tu local."
            : "Es un producto: la IA no inventa cómo se ve. Necesita tu foto, o va solo con texto."}
        </p>
        <input
          ref={input}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          capture="environment"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            e.target.value = "";
            if (file) onCamera(file);
          }}
        />
      </div>
    </FormSheet>
  );
}
