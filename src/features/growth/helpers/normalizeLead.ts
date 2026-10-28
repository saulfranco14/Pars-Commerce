import { GIRO_COPY } from "@/features/growth/constants/giroCopy";
import { normalizeMexicanPhone } from "@/lib/phone";

import type { LeadImportRow } from "@/features/growth/interfaces/lead";

const EMAIL = /^[^@\s]+@[^@\s]+\.[a-z]{2,}$/i;

function text(value: string | undefined, max = 160): string | null {
  const clean = value?.replace(/\s+/g, " ").trim();
  return clean ? clean.slice(0, max) : null;
}

function coordinate(value: string | undefined): number | null {
  const parsed = Number(value);
  return value && Number.isFinite(parsed) ? parsed : null;
}

/** Maps one row of prospectos_oriente.csv to the payload of growth_upsert_leads; null skips it. */
export function normalizeLead(row: Record<string, string>): LeadImportRow | null {
  const denueId = text(row.denue_id, 40);
  const name = text(row.negocio);
  const giro = text(row.giro, 40);
  const municipio = text(row.municipio, 80);
  if (!denueId || !name || !giro || !municipio || !GIRO_COPY[giro]) return null;

  const email = text(row.correo, 120)?.toLowerCase() ?? null;
  return {
    denue_id: denueId,
    business_name: name,
    legal_name: text(row.razon_social),
    giro,
    catalog_template_key: giro,
    activity: text(row.actividad),
    staff_range: text(row.personal, 40),
    municipio,
    colonia: text(row.colonia, 120),
    address: text(row.direccion),
    postal_code: text(row.cp, 10),
    lat: coordinate(row.lat),
    lng: coordinate(row.lng),
    phone_e164: row.telefono ? normalizeMexicanPhone(row.telefono) : null,
    email: email && EMAIL.test(email) ? email : null,
    website: text(row.web, 200),
    source: "denue",
    source_detail: text(row.codigo_act, 20),
  };
}

/** Minimal RFC 4180 line parser (quoted fields, doubled quotes). */
export function parseCsvLine(line: string): string[] {
  const out: string[] = [];
  let current = "";
  let quoted = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (quoted) {
      if (char === '"' && line[i + 1] === '"') { current += '"'; i++; }
      else if (char === '"') quoted = false;
      else current += char;
    } else if (char === '"') quoted = true;
    else if (char === ",") { out.push(current); current = ""; }
    else current += char;
  }
  out.push(current);
  return out;
}
