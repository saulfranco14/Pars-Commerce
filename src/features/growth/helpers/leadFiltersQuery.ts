import type { LeadContactFilter, LeadFilters, LeadStageFilter, NextChannel } from "@/features/growth/interfaces/lead";

const STAGES: LeadStageFilter[] = ["activos", "todos", "en_lote", "nuevo", "contactado", "conversando", "caliente", "registrado", "sin_respuesta", "descartado", "sin_contacto"];
const CHANNELS: NextChannel[] = ["whatsapp", "visita", "correo", "ninguno"];
const CONTACTS: LeadContactFilter[] = ["whatsapp", "correo", "ambos", "sin"];
const DEFAULT_STAGE: LeadStageFilter = "activos";

function pick<T extends string>(allowed: readonly T[], value: string | null): T | undefined {
  return allowed.find((item) => item === value);
}

/** Filters live in the URL so the list survives opening a prospect, a reload or the back button. */
export function parseLeadFilters(params: Pick<URLSearchParams, "get">): LeadFilters {
  const page = Number(params.get("page"));
  return {
    stage: pick(STAGES, params.get("stage")) ?? DEFAULT_STAGE,
    municipio: params.get("municipio")?.slice(0, 80) || undefined,
    giro: params.get("giro")?.slice(0, 40) || undefined,
    channel: pick(CHANNELS, params.get("channel")),
    contact: pick(CONTACTS, params.get("contact")),
    q: params.get("q")?.slice(0, 60) || undefined,
    page: Number.isInteger(page) && page > 1 ? page : 1,
  };
}

/** Only non-default values, so the plain list keeps a clean URL. */
export function leadFiltersQuery(filters: LeadFilters): string {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    if (value === undefined || value === "" || (key === "stage" && value === DEFAULT_STAGE) || (key === "page" && value === 1)) continue;
    query.set(key, String(value));
  }
  return query.toString();
}
