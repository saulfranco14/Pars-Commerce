import { GIRO_COPY, GIRO_KEYS } from "@/features/growth/constants/giroCopy";
import { CSV_IMPORT_MAX_ROWS } from "@/features/growth/constants/denue";
import { normalizeLead, parseCsvLine } from "@/features/growth/helpers/normalizeLead";

import type { DenueRecord, ImportCursor } from "@/features/growth/interfaces/importJob";
import type { LeadImportRow, LeadSourceDetail, NewLeadInput } from "@/features/growth/interfaces/lead";

/** Case-insensitive field read: the DENUE API is not consistent between methods. */
export function denueField(record: DenueRecord, ...names: string[]): string {
  for (const name of names) {
    const key = Object.keys(record).find((candidate) => candidate.toLowerCase() === name.toLowerCase());
    const value = key ? record[key] : null;
    if (value !== null && value !== undefined && String(value).trim()) return String(value).trim();
  }
  return "";
}

/** A DENUE API record in the shape of prospectos_oriente.csv, so the same normalizer and dedup apply. */
export function denueToLead(record: DenueRecord, cursor: Pick<ImportCursor, "giro" | "clase" | "municipio">): LeadImportRow | null {
  const street = [denueField(record, "Tipo_vialidad"), denueField(record, "Calle"), denueField(record, "Num_Exterior")].filter(Boolean).join(" ");
  return normalizeLead({
    denue_id: denueField(record, "Id", "CLEE"),
    negocio: denueField(record, "Nombre"),
    razon_social: denueField(record, "Razon_social"),
    giro: cursor.giro,
    codigo_act: cursor.clase,
    actividad: denueField(record, "Clase_actividad"),
    personal: denueField(record, "Estrato"),
    direccion: street,
    colonia: denueField(record, "Colonia"),
    cp: denueField(record, "CP"),
    municipio: cursor.municipio,
    telefono: denueField(record, "Telefono"),
    correo: denueField(record, "Correo_e"),
    web: denueField(record, "Sitio_internet"),
    lat: denueField(record, "Latitud"),
    lng: denueField(record, "Longitud"),
  });
}

const HEADER_ALIASES: Record<keyof Omit<NewLeadInput, "source_detail">, string[]> = {
  business_name: ["negocio", "nombre", "nombre del negocio", "empresa"],
  phone: ["telefono", "teléfono", "celular", "whatsapp", "tel"],
  email: ["correo", "email", "e-mail", "mail"],
  giro: ["giro", "rubro", "tipo"],
  municipio: ["municipio", "ciudad"],
  colonia: ["colonia", "barrio"],
  note: ["nota", "notas", "comentario"],
};

function giroKey(value: string): string | null {
  const clean = value.trim().toLowerCase();
  if (GIRO_COPY[clean]) return clean;
  return GIRO_KEYS.find((key) => GIRO_COPY[key].label.toLowerCase() === clean) ?? null;
}

/** Reads a person's own list (any column order, Spanish headers) into «Nuevo prospecto» inputs. */
export function parseLeadCsv(text: string): { rows: Array<{ row: number; input: NewLeadInput }>; problems: Array<{ row: number; reason: string }> } {
  const lines = text.replace(/^﻿/, "").split(/\r?\n/).filter((line) => line.trim());
  if (!lines.length) return { rows: [], problems: [{ row: 1, reason: "El archivo está vacío." }] };
  const header = parseCsvLine(lines[0]).map((cell) => cell.trim().toLowerCase());
  const column = (field: keyof typeof HEADER_ALIASES) => header.findIndex((cell) => HEADER_ALIASES[field].includes(cell));
  const index = Object.fromEntries((Object.keys(HEADER_ALIASES) as Array<keyof typeof HEADER_ALIASES>).map((field) => [field, column(field)])) as Record<keyof typeof HEADER_ALIASES, number>;
  if (index.business_name < 0) return { rows: [], problems: [{ row: 1, reason: "Falta la columna «negocio»." }] };
  if (index.phone < 0 && index.email < 0) return { rows: [], problems: [{ row: 1, reason: "Falta la columna «telefono» o «correo»." }] };

  const rows: Array<{ row: number; input: NewLeadInput }> = [];
  const problems: Array<{ row: number; reason: string }> = [];
  for (const [offset, line] of lines.slice(1, CSV_IMPORT_MAX_ROWS + 1).entries()) {
    const cells = parseCsvLine(line);
    const cell = (field: keyof typeof HEADER_ALIASES) => (index[field] >= 0 ? cells[index[field]]?.trim() ?? "" : "");
    const giro = giroKey(cell("giro"));
    const row = offset + 2;
    if (!cell("business_name")) problems.push({ row, reason: "Sin nombre del negocio." });
    else if (!giro) problems.push({ row, reason: `Giro desconocido: «${cell("giro") || "vacío"}».` });
    else if (!cell("municipio")) problems.push({ row, reason: "Sin municipio." });
    else {
      rows.push({
        row,
        input: {
          business_name: cell("business_name"),
          phone: cell("phone"),
          email: cell("email"),
          giro,
          municipio: cell("municipio"),
          colonia: cell("colonia"),
          source_detail: "otro" satisfies LeadSourceDetail,
          note: cell("note"),
        },
      });
    }
  }
  return { rows, problems };
}
