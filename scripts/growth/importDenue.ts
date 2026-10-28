/**
 * Loads prospectos_oriente.csv into growth_leads through growth_upsert_leads.
 * Idempotent (dedup by DENUE id, phone and email). Run --dry-run first:
 *   npx tsx --env-file=.env.local scripts/growth/importDenue.ts data/growth/prospectos_oriente.csv --dry-run
 * Options: --limit N, --municipio "Chimalhuacán".
 */
import { readFileSync } from "node:fs";

import { createClient } from "@supabase/supabase-js";

import { normalizeLead, parseCsvLine } from "@/features/growth/helpers/normalizeLead";

import type { LeadImportRow } from "@/features/growth/interfaces/lead";

const BATCH = 1000;

function option(name: string): string | undefined {
  const index = process.argv.indexOf(name);
  return index > -1 ? process.argv[index + 1] : undefined;
}

async function main() {
  const file = process.argv[2];
  if (!file || file.startsWith("--")) throw new Error("Uso: importDenue.ts <archivo.csv> [--dry-run] [--limit N] [--municipio X]");
  const dryRun = process.argv.includes("--dry-run");
  const limit = Number(option("--limit") ?? Infinity);
  const municipio = option("--municipio");

  const lines = readFileSync(file, "utf8").replace(/^﻿/, "").split(/\r?\n/).filter(Boolean);
  const header = parseCsvLine(lines[0]);
  const rows: LeadImportRow[] = [];
  let skipped = 0;
  for (const line of lines.slice(1)) {
    const values = parseCsvLine(line);
    const lead = normalizeLead(Object.fromEntries(header.map((key, index) => [key, values[index] ?? ""])));
    if (!lead || (municipio && lead.municipio !== municipio)) {
      skipped++;
      continue;
    }
    rows.push(lead);
    if (rows.length >= limit) break;
  }

  const byMunicipio = rows.reduce<Record<string, number>>((acc, row) => ({ ...acc, [row.municipio]: (acc[row.municipio] ?? 0) + 1 }), {});
  console.log(`Filas válidas: ${rows.length} · omitidas: ${skipped}`);
  console.log(byMunicipio);
  if (dryRun) {
    console.log("Modo prueba: no se escribió nada.");
    return;
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY.");
  const supabase = createClient(url, key, { auth: { persistSession: false } });
  console.log(`Escribiendo en ${new URL(url).host}…`);

  const totals = { inserted: 0, updated: 0, merged: 0 };
  for (let start = 0; start < rows.length; start += BATCH) {
    const { data, error } = await supabase.rpc("growth_upsert_leads" as never, { p_rows: rows.slice(start, start + BATCH) } as never);
    if (error) throw new Error(`Lote ${start / BATCH + 1}: ${error.message}`);
    const result = (Array.isArray(data) ? data[0] : data) as { inserted: number; updated: number; merged_contacts: number };
    totals.inserted += result.inserted;
    totals.updated += result.updated;
    totals.merged += result.merged_contacts;
    console.log(`${Math.min(start + BATCH, rows.length)}/${rows.length}`);
  }
  console.log(`Listo · nuevos ${totals.inserted} · actualizados ${totals.updated} · contactos repetidos unidos ${totals.merged}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
