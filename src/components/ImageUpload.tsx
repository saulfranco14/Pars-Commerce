"use client";

import { useState, useRef } from "react";

interface ImageUploadProps {
  tenantId: string;
  productId?: string;
  promotionId?: string;
  variant?: "product" | "promotion";
  currentUrl: string | null;
  onUploaded: (url: string) => void;
  disabled?: boolean;
  label?: string;
}

export function ImageUpload({
  tenantId,
  productId,
  promotionId,
  variant = "product",
  currentUrl,
  onUploaded,
  disabled,
  label = "Imagen del producto",
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setUploading(true);
    try {
      if (variant === "promotion") {
        const { uploadPromotionImage } = await import("@/lib/supabase/storage");
        const url = await uploadPromotionImage(file, tenantId, promotionId || undefined);
        onUploaded(url);
      } else {
        const { uploadProductImage } = await import("@/lib/supabase/storage");
        const url = await uploadProductImage(file, tenantId, productId || undefined);
        onUploaded(url);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al subir la imagen");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  const displayUrl = currentUrl || null;

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-muted-foreground">
        {label}
      </label>
      {displayUrl && (
        <img
          src={displayUrl}
          alt="Vista previa"
          className="h-24 w-24 rounded border border-border object-cover"
        />
      )}
      <div className="flex items-center gap-2">
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/gif,image/webp"
          onChange={handleFile}
          disabled={disabled || uploading}
          className="block w-full text-sm text-muted file:mr-2 file:rounded file:border-0 file:bg-border-soft file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-muted-foreground hover:file:bg-border"
        />
      </div>
      {uploading && <p className="text-xs text-muted">Subiendo imagen...</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
