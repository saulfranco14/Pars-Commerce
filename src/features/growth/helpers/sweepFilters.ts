import type { SweepFilters } from "@/features/growth/interfaces/sweep";

/** The sweep's kind and zone live in the URL, like the prospects list, so a reload resumes the same sweep. */
export function parseSweepFilters(params: Pick<URLSearchParams, "get">): SweepFilters {
  return {
    kind: params.get("tipo") === "seguimiento" ? "seguimiento" : "whatsapp",
    municipio: params.get("municipio")?.slice(0, 80) || undefined,
    giro: params.get("giro")?.slice(0, 40) || undefined,
  };
}

export function sweepFiltersQuery(filters: SweepFilters): string {
  const query = new URLSearchParams();
  if (filters.kind === "seguimiento") query.set("tipo", "seguimiento");
  if (filters.municipio) query.set("municipio", filters.municipio);
  if (filters.giro) query.set("giro", filters.giro);
  return query.toString();
}
