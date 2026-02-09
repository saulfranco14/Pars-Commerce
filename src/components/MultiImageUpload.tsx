"use client";

import { useState, useRef } from "react";
import { X } from "lucide-react";

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

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-zinc-700">
        Imágenes del producto
      </label>
      <p className="text-xs text-zinc-500">
        Puedes agregar varias imágenes (máximo {max}). La primera se usa como
        principal.
      </p>
      <div className="flex flex-wrap gap-3">
        {urls.map((url, i) => (
          <div
            key={`${url}-${i}`}
            className="relative inline-block rounded-lg border border-zinc-200 bg-zinc-50"
          >
            <img
              src={url}
              alt=""
              className="h-20 w-20 rounded-lg object-cover sm:h-24 sm:w-24"
            />
            {!disabled && (
              <button
                type="button"
                onClick={() => removeAt(i)}
                className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-white hover:bg-red-600"
                aria-label="Quitar imagen"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
        ))}
        {urls.length < max && (
          <label className="flex h-20 w-20 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-zinc-300 bg-zinc-50 text-zinc-500 hover:border-zinc-400 hover:bg-zinc-100 sm:h-24 sm:w-24">
            <input
              ref={inputRef}
              type="file"
              accept="image/jpeg,image/png,image/gif,image/webp"
              onChange={handleFile}
              disabled={disabled || uploading}
              className="hidden"
            />
            <span className="text-xs">{uploading ? "..." : "+"}</span>
          </label>
        )}
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
