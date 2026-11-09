"use client";
import Image from "next/image";
import { Check, Download, Image as ImageIcon } from "lucide-react";
import {
  adminActionButtonSecondary,
  adminActionButtonPrimary,
} from "@/components/admin/actionButtonClasses";
export function StudioVariantCompare({
  original,
  result,
  onOriginal,
  onUse,
  disabled,
}: {
  original: string | null;
  result: string;
  onOriginal: () => void;
  onUse: () => void;
  disabled: boolean;
}) {
  return (
    <section className="space-y-3 rounded-2xl border border-border bg-surface p-4">
      <h3 className="font-bold">Compara antes de elegir</h3>
      <div className="grid grid-cols-2 gap-3">
        {[
          { label: "Fotografía anterior", url: original },
          { label: "Propuesta IA", url: result },
        ].map((image) => (
          <div key={image.label}>
            <p className="mb-2 text-xs font-medium text-muted-foreground">
              {image.label}
            </p>
            <div className="relative aspect-square overflow-hidden rounded-xl bg-border-soft">
              {image.url ? (
                <Image
                  src={image.url}
                  alt={image.label}
                  fill
                  unoptimized
                  className="object-contain"
                />
              ) : (
                <ImageIcon className="m-auto h-8 w-8" />
              )}
            </div>
          </div>
        ))}
      </div>
      <p className="text-xs leading-5 text-muted-foreground">
        Comprueba que forma, color y características coincidan con lo que
        vendes. Usar una variante cambia la imagen de esta composición, sin
        reemplazar el catálogo.
      </p>
      <div className="flex flex-wrap gap-2">
        <a
          href={result}
          download="variante"
          className={adminActionButtonSecondary}
        >
          <Download className="h-4 w-4" />
          Descargar variante
        </a>
        <button
          className={adminActionButtonSecondary}
          onClick={onOriginal}
          disabled={disabled}
        >
          <ImageIcon className="h-4 w-4" />
          Conservar anterior
        </button>
        <button
          className={adminActionButtonPrimary}
          onClick={onUse}
          disabled={disabled}
        >
          <Check className="h-4 w-4" />
          Usar propuesta
        </button>
      </div>
    </section>
  );
}
