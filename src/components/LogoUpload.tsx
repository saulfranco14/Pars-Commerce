"use client";

import { useState, useRef } from "react";

interface LogoUploadProps {
  tenantId: string;
  currentUrl: string | null;
  onUploaded: (url: string | null) => void;
  disabled?: boolean;
  saving?: boolean;
  saveError?: string | null;
}

export function LogoUpload({
  tenantId,
  currentUrl,
  onUploaded,
  disabled,
  saving,
  saveError,
}: LogoUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imageKey, setImageKey] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setUploading(true);
    try {
      const { uploadTenantLogo } = await import("@/lib/supabase/storage");
      const url = await uploadTenantLogo(file, tenantId);
      setImageKey((k) => k + 1);
      onUploaded(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al subir");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  function handleRemove() {
    onUploaded(null);
    setError(null);
    setImageKey((k) => k + 1);
  }

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-muted-foreground">
        Logo del negocio
      </label>
      <p className="text-xs text-muted-foreground">
        Se usa en tickets y en tu sitio web. Se guarda automáticamente.
      </p>
      {saveError && (
        <p className="text-sm text-red-600" role="alert">{saveError}</p>
      )}
      {currentUrl && (
        <div className="flex items-center gap-3">
          <img
            key={imageKey}
            src={`${currentUrl}${currentUrl.includes("?") ? "&" : "?"}v=${imageKey}`}
            alt="Logo"
            className="h-16 w-16 rounded border border-border object-contain"
          />
          <button
            type="button"
            onClick={handleRemove}
            disabled={disabled || uploading || saving}
            className="text-sm text-muted-foreground underline hover:text-foreground disabled:opacity-50"
          >
            Quitar logo
          </button>
        </div>
      )}
      <div className="flex items-center gap-2">
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/gif,image/webp"
          onChange={handleFile}
          disabled={disabled || uploading || saving}
          className="block w-full text-sm text-muted file:mr-2 file:rounded file:border-0 file:bg-border-soft file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-muted-foreground hover:file:bg-border"
        />
      </div>
      {(uploading || saving) && (
        <p className="text-xs text-muted">
          {uploading ? "Subiendo…" : "Guardando…"}
        </p>
      )}
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
