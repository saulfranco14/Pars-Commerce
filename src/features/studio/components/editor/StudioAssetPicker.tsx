import Image from "next/image";
import { ImagePlus } from "lucide-react";
import { EmptyState } from "@/components/admin/EmptyState";
import type { StudioAsset } from "../../interfaces/studio";

export function StudioAssetPicker({
  assets,
  disabled,
  onSelect,
}: {
  assets: StudioAsset[];
  disabled: boolean;
  onSelect: (id: string) => void;
}) {
  const images = assets.filter(
    (asset) =>
      asset.status === "ready" &&
      ["original", "generated"].includes(asset.kind),
  );
  return images.length ? (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {images.map((asset) => (
        <button
          key={asset.id}
          disabled={disabled}
          onClick={() => onSelect(asset.id)}
          className="min-h-11 overflow-hidden rounded-xl border border-border bg-surface text-left focus-visible:ring-2 focus-visible:ring-accent"
        >
          <div className="relative aspect-square">
            {asset.url && (
              <Image
                src={asset.url}
                alt={
                  asset.kind === "generated"
                    ? "Variante creada con IA"
                    : "Fotografía original guardada"
                }
                fill
                unoptimized
                sizes="200px"
                className="object-contain"
              />
            )}
          </div>
          <p className="p-3 text-xs font-semibold">
            {asset.kind === "generated" ? "Variante IA" : "Original"} · Usar
            imagen
          </p>
        </button>
      ))}
    </div>
  ) : (
    <EmptyState
      icon={ImagePlus}
      title="Conserva aquí tus fotografías"
      description="Las imágenes que subas y las variantes de IA seguirán disponibles para este diseño."
    />
  );
}
