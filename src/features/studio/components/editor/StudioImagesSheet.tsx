"use client";
import { Images } from "lucide-react";
import { FormSheet } from "@/components/ui/FormSheet";
import { StudioImageTile } from "./StudioImageStrip";
import type { StudioImagesSheetProps } from "../../interfaces/ui";

export function StudioImagesSheet({
  open,
  onClose,
  disabled,
  tiles,
}: StudioImagesSheetProps) {
  return (
    <FormSheet
      isOpen={open}
      onClose={onClose}
      title="Tus imágenes"
      description="Las de este producto y las de tus otros anuncios. Usarlas aquí es gratis."
      icon={Images}
    >
      <div className="grid grid-cols-3 gap-3 pb-4 sm:grid-cols-4">
        {tiles.map((tile) => (
          <StudioImageTile
            key={tile.key}
            tile={{
              ...tile,
              onPick: () => {
                tile.onPick();
                onClose();
              },
            }}
            disabled={disabled}
            size="aspect-square w-full"
          />
        ))}
      </div>
    </FormSheet>
  );
}
