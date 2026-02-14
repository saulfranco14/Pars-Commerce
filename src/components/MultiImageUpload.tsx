"use client";

import { useState, useRef } from "react";
import { X, Plus, Loader2 } from "lucide-react";

interface MultiImageUploadProps {
  tenantId: string;
  productId?: string;
  urls: string[];
  onChange: (urls: string[]) => void;
  max?: number;
  disabled?: boolean;
}

export function MultiImageUpload({
  tenantId,
  productId,
  urls,
  onChange,
  max = 8,
  disabled,
}: MultiImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || urls.length >= max) return;
    setError(null);
    setUploading(true);
    try {
      const { uploadProductImage } = await import("@/lib/supabase/storage");
      const url = await uploadProductImage(file, tenantId, productId);
      onChange([...urls, url]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al subir la imagen");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  function removeAt(index: number) {
    onChange(urls.filter((_, i) => i !== index));
  }

  const isEmpty = urls.length === 0;

  return (
    <div className="space-y-3">
      <div>
        <h3 className="text-sm font-semibold text-foreground">
          Imágenes del producto
        </h3>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Máximo {max}. La primera es la principal.
        </p>
      </div>
      <div className="flex flex-wrap items-start gap-3">
        {urls.map((url, i) => (
          <div
            key={`${url}-${i}`}
            className="group relative h-20 w-20 shrink-0 overflow-hidden rounded-xl border border-border bg-background sm:h-24 sm:w-24"
          >
            <img
              src={url}
              alt={`Imagen del producto ${i + 1}`}
              className="h-full w-full object-cover"
            />
            {i === 0 && (
              <span className="absolute left-2 top-2 rounded bg-accent px-1.5 py-0.5 text-[10px] font-medium text-accent-foreground">
                Principal
              </span>
            )}
            {!disabled && (
              <button
                type="button"
                onClick={() => removeAt(i)}
                className="absolute right-2 top-2 flex min-h-[36px] min-w-[36px] cursor-pointer items-center justify-center rounded-lg bg-red-500/90 text-white opacity-0 transition-opacity duration-200 group-hover:opacity-100 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 hover:bg-red-600"
                aria-label="Quitar imagen"
              >
                <X className="h-4 w-4" aria-hidden />
              </button>
            )}
          </div>
        ))}
        {urls.length < max && (
          <label
            className={`flex cursor-pointer flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed transition-colors duration-200 focus-within:border-accent focus-within:ring-2 focus-within:ring-accent/20 focus-within:ring-offset-2 ${
              isEmpty
                ? "h-24 w-24 shrink-0 border-border bg-border-soft/30 hover:border-accent/60 hover:bg-accent/5"
                : "h-20 w-20 shrink-0 border-border bg-border-soft/20 hover:border-accent/50 hover:bg-border-soft sm:h-24 sm:w-24"
            }`}
          >
            <input
              ref={inputRef}
              type="file"
              accept="image/jpeg,image/png,image/gif,image/webp"
              onChange={handleFile}
              disabled={disabled || uploading}
              className="sr-only"
              aria-label="Agregar imagen del producto"
            />
            {uploading ? (
              <Loader2 className="h-6 w-6 shrink-0 animate-spin text-muted-foreground" aria-hidden />
            ) : (
              <Plus className="h-6 w-6 shrink-0 text-muted-foreground" aria-hidden />
            )}
            <span className="text-[11px] font-medium text-muted-foreground leading-tight">
              {uploading ? "Subiendo…" : "Agregar"}
            </span>
          </label>
        )}
      </div>
      {error && (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
