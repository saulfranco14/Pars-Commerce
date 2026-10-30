/** SCIAN classes behind each Tlaco giro, taken from the DENUE rows already imported. */
export const GIRO_SCIAN: Record<string, string[]> = {
  tienda: ["461110"],
  materiales: ["467111", "467112", "467113", "467114", "467116"],
  ropa: ["463211", "463212", "463213", "463214", "463215", "463216", "463217", "463218"],
  taqueria: ["722514"],
  cafeteria: ["722515"],
  panaderia: ["311812"],
  mascotas: ["465911"],
  tenis: ["463310"],
  veterinaria: ["541941"],
  "deposito-cerveza": ["461212"],
  autolavado: ["811192"],
};

/** INEGI keys (state 15 + municipio) the import screen offers; add more as the team grows. */
export const DENUE_MUNICIPIOS: Array<{ code: string; name: string }> = [
  { code: "15031", name: "Chimalhuacán" },
  { code: "15058", name: "Nezahualcóyotl" },
  { code: "15033", name: "Ecatepec de Morelos" },
  { code: "15039", name: "Ixtapaluca" },
  { code: "15070", name: "La Paz" },
  { code: "15099", name: "Texcoco" },
  { code: "15122", name: "Valle de Chalco Solidaridad" },
];

/** Records per DENUE request. */
export const DENUE_PAGE = 1000;
/** Rows a CSV import may carry. */
export const CSV_IMPORT_MAX_ROWS = 2000;
