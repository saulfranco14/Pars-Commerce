import type { MenuItem } from "@/features/qr/interfaces/tableCart";

/**
 * Foto que representa a una categoría en la barra de navegación: la primera de
 * sus productos que tenga una. Sin fotos devuelve `null` y el chip cae al
 * fallback de marca de <BrandImage>.
 */
export function sectionThumbnail(products: MenuItem[]): string | null {
  return products.find((p) => p.image_url)?.image_url ?? null;
}
