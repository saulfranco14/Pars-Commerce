export const MAX_IMAGE_SIZE_MB = 12;
export const MAX_IMAGE_SIZE_BYTES = MAX_IMAGE_SIZE_MB * 1024 * 1024;

export function validateImageSize(file: File): string | null {
  if (file.size > MAX_IMAGE_SIZE_BYTES) {
    return `La imagen es demasiado grande (máximo ${MAX_IMAGE_SIZE_MB} MB).`;
  }
  return null;
}

export function handleUploadError(
  err: any,
  fallbackMessage: string = "Error al subir la imagen. Por favor, intenta de nuevo."
): string {
  console.error("Upload error:", err);
  const errorStr = (err?.message || "").toLowerCase();
  
  if (
    errorStr.includes("size") ||
    errorStr.includes("large") ||
    errorStr.includes("body exceeds")
  ) {
    return `La imagen es demasiado grande (máximo ${MAX_IMAGE_SIZE_MB} MB).`;
  }
  
  if (
    errorStr.includes("mime") ||
    errorStr.includes("type") ||
    errorStr.includes("format")
  ) {
    return "Formato de imagen no válido. Usa JPG, PNG, GIF o WebP.";
  }
  
  return fallbackMessage;
}
