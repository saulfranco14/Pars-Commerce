"use client";

import { useState, useRef, useImperativeHandle, forwardRef } from "react";
import Image from "next/image";
import { X, Plus, Loader2 } from "lucide-react";
import { validateImageSize, handleUploadError } from "@/lib/uploadUtils";

// Pending file entry: holds the File and a local object URL for preview
interface PendingFile {
  file: File;
  previewUrl: string;
}

export interface MultiImageUploadRef {
  /** Upload all pending files to the bucket using the real productId, returns uploaded URLs */
  uploadPendingFiles: (productId: string) => Promise<string[]>;
  hasPendingFiles: () => boolean;
}

interface MultiImageUploadProps {
  tenantId: string;
  /** When provided (edit mode), files are uploaded immediately on selection.
   *  When omitted (create mode), files are staged locally until uploadPendingFiles is called. */
  productId?: string;
  urls: string[];
  onChange: (urls: string[]) => void;
  onRemove?: (newUrls: string[]) => Promise<void>;
  max?: number;
  disabled?: boolean;
}

export const MultiImageUpload = forwardRef<MultiImageUploadRef, MultiImageUploadProps>(
  function MultiImageUpload(
    { tenantId, productId, urls, onChange, onRemove, max = 8, disabled },
    ref
  ) {
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    // Pending files only used in create mode (no productId)
    const [pendingFiles, setPendingFiles] = useState<PendingFile[]>([]);

    useImperativeHandle(ref, () => ({
      async uploadPendingFiles(realProductId: string): Promise<string[]> {
        if (pendingFiles.length === 0) return [];
        const { uploadProductImage } = await import("@/lib/supabase/storage");
        const uploadedUrls: string[] = [];
        for (const { file, previewUrl } of pendingFiles) {
          const url = await uploadProductImage(file, tenantId, realProductId + "-" + uploadedUrls.length);
          uploadedUrls.push(url);
          URL.revokeObjectURL(previewUrl);
        }
        setPendingFiles([]);
        return uploadedUrls;
      },
      hasPendingFiles(): boolean {
        return pendingFiles.length > 0;
      },
    }));

    async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
      const file = e.target.files?.[0];
      const totalCount = urls.length + pendingFiles.length;
      if (!file || totalCount >= max) return;

      const sizeError = validateImageSize(file);
      if (sizeError) {
        setError(sizeError);
        if (inputRef.current) inputRef.current.value = "";
        return;
      }

      setError(null);

      // Create mode: stage file locally without uploading
      if (!productId) {
        const previewUrl = URL.createObjectURL(file);
        setPendingFiles((prev) => [...prev, { file, previewUrl }]);
        if (inputRef.current) inputRef.current.value = "";
        return;
      }

      // Edit mode: upload immediately
      setUploading(true);
      try {
        const { uploadProductImage } = await import("@/lib/supabase/storage");
        const url = await uploadProductImage(file, tenantId, productId);
        onChange([...urls, url]);
      } catch (err: unknown) {
        setError(handleUploadError(err));
      } finally {
        setUploading(false);
        if (inputRef.current) inputRef.current.value = "";
      }
    }

    async function removeAt(index: number) {
      // Check if it's a pending file (create mode)
      if (index >= urls.length) {
        const pendingIndex = index - urls.length;
        const pending = pendingFiles[pendingIndex];
        URL.revokeObjectURL(pending.previewUrl);
        setPendingFiles((prev) => prev.filter((_, i) => i !== pendingIndex));
        return;
      }

      const urlToRemove = urls[index];
      const newUrls = urls.filter((_, i) => i !== index);
      onChange(newUrls);
      try {
        const { deleteFileByUrl } = await import("@/lib/supabase/storage");
        await deleteFileByUrl(urlToRemove);
      } catch {
        // Silently ignore deletion errors — the URL is already removed from state
      }
      if (onRemove) {
        try {
          await onRemove(newUrls);
        } catch {
          // Persist error is non-blocking — UI already updated
        }
      }
    }

    // Combine persisted URLs and pending preview URLs for rendering
    const allItems: { src: string; isPending: boolean }[] = [
      ...urls.map((url) => ({ src: url, isPending: false })),
      ...pendingFiles.map((p) => ({ src: p.previewUrl, isPending: true })),
    ];
    const isEmpty = allItems.length === 0;

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
          {allItems.map(({ src, isPending }, i) => (
            <div
              key={`${src}-${i}`}
              className="group relative h-20 w-20 shrink-0 overflow-hidden rounded-xl border border-border bg-background sm:h-24 sm:w-24"
            >
              <Image
                src={src}
                alt={`Imagen del producto ${i + 1}`}
                width={96}
                height={96}
                className="h-full w-full object-cover"
                unoptimized={isPending}
              />
              {i === 0 && (
                <span className="absolute left-2 top-2 rounded bg-accent px-1.5 py-0.5 text-[10px] font-medium text-accent-foreground">
                  Principal
                </span>
              )}
              {isPending && (
                <span className="absolute bottom-1 right-1 rounded bg-black/50 px-1 py-0.5 text-[9px] text-white">
                  Pendiente
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
          {allItems.length < max && (
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
                <Loader2
                  className="h-6 w-6 shrink-0 animate-spin text-muted-foreground"
                  aria-hidden
                />
              ) : (
                <Plus
                  className="h-6 w-6 shrink-0 text-muted-foreground"
                  aria-hidden
                />
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
);
