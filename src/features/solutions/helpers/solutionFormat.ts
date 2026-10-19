import { PRODUCTION_APP_URL } from "@/lib/env/appUrl";

import type { CatalogItemDefinition } from "@/features/catalog/catalogDefinitions";

/** Pesos sin centavos: los precios de ejemplo del recorrido son redondos. */
export function formatPeso(value: number): string {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    maximumFractionDigits: 0,
  }).format(value);
}

export function catalogItemKey(item: CatalogItemDefinition): string {
  return `${item.type}:${item.name}`;
}

/** Siempre producción: el QR se escanea con un celular, que no llega a localhost ni a previews. */
export function solutionPreviewUrl(path: string): string {
  return `${PRODUCTION_APP_URL}/soluciones/${path}#recorrido`;
}
