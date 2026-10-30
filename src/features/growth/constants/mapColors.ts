import type { LeadStage } from "@/features/growth/interfaces/lead";

/** Validated for color blindness on a light map (dataviz validate_palette). */
export const MAP_SERIES = ["#2f7ae5", "#b97818", "#7c5cd6", "#13976a"];
export const MAP_NEUTRAL = "#94a3b8";

export const STAGE_MAP_GROUP: Record<LeadStage, { label: string; color: string }> = {
  nuevo: { label: "Sin contactar", color: MAP_NEUTRAL },
  sin_contacto: { label: "Sin contactar", color: MAP_NEUTRAL },
  contactado: { label: "Contactado", color: MAP_SERIES[0] },
  caliente: { label: "Vio su tienda", color: MAP_SERIES[1] },
  conversando: { label: "Respondió o cita", color: MAP_SERIES[2] },
  cita: { label: "Respondió o cita", color: MAP_SERIES[2] },
  registrado: { label: "Registrado", color: MAP_SERIES[3] },
  sin_respuesta: { label: "Sin respuesta o baja", color: "#cbd5e1" },
  descartado: { label: "Sin respuesta o baja", color: "#cbd5e1" },
};

/** Map tiles with streets and labels; free with attribution. */
export const MAP_TILES = {
  url: "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
};
