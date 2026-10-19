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

export function solutionPreviewUrl(path: string): string {
  const base = (process.env.NEXT_PUBLIC_APP_URL ?? "https://tlaco.mx").replace(/\/$/, "");
  return `${base}/soluciones/${path}#recorrido`;
}
